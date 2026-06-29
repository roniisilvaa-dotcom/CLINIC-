import { sql } from "../../lib/db.js";
import {
  hashSenha,
  conferirSenha,
  assinarSessao,
  cookieSessao,
  cookieLimpar,
  sessaoDoRequest,
} from "../../lib/auth.js";

function gerarSlug(nome: string): string {
  return (
    String(nome)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "clinica"
  );
}

export default async function handler(req: any, res: any) {
  const action = req.query.action;
  try {
    // ───── LOGIN MÉDICA ─────
    if (action === "login") {
      if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });
      const { email, senha } = req.body || {};
      const emailNorm = String(email || "").trim().toLowerCase();
      if (!emailNorm || !senha) return res.status(400).json({ error: "Informe email e senha." });
      const rows = await sql`
        select u.id, u.nome, u.senha_hash, u.papel, u.clinica_id, c.nome as clinica_nome, c.slug
        from usuarios u join clinicas c on c.id = u.clinica_id
        where u.email = ${emailNorm} and u.ativo = true limit 1`;
      if (!rows.length) return res.status(401).json({ error: "Email ou senha inválidos." });
      const u = rows[0];
      if (!(await conferirSenha(senha, u.senha_hash)))
        return res.status(401).json({ error: "Email ou senha inválidos." });
      const token = await assinarSessao({ uid: u.id, clinicaId: u.clinica_id, tipo: "usuario", papel: u.papel, nome: u.nome });
      res.setHeader("Set-Cookie", cookieSessao(token));
      return res.json({ ok: true, usuario: { nome: u.nome, papel: u.papel }, clinica: { nome: u.clinica_nome, slug: u.slug } });
    }

    // ───── CADASTRO DE CLÍNICA ─────
    if (action === "register-clinic") {
      if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });
      const { clinicaNome, nome, email, senha, crm } = req.body || {};
      if (!clinicaNome || !nome || !email || !senha)
        return res.status(400).json({ error: "Preencha clínica, nome, email e senha." });
      if (String(senha).length < 6) return res.status(400).json({ error: "A senha deve ter ao menos 6 caracteres." });
      const emailNorm = String(email).trim().toLowerCase();
      if ((await sql`select id from usuarios where email = ${emailNorm} limit 1`).length)
        return res.status(409).json({ error: "Já existe uma conta com esse email." });
      const slugBase = gerarSlug(clinicaNome);
      let slug = slugBase, n = 1;
      while ((await sql`select 1 from clinicas where slug = ${slug} limit 1`).length) slug = `${slugBase}-${n++}`;
      const senhaHash = await hashSenha(senha);
      const [clinica] = await sql`insert into clinicas (nome, slug) values (${clinicaNome}, ${slug}) returning id, nome, slug`;
      const [user] = await sql`
        insert into usuarios (clinica_id, nome, email, senha_hash, papel, crm)
        values (${clinica.id}, ${nome}, ${emailNorm}, ${senhaHash}, 'medica', ${crm || null})
        returning id, nome, papel`;
      const token = await assinarSessao({ uid: user.id, clinicaId: clinica.id, tipo: "usuario", papel: user.papel, nome: user.nome });
      res.setHeader("Set-Cookie", cookieSessao(token));
      return res.json({ ok: true, usuario: { nome: user.nome, papel: user.papel }, clinica: { nome: clinica.nome, slug: clinica.slug } });
    }

    // ───── LOGIN PACIENTE ─────
    if (action === "patient-login") {
      if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });
      const { cpf, nascimento } = req.body || {};
      const cpfNorm = String(cpf || "").replace(/\D/g, "");
      if (cpfNorm.length !== 11) return res.status(400).json({ error: "CPF inválido." });
      if (!nascimento) return res.status(400).json({ error: "Informe a data de nascimento." });
      const rows = await sql`
        select p.id, p.nome, p.clinica_id from pacientes p
        where regexp_replace(p.cpf, '\\D', '', 'g') = ${cpfNorm} and p.data_nascimento = ${nascimento} limit 1`;
      if (!rows.length) return res.status(401).json({ error: "CPF ou data de nascimento não conferem." });
      const p = rows[0];
      const token = await assinarSessao({ uid: p.id, clinicaId: p.clinica_id, tipo: "paciente", nome: p.nome });
      res.setHeader("Set-Cookie", cookieSessao(token));
      return res.json({ ok: true, paciente: { id: p.id, nome: p.nome } });
    }

    // ───── LOGIN DESENVOLVEDOR ─────
    if (action === "dev-login") {
      if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });
      const { email, senha } = req.body || {};
      const DEV_EMAIL = process.env.DEV_EMAIL || "dev@caro.tech";
      const DEV_SENHA = process.env.DEV_PASSWORD || "carodev2026";
      if (String(email).trim().toLowerCase() !== DEV_EMAIL.toLowerCase() || senha !== DEV_SENHA)
        return res.status(401).json({ error: "Credenciais de desenvolvedor inválidas." });
      const token = await assinarSessao({ uid: "dev", clinicaId: "*", tipo: "usuario", papel: "dev", nome: "Desenvolvedor" });
      res.setHeader("Set-Cookie", cookieSessao(token));
      return res.json({ ok: true, usuario: { nome: "Desenvolvedor", papel: "dev" } });
    }

    // ───── SESSÃO ATUAL ─────
    if (action === "me") {
      const s = await sessaoDoRequest(req);
      if (!s) return res.status(401).json({ authenticated: false });
      return res.json({ authenticated: true, sessao: s });
    }

    // ───── LOGOUT ─────
    if (action === "logout") {
      res.setHeader("Set-Cookie", cookieLimpar());
      return res.json({ ok: true });
    }

    return res.status(404).json({ error: "Rota não encontrada." });
  } catch (e: any) {
    console.error(`Erro em /api/auth/${action}:`, e);
    res.status(500).json({ error: e.message || "Erro interno." });
  }
}
