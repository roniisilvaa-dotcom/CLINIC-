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
  Sparkles,
  X,
  Loader2,
  Clock,
} from "lucide-react";
import { EventoAgenda, Paciente } from "../types";

interface NovoEventoPayload {
  pacienteId: string;
  data: string;
  horario: string;
  tipo: EventoAgenda["tipo"];
  procedimentoTag: string;
  duracaoMinutos: number;
  status: EventoAgenda["status"];
  diagnosticoResumo?: string;
}

interface AgendaModuloProps {
  agendaHoje: EventoAgenda[];
  pacientes: Paciente[];
  onViewPaciente: (pacienteId: string) => void;
  onOpenNovaConsulta: (pacienteId: string) => void;
  onCreateEvento?: (dados: NovoEventoPayload) => Promise<void> | void;
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
  onOpenNovaConsulta,
  onCreateEvento
}: AgendaModuloProps) {

  const hoje = new Date();
  const [activeUnit, setActiveUnit] = useState<"all" | "Toledo" | "Fátima do Sul" | "Online">("all");
  const [viewMonth, setViewMonth] = useState(hoje.getMonth());
  const [viewYear, setViewYear] = useState(hoje.getFullYear());
  const [selectedDate, setSelectedDate] = useState(toISODate(hoje));

  // Novo agendamento (modal do botão "+")
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [salvandoEvento, setSalvandoEvento] = useState(false);
  const [formPacienteId, setFormPacienteId] = useState("");
  const [formData, setFormData] = useState(selectedDate);
  const [formHorario, setFormHorario] = useState("09:00");
  const [formTipo, setFormTipo] = useState<EventoAgenda["tipo"]>("Presencial - Toledo");
  const [formProcedimento, setFormProcedimento] = useState("");
  const [formDuracao, setFormDuracao] = useState(30);

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

  // Resumo do mês visível — deixa a agenda mais informativa de relance.
  const resumoMes = useMemo(() => {
    const doMes = agendaHoje.filter(ev => {
      const [ano, mes] = ev.data.split("-").map(Number);
      return ano === viewYear && mes === viewMonth + 1;
    });
    return {
      total: doMes.length,
      confirmadas: doMes.filter(e => e.status === "Confirmada").length,
      pendentes: doMes.filter(e => e.status === "Pendente").length,
      realizadas: doMes.filter(e => e.status === "Realizada").length,
    };
  }, [agendaHoje, viewMonth, viewYear]);

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

  const abrirNovoAgendamento = () => {
    setFormPacienteId(pacientes[0]?.id || "");
    setFormData(selectedDate);
    setFormHorario("09:00");
    setFormTipo("Presencial - Toledo");
    setFormProcedimento("");
    setFormDuracao(30);
    setShowNovoModal(true);
  };

  const salvarNovoAgendamento = async () => {
    if (!formPacienteId || !formData || !formHorario) {
      alert("Selecione o paciente, a data e o horário para criar o agendamento.");
      return;
    }
    setSalvandoEvento(true);
    try {
      await onCreateEvento?.({
        pacienteId: formPacienteId,
        data: formData,
        horario: formHorario,
        tipo: formTipo,
        procedimentoTag: formProcedimento || "Consulta",
        duracaoMinutos: formDuracao,
        status: "Pendente",
        diagnosticoResumo: formProcedimento,
      });
      setShowNovoModal(false);
    } catch (err) {
      console.error("Erro ao criar agendamento:", err);
      alert("Não foi possível criar o agendamento. Tente novamente.");
    } finally {
      setSalvandoEvento(false);
    }
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
      default:
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

        <div className="flex items-center gap-3">
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

          <button
            onClick={abrirNovoAgendamento}
            className="bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black text-xs font-mono font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> Novo Agendamento
          </button>
        </div>
      </div>

      {/* Resumo do mês — deixa a agenda mais informativa/atrativa de relance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-4">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono font-bold block">Agendamentos no Mês</span>
          <span className="text-2xl font-serif text-[#0A0A0A] block mt-1">{resumoMes.total}</span>
        </div>
        <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-4">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono font-bold block">Confirmadas</span>
          <span className="text-2xl font-serif text-green-600 block mt-1">{resumoMes.confirmadas}</span>
        </div>
        <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-4">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono font-bold block">Pendentes</span>
          <span className="text-2xl font-serif text-amber-600 block mt-1">{resumoMes.pendentes}</span>
        </div>
        <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-4">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono font-bold block">Realizadas</span>
          <span className="text-2xl font-serif text-gray-500 block mt-1">{resumoMes.realizadas}</span>
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
              <button
                onClick={abrirNovoAgendamento}
                title="Adicionar novo agendamento neste dia"
                className="bg-[#0A0A0A] text-white p-2 rounded-full hover:bg-[#C9A84C] hover:text-black transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="text-center py-10">
                <CalendarIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-medium">Nenhum agendamento para este dia.</p>
                <button
                  onClick={abrirNovoAgendamento}
                  className="mt-4 text-[11px] uppercase font-mono font-bold tracking-wider text-[#C9A84C] hover:underline cursor-pointer"
                >
                  + Adicionar agendamento
                </button>
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

      {/* Modal: Novo Agendamento */}
      <AnimatePresence>
        {showNovoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNovoModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-5"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <h3 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#0A0A0A]">Novo Agendamento</h3>
                <button onClick={() => setShowNovoModal(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-mono font-bold block mb-1.5">Paciente</label>
                  <select
                    value={formPacienteId}
                    onChange={(e) => setFormPacienteId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#C9A84C]"
                  >
                    <option value="">Selecione um paciente</option>
                    {pacientes.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-mono font-bold block mb-1.5">Data</label>
                    <input
                      type="date"
                      value={formData}
                      onChange={(e) => setFormData(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#C9A84C]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-mono font-bold block mb-1.5">Horário</label>
                    <input
                      type="time"
                      value={formHorario}
                      onChange={(e) => setFormHorario(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#C9A84C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-mono font-bold block mb-1.5">Tipo</label>
                    <select
                      value={formTipo}
                      onChange={(e) => setFormTipo(e.target.value as EventoAgenda["tipo"])}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#C9A84C]"
                    >
                      <option value="Presencial - Toledo">Presencial - Toledo</option>
                      <option value="Presencial - Fátima do Sul">Presencial - Fátima do Sul</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-mono font-bold block mb-1.5">Duração (min)</label>
                    <input
                      type="number"
                      min={15}
                      step={15}
                      value={formDuracao}
                      onChange={(e) => setFormDuracao(Number(e.target.value) || 30)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#C9A84C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-mono font-bold block mb-1.5">Motivo / Procedimento</label>
                  <input
                    type="text"
                    value={formProcedimento}
                    onChange={(e) => setFormProcedimento(e.target.value)}
                    placeholder="Ex: Consulta de retorno, avaliação inicial..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#C9A84C]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNovoModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-xs font-mono font-bold uppercase hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarNovoAgendamento}
                  disabled={salvandoEvento}
                  className="flex-1 bg-[#0A0A0A] hover:bg-[#C9A84C] disabled:opacity-60 text-white hover:text-black py-2.5 rounded-lg text-xs font-mono font-bold uppercase transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {salvandoEvento ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" /> Confirmar Agendamento
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
