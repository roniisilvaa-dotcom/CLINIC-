/**
 * Integracao com Google Calendar (Calendar API v3) -- usada pra checar a
 * disponibilidade REAL da Dra. Mariah, em vez de depender so da lista manual
 * de "Dias de Atendimento" cadastrada no painel. A Dra. autoriza o acesso uma
 * unica vez (fluxo OAuth2, botao "Conectar Google Agenda" no painel
 * Configurar); depois disso o token fica salvo no banco (google_calendar_auth)
 * e e renovado automaticamente usando o refresh_token, sem precisar logar de
 * novo.
 *
 * Variaveis de ambiente necessarias (Vercel -> Settings -> Environment
 * Variables), criadas no Google Cloud Console (APIs & Services -> Credentials
 * -> OAuth client ID -> Web application):
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_REDIRECT_URI  (ex: https://clinic-caro.vercel.app/api/google-calendar/callback)
 */
import { db } from "../db/index.js";
import { googleCalendarAuth } from "../db/schema.js";
import { eq } from "drizzle-orm";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "";
const ID_FIXO = "dra-mariah";

const SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

export function googleCalendarConfigurado(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET && REDIRECT_URI);
}

export function gerarUrlAutorizacao(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function trocarCodePorToken(code: string): Promise<void> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  const json = await res.json() as any;
  if (!res.ok || !json.access_token) {
    throw new Error("Falha ao trocar codigo por token: " + JSON.stringify(json).slice(0, 300));
  }
  const expiryDate = new Date(Date.now() + (json.expires_in || 3600) * 1000).toISOString();

  await db.insert(googleCalendarAuth).values({
    id: ID_FIXO,
    accessToken: json.access_token,
    refreshToken: json.refresh_token || "",
    expiryDate,
    calendarId: "primary",
    conectadoEm: new Date().toISOString(),
  }).onConflictDoUpdate({
    target: googleCalendarAuth.id,
    set: {
      accessToken: json.access_token,
      ...(json.refresh_token ? { refreshToken: json.refresh_token } : {}),
      expiryDate,
      conectadoEm: new Date().toISOString(),
    },
  });
}

async function renovarToken(refreshToken: string): Promise<{ accessToken: string; expiryDate: string }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const json = await res.json() as any;
  if (!res.ok || !json.access_token) {
    throw new Error("Falha ao renovar token do Google: " + JSON.stringify(json).slice(0, 300));
  }
  const expiryDate = new Date(Date.now() + (json.expires_in || 3600) * 1000).toISOString();
  return { accessToken: json.access_token, expiryDate };
}

async function obterTokenValido(): Promise<string | null> {
  const linhas = await db.select().from(googleCalendarAuth).where(eq(googleCalendarAuth.id, ID_FIXO)).limit(1);
  const linha = linhas[0];
  if (!linha) return null;

  const expiraEm = new Date(linha.expiryDate).getTime();
  if (Date.now() < expiraEm - 2 * 60 * 1000) {
    return linha.accessToken;
  }

  if (!linha.refreshToken) return null;
  try {
    const { accessToken, expiryDate } = await renovarToken(linha.refreshToken);
    await db.update(googleCalendarAuth).set({ accessToken, expiryDate }).where(eq(googleCalendarAuth.id, ID_FIXO));
    return accessToken;
  } catch (err) {
    console.error("Erro ao renovar token do Google Agenda:", err);
    return null;
  }
}

export async function googleAgendaConectada(): Promise<{ conectado: boolean; conectadoEm?: string }> {
  try {
    const linhas = await db.select().from(googleCalendarAuth).where(eq(googleCalendarAuth.id, ID_FIXO)).limit(1);
    if (!linhas[0]) return { conectado: false };
    return { conectado: true, conectadoEm: linhas[0].conectadoEm };
  } catch {
    return { conectado: false };
  }
}

export async function desconectarGoogleAgenda(): Promise<void> {
  await db.delete(googleCalendarAuth).where(eq(googleCalendarAuth.id, ID_FIXO));
}

export interface PeriodoOcupado {
  inicio: string;
  fim: string;
}

export async function buscarPeriodosOcupados(dataInicio: string, dataFim: string): Promise<PeriodoOcupado[] | null> {
  const token = await obterTokenValido();
  if (!token) return null;

  try {
    const linhas = await db.select().from(googleCalendarAuth).where(eq(googleCalendarAuth.id, ID_FIXO)).limit(1);
    const calendarId = linhas[0]?.calendarId || "primary";

    const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        timeMin: `${dataInicio}T00:00:00-03:00`,
        timeMax: `${dataFim}T23:59:59-03:00`,
        items: [{ id: calendarId }],
      }),
    });
    const json = await res.json() as any;
    if (!res.ok) {
      console.error("Erro ao consultar freebusy do Google Agenda:", res.status, JSON.stringify(json).slice(0, 300));
      return null;
    }
    const busy = json.calendars?.[calendarId]?.busy || [];
    return busy.map((b: any) => ({ inicio: b.start, fim: b.end }));
  } catch (err) {
    console.error("Erro ao buscar periodos ocupados do Google Agenda:", err);
    return null;
  }
}

export function horarioColideComOcupados(
  data: string,
  horario: string,
  duracaoMinutos: number,
  ocupados: PeriodoOcupado[],
): boolean {
  const inicioSlot = new Date(`${data}T${horario}:00-03:00`).getTime();
  const fimSlot = inicioSlot + duracaoMinutos * 60 * 1000;

  return ocupados.some((p) => {
    const inicioOcupado = new Date(p.inicio).getTime();
    const fimOcupado = new Date(p.fim).getTime();
    return inicioSlot < fimOcupado && fimSlot > inicioOcupado;
  });
}
