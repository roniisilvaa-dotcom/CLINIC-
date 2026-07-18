import React, { useState, useEffect, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  PlusCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
  Building,
  User,
  CreditCard,
  Download,
  Percent,
  Receipt
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line
} from "recharts";
import { Paciente } from "../types";

interface FinanceiroModuloProps {
  pacientes: Paciente[];
}

interface Transacao {
  id: string;
  pacienteNome: string;
  pacienteId: string;
  data: string;
  descricao: string;
  valor: number;
  metodo: "Pix" | "Cartão" | "Boleto" | "Dinheiro";
  status: "Pago" | "Pendente" | "Cancelado";
  unidade: "Toledo" | "Fátima do Sul";
}

export default function FinanceiroModulo({ pacientes }: FinanceiroModuloProps) {
  // Lançamentos reais, vindos do banco (/api/transacoes) — inclui tanto os
  // registrados manualmente aqui quanto os sinais confirmados automaticamente
  // pela IA no WhatsApp (ver criarAgendamentoDireto em whatsappCore.ts). Antes,
  // essa lista era só um mock fixo no front-end: nada do que acontecia de
  // verdade (incluindo o sinal de R$100 confirmado pela IA) aparecia aqui.
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [carregandoTransacoes, setCarregandoTransacoes] = useState(true);
  const [salvandoLancamento, setSalvandoLancamento] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/transacoes");
        const dados = await r.json();
        if (Array.isArray(dados)) {
          setTransacoes([...dados].sort((a: Transacao, b: Transacao) => b.data.localeCompare(a.data)));
        }
      } catch {
        // Sem conexão — mantém a lista vazia em vez de mostrar dado fictício.
      } finally {
        setCarregandoTransacoes(false);
      }
    })();
  }, []);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [metodo, setMetodo] = useState<Transacao["metodo"]>("Pix");
  const [status, setStatus] = useState<Transacao["status"]>("Pago");
  const [unidade, setUnidade] = useState<Transacao["unidade"]>("Toledo");
  const [dataMsg, setDataMsg] = useState("");

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUnidade, setFilterUnidade] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Evolução real de caixa — calculada a partir dos lançamentos de verdade
  // (transacoes, vindas do banco), últimos 6 meses incluindo o atual. Antes
  // esses números eram fixos/fictícios e nunca refletiam o que realmente
  // acontecia na clínica.
  const MESES_LABEL = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const monthlyData = useMemo(() => {
    const hoje = new Date();
    const meses: { key: string; mes: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      meses.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, mes: MESES_LABEL[d.getMonth()] });
    }
    return meses.map(({ key, mes }) => {
      const doMes = transacoes.filter(tx => tx.data.startsWith(key) && tx.status !== "Cancelado");
      const Toledo = doMes.filter(tx => tx.unidade === "Toledo").reduce((acc, tx) => acc + tx.valor, 0);
      const Fatima = doMes.filter(tx => tx.unidade === "Fátima do Sul").reduce((acc, tx) => acc + tx.valor, 0);
      return { mes, Toledo, Fatima, Total: Toledo + Fatima };
    });
  }, [transacoes]);

  // Distribuição real por procedimento/descrição — top 4 + "Outros", calculado
  // sobre os lançamentos já pagos. Antes eram 3 percentuais fixos que nunca
  // mudavam, mesmo com lançamentos reais diferentes disso.
  const PALETA_DISTRIBUICAO = ["#C9A84C", "#0A0A0A", "#DFD5BF", "#8d6528", "#b3925c"];
  const distribuicaoServicos = useMemo(() => {
    const pagos = transacoes.filter(tx => tx.status === "Pago");
    const totalPago = pagos.reduce((acc, tx) => acc + tx.valor, 0);
    if (totalPago === 0) return [];
    const porDescricao = new Map<string, number>();
    for (const tx of pagos) {
      const chave = tx.descricao.trim() || "Sem descrição";
      porDescricao.set(chave, (porDescricao.get(chave) || 0) + tx.valor);
    }
    const ordenado = Array.from(porDescricao.entries()).sort((a, b) => b[1] - a[1]);
    const top = ordenado.slice(0, 4).map(([label, valor]) => ({ label, valor, pct: (valor / totalPago) * 100 }));
    const restanteValor = ordenado.slice(4).reduce((acc, [, v]) => acc + v, 0);
    if (restanteValor > 0) top.push({ label: "Outros", valor: restanteValor, pct: (restanteValor / totalPago) * 100 });
    return top;
  }, [transacoes]);

  // Insight dinâmico (participação real de Toledo no faturamento) — antes era
  // um texto fixo ("cresceram 14.5%...") que não vinha de nenhum cálculo real.
  const insightCaixa = useMemo(() => {
    const validas = transacoes.filter(tx => tx.status !== "Cancelado");
    const totalValido = validas.reduce((acc, tx) => acc + tx.valor, 0);
    if (totalValido === 0) return "Ainda não há lançamentos registrados para gerar esse insight.";
    const totalToledo = validas.filter(tx => tx.unidade === "Toledo").reduce((acc, tx) => acc + tx.valor, 0);
    const pctToledo = (totalToledo / totalValido) * 100;
    const pctFatima = 100 - pctToledo;
    return `Do total registrado, Toledo responde por ${pctToledo.toFixed(1)}% do faturamento e Fátima do Sul por ${pctFatima.toFixed(1)}%.`;
  }, [transacoes]);

  // Gestão de Pacotes — agora vem de /api/pacotes (pacotesVendidos no banco).
  // Antes era um mock fixo com 2 pacotes de exemplo que nunca refletiam os
  // pacotes vendidos de verdade nem persistiam o abatimento de sessão.
  interface Pacote {
    id: string;
    pacienteNome: string;
    nomePacote: string;
    quantidadeTotal: number;
    sessoesRealizadas: number;
    status: string;
  }
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [carregandoPacotes, setCarregandoPacotes] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/pacotes");
        const dados = await r.json();
        if (Array.isArray(dados)) setPacotes(dados);
      } catch {
        // Sem conexão — mantém vazio em vez de mostrar dado fictício.
      } finally {
        setCarregandoPacotes(false);
      }
    })();
  }, []);

  const handleAbaterSessao = async (pctId: string) => {
    const atual = pacotes.find(p => p.id === pctId);
    if (!atual || atual.sessoesRealizadas >= atual.quantidadeTotal) return;
    const novoRealizadas = atual.sessoesRealizadas + 1;
    const novoStatus = novoRealizadas === atual.quantidadeTotal ? "Concluido" : "Ativo";

    // Atualiza a tela na hora (otimista), mas reverte se não conseguir salvar no banco.
    setPacotes(prev => prev.map(p => p.id === pctId ? { ...p, sessoesRealizadas: novoRealizadas, status: novoStatus } : p));
    try {
      const r = await fetch(`/api/pacotes/${pctId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessoesRealizadas: novoRealizadas, status: novoStatus }),
      });
      if (!r.ok) throw new Error("Falha ao salvar");
    } catch {
      setPacotes(prev => prev.map(p => p.id === pctId ? atual : p));
      alert("Não foi possível salvar essa sessão no sistema agora. Verifique sua conexão e tente novamente.");
    }
  };

  // Calculations
  const totalRecebido = transacoes
    .filter(tx => tx.status === "Pago")
    .reduce((acc, tx) => acc + tx.valor, 0);

  const totalPendente = transacoes
    .filter(tx => tx.status === "Pendente")
    .reduce((acc, tx) => acc + tx.valor, 0);

  const totalGeral = totalRecebido + totalPendente;

  const filteredTransacoes = transacoes.filter(tx => {
    const matchesSearch = tx.pacienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnidade = filterUnidade === "all" || tx.unidade === filterUnidade;
    const matchesStatus = filterStatus === "all" || tx.status === filterStatus;
    return matchesSearch && matchesUnidade && matchesStatus;
  });

  const handleCreateLancemento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPacienteId || !descricao || !valor) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const pacienteEncontrado = pacientes.find(p => p.id === selectedPacienteId);
    if (!pacienteEncontrado) return;

    const novaTx: Transacao = {
      id: `tx-${Date.now()}`,
      pacienteId: selectedPacienteId,
      pacienteNome: pacienteEncontrado.nome,
      data: new Date().toISOString().split("T")[0],
      descricao,
      valor: parseFloat(valor),
      metodo,
      status,
      unidade,
    };

    setSalvandoLancamento(true);
    try {
      const r = await fetch("/api/transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaTx),
      });
      if (!r.ok) throw new Error("Falha ao salvar");
      const salvo = await r.json();
      setTransacoes(prev => [salvo?.id ? salvo : novaTx, ...prev]);
    } catch {
      setSalvandoLancamento(false);
      alert("Não foi possível salvar esse lançamento no sistema agora. Verifique sua conexão e tente novamente.");
      return;
    }
    setSalvandoLancamento(false);

    // Reset Form
    setSelectedPacienteId("");
    setDescricao("");
    setValor("");
    setMetodo("Pix");
    setStatus("Pago");
    setUnidade("Toledo");
    setShowAddForm(false);
    setDataMsg("Lançamento de faturamento registrado com sucesso!");
    setTimeout(() => setDataMsg(""), 3500);
  };

  return (
    <div id="financeiro_view_container" className="space-y-8 animate-fadeIn text-[#0A0A0A]">

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#0A0A0A]/5 pb-6">
        <div>
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl font-normal text-[#0A0A0A] tracking-tight">
            Faturamento Integrado e Caixa
          </h2>
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-1 font-semibold">
            Controle básico de cobranças, faturamento cirúrgico e clínica médica
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black font-semibold text-xs font-mono uppercase px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Registrar Faturamento</span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {dataMsg && (
        <div className="bg-emerald-50 border border-emerald-250 p-4 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
          <span>{dataMsg}</span>
        </div>
      )}

      {/* Dynamic Lançamento Form */}
      {showAddForm && (
        <form onSubmit={handleCreateLancemento} className="bg-[#F5F0E8]/20 border border-[#C9A84C]/35 rounded-xl p-6 space-y-4 shadow-sm animate-fadeIn">
          <h3 style={{ fontFamily: "Georgia, serif" }} className="text-base font-semibold text-neutral-800 flex items-center gap-2 border-b border-gray-250/50 pb-2">
            <Receipt className="text-[#C9A84C] w-4.5 h-4.5" /> Registrar Novo Lançamento de Caixa
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="space-y-1">
              <label className="text-[10px] text-gray-450 uppercase font-mono font-bold block">Paciente *</label>
              <select
                value={selectedPacienteId}
                onChange={(e) => setSelectedPacienteId(e.target.value)}
                className="w-full bg-white border border-gray-250 rounded-lg py-2 px-3 text-xs outline-none focus:border-[#C9A84C]"
              >
                <option value="">Selecione o Paciente...</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} ({p.cidade})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-450 uppercase font-mono font-bold block">Procedimento / Motivo *</label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex. MMP Capilar, Infiltração, Consulta..."
                className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-3 text-xs outline-none focus:border-[#C9A84C] h-9.5 text-gray-800 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-450 uppercase font-mono font-bold block">Valor Mapeado (R$) *</label>
              <input
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="450.00"
                className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-3 text-xs outline-none focus:border-[#C9A84C] h-9.5 text-gray-800 font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-450 uppercase font-mono font-bold block">Forma de Pagamento</label>
              <select
                value={metodo}
                onChange={(e) => setMetodo(e.target.value as any)}
                className="w-full bg-white border border-gray-250 rounded-lg py-2 px-3 text-xs outline-none focus:border-[#C9A84C]"
              >
                <option value="Pix">Pix</option>
                <option value="Cartão">Cartão de Crédito/Débito</option>
                <option value="Boleto">Boleto Bancário</option>
                <option value="Dinheiro">Dinheiro Espécie</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-450 uppercase font-mono font-bold block">Status do Pagamento</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-white border border-gray-250 rounded-lg py-2 px-3 text-xs outline-none focus:border-[#C9A84C]"
              >
                <option value="Pago">Pago/Confirmado</option>
                <option value="Pendente">Aguardando/Pendente</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-450 uppercase font-mono font-bold block">Unidade da Clínica</label>
              <select
                value={unidade}
                onChange={(e) => setUnidade(e.target.value as any)}
                className="w-full bg-white border border-gray-250 rounded-lg py-2 px-3 text-xs outline-none focus:border-[#C9A84C]"
              >
                <option value="Toledo">Toledo</option>
                <option value="Fátima do Sul">Fátima do Sul</option>
              </select>
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-250/40">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs border border-gray-300 text-gray-500 hover:text-black rounded-lg cursor-pointer transition font-mono font-bold uppercase"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvandoLancamento}
              className="px-4 py-2 text-xs bg-black text-white hover:bg-[#C9A84C] hover:text-black rounded-lg cursor-pointer transition font-mono font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {salvandoLancamento ? "Salvando..." : "Salvar Lançamento"}
            </button>
          </div>
        </form>
      )}

      {/* Financial Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

        {/* Total Recebido */}
        <div className="bg-white p-5 border-l-4 border-emerald-500 border-y border-r border-[#E5E5E5] shadow-sm flex flex-col justify-between h-28">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest block">Receitas Executadas</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-end justify-between mt-1">
            <span className="text-2xl font-serif text-[#0A0A0A] font-light">R$ {totalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-mono font-bold">100% PAGO</span>
          </div>
        </div>

        {/* Pendente de Cobrança */}
        <div className="bg-white p-5 border-l-4 border-amber-500 border-y border-r border-[#E5E5E5] shadow-sm flex flex-col justify-between h-28">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest block">Previsões Pendentes</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-end justify-between mt-1">
            <span className="text-2xl font-serif text-[#0A0A0A] font-light">R$ {totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-mono font-bold">AGUARDANDO</span>
          </div>
        </div>

        {/* Total Bruto Mapeado */}
        <div className="bg-white p-5 border-l-4 border-[#0A0A0A] border-y border-r border-[#E5E5E5] shadow-sm flex flex-col justify-between h-28">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-450 uppercase tracking-widest block">Faturamento Bruto Geral</span>
            <DollarSign className="w-4 h-4 text-[#C9A84C]" />
          </div>
          <div className="flex items-end justify-between mt-1">
            <span className="text-2xl font-serif text-[#0A0A0A] font-light">R$ {totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-[9px] bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Mês Vigente</span>
          </div>
        </div>

      </div>

      {/* Charts and graphs row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recharts cash flow */}
        <div className="lg:col-span-2 bg-white border border-[#E5E5E5] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 style={{ fontFamily: "Georgia, serif" }} className="text-sm font-bold text-[#0A0A0A]">
              Evolução e Crescimento de Caixa Histórico
            </h3>
            <span className="text-[10px] text-gray-400 font-mono">Consolidado por Unidades</span>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="mes" stroke="#A3A3A3" fontSize={11} fontStyle="italic" />
                <YAxis stroke="#A3A3A3" fontSize={11} />
                <Tooltip
                  formatter={(value: any) => [`R$ ${value.toLocaleString("pt-BR")}`, "Faturamento"]}
                  contentStyle={{ backgroundColor: "#0A0A0A", color: "#F5F0E8", borderRadius: "8px" }}
                />
                <Legend iconType="circle" fontSize={10} wrapperStyle={{ fontSize: "11px", fontFamily: "sans-serif" }} />
                <Bar dataKey="Toledo" name="Unidade Toledo" fill="#C9A84C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Fatima" name="Unidade Fátima do Sul" fill="#0A0A0A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Panel / Ticket Médio and Distribution */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 style={{ fontFamily: "Georgia, serif" }} className="text-sm font-bold text-[#0A0A0A] border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-[#C9A84C]" strokeWidth={2.5} /> Distribuição de Serviços
            </h3>

            <div className="space-y-3 text-xs font-sans font-medium">

              {distribuicaoServicos.length === 0 ? (
                <p className="text-gray-450 italic font-mono text-[11px] py-2">Nenhum lançamento pago registrado ainda.</p>
              ) : (
                distribuicaoServicos.map((item, idx) => (
                  <div className="space-y-1" key={item.label}>
                    <div className="flex justify-between items-center text-gray-600">
                      <span>{item.label} ({item.pct.toFixed(0)}%)</span>
                      <span className="font-mono text-gray-800 font-bold">R$ {item.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: PALETA_DISTRIBUICAO[idx % PALETA_DISTRIBUICAO.length] }}></div>
                    </div>
                  </div>
                ))
              )}

            </div>
          </div>

          <div className="bg-[#F5F0E8]/40 border border-[#C9A84C]/20 rounded-lg p-3.5 space-y-1 mt-4">
            <span className="text-[9px] text-[#C9A84C] font-mono uppercase font-bold tracking-wider block">Insights de Caixa</span>
            <p className="text-[11px] text-gray-600 leading-normal font-sans font-medium">
              {insightCaixa}
            </p>
          </div>
        </div>

      </div>

      {/* Comprehensive Ledger Table Log */}
      <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">

        {/* Table Filters header toolbar */}
        <div className="p-4 bg-gray-50/50 border-b border-gray-150 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">

          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por paciente ou procedimento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-250 focus:border-[#C9A84C] py-1.5 pl-9 pr-3 rounded-lg text-xs outline-none text-gray-800 h-9 font-sans font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">

            <div className="flex items-center gap-1.5 bg-white border border-gray-250 rounded-lg px-2 py-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={filterUnidade}
                onChange={(e) => setFilterUnidade(e.target.value)}
                className="bg-transparent border-none outline-none text-[11px] text-gray-600 font-bold"
              >
                <option value="all">Unidades: Todas</option>
                <option value="Toledo">Toledo</option>
                <option value="Fátima do Sul">Fátima do Sul</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-gray-250 rounded-lg px-2 py-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent border-none outline-none text-[11px] text-gray-600 font-bold"
              >
                <option value="all">Status: Todos</option>
                <option value="Pago">Pago/Realizado</option>
                <option value="Pendente">Pendente</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

          </div>

        </div>

        {/* Tabular view */}
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-450 font-mono text-[9px] uppercase tracking-wider font-bold border-b border-gray-200">
                <th className="py-3 px-5">Paciente</th>
                <th className="py-3 px-5">Data Lançamento</th>
                <th className="py-3 px-5">Descrição / Serviço</th>
                <th className="py-3 px-5">Forma</th>
                <th className="py-3 px-5">Unidade</th>
                <th className="py-3 px-5">Valor bruto</th>
                <th className="py-3 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {carregandoTransacoes ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-450 italic font-mono bg-white">
                    Carregando lançamentos...
                  </td>
                </tr>
              ) : filteredTransacoes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-450 italic font-mono bg-white">
                    {transacoes.length === 0
                      ? "Nenhum lançamento financeiro registrado ainda."
                      : "Nenhum lançamento financeiro corresponde aos filtros aplicados."}
                  </td>
                </tr>
              ) : (
                filteredTransacoes.map((tx) => (
                  <tr key={tx.id} className="bg-white hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-5 font-semibold text-gray-900">{tx.pacienteNome}</td>
                    <td className="py-3.5 px-5 font-mono text-gray-500 whitespace-nowrap">{tx.data}</td>
                    <td className="py-3.5 px-5 text-gray-700 font-sans font-medium">{tx.descricao}</td>
                    <td className="py-3.5 px-5 text-gray-600 font-sans font-medium">{tx.metodo}</td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono leading-none border uppercase ${
                        tx.unidade === "Toledo"
                          ? "bg-neutral-900 border-neutral-850 text-[#C9A84C]"
                          : "bg-[#0A0A0A] border-[#C9A84C]/25 text-white"
                      }`}>
                        {tx.unidade}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-mono font-bold text-gray-900 whitespace-nowrap">
                      R$ {tx.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-5">
                      {tx.status === "Pago" ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-250 py-0.5 px-2 rounded-full font-sans font-bold text-[9px] uppercase tracking-wide">
                          <CheckCircle className="w-2.5 h-2.5 text-emerald-600" /> Pago
                        </span>
                      ) : tx.status === "Pendente" ? (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-250 py-0.5 px-2 rounded-full font-sans font-bold text-[9px] uppercase tracking-wide">
                          <Clock className="w-2.5 h-2.5 text-amber-600 animate-pulse" /> Pendente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-250 py-0.5 px-2 rounded-full font-sans font-bold text-[9px] uppercase tracking-wide">
                          Cancelado
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Gestão de Pacotes */}
      <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#0A0A0A] tracking-tight">
            Gestão de Pacotes de Tratamento
          </h3>
        </div>

        {carregandoPacotes ? (
          <p className="text-gray-450 italic font-mono text-xs py-6 text-center">Carregando pacotes...</p>
        ) : pacotes.length === 0 ? (
          <p className="text-gray-450 italic font-mono text-xs py-6 text-center">Nenhum pacote de tratamento vendido ainda.</p>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pacotes.map(pct => {
            const pctCompleto = (pct.sessoesRealizadas / pct.quantidadeTotal) * 100;
            return (
              <div key={pct.id} className={`border rounded-xl p-4 shadow-sm transition relative overflow-hidden ${pct.status === 'Concluido' ? 'border-green-200 bg-green-50/30' : 'border-[#C9A84C]/30 bg-[#F5F0E8]/10'}`}>
                <div className="absolute top-0 left-0 h-1 bg-[#C9A84C] transition-all" style={{ width: `${pctCompleto}%` }} />

                <h4 className="font-semibold text-gray-900 text-sm">{pct.nomePacote}</h4>
                <p className="text-[11px] font-mono font-bold text-gray-500 mt-0.5">{pct.pacienteNome}</p>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-gray-600 font-sans font-medium">
                    <strong className="text-black">{pct.sessoesRealizadas}</strong> de {pct.quantidadeTotal} sessões usadas
                  </div>
                  {pct.status === "Ativo" ? (
                    <button
                      onClick={() => handleAbaterSessao(pct.id)}
                      className="text-[10px] bg-black text-white hover:bg-[#C9A84C] font-mono font-bold uppercase px-3 py-1.5 rounded transition cursor-pointer"
                    >
                      Abater Sessão
                    </button>
                  ) : (
                    <span className="text-[10px] text-green-700 bg-green-100 border border-green-200 px-3 py-1 rounded font-bold uppercase tracking-wider">Concluído</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

    </div>
  );
}
