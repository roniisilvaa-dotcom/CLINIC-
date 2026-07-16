import React, { useState, useEffect, useMemo } from "react";
import {
  FileBarChart,
  Download,
  DollarSign,
  Users,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
  Stethoscope,
  CalendarDays,
  Receipt,
  UserPlus,
} from "lucide-react";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  format,
  isWithinInterval,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Paciente } from "../types";

interface RelatoriosProps {
  pacientes: Paciente[];
}

interface Transacao {
  id: string;
  pacienteNome: string;
  pacienteId: string;
  data: string;
  descricao: string;
  valor: number;
  metodo: string;
  status: string;
  unidade: string;
}

type Periodo = "dia" | "semana" | "mes";
type AbaRelatorio = "financeiro" | "atendimentos" | "paciente";

const CORES_MARCA = { preto: [10, 10, 10] as [number, number, number], dourado: [201, 168, 76] as [number, number, number] };

function parseDataSegura(str: string): Date | null {
  if (!str) return null;
  try {
    return str.length <= 10 ? parseISO(`${str}T12:00:00`) : parseISO(str);
  } catch {
    return null;
  }
}

export default function Relatorios({ pacientes }: RelatoriosProps) {
  const [aba, setAba] = useState<AbaRelatorio>("financeiro");
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [dataRef, setDataRef] = useState(new Date());
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPacienteId, setSelectedPacienteId] = useState("");
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/transacoes");
        if (res.ok) setTransacoes(await res.json());
      } catch (err) {
        console.error("Erro ao carregar transações para relatório:", err);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  const { from, to, label } = useMemo(() => {
    if (periodo === "dia") {
      return {
        from: startOfDay(dataRef),
        to: endOfDay(dataRef),
        label: format(dataRef, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
      };
    }
    if (periodo === "semana") {
      const ini = startOfWeek(dataRef, { weekStartsOn: 1 });
      const fim = endOfWeek(dataRef, { weekStartsOn: 1 });
      return { from: ini, to: fim, label: `${format(ini, "dd/MM")} — ${format(fim, "dd/MM/yyyy")}` };
    }
    const ini = startOfMonth(dataRef);
    const fim = endOfMonth(dataRef);
    return { from: ini, to: fim, label: format(dataRef, "MMMM 'de' yyyy", { locale: ptBR }) };
  }, [periodo, dataRef]);

  const navegarPeriodo = (direcao: 1 | -1) => {
    if (periodo === "dia") setDataRef((prev) => (direcao === 1 ? addDays(prev, 1) : subDays(prev, 1)));
    else if (periodo === "semana") setDataRef((prev) => (direcao === 1 ? addWeeks(prev, 1) : subWeeks(prev, 1)));
    else setDataRef((prev) => (direcao === 1 ? addMonths(prev, 1) : subMonths(prev, 1)));
  };

  const dentroDoPeriodo = (dataStr: string) => {
    const d = parseDataSegura(dataStr);
    if (!d) return false;
    return isWithinInterval(d, { start: from, end: to });
  };

  // ── Financeiro ──
  const transacoesPeriodo = useMemo(
    () => transacoes.filter((tx) => dentroDoPeriodo(tx.data)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transacoes, from, to]
  );
  const totalRecebido = transacoesPeriodo.filter((t) => t.status === "Pago").reduce((a, t) => a + t.valor, 0);
  const totalPendente = transacoesPeriodo.filter((t) => t.status === "Pendente").reduce((a, t) => a + t.valor, 0);
  const porMetodo = useMemo(() => {
    const map: Record<string, number> = {};
    transacoesPeriodo
      .filter((t) => t.status === "Pago")
      .forEach((t) => {
        map[t.metodo] = (map[t.metodo] || 0) + t.valor;
      });
    return map;
  }, [transacoesPeriodo]);

  // ── Atendimentos ──
  const atendimentosPeriodo = useMemo(() => {
    const lista: { pacienteNome: string; pacienteId: string; data: string; tipo: string; queixa: string }[] = [];
    pacientes.forEach((p) => {
      p.consultas.forEach((c) => {
        if (dentroDoPeriodo(c.data)) {
          lista.push({ pacienteNome: p.nome, pacienteId: p.id, data: c.data, tipo: c.tipo, queixa: c.queixa });
        }
      });
    });
    return lista.sort((a, b) => a.data.localeCompare(b.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacientes, from, to]);

  const porTipoAtendimento = useMemo(() => {
    const map: Record<string, number> = {};
    atendimentosPeriodo.forEach((a) => {
      map[a.tipo] = (map[a.tipo] || 0) + 1;
    });
    return map;
  }, [atendimentosPeriodo]);

  const pacientesNovosPeriodo = useMemo(() => {
    return pacientes.filter((p) => {
      if (p.consultas.length === 0) return false;
      const primeira = [...p.consultas].sort((a, b) => a.data.localeCompare(b.data))[0];
      return dentroDoPeriodo(primeira.data);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }).length;
  }, [pacientes, from, to]);

  // ── Por Paciente ──
  const pacienteSelecionado = pacientes.find((p) => p.id === selectedPacienteId) || null;
  const consultasPacienteOrdenadas = useMemo(() => {
    if (!pacienteSelecionado) return [];
    return [...pacienteSelecionado.consultas].sort((a, b) => b.data.localeCompare(a.data));
  }, [pacienteSelecionado]);

  // ── Exportação PDF ──
  const exportarPDF = () => {
    setExportando(true);
    try {
      const doc = new jsPDF();
      doc.setFont("times", "bold");
      doc.setFontSize(17);
      doc.setTextColor(...CORES_MARCA.preto);
      doc.text("CA.RO Clinic", 14, 18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(160, 130, 60);
      doc.text("PRECISION HAIR MEDICINE — RELATÓRIO", 14, 24);
      doc.setDrawColor(...CORES_MARCA.dourado);
      doc.line(14, 27, 196, 27);

      if (aba === "financeiro") {
        doc.setFontSize(12);
        doc.setTextColor(...CORES_MARCA.preto);
        doc.text(`Relatório Financeiro`, 14, 36);
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(`Período: ${label}`, 14, 42);
        doc.setTextColor(30, 30, 30);
        doc.text(
          `Recebido: R$ ${totalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}    |    Pendente: R$ ${totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}    |    Lançamentos: ${transacoesPeriodo.length}`,
          14,
          48
        );
        (doc as any).autoTable({
          startY: 54,
          head: [["Paciente", "Data", "Descrição", "Forma", "Status", "Valor (R$)"]],
          body: transacoesPeriodo.map((t) => [
            t.pacienteNome,
            t.data,
            t.descricao,
            t.metodo,
            t.status,
            t.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
          ]),
          styles: { fontSize: 8, cellPadding: 2.5 },
          headStyles: { fillColor: CORES_MARCA.preto, textColor: CORES_MARCA.dourado },
          alternateRowStyles: { fillColor: [250, 248, 243] },
        });
      } else if (aba === "atendimentos") {
        doc.setFontSize(12);
        doc.setTextColor(...CORES_MARCA.preto);
        doc.text(`Relatório de Atendimentos`, 14, 36);
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(`Período: ${label}`, 14, 42);
        doc.setTextColor(30, 30, 30);
        doc.text(
          `Total de consultas: ${atendimentosPeriodo.length}    |    Pacientes novos no período: ${pacientesNovosPeriodo}`,
          14,
          48
        );
        (doc as any).autoTable({
          startY: 54,
          head: [["Paciente", "Data", "Tipo", "Queixa"]],
          body: atendimentosPeriodo.map((a) => [a.pacienteNome, a.data, a.tipo, a.queixa]),
          styles: { fontSize: 8, cellPadding: 2.5 },
          headStyles: { fillColor: CORES_MARCA.preto, textColor: CORES_MARCA.dourado },
          alternateRowStyles: { fillColor: [250, 248, 243] },
        });
      } else if (aba === "paciente" && pacienteSelecionado) {
        doc.setFontSize(12);
        doc.setTextColor(...CORES_MARCA.preto);
        doc.text(`Relatório Clínico Individual`, 14, 36);
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        doc.text(pacienteSelecionado.nome, 14, 43);
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Diagnóstico: ${pacienteSelecionado.diagnostico?.principal || "—"}    |    Status: ${pacienteSelecionado.status}    |    Progresso: ${pacienteSelecionado.progresso}%`,
          14,
          49
        );
        (doc as any).autoTable({
          startY: 55,
          head: [["Data", "Tipo", "Queixa", "Evolução"]],
          body: consultasPacienteOrdenadas.map((c) => [c.data, c.tipo, c.queixa, c.evolucao]),
          styles: { fontSize: 8, cellPadding: 2.5 },
          headStyles: { fillColor: CORES_MARCA.preto, textColor: CORES_MARCA.dourado },
          alternateRowStyles: { fillColor: [250, 248, 243] },
        });
      }

      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(180, 180, 180);
        doc.text(
          `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")} — CA.RO Clinic IA`,
          14,
          290
        );
      }

      const sufixo = aba === "paciente" ? (pacienteSelecionado?.nome || "paciente").replace(/\s+/g, "-").toLowerCase() : aba;
      doc.save(`relatorio-caroclinic-${sufixo}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } finally {
      setExportando(false);
    }
  };

  const podeExportar = aba !== "paciente" || Boolean(pacienteSelecionado);

  const AbaBtn = ({ id, label: lbl, icon: Icon }: { id: AbaRelatorio; label: string; icon: React.ElementType }) => (
    <button
      onClick={() => setAba(id)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wide transition cursor-pointer ${
        aba === id ? "bg-[#0A0A0A] text-[#C9A84C]" : "bg-white border border-[#E5E5E5] text-gray-500 hover:text-black"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {lbl}
    </button>
  );

  return (
    <div id="relatorios_view_container" className="space-y-8 animate-fadeIn text-[#0A0A0A]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#0A0A0A]/5 pb-6">
        <div>
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl font-normal text-[#0A0A0A] tracking-tight flex items-center gap-2.5">
            <FileBarChart className="w-7 h-7 text-[#C9A84C]" />
            Relatórios
          </h2>
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-1 font-semibold">
            Financeiro, atendimentos e histórico clínico por período
          </p>
        </div>
        <button
          onClick={exportarPDF}
          disabled={!podeExportar || exportando}
          className="bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black font-semibold text-xs font-mono uppercase px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {exportando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>Exportar PDF</span>
        </button>
      </div>

      {/* Abas */}
      <div className="flex flex-wrap gap-2">
        <AbaBtn id="financeiro" label="Financeiro" icon={DollarSign} />
        <AbaBtn id="atendimentos" label="Atendimentos" icon={Stethoscope} />
        <AbaBtn id="paciente" label="Por Paciente" icon={User} />
      </div>

      {/* Seletor de período (Financeiro / Atendimentos) */}
      {aba !== "paciente" && (
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg p-1">
            {(["dia", "semana", "mes"] as Periodo[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-mono font-bold uppercase tracking-wide cursor-pointer transition ${
                  periodo === p ? "bg-[#0A0A0A] text-[#C9A84C]" : "text-gray-500 hover:text-black"
                }`}
              >
                {p === "dia" ? "Dia" : p === "semana" ? "Semana" : "Mês"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navegarPeriodo(-1)}
              className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:text-black hover:border-gray-400 cursor-pointer transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-gray-700 min-w-[180px] justify-center">
              <CalendarDays className="w-3.5 h-3.5 text-[#C9A84C]" />
              <span className="capitalize">{label}</span>
            </div>
            <button
              onClick={() => navegarPeriodo(1)}
              className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:text-black hover:border-gray-400 cursor-pointer transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Seletor de paciente */}
      {aba === "paciente" && (
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-4 shadow-sm">
          <label className="text-[10px] text-gray-450 uppercase font-mono font-bold block mb-1.5">Selecione o Paciente</label>
          <select
            value={selectedPacienteId}
            onChange={(e) => setSelectedPacienteId(e.target.value)}
            className="w-full max-w-md bg-white border border-gray-250 rounded-lg py-2 px-3 text-xs outline-none focus:border-[#C9A84C]"
          >
            <option value="">Selecione...</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} ({p.cidade})
              </option>
            ))}
          </select>
        </div>
      )}

      {loading && aba !== "paciente" ? (
        <div className="py-16 text-center space-y-3 border border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
          <p className="text-gray-500 font-serif text-lg">Carregando dados...</p>
        </div>
      ) : (
        <>
          {/* ── Financeiro ── */}
          {aba === "financeiro" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-5 border-l-4 border-emerald-500 border-y border-r border-[#E5E5E5] shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">Recebido no Período</span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-2xl font-serif text-[#0A0A0A] font-light block mt-2">
                    R$ {totalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-white p-5 border-l-4 border-amber-500 border-y border-r border-[#E5E5E5] shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">Pendente no Período</span>
                    <Receipt className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-2xl font-serif text-[#0A0A0A] font-light block mt-2">
                    R$ {totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-white p-5 border-l-4 border-[#0A0A0A] border-y border-r border-[#E5E5E5] shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">Lançamentos</span>
                    <DollarSign className="w-4 h-4 text-[#C9A84C]" />
                  </div>
                  <span className="text-2xl font-serif text-[#0A0A0A] font-light block mt-2">{transacoesPeriodo.length}</span>
                </div>
              </div>

              {Object.keys(porMetodo).length > 0 && (
                <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 shadow-sm">
                  <h3 style={{ fontFamily: "Georgia, serif" }} className="text-sm font-bold text-[#0A0A0A] mb-3">
                    Recebido por Forma de Pagamento
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(porMetodo).map(([metodo, valor]) => (
                      <div key={metodo} className="bg-[#F5F0E8]/30 border border-[#C9A84C]/25 rounded-lg px-3.5 py-2 text-xs">
                        <span className="text-gray-500 font-mono uppercase text-[10px]">{metodo}</span>
                        <span className="block font-serif font-bold text-[#0A0A0A]">
                          R$ {valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-450 font-mono text-[9px] uppercase tracking-wider font-bold border-b border-gray-200">
                        <th className="py-3 px-5">Paciente</th>
                        <th className="py-3 px-5">Data</th>
                        <th className="py-3 px-5">Descrição</th>
                        <th className="py-3 px-5">Forma</th>
                        <th className="py-3 px-5">Status</th>
                        <th className="py-3 px-5">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {transacoesPeriodo.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-450 italic font-mono bg-white">
                            Nenhum lançamento financeiro nesse período.
                          </td>
                        </tr>
                      ) : (
                        transacoesPeriodo.map((tx) => (
                          <tr key={tx.id} className="bg-white hover:bg-gray-50/50 transition">
                            <td className="py-3 px-5 font-semibold text-gray-900">{tx.pacienteNome}</td>
                            <td className="py-3 px-5 font-mono text-gray-500 whitespace-nowrap">{tx.data}</td>
                            <td className="py-3 px-5 text-gray-700">{tx.descricao}</td>
                            <td className="py-3 px-5 text-gray-600">{tx.metodo}</td>
                            <td className="py-3 px-5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                                  tx.status === "Pago" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {tx.status}
                              </span>
                            </td>
                            <td className="py-3 px-5 font-mono font-bold text-gray-900 whitespace-nowrap">
                              R$ {tx.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Atendimentos ── */}
          {aba === "atendimentos" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-5 border-l-4 border-[#C9A84C] border-y border-r border-[#E5E5E5] shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">Consultas no Período</span>
                    <Stethoscope className="w-4 h-4 text-[#C9A84C]" />
                  </div>
                  <span className="text-2xl font-serif text-[#0A0A0A] font-light block mt-2">{atendimentosPeriodo.length}</span>
                </div>
                <div className="bg-white p-5 border-l-4 border-emerald-500 border-y border-r border-[#E5E5E5] shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">Pacientes Novos</span>
                    <UserPlus className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-2xl font-serif text-[#0A0A0A] font-light block mt-2">{pacientesNovosPeriodo}</span>
                </div>
                <div className="bg-white p-5 border-l-4 border-[#0A0A0A] border-y border-r border-[#E5E5E5] shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">Pacientes na Base</span>
                    <Users className="w-4 h-4 text-gray-700" />
                  </div>
                  <span className="text-2xl font-serif text-[#0A0A0A] font-light block mt-2">{pacientes.length}</span>
                </div>
              </div>

              {Object.keys(porTipoAtendimento).length > 0 && (
                <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 shadow-sm">
                  <h3 style={{ fontFamily: "Georgia, serif" }} className="text-sm font-bold text-[#0A0A0A] mb-3">
                    Consultas por Tipo
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(porTipoAtendimento).map(([tipo, qtd]) => (
                      <div key={tipo} className="bg-[#F5F0E8]/30 border border-[#C9A84C]/25 rounded-lg px-3.5 py-2 text-xs">
                        <span className="text-gray-500 font-mono uppercase text-[10px]">{tipo}</span>
                        <span className="block font-serif font-bold text-[#0A0A0A]">{qtd}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-450 font-mono text-[9px] uppercase tracking-wider font-bold border-b border-gray-200">
                        <th className="py-3 px-5">Paciente</th>
                        <th className="py-3 px-5">Data</th>
                        <th className="py-3 px-5">Tipo</th>
                        <th className="py-3 px-5">Queixa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {atendimentosPeriodo.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-gray-450 italic font-mono bg-white">
                            Nenhum atendimento registrado nesse período.
                          </td>
                        </tr>
                      ) : (
                        atendimentosPeriodo.map((a, idx) => (
                          <tr key={`${a.pacienteId}-${idx}`} className="bg-white hover:bg-gray-50/50 transition">
                            <td className="py-3 px-5 font-semibold text-gray-900">{a.pacienteNome}</td>
                            <td className="py-3 px-5 font-mono text-gray-500 whitespace-nowrap">{a.data}</td>
                            <td className="py-3 px-5 text-gray-600">{a.tipo}</td>
                            <td className="py-3 px-5 text-gray-700">{a.queixa}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Por Paciente ── */}
          {aba === "paciente" && (
            <div className="animate-fadeIn">
              {!pacienteSelecionado ? (
                <div className="py-16 text-center border border-dashed border-gray-300 rounded-xl bg-gray-50 text-gray-450 italic font-mono">
                  Selecione um paciente acima para ver o histórico clínico completo.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#0A0A0A]">
                        {pacienteSelecionado.nome}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {pacienteSelecionado.diagnostico?.principal || "Sem diagnóstico registrado"} · {pacienteSelecionado.cidade}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-[#F5F0E8]/40 text-[#0A0A0A] border border-[#C9A84C]/25">
                        {pacienteSelecionado.status}
                      </span>
                      <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-gray-100 text-gray-600">
                        {pacienteSelecionado.progresso}% progresso
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100">
                      <h4 className="text-xs font-mono font-bold uppercase text-gray-500">
                        Histórico de Consultas ({consultasPacienteOrdenadas.length})
                      </h4>
                    </div>
                    <div className="overflow-x-auto text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-100 text-gray-450 font-mono text-[9px] uppercase tracking-wider font-bold border-b border-gray-200">
                            <th className="py-3 px-5">Data</th>
                            <th className="py-3 px-5">Tipo</th>
                            <th className="py-3 px-5">Queixa</th>
                            <th className="py-3 px-5">Evolução</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150">
                          {consultasPacienteOrdenadas.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-12 text-center text-gray-450 italic font-mono bg-white">
                                Nenhuma consulta registrada para este paciente.
                              </td>
                            </tr>
                          ) : (
                            consultasPacienteOrdenadas.map((c) => (
                              <tr key={c.id} className="bg-white hover:bg-gray-50/50 transition align-top">
                                <td className="py-3 px-5 font-mono text-gray-500 whitespace-nowrap">{c.data}</td>
                                <td className="py-3 px-5 text-gray-600">{c.tipo}</td>
                                <td className="py-3 px-5 text-gray-700">{c.queixa}</td>
                                <td className="py-3 px-5 text-gray-700">{c.evolucao}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
