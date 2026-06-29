import { sql } from "../../lib/db.js";
import { hashSenha, sessaoDoRequest } from "../../lib/auth.js";

const PLANOS = ["Standard", "Precision", "Enterprise"];

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

// Todas as rotas admin exigem sessão de desenvolvedor (papel=dev).
export default async function handler(req: any, res: any) {
  const s = await sessaoDoRequest(req);
  if (!s || s.papel !== "dev") return res.status(403).json({ error: "Acesso restrito." });
  const action = req.query.action;
  try {
    // ───── LISTAR CLÍNICAS (todos os campos) ─────
    if (action === "clinicas") {
      const clinicas = await sql`
        select c.id, c.nome, c.slug, c.plano, c.ativo, c.criada_em,
          c.logo_url, c.telefone, c.email, c.cnpj, c.endereco, c.cidade,
          c.responsavel_nome, c.responsavel_crm, c.observacoes,
          (select count(*) from usuarios u where u.clinica_id = c.id) as usuarios,
          (select count(*) from pacientes p where p.clinica_id = c.id) as pacientes,
          (select u.email from usuarios u where u.clinica_id = c.id order by u.criado_em asc limit 1) as email_acesso
        from clinicas c order by c.criada_em desc`;
      return res.json({ clinicas });
    }

    // ───── CRIAR CLÍNICA (cadastro completo) ─────
    if (action === "create-clinic") {
      if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });
      const b = req.body || {};
      if (!b.clinicaNome || !b.nome || !b.email || !b.senha)
        return res.status(400).json({ error: "Preencha clínica, responsável, email e senha." });
      if (String(b.senha).length < 6) return res.status(400).json({ error: "A senha deve ter ao menos 6 caracteres." });
      const planoFinal = PLANOS.includes(b.plano) ? b.plano : "Standard";
      const emailNorm = String(b.email).trim().toLowerCase();
      if ((await sql`select id from usuarios where email = ${emailNorm} limit 1`).length)
        return res.status(409).json({ error: "Já existe uma conta com esse email." });
      const slugBase = gerarSlug(b.clinicaNome);
      let slug = slugBase, n = 1;
      while ((await sql`select 1 from clinicas where slug = ${slug} limit 1`).length) slug = `${slugBase}-${n++}`;
      const senhaHash = await hashSenha(b.senha);
      const [clinica] = await sql`
        insert into clinicas
          (nome, slug, plano, logo_url, telefone, email, cnpj, endereco, cidade, responsavel_nome, responsavel_crm, observacoes)
        values
          (${b.clinicaNome}, ${slug}, ${planoFinal}, ${b.logoUrl || null}, ${b.telefone || null}, ${b.emailClinica || null},
           ${b.cnpj || null}, ${b.endereco || null}, ${b.cidade || null}, ${b.nome}, ${b.crm || null}, ${b.observacoes || null})
        returning id, nome, slug, plano`;
      await sql`
        insert into usuarios (clinica_id, nome, email, senha_hash, papel, crm)
        values (${clinica.id}, ${b.nome}, ${emailNorm}, ${senhaHash}, 'medica', ${b.crm || null})`;
      return res.json({ ok: true, clinica });
    }

    // ───── EDITAR CLÍNICA ─────
    if (action === "update-clinic") {
      if (req.method !== "POST" && req.method !== "PATCH")
        return res.status(405).json({ error: "Método não permitido" });
      const b = req.body || {};
      if (!b.clinicaId) return res.status(400).json({ error: "clinicaId obrigatório." });
      const plano = PLANOS.includes(b.plano) ? b.plano : "Standard";

      await sql`
        update clinicas set
          nome = coalesce(${b.clinicaNome}, nome),
          plano = ${plano},
          ativo = ${b.ativo !== false},
          logo_url = ${b.logoUrl ?? null},
          telefone = ${b.telefone ?? null},
          email = ${b.emailClinica ?? null},
          cnpj = ${b.cnpj ?? null},
          endereco = ${b.endereco ?? null},
          cidade = ${b.cidade ?? null},
          responsavel_nome = ${b.nome ?? null},
          responsavel_crm = ${b.crm ?? null},
          observacoes = ${b.observacoes ?? null}
        where id = ${b.clinicaId}`;

      // Atualiza o médico principal (nome / email / senha) se enviado
      const [principal] = await sql`
        select id from usuarios where clinica_id = ${b.clinicaId} order by criado_em asc limit 1`;
      if (principal) {
        if (b.nome) await sql`update usuarios set nome = ${b.nome}, crm = ${b.crm || null} where id = ${principal.id}`;
        if (b.email) {
          const emailNorm = String(b.email).trim().toLowerCase();
          const conflito = await sql`select id from usuarios where email = ${emailNorm} and id <> ${principal.id} limit 1`;
          if (conflito.length) return res.status(409).json({ error: "Esse email já está em uso por outra conta." });
          await sql`update usuarios set email = ${emailNorm} where id = ${principal.id}`;
        }
        if (b.senha) {
          if (String(b.senha).length < 6) return res.status(400).json({ error: "A nova senha deve ter ao menos 6 caracteres." });
          await sql`update usuarios set senha_hash = ${await hashSenha(b.senha)} where id = ${principal.id}`;
        }
      }
      return res.json({ ok: true });
    }

    // ───── EXCLUIR CLÍNICA ─────
    if (action === "delete-clinic") {
      if (req.method !== "POST" && req.method !== "DELETE")
        return res.status(405).json({ error: "Método não permitido" });
      const { clinicaId } = req.body || {};
      if (!clinicaId) return res.status(400).json({ error: "clinicaId obrigatório." });
      await sql`delete from clinicas where id = ${clinicaId}`;
      return res.json({ ok: true });
    }

    // ───── ATIVAR/ALTERAR PLANO ─────
    if (action === "set-plano") {
      if (req.method !== "POST" && req.method !== "PATCH")
        return res.status(405).json({ error: "Método não permitido" });
      const { clinicaId, plano } = req.body || {};
      if (!clinicaId) return res.status(400).json({ error: "clinicaId obrigatório." });
      if (!PLANOS.includes(plano)) return res.status(400).json({ error: "Plano inválido." });
      const rows = await sql`update clinicas set plano = ${plano} where id = ${clinicaId} returning id, nome, plano`;
      if (!rows.length) return res.status(404).json({ error: "Clínica não encontrada." });
      return res.json({ ok: true, clinica: rows[0] });
    }

    return res.status(404).json({ error: "Rota não encontrada." });
  } catch (e: any) {
    console.error(`Erro em /api/admin/${action}:`, e);
    res.status(500).json({ error: e.message || "Erro interno." });
  }
}
