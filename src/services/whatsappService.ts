/**
 * Serviço de envio/recebimento via Z-API
 * Z-API: https://developer.z-api.io/
 */

const ZAPI_BASE    = process.env.ZAPI_BASE_URL!;   // ex: https://api.z-api.io/instances/SUA_INSTANCIA/token/SEU_TOKEN
const ZAPI_TOKEN   = process.env.ZAPI_TOKEN!;       // Client-Token do Z-API

/** Envia mensagem de texto */
export async function enviarMensagem(telefone: string, mensagem: string): Promise<boolean> {
  if (!ZAPI_BASE) { console.warn("ZAPI_BASE_URL não configurada"); return false; }
  try {
    const res = await fetch(`${ZAPI_BASE}/send-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Client-Token": ZAPI_TOKEN },
      body: JSON.stringify({ phone: telefone.replace(/\D/g, ""), message: mensagem }),
    });
    return res.ok;
  } catch (err) {
    console.error("Erro envio WhatsApp:", err);
    return false;
  }
}

/** Envia link de pagamento como mensagem formatada */
export async function enviarLinkPagamento(telefone: string, linkPix: string, valor: number, procedimento: string): Promise<boolean> {
  const msg = `💳 *Pagamento do sinal — CA.RO Clinic*\n\nProcedimento: *${procedimento}*\nValor do sinal: *R$ ${valor},00*\n\nClique no link abaixo para pagar via Pix ou cartão:\n${linkPix}\n\n_Após o pagamento, seu agendamento será confirmado automaticamente_ ✅`;
  return enviarMensagem(telefone, msg);
}

/** Extrai telefone limpo do webhook Z-API */
export function extrairTelefone(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^55/, "");
}

/** Tipos do webhook Z-API */
export interface WebhookZAPI {
  phone:       string;
  fromMe:      boolean;
  messageId:   string;
  momment:     number;
  status:      string;
  chatName:    string;
  text?:       { message: string };
  audio?:      { audioUrl: string; seconds: number };
  image?:      { imageUrl: string; caption?: string };
  isGroup:     boolean;
  instanceId:  string;
}
