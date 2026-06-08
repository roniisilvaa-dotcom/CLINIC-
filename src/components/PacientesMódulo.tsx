import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  Search, 
  Filter, 
  MapPin, 
  FileText, 
  Dna, 
  TrendingUp, 
  FileCheck, 
  Image as ImageIcon, 
  History, 
  Bot, 
  Plus, 
  Flame, 
  Trash, 
  Check, 
  Download, 
  ChevronLeft, 
  Sparkles,
  Scissors,
  CheckCircle,
  Eye,
  AlertTriangle,
  FileSignature,
  MessageSquare,
  QrCode
} from "lucide-react";
import { Paciente, ExameLaboratorial, FotoCapilar, StatusPaciente } from "../types";

interface PacientesModuloProps {
  pacientes: Paciente[];
  onChangePacientes: (novosPacientes: Paciente[]) => void;
  selectedPacienteId: string | null;
  onSelectPaciente: (id: string | null) => void;
  onOpenNovaConsulta: (pacienteId: string) => void;
  patientChats?: Record<string, any[]>;
  onSendDoctorMessage?: (pacienteId: string, content: string) => void;
  activePlan?: "Standard" | "Precision" | "Enterprise";
  aiRunsCounter?: number;
  onIncrementAiRuns?: () => void;
}

export default function PacientesModulo({ 
  pacientes, 
  onChangePacientes, 
  selectedPacienteId, 
  onSelectPaciente,
  onOpenNovaConsulta,
  patientChats = {},
  onSendDoctorMessage,
  activePlan = "Precision",
  aiRunsCounter = 2,
  onIncrementAiRuns
}: PacientesModuloProps) {

  // List State
  const [search, setSearch] = useState("");
  const [filterDiag, setFilterDiag] = useState("all");
  const [filterCidade, setFilterCidade] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Profile Active Tab State
  const [activeTab, setActiveTab] = useState<"pessoais" | "diagnostico" | "exames" | "protocolo" | "galeria" | "consultas" | "mensagens">("pessoais");

  // Edit State
  const [isEditing, setIsEditing] = useState(false);

  // Before/After comparative slider state (percentage of slide from 0 to 100)
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isSliding, setIsSliding] = useState(false);

  // IA Loading states
  const [loadingExamsIa, setLoadingExamsIa] = useState(false);
  const [analiseIaResult, setAnaliseIaResult] = useState("");

  const [loadingPhotosIa, setLoadingPhotosIa] = useState(false);
  const [analisePhotosResult, setAnalisePhotosResult] = useState("");

  // Prescrição Letterhead Preview state
  const [showLetterheadPreview, setShowLetterheadPreview] = useState(false);

  // Finds current patient
  const curPaciente = pacientes.find(p => p.id === selectedPacienteId) || null;

  // Gather unique options for filter dropdowns
  const uniqueDiags = Array.from(new Set(pacientes.map(p => p.diagnostico.principal)));

  // Filter logic
  const filteredPacientes = pacientes.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase()) || p.cpf.includes(search);
    const matchesDiag = filterDiag === "all" || p.diagnostico.principal === filterDiag;
    const matchesCidade = filterCidade === "all" || p.cidade === filterCidade;
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesDiag && matchesCidade && matchesStatus;
  });

  // Calculate status thresholds for Exames
  const getLabThreshold = (key: string, valueStr: string): "normal" | "limitrofe" | "alterado" => {
    const val = parseFloat(valueStr);
    if (isNaN(val)) return "normal";
    
    switch (key) {
      case "ferritina":
        return val < 30 ? "alterado" : val < 70 ? "limitrofe" : "normal"; // Trichology stricts
      case "vitD":
        return val < 20 ? "alterado" : val < 40 ? "limitrofe" : "normal";
      case "vitB12":
        return val < 250 ? "alterado" : val < 400 ? "limitrofe" : "normal";
      case "zinco":
        return val < 75 ? "alterado" : "normal";
      case "tsh":
        return (val < 0.4 || val > 4.5) ? "alterado" : (val > 2.5) ? "limitrofe" : "normal"; // ideal is 1-2.5
      case "hemoglobina":
        return val < 11.5 ? "alterado" : "normal";
      default:
        return "normal";
    }
  };

  // Trigger real backend interpretative endpoint for Exams
  const handleAnalyzeExamsWithIA = async () => {
    if (!curPaciente || curPaciente.exames.length === 0) return;
    
    if (activePlan === "Standard" && (aiRunsCounter ?? 0) >= 5) {
      alert("Você atingiu o limite de 5 análises gratuitas do plano Standard IA. Faça o upgrade para o plano Precision Premium IA para análises ilimitadas de exames e fotos!");
      return;
    }

    setLoadingExamsIa(true);
    setAnaliseIaResult("");
    
    try {
      const response = await fetch("/api/analyze-exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pacienteNome: curPaciente.nome,
          idade: curPaciente.idade,
          queixa: curPaciente.queixaPrincipal,
          exames: curPaciente.exames[0] // Analyze latest exame
        })
      });
      const data = await response.json();
      if (response.ok) {
        setAnaliseIaResult(data.result);
        
        // Save back into local state of this patient
        const updatedExames = [...curPaciente.exames];
        updatedExames[0].analiseIA = data.result;
        
        const updatedPatients = pacientes.map(p => 
          p.id === curPaciente.id ? { ...p, exames: updatedExames } : p
        );
        onChangePacientes(updatedPatients);
        onIncrementAiRuns?.();
      } else {
        setAnaliseIaResult(`Erro ao processar laudo: ${data.error}`);
      }
    } catch (err: any) {
      setAnaliseIaResult(`Erro de conectividade com o servidor CA.RO Clinic: ${err.message}`);
    } finally {
      setLoadingExamsIa(false);
    }
  };

  // Trigger Photogrammetry evolutionary analysis via backend
  const handleAnalyzePhotosWithIA = async () => {
    if (!curPaciente || curPaciente.galeria.length === 0) return;

    if (activePlan === "Standard" && (aiRunsCounter ?? 0) >= 5) {
      alert("Você atingiu o limite de 5 análises gratuitas do plano Standard IA. Faça o upgrade para o plano Precision Premium IA para análises ilimitadas de exames e fotos!");
      return;
    }

    setLoadingPhotosIa(true);
    setAnalisePhotosResult("");

    try {
      const response = await fetch("/api/analyze-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pacienteNome: curPaciente.nome,
          fotosInfo: curPaciente.galeria.map(f => ({ data: f.data, posicao: f.posicao, nota: f.notaIa }))
        })
      });
      const data = await response.json();
      if (response.ok) {
        setAnalisePhotosResult(data.result);
        onIncrementAiRuns?.();
      } else {
        setAnalisePhotosResult(`Erro ao analisar fotos: ${data.error}`);
      }
    } catch (err: any) {
      setAnalisePhotosResult(`Erro de inteligência capilar: ${err.message}`);
    } finally {
      setLoadingPhotosIa(false);
    }
  };

  // Patient Fields Saving Handler
  const handleSavePatientFields = (updatedPaciente: Paciente) => {
    const updatedList = pacientes.map(p => p.id === updatedPaciente.id ? updatedPaciente : p);
    onChangePacientes(updatedList);
    setIsEditing(false);
  };

  // Status Color indicators helper
  const renderStatusDot = (status: ExameLaboratorial["statusMap"][string]) => {
    if (status === "alterado") return <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" title="Alterado" />;
    if (status === "limitrofe") return <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" title="Limítrofe" />;
    return <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Normal" />;
  };

  // Scales Selector helper
  const SCALE_LUDWIG_GRID = ["Grau I", "Grau II", "Grau III"];
  const SCALE_HAMILTON_GRID = ["I", "II", "III", "IV", "V", "VI", "VII"];

  return (
    <div id="pacientes_module_container">
      <AnimatePresence mode="wait">
        {!selectedPacienteId ? (
          
          /* VIEW A: LIST OF PACIENTS */
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Header section with Create Paciente button */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#0A0A0A]/5 pb-6">
              <div>
                <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0A0A0A] font-normal">Banco de Pacientes</h2>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1.5">Gerencie prontuários, evoluções fotográficas e exames laboratoriais.</p>
              </div>

              <button
                onClick={() => {
                  const idNew = `paciente-${Date.now()}`;
                  const novo: Paciente = {
                    id: idNew,
                    nome: "Novo Paciente Integrado",
                    idade: 30,
                    dataNascimento: "1996-01-01",
                    cpf: "000.000.000-00",
                    telefone: "(45) 99999-9999",
                    email: "email@provedor.com",
                    cidade: "Toledo",
                    comoConheceu: "Instagram",
                    queixaPrincipal: "Fios fracos na hora de escovar.",
                    status: "Em Tratamento",
                    progresso: 10,
                    ultimaAtualizacao: new Date().toISOString().split("T")[0],
                    antecedentes: { usoMedicamentos: "Nenhum", historicoFamiliar: "Pai calvo", gestacaoAmamentacao: "Nega", menopausa: "Nega", outros: "" },
                    diagnostico: { principal: "Eflúvio Telógeno Agudo", secundario: [], escalaLudwig: "Grau I", condicoesAssociadas: [], fatoresContribuintes: [], observacoes: "" },
                    exames: [],
                    protocolo: { medicamentos: "", procedimentos: "", cosmeticos: "", suplementacao: "", estiloVida: "", duracaoPrevista: "6 meses", dataInicio: new Date().toISOString().split("T")[0] },
                    galeria: [],
                    consultas: []
                  };
                  onChangePacientes([novo, ...pacientes]);
                  onSelectPaciente(idNew);
                }}
                className="bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black text-xs font-bold font-mono tracking-wider uppercase px-5 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 cursor-pointer self-start sm:self-auto shadow-sm"
              >
                <Plus className="w-4 h-4" /> Cadastrar Paciente
              </button>
            </div>

            {/* Filter controls panel */}
            <div className="bg-white border border-[#E5E5E5] shadow-sm p-4 rounded-xl flex flex-col md:flex-row gap-3.5 items-stretch md:items-center">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar paciente por nome ou CPF..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-gray-50 text-sm text-[#0A0A0A] border border-gray-200 focus:border-[#C9A84C] focus:bg-white py-2.5 pl-9 pr-4 rounded-lg outline-none transition"
                />
              </div>

              {/* Advanced Filter selects */}
              <div className="grid grid-cols-2 lg:flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 rounded-lg">
                  <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <select 
                    value={filterDiag} 
                    onChange={(e) => setFilterDiag(e.target.value)}
                    className="bg-transparent text-xs text-gray-700 py-2 outline-none border-none cursor-pointer"
                  >
                    <option value="all">Todos Diagnósticos</option>
                    {uniqueDiags.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 rounded-lg">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <select 
                    value={filterCidade} 
                    onChange={(e) => setFilterCidade(e.target.value)}
                    className="bg-transparent text-xs text-gray-700 py-2 outline-none border-none cursor-pointer"
                  >
                    <option value="all">Todas Unidades</option>
                    <option value="Toledo">Toledo</option>
                    <option value="Fátima do Sul">Fátima do Sul</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 rounded-lg col-span-2 lg:col-span-1">
                  <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-transparent text-xs text-gray-700 py-2 outline-none border-none cursor-pointer"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="Em Tratamento">Em Tratamento</option>
                    <option value="Em Pausa">Em Pausa</option>
                    <option value="Alta">Alta</option>
                    <option value="Sem Retorno">Sem Retorno</option>
                  </select>
                </div>
              </div>
            </div>

            {/* List results layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPacientes.map((paciente) => (
                <div 
                  key={paciente.id}
                  className="bg-white border border-[#E5E5E5] shadow-sm sm:hover:border-[#C9A84C]/55 transition group rounded-xl p-5 flex flex-col justify-between gap-4 hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-[#F5F0E8] border border-[#C9A84C]/25 flex items-center justify-center font-serif text-[#C9A84C] font-semibold text-base shrink-0">
                          {paciente.nome.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#0A0A0A] group-hover:text-[#C9A84C] transition duration-200 text-[15px] max-w-[160px] truncate">
                            {paciente.nome}
                          </h3>
                          <span className="text-[11px] text-gray-400 block font-mono">
                            {paciente.idade} anos • {paciente.cidade}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-mono uppercase font-bold border ${
                        paciente.status === "Em Tratamento" 
                          ? "bg-green-50 text-green-700 border-green-200/50" 
                          : paciente.status === "Alta" 
                          ? "bg-blue-50 text-blue-700 border-blue-200/50" 
                          : "bg-yellow-50 text-yellow-700 border-yellow-200/50"
                      }`}>
                        {paciente.status}
                      </span>
                    </div>

                    <div className="border-t border-gray-100 pt-3.5 space-y-1.5">
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest block font-mono">Diagnóstico Principal</span>
                        <span className="text-xs text-gray-700 font-medium line-clamp-1">{paciente.diagnostico.principal}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest block font-mono">Queixa</span>
                        <span className="text-xs text-gray-500 line-clamp-1">{paciente.queixaPrincipal}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-400 uppercase block font-mono">Evolução</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-14 bg-gray-100 h-1 rounded-full overflow-hidden">
                          <div className="bg-[#C9A84C] h-1" style={{ width: `${paciente.progresso}%` }} />
                        </div>
                        <span className="text-[10px] font-mono font-semibold text-gray-500">{paciente.progresso}%</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectPaciente(paciente.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 hover:border-[#C9A84C] hover:text-[#C9A84C] text-[#0A0A0A] bg-white transition flex items-center gap-1 cursor-pointer font-sans"
                    >
                      <Eye className="w-3.5 h-3.5" /> Prontuário
                    </button>
                  </div>
                </div>
              ))}

              {filteredPacientes.length === 0 && (
                <div className="col-span-full py-20 text-center space-y-2 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                  <Users className="w-10 h-10 text-gray-350 mx-auto" />
                  <p className="text-gray-500 font-serif text-lg">Nenhum paciente localizado</p>
                  <p className="text-gray-450 text-xs max-w-sm mx-auto">Tente refinar os filtros de busca ou cadastre um novo ficha capilar.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          
          /* VIEW B: DETAILED PROFILE FOR SELECTED PATIENT */
          <motion.div 
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Profile Navigation Header */}
            <div className="border-b border-[#0A0A0A]/5 pb-5">
              <button 
                onClick={() => onSelectPaciente(null)}
                className="flex items-center gap-1 text-xs uppercase tracking-widest font-bold text-gray-400 hover:text-[#C9A84C] transition font-mono mb-4 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Voltar ao Banco
              </button>

              <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C] flex items-center justify-center font-serif text-[#C9A84C] font-bold text-xl shadow-sm shrink-0">
                    {curPaciente?.nome.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl sm:text-3xl text-[#0A0A0A] font-normal leading-tight">{curPaciente?.nome}</h2>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded font-mono uppercase border ${
                        curPaciente?.status === "Em Tratamento" 
                          ? "bg-green-50 text-green-700 border-green-200/50" 
                          : "bg-yellow-50 text-yellow-700 border-yellow-200/50"
                      }`}>
                        {curPaciente?.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      Prontuário: <span className="text-[#C9A84C] font-semibold">{curPaciente?.id}</span> • CPF: {curPaciente?.cpf} • Cidade Atendimento: {curPaciente?.cidade}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (curPaciente) onOpenNovaConsulta(curPaciente.id);
                    }}
                    className="bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black text-xs font-bold font-mono uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors duration-200 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Nova Consulta
                  </button>

                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="border border-gray-250 hover:border-[#C9A84C] hover:text-[#C9A84C] bg-white text-gray-700 text-xs font-mono uppercase tracking-wider px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors duration-200 cursor-pointer"
                  >
                    <FileSignature className="w-4 h-4" />
                    {isEditing ? "Cancelar" : "Editar"}
                  </button>
                </div>
              </div>

              {/* Navigation Tabs of the profile */}
              <div className="flex items-center gap-1.5 overflow-x-auto mt-6 border-t border-[#0A0A0A]/5 pt-4 select-none">
                {[
                  { id: "pessoais", label: "Dados Pessoais", icon: FileText },
                  { id: "diagnostico", label: "Diagnóstico Clínico", icon: Dna },
                  { id: "exames", label: "Exames Laboratoriais", icon: FileCheck },
                  { id: "protocolo", label: "Protocolo Tratamento", icon: Scissors },
                  { id: "galeria", label: "Galeria Capilar", icon: ImageIcon },
                  { id: "consultas", label: "Consultas / Histórico", icon: History },
                  { id: "mensagens", label: "Canal Direto / QR Code", icon: MessageSquare },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setIsEditing(false);
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition whitespace-nowrap cursor-pointer ${
                        isActive 
                          ? "bg-[#C9A84C]/10 border border-[#C9A84C]/45 text-[#C9A84C]" 
                          : "hover:bg-gray-100 border border-transparent text-gray-400 hover:text-[#0A0A0A]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Profile Tab content body */}
            <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-6 relative">
              {curPaciente && (
                <div className="space-y-6">
                  
                  {/* ====== TAB 1: DADOS PESSOAIS ====== */}
                  {activeTab === "pessoais" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b border-[#1F1F1F] pb-3">
                        <h3 className="text-lg font-serif text-[#FAFAFA] font-medium">Dados de Identificação e Cadastro</h3>
                        <span className="text-[11px] text-[#C9A84C] font-mono">Unidade {curPaciente.cidade}</span>
                      </div>

                      {isEditing ? (
                        /* Editing Layout */
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const f = e.currentTarget;
                          const updated: Paciente = {
                            ...curPaciente,
                            nome: (f.elements.namedItem("nome") as HTMLInputElement).value,
                            idade: parseInt((f.elements.namedItem("idade") as HTMLInputElement).value),
                            dataNascimento: (f.elements.namedItem("dataNascimento") as HTMLInputElement).value,
                            cpf: (f.elements.namedItem("cpf") as HTMLInputElement).value,
                            telefone: (f.elements.namedItem("telefone") as HTMLInputElement).value,
                            email: (f.elements.namedItem("email") as HTMLInputElement).value,
                            comoConheceu: (f.elements.namedItem("comoConheceu") as HTMLInputElement).value,
                            queixaPrincipal: (f.elements.namedItem("queixaPrincipal") as HTMLTextAreaElement).value,
                          };
                          handleSavePatientFields(updated);
                        }} className="space-y-5">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-1.5">
                              <label className="text-xs uppercase text-neutral-500 font-mono">Nome Completo</label>
                              <input type="text" name="nome" defaultValue={curPaciente.nome} className="w-full bg-[#1A1A1A] border border-[#2B2B2B] focus:border-[#C9A84C] text-sm text-neutral-200 p-2.5 rounded outline-none" required />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs uppercase text-neutral-500 font-mono">Idade</label>
                              <input type="number" name="idade" defaultValue={curPaciente.idade} className="w-full bg-[#1A1A1A] border border-[#2B2B2B] focus:border-[#C9A84C] text-sm text-neutral-200 p-2.5 rounded outline-none" required />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs uppercase text-neutral-500 font-mono">Data Nascimento</label>
                              <input type="date" name="dataNascimento" defaultValue={curPaciente.dataNascimento} className="w-full bg-[#1A1A1A] border border-[#2B2B2B] focus:border-[#C9A84C] text-sm text-neutral-200 p-2.5 rounded outline-none" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs uppercase text-neutral-500 font-mono">CPF</label>
                              <input type="text" name="cpf" defaultValue={curPaciente.cpf} className="w-full bg-[#1A1A1A] border border-[#2B2B2B] focus:border-[#C9A84C] text-sm text-neutral-200 p-2.5 rounded outline-none" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs uppercase text-neutral-500 font-mono">Telefone</label>
                              <input type="text" name="telefone" defaultValue={curPaciente.telefone} className="w-full bg-[#1A1A1A] border border-[#2B2B2B] focus:border-[#C9A84C] text-sm text-neutral-200 p-2.5 rounded outline-none" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs uppercase text-neutral-500 font-mono">Email</label>
                              <input type="email" name="email" defaultValue={curPaciente.email} className="w-full bg-[#1A1A1A] border border-[#2B2B2B] focus:border-[#C9A84C] text-sm text-neutral-200 p-2.5 rounded outline-none" />
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                              <label className="text-xs uppercase text-neutral-500 font-mono">Como conheceu a clínica?</label>
                              <input type="text" name="comoConheceu" defaultValue={curPaciente.comoConheceu} className="w-full bg-[#1A1A1A] border border-[#2B2B2B] focus:border-[#C9A84C] text-sm text-neutral-200 p-2.5 rounded outline-none" />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs uppercase text-neutral-500 font-mono block">Queixa Principal (em texto livre)</label>
                            <textarea name="queixaPrincipal" rows={3} defaultValue={curPaciente.queixaPrincipal} className="w-full bg-[#1A1A1A] border border-[#2B2B2B] focus:border-[#C9A84C] text-sm text-neutral-200 p-3 rounded outline-none" />
                          </div>

                          <button type="submit" className="bg-[#C9A84C] hover:bg-[#D9B85C] text-black text-xs font-semibold px-5 py-2.5 rounded font-mono uppercase tracking-widest cursor-pointer">
                            Salvar Alterações
                          </button>
                        </form>
                      ) : (
                        /* Standard profile visualization */
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                              <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider block">Nome Completo</span>
                              <span className="text-sm font-semibold text-neutral-200">{curPaciente.nome}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider block">Data de Nascimento (Idade)</span>
                              <span className="text-sm font-semibold text-neutral-200">{curPaciente.dataNascimento} ({curPaciente.idade} anos)</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider block">CPF</span>
                              <span className="text-sm font-semibold text-neutral-200">{curPaciente.cpf}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider block">Unidade Principal</span>
                              <span className="text-sm font-semibold text-neutral-200">{curPaciente.cidade}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider block">Telefone</span>
                              <span className="text-sm font-semibold text-[#FAFAFA] font-mono">{curPaciente.telefone}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider block">E-mail</span>
                              <span className="text-sm font-semibold text-neutral-200">{curPaciente.email}</span>
                            </div>
                            <div className="sm:col-span-2">
                              <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider block">Canal de Origem</span>
                              <span className="text-sm font-semibold text-[#C9A84C]">{curPaciente.comoConheceu}</span>
                            </div>
                          </div>

                          <div className="border-t border-[#1F1F1F] pt-4 space-y-2">
                            <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider block">Queixa Principal Relatada</span>
                            <blockquote className="bg-[#181818]/80 text-sm text-neutral-300 p-4 border-l-2 border-l-[#C9A84C] rounded-r-lg italic leading-relaxed">
                              "{curPaciente.queixaPrincipal}"
                            </blockquote>
                          </div>

                          {/* Pre-existing clip of detailed medical antecedents */}
                          <div className="border-t border-[#1F1F1F] pt-5 space-y-4">
                            <h4 className="text-xs uppercase tracking-widest text-[#C9A84C] font-mono font-bold">Investigação de Antecedentes Sistemáticos</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-[#161616] p-4 rounded-lg">
                                <span className="text-[10px] text-neutral-500 font-mono block">Uso contínuo de fármacos / hormonais</span>
                                <span className="text-xs font-semibold text-neutral-200 mt-1 block">{curPaciente.antecedentes.usoMedicamentos || "Nenhum histórico reportado"}</span>
                              </div>
                              <div className="bg-[#161616] p-4 rounded-lg">
                                <span className="text-[10px] text-neutral-500 font-mono block">Histórico familiar de calvície (Maternal/Paternal)</span>
                                <span className="text-xs font-semibold text-neutral-200 mt-1 block">{curPaciente.antecedentes.historicoFamiliar || "Sem histórico familiar revelado"}</span>
                              </div>
                              <div className="bg-[#161616] p-4 rounded-lg">
                                <span className="text-[10px] text-neutral-500 font-mono block">Histórico de Gestação / Amamentação</span>
                                <span className="text-xs font-semibold text-neutral-200 mt-1 block">{curPaciente.antecedentes.gestacaoAmamentacao || "Nega"}</span>
                              </div>
                              <div className="bg-[#161616] p-4 rounded-lg">
                                <span className="text-[10px] text-neutral-500 font-mono block">Menopausa ou climatério ativo</span>
                                <span className="text-xs font-semibold text-neutral-200 mt-1 block">{curPaciente.antecedentes.menopausa || "Nega"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ====== TAB 2: DIAGNÓSTICO CLÍNICO ====== */}
                  {activeTab === "diagnostico" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b border-[#1F1F1F] pb-3">
                        <h3 className="text-lg font-serif text-[#FAFAFA] font-medium">Diagnóstico Tricológico de Precisão</h3>
                        <span className="text-[11px] text-[#C9A84C] font-mono">Dra. Mariah Zibetti</span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                        
                        {/* Selector of Clinical Diagnoses */}
                        <div className="lg:col-span-2 space-y-5">
                          <div>
                            <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider block">Diagnóstico Capilar Principal</span>
                            <span className="text-lg font-serif font-semibold text-[#FAFAFA]">{curPaciente.diagnostico.principal}</span>
                          </div>

                          {curPaciente.diagnostico.secundario.length > 0 && (
                            <div>
                              <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider block">Comorbidades / Diagnósticos Secundários</span>
                              <div className="flex gap-2 flex-wrap mt-1">
                                {curPaciente.diagnostico.secundario.map(sec => (
                                  <span key={sec} className="bg-neutral-800 text-xs text-neutral-300 px-2.5 py-1 rounded">
                                    {sec}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#1F1F1F] pt-4">
                            <div>
                              <span className="text-[10px] text-neutral-500 font-mono uppercase block">Condições de Couro Cabeludo</span>
                              <div className="space-y-1 mt-1.5">
                                {curPaciente.diagnostico.condicoesAssociadas.map(cond => (
                                  <div key={cond} className="flex items-center gap-2 text-xs text-neutral-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
                                    <span>{cond}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] text-neutral-500 font-mono uppercase block">Fatores Contribuintes Ativos</span>
                              <div className="space-y-1 mt-1.5">
                                {curPaciente.diagnostico.fatoresContribuintes.map(fat => (
                                  <div key={fat} className="flex items-center gap-2 text-xs text-neutral-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                    <span>{fat}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-[#1F1F1F] pt-4">
                            <span className="text-[10px] text-neutral-500 font-mono uppercase block">Notas e Observações Clínicas</span>
                            <p className="text-xs text-neutral-300 leading-relaxed mt-1.5 bg-[#161616] p-4 rounded-lg border border-[#232323]">
                              {curPaciente.diagnostico.observacoes || "Nenhuma nota inserida."}
                            </p>
                          </div>
                        </div>

                        {/* Interactive Scale Estimators (Hamilton / Ludwig visual) */}
                        <div className="bg-[#181818] border border-[#262626] rounded-lg p-5 space-y-4">
                          <h4 className="text-xs uppercase tracking-widest text-[#C9A84C] font-mono font-bold">Classificação em Escalas Médicas</h4>

                          {/* Ludwig Grid for Females */}
                          {curPaciente.diagnostico.escalaLudwig && (
                            <div className="space-y-2">
                              <span className="text-xs font-semibold text-neutral-300 block">Feminina: Escala de Ludwig</span>
                              <div className="grid grid-cols-3 gap-2">
                                {SCALE_LUDWIG_GRID.map(level => {
                                  const matches = curPaciente.diagnostico.escalaLudwig === level;
                                  return (
                                    <div 
                                      key={level} 
                                      onClick={() => {
                                        const updated = {
                                          ...curPaciente,
                                          diagnostico: { ...curPaciente.diagnostico, escalaLudwig: level }
                                        };
                                        handleSavePatientFields(updated);
                                      }}
                                      className={`p-3 rounded border text-center transition cursor-pointer select-none ${
                                        matches 
                                          ? "bg-[#C9A84C]/10 border-[#C9A84C] text-[#C9A84C]" 
                                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                                      }`}
                                    >
                                      <div className="text-[11px] font-bold font-serif">{level}</div>
                                      <div className="text-[8px] text-neutral-500 uppercase mt-1">
                                        {level === "Grau I" ? "Leve" : level === "Grau II" ? "Moderada" : "Severa"}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <p className="text-[10px] text-neutral-500 italic mt-1.5 leading-relaxed">Padrão de rarefação difusa preservando a linha de implantação capilar frontal.</p>
                            </div>
                          )}

                          {/* Hamilton-Norwood for Males */}
                          {curPaciente.diagnostico.escalaHamiltonNorwood && (
                            <div className="space-y-2">
                              <span className="text-xs font-semibold text-neutral-300 block">Masculina: Escala de Hamilton-Norwood</span>
                              <div className="grid grid-cols-4 gap-1.5">
                                {SCALE_HAMILTON_GRID.map(level => {
                                  const matches = curPaciente.diagnostico.escalaHamiltonNorwood === level;
                                  return (
                                    <div
                                      key={level}
                                      onClick={() => {
                                        const updated = {
                                          ...curPaciente,
                                          diagnostico: { ...curPaciente.diagnostico, escalaHamiltonNorwood: level }
                                        };
                                        handleSavePatientFields(updated);
                                      }}
                                      className={`py-2 px-1 rounded border text-center transition cursor-pointer select-none ${
                                        matches 
                                          ? "bg-[#C9A84C]/10 border-[#C9A84C] text-[#C9A84C] font-bold" 
                                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                                      }`}
                                    >
                                      <div className="text-[11px] font-mono">G {level}</div>
                                    </div>
                                  );
                                })}
                              </div>
                              <p className="text-[10px] text-neutral-500 italic mt-1.5 leading-relaxed">Padrão de miniaturização focado em recessão bitemporal e rarefação de vértex coronário.</p>
                            </div>
                          )}

                        </div>

                      </div>
                    </div>
                  )}

                  {/* ====== TAB 3: EXAMES LABORATORIAIS ====== */}
                  {activeTab === "exames" && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#1F1F1F] pb-3">
                        <div>
                          <h3 className="text-lg font-serif text-[#FAFAFA] font-medium">Histórico de Linha de Exames Laboratoriais</h3>
                          <p className="text-neutral-400 text-[11px]">Sinaleiras integradas aos parâmetros exigentes da saúde capilar.</p>
                        </div>
                        
                        <button
                          onClick={handleAnalyzeExamsWithIA}
                          disabled={loadingExamsIa || curPaciente.exames.length === 0}
                          className="bg-[#C9A84C] hover:bg-[#D9B85C] disabled:opacity-55 text-black text-xs font-mono font-bold uppercase tracking-wider px-3 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
                        >
                          <Bot className="w-4 h-4 animate-bounce" />
                          {loadingExamsIa ? "Avaliando bio-dados..." : "Analisar Bioquímica com IA"}
                        </button>
                      </div>

                      {curPaciente.exames.length === 0 ? (
                        <div className="text-center py-10 space-y-2">
                          <p className="text-neutral-400 text-sm">Nenhum exame cadastrado no prontuário ainda.</p>
                          <button 
                            onClick={() => {
                              const examNovo: ExameLaboratorial = {
                                id: `ex-${Date.now()}`,
                                data: new Date().toISOString().split("T")[0],
                                tsh: "2.5",
                                t4Livre: "1.2",
                                ferritina: "35.0",
                                hemoglobina: "13.0",
                                testosteronaTotal: "20.0",
                                testosteronaLivre: "1.2",
                                dheas: "100.0",
                                zinco: "80.0",
                                vitD: "30.0",
                                vitB12: "350.0",
                                statusMap: {
                                  tsh: "normal",
                                  t4Livre: "normal",
                                  ferritina: "limitrofe",
                                  hemoglobina: "normal",
                                  testosteronaTotal: "normal",
                                  testosteronaLivre: "normal",
                                  dheas: "normal",
                                  zinco: "normal",
                                  vitD: "limitrofe",
                                  vitB12: "limitrofe"
                                }
                              };
                              const updated = { ...curPaciente, exames: [examNovo] };
                              handleSavePatientFields(updated);
                            }}
                            className="text-xs text-[#C9A84C] border border-[#C9A84C]/30 px-3 py-1.5 rounded hover:bg-[#C9A84C]/10 transition cursor-pointer"
                          >
                            Lançar Exames Base
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          
                          {/* Left Panel: Biochemical inputs/views */}
                          <div className="lg:col-span-2 space-y-4">
                            <div className="bg-[#181818]/80 border border-[#242424] rounded-lg p-5 space-y-4">
                              <div className="flex justify-between border-b border-[#2B2B2B] pb-2 text-xs font-mono text-neutral-400">
                                <span>Marcadores Analisados</span>
                                <span>Coleta: {curPaciente.exames[0].data}</span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {[
                                  { k: "ferritina", label: "Ferritina", unit: "ng/mL", desc: "Alvo Capilar >70" },
                                  { k: "vitD", label: "Vitamina D", unit: "ng/mL", desc: "Alvo Capilar >45" },
                                  { k: "vitB12", label: "Vitamina B12", unit: "pg/mL", desc: "Alvo Capilar >400" },
                                  { k: "zinco", label: "Zinco Sérico", unit: "ug/dL", desc: "Alvo Capilar >80" },
                                  { k: "tsh", label: "TSH", unit: "mIU/L", desc: "Alvo Capilar 1-2.5" },
                                  { k: "hemoglobina", label: "Hemoglobina", unit: "g/dL", desc: "Saturação de Oxigênio" },
                                ].map(marc => {
                                  const val = (curPaciente.exames[0] as any)[marc.k] || "";
                                  const status = getLabThreshold(marc.k, val);
                                  
                                  return (
                                    <div key={marc.k} className="bg-neutral-900 border border-neutral-800 p-3 rounded flex items-center justify-between">
                                      <div>
                                        <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider block">{marc.label}</span>
                                        <div className="flex items-baseline gap-1 mt-0.5">
                                          {isEditing ? (
                                            <input 
                                              type="text" 
                                              defaultValue={val} 
                                              onChange={(e) => {
                                                const rawVal = e.target.value;
                                                const copyExams = [...curPaciente.exames];
                                                (copyExams[0] as any)[marc.k] = rawVal;
                                                copyExams[0].statusMap[marc.k] = getLabThreshold(marc.k, rawVal);
                                                
                                                const updated = { ...curPaciente, exames: copyExams };
                                                onChangePacientes(pacientes.map(p => p.id === curPaciente.id ? updated : p));
                                              }}
                                              className="w-16 bg-[#1A1A1A] border border-[#2B2B2B] text-xs py-0.5 px-1 rounded outline-none" 
                                            />
                                          ) : (
                                            <span className="text-sm font-semibold text-neutral-200">{val || "—"}</span>
                                          )}
                                          <span className="text-[9px] text-neutral-500 font-mono">{marc.unit}</span>
                                        </div>
                                        <span className="text-[8px] text-[#C9A84C] mt-0.5 block font-mono">{marc.desc}</span>
                                      </div>

                                      <div className="shrink-0 flex flex-col items-center gap-1">
                                        {renderStatusDot(status)}
                                        <span className="text-[8px] uppercase tracking-wider font-mono font-semibold text-neutral-400">
                                          {status}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Normal indicators notice */}
                            <div className="bg-[#1A1A1A] border border-[#2B2B2B] p-4 rounded-md text-[11px] text-neutral-400 flex items-start gap-2 leading-relaxed">
                              <AlertTriangle className="w-4 h-4 text-[#C9A84C] shrink-0" />
                              <p>
                                <strong>Critérios Estritos de Redensificação:</strong> Na tricologia clássica da Dra. Mariah, os níveis alvo bioquímicos diferem dos limites básicos que laboratórios de diagnóstico usam. Buscamos otimização para garantir o alongamento máximo da fase Anágena capilar.
                              </p>
                            </div>
                          </div>

                          {/* Right Panel: AI interpretations container */}
                          <div className="bg-[#181818] border border-[#262626] rounded-lg p-5 flex flex-col justify-between">
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 text-xs font-semibold text-[#C9A84C] uppercase tracking-widest font-mono">
                                <Bot className="w-4.5 h-4.5 animate-pulse" /> Resumo e Interpretador CA.RO Clinic IA
                              </div>

                              {(analiseIaResult || curPaciente.exames[0].analiseIA) ? (
                                <div className="text-xs text-neutral-300 space-y-3 leading-relaxed max-h-[350px] overflow-y-auto pr-1 bg-black/35 p-3.5 rounded border border-[#232323]">
                                  <div className="prose prose-invert prose-xs">
                                    {(analiseIaResult || curPaciente.exames[0].analiseIA || "").split("\n").map((line, i) => (
                                      <p key={i} className="mb-2">{line}</p>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-12 space-y-2 text-neutral-500 bg-black/20 rounded border border-[#212121]">
                                  <Sparkles className="w-6 h-6 text-neutral-600 mx-auto" />
                                  <p className="text-xs">Exames prontos para análise.</p>
                                  <p className="text-[10px] text-neutral-600 max-w-[200px] mx-auto">Clique no botão "Analisar Bioquímica" ao topo para obter suporte inteligente.</p>
                                </div>
                              )}
                            </div>

                            {loadingExamsIa && (
                              <div className="flex items-center justify-center gap-2 p-3 bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded mt-4">
                                <div className="w-4 h-4 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] text-[#C9A84C] uppercase font-bold tracking-wider font-mono">Analisando bioquímicas...</span>
                              </div>
                            )}
                          </div>

                        </div>
                      )}
                    </div>
                  )}

                  {/* ====== TAB 4: PROTOCOLO DE TRATAMENTO ====== */}
                  {activeTab === "protocolo" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b border-[#1F1F1F] pb-3">
                        <div>
                          <h3 className="text-lg font-serif text-[#FAFAFA] font-medium">Protocolo Ativo Recorrente</h3>
                          <p className="text-xs text-neutral-400 mt-0.5">Válido desde {curPaciente.protocolo.dataInicio} • Duração: {curPaciente.protocolo.duracaoPrevista}</p>
                        </div>

                        <button
                          onClick={() => setShowLetterheadPreview(true)}
                          className="bg-neutral-800 hover:bg-[#1A1A1A] text-[#C9A84C] border border-[#C9A84C]/35 text-xs font-mono font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Download className="w-4 h-4 text-[#C9A84C]" /> Gerar PDF da Prescrição
                        </button>
                      </div>

                      {isEditing ? (
                        /* Editable protocol inputs */
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const f = e.currentTarget;
                          const updated = {
                            ...curPaciente,
                            protocolo: {
                              ...curPaciente.protocolo,
                              medicamentos: (f.elements.namedItem("meds") as HTMLTextAreaElement).value,
                              procedimentos: (f.elements.namedItem("procs") as HTMLTextAreaElement).value,
                              cosmeticos: (f.elements.namedItem("cosms") as HTMLTextAreaElement).value,
                              suplementacao: (f.elements.namedItem("supls") as HTMLTextAreaElement).value,
                              estiloVida: (f.elements.namedItem("habs") as HTMLTextAreaElement).value,
                              duracaoPrevista: (f.elements.namedItem("dura") as HTMLInputElement).value,
                            }
                          };
                          handleSavePatientFields(updated);
                        }} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs uppercase text-neutral-500 font-mono">Fármacos Sistêmicos / Tópicos de Receituário</label>
                              <textarea name="meds" rows={3} defaultValue={curPaciente.protocolo.medicamentos} className="w-full bg-[#1A1A1A] border border-[#2B2B2B] focus:border-[#C9A84C] text-xs text-neutral-200 p-2.5 rounded outline-none font-mono" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs uppercase text-neutral-500 font-mono">Procedimentos em Consultório</label>
                              <textarea name="procs" rows={3} defaultValue={curPaciente.protocolo.procedimentos} className="w-full bg-[#1A1A1A] border border-[#2B2B2B] focus:border-[#C9A84C] text-xs text-neutral-200 p-2.5 rounded outline-none font-mono" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs uppercase text-neutral-500 font-mono">Suplementação Ortomolecular Capilar</label>
                              <textarea name="supls" rows={3} defaultValue={curPaciente.protocolo.suplementacao} className="w-full bg-[#1A1A1A] border border-[#2B2B2B] focus:border-[#C9A84C] text-xs text-neutral-200 p-2.5 rounded outline-none font-mono" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs uppercase text-neutral-500 font-mono">Cosméticos / Higienização Domiciliar</label>
                              <textarea name="cosms" rows={3} defaultValue={curPaciente.protocolo.cosmeticos} className="w-full bg-[#1A1A1A] border border-[#2B2B2B] focus:border-[#C9A84C] text-xs text-neutral-200 p-2.5 rounded outline-none font-mono" />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                              <label className="text-xs uppercase text-neutral-500 font-mono">Hábitos de Vida / Instruções Relevantes</label>
                              <textarea name="habs" rows={2} defaultValue={curPaciente.protocolo.estiloVida} className="w-full bg-[#1A1A1A] border border-[#2B2B2B] focus:border-[#C9A84C] text-xs text-neutral-200 p-2.5 rounded outline-none font-mono" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs uppercase text-neutral-500 font-mono">Duração Estimada do Protocolo</label>
                              <input type="text" name="dura" defaultValue={curPaciente.protocolo.duracaoPrevista} className="w-full bg-[#1A1A1A] border border-[#2B2B2B] focus:border-[#C9A84C] text-xs text-neutral-200 p-2 rounded outline-none" />
                            </div>
                          </div>

                          <button type="submit" className="bg-[#C9A84C] hover:bg-[#D9B85C] text-black text-xs font-semibold px-5 py-2.5 rounded font-mono uppercase tracking-widest cursor-pointer mt-4">
                            Salvar Protocolo
                          </button>
                        </form>
                      ) : (
                        /* Protocol visualizations grids */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
                          {[
                            { title: "Medicamentos de Receita", items: curPaciente.protocolo.medicamentos, color: "text-[#C9A84C]" },
                            { title: "Procedimentos e Terapias Físicas (Consultório)", items: curPaciente.protocolo.procedimentos, color: "text-blue-400" },
                            { title: "Cuidados Cosméticos e Tônicos Ativos", items: curPaciente.protocolo.cosmeticos, color: "text-purple-400" },
                            { title: "Suplementação e Vitaminas", items: curPaciente.protocolo.suplementacao, color: "text-emerald-400" },
                          ].map(sect => (
                            <div key={sect.title} className="bg-neutral-900 border border-neutral-800 p-5 rounded-lg space-y-3">
                              <h4 className={`text-xs uppercase tracking-widest font-mono font-bold ${sect.color}`}>
                                {sect.title}
                              </h4>
                              <div className="text-xs text-neutral-300 leading-relaxed font-mono whitespace-pre-wrap bg-black/40 p-3 rounded border border-[#212121]">
                                {sect.items || "Nenhuma substância listada."}
                              </div>
                            </div>
                          ))}

                          <div className="md:col-span-2 bg-[#1A1A1A] border border-[#2B2B2B] p-4 rounded-lg">
                            <span className="text-[10px] text-neutral-500 font-mono uppercase block">Orientação Comportamental & Estilo de Vida</span>
                            <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                              {curPaciente.protocolo.estiloVida || "Nenhuma orientação comportamental lançada."}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ====== TAB 5: GALERIA CAPILAR (Antes e Depois Slider) ====== */}
                  {activeTab === "galeria" && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#1F1F1F] pb-3">
                        <div>
                          <h3 className="text-lg font-serif text-[#FAFAFA] font-medium">Comparativo Capilar e Densitometria</h3>
                          <p className="text-xs text-neutral-400 mt-0.5">Controle timeline das fotografias microscópicas.</p>
                        </div>

                        <button
                          onClick={handleAnalyzePhotosWithIA}
                          disabled={loadingPhotosIa || curPaciente.galeria.length < 2}
                          className="bg-[#C9A84C] hover:bg-[#D9B85C] disabled:opacity-55 text-black text-xs font-mono font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
                        >
                          <Bot className="w-4 h-4 animate-bounce" />
                          {loadingPhotosIa ? "Analisando fios..." : "Analisar Evolução com IA"}
                        </button>
                      </div>

                      {curPaciente.galeria.length === 0 ? (
                        <div className="text-center py-10 text-neutral-500">
                          Nenhuma fotografia salva na galeria deste paciente ainda.
                        </div>
                      ) : (
                        <div className="space-y-6">
                          
                          {/* COMPARATIVE BEFORE/AFTER DRAGGABLE SLIDER DETAILED CODE */}
                          {curPaciente.galeria.length >= 2 && (
                            <div className="space-y-3">
                              <span className="text-xs font-semibold text-neutral-400 block uppercase tracking-wider h-6">
                                Comparativo Longitudinal Antes & Depois (Linha de Evolução)
                              </span>
                              
                              <div className="flex flex-col lg:flex-row gap-6">
                                {/* The Slider Sandbox */}
                                <div className="flex-1 max-w-xl mx-auto lg:mx-0">
                                  <div 
                                    className="relative h-80 rounded-xl overflow-hidden shadow-2xl border border-[#2B2B2B] select-none cursor-ew-resize"
                                    onMouseMove={(e) => {
                                      if (!isSliding) return;
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const x = e.clientX - rect.left;
                                      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                                      setSliderPosition(percentage);
                                    }}
                                    onMouseDown={() => setIsSliding(true)}
                                    onMouseUp={() => setIsSliding(false)}
                                    onMouseLeave={() => setIsSliding(false)}
                                    onTouchMove={(e) => {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const touch = e.touches[0];
                                      const x = touch.clientX - rect.left;
                                      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                                      setSliderPosition(percentage);
                                    }}
                                  >
                                    {/* BEFORE PHOTO (Left baseline, full size) */}
                                    <img 
                                      src={curPaciente.galeria[0].url} 
                                      alt="Antes" 
                                      className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute top-3 left-3 bg-black/60 border border-black text-[10px] uppercase font-bold tracking-widest text-[#C9A84C] px-2 py-1 rounded">
                                      Antes ({curPaciente.galeria[0].data})
                                    </div>

                                    {/* AFTER PHOTO (Right overlaid with fractional clipped width) */}
                                    <div 
                                      className="absolute inset-y-0 right-0 overflow-hidden pointer-events-none transition-all"
                                      style={{ left: `${sliderPosition}%` }}
                                    >
                                      <img 
                                        src={curPaciente.galeria[1].url} 
                                        alt="Depois" 
                                        className="absolute inset-y-0 right-0 w-[576px] h-full object-cover pointer-events-none max-w-none"
                                        style={{ width: "576px", transform: `translateX(${sliderPosition - 100}%)` }}
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="absolute top-3 right-3 bg-[#C9A84C] text-black text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded">
                                        Depois ({curPaciente.galeria[1].data})
                                      </div>
                                    </div>

                                    {/* Slider divider line and golden bubble */}
                                    <div 
                                      className="absolute inset-y-0 w-0.5 bg-[#C9A84C]/80 pointer-events-none shadow-[0_0_10px_rgba(201,168,76,0.6)]"
                                      style={{ left: `${sliderPosition}%` }}
                                    >
                                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-black border-2 border-[#C9A84C] flex items-center justify-center shadow-lg pointer-events-none">
                                        <div className="flex gap-0.5 text-[#C9A84C] text-[10px] font-bold">‹›</div>
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-neutral-500 block text-center mt-2">Clique e arraste nas bordas horizontais da foto acima para navegar no comparador temporal.</span>
                                </div>

                                {/* Intelligent evolution description sidepanel */}
                                <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between">
                                  <div className="space-y-4">
                                    <span className="text-xs uppercase tracking-widest font-bold text-[#C9A84C] block font-mono">Notas e Triagem Genética Capilar</span>
                                    
                                    {(analisePhotosResult) ? (
                                      <p className="text-xs text-neutral-300 leading-relaxed bg-black/30 p-3.5 border border-[#212121] rounded whitespace-pre-wrap max-h-56 overflow-y-auto">
                                        {analisePhotosResult}
                                      </p>
                                    ) : (
                                      <div className="space-y-3.5 text-xs text-neutral-400">
                                        <p><strong>Dermoscopia mais recente ({curPaciente.galeria[1].posicao}):</strong></p>
                                        <div className="bg-[#121212] p-3 rounded border border-[#252525]">
                                          <span className="font-mono text-[#C9A84C] block text-[10px] mb-1">Nota médica original:</span>
                                          "{curPaciente.galeria[1].notaIa || "Evolução clínica perceptível em redensificação na área frontoparietal."}"
                                        </div>
                                        <p className="text-[11px] leading-relaxed">Você pode rodar a IA no topo para gerar dados preditivos volumétricos baseados no cruzamento dos metadados fotográficos.</p>
                                      </div>
                                    )}
                                  </div>

                                  {loadingPhotosIa && (
                                    <div className="flex items-center gap-2 p-2 bg-[#C9A84C]/5 border border-[#C9A84C]/30 rounded mt-4">
                                      <div className="w-3.5 h-3.5 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
                                      <span className="text-[10px] text-neutral-400 uppercase font-mono">Calibrando imagem computacional...</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Historical Timeline list for all pictures in gallery */}
                          <div className="border-t border-[#1F1F1F] pt-6 space-y-4">
                            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Timeline Cronológica Inteira</span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                              {curPaciente.galeria.map(foto => (
                                <div key={foto.id} className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg space-y-2">
                                  <div className="h-28 rounded overflow-hidden relative">
                                    <img src={foto.url} alt={foto.posicao} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    <div className="absolute inset-0 bg-black/40 hover:bg-transparent transition text-[9px] uppercase font-bold text-white p-1.5 flex flex-col justify-end">
                                      <span>{foto.posicao}</span>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
                                    <span>{foto.data}</span>
                                    <button 
                                      onClick={() => {
                                        const updatedGaleria = curPaciente.galeria.filter(f => f.id !== foto.id);
                                        const updated = { ...curPaciente, galeria: updatedGaleria };
                                        handleSavePatientFields(updated);
                                      }}
                                      className="text-red-400 hover:text-red-500 transition shrink-0 cursor-pointer"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              
                              {/* Photo Simulation added */}
                              <label className="bg-[#161616]/70 hover:bg-[#1C1C1C] border border-dashed border-[#2B2B2B] hover:border-[#C9A84C]/40 rounded-lg h-36 flex flex-col justify-center items-center text-center p-3 cursor-pointer select-none transition">
                                <Plus className="w-6 h-6 text-[#C9A84C] mb-1" />
                                <span className="text-[10px] uppercase tracking-wider block text-neutral-400 font-mono">Adicionar Foto</span>
                                <span className="text-[9px] text-neutral-600">Simular nova dermoscopia</span>
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  className="hidden" 
                                  onChange={() => {
                                    const testPic: FotoCapilar = {
                                      id: `foto-${Date.now()}`,
                                      data: new Date().toISOString().split("T")[0],
                                      posicao: "Dermoscopia",
                                      url: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=600",
                                      notaIa: "Novas hastes capilares visíveis com óstios desobstruídos."
                                    };
                                    const updated = { ...curPaciente, galeria: [...curPaciente.galeria, testPic] };
                                    handleSavePatientFields(updated);
                                  }}
                                />
                              </label>
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  )}

                  {/* ====== TAB 6: CONSULTAS / HISTÓRICO ====== */}
                  {activeTab === "consultas" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b border-[#1F1F1F] pb-3">
                        <h3 className="text-lg font-serif text-[#FAFAFA] font-medium">Histórico de Visitas e Anotamentos</h3>
                        <span className="text-[11px] text-[#C9A84C] font-mono">{curPaciente.consultas.length} Encontros</span>
                      </div>

                      {curPaciente.consultas.length === 0 ? (
                        <div className="text-center py-10 text-neutral-500">
                          Nenhum registro de consulta anterior neste prontuário eletrônico.
                        </div>
                      ) : (
                        <div className="relative border-l border-[#2B2B2B] pl-6 ml-3 space-y-6">
                          {curPaciente.consultas.map((visit) => (
                            <div key={visit.id} className="relative group">
                              {/* Glowing node point */}
                              <div className="absolute -left-9 top-1 w-5.5 h-5.5 rounded-full bg-black border-2 border-[#C9A84C] flex items-center justify-center text-[8px] text-white">
                                <Check className="w-3 h-3 text-[#C9A84C]" />
                              </div>

                              <div className="bg-[#181818]/80 border border-[#262626] rounded-lg p-5 space-y-3">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-neutral-900 pb-2">
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-sm font-semibold text-[#FAFAFA] font-mono">{visit.data}</span>
                                    <span className="bg-[#C9A84C]/10 text-[#C9A84C] text-[10px] px-2.5 py-0.5 rounded uppercase font-mono">
                                      {visit.tipo}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                  <div className="space-y-1">
                                    <span className="text-[9px] uppercase tracking-wide text-neutral-500 block font-mono">Sintomas / Queixa Capilar</span>
                                    <p className="text-neutral-300 bg-neutral-900 border border-neutral-800 p-3 rounded italic min-h-[50px] leading-relaxed">
                                      "{visit.queixa}"
                                    </p>
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-[9px] uppercase tracking-wide text-neutral-500 block font-mono">Anotações da Médica (Evolução)</span>
                                    <p className="text-neutral-300 bg-neutral-900 border border-neutral-800 p-3 rounded min-h-[50px] leading-relaxed">
                                      {visit.evolucao}
                                    </p>
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-[9px] uppercase tracking-wide text-neutral-500 block font-mono">Condutas e Adaptações</span>
                                    <p className="text-neutral-300 bg-neutral-900 border border-neutral-800 p-3 rounded min-h-[50px] leading-relaxed">
                                      {visit.alteracoesProtocolo || "Nenhuma alteração registrada."}
                                    </p>
                                  </div>
                                </div>

                                {visit.resumoIa && (
                                  <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-md p-3.5 text-xs text-neutral-300">
                                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#C9A84C] font-mono mb-1">
                                      <Bot className="w-4 h-4 animate-pulse" /> Resumo Estruturado de Inteligência Artificial
                                    </div>
                                    <p className="leading-relaxed">{visit.resumoIa}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ====== TAB 7: CANAL DIRETO / QR CODE ====== */}
                  {activeTab === "mensagens" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn text-[#0A0A0A]">
                      
                      {/* Left: Chat interface */}
                      <div className="lg:col-span-2 border border-[#E5E5E5] rounded-xl flex flex-col h-[520px] bg-white overflow-hidden shadow-sm">
                        
                        {/* Chat header area */}
                        <div className="bg-gray-50 border-b border-gray-150 p-4 flex justify-between items-center">
                          <div>
                            <h4 style={{ fontFamily: "Georgia, serif" }} className="text-sm font-bold text-[#0A0A0A]">Canal Direto com o Paciente</h4>
                            <p className="text-[10px] text-gray-400 font-mono">Dra. Mariah Zibetti • Chat Criptografado</p>
                          </div>
                          <span className="bg-[#C9A84C]/10 text-[#C9A84C] text-[9px] font-mono uppercase font-bold py-1 px-2.5 rounded">
                            Ativo
                          </span>
                        </div>

                        {/* Message log */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/20">
                          {(!patientChats[curPaciente.id] || patientChats[curPaciente.id].length === 0) ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 font-mono text-xs">
                              <MessageSquare className="w-8 h-8 text-[#C9A84C]/50 mb-2" />
                              Nenhuma mensagem anterior no histórico. Envie as instruções iniciais para registrar no canal.
                            </div>
                          ) : (
                            patientChats[curPaciente.id].map((msg: any) => {
                              const isDoctor = msg.sender === "medica";
                              return (
                                <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isDoctor ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 text-[10px] font-bold ${
                                    isDoctor 
                                      ? "bg-[#0A0A0A] text-[#F5F0E8] border-transparent" 
                                      : "bg-white text-[#C9A84C] border-[#C9A84C]/50"
                                  }`}>
                                    {isDoctor ? "MZ" : curPaciente.nome.substring(0, 2).toUpperCase()}
                                  </div>

                                  <div className="space-y-0.5">
                                    <div className={`p-3 rounded-xl text-xs leading-relaxed border ${
                                      isDoctor 
                                        ? "bg-[#F5F0E8] text-gray-900 border-[#C9A84C]/35 rounded-tr-none" 
                                        : "bg-white text-gray-800 border-gray-150 rounded-tl-none"
                                    }`}>
                                      {msg.content}
                                    </div>
                                    <span className={`text-[8px] font-mono text-gray-400 block ${isDoctor ? "text-right" : "text-left"}`}>
                                      {msg.timestamp}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Compose form */}
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.currentTarget;
                            const input = form.elements.namedItem("docmsg") as HTMLInputElement;
                            if (input && input.value.trim() && onSendDoctorMessage) {
                              onSendDoctorMessage(curPaciente.id, input.value);
                              input.value = "";
                            }
                          }}
                          className="p-3 border-t border-gray-150 bg-white flex gap-2"
                        >
                          <input
                            name="docmsg"
                            type="text"
                            placeholder={`Escreva para ${curPaciente.nome}...`}
                            className="flex-1 bg-gray-50 border border-gray-250 focus:border-[#C9A84C] focus:bg-white text-xs py-2.5 px-3.5 rounded-lg outline-none font-sans font-medium text-gray-800"
                          />
                          <button
                            type="submit"
                            className="bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black font-semibold text-xs font-mono uppercase px-4 py-2.5 rounded-lg cursor-pointer transition shadow"
                          >
                            Enviar
                          </button>
                        </form>

                      </div>

                      {/* Right: Companion panel with beautiful patient onboarding and live QR CODE */}
                      <div className="border border-[#E5E5E5] rounded-xl p-5 bg-white space-y-5 shadow-sm flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
                            <QrCode className="w-5 h-5 text-[#C9A84C]" />
                            <h4 style={{ fontFamily: "Georgia, serif" }} className="text-sm font-bold text-[#0A0A0A]">QR Code de Acesso</h4>
                          </div>

                          <p className="text-xs text-gray-500 leading-relaxed font-sans font-medium">
                            Disponibilize o acesso individual para o paciente acompanhar o laudo de exames, o protocolo capilar atualizado e falar diretamente com a clínica.
                          </p>

                          {/* Aesthetic vector-drawn QR Code box */}
                          <div className="mx-auto w-40 h-40 bg-[#121212] rounded-xl flex flex-col items-center justify-center p-3 relative shadow-inner group border border-[#C9A84C]/30">
                            
                            {/* Visual QR element matrix */}
                            <div className="w-[110px] h-[110px] border border-[#C9A84C]/45 flex flex-wrap gap-1 p-1 bg-white rounded-md items-center justify-center">
                              <div className="w-6 h-6 border-4 border-[#0A0A0A] bg-white rounded flex items-center justify-center shrink-0">
                                <div className="w-2 h-2 bg-[#0A0A0A]" />
                              </div>
                              <div className="w-2.5 h-2.5 bg-[#C9A84C] rounded-sm shrink-0" />
                              <div className="w-2.5 h-2.5 bg-[#0A0A0A] rounded-sm shrink-0" />
                              <div className="w-6 h-6 border-4 border-[#0A0A0A] bg-white rounded flex flex-wrap items-center justify-center shrink-0">
                                <div className="w-2 h-2 bg-[#0A0A0A]" />
                              </div>
                              <div className="w-2.5 h-2.5 bg-[#0A0A0A] rounded-sm shrink-0" />
                              <div className="w-2 h-2 bg-black rounded-sm shrink-0" />
                              <div className="w-1.5 h-1.5 bg-[#C9A84C] rounded-sm shrink-0" />
                              <div className="w-3 h-3 bg-black rounded-sm shrink-0" />
                              <div className="w-3 h-3 border border-gray-300 rounded-sm bg-[#C9A84C]/25 flex items-center justify-center font-serif text-[7px] font-bold text-black font-semibold shrink-0">C.C</div>
                              <div className="w-2 h-2 bg-black rounded-sm shrink-0" />
                              <div className="w-2.5 h-2.5 bg-black rounded-sm shrink-0" />
                              <div className="w-2 h-2 bg-black rounded-sm shrink-0" />
                              <div className="w-1.5 h-1.5 bg-black rounded-sm shrink-0" />
                              <div className="w-6 h-6 border-4 border-[#0A0A0A] bg-white rounded flex items-center justify-center shrink-0">
                                <div className="w-2 h-2 bg-[#0A0A0A]" />
                              </div>
                              <div className="w-3 h-3 bg-[#C9A84C] rounded-sm shrink-0" />
                              <div className="w-2.5 h-2.5 bg-black rounded shrink-0" />
                              <div className="w-2.5 h-2.5 bg-black rounded-sm shrink-0" />
                              <div className="w-2.5 h-2.5 bg-black rounded shrink-0" />
                            </div>

                            <div className="text-[7.5px] text-gray-400 font-mono tracking-widest leading-none mt-2 font-bold select-all">
                              CA.RO CLINIC PORTAL
                            </div>
                          </div>

                          <div className="bg-[#F5F0E8] p-3 rounded-lg border border-[#C9A84C]/25 space-y-1.5 text-xs">
                            <div className="font-semibold text-gray-800 font-sans uppercase text-[9px] tracking-wide text-neutral-500 font-bold">Instruções de Login:</div>
                            <div className="text-[10px] text-gray-700 leading-relaxed font-sans font-medium">
                              Peça para o paciente apontar a câmera do celular para o código acima. No smartphone, ele entrará com o CPF:
                              <strong className="block text-gray-900 border border-gray-200 bg-white p-1 rounded text-center mt-1 font-mono tracking-wider text-xs select-all">
                                {curPaciente.cpf}
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-gray-150 pt-3 text-[10px] text-gray-450 italic font-mono font-bold uppercase tracking-wide">
                          PORTAL DO PACIENTE ATIVO
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== DIALOG: RECEITUÁRIO PREMIUM / LETTERHEAD PREVIEW ====== */}
      {showLetterheadPreview && curPaciente && (
        <div id="recipe_modal" className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 font-sans">
          <div className="bg-[#F5F0E8] text-[#0A0A0A] w-full max-w-2xl rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Header control box in dark mode */}
            <div className="bg-[#0C0C0C] text-neutral-300 p-4 flex justify-between items-center border-b border-[#252525]">
              <span className="font-mono text-xs uppercase tracking-wider text-[#C9A84C]">Receituário Premium de Tricologia</span>
              <button 
                onClick={() => setShowLetterheadPreview(false)}
                className="text-neutral-400 hover:text-white transition text-xs font-semibold px-2 py-1 bg-[#1A1A1A] rounded cursor-pointer"
              >
                Fechar Visualizador
              </button>
            </div>

            {/* Printable Area content representation with beautiful margin elements */}
            <div className="p-10 select-raw font-sans">
              <div className="border border-neutral-300/60 p-8 min-h-[500px] flex flex-col justify-between bg-[#FCFAF7] relative">
                
                {/* Vintage decorative header grids */}
                <div>
                  <div className="flex justify-between items-start border-b-2 border-neutral-800 pb-5">
                    <div>
                      <h2 className="text-xl font-serif text-[#0A0A0A] tracking-wider uppercase font-bold">Dra. Mariah Zibetti</h2>
                      <p className="text-[10px] uppercase tracking-widest text-[#C9A84C] font-semibold -mt-1 block">Tricologia Médica e Capilar Avançada</p>
                      <p className="text-[9px] text-neutral-500 font-mono tracking-wide mt-1">CRM PR 57.133 • CRM SC 24.111</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className="w-8 h-8 rounded-full border border-[#C9A84C] flex items-center justify-center">
                        <span className="font-serif text-[#C9A84C] text-[10px] font-bold">Z</span>
                      </div>
                      <span className="text-[9px] text-neutral-500 italic mt-1 max-w-[120px] leading-tight">Precisão em cada fio.</span>
                    </div>
                  </div>

                  {/* Patient Identifier line */}
                  <div className="mt-8 mb-6 flex justify-between text-xs text-neutral-800 border-b border-dashed border-neutral-300 pb-2">
                    <span><strong>Paciente:</strong> {curPaciente.nome}</span>
                    <span><strong>Data de Emissão:</strong> {new Date().toLocaleDateString("pt-BR")}</span>
                  </div>

                  {/* Core Medical Formula body text representation */}
                  <div className="space-y-6 text-xs text-neutral-800 leading-relaxed font-serif pr-2">
                    <div className="space-y-2">
                      <h4 className="font-sans font-bold uppercase tracking-wider text-[11px] text-neutral-600">I. Prescrição Terapêutica Sistêmica</h4>
                      <p className="bg-[#F5F0E8]/40 p-4 rounded border border-neutral-200 font-mono text-[11px] text-neutral-700 whitespace-pre-wrap">
                        {curPaciente.protocolo.medicamentos || "Uso contínuo conforme indicação."}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-sans font-bold uppercase tracking-wider text-[11px] text-neutral-600">II. Cronograma Domiciliar e Nutracêuticos</h4>
                      <p className="bg-[#F5F0E8]/40 p-4 rounded border border-neutral-200 font-mono text-[11px] text-neutral-700 whitespace-pre-wrap">
                        {curPaciente.protocolo.suplementacao || "Nenhuma suplementação cadastrada."}
                      </p>
                    </div>

                    <p className="text-[10px] text-neutral-500 font-sans italic mt-4">
                      Em caso de manifestações irritativas locais ou prurido súbito, suspender as loções e reportar imediatamente à nossa triagem.
                    </p>
                  </div>
                </div>

                {/* Footer medical stamp lines */}
                <div className="mt-12 text-center border-t border-neutral-300 pt-6">
                  <p className="text-[9px] text-neutral-400 font-sans uppercase tracking-widest">Toledo: Av. Parigot de Souza, 1222 • Fátima do Sul: Rua Tenente Fátima, 555</p>
                  <p className="text-[9px] text-neutral-500 italic mt-0.5">mariahzibetti.com.br</p>

                  <div className="w-48 mx-auto border-b border-neutral-800 mt-6 pb-1" />
                  <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-800 font-serif mt-1">Dra. Mariah Zibetti</p>
                  <p className="text-[8px] text-neutral-400 font-mono">CRM PR 57.133</p>
                </div>

              </div>
            </div>

            {/* Simulated actions on the receipts */}
            <div className="bg-[#121212] p-4 flex justify-between items-center text-xs">
              <span className="text-neutral-500 font-mono text-[10px]">Documento autenticado eletronicamente.</span>
              <button 
                onClick={() => {
                  alert("Impressão enviada com sucesso para a impressora configurada na unidade!");
                  setShowLetterheadPreview(false);
                }}
                className="bg-[#C9A84C] hover:bg-[#D9B85C] text-black font-semibold px-4 py-2 rounded transition cursor-pointer"
              >
                Imprimir Documento
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
export {};
