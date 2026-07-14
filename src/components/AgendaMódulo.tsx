import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar as CalendarIcon,
  MapPin,
  User,
  Video,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { EventoAgenda, Paciente } from "../types";

interface AgendaModuloProps {
  agendaHoje: EventoAgenda[];
  pacientes: Paciente[];
  onViewPaciente: (pacienteId: string) => void;
  onOpenNovaConsulta: (pacienteId: string) => void;
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function AgendaModulo({
  agendaHoje,
  pacientes,
  onViewPaciente,
  onOpenNovaConsulta
}: AgendaModuloProps) {

  const hoje = new Date();
  const [activeUnit, setActiveUnit] = useState<"all" | "Toledo" | "Fátima do Sul" | "Online">("all");
  const [viewMonth, setViewMonth] = useState(hoje.getMonth());
  const [viewYear, setViewYear] = useState(hoje.getFullYear());
  const [selectedDate, setSelectedDate] = useState(toISODate(hoje));

  // Datas (YYYY-MM-DD) que têm pelo menos um evento agendado — usado pra desenhar
  // o pontinho no calendário.
  const datasComEventos = useMemo(() => {
    const set = new Set<string>();
    agendaHoje.forEach(ev => set.add(ev.data));
    return set;
  }, [agendaHoje]);

  // Monta a grade do mês com o deslocamento correto de dia da semana
  // (segunda como primeiro dia) e o total real de dias do mês.
  const calendarCells = useMemo(() => {
    const primeiroDoMes = new Date(viewYear, viewMonth, 1);
    const diasNoMes = new Date(viewYear, viewMonth + 1, 0).getDate();
    // getDay(): 0=domingo..6=sábado. Convertendo pra semana começando na segunda.
    const offset = (primeiroDoMes.getDay() + 6) % 7;
    const cells: { num: number | null; iso: string | null }[] = [];
    for (let i = 0; i < offset; i++) cells.push({ num: null, iso: null });
    for (let d = 1; d <= diasNoMes; d++) {
      const dt = new Date(viewYear, viewMonth, d);
      cells.push({ num: d, iso: toISODate(dt) });
    }
    while (cells.length % 7 !== 0) cells.push({ num: null, iso: null });
    return cells;
  }, [viewMonth, viewYear]);

  const irParaMesAnterior = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const irParaProximoMes = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };
  const irParaHoje = () => {
    setViewMonth(hoje.getMonth());
    setViewYear(hoje.getFullYear());
    setSelectedDate(toISODate(hoje));
  };

  const filteredEvents = agendaHoje
    .filter(evt => evt.data === selectedDate)
    .filter(evt => {
      if (activeUnit === "all") return true;
      if (activeUnit === "Online") return evt.tipo === "Online";
      return evt.tipo.includes(activeUnit);
    })
    .sort((a, b) => a.horario.localeCompare(b.horario));

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

  const nomeSelecionado = new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long"
  });

  return (
    <div id="agenda_module_container" className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#0A0A0A]/5 pb-6">
        <div>
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0A0A0A] font-normal flex items-center gap-2">
            Agenda <Sparkles className="w-6 h-6 text-[#C9A84C]" />
          </h2>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1.5 font-sans">
            Toledo &amp; Fátima do Sul · {agendaHoje.length} agendamentos no total
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

        {/* Left Column: Calendar */}
        <div className="lg:col-span-2 space-y-6">

          <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center bg-[#F5F0E8]/50 p-3 rounded-lg border border-[#C9A84C]/20">
              <div className="flex items-center gap-2">
                <button onClick={irParaMesAnterior} className="p-1.5 hover:bg-white rounded-md transition cursor-pointer">
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span style={{ fontFamily: "Georgia, serif" }} className="font-semibold text-gray-800 text-lg w-44 text-center">
                  {MESES[viewMonth]}, {viewYear}
                </span>
                <button onClick={irParaProximoMes} className="p-1.5 hover:bg-white rounded-md transition cursor-pointer">
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <button
                onClick={irParaHoje}
                className="bg-[#C9A84C] text-black text-xs px-3 py-1.5 rounded-full font-semibold uppercase hover:bg-[#b0913f] transition cursor-pointer"
              >
                Hoje
              </button>
            </div>

            {/* Calendar grid titles */}
            <div className="grid grid-cols-7 text-center text-xs font-mono text-gray-400 font-bold border-b border-gray-100 pb-2">
              <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarCells.map((cell, i) => {
                if (cell.num === null) {
                  return <div key={i} className="rounded-lg bg-transparent" />;
                }
                const isSelected = cell.iso === selectedDate;
                const isHoje = cell.iso === toISODate(hoje);
                const hasAppointments = cell.iso ? datasComEventos.has(cell.iso) : false;
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDate(cell.iso!)}
                    className={`rounded-lg flex flex-col justify-between p-1.5 h-16 transition cursor-pointer select-none text-[11px] relative border ${
                      isSelected
                        ? "bg-[#C9A84C]/20 border-[#C9A84C] text-[#C9A84C] font-semibold"
                        : isHoje
                        ? "bg-[#0A0A0A]/5 border-[#0A0A0A]/20 text-gray-800 font-semibold"
                        : "bg-white border-gray-100 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <span className="font-semibold">{cell.num}</span>
                    {hasAppointments && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] mx-auto mb-1" title="Consultas agendadas" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Events List */}
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-5 min-h-[500px]">
            <div className="flex justify-between items-center mb-6">
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#0A0A0A] capitalize">
                {nomeSelecionado}
              </h3>
              <button className="bg-[#0A0A0A] text-white p-2 rounded-full hover:bg-[#333] transition cursor-pointer">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="text-center py-10">
                <CalendarIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-medium">Nenhum agendamento para este dia.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredEvents.map(evt => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={evt.id}
                      className="group border border-gray-100 rounded-xl p-4 hover:border-[#C9A84C]/50 hover:shadow-sm transition-all bg-white relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C9A84C]/20 group-hover:bg-[#C9A84C] transition-colors" />

                      <div className="flex justify-between items-start pl-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-gray-900">{evt.horario}</span>
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

                          {evt.diagnosticoResumo && (
                            <p className="text-xs text-gray-600 mt-2 line-clamp-1 border-t border-gray-50 pt-2">
                              <span className="font-semibold text-gray-400 mr-1">Motivo:</span>
                              {evt.diagnosticoResumo}
                            </p>
                          )}
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
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
