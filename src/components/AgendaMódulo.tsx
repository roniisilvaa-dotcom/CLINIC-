import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  CheckCircle, 
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
  X
} from "lucide-react";
import { EventoAgenda, Paciente } from "../types";

interface AgendaModuloProps {
  agendaHoje: EventoAgenda[];
  pacientes: Paciente[];
  onViewPaciente: (pacienteId: string) => void;
  onOpenNovaConsulta: (pacienteId: string) => void;
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
  onOpenNovaConsulta 
}: AgendaModuloProps) {

  const [activeUnit, setActiveUnit] = useState<"all" | "Toledo" | "Fátima do Sul" | "Online">("all");
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
  const [procedimentoTag, setProcedimentoTag] = useState("Retorno Tricologia");
  const [duracaoMinutos, setDuracaoMinutos] = useState(45);

  const formattedDateKey = selectedDate.toISOString().split("T")[0];

  useEffect(() => {
    // Busca dados do dia no backend ou usa o fallback local
    fetch("/api/agenda?date=" + formattedDateKey)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAgendaDoDia(data);
        } else if (formattedDateKey === new Date().toISOString().split("T")[0]) {
          setAgendaDoDia(agendaHoje);
        } else {
          setAgendaDoDia([]);
        }
      })
      .catch(() => {
        if (formattedDateKey === new Date().toISOString().split("T")[0]) {
          setAgendaDoDia(agendaHoje);
        }
      });
  }, [formattedDateKey, agendaHoje]);

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
      diagnosticoResumo: `${procedimentoTag} (${tipoAtendimento.includes("Toledo") ? "Unid. Toledo" : tipoAtendimento.includes("Fátima") ? "Unid. Fátima do Sul" : "Online"})`,
      duracaoMinutos: duracaoMinutos,
      procedimentoTag: procedimentoTag
    };

    setAgendaDoDia(prev => [...prev.filter(e => e.horario !== targetTime), novoEvento]);
    setShowScheduleModal(false);
    setCustomPacienteNome("");

    // Envia ao backend em segundo plano
    try {
      await fetch("/api/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoEvento)
      });
    } catch {}
  };

  // Generate Slots from 08:00 to 19:00 (every 30 mins)
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

  return (
    <div id="agenda_module_container" className="space-y-6 h-full flex flex-col">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#0A0A0A]/5 pb-6 shrink-0">
        <div>
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0A0A0A] font-normal flex items-center gap-2">
            Agenda Clínica <CalendarIcon className="w-6 h-6 text-[#C9A84C]" />
          </h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mt-1.5 font-sans">
            Gestão de Horários e Atendimentos • Dra. Mariah Zibetti
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm text-xs font-mono font-bold uppercase tracking-wide">
            <button onClick={() => setActiveUnit("all")} className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${activeUnit === "all" ? "bg-[#0A0A0A] text-[#C9A84C]" : "text-gray-500 hover:bg-gray-50"}`}>Tudo</button>
            <button onClick={() => setActiveUnit("Toledo")} className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${activeUnit === "Toledo" ? "bg-[#0A0A0A] text-[#C9A84C]" : "text-gray-500 hover:bg-gray-50"}`}>Toledo</button>
            <button onClick={() => setActiveUnit("Fátima do Sul")} className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${activeUnit === "Fátima do Sul" ? "bg-[#0A0A0A] text-[#C9A84C]" : "text-gray-500 hover:bg-gray-50"}`}>Fátima do Sul</button>
            <button onClick={() => setActiveUnit("Online")} className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${activeUnit === "Online" ? "bg-[#0A0A0A] text-[#C9A84C]" : "text-gray-500 hover:bg-gray-50"}`}>Online</button>
          </div>

          <button
            onClick={() => handleOpenScheduleModal()}
            className="bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black text-xs font-bold font-mono uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-2 transition cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" /> Novo Agendamento
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* Left Side: Calendar Navigator */}
        <div className="lg:w-72 shrink-0 space-y-4">
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-gray-800 text-xs font-mono">
                {selectedDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).toUpperCase()}
              </span>
              <div className="flex gap-1">
                <button onClick={handlePrevDay} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 cursor-pointer"><ChevronLeft className="w-4 h-4"/></button>
                <button onClick={handleToday} className="text-[10px] font-mono font-bold px-2 hover:bg-gray-100 rounded-lg cursor-pointer">HOJE</button>
                <button onClick={handleNextDay} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 cursor-pointer"><ChevronRight className="w-4 h-4"/></button>
              </div>
            </div>

            <div className="text-center py-6 bg-[#F8F6F0] border border-[#C9A84C]/20 rounded-xl">
              <span className="block text-4xl font-serif text-[#0A0A0A] font-bold">{selectedDate.getDate()}</span>
              <span className="block text-xs uppercase font-mono font-bold text-[#C9A84C] mt-1">
                {selectedDate.toLocaleDateString("pt-BR", { weekday: "long" })}
              </span>
            </div>
            
            <div className="mt-6 border-t border-gray-100 pt-4 space-y-2.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Legenda da Grade</span>
              <div className="flex items-center gap-2 text-xs text-gray-600"><div className="w-3 h-3 rounded bg-white border border-gray-300"></div> Horário Livre</div>
              <div className="flex items-center gap-2 text-xs text-gray-600"><div className="w-3 h-3 rounded bg-[#0A0A0A] border border-[#C9A84C]"></div> Consulta Confirmada</div>
              <div className="flex items-center gap-2 text-xs text-gray-600"><div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div> Bloqueado</div>
            </div>
          </div>
        </div>

        {/* Right Side: Hourly Grid View */}
        <div className="flex-1 bg-white border border-[#E5E5E5] rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-serif text-lg text-gray-900 font-medium">Grade de Atendimentos</h3>
            <span className="text-xs text-gray-500 font-mono">Clique em "+ Agendar" para marcar paciente.</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {timeSlots.map((slot, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.015 }}
                key={slot.time} 
                className={`flex border rounded-xl overflow-hidden transition-all group ${
                  slot.isBlocked 
                    ? "border-red-200 bg-red-50/60" 
                    : slot.event 
                      ? "border-[#C9A84C]/60 bg-[#0A0A0A] text-white shadow-md" 
                      : "border-gray-200 bg-white hover:border-[#C9A84C]/50"
                }`}
              >
                {/* Time Indicator */}
                <div className={`w-20 shrink-0 flex flex-col items-center justify-center py-3 border-r ${
                  slot.isBlocked 
                    ? "border-red-200 bg-red-100/50 text-red-700" 
                    : slot.event 
                      ? "border-[#252525] bg-black text-[#C9A84C]" 
                      : "border-gray-100 bg-gray-50 text-gray-600"
                }`}>
                  <span className="font-mono font-bold text-sm">{slot.time}</span>
                  {!slot.event && !slot.isBlocked && <span className="text-[9px] uppercase mt-0.5 tracking-wider text-gray-400 font-mono">Livre</span>}
                </div>

                {/* Content Area */}
                <div className="flex-1 p-3.5 flex items-center justify-between gap-3">
                  {slot.isBlocked ? (
                    <div className="flex items-center gap-2 text-red-600 font-sans font-medium text-xs">
                      <Lock className="w-4 h-4" /> Horário Bloqueado pela Médica
                    </div>
                  ) : slot.event ? (
                    <div className="flex justify-between items-center w-full flex-wrap gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold font-sans text-sm text-white">
                            {slot.event.pacienteNome || "Paciente Agendado"}
                          </span>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold font-mono uppercase bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30">
                            {slot.event.tipo}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 font-sans">{slot.event.diagnosticoResumo}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right mr-3 hidden sm:block">
                          <span className="block text-[9px] text-neutral-400 uppercase font-bold font-mono tracking-wider">Duração</span>
                          <span className="text-xs font-mono text-[#C9A84C] flex items-center gap-1"><Clock className="w-3 h-3"/> {slot.event.duracaoMinutos || 45} min</span>
                        </div>
                        
                        <button 
                          onClick={() => onViewPaciente(slot.event!.pacienteId)}
                          className="bg-white/10 hover:bg-white text-white hover:text-black font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase font-mono tracking-wider transition cursor-pointer border border-white/20"
                        >
                          Prontuário
                        </button>
                        
                        <button 
                          onClick={() => onOpenNovaConsulta(slot.event!.pacienteId)}
                          className="bg-[#C9A84C] hover:bg-[#D9B85C] text-black font-bold px-3.5 py-1.5 rounded-lg text-[10px] uppercase font-mono tracking-wider transition cursor-pointer flex items-center gap-1 shadow"
                        >
                          <Stethoscope className="w-3 h-3" /> Atender
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs text-gray-400 font-sans italic">Horário disponível na agenda.</span>
                      <button 
                        onClick={() => handleOpenScheduleModal(slot.time)}
                        className="flex items-center gap-1 text-[10px] uppercase font-mono font-bold text-[#C9A84C] hover:text-black bg-[#C9A84C]/10 hover:bg-[#C9A84C] px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Agendar Consulta
                      </button>
                    </div>
                  )}
                </div>

                {/* Block/Unblock Toggle */}
                {!slot.event && (
                  <button 
                    onClick={() => handleBlockSlot(slot.time)}
                    className={`w-11 shrink-0 flex items-center justify-center border-l transition-colors cursor-pointer ${
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
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white text-[#0A0A0A] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fadeIn border border-[#C9A84C]/40 font-sans">
            
            <div className="bg-[#0A0A0A] text-white p-4 px-6 flex justify-between items-center border-b border-[#252525]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                <span className="font-mono text-xs uppercase tracking-wider text-[#C9A84C] font-bold">Novo Agendamento Capilar • Dra. Mariah Zibetti</span>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-white transition p-1 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs uppercase text-gray-500 font-mono font-bold block">Selecione o Paciente</label>
                {pacientes.length > 0 ? (
                  <select 
                    value={selectedPacienteId} 
                    onChange={(e) => setSelectedPacienteId(e.target.value)} 
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-sm text-[#0A0A0A] p-3 rounded-xl outline-none"
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
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-sm text-[#0A0A0A] p-3 rounded-xl outline-none" 
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase text-gray-500 font-mono font-bold block">Unidade / Modalidade</label>
                  <select 
                    value={tipoAtendimento} 
                    onChange={(e) => setTipoAtendimento(e.target.value as any)} 
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-xs text-[#0A0A0A] p-3 rounded-xl outline-none"
                  >
                    <option value="Presencial - Toledo">📍 Unidade Toledo</option>
                    <option value="Presencial - Fátima do Sul">📍 Unidade Fátima do Sul</option>
                    <option value="Online">💻 Telemedicina (Online)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase text-gray-500 font-mono font-bold block">Procedimento / Motivo</label>
                  <select 
                    value={procedimentoTag} 
                    onChange={(e) => setProcedimentoTag(e.target.value)} 
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-xs text-[#0A0A0A] p-3 rounded-xl outline-none"
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
                <div className="space-y-1">
                  <label className="text-xs uppercase text-gray-500 font-mono font-bold block">Horário da Consulta</label>
                  <input 
                    type="time" 
                    value={targetTime} 
                    onChange={(e) => setTargetTime(e.target.value)} 
                    required 
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-sm text-[#0A0A0A] p-3 rounded-xl outline-none font-mono" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase text-gray-500 font-mono font-bold block">Duração Estimada</label>
                  <select 
                    value={duracaoMinutos} 
                    onChange={(e) => setDuracaoMinutos(Number(e.target.value))} 
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-sm text-[#0A0A0A] p-3 rounded-xl outline-none font-mono"
                  >
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos (1 hora)</option>
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
