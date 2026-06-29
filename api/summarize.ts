import { gerarTexto, GUARDRAIL } from "../lib/ai.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
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

    const prompt = `Você é o assistente de prontuário eletrônico CA.RO Clinic.
Gere um sumário clínico estruturado, conciso e semiologicamente rigoroso para o prontuário eletrônico da paciente ${pacienteNome}.

Dados da consulta de hoje:
- Diagnóstico principal: ${diagnostico}
- Queixa recente: ${queixaRecente}
- Indicador de miniaturização: ${JSON.stringify(miniaturizacao)}
- Sinais inflamatórios (eritema, descamação, prurido, tampões córneos): ${JSON.stringify(inflamacao)}
- Hair pull test: ${JSON.stringify(hairPullTest)}
- Densitometria (vertex / occipital): ${JSON.stringify(densitometria)}
- Conduta e conclusão: ${conclusao}

Formate em seções objetivas:
- SINTOMATOLOGIA ATUAL
- PROPEDÊUTICA E ANÁLISE COMPLEMENTAR
- CONDUTA E ALTERAÇÕES TERAPÊUTICAS

Escreva em português de padrão acadêmico e médico formal brasileiro. Use Markdown.`;

    const text = await gerarTexto({ system: GUARDRAIL, prompt });
    res.json({ summary: text });
  } catch (error: any) {
    console.error("Erro em /api/summarize:", error);
    res.status(500).json({ error: error.message || "Erro desconhecido ao chamar IA." });
  }
}
