// Importação única dos dados do Support Clinic (sistema antigo da Dra. Mariah)
// para o CA.RO Clinic — pedido da Dra. em 20/07/2026 ("ela quer tudo o que
// esta dentro desse sistema para o nosso").
//
// Fluxo: Camila/Dra. faz login normal no painel (staff), abre o painel de
// importação, sobe os 5 CSVs exportados do Support Clinic (Clientes,
// Anamneses, Anamneses respostas, Evoluções, Receitas — todos em Latin-1,
// exportados por "Configurações > Exportar dados" no Support Clinic).
// Primeiro roda em modo dry-run (só mostra contagens, não grava nada);
// só depois de conferir é que o botão "Confirmar importação" grava de
// verdade. Protegido pelo mesmo requireStaff usado no resto do painel —
// não criamos nenhum secret/token novo pra isso.
//
// Regra de dedupe: paciente do Support Clinic só vira paciente novo no
// CA.RO Clinic se tiver CPF (a tabela pacientes exige CPF único e
// obrigatório) e se esse CPF ainda não existir no banco. Se o CPF já
// existir, o conteúdo (anamnese/evolução/receita) é anexado ao paciente
// JÁ existente, em vez de criar um duplicado.
//
// Dados que não tinham como ser mapeados 1:1 pros campos estruturados do
// CA.RO Clinic (ex: não existe uma tabela "receitas" nem "anamneses"
// separada, e o pedido da Dra. foi "texto livre, como a Support Clinic")
// entram na tabela `consultas`, no campo `evolucao` (texto livre), com uma
// tag em `queixa` indicando a origem (Anamnese/Evolução/Receita importada).
//
// O CSV de Anamneses respostas costuma ser grande (respostas de anamnese
// de todos os pacientes) e o corpo da requisição HTTP na Vercel tem um
// limite de tamanho independente do limite do Express — por isso o
// frontend comprime cada CSV com gzip (CompressionStream nativo do
// navegador) e manda em base64 com a flag `compressed: true`; aqui a
// gente descomprime antes de processar (ver maybeDecompress).

import express from "express";
import zlib from "zlib";
import { db } from "../db/index.js";
import { pacientes, consultas, users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = express.Router();

// ── Auth (mesmo mecanismo de sessão do resto do painel — sem secret novo) ──
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

// ── Parser de CSV genérico (separador ';', respeita aspas e quebras de linha
// dentro de campo, igual ao módulo csv do Python que usei pra validar) ──
function parseCsv(text: string, delimiter = ";"): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const len = text.length;
  while (i < len) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === delimiter) { row.push(field); field = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") {
      row.push(field); field = "";
      rows.push(row); row = [];
      i++; continue;
    }
    field += c; i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

function stripHtml(s: string): string {
  if (!s) return "";
  let out = s.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "");
  out = out.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"');
  out = out.replace(/\n{3,}/g, "\n\n");
  return out.trim();
}

function onlyDate(dt: string): string {
  if (!dt) return "";
  const m = dt.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : dt.trim().slice(0, 10);
}

function calcIdade(dataNascimento: string): number {
  if (!dataNascimento) return 0;
  const m = dataNascimento.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return 0;
  const nasc = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate());
  if (aindaNaoFezAniversario) idade--;
  return idade >= 0 ? idade : 0;
}

interface ImportPayload {
  clientesCsv: string;
  anamnesesCsv: string;
  anamnesesRespostasCsv: string;
  evolucoesCsv: string;
  receitasCsv: string;
}

// Descomprime os campos CSV quando o frontend manda `compressed: true`
// (cada campo vem em base64 de um gzip do texto). Se não vier a flag,
// assume payload em texto puro (compatibilidade com chamadas antigas).
function maybeDecompress(body: any): ImportPayload {
  if (!body || !body.compressed) return body as ImportPayload;
  const dec = (b64: string): string => {
    if (!b64) return "";
    return zlib.gunzipSync(Buffer.from(b64, "base64")).toString("utf-8");
  };
  return {
    clientesCsv: dec(body.clientesCsv),
    anamnesesCsv: dec(body.anamnesesCsv),
    anamnesesRespostasCsv: dec(body.anamnesesRespostasCsv),
    evolucoesCsv: dec(body.evolucoesCsv),
    receitasCsv: dec(body.receitasCsv),
  };
}

function processar(body: ImportPayload) {
  const clientesRows = parseCsv(body.clientesCsv || "").slice(1);
  const anamnesesRows = parseCsv(body.anamnesesCsv || "").slice(1);
  const respostasRows = parseCsv(body.anamnesesRespostasCsv || "").slice(1);
  const evolucoesRows = parseCsv(body.evolucoesCsv || "").slice(1);
  const receitasRows = parseCsv(body.receitasCsv || "").slice(1);

  // Clientes: Código;Status;Estado civil;Escolaridade;Cidade;Sexo;Nome;Nome social;
  // Data de nascimento;CPF;RG;E-mail;Telefone;Celular;WhatsApp;CEP;Bairro;Endereço;
  // Número;Complemento;Mãe;Pai;Cônjuge;Profissão;Plano de saúde;Número do plano;
  // Profissional;Observações;Data de criação
  const clientes: Record<string, any> = {};
  const semCpf: { codigo: string; nome: string }[] = [];
  for (const r of clientesRows) {
    if (!r[0]) continue;
    const codigo = r[0].trim();
    const cpf = (r[9] || "").replace(/\D/g, "");
    const cliente = {
      codigo,
      status: (r[1] || "").trim(),
      cidadeOrigem: (r[4] || "").trim(),
      nome: (r[6] || "").trim(),
      dataNascimento: onlyDate((r[8] || "").trim()),
      cpf,
      email: (r[11] || "").trim(),
      telefone: (r[12] || "").trim() || (r[13] || "").trim() || (r[14] || "").trim(),
      profissao: (r[23] || "").trim(),
      observacoes: (r[27] || "").trim(),
    };
    clientes[codigo] = cliente;
    if (!cpf) semCpf.push({ codigo, nome: cliente.nome });
  }

  // Anamneses (índice): Código;Código do paciente;Paciente;Profissional;Data de criação
  const anamneseIdx: Record<string, { pacienteCodigo: string; data: string }> = {};
  for (const r of anamnesesRows) {
    if (!r[0]) continue;
    anamneseIdx[r[0].trim()] = { pacienteCodigo: (r[1] || "").trim(), data: onlyDate((r[4] || "").trim()) };
  }

  // Anamneses respostas: Código da anamnese;Código do paciente;Paciente;Profissional;
  // Tipo de pergunta;Pergunta;Resposta;Data de criação
  const respostasPorAnamnese: Record<string, { pergunta: string; resposta: string }[]> = {};
  for (const r of respostasRows) {
    if (!r[0]) continue;
    const resposta = stripHtml((r[6] || "").trim());
    if (!resposta) continue;
    const codAn = r[0].trim();
    (respostasPorAnamnese[codAn] ||= []).push({ pergunta: (r[5] || "").trim(), resposta });
  }

  const anamnesesCompletas: { pacienteCodigo: string; data: string; texto: string }[] = [];
  for (const [codAn, meta] of Object.entries(anamneseIdx)) {
    const respostas = respostasPorAnamnese[codAn];
    if (!respostas || !respostas.length) continue;
    let texto = `ANAMNESE (Support Clinic) — ${meta.data}\n\n`;
    for (const { pergunta, resposta } of respostas) texto += `${pergunta}:\n${resposta}\n\n`;
    anamnesesCompletas.push({ pacienteCodigo: meta.pacienteCodigo, data: meta.data, texto: texto.trim() });
  }

  // Evoluções: Código;Código do paciente;Paciente;Profissional;Nome;Conteúdo;Data de criação
  const evolucoes = evolucoesRows
    .filter((r) => r[0])
    .map((r) => ({
      pacienteCodigo: (r[1] || "").trim(),
      titulo: (r[4] || "").trim() || "Evolução",
      conteudo: stripHtml((r[5] || "").trim()),
      data: onlyDate((r[6] || "").trim()),
    }))
    .filter((e) => e.conteudo);

  // Receitas: Código;Código do paciente;Paciente;Profissional;Conteúdo;Observações;Data de criação
  const receitas = receitasRows
    .filter((r) => r[0])
    .map((r) => ({
      pacienteCodigo: (r[1] || "").trim(),
      conteudo: stripHtml((r[4] || "").trim()),
      obs: stripHtml((r[5] || "").trim()),
      data: onlyDate((r[6] || "").trim()),
    }))
    .filter((r) => r.conteudo);

  return { clientes, semCpf, anamnesesCompletas, evolucoes, receitas };
}

async function montarPlano(bodyRaw: any) {
  const body = maybeDecompress(bodyRaw);
  const { clientes, semCpf, anamnesesCompletas, evolucoes, receitas } = processar(body);

  const existentes = await db.select({ id: pacientes.id, cpf: pacientes.cpf, nome: pacientes.nome }).from(pacientes);
  const porCpf = new Map(existentes.map((p) => [(p.cpf || "").replace(/\D/g, ""), p]));

  const novosPacientes: any[] = [];
  const pulados: { codigo: string; nome: string; cpf: string; motivo: string }[] = [];
  const mapaCodigoParaPacienteId: Record<string, string> = {};

  for (const c of Object.values(clientes) as any[]) {
    if (!c.cpf) continue; // já contabilizado em semCpf
    const jaExiste = porCpf.get(c.cpf);
    if (jaExiste) {
      mapaCodigoParaPacienteId[c.codigo] = jaExiste.id;
      pulados.push({ codigo: c.codigo, nome: c.nome, cpf: c.cpf, motivo: `Já existe no CA.RO Clinic (${jaExiste.nome})` });
      continue;
    }
    const id = `sc-${c.codigo}`;
    mapaCodigoParaPacienteId[c.codigo] = id;
    novosPacientes.push({
      id,
      nome: c.nome || "(sem nome)",
      idade: calcIdade(c.dataNascimento),
      dataNascimento: c.dataNascimento || "",
      cpf: c.cpf,
      telefone: c.telefone || "",
      email: c.email || "",
      cidade: "Toledo",
      comoConheceu: null,
      queixaPrincipal: "Importado do Support Clinic — ver anamnese em Consultas",
      status: c.status === "Inativo" ? "Sem Retorno" : "Em Tratamento",
      progresso: 0,
      ultimaAtualizacao: new Date().toISOString().slice(0, 10),
      antecedentes: {
        usoMedicamentos: "", historicoFamiliar: "", gestacaoAmamentacao: "", menopausa: "",
        outros: [c.cidadeOrigem && `Cidade: ${c.cidadeOrigem}`, c.profissao && `Profissão: ${c.profissao}`, c.observacoes && `Obs: ${c.observacoes}`]
          .filter(Boolean).join(" | "),
      },
      diagnostico: { principal: "", secundario: [], condicoesAssociadas: [], fatoresContribuintes: [], observacoes: "" },
      protocolo: { medicamentos: "", procedimentos: "", cosmeticos: "", suplementacao: "", estiloVida: "", duracaoPrevista: "", dataInicio: "" },
      tags: ["Importado Support Clinic"],
    });
  }

  const novasConsultas: any[] = [];
  for (const a of anamnesesCompletas) {
    const pacienteId = mapaCodigoParaPacienteId[a.pacienteCodigo];
    if (!pacienteId) continue;
    novasConsultas.push({
      id: `sc-anam-${a.pacienteCodigo}-${a.data}-${novasConsultas.length}`,
      pacienteId, data: a.data || new Date().toISOString().slice(0, 10),
      tipo: "Presencial - Toledo", queixa: "Anamnese importada (Support Clinic)",
      evolucao: a.texto, alteracoesProtocolo: "", examesSolicitados: "", resumoIa: null,
    });
  }
  for (const e of evolucoes) {
    const pacienteId = mapaCodigoParaPacienteId[e.pacienteCodigo];
    if (!pacienteId) continue;
    novasConsultas.push({
      id: `sc-evol-${e.pacienteCodigo}-${e.data}-${novasConsultas.length}`,
      pacienteId, data: e.data || new Date().toISOString().slice(0, 10),
      tipo: "Presencial - Toledo", queixa: `Evolução importada (Support Clinic) — ${e.titulo}`,
      evolucao: e.conteudo, alteracoesProtocolo: "", examesSolicitados: "", resumoIa: null,
    });
  }
  for (const r of receitas) {
    const pacienteId = mapaCodigoParaPacienteId[r.pacienteCodigo];
    if (!pacienteId) continue;
    novasConsultas.push({
      id: `sc-receita-${r.pacienteCodigo}-${r.data}-${novasConsultas.length}`,
      pacienteId, data: r.data || new Date().toISOString().slice(0, 10),
      tipo: "Presencial - Toledo", queixa: "Receita importada (Support Clinic)",
      evolucao: [r.conteudo, r.obs].filter(Boolean).join("\n\n"), alteracoesProtocolo: "", examesSolicitados: "", resumoIa: null,
    });
  }

  return { novosPacientes, pulados, semCpf, novasConsultas };
}

router.post("/import-support-clinic/dry-run", requireStaffLocal, async (req, res) => {
  try {
    const plano = await montarPlano(req.body);
    res.json({
      ok: true,
      resumo: {
        pacientesNovos: plano.novosPacientes.length,
        pacientesJaExistentes: plano.pulados.length,
        pacientesSemCpf: plano.semCpf.length,
        consultasAImportar: plano.novasConsultas.length,
      },
      pacientesNovos: plano.novosPacientes.map((p) => ({ nome: p.nome, cpf: p.cpf, telefone: p.telefone })),
      pacientesJaExistentes: plano.pulados,
      pacientesSemCpf: plano.semCpf,
    });
  } catch (e: any) {
    console.error("Erro dry-run import Support Clinic:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post("/import-support-clinic/commit", requireStaffLocal, async (req, res) => {
  try {
    const plano = await montarPlano(req.body);
    if (plano.novosPacientes.length) {
      await db.insert(pacientes).values(plano.novosPacientes).onConflictDoNothing();
    }
    if (plano.novasConsultas.length) {
      // Insere em lotes pra evitar um payload SQL gigante de uma vez só
      const LOTE = 100;
      for (let i = 0; i < plano.novasConsultas.length; i += LOTE) {
        await db.insert(consultas).values(plano.novasConsultas.slice(i, i + LOTE)).onConflictDoNothing();
      }
    }
    res.json({
      ok: true,
      pacientesCriados: plano.novosPacientes.length,
      pacientesJaExistentes: plano.pulados.length,
      pacientesSemCpf: plano.semCpf.length,
      consultasCriadas: plano.novasConsultas.length,
    });
  } catch (e: any) {
    console.error("Erro commit import Support Clinic:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Migração idempotente: garante a coluna prontuario_livre em pacientes (não há db:push automático no deploy).
router.post("/migrate-prontuario", requireStaffLocal, async (req, res) => {
  try {
    await db.execute(sql`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS prontuario_livre text`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS google_calendar_auth (id text PRIMARY KEY, access_token text NOT NULL, refresh_token text NOT NULL, expiry_date text NOT NULL, calendar_id text NOT NULL DEFAULT 'primary', conectado_em text NOT NULL)`);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
