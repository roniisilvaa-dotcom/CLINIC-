import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL não definida. Rode: DATABASE_URL='...' node db/migrate.mjs");
  process.exit(1);
}
const sql = neon(url);
const schemaRaw = readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
// Remove linhas de comentário antes de separar os comandos
const schema = schemaRaw
  .split("\n")
  .filter((l) => !l.trim().startsWith("--"))
  .join("\n");
const stmts = schema
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

for (const stmt of stmts) {
  await sql.query(stmt);
  console.log("OK:", stmt.split("\n")[0].slice(0, 60));
}
console.log(`\n✅ Migração concluída — ${stmts.length} comandos aplicados.`);
