import { db } from './index';
import { pacientes, agendaEventos, filaEspera } from './schema';
import { MOCK_PACIENTES, MOCK_AGENDA_HOJE } from '../mockData';

async function seed() {
  console.log("Seeding database...");
  
  for (const p of MOCK_PACIENTES) {
    await db.insert(pacientes).values({
      id: p.id,
      nome: p.nome,
      idade: p.idade,
      dataNascimento: p.dataNascimento,
      cpf: p.cpf,
      telefone: p.telefone,
      email: p.email,
      cidade: p.cidade,
      comoConheceu: p.comoConheceu,
      queixaPrincipal: p.queixaPrincipal,
      status: p.status,
      progresso: p.progresso,
      ultimaAtualizacao: p.ultimaAtualizacao,
      antecedentes: p.antecedentes,
      diagnostico: p.diagnostico,
      protocolo: p.protocolo,
    }).onConflictDoNothing();
  }

  for (const evt of MOCK_AGENDA_HOJE) {
    await db.insert(agendaEventos).values({
      id: evt.id,
      pacienteId: evt.pacienteId,
      data: evt.data,
      horario: evt.horario,
      tipo: evt.tipo,
      procedimentoTag: evt.diagnosticoResumo.includes("Primeira Consulta") ? "Primeira Consulta" : "Retorno",
      duracaoMinutos: evt.diagnosticoResumo.includes("Primeira Consulta") ? 60 : 30,
      status: evt.status,
      diagnosticoResumo: evt.diagnosticoResumo,
    }).onConflictDoNothing();
  }

  // Fila de espera
  await db.insert(filaEspera).values([
    {
      id: "fila-1",
      pacienteId: "paciente-1", // mock ID
      procedimentoTag: "Laser LLLT",
      duracaoMinutos: 30,
      dataDesejadaInicio: "2026-06-08",
      dataDesejadaFim: "2026-06-15",
      status: "Aguardando"
    }
  ]).onConflictDoNothing();

  console.log("Seed complete.");
}

seed().catch(console.error);
