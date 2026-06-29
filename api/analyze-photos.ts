import { gerarTexto, GUARDRAIL } from "../lib/ai.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { pacienteNome, fotosInfo } = req.body;
    const prompt = `Você é o CA.RO Clinic IA, assistente de análise de evolução capilar em fotos de alta resolução para a médica responsável.
Analise a seguinte sequência cronológica de fotos capilares coletadas nas unidades da clínica (paciente ${pacienteNome}):
${JSON.stringify(fotosInfo)}

Gere um Relatório de Evolução Capilar Comparativa por IA contendo:
1. Estimativa matemática de redensificação capilar sugerida no padrão tricológico (ex: aumento de densidade ou fechamento de clareiras).
2. Avaliação das observações dermatoscópicas fornecidas (limpeza de óstios foliculares, presença de fios velus e fios terminais novos).
3. Sumário visual e clínico em português indicando se a resposta terapêutica está Excelente, Moderada ou se necessita repactuação de protocolo.

Mantenha uma abordagem que valorize os esforços clínicos aplicados e gere motivação empática.`;

    const text = await gerarTexto({ system: GUARDRAIL, prompt });
    res.json({ result: text });
  } catch (error: any) {
    console.error("Erro em /api/analyze-photos:", error);
    res.status(500).json({ error: error.message || "Erro desconhecido ao chamar IA." });
  }
}
