export type CidadeUnidade = "Toledo" | "Fátima do Sul";

export interface AntecedentesClinicos {
  usoMedicamentos: string;
  historicoFamiliar: string;
  gestacaoAmamentacao: string;
  menopausa: string;
  outros: string;
}

export interface DiagnosticoClinico {
  principal: string;
  secundario: string[];
  escalaLudwig?: string; // Feminino
  escalaHamiltonNorwood?: string; // Masculino
  condicoesAssociadas: string[]; // couro cabeludo oleoso, descamação, inflamação, etc.
  fatoresContribuintes: string[]; // hormonal, metabólico, nutricional, estresse, etc.
  observacoes: string;
}

export interface ExameLaboratorial {
  id: string;
  data: string;
  tsh: string; // mIU/L
  t4Livre: string; // ng/dL
  ferritina: string; // ng/mL
  hemoglobina: string; // g/dL
  testosteronaTotal: string; // ng/dL
  testosteronaLivre: string; // pg/mL
  dheas: string; // ug/dL
  zinco: string; // ug/dL
  vitD: string; // ng/mL
  vitB12: string; // pg/mL
  analiseIA?: string;
  statusMap: Record<string, "normal" | "limitrofe" | "alterado">;
}

export interface FotoCapilar {
  id: string;
  data: string;
  horario?: string;
  posicao: "Frontal" | "Topo/Vértex" | "Lateral Direita" | "Lateral Esquerda" | "Nuca" | "Dermoscopia";
  url: string;
  notaIa?: string;
}

export interface ProtocoloTratamento {
  medicamentos: string;
  procedimentos: string;
  cosmeticos: string;
  suplementacao: string;
  estiloVida: string;
  duracaoPrevista: string;
  dataInicio: string;
}

export interface ConsultaHistorial {
  id: string;
  data: string;
  tipo: "Presencial - Toledo" | "Presencial - Fátima do Sul" | "Online";
  queixa: string;
  evolucao: string;
  alteracoesProtocolo: string;
  examesSolicitados: string;
  resumoIa?: string;
}

export type StatusPaciente = "Em Tratamento" | "Em Pausa" | "Alta" | "Sem Retorno";

export interface Paciente {
  id: string;
  nome: string;
  idade: number;
  dataNascimento: string;
  cpf: string;
  telefone: string;
  email: string;
  cidade: CidadeUnidade;
  comoConheceu: string;
  queixaPrincipal: string;
  status: StatusPaciente;
  progresso: number; // 0 to 100
  ultimaAtualizacao: string;
  antecedentes: AntecedentesClinicos;
  diagnostico: DiagnosticoClinico;
  exames: ExameLaboratorial[];
  protocolo: ProtocoloTratamento;
  galeria: FotoCapilar[];
  consultas: ConsultaHistorial[];
    tags: string[]; // etiquetas: tricologia, dermato estetica, etc (pedido do Igor)
}

export interface PrescricaoTemplate {
  id: string;
  titulo: string;
  diagnosticoRef: string;
  categoria: "Medicamentoso" | "Procedimentos" | "Suplementação" | "Cuidados Domiciliares";
  medicamentos: string;
  procedimentos: string;
  suplementacao: string;
  cosmeticos: string;
}

export interface AlertaClinico {
  id: string;
  pacienteId: string;
  pacienteNome: string;
  tipo: "foto_atrasada" | "exame_pendente" | "retorno_vencido" | "positivo";
  mensagem: string;
  severidade: "info" | "warning" | "error" | "success";
}

export interface EventoAgenda {
  id: string;
  pacienteId: string;
  pacienteNome: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:MM
  tipo: "Presencial - Toledo" | "Presencial - Fátima do Sul" | "Online";
  status: "Confirmada" | "Pendente" | "Cancelada" | "Realizada";
  diagnosticoResumo: string;
}
