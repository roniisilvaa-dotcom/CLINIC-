import { gerarTexto, GUARDRAIL } from "../lib/ai.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { pacienteNome, idade, queixa, exames } = req.body;

    const prompt = `Você é o software CA.RO Clinic IA, assistente diagnóstico de precisão da médica responsável da clínica, especialista em Tricologia Médica e Capilar de Alto Padrão.
Instrução: Analise minuciosamente os resultados dos exames laboratoriais fornecidos abaixo. Faça uma avaliação à luz dos padrões estritos da tricologia (que buscam otimização metabólica/hormonal capilar, e não apenas o "normal" padrão de laboratório comum de referência).

Parâmetros Críticos de Referência em Tricologia Médica:
- Ferritina sérica ideal: > 70 ng/mL (comum aceitar >15, mas para rebrota folicular é necessário >70-80).
- Vitamina D ideal: > 45 ng/mL (comum aceitar >20, mas folículo é altamente dependente).
- Vitamina B12 ideal: > 400 pg/mL (otimização do ciclo celular).
- Zinco sérico ideal: > 80 ug/dL.
- TSH ideal: 1.0 a 2.5 mIU/L (hiper/hipotireoidismo, mesmo subclínico, desencadeia eflúvio).

Dados Gerais do Paciente:
- Nome: ${pacienteNome}
- Idade: ${idade} anos
- Queixa e Histórico: ${queixa}
- Exames de Sangue Recentes: ${JSON.stringify(exames)}

Gere um LAUDO CLÍNICO DE SUPORTE estruturado em Markdown, sofisticado e humanizado, contendo:
1. Resumo Executivo das Alterações: Apague ou exiba destaques em vermelho/negrito com avisos importantes sobre valores limítrofes ou alterados.
2. Análise Detalhada dos Marcadores: Correlacione diretamente cada biomarcador (TSH, Ferritina, Vitaminas, Hormônios, Zinco) com a queixa de queda ou enfraquecimento capilar.
3. Raciocínio Fisiopatológico: Explique o impacto metabólico/hormonal do que foi detectado no desenvolvimento folicular (fases anágena e telógena).
4. Sugestão Nutracêutica / Terapêutica Personalizada: Formule sugestões de dosagem (ferro quelatado, colecalciferol, piridoxina, etc.) para que a médica responsável revise e aprove.

Use uma terminologia elegante e profissional. No final, assine como: "CA.RO Clinic IA | Inteligência Clínica de Precisão Capilar".`;

    const text = await gerarTexto({ system: GUARDRAIL, prompt });
    res.json({ result: text });
  } catch (error: any) {
    console.error("Erro em /api/analyze-exams:", error);
    res.status(500).json({ error: error.message || "Erro desconhecido ao chamar IA." });
  }
}
