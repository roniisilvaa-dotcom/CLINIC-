import { gerarTexto, GUARDRAIL } from "../lib/ai.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { messages, systemInstruction } = req.body;

    const msgs = (messages || []).map((m: any) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String(m.content || ""),
    }));

    // Blindagem de escopo sempre primeiro; o contexto de pacientes vem do front.
    const system =
      GUARDRAIL +
      (systemInstruction ? `\n\nCONTEXTO DA CLÍNICA E DOS PACIENTES:\n${systemInstruction}` : "");

    const text = await gerarTexto({ system, messages: msgs });
    res.json({ text });
  } catch (error: any) {
    console.error("Erro em /api/chat:", error);
    res.status(500).json({ error: error.message || "Erro desconhecido no assistente de IA." });
  }
}
