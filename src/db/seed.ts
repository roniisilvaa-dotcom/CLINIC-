import { db } from './index';
import { pacientes, agendaEventos, filaEspera } from './schema';
import { MOCK_PACIENTES, MOCK_AGENDA_HOJE } from '../mockData';

async function seed() {
  console.log("🌱 Iniciando seed do banco de dados...");
  
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
      antecedentes: p.antecedentes as any,
      diagnostico: p.diagnostico as any,
      protocolo: p.protocolo as any,
    }).onConflictDoNothing();
  }
  console.log(`✓ ${MOCK_PACIENTES.length} pacientes inseridos`);

  for (const evt of MOCK_AGENDA_HOJE) {
    await db.insert(agendaEventos).values({
      id: evt.id,
      pacienteId: evt.pacienteId,
      data: evt.data,
      horario: evt.horario,
      tipo: evt.tipo,
      procedimentoTag: evt.diagnosticoResumo?.includes("Primeira Consulta") ? "Primeira Consulta" : "Retorno",
      duracaoMinutos: evt.diagnosticoResumo?.includes("Primeira Consulta") ? 60 : 30,
      status: evt.status,
      diagnosticoResumo: evt.diagnosticoResumo,
    }).onConflictDoNothing();
  }
  console.log(`✓ ${MOCK_AGENDA_HOJE.length} eventos de agenda inseridos`);

  await db.insert(filaEspera).values([
    {
      id: "fila-1",
      pacienteId: MOCK_PACIENTES[0]?.id ?? "paciente-1",
      procedimentoTag: "Laser LLLT",
      duracaoMinutos: 30,
      dataDesejadaInicio: "2026-06-08",
      dataDesejadaFim: "2026-06-15",
      status: "Aguardando"
    }
  ]).onConflictDoNothing();

  console.log("✅ Seed completo!");
}

seed().catch((e) => {
  console.error("Erro no seed:", e);
  process.exit(1);
});
