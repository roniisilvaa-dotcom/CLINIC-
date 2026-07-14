/**
 * API Route: IA Secretária WhatsApp via Evolution API (não-oficial, QR Code)
 * POST /api/whatsapp/webhook-evolution — recebe eventos da Evolution API
 * GET  /api/whatsapp/qr               — gera QR Code para a Dra. conectar o WhatsApp
 * GET  /api/whatsapp/status-conexao   — checa se o WhatsApp já está conectado
 * DELETE /api/whatsapp/desconectar    — desconecta o WhatsApp atual (parear outro aparelho)
 *
 * Usa o mesmo núcleo de processamento (src/services/whatsappCore.ts) que a integração
 * oficial da Meta — só troca o transporte de envio/recebimento.
 */
import express from "express";
import {
    enviarMensagem,
    extrairTelefone,
    extrairMensagens,
    extrairEcosHumanos,
    obterQrCode,
    obterStatusConexao,
    desconectarInstancia,
} from "../services/evolutionWhatsappService.js";
import { processarEventoWebhook } from "../services/whatsappCore.js";

const router = express.Router();

// Segurança leve: como a Evolution API não assina o payload por padrão (diferente da
// Meta), protegemos a rota com um token simples na própria URL do webhook, configurado
// tanto aqui (env var) quanto na Evolution API. Sem isso, qualquer um que descobrisse a
// URL do webhook poderia mandar payloads falsos.
const WEBHOOK_TOKEN = process.env.EVOLUTION_WEBHOOK_TOKEN || "";

router.post("/webhook-evolution", async (req, res) => {
    if (WEBHOOK_TOKEN && req.query.token !== WEBHOOK_TOKEN) {
          console.warn("Webhook Evolution: token inválido — requisição ignorada");
          return res.sendStatus(401);
    }

              try {
                    const ecos = extrairEcosHumanos(req.body);
                    const mensagens = extrairMensagens(req.body);

      if (mensagens.length === 0 && ecos.length === 0) return res.sendStatus(200);

      await processarEventoWebhook(mensagens, ecos, extrairTelefone, enviarMensagem);
              } catch (err) {
                    console.error("Erro processando webhook Evolution:", err);
              }

              res.sendStatus(200);
});

// Autoconexão pela Dra.: gera o QR Code para escanear com o WhatsApp da clínica,
// sem precisar mexer em nenhum painel técnico (Meta, Asaas etc.).
router.get("/qr", async (req, res) => {
    const resultado = await obterQrCode();
    res.status(resultado.ok ? 200 : 503).json(resultado);
});

router.get("/status-conexao", async (req, res) => {
    const resultado = await obterStatusConexao();
    res.status(resultado.ok ? 200 : 503).json(resultado);
});

router.delete("/desconectar", async (req, res) => {
    const resultado = await desconectarInstancia();
    res.status(resultado.ok ? 200 : 503).json(resultado);
});

export default router;
