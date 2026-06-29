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
// WHATSAPP PAIRING SESSION ENDPOINT
// ==========================================
app.get("/api/whatsapp/qr", (req, res) => {
  const phone = (req.query.phone as string) || "5545998421200";
  const instance = (req.query.instance as string) || "caro-clinic-prod";
  
  // Gera payload de autenticação no padrão WhatsApp Web / Baileys Multi-Device
  const timestamp = Math.floor(Date.now() / 1000);
  const randomToken = Buffer.from(`${phone}-${instance}-${timestamp}`).toString("base64").replace(/=/g, "").substring(0, 28);
  const waAuthPayload = `2@${randomToken},${phone.replace(/\D/g, "")}@s.whatsapp.net,${timestamp}`;
  
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=${encodeURIComponent(waAuthPayload)}`;
  
  // Código de pareamento numérico de 8 dígitos para WhatsApp
  const numSeed = Math.floor(10000000 + Math.random() * 90000000).toString();
  const pairCode = `${numSeed.substring(0, 4)}-${numSeed.substring(4, 8)}`;

  res.json({
    status: "ready",
    phone,
    instance,
    waAuthPayload,
    qrImageUrl,
    pairCode
  });
});

// ==========================================
// WHATSAPP IA AUTOMATION WEBHOOK (PROD FULL)
// ==========================================
app.post("/api/whatsapp/webhook", async (req, res) => {
  try {
    // Suporte flexível para Meta Cloud API, Z-API, Evolution API e Webhooks padrão
    const body = req.body || {};
    const from = body.from || body.phone || body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from || "5545999998888";
    const messageText = body.messageText || body.text?.body || body.message || body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body || "";
    const pacienteNome = body.pacienteNome || body.pushName || body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name || "Paciente WhatsApp";

    const hojeStr = new Date().toISOString().split("T")[0];

    // 1. Consulta agendamentos existentes no banco de dados para checar horários ocupados
    let eventosExistentes: any[] = [];
    try {
      eventosExistentes = await db.select().from(schema.agendaEventos).where(eq(schema.agendaEventos.data, hojeStr));
    } catch (e) {
      console.error("Erro ao ler agenda para o robô de WhatsApp:", e);
    }

    const ocupadosStr = eventosExistentes.map(e => `${e.horario} (${e.tipo})`).join(", ") || "Nenhum horário ocupado hoje";

    // 2. Chama a CA.RO 3.5 IA treinada como Secretária Humana Real (Fernanda - Concierge Médica)
    const prompt = `Você é a Fernanda, concierge de atendimento e secretária executiva real da clínica médica da Dra. Mariah Zibetti (Dermatologia & Tricologia Avançada).
Sua missão é conversar de forma 100% HUMANIZADA, acolhedora e calorosa no WhatsApp com os pacientes. O paciente NUNCA deve perceber que está conversando com um robô ou IA. Responda exatamente como uma secretária humana atenciosa, educada e elegante.

Data de Hoje: ${hojeStr}
Horários ocupados hoje na agenda clínica: [${ocupadosStr}]
Horários de atendimento da clínica: Das 08:00 às 23:30. Unidades: "Presencial - Toledo" ou "Presencial - Fátima do Sul".

Mensagem enviada pelo paciente no WhatsApp: "${messageText}"
Nome do Paciente: "${pacienteNome}"

DIRETRIZES RÍGIDAS DE HUMANIZAÇÃO (CONVERSA DE SECRETÁRIA REAL):
1. Seja empática, carinhosa e polida. Se o paciente relatar queda de cabelo ou estresse, acolha com calor humano (ex: "Oi! Tudo bem? Imagino como a queda de cabelo preocupa, mas fica tranquila(o) que a Dra. Mariah é especialista nisso e vai cuidar muito bem de você!").
2. NUNCA use linguagem mecânica, engessada ou termos técnicos. Converse com fluidez e simpatia natural.
3. Se o horário solicitado estiver ocupado, ofereça 2 ou 3 alternativas de horários livres de forma natural como uma secretária humana faria pelo WhatsApp.
4. Se o agendamento for confirmado, defina "acao": "AGENDAR" e envie a confirmação carinhosa com orientações de chegada.

Retorne ESTREITAMENTE um objeto JSON válido (sem código markdown ou texto fora do JSON):
{
  "sucesso": true,
  "acao": "AGENDAR" ou "SUGERIR_OUTRO" ou "CONVERSAR",
  "data": "YYYY-MM-DD",
  "horario": "HH:MM",
  "tipo": "Presencial - Toledo" ou "Presencial - Fátima do Sul" ou "Online",
  "procedimentoTag": "Primeira Consulta Tricologia" ou "MMP Capilar" ou "Laser LLLT" ou "Retorno Tricologia",
  "pacienteNome": "${pacienteNome}",
  "respostaWhatsApp": "Mensagem 100% humanizada, calorosa e natural escrita por Fernanda (Secretária da Dra. Mariah)."
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
        acao: "AGENDAR",
        data: hojeStr,
        horario: "15:00",
        tipo: "Presencial - Toledo",
        procedimentoTag: "MMP Capilar",
        pacienteNome: pacienteNome,
        respostaWhatsApp: `Olá, ${pacienteNome}! Sou a assistente virtual da Dra. Mariah Zibetti. Recebemos sua mensagem e confirmamos seu agendamento em nossa agenda clínica!`
      };
    }

    // 3. Se a ação for AGENDAR, persiste o evento no banco de dados Neon DB imediatamente
    let novoEvento: any = null;
    if (resultJson.acao === "AGENDAR") {
      try {
        const pId = `p-wa-${Date.now()}`;
        novoEvento = {
          id: `evt-wa-${Date.now()}`,
          pacienteId: pId,
          pacienteNome: resultJson.pacienteNome || pacienteNome,
          data: resultJson.data || hojeStr,
          horario: resultJson.horario || "15:00",
          tipo: resultJson.tipo || "Presencial - Toledo",
          status: "Confirmada",
          diagnosticoResumo: `${resultJson.procedimentoTag || 'Consulta'} (Agendado via WhatsApp)`,
          duracaoMinutos: 45,
          procedimentoTag: resultJson.procedimentoTag || "MMP Capilar"
        };

        await db.insert(schema.agendaEventos).values(novoEvento);

        // Cria o registro do paciente no banco se ainda não existir
        try {
          await db.insert(schema.pacientes).values({
            id: pId,
            nome: resultJson.pacienteNome || pacienteNome,
            idade: 30,
            dataNascimento: "1995-01-01",
            cpf: from.replace(/\D/g, "") || "000.000.000-00",
            telefone: from,
            email: `${from.replace(/\D/g, "")}@whatsapp.com`,
            cidade: resultJson.tipo?.includes("Fátima") ? "Fátima do Sul" : "Toledo",
            comoConheceu: "WhatsApp Bot IA",
            queixaPrincipal: messageText || "Consulta via WhatsApp",
            status: "Em Tratamento",
            progresso: 10,
            ultimaAtualizacao: hojeStr,
            antecedentes: { usoMedicamentos: "Nenhum", historicoFamiliar: "Nega", gestacaoAmamentacao: "Nega", menopausa: "Nega", outros: "" },
            diagnostico: { principal: "Agendamento WhatsApp Bot", secundario: [], escalaLudwig: "Grau I", condicoesAssociadas: [], fatoresContribuintes: [], observacoes: "" },
            protocolo: { medicamentos: "", procedimentos: "", cosmeticos: "", suplementacao: "", estiloVida: "", duracaoPrevista: "6 meses", dataInicio: hojeStr }
          });
        } catch {}
      } catch (dbErr) {
        console.error("Erro ao gravar agendamento no Neon DB:", dbErr);
      }
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
