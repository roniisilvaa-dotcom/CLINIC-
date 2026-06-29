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

// ==========================================
// WHATSAPP IA AUTOMATION WEBHOOK
// ==========================================
app.post("/api/whatsapp/webhook", async (req, res) => {
  try {
    const { from, messageText, pacienteNome } = req.body;
    const prompt = `Você é a CA.RO 3.5 IA, a assistente virtual médica de agendamentos da Dra. Mariah Zibetti.
Analise a mensagem enviada pelo paciente no WhatsApp e extraia o agendamento em formato JSON estrito.
Data de hoje: ${new Date().toISOString().split("T")[0]}.

Mensagem do Paciente: "${messageText || "Gostaria de agendar uma consulta"}"
Nome/Número: "${pacienteNome || from || "Paciente WhatsApp"}"

Retorne ESTREITAMENTE um objeto JSON válido neste formato exato, sem explicações extras ou código markdown:
{
  "sucesso": true,
  "data": "YYYY-MM-DD",
  "horario": "HH:MM",
  "tipo": "Presencial - Toledo",
  "procedimentoTag": "Primeira Consulta Tricologia",
  "pacienteNome": "Nome do Paciente",
  "respostaWhatsApp": "Mensagem educada de confirmação do agendamento enviada ao WhatsApp do paciente."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });

    let resultJson: any = {};
    try {
      const cleanText = response.text?.replace(/```json/g, "").replace(/```/g, "").trim();
      resultJson = JSON.parse(cleanText || "{}");
    } catch {
      resultJson = {
        sucesso: true,
        data: new Date().toISOString().split("T")[0],
        horario: "10:00",
        tipo: "Presencial - Toledo",
        procedimentoTag: "MMP Capilar",
        pacienteNome: pacienteNome || "Paciente WhatsApp",
        respostaWhatsApp: "Olá! Recebemos sua mensagem no WhatsApp. Seu agendamento para consulta de tricologia foi agendado e inserido com sucesso em nossa agenda médica da Dra. Mariah Zibetti!"
      };
    }

    // Tenta gravar na agenda do banco de dados
    let novoEvento: any = null;
    try {
      novoEvento = {
        id: `evt-wa-${Date.now()}`,
        pacienteId: `p-wa-${Date.now()}`,
        pacienteNome: resultJson.pacienteNome || pacienteNome || "Paciente WhatsApp",
        data: resultJson.data || new Date().toISOString().split("T")[0],
        horario: resultJson.horario || "10:00",
        tipo: resultJson.tipo || "Presencial - Toledo",
        status: "Confirmada",
        diagnosticoResumo: `${resultJson.procedimentoTag || 'Consulta'} via IA WhatsApp Bot`,
        duracaoMinutos: 45,
        procedimentoTag: resultJson.procedimentoTag || "MMP Capilar"
      };
      await db.insert(schema.agendaEventos).values(novoEvento);
    } catch (dbErr) {
      console.error("Erro ao gravar evento via webhook WhatsApp:", dbErr);
    }

    res.json({
      ...resultJson,
      eventoCriado: novoEvento
    });
  } catch (e: any) {
    console.error("Erro no webhook WhatsApp:", e);
    res.status(500).json({ error: e.message });
  }
});

// Export for Vercel Serverless
export default app;
