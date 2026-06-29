import { pgTable, text, integer, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  role: text('role').notNull(), // 'medica' | 'paciente'
  nome: text('nome').notNull(),
  cpf: text('cpf').unique().notNull(),
  senhaHash: text('senha_hash').notNull(),
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
  id:        text('id').primaryKey(),
  telefone:  text('telefone').notNull(),
  role:      text('role').notNull(), // 'user' | 'ia'
  conteudo:  text('conteudo').notNull(),
  timestamp: text('timestamp').notNull(),
});
