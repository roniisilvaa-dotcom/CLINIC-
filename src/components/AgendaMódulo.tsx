import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  CheckCircle, 
  User, 
  Video, 
  Filter, 
  ShieldAlert, 
  Smile, 
  Plus, 
  TrendingUp,
  Unlock,
  Lock,
  Sparkles,
  Zap,
  ArrowRight,
  MessageCircle
} from "lucide-react";
import { EventoAgenda, Paciente } from "../types";

interface AgendaModuloProps {
  agendaHoje: EventoAgenda[];
  pacientes: Paciente[];
  onViewPaciente: (pacienteId: string) => void;
  onOpenNovaConsulta: (pacienteId: string) => void;
}

export default function AgendaModulo({ 
  agendaHoje, 
  pacientes, 
  onViewPaciente,
  onOpenNovaConsulta 
}: AgendaModuloProps) {

  const [activeUnit, setActiveUnit] = useState<"all" | "Toledo" | "Fátima do Sul" | "Online">("all");
  const [selectedDay, setSelectedDay] = useState(8); 

  const [showSmartSuggest, setShowSmartSuggest] = useState(false);
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [sendingWpp, setSendingWpp] = useState(false);

  const handleWhatsAppSend = async () => {
    setSendingWpp(true);
    // Simulating API call to backend WhatsApp endpoint
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSendingWpp(false);
    setWhatsappSent(true);
  };

  // Calendar Days representation
  const calendarDays = [
    { num: 1, type: "pass" }, { num: 2, type: "pass" }, { num: 3, type: "pass" }, { num: 4, type: "pass" }, { num: 5, type: "pass" }, { num: 6, type: "week" }, { num: 7, type: "week" },
    { num: 8, type: "today" }, { num: 9, type: "active" }, { num: 10, type: "active" }, { num: 11, type: "active" }, { num: 12, type: "active" }, { num: 13, type: "week" }, { num: 14, type: "week" },
    { num: 15, type: "active" }, { num: 16, type: "active" }, { num: 17, type: "active" }, { num: 18, type: "active" }, { num: 19, type: "active" }, { num: 20, type: "week" }, { num: 21, type: "week" },
    { num: 22, type: "active" }, { num: 23, type: "active" }, { num: 24, type: "active" }, { num: 25, type: "active" }, { num: 26, type: "active" }, { num: 27, type: "week" }, { num: 28, type: "week" },
    { num: 29, type: "active" }, { num: 30, type: "active" }
  ];

  // Filtering appointments
  const filteredEvents = agendaHoje.filter(evt => {
    if (activeUnit === "all") return true;
    if (activeUnit === "Online") return evt.tipo === "Online";
    return evt.tipo.includes(activeUnit);
  });

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

  const calculateDuration = (diagnosticoResumo: string) => {
    if (diagnosticoResumo.includes("Primeira Consulta")) return "60 min";
    if (diagnosticoResumo.includes("MMP") || diagnosticoResumo.includes("Laser")) return "30 min";
    return "45 min";
  };

  return (
    <div id="agenda_module_container" className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#0A0A0A]/5 pb-6">
        <div>
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0A0A0A] font-normal flex items-center gap-2">
            Agenda Inteligente <Sparkles className="w-6 h-6 text-[#C9A84C]" />
          </h2>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1.5 font-sans">
            Otimização automática de tempo e gestão de fila de espera
          </p>
        </div>

        <div className="flex bg-white border border-gray-200 shadow-sm p-1 rounded-lg">
          {[
            { id: "all", label: "Geral" },
            { id: "Toledo", label: "Toledo" },
            { id: "Fátima do Sul", label: "Fátima do Sul" },
            { id: "Online", label: "TeleConsulta" },
          ].map(unit => (
            <button
              key={unit.id}
              onClick={() => setActiveUnit(unit.id as any)}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition cursor-pointer ${
                activeUnit === unit.id 
                  ? "bg-[#C9A84C] text-black font-semibold" 
                  : "text-gray-500 hover:text-[#0A0A0A]"
              }`}
            >
              {unit.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Calendar & Waitlist */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center bg-[#F5F0E8]/50 p-3 rounded-lg border border-[#C9A84C]/20">
              <span style={{ fontFamily: "Georgia, serif" }} className="font-semibold text-gray-800 text-lg">Junho, 2026</span>
              <button 
                onClick={() => setShowSmartSuggest(!showSmartSuggest)}
                className="bg-[#C9A84C] text-black text-xs px-3 py-1.5 rounded-full font-semibold uppercase flex items-center gap-2 hover:bg-[#b0913f] transition"
              >
                <Zap className="w-4 h-4" /> Encaixe Inteligente
              </button>
            </div>

            <AnimatePresence>
              {showSmartSuggest && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 overflow-hidden"
                >
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-indigo-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-indigo-900">Sugestão de Encaixe IA Encontrada!</h4>
                      <p className="text-xs text-indigo-700 mt-1">
                        Detectamos uma vaga de <strong>30 minutos</strong> aberta às 14:00 (Cancelamento). A paciente <strong>Laura Medeiros</strong> da Fila de Espera precisa de um retorno para <em>Laser LLLT</em> que dura exatamente 30 min.
                      </p>
                      
                      <button 
                        onClick={handleWhatsAppSend}
                        disabled={whatsappSent || sendingWpp}
                        className={`mt-3 text-xs px-4 py-2 rounded shadow-sm transition flex items-center gap-1.5 ${
                          whatsappSent 
                            ? "bg-green-100 text-green-700 font-bold border border-green-200 cursor-not-allowed" 
                            : "bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                        }`}
                      >
                        {sendingWpp ? (
                          "Disparando WhatsApp VIP..."
                        ) : whatsappSent ? (
                          <><CheckCircle className="w-4 h-4" /> Encaixe Confirmado e Mensagem Enviada</>
                        ) : (
                          <><MessageCircle className="w-4 h-4" /> Confirmar Encaixe & Avisar no WhatsApp</>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Calendar grid titles */}
            <div className="grid grid-cols-7 text-center text-xs font-mono text-gray-400 font-bold border-b border-gray-100 pb-2">
              <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1.5 h-64">
              {calendarDays.map((day, i) => {
                const isSelected = selectedDay === day.num;
                const hasAppointments = day.num === 8;
                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (day.type !== "pass") setSelectedDay(day.num);
                    }}
                    className={`rounded-lg flex flex-col justify-between p-1.5 transition cursor-pointer select-none text-[11px] relative border ${
                      isSelected 
                        ? "bg-[#C9A84C]/20 border-[#C9A84C] text-[#C9A84C] font-semibold" 
                        : day.type === "pass"
                        ? "bg-gray-50 border-transparent text-gray-300 cursor-not-allowed"
                        : day.type === "week"
                        ? "bg-gray-100 border-transparent text-gray-400"
                        : "bg-white border-gray-100 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <span className="font-semibold">{day.num}</span>
                    {hasAppointments && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] mx-auto mb-1 animate-pulse" title="Consultas confirmadas" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Waitlist */}
          <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-5">
            <h3 style={{ fontFamily: "Georgia, serif" }} className="text-lg text-[#0A0A0A] font-medium flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-[#C9A84C]" /> Fila de Espera Automática
            </h3>
            <div className="space-y-3">
              {[
                { nome: "Laura Medeiros", procedimento: "Retorno Laser LLLT", tempo: "30 min", prioridade: "Alta" },
                { nome: "Julia Sanches", procedimento: "Primeira Consulta", tempo: "60 min", prioridade: "Média" }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-[#C9A84C]/40 transition">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.nome}</p>
                    <p className="text-xs text-gray-500">{item.procedimento} • Estimativa: {item.tempo}</p>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                    item.prioridade === 'Alta' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    Prioridade {item.prioridade}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Events List */}
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-5 min-h-[500px]">
            <div className="flex justify-between items-center mb-6">
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#0A0A0A]">
                Eventos do Dia {selectedDay}
              </h3>
              <button className="bg-[#0A0A0A] text-white p-2 rounded-full hover:bg-[#333] transition">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {selectedDay !== 8 ? (
              <div className="text-center py-10">
                <CalendarIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-medium">Nenhum agendamento para este dia.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map(evt => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={evt.id} 
                    className="group border border-gray-100 rounded-xl p-4 hover:border-[#C9A84C]/50 hover:shadow-sm transition-all bg-white relative overflow-hidden"
                  >
                    {/* Time indicator band */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C9A84C]/20 group-hover:bg-[#C9A84C] transition-colors" />
                    
                    <div className="flex justify-between items-start pl-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-gray-900">{evt.horario}</span>
                          <span className="text-[10px] text-gray-400 font-mono tracking-wider">
                            Duração calc.: {calculateDuration(evt.diagnosticoResumo)}
                          </span>
                        </div>
                        <h4 
                          onClick={() => onViewPaciente(evt.pacienteId)}
                          className="font-medium text-gray-800 cursor-pointer hover:text-[#C9A84C] transition"
                        >
                          {evt.pacienteNome}
                        </h4>
                        
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            {evt.tipo === "Online" ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                            {evt.tipo}
                          </span>
                        </div>
                        
                        <p className="text-xs text-gray-600 mt-2 line-clamp-1 border-t border-gray-50 pt-2">
                          <span className="font-semibold text-gray-400 mr-1">Motivo:</span> 
                          {evt.diagnosticoResumo}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full ${getStatusBadgeStyles(evt.status)}`}>
                          {evt.status}
                        </span>
                        
                        {evt.status !== "Realizada" && evt.status !== "Cancelada" && (
                          <button 
                            onClick={() => onOpenNovaConsulta(evt.pacienteId)}
                            className="text-[10px] bg-[#0A0A0A] text-white px-3 py-1.5 rounded hover:bg-[#333] transition mt-2 shadow-sm font-semibold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                          >
                            Atender <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
