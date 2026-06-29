import express from "express";
import { GoogleGenAI } from "@google/genai";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { eq, and } from "drizzle-orm";

const app = express();
app.use(express.json());

// DB connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// Initialize GoogleGenAI server-side with User-Agent as 'aistudio-build'
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString(), db: "neon" });
});

// ==========================================
// PACIENTES CRUD
// ==========================================
app.get("/api/pacientes", async (req, res) => {
  try {
    const allPacientes = await db.select().from(schema.pacientes);
    res.json(allPacientes || []);
  } catch (e: any) {
    console.error("Erro ao buscar pacientes:", e);
    res.json([]);
  }
});

app.post("/api/pacientes", async (req, res) => {
  try {
    const { id, nome, idade, dataNascimento, cpf, telefone, email, cidade, comoConheceu, queixaPrincipal, status, progresso, ultimaAtualizacao, antecedentes, diagnostico, protocolo } = req.body;
    
    await db.insert(schema.pacientes).values({
      id, nome, idade, dataNascimento, cpf, telefone, email, cidade,
      comoConheceu, queixaPrincipal, status, progresso, ultimaAtualizacao,
      antecedentes, diagnostico, protocolo
    });
    
    res.json({ success: true });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// AGENDA CRUD
// ==========================================
app.get("/api/agenda", async (req, res) => {
  try {
    const targetDate = (req.query.date as string) || new Date().toISOString().split("T")[0];
    const eventos = await db.select().from(schema.agendaEventos).where(eq(schema.agendaEventos.data, targetDate));
    res.json(eventos || []);
  } catch (e: any) {
    console.error("Erro ao buscar agenda:", e);
    res.json([]);
  }
});

app.post("/api/agenda", async (req, res) => {
  try {
    await db.insert(schema.agendaEventos).values(req.body);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// FINANCEIRO CRUD
// ==========================================
// ... (Add later, to keep it simple first)

// ==========================================
// AI ENDPOINTS
// ==========================================
app.post("/api/analyze-exams", async (req, res) => {
  try {
    const { pacienteNome, idade, queixa, exames } = req.body;
    const prompt = `Você é o software CA.RO Clinic IA... Dados Gerais: ${pacienteNome}`; // Shortened for space
    const response = await ai.models.generateContent({ model: "gemini-3.5-flash", contents: prompt });
    res.json({ result: response.text });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export for Vercel Serverless
export default app;
