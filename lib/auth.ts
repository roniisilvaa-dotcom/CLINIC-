import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "dev-insecure-secret-troque-em-producao"
);

export const COOKIE_NAME = "caro_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

export async function hashSenha(s: string): Promise<string> {
  return bcrypt.hash(s, 10);
}
export async function conferirSenha(s: string, h: string): Promise<boolean> {
  return bcrypt.compare(s, h);
}

export interface Sessao {
  uid: string;
  clinicaId: string;
  tipo: "usuario" | "paciente";
  papel?: string;
  nome: string;
}

export async function assinarSessao(p: Sessao): Promise<string> {
  return new SignJWT({ ...p })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function lerSessao(token?: string): Promise<Sessao | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as Sessao;
  } catch {
    return null;
  }
}

export function cookieSessao(token: string): string {
  const seguro = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax${seguro ? "; Secure" : ""}`;
}

export function cookieLimpar(): string {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}

export function lerCookie(req: any): string | undefined {
  const raw: string = req?.headers?.cookie || "";
  const found = raw
    .split(/; */)
    .find((c) => c.startsWith(COOKIE_NAME + "="));
  return found ? decodeURIComponent(found.split("=").slice(1).join("=")) : undefined;
}

/** Lê e valida a sessão direto do request. Retorna null se não autenticado. */
export async function sessaoDoRequest(req: any): Promise<Sessao | null> {
  return lerSessao(lerCookie(req));
}
