import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize GoogleGenAI server-side with User-Agent as 'aistudio-build'
// Note that GEMINI_API_KEY will be automatically injected by AI Studio.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

app.use(express.json());

// API endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 1. Analyze Exams with IA
app.post("/api/analyze-exams", async (req, res) => {
  try {
    const { pacienteNome, idade, queixa, exames } = req.body;
    
    const prompt = `Você é o software CA.RO Clinic IA, assistente diagnóstico de precisão da Dra. Mariah Zibetti (CRM PR 57.133), especialista em Tricologia Médica e Capilar de Alto Padrão.
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
4. Sugestão Nutracêutica / Terapêutica Personalizada: Formule sugestões de dosagem (ferro quelatado, colecalciferol, piridoxina, etc.) para que a médica Dra. Mariah revise e aprove.

Use uma terminologia elegante e profissional. No final, assine como: "CA.RO Clinic IA | Inteligência Clínica de Precisão Capilar".`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error("Erro em /api/analyze-exams:", error);
    res.status(500).json({ error: error.message || "Erro desconhecido ao chamar IA." });
  }
});

// 2. Analyze Photo evolution sequence
app.post("/api/analyze-photos", async (req, res) => {
  try {
    const { pacienteNome, fotosInfo } = req.body;
    const prompt = `Você é o CA.RO Clinic IA, assistente de análise de evolução capilar em fotos de alta resolução para a Dra. Mariah Zibetti.
Analise a seguinte sequência cronológica de fotos capilares coletadas nas unidades da clínica:
${JSON.stringify(fotosInfo)}

Gere um Relatório de Evolução Capilar Comparativa por IA contendo:
1. Estimativa matemática de redensificação capilar sugerida no padrão tricológico (ex: aumento de densidade ou fechamento de clareiras).
2. Avaliação das observações dermatoscópicas fornecidas (limpeza de óstios foliculares, presença de fios velus e fios terminais novos).
3. Sumário visual e clínico em português indicando se a resposta terapêutica está Excelente, Moderada ou se necessita repactuação de protocolo.

Mantenha uma abordagem que valorize os esforços clínicos aplicados e gere motivação empática.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    res.json({ result: response.text });
  } catch (error: any) {
    console.error("Erro em /api/analyze-photos:", error);
    res.status(500).json({ error: error.message || "Erro desconhecido ao chamar IA." });
  }
});

// 3. Summarize Consultation
app.post("/api/summarize-consultation", async (req, res) => {
  try {
    const { pacienteNome, queixaDoDia, evolucaoObservada, alteracoesProtocolo } = req.body;
    const prompt = `Você é o assistente de prontuário eletrônico CA.RO Clinic.
Por favor, gere um sumário clínico estruturado, conciso e semiologicamente rigoroso para o prontuário eletrônico da paciente ${pacienteNome}.

Dados da consulta:
- Queixa reportada: ${queixaDoDia}
- Evolução tricológica observada física/computacional: ${evolucaoObservada}
- Alterações introduzidas na conduta de hoje: ${alteracoesProtocolo}

Formate em seções objetivas como:
- SINTOMATOLOGIA ATUAL
- PROPEDÊUTICA E ANÁLISE COMPLEMENTAR
- CONDUTA E ALTERAÇÕES TERAPÊUTICAS

Escreva em português de padrão acadêmico e médico formal brasileiro.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    res.json({ result: response.text });
  } catch (error: any) {
    console.error("Erro em /api/summarize-consultation:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Trichology Expert Chat Assistant
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, systemInstruction } = req.body;
    
    // Convert client-side message structure to @google/genai contents
    const formattedContents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : m.role,
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction || `Você é o TRICO AI, um assistente virtual ultra-especializado em Tricologia Médica, Terapia Capilar Avançada e Dermatologia Capilar, que atua como copiloto clínico exclusivo da Dra. Mariah Zibetti (CRM PR 57.133). 

Suas diretrizes fundamentais:
1. Forneça raciocínio clínico de alto nível, citando ativos consagrados da tricologia médica (Minoxidil oral, Dutasterida, Finasterida, Latanoprosta tópica, Espironolactona, Peeling capilar, Laser de baixa potência LLLT, MMP Capilar, microagulhamento, mesoterapia capilar).
2. Domine as escalas diagnósticas, como a escala de Ludwig (rarefação feminina) e a escala de Hamilton-Norwood (graus de alopecia masculina).
3. Auxilie a Dra. Mariah com sugestões de suplementação capilar, formulações individualizadas, exames laboratoriais otimizados de precisão, interpretações de biomarcadores e diagnóstico diferencial (ex: diferenciar Eflúvio Telógeno de Alopecia Androgenética Feminina).
4. Suas respostas devem ser dadas em PORTUGUÊS brasileiro, de forma clara, altamente técnica e elegante. Use Markdown.
5. Sempre exiba o seguinte rodapé curto de disclaimer:
"*TRICO AI: Ferramenta de apoio clínico e decisão diagnóstico-terapêutica exclusiva da médica responsável.*"`,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Erro em /api/chat:", error);
    res.status(500).json({ error: error.message || "Erro desconhecido no assistente de IA." });
  }
});

// Start our full-stack server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
