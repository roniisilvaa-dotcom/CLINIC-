import { pgTable, text, integer, jsonb , doublePrecision} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  role: text('role').notNull(), // 'medica' | 'dev'
  nome: text('nome').notNull(),
  cpf: text('cpf').unique().notNull(),
  senhaHash: text('senha_hash').notNull(),
  email: text('email'),
  sessionToken: text('session_token'),
});

export const pacientes = pgTable('pacientes', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  idade: integer('idade').notNull(),
  dataNascimento: text('data_nascimento').notNull(),
  cpf: text('cpf').unique().notNull(),
  telefone: text('telefone').notNull(),
  email: text('email').notNull(),
  cidade: text('cidade').notNull(),
  comoConheceu: text('como_conheceu'),
  queixaPrincipal: text('queixa_principal').notNull(),
  status: text('status').notNull(),
  progresso: integer('progresso').notNull().default(0),
  ultimaAtualizacao: text('ultima_atualizacao').notNull(),
  antecedentes: jsonb('antecedentes').notNull(),
  diagnostico: jsonb('diagnostico').notNull(),
  protocolo: jsonb('protocolo').notNull(),
  tags: jsonb('tags').default([]),
  // Token de sessão do próprio paciente (login por CPF em /api/auth/paciente-login).
  // Permite que ele veja só os próprios dados nas rotas protegidas — ver
  // requireStaffOrOwnPaciente em api/index.ts.
  sessionToken: text('session_token'),
});

export const consultas = pgTable('consultas', {
  id: text('id').primaryKey(),
  pacienteId: text('paciente_id').references(() => pacientes.id).notNull(),
  data: text('data').notNull(),
  tipo: text('tipo').notNull(),
  queixa: text('queixa').notNull(),
  evolucao: text('evolucao').notNull(),
  alteracoesProtocolo: text('alteracoes_protocolo').notNull(),
  examesSolicitados: text('exames_solicitados').notNull(),
  resumoIa: text('resumo_ia'),
});

export const exames = pgTable('exames', {
  id: text('id').primaryKey(),
  pacienteId: text('paciente_id').references(() => pacientes.id).notNull(),
  data: text('data').notNull(),
  tsh: text('tsh'),
  t4Livre: text('t4_livre'),
  ferritina: text('ferritina'),
  hemoglobina: text('hemoglobina'),
  testosteronaTotal: text('testosterona_total'),
  testosteronaLivre: text('testosterona_livre'),
  dheas: text('dheas'),
  zinco: text('zinco'),
  vitD: text('vit_d'),
  vitB12: text('vit_b12'),
  analiseIA: text('analise_ia'),
  statusMap: jsonb('status_map').notNull(),
});

export const galeria = pgTable('galeria', {
  id: text('id').primaryKey(),
  pacienteId: text('paciente_id').references(() => pacientes.id).notNull(),
  data: text('data').notNull(),
  horario: text('horario'),
  posicao: text('posicao').notNull(),
  url: text('url').notNull(),
  notaIa: text('nota_ia'),
});

export const agendaEventos = pgTable('agenda_eventos', {
  id: text('id').primaryKey(),
  pacienteId: text('paciente_id').references(() => pacientes.id).notNull(),
  data: text('data').notNull(),
  horario: text('horario').notNull(),
  tipo: text('tipo').notNull(),
  procedimentoTag: text('procedimento_tag').notNull(),
  duracaoMinutos: integer('duracao_minutos').notNull().default(30),
  status: text('status').notNull(),
  diagnosticoResumo: text('diagnostico_resumo'),
  // Etapas de lembrete de consulta já enviadas via WhatsApp (ex: ["5d","2d","1d","3h"]).
  // Evita reenviar o mesmo lembrete várias vezes — ver src/routes/lembretes.ts.
  lembretesEnviados: jsonb('lembretes_enviados').default([]),
});

export const filaEspera = pgTable('fila_espera', {
  id: text('id').primaryKey(),
  pacienteId: text('paciente_id').references(() => pacientes.id).notNull(),
  procedimentoTag: text('procedimento_tag').notNull(),
  duracaoMinutos: integer('duracao_minutos').notNull(),
  dataDesejadaInicio: text('data_desejada_inicio').notNull(),
  dataDesejadaFim: text('data_desejada_fim').notNull(),
  status: text('status').notNull(),
});

export const pacotesVendidos = pgTable('pacotes_vendidos', {
  id: text('id').primaryKey(),
  pacienteId: text('paciente_id').references(() => pacientes.id).notNull(),
  nomePacote: text('nome_pacote').notNull(),
  quantidadeTotal: integer('quantidade_total').notNull(),
  sessoesRealizadas: integer('sessoes_realizadas').notNull().default(0),
  status: text('status').notNull(), // 'Ativo', 'Concluido'
});

// ── WhatsApp Bot ─────────────────────────────────────────────────────
export const conversasWhatsapp = pgTable('conversas_whatsapp', {
  id: text('id').primaryKey(),
  telefone: text('telefone').notNull(),
  role: text('role').notNull(), // 'user' | 'ia'
  conteudo: text('conteudo').notNull(),
  timestamp: text('timestamp').notNull(),
});

// Contatos para os quais a IA foi pausada manualmente pela Dra./equipe (ex: paciente
// insistindo com pedido fora do escopo do bot). Persistido no banco — não só em
// memória — pra não correr o risco de "voltar a responder sozinha" se o servidor
// (Vercel, serverless) reiniciar ou trocar de instância. Ver src/services/whatsappCore.ts.
export const whatsappSilenciados = pgTable('whatsapp_silenciados', {
  telefone: text('telefone').primaryKey(),
  motivo: text('motivo'),
  criadoEm: text('criado_em').notNull(),
});

// Dias em que a Dra. Mariah estará atendendo presencialmente — em Toledo OU em
// Fátima do Sul (campo "local"). Cadastro manual via calendário clicável no painel
// (ver "Configurar" no módulo IA Secretária WhatsApp) — geralmente um mês inteiro
// marcado de uma vez. "horarios" permite customizar os horários de UM dia
// específico (ex: só de manhã naquele dia); quando null/vazio, usa o padrão da
// clínica (HORARIOS_BASE em whatsappCore.ts). A IA do WhatsApp hoje só consulta
// os dias marcados como "Toledo" pra agendar sozinha — Fátima do Sul continua
// sendo repassado pra Dra./equipe decidir na mão (ver
// transferir_atendimento_fatima_do_sul em iaSecretaria.ts). id = `${local}::${data}`.
export const diasAtendimento = pgTable('dias_atendimento', {
  id: text('id').primaryKey(),
  local: text('local').notNull(), // 'Toledo' | 'Fátima do Sul'
  data: text('data').notNull(),
  horarios: jsonb('horarios'), // ex: ["10:00","11:00"] — override pra esse dia; null = padrão
  criadoEm: text('criado_em').notNull(),
});

// Bloqueios da agenda — dois tipos: 'semana' bloqueia um dia da semana inteiro
// e recorrente (ex: sábado, domingo — diaSemana 0=domingo...6=sábado), 'data'
// bloqueia uma data específica (feriado, viagem da Dra. etc). Tem prioridade
// sobre dias marcados em diasAtendimento — mesmo que um dia esteja marcado
// como disponível, se bater um bloqueio a IA nunca oferece esse dia (ver
// checkAvailability em whatsappCore.ts). id = `semana::${diaSemana}` ou
// `data::${data}`.
export const bloqueiosAgenda = pgTable('bloqueios_agenda', {
  id: text('id').primaryKey(),
  tipo: text('tipo').notNull(), // 'semana' | 'data'
  diaSemana: integer('dia_semana'), // 0-6, só quando tipo = 'semana'
  data: text('data'), // YYYY-MM-DD, só quando tipo = 'data'
  motivo: text('motivo'),
  criadoEm: text('criado_em').notNull(),
});

// ── Prescricoes (biblioteca de templates) ──────────────────────────────
export const prescricoesTemplates = pgTable('prescricoes_templates', {
  id: text('id').primaryKey(),
  titulo: text('titulo').notNull(),
  diagnosticoRef: text('diagnostico_ref'),
  categoria: text('categoria').notNull(),
  medicamentos: text('medicamentos'),
  procedimentos: text('procedimentos'),
  suplementacao: text('suplementacao'),
  cosmeticos: text('cosmeticos'),
});

// Configurações editáveis da IA pelo painel — a Dra. pode mudar preços, chave Pix
// e adicionar instruções extras (o "ensinar a IA") sem precisar pedir deploy de
// código pra ninguém. id = chave da config (ex: 'valorSinal', 'valorConsulta',
// 'chavePix', 'instrucoesExtras'). valor sempre como texto (números convertidos
// na leitura, ver getConfigIa() em iaSecretaria.ts) pra manter o schema simples.
export const configuracoesIa = pgTable('configuracoes_ia', {
  id: text('id').primaryKey(),
  valor: text('valor').notNull(),
  atualizadoEm: text('atualizado_em').notNull(),
});

// ── Faturamento (transacoes financeiras) ────────────────────────────
export const transacoesFinanceiras = pgTable('transacoes_financeiras', {
  id: text('id').primaryKey(),
  pacienteId: text('paciente_id').notNull(),
  pacienteNome: text('paciente_nome').notNull(),
  data: text('data').notNull(),
  descricao: text('descricao').notNull(),
  valor: doublePrecision('valor').notNull(),
  metodo: text('metodo').notNull(),
  status: text('status').notNull(),
  unidade: text('unidade').notNull(),
});
