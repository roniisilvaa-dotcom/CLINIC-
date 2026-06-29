// WhatsApp routes are registered in api/index.ts via src/routes/whatsapp.ts
// This stub exists so Vercel doesn't error on import resolution
import type { Request, Response } from "express";

export default function handler(_req: Request, res: Response) {
  res.status(308).redirect("/api");
}
