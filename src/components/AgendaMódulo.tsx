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
  ShieldAlert, 
  Smile, 
  Plus, 
  TrendingUp,
  Unlock,
  Lock
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
  const [selectedDay, setSelectedDay] = useState(8); // June 8th, 2026

  // Hours blockages states
  const [locks, setLocks] = useState([
    { id: "lock-1", unidade: "Fátima do Sul", dia: "Terça-feira", horario: "Manhã", ativo: true },
    { id: "lock-2", unidade: "Toledo", dia: "Sexta-feira", horario: "Tarde", ativo: true }
  ]);

  // Calendar Days representation (June 2026 starting on Monday)
  const calendarDays = [
    { num: 1, type: "pass" }, { num: 2, type: "pass" }, { num: 3, type: "pass" }, { num: 4, type: "pass" }, { num: 5, type: "pass" }, { num: 6, type: "week" }, { num: 7, type: "week" },
    { num: 8, type: "today" }, { num: 9, type: "active" }, { num: 10, type: "active" }, { num: 11, type: "active" }, { num: 12, type: "active" }, { num: 13, type: "week" }, { num: 14, type: "week" },
    { num: 15, type: "active" }, { num: 16, type: "active" }, { num: 17, type: "active" }, { num: 18, type: "active" }, { num: 19, type: "active" }, { num: 20, type: "week" }, { num: 21, type: "week" },
    { num: 22, type: "active" }, { num: 23, type: "active" }, { num: 24, type: "active" }, { num: 25, type: "active" }, { num: 26, type: "active" }, { num: 27, type: "week" }, { num: 28, type: "week" },
    { num: 29, type: "active" }, { num: 30, type: "active" }
  ];

  // Filtering appointments according to selected filters
  const filteredEvents = agendaHoje.filter(evt => {
    if (activeUnit === "all") return true;
    if (activeUnit === "Online") return evt.tipo === "Online";
    return evt.tipo.includes(activeUnit);
  });

  // Calendar event status styling helper
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
    <div id="agenda_module_container" className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#0A0A0A]/5 pb-6">
        <div>
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0A0A0A] font-normal">Agenda e Bloqueios</h2>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1.5 font-sans">Monitore e agende horários por unidade com regras automáticas de exclusão.</p>
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
        
        {/* Left Columns: Interactive Month Grid & Blockage managers */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Month Calendar Grid Card */}
          <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center bg-[#F5F0E8]/50 p-3 rounded-lg border border-[#C9A84C]/20">
              <span style={{ fontFamily: "Georgia, serif" }} className="font-semibold text-gray-800 text-lg">Junho, 2026</span>
              <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider font-bold">Seg a Sex • 08:00 às 19:00</span>
            </div>

            {/* Calendar grid titles */}
            <div className="grid grid-cols-7 text-center text-xs font-mono text-gray-400 font-bold border-b border-gray-100 pb-2">
              <span>Seg</span>
              <span>Ter</span>
              <span>Qua</span>
              <span>Qui</span>
              <span>Sex</span>
              <span>Sáb</span>
              <span>Dom</span>
            </div>

            {/* Calendar grid numbers mapping */}
            <div className="grid grid-cols-7 gap-1.5 h-64">
              {calendarDays.map((day, i) => {
                const isSelected = selectedDay === day.num;
                const hasAppointments = day.num === 8; // June 8th represents our mock appt day
                
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
                    
                    {/* Small capillary node helper indicating active consult counts */}
                    {hasAppointments && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] mx-auto mb-1 animate-pulse" title="Consultas confirmadas" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unit Locks Section */}
          <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-base text-[#0A0A0A] font-medium flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#C9A84C]" /> Ausências e Horários Bloqueados por Unidade
              </h3>
              <button 
                onClick={() => {
                  const locksNew = [
                    ...locks,
                    { id: `lock-${Date.now()}`, unidade: "Toledo", dia: "Sábado", horario: "Manhã", ativo: true }
                  ];
                  setLocks(locksNew);
                }}
                className="text-xs text-[#C9A84C] hover:underline font-mono uppercase flex items-center gap-1 cursor-pointer font-bold"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Filtro de Bloqueio
              </button>
            </div>

            <p className="text-xs text-gray-500">Quando ativos, os bloqueios abaixo evitam agendamentos em canais online ou presenciais daquela unidade:</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 text-xs">
              {locks.map(block => (
                <div key={block.id} className="bg-gray-50 border border-gray-200 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="text-[#C9A84C] font-mono tracking-wider font-semibold block">{block.unidade}</span>
                    <span className="text-gray-600 mt-1 block">{block.dia} — {block.horario}</span>
                  </div>

                  <button
                    onClick={() => {
                      setLocks(locks.map(l => l.id === block.id ? { ...l, ativo: !l.ativo } : l));
                    }}
                    className={`p-2 rounded transition cursor-pointer flex items-center gap-1.5 ${
                      block.ativo 
                        ? "bg-red-50 border border-red-200 text-red-700 font-semibold" 
                        : "bg-white border border-gray-200 text-gray-400"
                    }`}
                  >
                    {block.ativo ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span className="font-mono uppercase text-[9px] font-bold">{block.ativo ? "Bloqueado" : "Livre"}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Scheduled Event listings */}
        <div className="space-y-6">
          
          {/* Mini productivity metrics panel */}
          <div className="bg-[#F5F0E8]/40 border border-[#C9A84C]/25 p-5 rounded-xl space-y-4">
            <h3 className="text-xs text-gray-500 uppercase tracking-widest font-mono font-bold">Resumo Mensal de Atendimento</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Total Consultas Resolvidas</span>
                <span className="font-mono font-bold text-[#0A0A0A]">54</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 font-mono">Taxa Média de Presença</span>
                <span className="text-emerald-600 font-mono font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> 92%
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Horário Médio Favorito</span>
                <span className="font-mono text-gray-800 font-medium">14:00 - Fátima do Sul</span>
              </div>
            </div>
          </div>

          {/* Core Appointment details panel */}
          <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-5 space-y-4">
            <h3 style={{ fontFamily: "Georgia, serif" }} className="text-lg font-medium text-[#0A0A0A]">Atendimentos do Dia {selectedDay}</h3>

            <div className="space-y-3">
              {filteredEvents.map(evt => (
                <div key={evt.id} className="bg-gray-50 border border-gray-200/60 rounded-lg p-4 space-y-3 hover:border-[#C9A84C]/50 transition duration-200 hover:bg-white">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-mono block font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#C9A84C]" /> {evt.horario}
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold border ${getStatusBadgeStyles(evt.status)}`}>
                      {evt.status}
                    </span>
                  </div>

                  <div>
                    <h4 
                      onClick={() => onViewPaciente(evt.pacienteId)}
                      className="text-sm font-semibold text-[#0A0A0A] hover:text-[#C9A84C] transition cursor-pointer"
                    >
                      {evt.pacienteNome}
                    </h4>
                    <span className="text-[11px] text-gray-400 font-mono truncate max-w-[200px] block mt-0.5">
                      {evt.diagnosticoResumo}
                    </span>
                  </div>

                  <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-xs text-gray-500">
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      {evt.tipo === "Online" ? <Video className="w-3.5 h-3.5 text-indigo-500" /> : <MapPin className="w-3.5 h-3.5 text-[#C9A84C]" />}
                      {evt.tipo}
                    </span>

                    <button
                      onClick={() => onOpenNovaConsulta(evt.pacienteId)}
                      className="text-[11px] uppercase font-bold text-[#C9A84C] hover:underline transition font-mono cursor-pointer"
                    >
                      Nova Consulta ›
                    </button>
                  </div>
                </div>
              ))}
              
              {filteredEvents.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6 italic font-mono">Nenhuma consulta confirmada para o canal selecionado.</p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
export {};
