/**
 * Rotas de integracao com o Google Agenda da Dra. Mariah -- ver
 * src/services/googleCalendarService.ts pra logica de OAuth2/freebusy.
 * Protegido pelo mesmo requireStaffLocal usado no resto do painel (nenhum
 * secret novo), exceto o /callback, que e chamado pelo proprio Google
 * (redirect apos a Dra. autorizar) e por isso nao carrega nosso Bearer token.
 */
import { Router } from "express";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import {
  googleCalendarConfigurado,
  gerarUrlAutorizacao,
  trocarCodePorToken,
  googleAgendaConectada,
  desconectarGoogleAgenda,
} from "../services/googleCalendarService.js";

const router = Router();

async function requireStaffLocal(req: any, res: any, next: any) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Autenticacao necessaria" });
    const result = await db.select().from(users).where(eq(users.sessionToken, token));
    if (!result.length) return res.status(401).json({ error: "Acesso restrito a equipe da clinica" });
    next();
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

router.get("/status", requireStaffLocal, async (req, res) => {
  try {
    const status = await googleAgendaConectada();
    res.json({ ...status, configurado: googleCalendarConfigurado() });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/auth-url", requireStaffLocal, async (req, res) => {
  if (!googleCalendarConfigurado()) {
    return res.status(400).json({ error: "Integracao com Google Agenda ainda nao foi configurada (faltam as variaveis de ambiente GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_REDIRECT_URI)." });
  }
  res.json({ url: gerarUrlAutorizacao() });
});

router.get("/callback", async (req, res) => {
  const code = req.query.code as string | undefined;
  const erro = req.query.error as string | undefined;
  if (erro) {
    return res.redirect(`/?google_agenda=erro&motivo=${encodeURIComponent(erro)}`);
  }
  if (!code) {
    return res.redirect(`/?google_agenda=erro&motivo=sem_codigo`);
  }
  try {
    await trocarCodePorToken(code);
    res.redirect(`/?google_agenda=conectado`);
  } catch (e: any) {
    console.error("Erro no callback do Google Agenda:", e);
    res.redirect(`/?google_agenda=erro&motivo=${encodeURIComponent(e.message || "desconhecido")}`);
  }
});

router.post("/disconnect", requireStaffLocal, async (req, res) => {
  try {
    await desconectarGoogleAgenda();
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
