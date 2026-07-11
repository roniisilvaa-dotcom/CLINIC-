/**
 * API Route: IA Secretária WhatsApp via Evolution API (não-oficial, QR Code)
 * POST /api/whatsapp/webhook-evolution — recebe eventos da Evolution API
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

export default router;
