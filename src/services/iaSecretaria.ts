/**
 * IA Secretária CA.RO
 * Agente Gemini para atendimento humanizado via WhatsApp
 */

const SYSTEM_PROMPT = `Você é Ana, a secretária virtual da Clínica CA.RO da Dra. Mariah Zibetti, especialista em tricologia em Toledo/PR.

PERSONALIDADE:
- Calorosa, acolhedora e profissional — como uma secretária humana experiente
- Chame a paciente pelo primeiro nome sempre que souber
- Use emojis com moderação (💜 ao encerrar, 📅 para datas, 📞 para contato)
- Nunca revele que é uma IA. Você é Ana, a secretária.
- Fale português brasileiro natural, nunca formal demais

SERVIÇOS E VALORES:
- Consulta inicial (avaliação capilar): R$ 350 — sinal de R$ 100
- Consulta retorno: R$ 200 — sinal de R$ 100
- Dermoscopia capilar: R$ 150 — sinal de R$ 100
- Laserterapia capilar: R$ 250 — sinal de R$ 100
- Localização: Toledo/PR

FLUXO:
1. Cumprimente e pergunte como pode ajudar
2. Se quiser agendar: peça nome completo, CPF e telefone
3. Verifique disponibilidade (função: check_availability)
4. Ofereça horários, confirme a escolha
5. Gere link de pagamento do sinal de R$100 (função: create_payment_link)
6. Após pagamento confirmado pelo sistema: crie o agendamento (função: create_appointment)
7. Envie confirmação completa com dados, data, hora e endereço

REGRAS:
- Sinal sempre R$ 100 independente do procedimento
- Após pagamento confirmado, informe que a Dra. Mariah já foi notificada
- Nunca invente horários — use sempre a função check_availability`;

export interface MensagemConversa {
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export interface RespostaAgente {
  texto: string;
  functionCall?: { name: string; args: Record<string, any> };
}

export async function processarMensagem(
  mensagem: string,
  historico: MensagemConversa[],
  contextoSistema?: string
): Promise<RespostaAgente> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { texto: "IA indisponível no momento. Ligue para a clínica: (44) 99999-9999 💜" };

  const systemFinal = contextoSistema
    ? `${SYSTEM_PROMPT}\n\nCONTEXTO SISTEMA:\n${contextoSistema}`
    : SYSTEM_PROMPT;

  const contents = [
    ...historico.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
    { role: "user" as const, parts: [{ text: mensagem }] },
  ];

  const tools = [{
    functionDeclarations: [
      {
        name: "check_availability",
        description: "Verifica horários livres na agenda da Dra. Mariah",
        parameters: {
          type: "OBJECT",
          properties: {
            data_inicio: { type: "STRING", description: "Data YYYY-MM-DD" },
            data_fim:    { type: "STRING", description: "Data YYYY-MM-DD (opcional)" },
          },
          required: ["data_inicio"],
        },
      },
      {
        name: "create_payment_link",
        description: "Gera link Pix para o sinal da consulta",
        parameters: {
          type: "OBJECT",
          properties: {
            nome_paciente: { type: "STRING" },
            cpf:           { type: "STRING" },
            telefone:      { type: "STRING" },
            procedimento:  { type: "STRING" },
            valor:         { type: "NUMBER" },
          },
          required: ["nome_paciente", "procedimento"],
        },
      },
      {
        name: "create_appointment",
        description: "Cria o agendamento após confirmação do pagamento",
        parameters: {
          type: "OBJECT",
          properties: {
            nome_paciente: { type: "STRING" },
            cpf:           { type: "STRING" },
            telefone:      { type: "STRING" },
            procedimento:  { type: "STRING" },
            data:          { type: "STRING" },
            horario:       { type: "STRING" },
            observacao:    { type: "STRING" },
          },
          required: ["nome_paciente", "cpf", "telefone", "procedimento", "data", "horario"],
        },
      },
    ],
  }];

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: systemFinal }] }, contents, tools }),
      }
    );
    const json = await res.json() as any;
    const part = json.candidates?.[0]?.content?.parts?.[0];

    if (part?.functionCall) {
      return { texto: "", functionCall: { name: part.functionCall.name, args: part.functionCall.args } };
    }
    return { texto: part?.text || "Pode repetir sua mensagem? 💜" };
  } catch (err) {
    console.error("Erro IA:", err);
    return { texto: "Tive um probleminha. Pode repetir? 💜" };
  }
}

export function formatarNotificacaoDra(d: {
  nome: string; telefone: string; cpf: string; procedimento: string;
  data: string; horario: string; horarioFim: string; observacao?: string; valorSinal: number;
}): string {
  return `📅 *Um paciente acabou de realizar um agendamento* 📅\n\n👤 Nome: ${d.nome}\n📞 Telefone: ${d.telefone}\n💼 Procedimento: ${d.procedimento}\n📝 Observação: ${d.observacao || `Consulta presencial em Toledo/PR. Sinal de R$ ${d.valorSinal},00 pago via Pix. CPF: ${d.cpf}.`}\n👩‍⚕️ Profissional: Mariah Zibetti\n📅 Data: ${d.data}\n🕐 Horário: ${d.horario} às ${d.horarioFim}`;
}
