/**
 * Núcleo compartilhado de processamento de mensagens do WhatsApp — usado tanto pela
 * integração oficial (Meta Cloud API, ver src/routes/whatsapp.ts) quanto pela integração
 * via Evolution API (não-oficial, QR Code, ver src/routes/whatsappEvolution.ts).
 *
 * Mantém sessão em memória, lógica de agenda/agendamento e o loop de conversa com a IA
 * (Gemini + function calling) num único lugar, pra não duplicar regra de negócio entre
 * os dois transportes.
 */
import { db } from "../db/index.js";
import { conversasWhatsapp, agendaEventos, pacientes } from "../db/schema.js";
import { eq, and, gte } from "drizzle-orm";
import {
    processarMensagem,
    formatarNotificacaoDra,
    formatarSolicitacaoPix,
    formatarConfirmacaoAgendamento,
    VALOR_SINAL,
    MensagemConversa,
} from "./iaSecretaria.js";

const PAUSA_HANDOFF_MS = 60 * 60 * 1000;

// ─── Controle de custo: teto mensal de mensagens respondidas pela IA ────────────
// Protege contra custo de API descontrolado. Ao atingir o teto, a IA para de
// responder automaticamente e o atendimento é transferido pra Dra. Mariah (humano)
// até o próximo mês. Ajustável via env var sem precisar mexer no código.
const LIMITE_MENSAL_IA_WHATSAPP = Number(process.env.LIMITE_MENSAL_IA_WHATSAPP || 1500);

let cacheContagemIa: { mesAno: string; contagem: number; atualizadoEm: number } | null = null;

async function limiteMensalAtingido(): Promise<boolean> {
    const agora = new Date();
    const mesAno = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;

    // Só reconsulta o banco a cada 5 minutos (ou quando vira o mês) — evita bater
    // no Postgres a cada mensagem só pra saber se o teto foi atingido.
    if (!cacheContagemIa || cacheContagemIa.mesAno !== mesAno || Date.now() - cacheContagemIa.atualizadoEm > 5 * 60 * 1000) {
          try {
                  const inicioMes = `${mesAno}-01`;
                  const doMes = await db.select({ id: conversasWhatsapp.id }).from(conversasWhatsapp)
                    .where(and(eq(conversasWhatsapp.role, "ia"), gte(conversasWhatsapp.timestamp, inicioMes)));
                  cacheContagemIa = { mesAno, contagem: doMes.length, atualizadoEm: Date.now() };
          } catch {
                  // Se a consulta falhar, não bloqueia a IA (fail-open) — melhor um mês
                  // sem o teto funcionando do que travar o atendimento da clínica.
                  return false;
          }
    }
    return cacheContagemIa.contagem >= LIMITE_MENSAL_IA_WHATSAPP;
}

export const sessions = new Map<string, {
    historico: MensagemConversa[];
    dadosColeta: Record<string, any>;
    aguardandoPagamento?: boolean;
    pausadaAte?: number;
    pausaManual?: boolean;
    avisoLimiteEnviado?: boolean;
    updatedAt: number;
}>();

export function getSession(telefone: string) {
    if (!sessions.has(telefone)) {
          sessions.set(telefone, { historico: [], dadosColeta: {}, updatedAt: Date.now() });
    }
    return sessions.get(telefone)!;
}

export function iaEstaPausada(telefone: string): boolean {
    const s = sessions.get(telefone);
    if (!s) return false;
    if (s.pausaManual) return true;
    if (s.pausadaAte && Date.now() < s.pausadaAte) return true;
    return false;
}

// ─── Envio fracionado de mensagens ──────────────────────────────────────────
// A IA às vezes gera respostas longas (parágrafos inteiros), e receber isso como
// um único balão gigante no WhatsApp fica estranho e difícil de ler — não é como
// uma pessoa de verdade digita. Aqui a resposta é quebrada em pedaços menores
// (por parágrafo e, se ainda estiver grande, por frase) e enviada como vários
// balões curtos em sequência, com uma pequena pausa entre eles pra imitar o
// ritmo natural de digitação.
const LIMITE_CARACTERES_POR_BALAO = 280;

function dividirMensagem(texto: string): string[] {
    const blocos = texto.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    if (blocos.length === 0) return [texto];

    const partes: string[] = [];
    for (const bloco of blocos) {
          if (bloco.length <= LIMITE_CARACTERES_POR_BALAO) {
                  partes.push(bloco);
                  continue;
          }
          // Bloco grande demais pra um balão só: agrupa frase por frase até o limite.
          const frases = bloco.split(/(?<=[.!?])\s+/);
          let atual = "";
          for (const frase of frases) {
                    if (atual && (atual.length + frase.length + 1) > LIMITE_CARACTERES_POR_BALAO) {
                                partes.push(atual.trim());
                                atual = frase;
                    } else {
                                atual = atual ? `${atual} ${frase}` : frase;
                    }
          }
          if (atual.trim()) partes.push(atual.trim());
    }
    return partes.length ? partes : [texto];
}

async function enviarMensagemFracionada(
    telefone: string,
    texto: string,
    enviarMensagem: (telefone: string, mensagem: string) => Promise<boolean>,
  ): Promise<void> {
    const partes = dividirMensagem(texto);
    for (let i = 0; i < partes.length; i++) {
          await enviarMensagem(telefone, partes[i]);
          if (i < partes.length - 1) {
                  const pausa = 900 + Math.floor(Math.random() * 600);
                  await new Promise((resolve) => setTimeout(resolve, pausa));
          }
    }
}

async function checkAvailability(dataInicio: string, _dataFim?: string): Promise<string> {
    try {
          const hoje = new Date().toISOString().slice(0, 10);
          const inicio = dataInicio || hoje;
          const fim = _dataFim || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

      const eventos = await db.select().from(agendaEventos)
            .where(eq(agendaEventos.status, "Agendado"));

      const horariosBase = ["08:00", "09:30", "11:00", "13:30", "15:00", "16:30", "17:30"];
          const ocupados = new Set(eventos.map(e => `${e.data}_${e.horario}`));

      const disponiveis: string[] = [];
          const d = new Date(inicio + "T12:00:00");
          const dFim = new Date(fim + "T12:00:00");

      while (d <= dFim && disponiveis.length < 6) {
              const diaSemana = d.getDay();
              if (diaSemana !== 0 && diaSemana !== 6) {
                        const dataStr = d.toISOString().slice(0, 10);
                        for (const h of horariosBase) {
                                    if (!ocupados.has(`${dataStr}_${h}`)) {
                                                  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
                                                  disponiveis.push(`${diasSemana[diaSemana]} ${dataStr} às ${h}`);
                                                  if (disponiveis.length >= 4) break;
                                    }
                        }
              }
              d.setDate(d.getDate() + 1);
      }

      if (disponiveis.length === 0) return "Nenhum horário disponível neste período. Tente outra semana.";
          return `Horários disponíveis:\n${disponiveis.map((h, i) => `${i + 1}. ${h}`).join("\n")}`;
    } catch {
          return "Não consegui verificar a agenda agora. Tentarei em breve.";
    }
}

async function createAppointment(
    args: Record<string, any>,
    telefone: string,
    enviarMensagem: (telefone: string, mensagem: string) => Promise<boolean>,
  ): Promise<string> {
    try {
          const id = `wpp-${Date.now()}`;
          const horarioFim = (() => {
                  const [h, m] = args.horario.split(":").map(Number);
                  const totalMin = h * 60 + m + 90;
                  return `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
          })();

      await db.insert(agendaEventos).values({
              id,
              pacienteId: `wpp_${telefone}`,
              data: args.data,
              horario: args.horario,
              tipo: "Consulta",
              procedimentoTag: args.procedimento,
              duracaoMinutos: 90,
              status: "Agendado",
              diagnosticoResumo: args.observacao || `Agendado via WhatsApp. CPF: ${args.cpf}. Sinal de R$ ${VALOR_SINAL},00 pago via Pix.`,
      });

      const numDra = process.env.WHATSAPP_DRA || "";
          if (numDra) {
                  const notif = formatarNotificacaoDra({
                            nome: args.nome_paciente,
                            telefone: args.telefone || telefone,
                            cpf: args.cpf,
                            procedimento: args.procedimento,
                            data: args.data,
                            horario: args.horario,
                            horarioFim,
                            valorSinal: VALOR_SINAL,
                  });
                  await enviarMensagem(numDra, notif);
          }

      return `Agendamento criado! Data: ${args.data}, Horário: ${args.horario}`;
    } catch (err) {
          console.error("Erro criar agendamento:", err);
          return "Erro ao criar agendamento. Equipe notificada.";
    }
}

async function salvarMensagem(telefone: string, role: "user" | "ia", texto: string) {
    try {
          await db.insert(conversasWhatsapp).values({
                  id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  telefone,
                  role,
                  conteudo: texto,
                  timestamp: new Date().toISOString(),
          }).onConflictDoNothing();
    } catch {}
}

export interface MensagemGenerica {
    from: string;
    messageId: string;
    timestamp: string;
    texto?: string;
    tipo: string;
    pushName?: string;
    imagemId?: string;
    legendaImagem?: string;
}

export interface EcoGenerico {
    paraTelefone: string;
    timestamp: string;
}

export async function processarEventoWebhook(
    mensagens: MensagemGenerica[],
    ecos: EcoGenerico[],
    extrairTelefone: (from: string) => string,
    enviarMensagem: (telefone: string, mensagem: string) => Promise<boolean>,
  ): Promise<void> {
    for (const eco of ecos) {
          const session = getSession(eco.paraTelefone);
          session.pausadaAte = Date.now() + PAUSA_HANDOFF_MS;
          console.log(`IA pausada automaticamente para ${eco.paraTelefone} (resposta manual detectada)`);
    }

  for (const m of mensagens) {
        const telefone = extrairTelefone(m.from);
        const session = getSession(telefone);
        session.updatedAt = Date.now();

      if (m.tipo === "image") {
              await salvarMensagem(telefone, "user", "[imagem recebida]");

          if (iaEstaPausada(telefone)) continue;

          if (session.aguardandoPagamento && session.dadosColeta?.data && session.dadosColeta?.horario) {
                    await createAppointment(session.dadosColeta, telefone, enviarMensagem);
                    const confirmacao = formatarConfirmacaoAgendamento({
                                nome: session.dadosColeta.nome_paciente,
                                procedimento: session.dadosColeta.procedimento,
                                data: session.dadosColeta.data,
                                horario: session.dadosColeta.horario,
                    });
                    await enviarMensagemFracionada(telefone, confirmacao, enviarMensagem);
                    await salvarMensagem(telefone, "ia", confirmacao);
                    session.aguardandoPagamento = false;
                    session.historico = [];
          } else {
                    const aviso = "Recebi sua imagem! Pode me contar mais sobre o que você precisa? 💜";
                    await enviarMensagemFracionada(telefone, aviso, enviarMensagem);
                    await salvarMensagem(telefone, "ia", aviso);
          }
              continue;
      }

      if (!m.texto) continue;

      await salvarMensagem(telefone, "user", m.texto);

      if (iaEstaPausada(telefone)) {
              continue;
      }

      // Teto mensal de custo: se atingido, para de chamar a IA e transfere pro
      // atendimento humano da Dra. Mariah, avisando o paciente uma única vez.
      if (await limiteMensalAtingido()) {
              if (!session.avisoLimiteEnviado) {
                        const aviso = "No momento nossa assistente virtual atingiu o limite de atendimentos automáticos do mês. Nossa equipe vai te responder em breve! 💜";
                        await enviarMensagemFracionada(telefone, aviso, enviarMensagem);
                        await salvarMensagem(telefone, "ia", aviso);
                        session.avisoLimiteEnviado = true;
              }
              session.pausaManual = true;
              continue;
      }

      let contexto = "";
        try {
                const paciente = await db.select().from(pacientes)
                  .where(eq(pacientes.telefone, telefone)).limit(1);
                if (paciente[0]) {
                          contexto = `Paciente já cadastrada: ${paciente[0].nome}, diagnóstico: ${JSON.stringify(paciente[0].diagnostico)}, última atualização: ${paciente[0].ultimaAtualizacao}`;
                }
        } catch {}

      const resposta = await processarMensagem(m.texto, session.historico, contexto || undefined);
        let textoResposta = resposta.texto;

      if (resposta.functionCall) {
              const { name, args } = resposta.functionCall;

          if (name === "check_availability") {
                    const resultado = await checkAvailability(args.data_inicio, args.data_fim);
                    // BUG corrigido: essa segunda chamada usava session.historico "cru", que
                    // ainda NÃO tinha a mensagem atual do paciente nem o turno em que a IA
                    // decidiu checar a agenda — ou seja, a IA respondia "às cegas", sem saber
                    // o que o paciente realmente tinha acabado de pedir (data, nome, CPF etc).
                    // Isso fazia a Eduarda "esquecer" o que a pessoa disse e parecer não
                    // entender, mesmo com o paciente repetindo a mesma frase várias vezes.
                    // Agora incluímos o turno atual (mensagem do paciente + o "pensamento" da
                    // IA de checar a agenda) antes de perguntar de novo pro Claude.
                    const historicoComTurnoAtual: MensagemConversa[] = [
                              ...session.historico,
                              { role: "user", content: m.texto, timestamp: new Date().toISOString() },
                              { role: "model", content: "Deixa eu ver os horários disponíveis pra você.", timestamp: new Date().toISOString() },
                    ];
                    const resposta2 = await processarMensagem(
                                `[Sistema] Resultado da agenda: ${resultado}`,
                                historicoComTurnoAtual,
                                contexto || undefined
                              );
                    textoResposta = resposta2.texto || resultado;
                    Object.assign(session.dadosColeta, args);
          }

          else if (name === "solicitar_sinal_pix") {
                    Object.assign(session.dadosColeta, args, { telefone: args.telefone || telefone });
                    session.aguardandoPagamento = true;
                    textoResposta = formatarSolicitacaoPix(args.procedimento);
          }

          else if (name === "create_appointment") {
                    if (!session.aguardandoPagamento) {
                                Object.assign(session.dadosColeta, args);
                                session.aguardandoPagamento = true;
                                textoResposta = formatarSolicitacaoPix(args.procedimento || session.dadosColeta.procedimento || "consulta");
                    } else {
                                await createAppointment({ ...args, ...session.dadosColeta }, telefone, enviarMensagem);
                                textoResposta = formatarConfirmacaoAgendamento({
                                              nome: args.nome_paciente,
                                              procedimento: args.procedimento,
                                              data: args.data,
                                              horario: args.horario,
                                });
                                session.aguardandoPagamento = false;
                                session.historico = [];
                    }
          }

          else if (name === "transferir_atendimento_fatima_do_sul") {
                    textoResposta = "Vou encaminhar seu atendimento para a Dra. Mariah.";
                    session.pausaManual = true;
          }
      }

      session.historico.push({ role: "user", content: m.texto, timestamp: new Date().toISOString() });
        session.historico.push({ role: "model", content: textoResposta, timestamp: new Date().toISOString() });
        if (session.historico.length > 20) session.historico = session.historico.slice(-20);

      if (textoResposta) {
              await enviarMensagemFracionada(telefone, textoResposta, enviarMensagem);
              await salvarMensagem(telefone, "ia", textoResposta);
      }
  }
}

export async function criarAgendamentoDireto(
    dados: Record<string, any>,
    telefone: string,
    enviarMensagem: (telefone: string, mensagem: string) => Promise<boolean>,
  ): Promise<string> {
    return createAppointment(dados, telefone, enviarMensagem);
}
