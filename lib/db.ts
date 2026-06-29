import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.warn("[db] DATABASE_URL não definida — endpoints de banco vão falhar até configurar.");
}

// Cliente Neon via HTTP (ideal para funções serverless da Vercel).
// Uso: await sql`select ... where id = ${id}`
export const sql = neon(url || "");
