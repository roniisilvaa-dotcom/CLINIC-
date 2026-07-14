import whatsappRouter from '../src/routes/whatsapp.js';
import whatsappEvolutionRouter from '../src/routes/whatsappEvolution.js';
import remarketingRouter from '../src/routes/remarketing.js';
import adminResetRouter from '../src/routes/adminReset.js';
import express from "express";
import { GoogleGenAI } from "@google/genai";
import { db } from "../src/db/index.js";
import {
  pacientes,
  consultas,
  exames,
  galeria,
  agendaEventos,
  filaEspera,
  pacotesVendidos,
  users,
    prescricoesTemplates,
  transacoesFinanceiras,
} from "../src/db/schema.js";
import { eq, sql } from "drizzle-orm";

const app = express();
// Captura o corpo raw da requisição (necessário pra validar a assinatura X-Hub-Signature-256
// que a Meta envia em todo POST /api/whatsapp/webhook — ver src/services/metaWhatsappService.ts)
app.use(express.json({
    limit: "25mb",
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  },
}));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Migracao automatica e idempotente: garante a coluna "tags" em pacientes (pedido do Igor)
db.execute(sql`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb`).catch((e) => console.error("Migracao tags falhou:", e));

// Migracao automatica: cria a tabela de templates de prescricoes e semeia com a biblioteca padrao
db.execute(sql`CREATE TABLE IF NOT EXISTS prescricoes_templates (
  id text PRIMARY KEY,
    titulo text NOT NULL,
      diagnostico_ref text,
        categoria text NOT NULL,
          medicamentos text,
            procedimentos text,
              suplementacao text,
                cosmeticos text
                )`).then(async () => {
    const existentes = await db.select().from(prescricoesTemplates).limit(1);
    if (existentes.length === 0) {
          await db.insert(prescricoesTemplates).values([
            { id: "temp-1", titulo: "AAG Feminina Classica (Ludwig I e II)", diagnosticoRef: "Alopecia Androgenetica Feminina (FPHL)", categoria: "Medicamentoso", medicamentos: "Minoxidil oral 0.5mg a noite.\nEspironolactona 50mg pela manha.", procedimentos: "MMP Capilar quinzenal ou mensal.\nLaser de Baixa Potencia diario (Helmet).", suplementacao: "Silicio Organico 100mg + Biotina 5mg + L-Cistina 100mg.", cosmeticos: "Xampu antiqueda fitoterapico (Ginkgo Biloba e Cafeina).\nLocao tonica capilar com Capixyl aplicada a noite." },
            { id: "temp-2", titulo: "AGA Masculina Estagio IV (Hamilton-Norwood)", diagnosticoRef: "Alopecia Androgenetica Masculina (AGA)", categoria: "Procedimentos", medicamentos: "Dutasterida 0.5mg a noite.\nMinoxidil oral 2.5mg pela manha.", procedimentos: "Microagulhamento Capilar Robotico mensal com Drug Delivery de Dutasterida e Fatores de Crescimento.", suplementacao: "Zinco quelato 30mg + Saw Palmetto extract 320mg a noite.", cosmeticos: "Xampu de Limpeza Seborregulador com Cetoconazol 2%." },
            { id: "temp-3", titulo: "Efluvio Agudo Pos-Dengue ou Pos-Parto", diagnosticoRef: "Efluvio Telogeno Agudo", categoria: "Suplementação", medicamentos: "Evitar bloqueadores hormonais se houver lactacao.", procedimentos: "Laser terapeutico capilar de Baixa Potencia semanal em consultorio.", suplementacao: "Ferro Quelato 60mg + Vitamina D 5.000 UI diario + Omega 3 1g pos almoco.\nMetilfolato 1mg e Biotina 5mg.", cosmeticos: "Xampu suave com Pantenol e oleos essenciais remineralizantes." },
            { id: "temp-4", titulo: "Dermatite Seborreica Ativa com Eritema", diagnosticoRef: "Dermatite Seborreica", categoria: "Cuidados Domiciliares", medicamentos: "Corticoide capilar em emulsao suave (maximo 5 dias se coceira cronica).", procedimentos: "Peeling capilar acido com acido salicilico 2% em consultorio.", suplementacao: "Zinco Quelado 30mg + Vitamina B6 50mg + L-Metionina 100mg pos-almoco.", cosmeticos: "Xampu de Cetoconazol alternado com Xampu de Piritionato de Zinco 1.5%." }
                ]);
    }
}).catch((e) => console.error("Migracao prescricoes falhou:", e));

// Migracao automatica: cria a tabela de transacoes financeiras (faturamento e caixa)
db.execute(sql`CREATE TABLE IF NOT EXISTS transacoes_financeiras (
id text PRIMARY KEY,
paciente_id text NOT NULL,
paciente_nome text NOT NULL,
data text NOT NULL,
descricao text NOT NULL,
valor double precision NOT NULL,
metodo text NOT NULL,
status text NOT NULL,
unidade text NOT NULL
)`).catch((e) => console.error("Migracao transacoes falhou:", e));

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

// ─── Prescricoes (biblioteca de templates) ────────────────────────────────────
    app.get("/api/prescricoes", async (_req, res) => {
        try {
              const result = await db.select().from(prescricoesTemplates);
              res.json(result);
        } catch (e: any) {
              res.status(500).json({ error: e.message });
        }
    });

    app.post("/api/prescricoes", async (req, res) => {
        try {
              const result = await db.insert(prescricoesTemplates).values(req.body).returning();
              res.json(result[0]);
        } catch (e: any) {
              res.status(500).json({ error: e.message });
        }
    });

    app.put("/api/prescricoes/:id", async (req, res) => {
        try {
              const result = await db.update(prescricoesTemplates).set(req.body).where(eq(prescricoesTemplates.id, req.params.id)).returning();
              res.json(result[0]);
        } catch (e: any) {
              res.status(500).json({ error: e.message });
        }
    });

    app.delete("/api/prescricoes/:id", async (req, res) => {
        try {
              await db.delete(prescricoesTemplates).where(eq(prescricoesTemplates.id, req.params.id));
              res.json({ ok: true });
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

app.put("/api/pacotes/:id", async (req, res) => {
  try {
    const result = await db.update(pacotesVendidos).set(req.body).where(eq(pacotesVendidos.id, req.params.id)).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Faturamento (transacoes financeiras) ─────────────────────────────────────
app.get("/api/transacoes", async (req, res) => {
  try {
    const { pacienteId } = req.query;
    const result = pacienteId
    ? await db.select().from(transacoesFinanceiras).where(eq(transacoesFinanceiras.pacienteId, String(pacienteId)))
      : await db.select().from(transacoesFinanceiras);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/transacoes", async (req, res) => {
  try {
    const result = await db.insert(transacoesFinanceiras).values(req.body).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/transacoes/:id", async (req, res) => {
  try {
    const result = await db.update(transacoesFinanceiras).set(req.body).where(eq(transacoesFinanceiras.id, req.params.id)).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Auth (login simples) ────────────────────────────────────────────────────
function gerarToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    const result = await db.select().from(users).where(eq(users.email, email));
    if (!result.length) return res.status(401).json({ error: "E-mail nao encontrado" });
    const user = result[0];
    if (user.senhaHash !== senha) return res.status(401).json({ error: "Senha incorreta" });
    const token = gerarToken();
    await db.update(users).set({ sessionToken: token }).where(eq(users.id, user.id));
    res.json({ token, id: user.id, nome: user.nome, role: user.role });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return res.status(401).json({ error: "sem token" });
    const result = await db.select().from(users).where(eq(users.sessionToken, token));
    if (!result.length) return res.status(401).json({ error: "sessao invalida" });
    const user = result[0];
    res.json({ id: user.id, nome: user.nome, role: user.role, email: user.email });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (token) await db.update(users).set({ sessionToken: null }).where(eq(users.sessionToken, token));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
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
app.use('/api/whatsapp', whatsappEvolutionRouter);
app.use('/api/whatsapp', remarketingRouter);
app.use('/api/admin', adminResetRouter);

export default app;
