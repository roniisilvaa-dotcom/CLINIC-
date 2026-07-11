/**
 * Serviço de envio/recebimento via Evolution API (não-oficial, QR Code / Baileys)
 *
 * Usado como alternativa à Meta Cloud API enquanto o registro oficial (Coexistence) não
 * está disponível — mesma técnica usada por bots como a EVA (evachat.com.br): conecta ao
 * WhatsApp do celular via QR Code, sem passar pela aprovação da Meta.
 *
 * Risco: é uma integração não-oficial (fora dos termos de uso do WhatsApp). Usar com
 * consciência desse risco — ver seção 7 do IA MARIAH.docx.
 *
 * Variáveis de ambiente necessárias (configurar no Vercel):
 * - EVOLUTION_API_URL       → URL pública da instância Evolution API (ex: https://xxx.up.railway.app)
 * - EVOLUTION_API_KEY       → API key global da Evolution API
 * - EVOLUTION_INSTANCE_NAME → nome da instância (ex: caro-clinic-teste)
 */

const EVOLUTION_API_URL = (process.env.EVOLUTION_API_URL || "").replace(/\/$/, "");
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";
const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || "";

const idsEnviadosPorNos = new Set<string>();
const LIMITE_IDS_GUARDADOS = 500;

function registrarIdEnviado(id: string | undefined) {
    if (!id) return;
    idsEnviadosPorNos.add(id);
    if (idsEnviadosPorNos.size > LIMITE_IDS_GUARDADOS) {
          const primeiro = idsEnviadosPorNos.values().next().value;
          if (primeiro) idsEnviadosPorNos.delete(primeiro);
    }
}

export async function enviarMensagem(telefone: string, mensagem: string): Promise<boolean> {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
          console.warn("EVOLUTION_API_URL / EVOLUTION_API_KEY / EVOLUTION_INSTANCE_NAME não configurados");
          return false;
    }
    try {
          const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`, {
                  method: "POST",
                  headers: {
                            "Content-Type": "application/json",
                            apikey: EVOLUTION_API_KEY,
                  },
                  body: JSON.stringify({
                            number: normalizarParaEnvio(telefone),
                            text: mensagem,
                  }),
          });
          if (!res.ok) {
                  const errBody = await res.text().catch(() => "");
                  console.error("Erro ao enviar mensagem (Evolution API):", res.status, errBody);
                  return false;
          }
          const data = await res.json().catch(() => null);
          registrarIdEnviado(data?.key?.id);
          return true;
    } catch (err) {
          console.error("Erro envio WhatsApp (Evolution):", err);
          return false;
    }
}

function normalizarParaEnvio(telefone: string): string {
    const limpo = telefone.replace(/\D/g, "");
    return limpo.startsWith("55") ? limpo : `55${limpo}`;
}

export function extrairTelefone(remoteJid: string): string {
    const limpo = (remoteJid || "").split("@")[0].replace(/\D/g, "");
    return limpo.replace(/^55/, "");
}


/** Mensagem recebida, já normalizada a partir do payload cru da Evolution API */
export interface MensagemRecebidaEvolution {
    from: string;
    messageId: string;
    timestamp: string;
    texto?: string;
    tipo: string; // "text" | "image" | "unknown"
  pushName?: string;
    imagemId?: string;
    legendaImagem?: string;
}

/**
 * Extrai a(s) mensagem(ns) ENVIADAS PELO PACIENTE de um payload de webhook da Evolution API
 * (evento "messages.upsert"). Ignora mensagens de grupo, status/broadcast e mensagens que
 * NÓS mesmos enviamos via API (fromMe:true com ID conhecido — ver extrairEcosHumanos para
 * o caso de resposta manual humana, que também chega como fromMe:true).
 */
export function extrairMensagens(body: any): MensagemRecebidaEvolution[] {
    const mensagens: MensagemRecebidaEvolution[] = [];
    if (body?.event !== "messages.upsert" || !body?.data) return mensagens;

  const eventos = Array.isArray(body.data) ? body.data : [body.data];
    for (const data of eventos) {
          const remoteJid: string = data?.key?.remoteJid || "";
          if (!remoteJid || remoteJid.endsWith("@g.us") || remoteJid === "status@broadcast") continue;
          if (data?.key?.fromMe) continue; // tratado em extrairEcosHumanos

      const msg = data?.message || {};
          const texto: string | undefined = msg.conversation || msg.extendedTextMessage?.text;
          const temImagem = !!msg.imageMessage;

      mensagens.push({
              from: remoteJid,
              messageId: data?.key?.id || "",
              timestamp: String(data?.messageTimestamp || Math.floor(Date.now() / 1000)),
              texto: temImagem ? undefined : texto,
              tipo: temImagem ? "image" : (texto ? "text" : (data?.messageType || "unknown")),
              pushName: data?.pushName,
              imagemId: temImagem ? data?.key?.id : undefined,
              legendaImagem: temImagem ? msg.imageMessage?.caption : undefined,
      });
    }
    return mensagens;
}

/** Mesma interface usada pelo lado Meta — telefone "curto" (sem 55) de quem recebeu a resposta manual */
export interface EcoMensagemHumana {
    paraTelefone: string;
    timestamp: string;
}

/**
 * Handoff humano → IA: quando a Dra./equipe responde manualmente pelo WhatsApp Business
 * no celular (mesma linha conectada via QR Code), a Evolution API ecoa essa mensagem no
 * mesmo evento "messages.upsert" com fromMe:true. Diferenciamos de mensagens que nós
 * mesmos mandamos via API usando o registro de IDs enviados (ver registrarIdEnviado) —
 * se o ID da mensagem NÃO está nesse registro, foi um humano digitando direto no celular.
 */
export function extrairEcosHumanos(body: any): EcoMensagemHumana[] {
    const ecos: EcoMensagemHumana[] = [];
    if (body?.event !== "messages.upsert" || !body?.data) return ecos;

  const eventos = Array.isArray(body.data) ? body.data : [body.data];
    for (const data of eventos) {
          const remoteJid: string = data?.key?.remoteJid || "";
          if (!remoteJid || remoteJid.endsWith("@g.us") || !data?.key?.fromMe) continue;
          const id = data?.key?.id;
          if (id && idsEnviadosPorNos.has(id)) continue; // fomos nós, não é eco humano
      ecos.push({ paraTelefone: extrairTelefone(remoteJid), timestamp: String(data?.messageTimestamp || Math.floor(Date.now() / 1000)) });
    }
    return ecos;
}
