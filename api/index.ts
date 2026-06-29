import whatsappRouter from './whatsapp';
import express from "express";
import { GoogleGenAI } from "@google/genai";
import { db } from "../src/db/index";
import {
  pacientes,
  consultas,
  exames,
  galeria,
  agendaEventos,
  filaEspera,
  pacotesVendidos,
  users,
} from "../src/db/schema";
import { eq } from "drizzle-orm";

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// ─── Health ──────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ─── Pacientes ───────────────────────────────────────────────────────────────
app.get("/api/pacientes", async (_req, res) => {
  try {
    const result = await db.select().from(pacientes);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/pacientes/:id", async (req, res) => {
  try {
    const result = await db.select().from(pacientes).where(eq(pacientes.id, req.params.id));
    if (!result.length) return res.status(404).json({ error: "Paciente não encontrado" });
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/pacientes", async (req, res) => {
  try {
    const result = await db.insert(pacientes).values(req.body).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/pacientes/:id", async (req, res) => {
  try {
    const result = await db.update(pacientes).set(req.body).where(eq(pacientes.id, req.params.id)).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Consultas ───────────────────────────────────────────────────────────────
app.get("/api/consultas", async (req, res) => {
  try {
    const { pacienteId } = req.query;
    const result = pacienteId
      ? await db.select().from(consultas).where(eq(consultas.pacienteId, String(pacienteId)))
      : await db.select().from(consultas);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/consultas", async (req, res) => {
  try {
    const result = await db.insert(consultas).values(req.body).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Exames ──────────────────────────────────────────────────────────────────
app.get("/api/exames", async (req, res) => {
  try {
    const { pacienteId } = req.query;
    const result = pacienteId
      ? await db.select().from(exames).where(eq(exames.pacienteId, String(pacienteId)))
      : await db.select().from(exames);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/exames", async (req, res) => {
  try {
    const result = await db.insert(exames).values(req.body).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Galeria ─────────────────────────────────────────────────────────────────
app.get("/api/galeria", async (req, res) => {
  try {
    const { pacienteId } = req.query;
    const result = pacienteId
      ? await db.select().from(galeria).where(eq(galeria.pacienteId, String(pacienteId)))
      : await db.select().from(galeria);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/galeria", async (req, res) => {
  try {
    const result = await db.insert(galeria).values(req.body).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Agenda ──────────────────────────────────────────────────────────────────
app.get("/api/agenda", async (req, res) => {
  try {
    const { data } = req.query;
    const result = data
      ? await db.select().from(agendaEventos).where(eq(agendaEventos.data, String(data)))
      : await db.select().from(agendaEventos);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/agenda", async (req, res) => {
  try {
    const result = await db.insert(agendaEventos).values(req.body).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/agenda/:id", async (req, res) => {
  try {
    const result = await db.update(agendaEventos).set(req.body).where(eq(agendaEventos.id, req.params.id)).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Fila de Espera ──────────────────────────────────────────────────────────
app.get("/api/fila-espera", async (_req, res) => {
  try {
    const result = await db.select().from(filaEspera);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/fila-espera", async (req, res) => {
  try {
    const result = await db.insert(filaEspera).values(req.body).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Pacotes Vendidos ────────────────────────────────────────────────────────
app.get("/api/pacotes", async (req, res) => {
  try {
    const { pacienteId } = req.query;
    const result = pacienteId
      ? await db.select().from(pacotesVendidos).where(eq(pacotesVendidos.pacienteId, String(pacienteId)))
      : await db.select().from(pacotesVendidos);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/pacotes", async (req, res) => {
  try {
    const result = await db.insert(pacotesVendidos).values(req.body).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Auth (login simples) ────────────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  try {
    const { cpf, senha } = req.body;
    const result = await db.select().from(users).where(eq(users.cpf, cpf));
    if (!result.length) return res.status(401).json({ error: "CPF não encontrado" });
    const user = result[0];
    // Comparação simples — em produção usar bcrypt
    if (user.senhaHash !== senha) return res.status(401).json({ error: "Senha incorreta" });
    res.json({ id: user.id, nome: user.nome, role: user.role });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── IA: Análise de Exames ───────────────────────────────────────────────────
app.post("/api/analyze-exams", async (req, res) => {
  try {
    const { pacienteNome, idade, queixa, exames: examesData } = req.body;
    const prompt = `Você é o software CA.RO Clinic IA, assistente diagnóstico de precisão da Dra. Mariah Zibetti (CRM PR 57.133), especialista em Tricologia Médica e Capilar de Alto Padrão.
Instrução: Analise minuciosamente os resultados dos exames laboratoriais fornecidos. Faça uma avaliação à luz dos padrões estritos da tricologia.

Parâmetros Críticos de Referência em Tricologia Médica:
- Ferritina sérica ideal: > 70 ng/mL
- Vitamina D ideal: > 45 ng/mL
- Vitamina B12 ideal: > 400 pg/mL
- Zinco sérico ideal: > 80 ug/dL
- TSH ideal: 1.0 a 2.5 mIU/L

Dados do Paciente:
- Nome: ${pacienteNome}
- Idade: ${idade} anos
- Queixa: ${queixa}
- Exames: ${JSON.stringify(examesData)}

Gere um LAUDO CLÍNICO DE SUPORTE em Markdown com:
1. Resumo Executivo das Alterações
2. Análise Detalhada dos Marcadores
3. Raciocínio Fisiopatológico
4. Sugestão Nutracêutica / Terapêutica Personalizada

Assine como: "CA.RO Clinic IA | Inteligência Clínica de Precisão Capilar".`;

    const response = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: prompt });
    res.json({ result: response.text });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── IA: Análise de Fotos ────────────────────────────────────────────────────
app.post("/api/analyze-photos", async (req, res) => {
  try {
    const { pacienteNome, fotosInfo } = req.body;
    const prompt = `Você é o CA.RO Clinic IA, assistente de análise de evolução capilar para a Dra. Mariah Zibetti.
Analise a sequência cronológica de fotos: ${JSON.stringify(fotosInfo)}

Gere um Relatório de Evolução Capilar com:
1. Estimativa de redensificação capilar
2. Avaliação dermatoscópica
3. Sumário clínico: Excelente / Moderada / Necessita repactuação`;

    const response = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: prompt });
    res.json({ result: response.text });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── IA: Resumo de Consulta ──────────────────────────────────────────────────
app.post("/api/summarize-consultation", async (req, res) => {
  try {
    const { pacienteNome, queixaDoDia, evolucaoObservada, alteracoesProtocolo } = req.body;
    const prompt = `Gere um sumário clínico para o prontuário de ${pacienteNome}.
- Queixa: ${queixaDoDia}
- Evolução: ${evolucaoObservada}
- Alterações de protocolo: ${alteracoesProtocolo}

Seções: SINTOMATOLOGIA ATUAL / PROPEDÊUTICA E ANÁLISE COMPLEMENTAR / CONDUTA E ALTERAÇÕES TERAPÊUTICAS
Escreva em português médico formal.`;

    const response = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: prompt });
    res.json({ result: response.text });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── IA: Chat ────────────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, systemInstruction } = req.body;
    const formattedContents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : m.role,
      parts: [{ text: m.content }],
    }));
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: formattedContents,
      config: { systemInstruction: systemInstruction || "Você é o TRICO AI, copiloto clínico da Dra. Mariah Zibetti. Responda em português médico elegante." },
    });
    res.json({ text: response.text });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.use('/api/whatsapp', whatsappRouter);

export default app;
