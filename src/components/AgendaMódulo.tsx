import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  User, 
  Video, 
  Filter, 
  Lock,
  Unlock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  Stethoscope,
  X,
  Activity,
  CalendarDays,
  Grid,
  ListFilter,
  Users,
  AlertCircle
} from "lucide-react";
import { EventoAgenda, Paciente } from "../types";

interface AgendaModuloProps {
  agendaHoje: EventoAgenda[];
  pacientes: Paciente[];
  onViewPaciente: (pacienteId: string) => void;
  onOpenNovaConsulta: (pacienteId: string) => void;
  onAddAgendaEvento?: (novoEvento: EventoAgenda) => void;
}

interface TimeSlot {
  time: string; // "08:00"
  event?: EventoAgenda;
  isBlocked?: boolean;
}

export default function AgendaModulo({ 
  agendaHoje = [], 
  pacientes = [], 
  onViewPaciente,
  onOpenNovaConsulta,
  onAddAgendaEvento
}: AgendaModuloProps) {

  const [activeUnit, setActiveUnit] = useState<"all" | "Toledo" | "Fátima do Sul" | "Online">("all");
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  
  // Custom blocked slots mapping (Date -> Time[])
  const [blockedSlots, setBlockedSlots] = useState<Record<string, string[]>>({});
  const [agendaDoDia, setAgendaDoDia] = useState<EventoAgenda[]>(agendaHoje);

  // New Event Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [targetTime, setTargetTime] = useState("09:00");
  const [selectedPacienteId, setSelectedPacienteId] = useState("");
  const [customPacienteNome, setCustomPacienteNome] = useState("");
  const [tipoAtendimento, setTipoAtendimento] = useState<EventoAgenda["tipo"]>("Presencial - Toledo");
  const [procedimentoTag, setProcedimentoTag] = useState("Primeira Consulta Tricologia");
  const [duracaoMinutos, setDuracaoMinutos] = useState(60);

  const formattedDateKey = selectedDate.toISOString().split("T")[0];

  // Sincronização inicial e atualização com fallback
  useEffect(() => {
    fetch("/api/agenda?date=" + formattedDateKey)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAgendaDoDia(data);
        } else if (formattedDateKey === new Date().toISOString().split("T")[0]) {
          setAgendaDoDia(agendaHoje.length > 0 ? agendaHoje : getSampleEvents(formattedDateKey));
        } else {
          setAgendaDoDia([]);
        }
      })
      .catch(() => {
        if (formattedDateKey === new Date().toISOString().split("T")[0]) {
          setAgendaDoDia(agendaHoje.length > 0 ? agendaHoje : getSampleEvents(formattedDateKey));
        }
      });
  }, [formattedDateKey, agendaHoje]);

  function getSampleEvents(dateStr: string): EventoAgenda[] {
    return [
      {
        id: "evt-sample-1",
        pacienteId: pacientes[0]?.id || "p1",
        pacienteNome: pacientes[0]?.nome || "Helena Silveira de Souza",
        data: dateStr,
        horario: "09:00",
        tipo: "Presencial - Toledo",
        status: "Confirmada",
        diagnosticoResumo: "Primeira Consulta Tricologia Capilar",
        duracaoMinutos: 60,
        procedimentoTag: "Primeira Consulta"
      },
      {
        id: "evt-sample-2",
        pacienteId: pacientes[1]?.id || "p2",
        pacienteNome: pacientes[1]?.nome || "Gabriela Portela Ramos",
        data: dateStr,
        horario: "11:00",
        tipo: "Presencial - Toledo",
        status: "Confirmada",
        diagnosticoResumo: "Sessão de MMP Capilar com Fatores de Crescimento",
        duracaoMinutos: 45,
        procedimentoTag: "MMP Capilar"
      },
      {
        id: "evt-sample-3",
        pacienteId: pacientes[2]?.id || "p3",
        pacienteNome: pacientes[2]?.nome || "Carlos Eduardo Rocha",
        data: dateStr,
        horario: "14:30",
        tipo: "Presencial - Fátima do Sul",
        status: "Confirmada",
        diagnosticoResumo: "Reavaliação Tricoscópica & Ajuste de Dose",
        duracaoMinutos: 30,
        procedimentoTag: "Retorno"
      }
    ];
  }

  const handleBlockSlot = (time: string) => {
    setBlockedSlots(prev => {
      const todayBlocks = prev[formattedDateKey] || [];
      if (todayBlocks.includes(time)) {
        return { ...prev, [formattedDateKey]: todayBlocks.filter(t => t !== time) };
      }
      return { ...prev, [formattedDateKey]: [...todayBlocks, time] };
    });
  };

  const handleOpenScheduleModal = (time?: string) => {
    if (time) setTargetTime(time);
    if (pacientes.length > 0) {
      setSelectedPacienteId(pacientes[0].id);
    }
    setShowScheduleModal(true);
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const pacienteEncontrado = pacientes.find(p => p.id === selectedPacienteId);
    const nomeFinal = pacienteEncontrado ? pacienteEncontrado.nome : (customPacienteNome || "Paciente Agendado");
    const pIdFinal = pacienteEncontrado ? pacienteEncontrado.id : `paciente-${Date.now()}`;

    const novoEvento: EventoAgenda = {
      id: `evt-${Date.now()}`,
      pacienteId: pIdFinal,
      pacienteNome: nomeFinal,
      data: formattedDateKey,
      horario: targetTime,
      tipo: tipoAtendimento,
      status: "Confirmada",
      diagnosticoResumo: `${procedimentoTag} — ${tipoAtendimento}`,
      duracaoMinutos: duracaoMinutos,
      procedimentoTag: procedimentoTag
    };

    // Atualiza estado local da agenda imediatamente
    setAgendaDoDia(prev => [...prev.filter(e => e.horario !== targetTime), novoEvento]);
    if (onAddAgendaEvento) {
      onAddAgendaEvento(novoEvento);
    }

    setShowScheduleModal(false);
    setCustomPacienteNome("");

    // Envia ao backend Vercel / Neon DB
    try {
      await fetch("/api/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoEvento)
      });
    } catch {}
  };

  // Generate Slots from 08:00 to 18:30 (every 30 mins)
  const generateSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const todayBlocks = blockedSlots[formattedDateKey] || [];
    
    for (let h = 8; h <= 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === 18 && m === 30) continue;
        
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        const event = agendaDoDia.find(e => e.horario === timeStr && (activeUnit === "all" || e.tipo.includes(activeUnit)));
        
        slots.push({
          time: timeStr,
          event: event,
          isBlocked: todayBlocks.includes(timeStr)
        });
      }
    }
    return slots;
  };

  const timeSlots = generateSlots();
  const totalAgendados = timeSlots.filter(s => s.event).length;
  const totalLivres = timeSlots.filter(s => !s.event && !s.isBlocked).length;

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const getUnitBadge = (tipo: EventoAgenda["tipo"]) => {
    if (tipo.includes("Toledo")) {
      return <span className="bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/40 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold">📍 Toledo</span>;
    }
    if (tipo.includes("Fátima")) {
      return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold">📍 Fátima do Sul</span>;
    }
    return <span className="bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold">💻 Telemedicina</span>;
  };

  return (
    <div id="agenda_module_container" className="space-y-6 h-full flex flex-col font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-[#0A0A0A]/5 pb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0A0A0A] font-normal">
              Agenda de Atendimentos
            </h2>
            <span className="bg-[#0A0A0A] text-[#C9A84C] text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" /> Dra. Mariah Zibetti
            </span>
          </div>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mt-1.5 font-mono">
            Grade de Horários Capilares • Unidades Toledo & Fátima do Sul
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-mono font-bold">
            <button 
              onClick={() => setViewMode("day")} 
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${viewMode === "day" ? "bg-white text-[#0A0A0A] shadow-sm" : "text-gray-500 hover:text-black"}`}
            >
              Dia
            </button>
            <button 
              onClick={() => setViewMode("week")} 
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${viewMode === "week" ? "bg-white text-[#0A0A0A] shadow-sm" : "text-gray-500 hover:text-black"}`}
            >
              Semana
            </button>
            <button 
              onClick={() => setViewMode("month")} 
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${viewMode === "month" ? "bg-white text-[#0A0A0A] shadow-sm" : "text-gray-500 hover:text-black"}`}
            >
              Mês
            </button>
          </div>

          {/* Unit Switcher */}
          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm text-xs font-mono font-bold uppercase tracking-wide">
            <button onClick={() => setActiveUnit("all")} className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${activeUnit === "all" ? "bg-[#0A0A0A] text-[#C9A84C]" : "text-gray-500 hover:bg-gray-50"}`}>Tudo</button>
            <button onClick={() => setActiveUnit("Toledo")} className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${activeUnit === "Toledo" ? "bg-[#0A0A0A] text-[#C9A84C]" : "text-gray-500 hover:bg-gray-50"}`}>Toledo</button>
            <button onClick={() => setActiveUnit("Fátima do Sul")} className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${activeUnit === "Fátima do Sul" ? "bg-[#0A0A0A] text-[#C9A84C]" : "text-gray-500 hover:bg-gray-50"}`}>Fátima do Sul</button>
          </div>

          {/* Action Button */}
          <button
            onClick={() => handleOpenScheduleModal()}
            className="bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black text-xs font-bold font-mono uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-2 transition cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" /> Novo Agendamento
          </button>
        </div>
      </div>

      {/* Summary Cards Top */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
        <div className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block font-bold">Consultas Hoje</span>
            <span className="text-2xl font-bold text-[#0A0A0A] font-serif">{totalAgendados} Pacientes</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0A0A0A] text-[#C9A84C] flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block font-bold">Horários Livres</span>
            <span className="text-2xl font-bold text-emerald-600 font-serif">{totalLivres} Vagas</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block font-bold">Data Selecionada</span>
            <span className="text-base font-bold text-[#0A0A0A] font-serif capitalize">
              {selectedDate.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center font-bold">
            <CalendarIcon className="w-5 h-5 text-[#C9A84C]" />
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* Left Side: Interactive Calendar Navigator */}
        <div className="lg:w-80 shrink-0 space-y-4">
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-gray-900 text-sm font-mono uppercase">
                {selectedDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </span>
              <div className="flex gap-1">
                <button onClick={handlePrevDay} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 cursor-pointer"><ChevronLeft className="w-4 h-4"/></button>
                <button onClick={handleToday} className="text-[10px] font-mono font-bold px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg cursor-pointer">HOJE</button>
                <button onClick={handleNextDay} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 cursor-pointer"><ChevronRight className="w-4 h-4"/></button>
              </div>
            </div>

            <div className="text-center py-6 bg-[#0A0A0A] text-white rounded-2xl border border-[#C9A84C]/30 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#C9A84C]/10 rounded-full blur-xl pointer-events-none" />
              <span className="block text-5xl font-serif text-[#C9A84C] font-bold">{selectedDate.getDate()}</span>
              <span className="block text-xs uppercase font-mono font-bold text-white/70 mt-1.5 tracking-widest">
                {selectedDate.toLocaleDateString("pt-BR", { weekday: "long" })}
              </span>
            </div>
            
            <div className="mt-6 border-t border-gray-100 pt-4 space-y-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">Status da Atividade</span>
              <div className="flex items-center gap-2.5 text-xs text-gray-700"><div className="w-3.5 h-3.5 rounded-md bg-white border border-gray-300"></div> Horário Disponível</div>
              <div className="flex items-center gap-2.5 text-xs text-gray-700"><div className="w-3.5 h-3.5 rounded-md bg-[#0A0A0A] border border-[#C9A84C]"></div> Atendimento Confirmado</div>
              <div className="flex items-center gap-2.5 text-xs text-gray-700"><div className="w-3.5 h-3.5 rounded-md bg-red-100 border border-red-300"></div> Horário Bloqueado</div>
            </div>
          </div>
        </div>

        {/* Right Side: Hourly Grid View */}
        <div className="flex-1 bg-white border border-[#E5E5E5] rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 px-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-serif text-lg text-gray-900 font-medium">Programação de Atendimentos</h3>
            <span className="text-xs text-gray-500 font-mono">Clique em "+ Agendar" em qualquer horário livre.</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
            {timeSlots.map((slot, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.01 }}
                key={slot.time} 
                className={`flex border rounded-2xl overflow-hidden transition-all group ${
                  slot.isBlocked 
                    ? "border-red-200 bg-red-50/50" 
                    : slot.event 
                      ? "border-[#C9A84C]/60 bg-[#0A0A0A] text-white shadow-lg" 
                      : "border-gray-200 bg-white hover:border-[#C9A84C]/50"
                }`}
              >
                {/* Time Indicator */}
                <div className={`w-24 shrink-0 flex flex-col items-center justify-center py-4 border-r ${
                  slot.isBlocked 
                    ? "border-red-200 bg-red-100/40 text-red-700" 
                    : slot.event 
                      ? "border-[#252525] bg-black text-[#C9A84C]" 
                      : "border-gray-100 bg-gray-50 text-gray-700"
                }`}>
                  <span className="font-mono font-bold text-base">{slot.time}</span>
                  {!slot.event && !slot.isBlocked && <span className="text-[9px] uppercase mt-0.5 tracking-wider text-gray-400 font-mono font-semibold">Vaga Livre</span>}
                </div>

                {/* Content Area */}
                <div className="flex-1 p-4 flex items-center justify-between gap-4">
                  {slot.isBlocked ? (
                    <div className="flex items-center gap-2 text-red-600 font-sans font-medium text-xs">
                      <Lock className="w-4 h-4" /> Horário Bloqueado na Agenda
                    </div>
                  ) : slot.event ? (
                    <div className="flex justify-between items-center w-full flex-wrap gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-bold font-sans text-base text-white">
                            {slot.event.pacienteNome || "Paciente Agendado"}
                          </span>
                          {getUnitBadge(slot.event.tipo)}
                        </div>
                        <p className="text-xs text-neutral-300 font-sans flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-[#C9A84C]" /> {slot.event.diagnosticoResumo}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right mr-2 hidden sm:block">
                          <span className="block text-[9px] text-neutral-400 uppercase font-bold font-mono tracking-wider">Duração</span>
                          <span className="text-xs font-mono text-[#C9A84C] flex items-center gap-1"><Clock className="w-3 h-3"/> {slot.event.duracaoMinutos || 45} min</span>
                        </div>
                        
                        <button 
                          onClick={() => onViewPaciente(slot.event!.pacienteId)}
                          className="bg-white/10 hover:bg-white text-white hover:text-black font-bold px-3.5 py-2 rounded-xl text-[11px] uppercase font-mono tracking-wider transition cursor-pointer border border-white/20"
                        >
                          Prontuário
                        </button>
                        
                        <button 
                          onClick={() => onOpenNovaConsulta(slot.event!.pacienteId)}
                          className="bg-[#C9A84C] hover:bg-[#D9B85C] text-black font-bold px-4 py-2 rounded-xl text-[11px] uppercase font-mono tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow"
                        >
                          <Stethoscope className="w-3.5 h-3.5" /> Atender
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs text-gray-400 font-sans italic">Horário disponível para agendamento.</span>
                      <button 
                        onClick={() => handleOpenScheduleModal(slot.time)}
                        className="flex items-center gap-1.5 text-xs uppercase font-mono font-bold text-[#C9A84C] hover:text-black bg-[#C9A84C]/10 hover:bg-[#C9A84C] px-4 py-2 rounded-xl transition cursor-pointer shadow-xs"
                      >
                        <Plus className="w-4 h-4" /> Agendar Consulta
                      </button>
                    </div>
                  )}
                </div>

                {/* Block/Unblock Toggle */}
                {!slot.event && (
                  <button 
                    onClick={() => handleBlockSlot(slot.time)}
                    className={`w-12 shrink-0 flex items-center justify-center border-l transition-colors cursor-pointer ${
                      slot.isBlocked 
                        ? "border-red-200 text-red-500 hover:bg-red-100" 
                        : "border-gray-100 text-gray-300 hover:bg-gray-100 hover:text-gray-600"
                    }`}
                    title={slot.isBlocked ? "Desbloquear horário" : "Bloquear horário"}
                  >
                    {slot.isBlocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>

      </div>

      {/* ====== MODAL: NOVO AGENDAMENTO CAPILAR ====== */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-sans">
          <div className="bg-white text-[#0A0A0A] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fadeIn border border-[#C9A84C]/40">
            
            <div className="bg-[#0A0A0A] text-white p-4 px-6 flex justify-between items-center border-b border-[#252525]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                <span className="font-mono text-xs uppercase tracking-wider text-[#C9A84C] font-bold">Novo Agendamento • Dra. Mariah Zibetti</span>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-white transition p-1 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase text-gray-600 font-mono font-bold block">Selecione o Paciente</label>
                {pacientes.length > 0 ? (
                  <select 
                    value={selectedPacienteId} 
                    onChange={(e) => setSelectedPacienteId(e.target.value)} 
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-sm text-[#0A0A0A] p-3.5 rounded-xl outline-none font-sans"
                  >
                    {pacientes.map(p => (
                      <option key={p.id} value={p.id}>{p.nome} — CPF: {p.cpf || "N/A"}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    placeholder="Nome completo do paciente" 
                    value={customPacienteNome} 
                    onChange={(e) => setCustomPacienteNome(e.target.value)} 
                    required 
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-sm text-[#0A0A0A] p-3.5 rounded-xl outline-none" 
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase text-gray-600 font-mono font-bold block">Unidade / Modalidade</label>
                  <select 
                    value={tipoAtendimento} 
                    onChange={(e) => setTipoAtendimento(e.target.value as any)} 
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-xs text-[#0A0A0A] p-3.5 rounded-xl outline-none font-mono"
                  >
                    <option value="Presencial - Toledo">📍 Unidade Toledo</option>
                    <option value="Presencial - Fátima do Sul">📍 Unidade Fátima do Sul</option>
                    <option value="Online">💻 Telemedicina (Online)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase text-gray-600 font-mono font-bold block">Procedimento / Motivo</label>
                  <select 
                    value={procedimentoTag} 
                    onChange={(e) => setProcedimentoTag(e.target.value)} 
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-xs text-[#0A0A0A] p-3.5 rounded-xl outline-none font-mono"
                  >
                    <option value="Primeira Consulta Tricologia">Primeira Consulta Tricologia</option>
                    <option value="Retorno Tricologia">Retorno Tricologia</option>
                    <option value="MMP Capilar (Microinfusão)">MMP Capilar (Microinfusão)</option>
                    <option value="Laser LLLT / LEDterapia">Laser LLLT / LEDterapia</option>
                    <option value="Microagulhamento com Exossomas">Microagulhamento com Exossomas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase text-gray-600 font-mono font-bold block">Horário da Consulta</label>
                  <input 
                    type="time" 
                    value={targetTime} 
                    onChange={(e) => setTargetTime(e.target.value)} 
                    required 
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-sm text-[#0A0A0A] p-3.5 rounded-xl outline-none font-mono font-bold" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase text-gray-600 font-mono font-bold block">Duração Estimada</label>
                  <select 
                    value={duracaoMinutos} 
                    onChange={(e) => setDuracaoMinutos(Number(e.target.value))} 
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-sm text-[#0A0A0A] p-3.5 rounded-xl outline-none font-mono"
                  >
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos (1h)</option>
                    <option value={90}>90 minutos (1h 30m)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-end gap-3 text-xs">
                <button 
                  type="button" 
                  onClick={() => setShowScheduleModal(false)} 
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-4 py-2.5 rounded-xl font-mono uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black font-semibold px-5 py-2.5 rounded-xl font-mono uppercase tracking-wider cursor-pointer transition shadow-md"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
