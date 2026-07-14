import { obterQrCode } from "../../src/services/evolutionWhatsappService.js";

export default async function handler(req: any, res: any) {
  try {
    const resultado = await obterQrCode();
    res.status(resultado.ok ? 200 : 503).json(resultado);
  } catch (err: any) {
    console.error("Erro inesperado ao gerar QR Code:", err);
    res.status(500).json({ ok: false, erro: "Erro inesperado ao gerar o QR Code." });
  }
}
