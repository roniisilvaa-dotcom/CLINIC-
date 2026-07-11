import express from "express";
import { db } from "../db/index.js";
import { conversasWhatsapp, agendaEventos, pacientes, users } from "../db/schema.js";
import { like, sql } from "drizzle-orm";

const router = express.Router();
const ADMIN_TOKEN = process.env.ADMIN_RESET_TOKEN || "";

router.post("/reset-test-data", async (req, res) => {
  if (!ADMIN_TOKEN || req.headers.authorization !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ ok: false, erro: "unauthorized" });
  }
  try {
    await db.delete(conversasWhatsapp);
    await db.delete(agendaEventos).where(like(agendaEventos.pacienteId, "wpp_%"));
    await db.delete(pacientes).where(like(pacientes.id, "wpp_%"));
    res.json({ ok: true });
  } catch (err) {
    console.error("Erro reset-test-data:", err);
    res.status(500).json({ ok: false });
  }
});

router.post("/setup-auth", async (req, res) => {
  if (!ADMIN_TOKEN || req.headers.authorization !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ ok: false, erro: "unauthorized" });
  }
  const { email, senha, nome } = req.body || {};
  if (!email || !senha) {
    return res.status(400).json({ ok: false, erro: "email e senha sao obrigatorios no body" });
  }
  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email text`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS session_token text`);
    await db.delete(users).where(sql`${users.id} = 'medica-mariah'`);
    await db.insert(users).values({
      id: "medica-mariah",
      role: "medica",
      nome: nome || "Dra. Mariah Zibetti",
      cpf: "medica-mariah-cpf",
      senhaHash: senha,
      email,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("Erro setup-auth:", err);
    res.status(500).json({ ok: false, erro: String(err) });
  }
});
