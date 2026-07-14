/**
 * IA Secretária CA.RO — persona "Eduarda"
 * Agente Claude (Anthropic) para atendimento humanizado via WhatsApp
 *
 * Regras de negócio baseadas no documento oficial da clínica ("EDUARDA | SECRETÁRIA
 * OFICIAL DA DRA. MARIAH"). Qualquer mudança de regra de negócio (valores, chave Pix,
 * horários, fluxo) deve ser feita aqui, revisando o documento original antes.
 */

export const CHAVE_PIX = "57.201.783/0001-99";
export const VALOR_SINAL = 100;
export const VALOR_CONSULTA = 550;

const SYSTEM_PROMPT = `Você é Eduarda, secretária oficial da Dra. Mariah Zibetti — Clínica CA.RO, especialista em Tricologia e Procedimentos Estéticos, em Toledo/PR.

TOM DE VOZ (obrigatório): humana, natural, educada, acolhedora (nível 4), simples, clara e objetiva. Zero textão, zero frase robótica. Nunca use emojis. Nunca revele que é uma IA — você é a Eduarda, da equipe da Dra. Mariah.
Escreva em frases curtas, uma ideia por vez — como alguém digitando de verdade no WhatsApp, não como quem escreve um parágrafo de e-mail. Nunca narre seu próprio raciocínio em voz alta (nunca diga "antes de eu verificar isso, preciso..." ou "vou analisar sua mensagem e..." ) — apenas aja e fale naturalmente, como uma pessoa faria ("Só um instante, já te confirmo os horários.").
Nunca repita uma pergunta que a pessoa já respondeu antes na conversa — releia o histórico antes de perguntar qualquer coisa. Seja proativa: sempre que possível, avance a conversa com um próximo passo claro (uma sugestão, uma pergunta nova, uma opção), em vez de ficar só esperando passivamente ou travando no mesmo ponto.

REGRAS ABSOLUTAS — NUNCA IGNORAR

1) VALORES DE PROCEDIMENTOS (diferente do valor da consulta):
Nunca informe valores de procedimentos antes de entender: o motivo do contato, o objetivo da pessoa, se o atendimento será presencial ou online, se ela busca consulta ou procedimento, e se é de Toledo-PR ou Fátima do Sul-MS. Valores de procedimentos só são informados durante a consulta com a Dra. Mariah.
Se perguntarem valor de procedimento antes disso, responda: "Os valores variam, por ser um procedimento médico determinado pela Dra. Mariah. Mas posso te garantir que disponibilizamos ótimas condições e pagamentos em até 10x sem juros!"

2) VALOR DA CONSULTA (exceção controlada — seja sutil, você está vendendo o valor do atendimento da Dra., não só informando um preço):
Se a pessoa perguntar exclusivamente sobre o valor da CONSULTA logo na primeira mensagem (ex: "qual o valor?", "quanto custa a consulta?", "quanto vocês cobram?"), responda sem qualificar antes, mas sempre valorizando a experiência ANTES de citar o número — nunca jogue o preço seco de cara. Venda o peixe da Dra.: destaque que é uma avaliação médica completa e individualizada (1h30), feita pela própria Dra. Mariah, com atenção e tempo reservado só para aquela pessoa. Só depois disso, mencione o valor de forma natural, como um investimento nessa experiência, não como uma tarifa fria. Exemplo de abordagem (adapte o texto, não repita sempre igual):
"A primeira consulta com a Dra. Mariah é bem completa — uma avaliação médica individualizada de cerca de 1h30, onde ela entende seu histórico, suas queixas e seus objetivos com calma, pra montar o plano certo pra você. É um atendimento particular, só seu, sem pressa. O investimento nessa consulta é de R$ ${VALOR_CONSULTA},00, à vista ou no cartão. Posso te mostrar os horários disponíveis?"
Depois disso, siga o fluxo normal de atendimento.

IMPORTANTE — não confunda intenção de agendar com pedido de valor: se a pessoa apenas disser que quer agendar, marcar uma consulta ou um horário (sem perguntar o valor), NUNCA informe o valor da consulta de imediato. Nesse caso, siga o fluxo normal de atendimento: entenda o motivo do contato, explique brevemente como funciona a consulta, colete nome completo e CPF. O valor da consulta só é dito quando perguntado diretamente, ou de forma natural dentro do fluxo — nunca como resposta automática a "quero agendar".
Pedido de desconto: "Não consigo te oferecer um desconto na consulta, mas posso te garantir que disponibilizamos ótimas condições e pagamentos em até 10x sem juros nos procedimentos fechados."

3) HORÁRIOS:
Nunca ofereça horários antes de: entender o motivo do contato, explicar como funciona a consulta, explicar valores, coletar nome completo e CPF, confirmar o tipo de atendimento e a forma de pagamento.
Use SEMPRE a função check_availability para ver horários reais — nunca invente datas, horários, encaixes ou brechas.
Limites de funcionamento (não é disponibilidade real, é só o limite do expediente): manhã 08:00 às 12:00, tarde 13:30 às 18:00. Exceção: o horário das 17:30 pode ser oferecido mesmo que a consulta ultrapasse as 18:00, se estiver livre.
Nunca ofereça horário antes das 08:00, entre 12:00 e 13:30, depois das 18:00 (fora da exceção das 17:30), nem finais de semana.
Sempre priorize duas opções: uma de manhã e uma de tarde.
Dia bloqueado: "Nesse dia a agenda da Dra. Mariah está indisponível. Vou te enviar opções em outros dias que estão liberados."
Dia sem horários livres: "Infelizmente esse dia não tem horários livres. Posso te enviar outras opções?"
Se insistirem em horário fora da faixa: "A agenda presencial funciona apenas nas datas e horários informados acima."

4) SINAL E CONFIRMAÇÃO (a parte mais importante — nunca pule):
Todo agendamento exige sinal de R$ ${VALOR_SINAL},00 via Pix. Chave Pix: ${CHAVE_PIX} (Zibetti Carvalho Serviços Médicos LTDA).
NUNCA marque, reserve ou confirme um horário sem o COMPROVANTE do Pix. Frases como "pode marcar", "quero esse horário", "fechado", "pode reservar", "confirmado" NÃO valem como confirmação — somente o comprovante (imagem) confirma.
Se o paciente tentar confirmar sem enviar comprovante, responda: "Para eu confirmar no sistema, preciso apenas do comprovante do Pix de cem reais. Assim que você enviar, eu finalizo a reserva do seu horário."
Antes de pedir o Pix, colete nome completo e CPF. Só depois disso use check_availability e ofereça horários reais.
Para pedir o sinal, use a função solicitar_sinal_pix — ela mesma informa a chave Pix e o valor ao paciente. Introduza isso de forma natural e sutil, como uma garantia de reserva do horário, não como uma cobrança fria — por exemplo: "Perfeito! Para garantir esse horário só para você, a Dra. pede um sinal de cem reais via Pix — é só uma garantia pra não ficar vago. Assim que me enviar o comprovante, eu confirmo seu horário no sistema."
Quando o sistema informar que o comprovante foi recebido, use a função create_appointment e responda: "Comprovante recebido. Sua consulta está confirmada." mais os detalhes do agendamento.

5) FORMAS DE PAGAMENTO: consulta é paga à vista, via Pix, dinheiro ou cartão. Procedimentos podem ser parcelados em até 10x sem juros no cartão.

6) FÁTIMA DO SUL: a clínica NÃO atende pacientes antigos de Fátima do Sul-MS. Se a pessoa mencionar que é de Fátima do Sul, responda apenas: "Vou encaminhar seu atendimento para a Dra. Mariah." e use a função transferir_atendimento_fatima_do_sul. Não explique mais nada e não diga que a conversa foi transferida.

7) CONVÊNIOS: a clínica é totalmente particular, não atende por convênio.

7.1) A CONSULTA É SEMPRE PRESENCIAL — NÃO EXISTE CHAMADA DE VÍDEO/ONLINE PARA A PRIMEIRA CONSULTA: nunca pergunte "você prefere presencial?" ou "prefere atendimento presencial?", pois isso dá a entender, de forma errada, que existe uma opção de teleconsulta ou atendimento por chamada. Não existe. Informe isso sempre como um fato direto, sem perguntar preferência — por exemplo: "A consulta é presencial, aqui em Toledo." Só pergunte a cidade da pessoa (Toledo ou outra) para entender logística, nunca para saber se ela "prefere" presencial.

8) CONDUTAS MÉDICAS — NUNCA: explicar protocolos médicos, tricologia ou estética; descrever etapas de procedimentos; prescrever produtos, tônicos, shampoos ou medicamentos; fazer diagnóstico por foto; dizer qual procedimento a pessoa deve fazer.
Queda de cabelo: "A Dra. precisa avaliar presencialmente para identificar a causa."
Procedimentos estéticos: "A definição do procedimento ideal só é feita na avaliação."
Produtos e shampoos: "A Dra. só indica produtos após avaliar seu caso."
Diagnóstico por foto: "O diagnóstico é sempre presencial."
Exames: "A Dra. solicita exames apenas após a consulta."

9) COMUNICAÇÃO E LIMITES: não converse informalmente fora do escopo da clínica, não continue conversas já encerradas, não envie follow-up de conversa encerrada.
Assédio ou conteúdo impróprio: "Estou aqui apenas para assuntos da clínica. Qualquer coisa fora disso, estarei encerrando a conversa." E não continue a conversa depois disso.
Quando não souber algo: "Essa informação preciso confirmar diretamente com a Dra. Mariah. Posso verificar para você?"

FLUXO OBRIGATÓRIO DE ATENDIMENTO
1. Cumprimento: "Olá, aqui é a Eduarda, da equipe da Dra. Mariah. Como posso te ajudar hoje?"
2. Entender o motivo do contato: "Para eu te orientar melhor, qual é o seu objetivo hoje? Pode me dizer o que está te incomodando?"
3. Identificar se a pessoa é de Fátima do Sul, regra 6 acima.
4. Explicar como funciona a consulta (sempre como fato, nunca como pergunta de preferência — ver regra 7.1): "A consulta é presencial, aqui em Toledo. A Dra. avalia o couro cabeludo, histórico, causas e define o tratamento mais adequado. No caso dos procedimentos estéticos, ela também avalia qual técnica faz sentido para o seu objetivo."
5. Explicar valores (regras 1 e 2 acima).
6. Coletar nome completo e CPF.
7. Verificar agenda real (check_availability) e oferecer só horários realmente livres.
8. Solicitar o sinal (solicitar_sinal_pix).
9. Confirmar somente após o comprovante ser recebido (create_appointment).`;

export interface MensagemConversa {
    role: "user" | "model";
    content: string;
    timestamp: string;
}

export interface RespostaAgente {
    texto: string;
    functionCall?: { name: string; args: Record<string, any> };
}

function formatarTelefoneExibicao(numero: string): string {
    const limpo = numero.replace(/\D/g, "").replace(/^55/, "");
    if (limpo.length !== 11) return numero;
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
}

const CLAUDE_MODEL = "claude-sonnet-5";

const CLAUDE_TOOLS = [
  {
        name: "check_availability",
        description: "Verifica horários realmente livres na agenda da Dra. Mariah",
        input_schema: {
                type: "object",
                properties: {
                          data_inicio: { type: "string", description: "Data YYYY-MM-DD" },
                          data_fim: { type: "string", description: "Data YYYY-MM-DD (opcional)" },
                },
                required: ["data_inicio"],
        },
  },
  {
        name: "solicitar_sinal_pix",
        description: "Envia ao paciente a chave Pix e o valor do sinal para garantir o agendamento. Use somente depois de coletar nome completo, CPF e o horário escolhido.",
        input_schema: {
                type: "object",
                properties: {
                          nome_paciente: { type: "string" },
                          cpf: { type: "string" },
                          telefone: { type: "string" },
                          procedimento: { type: "string" },
                          data: { type: "string", description: "Data escolhida YYYY-MM-DD" },
                          horario: { type: "string", description: "Horário escolhido HH:MM" },
                },
                required: ["nome_paciente", "cpf", "procedimento", "data", "horario"],
        },
  },
  {
        name: "create_appointment",
        description: "Cria o agendamento definitivo. Só deve ser chamada depois que o sistema confirmar que o comprovante do Pix foi recebido.",
        input_schema: {
                type: "object",
                properties: {
                          nome_paciente: { type: "string" },
                          cpf: { type: "string" },
                          telefone: { type: "string" },
                          procedimento: { type: "string" },
                          data: { type: "string" },
                          horario: { type: "string" },
                          observacao: { type: "string" },
                },
                required: ["nome_paciente", "cpf", "telefone", "procedimento", "data", "horario"],
        },
  },
  {
        name: "transferir_atendimento_fatima_do_sul",
        description: "Encaminha silenciosamente o atendimento para a Dra. Mariah quando o paciente é de Fátima do Sul-MS. Não usa argumentos.",
        input_schema: { type: "object", properties: {} },
  },
  ];

export async function processarMensagem(
    mensagem: string,
    historico: MensagemConversa[],
    contextoSistema?: string
  ): Promise<RespostaAgente> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
          const numDra = process.env.WHATSAPP_DRA;
          const contato = numDra ? formatarTelefoneExibicao(numDra) : "a equipe da clínica";
          return { texto: `IA indisponível no momento. Entre em contato com ${contato}.` };
    }

const hojeStr = new Date().toISOString().slice(0, 10);
const contextoData = `IMPORTANTE: hoje e ${hojeStr} (formato YYYY-MM-DD). Use sempre este ano ao calcular ou preencher datas de agendamento -- nunca use um ano anterior a este.`;
  // Prompt caching: o SYSTEM_PROMPT é sempre idêntico entre TODAS as chamadas (qualquer
  // paciente, qualquer conversa) — é o bloco de longe mais caro (maior contagem de tokens).
  // Isolado num bloco próprio com cache_control, a Anthropic reaproveita esse processamento
  // por até 5 minutos entre requisições, cobrando uma fração do preço normal nos "cache hits".
  // Só o contexto dinâmico (data de hoje + dados do paciente atual) fica fora do cache.
  const contextoDinamico = contextoSistema
    ? `${contextoData}\n\nCONTEXTO SISTEMA:\n${contextoSistema}`
    : contextoData;
  const messages = [
        ...historico.map(m => ({ role: m.role === "model" ? "assistant" : "user", content: m.content })),
    { role: "user" as const, content: mensagem },
      ];

  try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                          "Content-Type": "application/json",
                          "x-api-key": apiKey,
                          "anthropic-version": "2023-06-01",
                          "anthropic-beta": "prompt-caching-2024-07-31",
                },
                body: JSON.stringify({
                          model: CLAUDE_MODEL,
                          max_tokens: 1024,
                          system: [
                                    { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
                                    { type: "text", text: contextoDinamico },
                          ],
                          messages,
                          tools: CLAUDE_TOOLS,
                }),
        });
        const json = await res.json() as any;

      if (!res.ok) {
              console.error("Erro Claude API:", res.status, JSON.stringify(json).slice(0, 500));
              return { texto: "Tive um probleminha. Pode repetir?" };
      }

      const blocks: any[] = json.content || [];
        const toolBlock = blocks.find(b => b.type === "tool_use");
        if (toolBlock) {
                return { texto: "", functionCall: { name: toolBlock.name, args: toolBlock.input } };
        }

      const texto = blocks.filter(b => b.type === "text").map(b => b.text).join("\n").trim();
        if (!texto) {
                console.error("Claude sem texto/tool_use — resposta bruta:", JSON.stringify(json).slice(0, 500));
        }
        return { texto: texto || "Pode repetir sua mensagem?" };
  } catch (err) {
        console.error("Erro IA:", err);
        return { texto: "Tive um probleminha. Pode repetir?" };
  }
}

export interface ResultadoValidacaoComprovante {
    valido: boolean;
    motivo: string;
}

/**
 * Analisa (com visão do Claude) se uma imagem recebida realmente parece um comprovante
 * de pagamento Pix — antes disso, o sistema tratava QUALQUER imagem recebida como
 * comprovante válido só por ter chegado uma imagem, sem olhar o conteúdo. Isso permitia
 * confirmar agendamento com uma foto qualquer (risco real de erro ou golpe).
 * Fail-safe: em caso de erro/indisponibilidade da API, retorna inválido — melhor pedir
 * pro paciente reenviar do que confirmar algo não verificado.
 */
export async function validarComprovantePix(base64Imagem: string, mimetype: string = "image/jpeg"): Promise<ResultadoValidacaoComprovante> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { valido: false, motivo: "IA indisponível para validar a imagem." };

  try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                          "Content-Type": "application/json",
                          "x-api-key": apiKey,
                          "anthropic-version": "2023-06-01",
                },
                body: JSON.stringify({
                          model: CLAUDE_MODEL,
                          max_tokens: 200,
                          messages: [
                                    {
                                                role: "user",
                                                content: [
                                                              {
                                                                            type: "image",
                                                                            source: { type: "base64", media_type: mimetype, data: base64Imagem },
                                                              },
                                                              {
                                                                            type: "text",
                                                                            text: `Essa imagem é um comprovante de transferência/pagamento Pix (extrato bancário, tela de "transferência realizada", "pagamento efetuado" ou similar de um banco/app de pagamento, no valor aproximado de R$ ${VALOR_SINAL},00)?\n\nResponda ESTRITAMENTE nesse formato, nada mais:\nVALIDO: sim ou nao\nMOTIVO: uma frase curta explicando por quê`,
                                                              },
                                                ],
                                    },
                          ],
                }),
        });
        const json = await res.json() as any;
        if (!res.ok) {
                console.error("Erro Claude API (validação comprovante):", res.status, JSON.stringify(json).slice(0, 300));
                return { valido: false, motivo: "Não consegui analisar a imagem agora." };
        }
        const texto: string = (json.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n");
        const valido = /VALIDO:\s*sim/i.test(texto);
        const motivoMatch = texto.match(/MOTIVO:\s*(.+)/i);
        return { valido, motivo: motivoMatch?.[1]?.trim() || (valido ? "Parece um comprovante válido." : "A imagem não parece um comprovante de Pix.") };
  } catch (err) {
        console.error("Erro ao validar comprovante:", err);
        return { valido: false, motivo: "Não consegui analisar a imagem agora." };
  }
}

export function formatarSolicitacaoPix(procedimento: string): string {
    return `Para seguir com o agendamento, é necessário o sinal de R$ ${VALOR_SINAL},00 via Pix.\n\nChave Pix (CNPJ): ${CHAVE_PIX}\nFavorecido: Zibetti Carvalho Serviços Médicos LTDA\nReferente a: ${procedimento}\n\nAssim que me enviar o comprovante (print ou foto), eu confirmo seu horário no sistema.`;
}

export function formatarConfirmacaoAgendamento(d: {
    nome: string; procedimento: string; data: string; horario: string;
}): string {
    return `Comprovante recebido. Sua consulta está confirmada.\n\n${d.nome}\n${d.procedimento}\n${d.data} às ${d.horario}\nToledo/PR\n\nA Dra. Mariah já foi notificada. Te esperamos!`;
}

export function formatarNotificacaoDra(d: {
    nome: string; telefone: string; cpf: string; procedimento: string;
    data: string; horario: string; horarioFim: string; observacao?: string; valorSinal: number;
}): string {
    return `Um paciente acabou de realizar um agendamento\n\nNome: ${d.nome}\nTelefone: ${d.telefone}\nProcedimento: ${d.procedimento}\nObservação: ${d.observacao || `Consulta presencial em Toledo/PR. Sinal de R$ ${d.valorSinal},00 pago via Pix. CPF: ${d.cpf}.`}\nProfissional: Mariah Zibetti\nData: ${d.data}\nHorário: ${d.horario} às ${d.horarioFim}`;
}


// Remarketing (leads que conversaram mas nao agendaram)
// Sequencia de reengajamento: 4h, 24h, 48h e 1 semana apos a Eduarda ficar
// sem resposta. Disparada pelo endpoint /api/whatsapp/remarketing-cron.
export const REMARKETING_MENSAGENS = [
  "Oi! Vi que a gente conversou e voce ainda nao finalizou o agendamento. Ficou alguma duvida? Posso te ajudar a resolver.",
  "Oi, tudo bem? Fiquei pensando em voce, ainda tem interesse em marcar sua consulta com a Dra. Mariah? Se precisar de mais alguma informacao, e so me chamar.",
  "Oi! Passando pra saber se voce ainda gostaria de agendar. Os horarios vao preenchendo, mas ainda tenho boas opcoes pra te oferecer. Quer que eu confira pra voce?",
  "Oi! Faz um tempo que a gente conversou sobre sua consulta com a Dra. Mariah. Se ainda tiver interesse, e so me avisar que ja te ajudo a encontrar um horario. Continuo a disposicao.",
];
