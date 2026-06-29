-- CA.RO Clinic — schema multi-tenant (SaaS)
-- Cada clínica é um tenant isolado. Médicos/equipe e pacientes pertencem a uma clínica.

create table if not exists clinicas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text unique not null,
  plano text not null default 'Standard',
  criada_em timestamptz not null default now()
);

create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references clinicas(id) on delete cascade,
  nome text not null,
  email text not null unique,
  senha_hash text not null,
  papel text not null default 'medica', -- medica | secretaria | admin
  crm text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists pacientes (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references clinicas(id) on delete cascade,
  nome text not null,
  cpf text not null,
  data_nascimento date,
  idade int,
  telefone text,
  email text,
  cidade text,
  como_conheceu text,
  queixa_principal text,
  status text not null default 'Em Tratamento',
  progresso int not null default 0,
  ultima_atualizacao text,
  -- blocos clínicos guardados como JSONB (espelham os tipos do front; normalizamos depois)
  antecedentes jsonb not null default '{}'::jsonb,
  diagnostico jsonb not null default '{}'::jsonb,
  protocolo jsonb not null default '{}'::jsonb,
  exames jsonb not null default '[]'::jsonb,
  galeria jsonb not null default '[]'::jsonb,
  consultas jsonb not null default '[]'::jsonb,
  criado_em timestamptz not null default now()
);

create unique index if not exists pacientes_clinica_cpf_idx on pacientes (clinica_id, cpf);
create index if not exists pacientes_clinica_idx on pacientes (clinica_id);
create index if not exists usuarios_clinica_idx on usuarios (clinica_id);

-- Campos extras da clínica (cadastro completo + configurações)
alter table clinicas add column if not exists logo_url text;
alter table clinicas add column if not exists telefone text;
alter table clinicas add column if not exists email text;
alter table clinicas add column if not exists cnpj text;
alter table clinicas add column if not exists endereco text;
alter table clinicas add column if not exists cidade text;
alter table clinicas add column if not exists responsavel_nome text;
alter table clinicas add column if not exists responsavel_crm text;
alter table clinicas add column if not exists observacoes text;
alter table clinicas add column if not exists ativo boolean not null default true;
