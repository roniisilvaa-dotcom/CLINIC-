import React, { useState } from "react";
import { motion } from "motion/react";
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
  Plus
} from "lucide-react";
import { EventoAgenda, Paciente } from "../types";

interface AgendaModuloProps {
  agendaHoje: EventoAgenda[];
  pacientes: Paciente[];
  onViewPaciente: (pacienteId: string) => void;
  onOpenNovaConsulta: (pacienteId: string) => void;
}

// Representação de um Slot de Tempo
interface TimeSlot {
  time: string; // "08:00"
  event?: EventoAgenda;
  isBlocked?: boolean;
}

export default function AgendaModulo({ 
  agendaHoje, 
  pacientes, 
  onViewPaciente,
  onOpenNovaConsulta 
}: AgendaModuloProps) {

  const [activeUnit, setActiveUnit] = useState<"all" | "Toledo" | "Fátima do Sul" | "Online">("all");
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  
  // Custom blocked slots mapping (Date -> Time[] )
  const [blockedSlots, setBlockedSlots] = useState<Record<string, string[]>>({});
  const [agendaDoDia, setAgendaDoDia] = useState<EventoAgenda[]>([]);

  const formattedDateKey = selectedDate.toISOString().split("T")[0];

  React.useEffect(() => {
    fetch("/api/agenda?date=" + formattedDateKey)
      .then(r => r.json())
      .then(data => setAgendaDoDia(data || []))
      .catch(console.error);
  }, [formattedDateKey]);

  const handleBlockSlot = (time: string) => {
    setBlockedSlots(prev => {
      const todayBlocks = prev[formattedDateKey] || [];
      if (todayBlocks.includes(time)) {
        return { ...prev, [formattedDateKey]: todayBlocks.filter(t => t !== time) };
      }
      return { ...prev, [formattedDateKey]: [...todayBlocks, time] };
    });
  };

  // Generate Slots from 08:00 to 18:00 (every 30 mins)
  const generateSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const todayBlocks = blockedSlots[formattedDateKey] || [];
    
    for (let h = 8; h <= 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === 18 && m === 30) continue; // Ends at 18:00
        
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        // Find if there's an event for this time
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

  const getStatusBadgeStyles = (status: EventoAgenda["status"]) => {
    switch (status) {
      case "Confirmada":
        return "bg-green-50 text-green-700 border border-green-200/50";
      case "Pendente":
        return "bg-amber-50 text-amber-700 border border-amber-200/50";
      case "Cancelada":
        return "bg-red-50 text-red-700 border border-red-200/50";
      case "Realizada":
        return "bg-gray-100 text-gray-600 border border-gray-200";
    }
  };

  return (
    <div id="agenda_module_container" className="space-y-6 h-full flex flex-col">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#0A0A0A]/5 pb-6 shrink-0">
        <div>
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0A0A0A] font-normal flex items-center gap-2">
            Agenda Completa <CalendarIcon className="w-6 h-6 text-[#C9A84C]" />
          </h2>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1.5 font-sans">
            Visão diária em grade de horários
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-gray-200 shadow-sm text-xs font-mono font-bold uppercase tracking-wide">
          <button onClick={() => setActiveUnit("all")} className={`px-4 py-2 rounded transition ${activeUnit === "all" ? "bg-[#0A0A0A] text-white" : "text-gray-500 hover:bg-gray-50"}`}>Tudo</button>
          <button onClick={() => setActiveUnit("Toledo")} className={`px-4 py-2 rounded transition ${activeUnit === "Toledo" ? "bg-[#0A0A0A] text-white" : "text-gray-500 hover:bg-gray-50"}`}>Toledo</button>
          <button onClick={() => setActiveUnit("Fátima do Sul")} className={`px-4 py-2 rounded transition ${activeUnit === "Fátima do Sul" ? "bg-[#0A0A0A] text-white" : "text-gray-500 hover:bg-gray-50"}`}>Fátima do Sul</button>
          <button onClick={() => setActiveUnit("Online")} className={`px-4 py-2 rounded transition ${activeUnit === "Online" ? "bg-[#0A0A0A] text-white" : "text-gray-500 hover:bg-gray-50"}`}>Telemedicina</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* Left Side: Calendar Navigator */}
        <div className="lg:w-72 shrink-0 space-y-4">
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-gray-800 text-sm">
                {selectedDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).toUpperCase()}
              </span>
              <div className="flex gap-1">
                <button onClick={handlePrevDay} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronLeft className="w-4 h-4"/></button>
                <button onClick={handleToday} className="text-[10px] font-mono font-bold px-2 hover:bg-gray-100 rounded">HOJE</button>
                <button onClick={handleNextDay} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronRight className="w-4 h-4"/></button>
              </div>
            </div>

            <div className="text-center py-6 bg-gray-50 border border-gray-100 rounded-lg">
              <span className="block text-4xl font-serif text-[#C9A84C]">{selectedDate.getDate()}</span>
              <span className="block text-xs uppercase font-mono font-bold text-gray-400 mt-1">
                {selectedDate.toLocaleDateString("pt-BR", { weekday: "long" })}
              </span>
            </div>
            
            <div className="mt-6 border-t border-gray-100 pt-4 space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Legenda da Grade</span>
              <div className="flex items-center gap-2 text-xs text-gray-600 font-sans"><div className="w-3 h-3 rounded bg-white border border-gray-200"></div> Horário Livre</div>
              <div className="flex items-center gap-2 text-xs text-gray-600 font-sans"><div className="w-3 h-3 rounded bg-neutral-900 border border-neutral-800"></div> Consulta Marcada</div>
              <div className="flex items-center gap-2 text-xs text-gray-600 font-sans"><div className="w-3 h-3 rounded bg-red-50 border border-red-200"></div> Bloqueado pela Médica</div>
            </div>
          </div>
        </div>

        {/* Right Side: Hourly Grid View */}
        <div className="flex-1 bg-white border border-[#E5E5E5] rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-serif text-lg text-gray-900">Programação do Dia</h3>
            <span className="text-xs text-gray-500 font-mono">Clique no ícone 🔓 para bloquear a agenda.</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {timeSlots.map((slot, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                key={slot.time} 
                className={`flex border rounded-lg overflow-hidden transition-all group ${
                  slot.isBlocked 
                    ? "border-red-200 bg-red-50" 
                    : slot.event 
                      ? "border-neutral-800 bg-neutral-900 text-white shadow-md" 
                      : "border-gray-200 bg-white hover:border-[#C9A84C]/50"
                }`}
              >
                {/* Time Indicator */}
                <div className={`w-20 shrink-0 flex flex-col items-center justify-center py-3 border-r ${
                  slot.isBlocked ? "border-red-200 bg-red-100/50 text-red-700" : slot.event ? "border-neutral-800 bg-neutral-950 text-[#C9A84C]" : "border-gray-100 bg-gray-50 text-gray-500"
                }`}>
                  <span className="font-mono font-bold text-sm">{slot.time}</span>
                  {!slot.event && !slot.isBlocked && <span className="text-[9px] uppercase mt-1 tracking-widest text-gray-400">Livre</span>}
                </div>

                {/* Content Area */}
                <div className="flex-1 p-3 flex items-center justify-between">
                  {slot.isBlocked ? (
                    <div className="flex items-center gap-2 text-red-600 font-sans font-medium text-sm">
                      <Lock className="w-4 h-4" /> Horário Bloqueado (Indisponível)
                    </div>
                  ) : slot.event ? (
                    <div className="flex justify-between items-center w-full">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-sans text-[15px]">{slot.event.pacienteId === "paciente-1" ? "Helena Silveira de Souza" : "Paciente Agendado"}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            slot.event.tipo.includes("Online") ? "bg-blue-500/20 text-blue-300" : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                          }`}>
                            {slot.event.tipo}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400">{slot.event.diagnosticoResumo}</p>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right mr-4 hidden sm:block">
                          <span className="block text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-0.5">Duração</span>
                          <span className="text-xs font-mono text-[#C9A84C] flex items-center gap-1"><Clock className="w-3 h-3"/> {slot.event.duracaoMinutos} min</span>
                        </div>
                        <button 
                          onClick={() => onViewPaciente(slot.event!.pacienteId)}
                          className="bg-white text-black hover:bg-[#C9A84C] font-bold px-3 py-1.5 rounded text-[10px] uppercase tracking-wider transition"
                        >
                          Prontuário
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center w-full opacity-50 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm text-gray-400 font-sans italic">Nenhum paciente agendado para este horário.</span>
                      <button className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#C9A84C] hover:text-black bg-[#C9A84C]/10 hover:bg-[#C9A84C] px-3 py-1.5 rounded transition cursor-pointer">
                        <Plus className="w-3 h-3" /> Novo Agendamento
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
                        ? "border-red-200 text-red-500 hover:bg-red-100 hover:text-red-700" 
                        : "border-gray-100 text-gray-300 hover:bg-red-50 hover:text-red-500"
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

    </div>
  );
}
