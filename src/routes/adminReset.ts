import express from "express";
import { db } from "../db/index.js";
import { conversasWhatsapp, agendaEventos, pacientes } from "../db/schema.js";
import { like } from "drizzle-orm";

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
export default router;
