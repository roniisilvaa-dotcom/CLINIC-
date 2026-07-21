import whatsappRouter from '../src/routes/whatsapp.js';
import whatsappEvolutionRouter from '../src/routes/whatsappEvolution.js';
import remarketingRouter from '../src/routes/remarketing.js';
import lembretesRouter from '../src/routes/lembretes.js';
import adminResetRouter from '../src/routes/adminReset.js';
import importSupportClinicRouter from '../src/routes/importSupportClinic.js';
import googleCalendarRouter from '../src/routes/googleCalendar.js';
import express from "express";
import crypto from "crypto";
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
  diasAtendimento,
  bloqueiosAgenda,
  configuracoesIa,
} from "../src/db/schema.js";
import { eq, sql } from "drizzle-orm";
import { hashSenha, verificarSenha, senhaEstaEmTextoPuro } from "../src/lib/senha.js";
import { getConfigIa } from "../src/services/iaSecretaria.js";

const app = express();

// Captura o corpo raw da requisição (necessário pra validar a assinatura X-Hub-Signature-256
// que a Meta envia em todo POST /api/whatsapp/webhook — ver src/services/metaWhatsappService.ts)
app.use(express.json({
  limit: "25mb",
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  },
}));

// ─── IA gratuita (Groq — Llama 3.3 70B) ───────────────────────────────────────
// Trocamos o Gemini pelo Groq: a chave do Gemini estava com cota zero no tier
// gratuito (erro 429 RESOURCE_EXHAUSTED em produção). Groq oferece um tier
// gratuito generoso pra inferência de LLM (sem cartão de crédito), então usamos
// aqui só pros recursos internos (IA Assistente, resumo de consulta, análise de
// exames/fotos) — sem custo. A IA do WhatsApp (iaSecretaria.ts) continua na
// Claude API, que já é paga separadamente pra esse fim.
async function groqGenerate(prompt: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }
  const data: any = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function groqChat(messages: { role: string; content: string }[], systemInstruction?: string): Promise<string> {
  const groqMessages = [
    { role: "system", content: systemInstruction || "Você é o TRICO AI, copiloto clínico da Dra. Mariah Zibetti. Responda em português médico elegante." },
    ...messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
  ];
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: groqMessages,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }
  const data: any = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// Migracao automatica e idempotente: garante a coluna "tags" em pacientes (pedido do Igor)
db.execute(sql`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb`).catch((e) => console.error("Migracao tags falhou:", e));

// Migracao automatica: garante a coluna "horario" em galeria (fotos com data + hora exata)
db.execute(sql`ALTER TABLE galeria ADD COLUMN IF NOT EXISTS horario text`).catch((e) => console.error("Migracao galeria.horario falhou:", e));

// Migracao automatica: garante a coluna "session_token" em pacientes — permite que o
// login por CPF (/api/auth/paciente-login) emita uma sessao real, do mesmo jeito que
// a medica ja tinha, em vez do paciente ficar sem token nenhum (ver requireStaffOrOwnPaciente).
db.execute(sql`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS session_token text`).catch((e) => console.error("Migracao pacientes.session_token falhou:", e));

// Migracao automatica: garante a coluna "lembretes_enviados" em agenda_eventos — controla
// quais etapas de lembrete de consulta (5d, 2d, 1d, 3h) ja foram enviadas via WhatsApp,
// pra nao mandar o mesmo lembrete duas vezes (ver src/routes/lembretes.ts).
db.execute(sql`ALTER TABLE agenda_eventos ADD COLUMN IF NOT EXISTS lembretes_enviados jsonb DEFAULT '[]'::jsonb`).catch((e) => console.error("Migracao agenda_eventos.lembretes_enviados falhou:", e));

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

// Migracao automatica: cria a tabela de contatos com a IA pausada manualmente pela
// Dra./equipe (persistente no banco, nao so em memoria) — ver /api/whatsapp/pausar
// e /api/whatsapp/retomar em src/routes/whatsapp.ts.
db.execute(sql`CREATE TABLE IF NOT EXISTS whatsapp_silenciados (
  telefone text PRIMARY KEY,
  motivo text,
  criado_em text NOT NULL
)`).catch((e) => console.error("Migracao whatsapp_silenciados falhou:", e));

// Migracao automatica: cria a tabela de dias de atendimento presencial (Toledo ou
// Fatima do Sul, cadastro manual via calendario clicavel no painel). A IA do
// WhatsApp so oferece horario de consulta nos dias marcados como Toledo, ver
// checkAvailability() em src/services/whatsappCore.ts. "horarios" (jsonb) permite
// customizar o horario de um dia especifico; null = usa o padrao da clinica.
db.execute(sql`CREATE TABLE IF NOT EXISTS dias_atendimento (
  id text PRIMARY KEY,
  local text NOT NULL,
  data text NOT NULL,
  horarios jsonb,
  criado_em text NOT NULL
)`).catch((e) => console.error("Migracao dias_atendimento falhou:", e));

// Migracao automatica: bloqueios de agenda (fins de semana recorrentes ou datas
// especificas como feriados/viagens). Tem prioridade sobre dias_atendimento —
// ver checkAvailability() em src/services/whatsappCore.ts.
db.execute(sql`CREATE TABLE IF NOT EXISTS bloqueios_agenda (
  id text PRIMARY KEY,
  tipo text NOT NULL,
  dia_semana integer,
  data text,
  motivo text,
  criado_em text NOT NULL
)`).catch((e) => console.error("Migracao bloqueios_agenda falhou:", e));

// Migracao automatica: configuracoes editaveis da IA pelo painel (precos, chave
// Pix, instrucoes extras — o "ensinar a IA"). Ver getConfigIa() em
// src/services/iaSecretaria.ts.
db.execute(sql`CREATE TABLE IF NOT EXISTS configuracoes_ia (
  id text PRIMARY KEY,
  valor text NOT NULL,
  atualizado_em text NOT NULL
)`).catch((e) => console.error("Migracao configuracoes_ia falhou:", e));

// ─── Autenticacao / autorizacao ───────────────────────────────────────────────
//
// Existem dois tipos de sessao, guardadas em tabelas diferentes mas com o
// mesmo mecanismo (token aleatorio de 32 bytes no header "Authorization: Bearer <token>"):
// - "staff" (medica ou dev): token fica em users.sessionToken (/api/auth/login, /api/auth/dev-login)
// - "paciente": token fica em pacientes.sessionToken (/api/auth/paciente-login)
//
// resolveAuth() descobre quem é o dono do token (se houver e for valido).
async function resolveAuth(req: any): Promise<{ kind: "staff"; id: string; role: string; nome: string } | { kind: "paciente"; id: string; nome: string } | null> {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;

  const staff = await db.select().from(users).where(eq(users.sessionToken, token));
  if (staff.length) {
    const u = staff[0];
    return { kind: "staff", id: u.id, role: u.role, nome: u.nome };
  }

  const pac = await db.select({ id: pacientes.id, nome: pacientes.nome }).from(pacientes).where(eq(pacientes.sessionToken, token));
  if (pac.length) return { kind: "paciente", id: pac[0].id, nome: pac[0].nome };

  return null;
}

// Exige qualquer sessao valida (medica, dev ou paciente).
async function requireAuth(req: any, res: any, next: any) {
  try {
    const auth = await resolveAuth(req);
    if (!auth) return res.status(401).json({ error: "Autenticacao necessaria" });
    req.auth = auth;
    next();
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

// Exige sessao de equipe da clinica (medica ou dev) — usado nas rotas que listam
// ou alteram dados de varios pacientes de uma vez (nao faz sentido escopar por paciente).
async function requireStaff(req: any, res: any, next: any) {
  try {
    const auth = await resolveAuth(req);
    if (!auth || auth.kind !== "staff") return res.status(401).json({ error: "Acesso restrito a equipe da clinica" });
    req.auth = auth;
    next();
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

// Exige sessao de equipe OU do proprio paciente dono do recurso. `getPacienteId`
// extrai o id do paciente sendo acessado a partir do request (query ou params) —
// se nao houver id explicito, so equipe pode passar (paciente nunca acessa "tudo").
function requireStaffOrOwnPaciente(getPacienteId: (req: any) => string | undefined) {
  return async (req: any, res: any, next: any) => {
    try {
      const auth = await resolveAuth(req);
      if (!auth) return res.status(401).json({ error: "Autenticacao necessaria" });
      if (auth.kind === "staff") { req.auth = auth; return next(); }
      const pacienteId = getPacienteId(req);
      if (pacienteId && pacienteId === auth.id) { req.auth = auth; return next(); }
      return res.status(403).json({ error: "Acesso negado" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };
}

// ─── Health ──────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ─── Pacientes ───────────────────────────────────────────────────────────────
app.get("/api/pacientes", requireStaff, async (_req, res) => {
  try {
    const result = await db.select().from(pacientes);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/pacientes/:id", requireStaffOrOwnPaciente((req) => req.params.id), async (req, res) => {
  try {
    const result = await db.select().from(pacientes).where(eq(pacientes.id, req.params.id));
    if (!result.length) return res.status(404).json({ error: "Paciente não encontrado" });
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/pacientes", requireStaff, async (req, res) => {
  try {
    const result = await db.insert(pacientes).values(req.body).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/pacientes/:id", requireStaff, async (req, res) => {
  try {
    const result = await db.update(pacientes).set(req.body).where(eq(pacientes.id, req.params.id)).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/pacientes/:id", requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(consultas).where(eq(consultas.pacienteId, id));
    await db.delete(exames).where(eq(exames.pacienteId, id));
    await db.delete(galeria).where(eq(galeria.pacienteId, id));
    await db.delete(agendaEventos).where(eq(agendaEventos.pacienteId, id));
    await db.delete(pacotesVendidos).where(eq(pacotesVendidos.pacienteId, id));
    await db.delete(filaEspera).where(eq(filaEspera.pacienteId, id));
    await db.delete(pacientes).where(eq(pacientes.id, id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Consultas ───────────────────────────────────────────────────────────────
app.get("/api/consultas", requireStaffOrOwnPaciente((req) => req.query.pacienteId ? String(req.query.pacienteId) : undefined), async (req, res) => {
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

app.post("/api/consultas", requireStaff, async (req, res) => {
  try {
    const result = await db.insert(consultas).values(req.body).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Exames ──────────────────────────────────────────────────────────────────
app.get("/api/exames", requireStaffOrOwnPaciente((req) => req.query.pacienteId ? String(req.query.pacienteId) : undefined), async (req, res) => {
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

app.post("/api/exames", requireStaff, async (req, res) => {
  try {
    const result = await db.insert(exames).values(req.body).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Prescricoes (biblioteca de templates) ────────────────────────────────────
app.get("/api/prescricoes", requireStaff, async (_req, res) => {
  try {
    const result = await db.select().from(prescricoesTemplates);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/prescricoes", requireStaff, async (req, res) => {
  try {
    const result = await db.insert(prescricoesTemplates).values(req.body).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/prescricoes/:id", requireStaff, async (req, res) => {
  try {
    const result = await db.update(prescricoesTemplates).set(req.body).where(eq(prescricoesTemplates.id, req.params.id)).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/prescricoes/:id", requireStaff, async (req, res) => {
  try {
    await db.delete(prescricoesTemplates).where(eq(prescricoesTemplates.id, req.params.id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Galeria ─────────────────────────────────────────────────────────────────
app.get("/api/galeria", requireStaffOrOwnPaciente((req) => req.query.pacienteId ? String(req.query.pacienteId) : undefined), async (req, res) => {
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

app.post("/api/galeria", requireStaff, async (req, res) => {
  try {
    const result = await db.insert(galeria).values(req.body).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/galeria/:id", requireStaff, async (req, res) => {
  try {
    await db.delete(galeria).where(eq(galeria.id, req.params.id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Agenda ──────────────────────────────────────────────────────────────────
app.get("/api/agenda", requireStaff, async (req, res) => {
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

app.post("/api/agenda", requireStaff, async (req, res) => {
  try {
    const result = await db.insert(agendaEventos).values(req.body).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/agenda/:id", requireStaff, async (req, res) => {
  try {
    const result = await db.update(agendaEventos).set(req.body).where(eq(agendaEventos.id, req.params.id)).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Dias de Atendimento (calendário clicável usado pela IA em Toledo) ───────
// A Dra./equipe marca no calendário do painel (aba Configurar) os dias em que ela
// vai atender presencialmente — em Toledo ou em Fátima do Sul. A IA do WhatsApp
// só usa os dias marcados como Toledo pra agendar sozinha (ver checkAvailability()
// em src/services/whatsappCore.ts); Fátima do Sul fica registrado aqui só pra
// controle da própria Dra./equipe, sem agendamento automático por enquanto.
app.get("/api/agenda/dias-atendimento", requireStaff, async (req, res) => {
  try {
    const { local } = req.query;
    const result = local
      ? await db.select().from(diasAtendimento).where(eq(diasAtendimento.local, String(local)))
      : await db.select().from(diasAtendimento);
    res.json(result.sort((a, b) => a.data.localeCompare(b.data)));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Marca um dia como dia de atendimento — clique num dia vazio do calendário.
// Idempotente: clicar de novo num dia já marcado não duplica (onConflictDoNothing
// na chave `${local}::${data}`).
app.post("/api/agenda/dias-atendimento", requireStaff, async (req, res) => {
  try {
    const local = String(req.body?.local || "").trim();
    const data = String(req.body?.data || "").trim();
    if (!local || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return res.status(400).json({ error: "local e data (AAAA-MM-DD) são obrigatórios" });
    }
    const id = `${local}::${data}`;
    await db.insert(diasAtendimento).values({
      id,
      local,
      data,
      horarios: null,
      criadoEm: new Date().toISOString(),
    }).onConflictDoNothing();
    const result = await db.select().from(diasAtendimento).where(eq(diasAtendimento.id, id)).limit(1);
    res.json(result[0] || { id, local, data, horarios: null });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Customiza (ou reseta, mandando horarios: null) os horários de UM dia já
// marcado — clique num dia do painel de dias escolhidos pra ajustar só aquele dia.
app.put("/api/agenda/dias-atendimento/:id", requireStaff, async (req, res) => {
  try {
    const horarios = Array.isArray(req.body?.horarios) ? req.body.horarios : null;
    const result = await db.update(diasAtendimento).set({ horarios }).where(eq(diasAtendimento.id, req.params.id)).returning();
    if (!result.length) return res.status(404).json({ error: "Dia não encontrado" });
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Desmarca um dia — clique num dia já marcado no calendário/painel.
app.delete("/api/agenda/dias-atendimento/:id", requireStaff, async (req, res) => {
  try {
    await db.delete(diasAtendimento).where(eq(diasAtendimento.id, req.params.id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Bloqueios de Agenda (fins de semana recorrentes + feriados/datas) ────────
// Tem prioridade sobre dias_atendimento: mesmo que um dia esteja marcado como
// disponível, se bater um bloqueio a IA nunca oferece esse dia (ver
// checkAvailability() em src/services/whatsappCore.ts).
app.get("/api/agenda/bloqueios", requireStaff, async (req, res) => {
  try {
    const result = await db.select().from(bloqueiosAgenda);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Cria um bloqueio — tipo "semana" (diaSemana 0-6, recorrente) ou "data" (uma
// data específica AAAA-MM-DD). Idempotente na chave (onConflictDoNothing).
app.post("/api/agenda/bloqueios", requireStaff, async (req, res) => {
  try {
    const tipo = String(req.body?.tipo || "").trim();
    const motivo = req.body?.motivo ? String(req.body.motivo).trim() : null;
    if (tipo === "semana") {
      const diaSemana = Number(req.body?.diaSemana);
      if (!Number.isInteger(diaSemana) || diaSemana < 0 || diaSemana > 6) {
        return res.status(400).json({ error: "diaSemana deve ser um número de 0 (domingo) a 6 (sábado)" });
      }
      const id = `semana::${diaSemana}`;
      await db.insert(bloqueiosAgenda).values({ id, tipo, diaSemana, data: null, motivo, criadoEm: new Date().toISOString() }).onConflictDoNothing();
      const result = await db.select().from(bloqueiosAgenda).where(eq(bloqueiosAgenda.id, id)).limit(1);
      return res.json(result[0] || { id, tipo, diaSemana, motivo });
    }
    if (tipo === "data") {
      const data = String(req.body?.data || "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return res.status(400).json({ error: "data (AAAA-MM-DD) é obrigatória" });
      }
      const id = `data::${data}`;
      await db.insert(bloqueiosAgenda).values({ id, tipo, diaSemana: null, data, motivo, criadoEm: new Date().toISOString() }).onConflictDoNothing();
      const result = await db.select().from(bloqueiosAgenda).where(eq(bloqueiosAgenda.id, id)).limit(1);
      return res.json(result[0] || { id, tipo, data, motivo });
    }
    res.status(400).json({ error: "tipo deve ser 'semana' ou 'data'" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/agenda/bloqueios/:id", requireStaff, async (req, res) => {
  try {
    await db.delete(bloqueiosAgenda).where(eq(bloqueiosAgenda.id, req.params.id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Configurações da IA (Fase 2 — preços, chave Pix e instruções extras) ────
// Permite a Dra./equipe mudar valores e "ensinar" regras extras pra Eduarda
// direto pelo painel, sem precisar pedir alteração de código. Ver getConfigIa()
// e montarSystemPrompt() em src/services/iaSecretaria.ts — quem realmente lê e
// aplica essas configs em toda conversa da IA.
app.get("/api/config-ia", requireStaff, async (_req, res) => {
  try {
    const cfg = await getConfigIa();
    res.json(cfg);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/config-ia", requireStaff, async (req, res) => {
  try {
    const CHAVES_PERMITIDAS = ["valorSinal", "valorConsulta", "chavePix", "instrucoesExtras"];
    const agora = new Date().toISOString();
    for (const chave of CHAVES_PERMITIDAS) {
      if (req.body?.[chave] === undefined) continue;
      const valor = String(req.body[chave]);
      await db.insert(configuracoesIa)
        .values({ id: chave, valor, atualizadoEm: agora })
        .onConflictDoUpdate({ target: configuracoesIa.id, set: { valor, atualizadoEm: agora } });
    }
    const cfg = await getConfigIa(true);
    res.json(cfg);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Fila de Espera ──────────────────────────────────────────────────────────
app.get("/api/fila-espera", requireStaff, async (_req, res) => {
  try {
    const result = await db.select().from(filaEspera);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/fila-espera", requireStaff, async (req, res) => {
  try {
    const result = await db.insert(filaEspera).values(req.body).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Pacotes Vendidos ────────────────────────────────────────────────────────
app.get("/api/pacotes", requireStaff, async (req, res) => {
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

app.post("/api/pacotes", requireStaff, async (req, res) => {
  try {
    const result = await db.insert(pacotesVendidos).values(req.body).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/pacotes/:id", requireStaff, async (req, res) => {
  try {
    const result = await db.update(pacotesVendidos).set(req.body).where(eq(pacotesVendidos.id, req.params.id)).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Faturamento (transacoes financeiras) ─────────────────────────────────────
app.get("/api/transacoes", requireStaff, async (req, res) => {
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

app.post("/api/transacoes", requireStaff, async (req, res) => {
  try {
    const result = await db.insert(transacoesFinanceiras).values(req.body).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/transacoes/:id", requireStaff, async (req, res) => {
  try {
    const result = await db.update(transacoesFinanceiras).set(req.body).where(eq(transacoesFinanceiras.id, req.params.id)).returning();
    res.json(result[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/transacoes/:id", requireStaff, async (req, res) => {
  try {
    await db.delete(transacoesFinanceiras).where(eq(transacoesFinanceiras.id, req.params.id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Auth (login simples) ────────────────────────────────────────────────────
function gerarToken() {
  // Antes usava Math.random() + Date.now() (previsível/não-criptográfico).
  // Agora gera 32 bytes aleatórios de fonte criptográfica real.
  return crypto.randomBytes(32).toString("hex");
}

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    const result = await db.select().from(users).where(eq(users.email, email));
    if (!result.length) return res.status(401).json({ error: "E-mail nao encontrado" });
    const user = result[0];
    if (!verificarSenha(senha, user.senhaHash)) return res.status(401).json({ error: "Senha incorreta" });

    // Migração transparente: se a senha ainda estava salva em texto puro (formato
    // antigo), re-hasheia e salva no formato novo agora que sabemos que está correta.
    if (senhaEstaEmTextoPuro(user.senhaHash)) {
      await db.update(users).set({ senhaHash: hashSenha(senha) }).where(eq(users.id, user.id));
    }

    const token = gerarToken();
    await db.update(users).set({ sessionToken: token }).where(eq(users.id, user.id));
    res.json({ token, id: user.id, nome: user.nome, role: user.role });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Login de paciente por CPF: valida no servidor e devolve só {id, nome, token} do
// paciente encontrado. Antes, o app baixava a lista COMPLETA de pacientes
// (CPF, diagnóstico, exames, tudo) pro navegador de QUALQUER visitante, mesmo
// sem fazer login, só pra permitir essa checagem no lado do cliente — qualquer
// pessoa que abrisse o site conseguia ver os dados de todos os pacientes pelo
// DevTools. Agora a checagem acontece aqui no servidor, e nada sensível sai
// dele além do id e nome da própria pessoa que está entrando. O token devolvido
// (salvo em pacientes.sessionToken) é o que permite esse paciente ver só os
// PRÓPRIOS dados depois — ver requireStaffOrOwnPaciente.
app.post("/api/auth/paciente-login", async (req, res) => {
  try {
    const cpfLimpo = String(req.body?.cpf || "").replace(/\D/g, "");
    if (cpfLimpo.length !== 11) return res.status(400).json({ error: "CPF inválido" });
    const todos = await db.select({ id: pacientes.id, nome: pacientes.nome, cpf: pacientes.cpf }).from(pacientes);
    const found = todos.find((p) => (p.cpf || "").replace(/\D/g, "") === cpfLimpo);
    if (!found) return res.status(404).json({ error: "CPF não encontrado. Verifique com a clínica." });
    const token = gerarToken();
    await db.update(pacientes).set({ sessionToken: token }).where(eq(pacientes.id, found.id));
    res.json({ id: found.id, nome: found.nome, token });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Login de desenvolvedor por PIN: antes o PIN ficava numa variável VITE_DEV_PIN,
// que o Vite empacota no JS do navegador — qualquer pessoa inspecionando o site
// (DevTools > Sources) conseguia ler o PIN direto do bundle, sem nem precisar
// tentar adivinhar. Agora a checagem acontece só aqui no servidor: o valor
// nunca é enviado pro navegador, só o resultado (sim/não + token de sessão).
app.post("/api/auth/dev-login", async (req, res) => {
  try {
    const pin = String(req.body?.pin || "");
    const devPin = process.env.DEV_PIN || process.env.VITE_DEV_PIN || "";
    if (!devPin || pin !== devPin) return res.status(401).json({ error: "PIN incorreto." });

    // Reaproveita a tabela "users" (que já tem sessionToken e o mecanismo de
    // requireStaff pronto) pra guardar a sessão do console de desenvolvedor —
    // ninguém loga com senha nessa conta, ela só existe pra segurar o token.
    const existente = await db.select().from(users).where(eq(users.id, "dev-console"));
    if (!existente.length) {
      await db.insert(users).values({
        id: "dev-console",
        role: "dev",
        nome: "Desenvolvedor",
        cpf: "dev-console-sem-cpf",
        senhaHash: hashSenha(crypto.randomBytes(24).toString("hex")),
        email: null,
      });
    }
    const token = gerarToken();
    await db.update(users).set({ sessionToken: token }).where(eq(users.id, "dev-console"));
    res.json({ token, role: "dev", nome: "Desenvolvedor" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const auth = await resolveAuth(req);
    if (!auth) return res.status(401).json({ error: "sessao invalida" });
    if (auth.kind === "staff") {
      res.json({ id: auth.id, nome: auth.nome, role: auth.role });
    } else {
      res.json({ id: auth.id, nome: auth.nome, role: "paciente" });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (token) {
      await db.update(users).set({ sessionToken: null }).where(eq(users.sessionToken, token));
      await db.update(pacientes).set({ sessionToken: null }).where(eq(pacientes.sessionToken, token));
    }
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── IA: Análise de Exames (uso clínico da equipe — protegido pra evitar custo indevido de API) ──
app.post("/api/analyze-exams", requireStaff, async (req, res) => {
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
    const text = await groqGenerate(prompt);
    res.json({ result: text });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── IA: Análise de Fotos ────────────────────────────────────────────────────
app.post("/api/analyze-photos", requireStaff, async (req, res) => {
  try {
    const { pacienteNome, fotosInfo } = req.body;
    const prompt = `Você é o CA.RO Clinic IA, assistente de análise de evolução capilar para a Dra. Mariah Zibetti.

Analise a sequência cronológica de fotos: ${JSON.stringify(fotosInfo)}

Gere um Relatório de Evolução Capilar com:
1. Estimativa de redensificação capilar
2. Avaliação dermatoscópica
3. Sumário clínico: Excelente / Moderada / Necessita repactuação`;
    const text = await groqGenerate(prompt);
    res.json({ result: text });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── IA: Resumo de Consulta ──────────────────────────────────────────────────
app.post("/api/summarize-consultation", requireStaff, async (req, res) => {
  try {
    const { pacienteNome, queixaDoDia, evolucaoObservada, alteracoesProtocolo } = req.body;
    const prompt = `Gere um sumário clínico para o prontuário de ${pacienteNome}.
- Queixa: ${queixaDoDia}
- Evolução: ${evolucaoObservada}
- Alterações de protocolo: ${alteracoesProtocolo}

Seções: SINTOMATOLOGIA ATUAL / PROPEDÊUTICA E ANÁLISE COMPLEMENTAR / CONDUTA E ALTERAÇÕES TERAPÊUTICAS

Escreva em português médico formal.`;
    const text = await groqGenerate(prompt);
    res.json({ result: text });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── IA: Sumário de Nova Consulta (tricológica, usado pelo formulário NovaConsulta) ──
app.post("/api/summarize", requireStaff, async (req, res) => {
  try {
    const {
      pacienteNome,
      diagnostico,
      queixaRecente,
      miniaturizacao,
      inflamacao,
      hairPullTest,
      densitometria,
      conclusao,
    } = req.body;
    const prompt = `Você é o CA.RO Clinic IA, copiloto clínico da Dra. Mariah Zibetti (CRM PR 57.133), especialista em Tricologia Médica e Capilar de Alto Padrão.

Gere um sumário clínico objetivo e em português médico formal para o prontuário do paciente, a partir dos dados de avaliação tricológica abaixo.

Dados da Consulta:
- Paciente: ${pacienteNome || "não informado"}
- Diagnóstico: ${diagnostico || "não informado"}
- Queixa recente: ${queixaRecente || "não informada"}
- Miniaturização capilar: ${miniaturizacao || "não avaliada"}
- Sinais inflamatórios — Eritema: ${inflamacao?.eritema || "não avaliado"}, Descamação: ${inflamacao?.desquamacao || "não avaliada"}, Prurido: ${inflamacao?.prurido || "não avaliado"}, Tampões córneos: ${inflamacao?.tampoesCorneos || "não avaliados"}
- Hair Pull Test: ${hairPullTest || "não realizado"}
- Densitometria — Vertex: ${densitometria?.vertex || "não informada"}, Occipital: ${densitometria?.occipital || "não informada"}
- Conclusão da médica: ${conclusao || "não informada"}

Gere o sumário com as seções:
1. SINTOMATOLOGIA ATUAL
2. AVALIAÇÃO TRICOSCÓPICA E DENSITOMÉTRICA
3. CONDUTA E CONCLUSÃO CLÍNICA

Seja conciso, objetivo e use terminologia médica apropriada.`;
    const text = await groqGenerate(prompt);
    res.json({ summary: text });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── IA: Chat ────────────────────────────────────────────────────────────────
app.post("/api/chat", requireStaff, async (req, res) => {
  try {
    const { messages, systemInstruction } = req.body;
    const text = await groqChat(messages, systemInstruction);
    res.json({ text });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.use('/api/whatsapp', whatsappRouter);
app.use('/api/whatsapp', whatsappEvolutionRouter);
app.use('/api/whatsapp', remarketingRouter);
app.use('/api/whatsapp', lembretesRouter);
app.use('/api/admin', adminResetRouter);
app.use('/api/admin', importSupportClinicRouter);
app.use('/api/google-calendar', googleCalendarRouter);

export default app;
