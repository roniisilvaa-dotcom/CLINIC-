/**
 * API Routes: IA Secretária WhatsApp
 * POST /api/whatsapp/webhook  — recebe mensagens do Z-API
 * POST /api/whatsapp/payment-webhook — recebe confirmação de pagamento do Asaas
 * GET  /api/whatsapp/conversas — lista conversas (painel admin)
 * GET  /api/whatsapp/stats    — estatísticas do bot
 */

import express from "express";
import { db } from "../src/db/index";
import { conversasWhatsapp, agendaEventos, pacientes } from "../src/db/schema";
import { eq, desc } from "drizzle-orm";
import { processarMensagem, formatarNotificacaoDra, MensagemConversa } from "../src/services/iaSecretaria";
import { enviarMensagem, enviarLinkPagamento, extrairTelefone, WebhookZAPI } from "../src/services/whatsappService";
import { criarOuBuscarCliente, gerarLinkPagamento, pagamentoConfirmado } from "../src/services/pagamentoService";

const router = express.Router();

// ── In-memory session store (substitua por Redis em produção) ─────────
const sessions = new Map<string, {
  historico: MensagemConversa[];
  dadosColeta: Record<string, any>;
  aguardandoPagamento?: string; // id da cobrança
  updatedAt: number;
}>();

function getSession(telefone: string) {
  if (!sessions.has(telefone)) {
    sessions.set(telefone, { historico: [], dadosColeta: {}, updatedAt: Date.now() });
  }
  return sessions.get(telefone)!;
}

// ── Função: verificar disponibilidade ────────────────────────────────
async function checkAvailability(dataInicio: string, _dataFim?: string): Promise<string> {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const inicio = dataInicio || hoje;
    const fim = _dataFim || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    const eventos = await db.select().from(agendaEventos)
      .where(eq(agendaEventos.status, "Agendado"));

    // Horários padrão da Dra. (seg-sex 8h-18h, exceto intervalos)
    const horariosBase = ["08:00","09:00","10:00","11:00","14:00","15:00","16:00","17:00"];
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
            const diasSemana = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
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
      return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    })();

    await db.insert(agendaEventos).values({
      id,
      pacienteId: `wpp_${telefone}`,
      data: args.data,
      horario: args.horario,
      tipo: "Consulta",
      procedimentoTag: args.procedimento,
      duracaoMinutos: 60,
      status: "Agendado",
      diagnosticoResumo: args.observacao || `Agendado via WhatsApp. CPF: ${args.cpf}`,
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
        valorSinal: 100,
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

// ── POST /api/whatsapp/webhook ────────────────────────────────────────
router.post("/webhook", async (req, res) => {
  const body = req.body as WebhookZAPI;

  // Ignora mensagens enviadas pelo próprio número ou grupos
  if (body.fromMe || body.isGroup) return res.sendStatus(200);

  const mensagem = body.text?.message;
  if (!mensagem) return res.sendStatus(200); // ignora áudio/imagem por ora

  const telefone = extrairTelefone(body.phone);
  const session  = getSession(telefone);
  session.updatedAt = Date.now();

  await salvarMensagem(telefone, "user", mensagem);

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
  const resposta = await processarMensagem(mensagem, session.historico, contexto || undefined);

  let textoResposta = resposta.texto;

  // Executa function calls
  if (resposta.functionCall) {
    const { name, args } = resposta.functionCall;

    if (name === "check_availability") {
      const resultado = await checkAvailability(args.data_inicio, args.data_fim);
      // Continua conversa com resultado da função
      const resposta2 = await processarMensagem(
        `[Sistema] Resultado da agenda: ${resultado}`,
        session.historico,
        contexto || undefined
      );
      textoResposta = resposta2.texto || resultado;
      Object.assign(session.dadosColeta, args);
    }

    else if (name === "create_payment_link") {
      Object.assign(session.dadosColeta, args);
      const clienteId = await criarOuBuscarCliente(args.nome_paciente, args.cpf || "00000000000", args.telefone || telefone);
      const amanha = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const cobranca = await gerarLinkPagamento({
        clienteId: clienteId || "demo",
        descricao: `Sinal consulta CA.RO — ${args.procedimento}`,
        valor: args.valor || 100,
        dueDate: amanha,
        externalRef: telefone,
      });

      if (cobranca) {
        session.aguardandoPagamento = cobranca.id;
        await enviarLinkPagamento(telefone, cobranca.invoiceUrl || cobranca.bankSlipUrl, args.valor || 100, args.procedimento);
        textoResposta = `Perfeito! Enviei o link de pagamento do sinal de R$ ${args.valor || 100},00 💜\n\nAssim que o pagamento for confirmado, seu agendamento fica garantido!`;
      } else {
        textoResposta = "Tive um problema ao gerar o link. Nossa equipe entrará em contato em instantes. 💜";
      }
    }

    else if (name === "create_appointment") {
      const resultado = await createAppointment({ ...args, ...session.dadosColeta }, telefone);
      textoResposta = `✅ *Agendamento confirmado!*\n\n👤 ${args.nome_paciente}\n📅 ${args.data} às ${args.horario}\n💼 ${args.procedimento}\n📍 Toledo/PR\n\nA Dra. Mariah já foi notificada. Te esperamos! 💜`;
      session.historico = []; // resetar sessão após agendamento
    }
  }

  // Atualiza histórico
  session.historico.push({ role: "user", content: mensagem, timestamp: new Date().toISOString() });
  session.historico.push({ role: "model", content: textoResposta, timestamp: new Date().toISOString() });
  if (session.historico.length > 20) session.historico = session.historico.slice(-20);

  // Envia resposta
  if (textoResposta) {
    await enviarMensagem(telefone, textoResposta);
    await salvarMensagem(telefone, "ia", textoResposta);
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
router.get("/conversas", async (req, res) => {
  try {
    const msgs = await db.select().from(conversasWhatsapp)
      .orderBy(desc(conversasWhatsapp.timestamp))
      .limit(200);

    // Agrupa por telefone
    const agrupado: Record<string, any[]> = {};
    for (const m of msgs) {
      if (!agrupado[m.telefone]) agrupado[m.telefone] = [];
      agrupado[m.telefone].push(m);
    }

    res.json({ conversas: agrupado, total: Object.keys(agrupado).length });
  } catch (err) {
    res.json({ conversas: {}, total: 0 });
  }
});

// ── GET /api/whatsapp/stats ───────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const msgs = await db.select().from(conversasWhatsapp).orderBy(desc(conversasWhatsapp.timestamp));
    const telefones = new Set(msgs.map(m => m.telefone));
    res.json({
      totalConversas: telefones.size,
      totalMensagens: msgs.length,
      sessoesAtivas: sessions.size,
    });
  } catch {
    res.json({ totalConversas: 0, totalMensagens: 0, sessoesAtivas: 0 });
  }
});

export default router;
