/**
 * Serviço de envio/recebimento via Meta WhatsApp Cloud API (oficial)
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * Variáveis de ambiente necessárias (configurar no Vercel):
 * - META_WHATSAPP_TOKEN   → token de acesso permanente (System User) do app Meta
 * - META_PHONE_NUMBER_ID  → ID do número de telefone registrado no WhatsApp Manager
 * - META_APP_SECRET       → App Secret do app Meta (valida a assinatura dos webhooks)
 * - META_VERIFY_TOKEN     → string arbitrária definida por você, usada só na verificação do webhook
 * - META_GRAPH_VERSION    → opcional, default "v21.0"
 */
import crypto from "crypto";

const META_TOKEN           = process.env.META_WHATSAPP_TOKEN || "";
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || "";
const META_APP_SECRET      = process.env.META_APP_SECRET || "";
const GRAPH_VERSION        = process.env.META_GRAPH_VERSION || "v21.0";

function graphUrl(): string {
  return `https://graph.facebook.com/${GRAPH_VERSION}/${META_PHONE_NUMBER_ID}/messages`;
}

/** Envia mensagem de texto simples via Meta Cloud API */
export async function enviarMensagem(telefone: string, mensagem: string): Promise<boolean> {
  if (!META_TOKEN || !META_PHONE_NUMBER_ID) {
    console.warn("META_WHATSAPP_TOKEN ou META_PHONE_NUMBER_ID não configurados");
    return false;
  }
  try {
    const res = await fetch(graphUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${META_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizarParaEnvio(telefone),
        type: "text",
        text: { body: mensagem, preview_url: true },
      }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("Erro ao enviar mensagem (Meta Cloud API):", res.status, errBody);
    }
    return res.ok;
  } catch (err) {
    console.error("Erro envio WhatsApp (Meta):", err);
    return false;
  }
}

/** Normaliza telefone pro envio — Meta espera código do país + DDD + número, só dígitos */
function normalizarParaEnvio(telefone: string): string {
  const limpo = telefone.replace(/\D/g, "");
  return limpo.startsWith("55") ? limpo : `55${limpo}`;
}

/** Extrai telefone "curto" (sem 55) a partir do payload recebido no webhook da Meta */
export function extrairTelefone(from: string): string {
  const limpo = (from || "").replace(/\D/g, "");
  return limpo.replace(/^55/, "");
}

/**
 * Valida a assinatura X-Hub-Signature-256 enviada pela Meta em cada chamada de webhook.
 * Exige o corpo RAW da requisição (ver api/index.ts, onde capturamos req.rawBody).
 */
export function validarAssinatura(rawBody: Buffer | string | undefined, signatureHeader: string | undefined): boolean {
  if (!META_APP_SECRET) {
    console.warn("META_APP_SECRET não configurado — pulando validação de assinatura (não use assim em produção!)");
    return true;
  }
  if (!signatureHeader || !rawBody) return false;
  const esperado = "sha256=" + crypto.createHmac("sha256", META_APP_SECRET).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

/** Mensagem recebida, já normalizada a partir do payload cru da Meta */
export interface MensagemRecebidaMeta {
  from: string;
  messageId: string;
  timestamp: string;
  texto?: string;
  tipo: string; // "text" | "image" | "audio" | "sticker" | ...
  pushName?: string;
  imagemId?: string;   // presente quando tipo === "image" — usado para tratar comprovante de Pix
  legendaImagem?: string;
}

/**
 * Extrai a(s) mensagem(ns) ENVIADAS PELO PACIENTE de um payload de webhook da Meta
 * (campo "messages"). Retorna [] quando o evento é só de status (entregue/lido) — esses devem
 * ser ignorados. Captura texto e também imagens (usadas como comprovante de Pix).
 */
export function extrairMensagens(body: any): MensagemRecebidaMeta[] {
  const mensagens: MensagemRecebidaMeta[] = [];
  const entries = body?.entry || [];
  for (const entry of entries) {
    for (const change of entry?.changes || []) {
      if (change?.field && change.field !== "messages") continue;
      const value = change?.value;
      if (!value?.messages) continue; // ignora "statuses" (entregue/lido/falhou)
      const contatos = value.contacts || [];
      for (const msg of value.messages) {
        mensagens.push({
          from: msg.from,
          messageId: msg.id,
          timestamp: msg.timestamp,
          texto: msg.text?.body,
          tipo: msg.type,
          pushName: contatos.find((c: any) => c.wa_id === msg.from)?.profile?.name,
          imagemId: msg.type === "image" ? msg.image?.id : undefined,
          legendaImagem: msg.type === "image" ? msg.image?.caption : undefined,
        });
      }
    }
  }
  return mensagens;
}

/**
 * Handoff humano → IA: quando a Dra./equipe manda mensagem manualmente pelo app
 * do celular (linha em Coexistência), a Meta ecoa esse envio no campo de webhook
 * "smb_message_echoes" (é preciso assinar esse campo também no painel do app Meta,
 * além de "messages"). Usamos isso pra pausar a IA automaticamente nessa conversa.
 *
 * Referência: https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/reference/smb_message_echoes
 * Obs: como é um recurso novo da plataforma, vale conferir o payload real assim que os
 * primeiros eventos chegarem (dá pra logar body cru temporariamente) e ajustar aqui se o
 * formato divergir um pouco do esperado.
 */
export interface EcoMensagemHumana {
  paraTelefone: string; // paciente que recebeu a mensagem manual (telefone "curto", sem 55)
  timestamp: string;
}

export function extrairEcosHumanos(body: any): EcoMensagemHumana[] {
  const ecos: EcoMensagemHumana[] = [];
  const entries = body?.entry || [];
  for (const entry of entries) {
    for (const change of entry?.changes || []) {
      if (change?.field !== "smb_message_echoes") continue;
      const value = change?.value;
      const lista = value?.message_echoes || value?.messages || [];
      for (const msg of lista) {
        const destino = msg.to || msg.recipient_id;
        if (!destino) continue;
        ecos.push({ paraTelefone: extrairTelefone(destino), timestamp: msg.timestamp || String(Date.now()) });
      }
    }
  }
  return ecos;
}
