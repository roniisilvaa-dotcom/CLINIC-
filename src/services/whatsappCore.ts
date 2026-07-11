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
import { eq } from "drizzle-orm";
import {
    processarMensagem,
    formatarNotificacaoDra,
    formatarSolicitacaoPix,
    formatarConfirmacaoAgendamento,
    VALOR_SINAL,
    MensagemConversa,
} from "./iaSecretaria.js";

const PAUSA_HANDOFF_MS = 60 * 60 * 1000;

export const sessions = new Map<string, {
    historico: MensagemConversa[];
    dadosColeta: Record<string, any>;
    aguardandoPagamento?: boolean;
    pausadaAte?: number;
    pausaManual?: boolean;
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

async function ensurePaciente(telefone: string, args: Record<string, any>) {
    try {
        const pacienteId = `wpp_${telefone}`;
        await db.insert(pacientes).values({
            id: pacienteId,
            nome: args.nome_paciente || "Paciente WhatsApp",
            idade: 0,
            dataNascimento: "Nao informado",
            cpf: args.cpf || `sem-cpf-${telefone}`,
            telefone,
            email: args.email || `${telefone}@whatsapp.placeholder`,
            cidade: args.cidade || "Nao informado",
            comoConheceu: "WhatsApp",
            queixaPrincipal: args.procedimento || "Agendamento via WhatsApp",
            status: "Agendado via WhatsApp",
            ultimaAtualizacao: new Date().toISOString(),
            antecedentes: {},
            diagnostico: {},
            protocolo: {},
        }).onConflictDoNothing({ target: pacientes.id });
    } catch (err) {
        console.error("Erro ao criar paciente via WhatsApp:", err);
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

        await ensurePaciente(telefone, args);

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
                    await enviarMensagem(telefone, confirmacao);
                    await salvarMensagem(telefone, "ia", confirmacao);
                    session.aguardandoPagamento = false;
                    session.historico = [];
          } else {
                    const aviso = "Recebi sua imagem! Pode me contar mais sobre o que você precisa? 💜";
                    await enviarMensagem(telefone, aviso);
                    await salvarMensagem(telefone, "ia", aviso);
          }
              continue;
      }

      if (!m.texto) continue;

      await salvarMensagem(telefone, "user", m.texto);

      if (iaEstaPausada(telefone)) {
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
                    const resposta2 = await processarMensagem(
                                `[Sistema] Resultado da agenda: ${resultado}`,
                                session.historico,
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
              await enviarMensagem(telefone, textoResposta);
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
