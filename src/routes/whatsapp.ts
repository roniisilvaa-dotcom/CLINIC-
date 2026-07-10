/**
 * API Routes: IA Secretária WhatsApp (Meta Cloud API oficial)
 * GET  /api/whatsapp/webhook         — verificação do webhook (handshake da Meta)
 * POST /api/whatsapp/webhook         — recebe mensagens da Meta Cloud API
 * POST /api/whatsapp/payment-webhook — recebe confirmação de pagamento do Asaas
 * GET  /api/whatsapp/conversas       — lista conversas (painel admin)
 * GET  /api/whatsapp/stats           — estatísticas do bot
 * GET  /api/whatsapp/test-connection — testa se o token/número da Meta estão válidos
 */

import express from "express";
import { db } from "../db/index.js";
import { conversasWhatsapp, agendaEventos, pacientes } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import {
  processarMensagem,
  formatarNotificacaoDra,
  formatarSolicitacaoPix,
  formatarConfirmacaoAgendamento,
  VALOR_SINAL,
  MensagemConversa,
} from "../services/iaSecretaria.js";
import {
  enviarMensagem,
  extrairTelefone,
  extrairMensagens,
  extrairEcosHumanos,
  validarAssinatura,
} from "../services/metaWhatsappService.js";
import { pagamentoConfirmado } from "../services/pagamentoService.js";

const router = express.Router();

// Duração da pausa automática da IA depois que um humano responde manualmente
// pelo app do celular (linha em Coexistência). Cada nova mensagem manual renova o prazo.
const PAUSA_HANDOFF_MS = 60 * 60 * 1000; // 60 minutos

// ── In-memory session store (substitua por Redis em produção) ─────────
const sessions = new Map<string, {
  historico: MensagemConversa[];
  dadosColeta: Record<string, any>;
  aguardandoPagamento?: boolean; // true = já pedimos o Pix e esperamos o comprovante (imagem)
  pausadaAte?: number;           // timestamp até quando a IA fica quieta nessa conversa
  pausaManual?: boolean;         // pausa permanente ativada manualmente no painel (ou handoff Fátima do Sul)
  updatedAt: number;
}>();

function getSession(telefone: string) {
  if (!sessions.has(telefone)) {
    sessions.set(telefone, { historico: [], dadosColeta: {}, updatedAt: Date.now() });
  }
  return sessions.get(telefone)!;
}

function iaEstaPausada(telefone: string): boolean {
  const s = sessions.get(telefone);
  if (!s) return false;
  if (s.pausaManual) return true;
  if (s.pausadaAte && Date.now() < s.pausadaAte) return true;
  return false;
}

// ── Função: verificar disponibilidade ────────────────────────────────
async function checkAvailability(dataInicio: string, _dataFim?: string): Promise<string> {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const inicio = dataInicio || hoje;
    const fim = _dataFim || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    const eventos = await db.select().from(agendaEventos)
      .where(eq(agendaEventos.status, "Agendado"));

    // Faixas de funcionamento da Dra. (seg-sex): manhã 08:00-12:00, tarde 13:30-18:00.
    // Consulta dura ~1h30 (avaliação completa) — encaixes de 90 em 90 min.
    // Exceção: 17:30 pode ser oferecido mesmo passando das 18:00.
    const horariosBase = ["08:00", "09:30", "11:00", "13:30", "15:00", "16:30", "17:30"];
    const ocupados = new Set(eventos.map(e => `${e.data}_${e.horario}`));

    const disponiveis: string[] = [];
    const d = new Date(inicio + "T12:00:00");
    const dFim = new Date(fim + "T12:00:00");

    while (d <= dFim && disponiveis.length < 6) {
      const diaSemana = d.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) { // seg-sex
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

// ── Função: criar agendamento ─────────────────────────────────────────
async function createAppointment(args: Record<string, any>, telefone: string): Promise<string> {
  try {
    const id = `wpp-${Date.now()}`;
    const horarioFim = (() => {
      const [h, m] = args.horario.split(":").map(Number);
      const totalMin = h * 60 + m + 90; // consulta dura ~1h30
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

    // Notifica Dra. no WhatsApp
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

// ── Salvar conversa no banco ──────────────────────────────────────────
async function salvarMensagem(telefone: string, role: "user" | "ia", texto: string) {
  try {
    await db.insert(conversasWhatsapp).values({
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      telefone,
      role,
      conteudo: texto,
      timestamp: new Date().toISOString(),
    }).onConflictDoNothing();
  } catch {
    // silencioso — não quebra o fluxo
  }
}

// ── GET /api/whatsapp/webhook — verificação (handshake exigido pela Meta) ─
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// ── POST /api/whatsapp/webhook ────────────────────────────────────────
router.post("/webhook", async (req: any, res) => {
  // Valida a assinatura enviada pela Meta (precisa do corpo raw — ver api/index.ts)
  const assinatura = req.headers["x-hub-signature-256"] as string | undefined;
  if (!validarAssinatura(req.rawBody, assinatura)) {
    console.warn("Webhook Meta: assinatura inválida — requisição ignorada");
    return res.sendStatus(401);
  }

  // Handoff automático: se a Dra./equipe respondeu manualmente pelo app do celular
  // (linha em Coexistência), a Meta ecoa isso via "smb_message_echoes". Pausamos a IA
  // nessa conversa por um tempo pra não atropelar quem já está atendendo.
  const ecos = extrairEcosHumanos(req.body);
  for (const eco of ecos) {
    const session = getSession(eco.paraTelefone);
    session.pausadaAte = Date.now() + PAUSA_HANDOFF_MS;
    console.log(`IA pausada automaticamente para ${eco.paraTelefone} (resposta manual detectada)`);
  }

  const mensagens = extrairMensagens(req.body);
  if (mensagens.length === 0) return res.sendStatus(200); // ex: eventos de status (entregue/lido) ou só ecos

  for (const m of mensagens) {
    const telefone = extrairTelefone(m.from);
    const session = getSession(telefone);
    session.updatedAt = Date.now();

    // ── Imagem recebida: só tratamos como comprovante de Pix se estávamos esperando um ──
    if (m.tipo === "image") {
      await salvarMensagem(telefone, "user", "[imagem recebida]");

      if (iaEstaPausada(telefone)) continue; // Dra./equipe já está atendendo manualmente

      if (session.aguardandoPagamento && session.dadosColeta?.data && session.dadosColeta?.horario) {
        // Confirma o agendamento — o modelo de negócio da clínica é validação manual/visual
        // do comprovante (sem gateway automático). Se quiser validar o conteúdo da imagem
        // no futuro (ex: Gemini Vision), este é o ponto certo para plugar essa checagem.
        await createAppointment(session.dadosColeta, telefone);
        const confirmacao = formatarConfirmacaoAgendamento({
          nome: session.dadosColeta.nome_paciente,
          procedimento: session.dadosColeta.procedimento,
          data: session.dadosColeta.data,
          horario: session.dadosColeta.horario,
        });
        await enviarMensagem(telefone, confirmacao);
        await salvarMensagem(telefone, "ia", confirmacao);
        session.aguardandoPagamento = false;
        session.historico = []; // reseta sessão após agendamento concluído
      } else {
        const aviso = "Recebi sua imagem! Pode me contar mais sobre o que você precisa? 💜";
        await enviarMensagem(telefone, aviso);
        await salvarMensagem(telefone, "ia", aviso);
      }
      continue;
    }

    if (!m.texto) continue; // ignora áudio/figurinha/outros tipos por ora

    await salvarMensagem(telefone, "user", m.texto);

    // Se a IA está pausada nessa conversa (handoff manual ou Fátima do Sul), só guarda a
    // mensagem — a Dra./equipe já vê e responde direto pelo celular.
    if (iaEstaPausada(telefone)) {
      continue;
    }

    // Contexto: busca paciente existente
    let contexto = "";
    try {
      const paciente = await db.select().from(pacientes)
        .where(eq(pacientes.telefone, telefone)).limit(1);
      if (paciente[0]) {
        contexto = `Paciente já cadastrada: ${paciente[0].nome}, diagnóstico: ${JSON.stringify(paciente[0].diagnostico)}, última atualização: ${paciente[0].ultimaAtualizacao}`;
      }
    } catch {}

    // Processa com IA
    const resposta = await processarMensagem(m.texto, session.historico, contexto || undefined);
    let textoResposta = resposta.texto;

    // Executa function calls
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
        // Segurança: nunca confirma sem termos marcado que o comprovante já chegou.
        if (!session.aguardandoPagamento) {
          Object.assign(session.dadosColeta, args);
          session.aguardandoPagamento = true;
          textoResposta = formatarSolicitacaoPix(args.procedimento || session.dadosColeta.procedimento || "consulta");
        } else {
          await createAppointment({ ...args, ...session.dadosColeta }, telefone);
          textoResposta = formatarConfirmacaoAgendamento({
            nome: args.nome_paciente,
            procedimento: args.procedimento,
            data: args.data,
            horario: args.horario,
          });
          session.aguardandoPagamento = false;
          session.historico = []; // resetar sessão após agendamento
        }
      }

      else if (name === "transferir_atendimento_fatima_do_sul") {
        textoResposta = "Vou encaminhar seu atendimento para a Dra. Mariah.";
        session.pausaManual = true; // handoff silencioso — a IA para de responder nessa conversa
      }
    }

    // Atualiza histórico
    session.historico.push({ role: "user", content: m.texto, timestamp: new Date().toISOString() });
    session.historico.push({ role: "model", content: textoResposta, timestamp: new Date().toISOString() });
    if (session.historico.length > 20) session.historico = session.historico.slice(-20);

    // Envia resposta
    if (textoResposta) {
      await enviarMensagem(telefone, textoResposta);
      await salvarMensagem(telefone, "ia", textoResposta);
    }
  }

  res.sendStatus(200);
});

// ── POST /api/whatsapp/payment-webhook (Asaas) ───────────────────────
router.post("/payment-webhook", async (req, res) => {
  if (!pagamentoConfirmado(req.body)) return res.sendStatus(200);

  const ref = req.body?.payment?.externalReference; // telefone da paciente
  if (!ref) return res.sendStatus(200);

  const session = getSession(ref);
  const dados = session.dadosColeta;

  // Cria agendamento automaticamente
  if (dados.data && dados.horario) {
    await createAppointment(dados, ref);
    await enviarMensagem(ref, `✅ *Pagamento confirmado!*\n\nSeu agendamento está garantido:\n📅 ${dados.data} às ${dados.horario}\n💼 ${dados.procedimento || "Consulta"}\n📍 Toledo/PR\n\nTe esperamos! 💜`);
  }

  res.sendStatus(200);
});

// ── GET /api/whatsapp/conversas ───────────────────────────────────────
router.get("/conversas", async (_req, res) => {
  try {
    const msgs = await db.select().from(conversasWhatsapp)
      .orderBy(desc(conversasWhatsapp.timestamp))
      .limit(200);

    // Agrupa por telefone
    const agrupado: Record<string, any[]> = {};
    for (const m of msgs) {
      if (!agrupado[m.telefone]) agrupado[m.telefone] = [];
      agrupado[m.telefone].push({ role: m.role, conteudo: m.conteudo, timestamp: m.timestamp });
    }

    const conversas = Object.entries(agrupado).map(([telefone, mensagens]) => {
      const sessao = sessions.get(telefone);
      return {
        telefone,
        mensagens,
        ultimaAtividade: mensagens[0]?.timestamp?.slice(11, 16) || "--:--",
        status: sessao?.aguardandoPagamento ? "aguardando_pagamento" : "ativo",
        iaPausada: iaEstaPausada(telefone),
      };
    });

    res.json(conversas);
  } catch {
    res.json([]);
  }
});

// ── POST /api/whatsapp/pausar ─────────────────────────────────────────
// Pausa manualmente a IA numa conversa (ex: Dra. quer assumir o atendimento).
// Fica pausada até alguém retomar pelo painel — não expira sozinha.
router.post("/pausar", (req, res) => {
  const telefone = extrairTelefone(String(req.body?.telefone || ""));
  if (!telefone) return res.status(400).json({ ok: false, error: "telefone é obrigatório" });
  const session = getSession(telefone);
  session.pausaManual = true;
  res.json({ ok: true, telefone, iaPausada: true });
});

// ── POST /api/whatsapp/retomar ────────────────────────────────────────
// Reativa a IA numa conversa (remove pausa manual e a automática de handoff).
router.post("/retomar", (req, res) => {
  const telefone = extrairTelefone(String(req.body?.telefone || ""));
  if (!telefone) return res.status(400).json({ ok: false, error: "telefone é obrigatório" });
  const session = getSession(telefone);
  session.pausaManual = false;
  session.pausadaAte = undefined;
  res.json({ ok: true, telefone, iaPausada: false });
});

// ── POST /api/whatsapp/config ─────────────────────────────────────────
// Salva só preferências não sensíveis (número da Dra., IA ativa/inativa).
// Credenciais (token Meta, chave Asaas) continuam vindo de variáveis de ambiente.
router.post("/config", (req, res) => {
  console.log("Preferências recebidas do painel:", Object.keys(req.body));
  res.json({ ok: true, message: "Preferências recebidas. Credenciais sensíveis continuam configuradas via variáveis de ambiente na Vercel." });
});

// ── GET /api/whatsapp/stats ───────────────────────────────────────────
router.get("/stats", async (_req, res) => {
  try {
    const msgs = await db.select().from(conversasWhatsapp).orderBy(desc(conversasWhatsapp.timestamp));
    const hoje = new Date().toISOString().slice(0, 10);
    const hojeSet = new Set(msgs.filter(m => m.timestamp.startsWith(hoje)).map(m => m.telefone));
    const agendamentos = await db.select().from(agendaEventos);
    const botOnline = !!(process.env.META_WHATSAPP_TOKEN && process.env.META_PHONE_NUMBER_ID);

    res.json({
      conversasHoje: hojeSet.size,
      agendadosBot: agendamentos.filter(a => a.diagnosticoResumo?.includes("WhatsApp")).length,
      mensagensTotal: msgs.length,
      botOnline,
    });
  } catch {
    res.json({ conversasHoje: 0, agendadosBot: 0, mensagensTotal: 0, botOnline: false });
  }
});

// ── GET /api/whatsapp/test-connection ────────────────────────────────
// Testa se o token e o phone_number_id configurados na Meta estão válidos.
router.get("/test-connection", async (_req, res) => {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneId = process.env.META_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    return res.status(400).json({ ok: false, error: "Meta Cloud API não configurada (META_WHATSAPP_TOKEN / META_PHONE_NUMBER_ID ausentes)" });
  }
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${phoneId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) return res.json({ ok: true });
    return res.status(400).json({ ok: false, error: "Token ou phone_number_id inválido na Meta" });
  } catch {
    return res.status(500).json({ ok: false, error: "Sem conexão com a Meta Graph API" });
  }
});

export default router;
