/**
 * API Routes: IA Secretária WhatsApp (Meta Cloud API oficial)
 * GET /api/whatsapp/webhook — verificação do webhook (handshake da Meta)
 * POST /api/whatsapp/webhook — recebe mensagens da Meta Cloud API
 * POST /api/whatsapp/payment-webhook — recebe confirmação de pagamento do Asaas
 * GET /api/whatsapp/conversas — lista conversas (painel admin)
 * DELETE /api/whatsapp/conversas/:telefone — apaga o historico de uma conversa
 * GET /api/whatsapp/stats — estatísticas do bot
 * GET /api/whatsapp/test-connection — testa se o token/número da Meta estão válidos
 *
 * A lógica de negócio (sessão, agenda, agendamento, loop da IA) mora em
 * src/services/whatsappCore.ts — compartilhada com a integração via Evolution API
 * (ver src/routes/whatsappEvolution.ts).
 */

import express from "express";
import { db } from "../db/index.js";
import { conversasWhatsapp, agendaEventos } from "../db/schema.js";
import { desc, eq } from "drizzle-orm";
import {
      enviarMensagem,
      extrairTelefone,
      extrairMensagens,
      extrairEcosHumanos,
      validarAssinatura,
} from "../services/metaWhatsappService.js";
import { pagamentoConfirmado } from "../services/pagamentoService.js";
import {
      sessions,
      getSession,
      iaEstaPausada,
      processarEventoWebhook,
      criarAgendamentoDireto,
} from "../services/whatsappCore.js";

const router = express.Router();

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
      const assinatura = req.headers["x-hub-signature-256"] as string | undefined;
      if (!validarAssinatura(req.rawBody, assinatura)) {
              console.warn("Webhook Meta: assinatura inválida — requisição ignorada");
              return res.sendStatus(401);
      }

              try {
                      const ecos = extrairEcosHumanos(req.body);
                      const mensagens = extrairMensagens(req.body);

        if (mensagens.length === 0 && ecos.length === 0) return res.sendStatus(200);

        await processarEventoWebhook(mensagens, ecos, extrairTelefone, enviarMensagem);
              } catch (err) {
                      console.error("Erro processando webhook Meta:", err);
              }

              res.sendStatus(200);
});

// ── POST /api/whatsapp/payment-webhook (Asaas) ───────────────────────
router.post("/payment-webhook", async (req, res) => {
      if (!pagamentoConfirmado(req.body)) return res.sendStatus(200);

              const ref = req.body?.payment?.externalReference;
      if (!ref) return res.sendStatus(200);

              const session = getSession(ref);
      const dados = session.dadosColeta;

              if (dados.data && dados.horario) {
                      await criarAgendamentoDireto(dados, ref, enviarMensagem);
                      await enviarMensagem(ref, `✅ *Pagamento confirmado!*\n\nSeu agendamento está garantido:\n📅 ${dados.data} às ${dados.horario}\n💼 ${dados.procedimento || "Consulta"}\n📍 Toledo/PR\n\nTe esperamos! 💜`);
              }

              res.sendStatus(200);
});

// ── GET /api/whatsapp/conversas ───────────────────────────────────────
// Antes: limitava a 200 mensagens GLOBAIS (somando todas as conversas) em ordem
// decrescente, o que truncava conversas mais antigas quando havia varias pessoas
// conversando, e deixava as mensagens de cada conversa em ordem invertida
// (mais nova primeiro) — por isso o painel parecia travar mostrando so um
// pedaco/preview em vez da conversa inteira. Agora buscamos um limite bem maior
// em ordem cronologica (mais antiga primeiro), o que corrige a leitura completa
// e tambem a previa (que usa a ultima mensagem do array).
router.get("/conversas", async (_req, res) => {
      try {
              const msgs = await db.select().from(conversasWhatsapp)
                .orderBy(conversasWhatsapp.timestamp)
                .limit(5000);

        const agrupado: Record<string, any[]> = {};
              for (const m of msgs) {
                        if (!agrupado[m.telefone]) agrupado[m.telefone] = [];
                        agrupado[m.telefone].push({ role: m.role, conteudo: m.conteudo, timestamp: m.timestamp });
              }

        const conversas = Object.entries(agrupado).map(([telefone, mensagens]) => {
                  const sessao = sessions.get(telefone);
                  const ultima = mensagens[mensagens.length - 1];
                  return {
                              telefone,
                              mensagens,
                              ultimaAtividade: ultima?.timestamp?.slice(11, 16) || "--:--",
                              status: sessao?.aguardandoPagamento ? "aguardando_pagamento" : "ativo",
                              iaPausada: iaEstaPausada(telefone),
                  };
        });

        conversas.sort((a, b) => {
                  const ta = a.mensagens[a.mensagens.length - 1]?.timestamp || "";
                  const tb = b.mensagens[b.mensagens.length - 1]?.timestamp || "";
                  return tb.localeCompare(ta);
        });

        res.json(conversas);
      } catch {
              res.json([]);
      }
});

// ── DELETE /api/whatsapp/conversas/:telefone — apaga uma conversa ─────
router.delete("/conversas/:telefone", async (req, res) => {
      try {
              const telefone = String(req.params.telefone || "").trim();
              if (!telefone) return res.status(400).json({ ok: false, error: "telefone é obrigatório" });
              await db.delete(conversasWhatsapp).where(eq(conversasWhatsapp.telefone, telefone));
              sessions.delete(telefone);
              res.json({ ok: true });
      } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
      }
});

// ── POST /api/whatsapp/pausar ─────────────────────────────────────────
router.post("/pausar", (req, res) => {
      const telefone = extrairTelefone(String(req.body?.telefone || ""));
      if (!telefone) return res.status(400).json({ ok: false, error: "telefone é obrigatório" });
      const session = getSession(telefone);
      session.pausaManual = true;
      res.json({ ok: true, telefone, iaPausada: true });
});

// ── POST /api/whatsapp/retomar ────────────────────────────────────────
router.post("/retomar", (req, res) => {
      const telefone = extrairTelefone(String(req.body?.telefone || ""));
      if (!telefone) return res.status(400).json({ ok: false, error: "telefone é obrigatório" });
      const session = getSession(telefone);
      session.pausaManual = false;
      session.pausadaAte = undefined;
      res.json({ ok: true, telefone, iaPausada: false });
});

// ── POST /api/whatsapp/config ─────────────────────────────────────────
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
              const botOnline = !!(process.env.META_WHATSAPP_TOKEN && process.env.META_PHONE_NUMBER_ID)
                || !!(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY);

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
