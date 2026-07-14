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
    // Chave completa da mensagem (necessária pra baixar a mídia depois, via
    // baixarMidiaBase64 — o endpoint de mídia da Evolution API pede a key inteira,
    // não só o ID).
    chaveMidia?: { remoteJid: string; id: string; fromMe: boolean };
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
              chaveMidia: temImagem
                        ? { remoteJid, id: data?.key?.id || "", fromMe: !!data?.key?.fromMe }
                        : undefined,
      });
    }
    return mensagens;
}

/**
 * Baixa o conteúdo (base64) de uma imagem recebida, usando a chave da mensagem.
 * Necessário pra IA realmente "olhar" a imagem antes de aceitar como comprovante de
 * Pix — antes disso, qualquer imagem enviada era tratada como comprovante válido só
 * por ter chegado uma imagem, sem checar o conteúdo (risco real de golpe/erro).
 */
export async function baixarMidiaBase64(chave: { remoteJid: string; id: string; fromMe: boolean }): Promise<{ base64: string; mimetype?: string } | null> {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) return null;
    try {
          const res = await fetch(`${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${EVOLUTION_INSTANCE_NAME}`, {
                  method: "POST",
                  headers: {
                            "Content-Type": "application/json",
                            apikey: EVOLUTION_API_KEY,
                  },
                  body: JSON.stringify({
                            message: { key: chave },
                            convertToMp4: false,
                  }),
          });
          if (!res.ok) {
                  const errBody = await res.text().catch(() => "");
                  console.error("Erro ao baixar mídia (Evolution API):", res.status, errBody);
                  return null;
          }
          const data = await res.json().catch(() => null);
          const base64: string | undefined = data?.base64;
          if (!base64) return null;
          return { base64, mimetype: data?.mimetype || "image/jpeg" };
    } catch (err) {
          console.error("Erro de rede ao baixar mídia (Evolution):", err);
          return null;
    }
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

// ── Conexão / QR Code (autoconexão pela Dra., sem precisar de painel técnico) ──────

export interface ResultadoQrCode {
    ok: boolean;
    base64?: string;
    pairingCode?: string;
    conectado?: boolean;
    erro?: string;
}

/**
 * Pede à Evolution API o QR Code atual para parear o WhatsApp da clínica (equivalente a
 * abrir o WhatsApp Web). Se a instância já estiver conectada, a Evolution API normalmente
 * não retorna QR — nesse caso devolvemos conectado:true.
 */
export async function obterQrCode(): Promise<ResultadoQrCode> {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
          return { ok: false, erro: "Integração do WhatsApp ainda não configurada. Fale com o suporte técnico." };
    }
    try {
          const res = await fetch(`${EVOLUTION_API_URL}/instance/connect/${EVOLUTION_INSTANCE_NAME}`, {
                  method: "GET",
                  headers: { apikey: EVOLUTION_API_KEY },
          });
          if (!res.ok) {
                  const errBody = await res.text().catch(() => "");
                  console.error("Erro ao buscar QR Code (Evolution API):", res.status, errBody);
                  return { ok: false, erro: `Não foi possível gerar o QR Code agora (código ${res.status}).` };
          }
          const data = await res.json().catch(() => null);
          const base64: string | undefined = data?.base64 || data?.qrcode?.base64 || undefined;
          const pairingCode: string | undefined = data?.pairingCode || data?.code || undefined;

      if (!base64 && !pairingCode) {
                  // Resposta sem QR geralmente significa que já está conectado
                  const estado = data?.instance?.state || data?.state;
                  if (estado === "open") return { ok: true, conectado: true };
                  return { ok: false, erro: "A resposta da Evolution API não trouxe um QR Code. Tente novamente em instantes." };
      }
          return { ok: true, base64, pairingCode, conectado: false };
    } catch (err: any) {
          console.error("Erro de rede ao buscar QR Code (Evolution):", err);
          return { ok: false, erro: "Não foi possível contatar o servidor do WhatsApp. Verifique sua internet e tente novamente." };
    }
}

export interface ResultadoStatusConexao {
    ok: boolean;
    conectado: boolean;
    estado?: string;
    erro?: string;
}

/** Consulta se a instância da Evolution API está conectada (equivalente ao "WhatsApp Web pareado"). */
export async function obterStatusConexao(): Promise<ResultadoStatusConexao> {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
          return { ok: false, conectado: false, erro: "Integração do WhatsApp ainda não configurada." };
    }
    try {
          const res = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE_NAME}`, {
                  method: "GET",
                  headers: { apikey: EVOLUTION_API_KEY },
          });
          if (!res.ok) {
                  return { ok: false, conectado: false, erro: `Servidor respondeu com erro (${res.status}).` };
          }
          const data = await res.json().catch(() => null);
          const estado: string | undefined = data?.instance?.state || data?.state;
          return { ok: true, conectado: estado === "open", estado };
    } catch (err: any) {
          console.error("Erro de rede ao checar status da conexão (Evolution):", err);
          return { ok: false, conectado: false, erro: "Não foi possível checar o status da conexão agora." };
    }
}

/** Desconecta a instância atual, liberando o número para parear em outro aparelho se necessário. */
export async function desconectarInstancia(): Promise<{ ok: boolean; erro?: string }> {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
          return { ok: false, erro: "Integração do WhatsApp ainda não configurada." };
    }
    try {
          const res = await fetch(`${EVOLUTION_API_URL}/instance/logout/${EVOLUTION_INSTANCE_NAME}`, {
                  method: "DELETE",
                  headers: { apikey: EVOLUTION_API_KEY },
          });
          if (!res.ok) {
                  return { ok: false, erro: `Não foi possível desconectar agora (código ${res.status}).` };
          }
          return { ok: true };
    } catch (err: any) {
          console.error("Erro de rede ao desconectar (Evolution):", err);
          return { ok: false, erro: "Não foi possível contatar o servidor do WhatsApp." };
    }
}
