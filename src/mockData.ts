import { Paciente, PrescricaoTemplate, AlertaClinico, EventoAgenda } from "./types";

export const MOCK_PACIENTES: Paciente[] = [];

export const MOCK_PRESCRIÇÕES_TEMPLATES: PrescricaoTemplate[] = [
  {
    id: "t1",
    nome: "Indução de Crescimento (Feminino)",
    tipo: "Medicamento",
    descricao: "Minoxidil Oral 0.5mg + Espironolactona 50mg"
  },
  {
    id: "t2",
    nome: "Suplementação Essencial Capilar",
    tipo: "Suplemento",
    descricao: "Ferro Quelato 60mg, Vitamina C 100mg, Vitamina D 2000 UI"
  },
  {
    id: "t3",
    nome: "Eflúvio Agudo Pós-COVID",
    tipo: "Tópico",
    descricao: "Loção Capixyl + Auxina Tricógena + Melatonina"
  }
];

export const MOCK_ALERTAS: AlertaClinico[] = [];

export const MOCK_AGENDA_HOJE: EventoAgenda[] = [];
