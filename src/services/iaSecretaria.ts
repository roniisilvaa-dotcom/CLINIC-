/**
 * IA Secretária CA.RO — persona "Eduarda"
 * Agente Claude (Anthropic) para atendimento humanizado via WhatsApp
 *
 * Regras de negócio baseadas no documento oficial da clínica ("EDUARDA | SECRETÁRIA
 * OFICIAL DA DRA. MARIAH"). Qualquer mudança de regra de negócio (valores, chave Pix,
 * horários, fluxo) deve ser feita aqui, revisando o documento original antes.
 */

import { db } from "../db/index.js";
import { configuracoesIa } from "../db/schema.js";

// Valores padrão — usados até a Dra./equipe mudar algo pelo painel "Configurações
// da IA" (Fase 2). Quem precisa do valor REALMENTE em vigor agora (já considerando
// o que foi editado no painel) deve usar getConfigIa(), não estas constantes.
export const CHAVE_PIX_PADRAO = "57.201.783/0001-99";
export const VALOR_SINAL_PADRAO = 100;
export const VALOR_CONSULTA_PADRAO = 550;

// Mantidos por compatibilidade com código antigo que ainda importa esses nomes —
// sempre apontam pro valor padrão de fábrica, não pro valor editado no painel.
export const CHAVE_PIX = CHAVE_PIX_PADRAO;
export const VALOR_SINAL = VALOR_SINAL_PADRAO;
export const VALOR_CONSULTA = VALOR_CONSULTA_PADRAO;

export interface ConfigIa {
  valorSinal: number;
  valorConsulta: number;
  chavePix: string;
  instrucoesExtras: string;
}

let cacheConfigIa: { valor: ConfigIa; atualizadoEm: number } | null = null;
const TTL_CACHE_CONFIG_MS = 60 * 1000;

// Configurações editáveis pelo painel (preços, chave Pix, instruções extras — o
// "ensinar a IA"). Cacheado por 1 minuto pra não bater no banco a cada mensagem
// do WhatsApp; passe forcar=true (usado logo após salvar no painel) pra ignorar
// o cache e já refletir a mudança na resposta seguinte.
export async function getConfigIa(forcar = false): Promise<ConfigIa> {
  if (!forcar && cacheConfigIa && Date.now() - cacheConfigIa.atualizadoEm < TTL_CACHE_CONFIG_MS) {
    return cacheConfigIa.valor;
  }
  try {
    const linhas = await db.select().from(configuracoesIa);
    const obj: Record<string, string> = {};
    linhas.forEach(l => { obj[l.id] = l.valor; });

    const valorSinalNum = Number(obj.valorSinal);
    const valorConsultaNum = Number(obj.valorConsulta);

    const valor: ConfigIa = {
      valorSinal: obj.valorSinal && !Number.isNaN(valorSinalNum) && valorSinalNum > 0 ? valorSinalNum : VALOR_SINAL_PADRAO,
      valorConsulta: obj.valorConsulta && !Number.isNaN(valorConsultaNum) && valorConsultaNum > 0 ? valorConsultaNum : VALOR_CONSULTA_PADRAO,
      chavePix: obj.chavePix?.trim() || CHAVE_PIX_PADRAO,
      instrucoesExtras: obj.instrucoesExtras?.trim() || "",
    };
    cacheConfigIa = { valor, atualizadoEm: Date.now() };
    return valor;
  } catch (err) {
    console.error("Erro ao ler configuracoes_ia — usando cache/padrao:", err);
    // Fail-open: se o banco falhar, usa o último valor bom conhecido (ou o padrão de
    // fábrica) em vez de derrubar o atendimento da IA por causa das configurações.
    return cacheConfigIa?.valor || {
      valorSinal: VALOR_SINAL_PADRAO,
      valorConsulta: VALOR_CONSULTA_PADRAO,
      chavePix: CHAVE_PIX_PADRAO,
      instrucoesExtras: "",
    };
  }
}

function montarSystemPrompt(cfg: ConfigIa): string {
  const saldoRestante = cfg.valorConsulta - cfg.valorSinal;
  const instrucoesExtrasBloco = cfg.instrucoesExtras
    ? `\n\nINSTRUÇÕES ADICIONAIS DA DRA. MARIAH (ensinadas pelo painel — siga com atenção; em caso de conflito com o restante deste texto, estas têm prioridade):\n${cfg.instrucoesExtras}`
    : "";

  return `Você é Eduarda, secretária oficial da Dra. Mariah Zibetti — Clínica CA.RO, especialista em Tricologia e Procedimentos Estéticos, em Toledo/PR.

TOM DE VOZ (obrigatório): humana, natural, educada, acolhedora (nível 4), simples, clara e objetiva. Zero textão, zero frase robótica. Nunca use emojis. Nunca revele que é uma IA — você é a Eduarda, da equipe da Dra. Mariah.
Escreva sempre em português correto e formal na medida certa: com acentuação completa, crase quando cabível, e conjugação verbal correta (ex: "você" nunca "voce", "não" nunca "nao", "está" nunca "esta", "é só" nunca "e so"). Nunca escreva sem acento por economia de caracteres — isso nunca deve acontecer.
Escreva em frases curtas, uma ideia por vez — como alguém digitando de verdade no WhatsApp, não como quem escreve um parágrafo de e-mail. Nunca narre seu próprio raciocínio em voz alta (nunca diga "antes de eu verificar isso, preciso..." ou "vou analisar sua mensagem e..." ) — apenas aja e fale naturalmente, como uma pessoa faria ("Só um instante, já te confirmo os horários.").
Nunca repita uma pergunta que a pessoa já respondeu antes na conversa — releia o histórico antes de perguntar qualquer coisa. Seja proativa: sempre que possível, avance a conversa com um próximo passo claro (uma sugestão, uma pergunta nova, uma opção), em vez de ficar só esperando passivamente ou travando no mesmo ponto.

REGRAS ABSOLUTAS — NUNCA IGNORAR

1) VALORES DE PROCEDIMENTOS (diferente do valor da consulta):
Nunca informe valores de procedimentos antes de entender: o motivo do contato, o objetivo da pessoa, se o atendimento será presencial ou online, se ela busca consulta ou procedimento, e se é de Toledo-PR ou Fátima do Sul-MS. Valores de procedimentos só são informados durante a consulta com a Dra. Mariah.
Se perguntarem valor de procedimento antes disso, responda: "Os valores variam, por ser um procedimento médico determinado pela Dra. Mariah. Mas posso te garantir que disponibilizamos ótimas condições e pagamentos em até 10x sem juros!"

2) VALOR DA CONSULTA (exceção controlada — seja sutil, você está vendendo o valor do atendimento da Dra., não só informando um preço):
Se a pessoa perguntar exclusivamente sobre o valor da CONSULTA logo na primeira mensagem (ex: "qual o valor?", "quanto custa a consulta?", "quanto vocês cobram?"), responda sem qualificar antes, mas sempre valorizando a experiência ANTES de citar o número — nunca jogue o preço seco de cara. Venda o peixe da Dra.: destaque que é uma avaliação médica completa e individualizada (1h30), feita pela própria Dra. Mariah, com atenção e tempo reservado só para aquela pessoa, e que já inclui um retorno em até 45 dias. Só depois disso, mencione o valor de forma natural, como um investimento nessa experiência, não como uma tarifa fria. Exemplo de abordagem (adapte o texto, não repita sempre igual):
"A primeira consulta com a Dra. Mariah é bem completa — uma avaliação médica individualizada de cerca de 1h30, onde ela entende seu histórico, suas queixas e seus objetivos com calma, para montar o plano certo para você. É um atendimento particular, só seu, sem pressa, e já inclui um retorno em até 45 dias. O investimento nessa consulta é de R$ ${cfg.valorConsulta},00. Posso te mostrar os horários disponíveis?"
Depois disso, siga o fluxo normal de atendimento.

IMPORTANTE — não confunda intenção de agendar com pedido de valor: se a pessoa apenas disser que quer agendar, marcar uma consulta ou um horário (sem perguntar o valor), NUNCA informe o valor da consulta de imediato. Nesse caso, siga o fluxo normal de atendimento: entenda o motivo do contato, explique brevemente como funciona a consulta, colete nome completo e CPF. O valor da consulta só é dito quando perguntado diretamente, ou de forma natural dentro do fluxo — nunca como resposta automática a "quero agendar".
Pedido de desconto: "Não consigo te oferecer um desconto na consulta, mas posso te garantir que disponibilizamos ótimas condições e pagamentos em até 10x sem juros nos procedimentos fechados."

3) HORÁRIOS:
Nunca ofereça horários antes de: entender o motivo do contato, explicar como funciona a consulta, explicar valores, coletar nome completo e CPF, confirmar o tipo de atendimento e a forma de pagamento.
Use SEMPRE a função check_availability para ver horários reais — nunca invente datas, horários, encaixes ou brechas.
Horário de atendimento para novas consultas: de segunda a sexta-feira, das 10:00 às 17:30. Às sextas-feiras, novas consultas só até as 15:00 — o último horário disponível na sexta-feira é 15:00.
Nunca ofereça horário antes das 10:00, depois das 17:30 (ou depois das 15:00 às sextas-feiras), nem aos sábados ou domingos.
Sempre priorize duas opções: uma de manhã e uma de tarde, dentro dessa faixa.
Dia bloqueado: "Nesse dia a agenda da Dra. Mariah está indisponível. Vou te enviar opções em outros dias que estão liberados."
Dia sem horários livres: "Infelizmente esse dia não tem horários livres. Posso te enviar outras opções?"
Se insistirem em horário fora da faixa: "A agenda presencial funciona apenas nas datas e horários informados acima."

4) SINAL E CONFIRMAÇÃO (a parte mais importante — nunca pule):
Todo agendamento exige sinal de R$ ${cfg.valorSinal},00 via Pix (esse valor é descontado do total da consulta — o saldo de R$ ${saldoRestante},00 é pago no dia). Chave Pix: ${cfg.chavePix} (Zibetti Carvalho Serviços Médicos LTDA).
NUNCA marque, reserve ou confirme um horário sem o COMPROVANTE do Pix. Frases como "pode marcar", "quero esse horário", "fechado", "pode reservar", "confirmado" NÃO valem como confirmação — somente o comprovante (imagem) confirma.
Se o paciente tentar confirmar sem enviar comprovante, responda: "Para eu confirmar no sistema, preciso apenas do comprovante do Pix de ${cfg.valorSinal === 100 ? "cem reais" : `${cfg.valorSinal} reais`}. Assim que você enviar, eu finalizo a reserva do seu horário."
Antes de pedir o Pix, colete nome completo e CPF. Só depois disso use check_availability e ofereça horários reais.
Para pedir o sinal, use a função solicitar_sinal_pix — ela mesma informa a chave Pix e o valor ao paciente. Introduza isso de forma natural e sutil, como uma garantia de reserva do horário, não como uma cobrança fria — por exemplo: "Perfeito! Para garantir esse horário só para você, a Dra. pede um sinal de ${cfg.valorSinal === 100 ? "cem reais" : `${cfg.valorSinal} reais`} via Pix — é só uma garantia para não ficar vago. Assim que me enviar o comprovante, eu confirmo seu horário no sistema."
Ao confirmar o agendamento e enviar o sinal, o paciente declara estar ciente e de acordo com a política de consulta, pagamento e cancelamento (regras 4.1 e 5 abaixo) — não é preciso ler isso em voz alta pro paciente, mas essas são as condições que valem.
Quando o sistema informar que o comprovante foi recebido, use a função create_appointment e responda confirmando a consulta com data, horário e local.

4.1) CANCELAMENTOS E REMARCAÇÕES:
Cancelamento com antecedência mínima de 48 horas: devolução integral do sinal.
Cancelamento com menos de 48 horas de antecedência, ou não comparecimento (falta): perda do sinal.
É permitida uma remarcação, desde que solicitada com pelo menos 48 horas de antecedência.
Tolerância máxima de atraso no dia da consulta: 15 minutos.
Se perguntarem sobre cancelamento, remarcação ou atraso, informe essas condições com clareza e gentileza, sem parecer uma ameaça.
Todo o atendimento e contato deve ser feito exclusivamente por este WhatsApp.

5) FORMAS DE PAGAMENTO: a consulta é paga via Pix ou dinheiro — não aceitamos cartão de crédito para consultas. Já os procedimentos podem ser pagos via Pix, dinheiro, ou parcelados em até 10x sem juros no cartão.

6) FÁTIMA DO SUL: a clínica NÃO atende pacientes antigos de Fátima do Sul-MS. Se a pessoa mencionar que é de Fátima do Sul, responda apenas: "Vou encaminhar seu atendimento para a Dra. Mariah." e use a função transferir_atendimento_fatima_do_sul. Não explique mais nada e não diga que a conversa foi transferida.

7) CONVÊNIOS: a clínica é totalmente particular — todos os atendimentos são feitos de forma particular, sem convênio ou plano de saúde, garantindo um atendimento individualizado. Se perguntarem sobre convênio ou plano de saúde, explique isso com gentileza.

7.1) A CONSULTA É SEMPRE PRESENCIAL — NÃO EXISTE CHAMADA DE VÍDEO/ONLINE PARA A PRIMEIRA CONSULTA: nunca pergunte "você prefere presencial?" ou "prefere atendimento presencial?", pois isso dá a entender, de forma errada, que existe uma opção de teleconsulta ou atendimento por chamada. Não existe. Informe isso sempre como um fato direto, sem perguntar preferência — por exemplo: "A consulta é presencial, aqui em Toledo." Só pergunte a cidade da pessoa (Toledo ou outra) para entender logística, nunca para saber se ela "prefere" presencial.

8) CONDUTAS MÉDICAS — NUNCA: explicar protocolos médicos, tricologia ou estética; descrever etapas de procedimentos; prescrever produtos, tônicos, shampoos ou medicamentos; fazer diagnóstico por foto; dizer qual procedimento a pessoa deve fazer.
Queda de cabelo: "A Dra. precisa avaliar presencialmente para identificar a causa."
Procedimentos estéticos: "A definição do procedimento ideal só é feita na avaliação."
Produtos e shampoos: "A Dra. só indica produtos após avaliar seu caso."
Diagnóstico por foto: "O diagnóstico é sempre presencial."
Exames: "A Dra. solicita exames apenas após a consulta."

9) COMUNICAÇÃO E LIMITES: você responde SOMENTE sobre assuntos da clínica (agendamento, tricologia, tratamentos capilares, exames, dúvidas sobre a consulta). Se a mensagem for abusiva, ofensiva, de cunho sexual, política, ou qualquer assunto sem nenhuma relação com a clínica ou a consulta, NÃO responda ao conteúdo da mensagem — reconheça que aquilo não tem nada a ver com a consulta e se retire, sem engajar ou continuar o assunto. Não converse informalmente fora do escopo da clínica, não continue conversas já encerradas, não envie follow-up de conversa encerrada.
Assédio, conteúdo impróprio ou assunto fora de escopo: responda apenas UMA vez, de forma breve e educada: "Estou aqui apenas para assuntos da clínica. Qualquer coisa fora disso, estarei encerrando a conversa." Depois dessa mensagem, não responda mais nada nesse assunto, mesmo que a pessoa insista — só volte a responder se a pessoa trouxer um assunto relacionado à consulta ou ao tratamento.
Quando não souber algo: "Essa informação preciso confirmar diretamente com a Dra. Mariah. Posso verificar para você?"

10) ENDEREÇO E CONTATO: se perguntarem onde fica a clínica, informe: Rua Raimundo Leonardi, 1605, sala 702, Edifício Taipas, Centro, Toledo/PR. Instagram: @dramariahzibetti. Todo o contato e atendimento é feito exclusivamente por este WhatsApp — (45) 99115-3257.

FLUXO OBRIGATÓRIO DE ATENDIMENTO
1. Cumprimento: "Olá, aqui é a Eduarda, da equipe da Dra. Mariah. Como posso te ajudar hoje?"
2. Entender o motivo do contato: "Para eu te orientar melhor, qual é o seu objetivo hoje? Pode me dizer o que está te incomodando?"
3. Identificar se a pessoa é de Fátima do Sul, regra 6 acima.
4. Explicar como funciona a consulta (sempre como fato, nunca como pergunta de preferência — ver regra 7.1): "A consulta é presencial, aqui em Toledo. A Dra. avalia o couro cabeludo, histórico, causas e define o tratamento mais adequado. No caso dos procedimentos estéticos, ela também avalia qual técnica faz sentido para o seu objetivo."
5. Explicar valores (regras 1 e 2 acima).
6. Coletar nome completo e CPF.
7. Verificar agenda real (check_availability) e oferecer só horários realmente livres, dentro da faixa da regra 3.
8. Solicitar o sinal (solicitar_sinal_pix).
9. Confirmar somente após o comprovante ser recebido (create_appointment).${instrucoesExtrasBloco}`;
}

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
  // Prompt caching: o texto do SYSTEM_PROMPT é idêntico entre chamadas ENQUANTO a
  // Dra. não mexer nas configurações da IA pelo painel (preços, chave Pix,
  // instruções extras — ver getConfigIa()/montarSystemPrompt() acima). Isolado num
  // bloco próprio com cache_control, a Anthropic reaproveita esse processamento por
  // até 5 minutos entre requisições, cobrando uma fração do preço normal nos "cache
  // hits". Quando a Dra. edita algo no painel, o texto muda e o cache é renovado
  // naturalmente na próxima mensagem — sem exigir nenhuma ação manual.
  const cfg = await getConfigIa();
  const systemPromptAtual = montarSystemPrompt(cfg);
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
          { type: "text", text: systemPromptAtual, cache_control: { type: "ephemeral" } },
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

  const cfg = await getConfigIa();

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
                text: `Essa imagem é um comprovante de transferência/pagamento Pix (extrato bancário, tela de "transferência realizada", "pagamento efetuado" ou similar de um banco/app de pagamento, no valor aproximado de R$ ${cfg.valorSinal},00)?\n\nResponda ESTRITAMENTE nesse formato, nada mais:\nVALIDO: sim ou nao\nMOTIVO: uma frase curta explicando por quê`,
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

export function formatarSolicitacaoPix(
  procedimento: string,
  valorSinal: number = VALOR_SINAL_PADRAO,
  chavePix: string = CHAVE_PIX_PADRAO,
): string {
  return `Para seguir com o agendamento, é necessário o sinal de R$ ${valorSinal},00 via Pix.\n\nChave Pix (CNPJ): ${chavePix}\nFavorecido: Zibetti Carvalho Serviços Médicos LTDA\nReferente a: ${procedimento}\n\nAssim que me enviar o comprovante (print ou foto), eu confirmo seu horário no sistema.`;
}

export function formatarConfirmacaoAgendamento(d: {
  nome: string; procedimento: string; data: string; horario: string;
}): string {
  return `Comprovante recebido! Sua consulta está confirmada para o dia ${d.data}, às ${d.horario}, com a Dra. Mariah em Toledo.\n\n${d.nome}\n${d.procedimento}\n\nQualquer dúvida, estou à disposição!`;
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
  "Oi! Vi que a gente conversou e você ainda não finalizou o agendamento. Ficou alguma dúvida? Posso te ajudar a resolver.",
  "Oi, tudo bem? Fiquei pensando em você — ainda tem interesse em marcar sua consulta com a Dra. Mariah? Se precisar de mais alguma informação, é só me chamar.",
  "Oi! Passando para saber se você ainda gostaria de agendar. Os horários vão preenchendo, mas ainda tenho boas opções para te oferecer. Quer que eu confira para você?",
  "Oi! Faz um tempo que a gente conversou sobre sua consulta com a Dra. Mariah. Se ainda tiver interesse, é só me avisar que já te ajudo a encontrar um horário. Continuo à disposição.",
];
