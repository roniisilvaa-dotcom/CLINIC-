import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageCircle, Bot, Zap, CheckCircle2, Clock, Users,
  Settings, Phone, DollarSign, Calendar, ChevronRight,
  CheckCheck, Wifi, WifiOff, RefreshCw,
  Smartphone, Shield, BellRing, Send,
  Pause, Play, Trash2, X, AlertTriangle,
  ChevronLeft, Pencil, Check, Ban, Brain, Save
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────
interface Stats {
  conversasHoje: number;
  agendadosBot: number;
  mensagensTotal: number;
  botOnline: boolean;
}

interface Conversa {
  telefone: string;
  mensagens: { role: string; conteudo: string; timestamp: string }[];
  ultimaAtividade: string;
  status: "ativo" | "aguardando_pagamento" | "agendado";
  iaPausada?: boolean;
}

interface ConfigNotificacao {
  whatsappDra: string;
  iaAtiva: boolean;
}

interface QrData {
  base64?: string;
  pairingCode?: string;
}

interface DiaAtendimento {
  id: string;
  local: string;
  data: string;
  horarios: string[] | null;
}

interface Bloqueio {
  id: string;
  tipo: "semana" | "data";
  diaSemana: number | null;
  data: string | null;
  motivo: string | null;
}

interface ConfigIa {
  valorSinal: number;
  valorConsulta: number;
  chavePix: string;
  instrucoesExtras: string;
}

const STATUS_COLORS = {
  ativo: "bg-blue-100 text-blue-700",
  aguardando_pagamento: "bg-amber-100 text-amber-700",
  agendado: "bg-green-100 text-green-700",
};
const STATUS_LABELS = {
  ativo: "Conversando",
  aguardando_pagamento: "Aguard. Pag.",
  agendado: "Agendado ✓",
};

const LOCAIS = ["Toledo", "Fátima do Sul"] as const;
const HORARIOS_PADRAO = ["10:00", "11:00", "13:30", "15:00", "16:30", "17:30"];
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DIAS_SEMANA_LABEL = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

// Feriados nacionais fixos (mês/dia iguais todo ano) — usados na lista de
// "um clique" de Bloqueios e Feriados.
const FERIADOS_FIXOS = [
  { mes: 1, dia: 1, nome: "Confraternização Universal" },
  { mes: 4, dia: 21, nome: "Tiradentes" },
  { mes: 5, dia: 1, nome: "Dia do Trabalho" },
  { mes: 9, dia: 7, nome: "Independência do Brasil" },
  { mes: 10, dia: 12, nome: "Nossa Senhora Aparecida" },
  { mes: 11, dia: 2, nome: "Finados" },
  { mes: 11, dia: 15, nome: "Proclamação da República" },
  { mes: 11, dia: 20, nome: "Consciência Negra" },
  { mes: 12, dia: 25, nome: "Natal" },
];

// Feriados móveis (mudam de data a cada ano, atrelados à Páscoa) — datas já
// calculadas para os próximos anos. Precisa atualizar essa lista de tempos em
// tempos (basta buscar "feriados móveis Brasil <ano>").
const FERIADOS_MOVEIS: Record<number, { data: string; nome: string }[]> = {
  2026: [
    { data: "2026-02-16", nome: "Carnaval (segunda)" },
    { data: "2026-02-17", nome: "Carnaval (terça)" },
    { data: "2026-04-03", nome: "Paixão de Cristo" },
    { data: "2026-06-04", nome: "Corpus Christi" },
  ],
  2027: [
    { data: "2027-02-08", nome: "Carnaval (segunda)" },
    { data: "2027-02-09", nome: "Carnaval (terça)" },
    { data: "2027-03-26", nome: "Paixão de Cristo" },
    { data: "2027-05-27", nome: "Corpus Christi" },
  ],
};

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatarDataCurta(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", weekday: "short" });
}

// ─── Componente Principal ────────────────────────────────────────────
export default function WhatsAppBot() {
  const [aba, setAba] = useState<"visao_geral" | "conversas" | "dias_atendimento" | "config_ia" | "configurar">("visao_geral");
  const [stats, setStats] = useState<Stats>({ conversasHoje: 0, agendadosBot: 0, mensagensTotal: 0, botOnline: false });
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaSelecionada, setConversaSelecionada] = useState<Conversa | null>(null);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<ConfigNotificacao>({ whatsappDra: "", iaAtiva: true });
  const [salvando, setSalvando] = useState(false);
  const [salvoOk, setSalvoOk] = useState(false);
  const [excluindoConversa, setExcluindoConversa] = useState<string | null>(null);

  // ── Conexão do WhatsApp (autoconexão pela Dra. via QR Code) ──
  const [conectado, setConectado] = useState<boolean | null>(null);
  const [qr, setQr] = useState<QrData | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrErro, setQrErro] = useState<string | null>(null);
  const [desconectando, setDesconectando] = useState(false);

  // ── Dias de Atendimento (calendário clicável — Toledo e Fátima do Sul) ──
  // A Dra. clica direto nos dias do mês pra marcar em quais ela vai atender
  // (em vez de cadastrar data por data num campo). A IA do WhatsApp só usa os
  // dias marcados como Toledo pra agendar sozinha — ver checkAvailability() em
  // src/services/whatsappCore.ts. Fátima do Sul fica registrado aqui só pra
  // controle da Dra./equipe.
  const [localCalendario, setLocalCalendario] = useState<typeof LOCAIS[number]>("Toledo");
  const [diasAtendimento, setDiasAtendimento] = useState<DiaAtendimento[]>([]);
  const [carregandoDias, setCarregandoDias] = useState(false);
  const [mesCalendario, setMesCalendario] = useState(new Date().getMonth());
  const [anoCalendario, setAnoCalendario] = useState(new Date().getFullYear());
  const [diaClicando, setDiaClicando] = useState<string | null>(null);
  const [diaEditandoId, setDiaEditandoId] = useState<string | null>(null);
  const [horariosEditando, setHorariosEditando] = useState<string[]>([]);
  const [salvandoHorarios, setSalvandoHorarios] = useState(false);

  // ── Bloqueios e Feriados (fins de semana recorrentes + datas específicas) ──
  // Independente de local — tem prioridade sobre os dias marcados acima. Ver
  // checkAvailability() em src/services/whatsappCore.ts.
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [carregandoBloqueios, setCarregandoBloqueios] = useState(false);
  const [salvandoBloqueioId, setSalvandoBloqueioId] = useState<string | null>(null);
  const [novoFeriadoData, setNovoFeriadoData] = useState("");
  const [novoFeriadoMotivo, setNovoFeriadoMotivo] = useState("");
  const [salvandoFeriado, setSalvandoFeriado] = useState(false);

  // ── Configurações da IA (Fase 2 — preços, chave Pix, "ensinar a IA") ──
  const [configIa, setConfigIa] = useState<ConfigIa>({ valorSinal: 100, valorConsulta: 550, chavePix: "", instrucoesExtras: "" });
  const [carregandoConfigIa, setCarregandoConfigIa] = useState(false);
  const [salvandoConfigIa, setSalvandoConfigIa] = useState(false);
  const [configIaSalvaOk, setConfigIaSalvaOk] = useState(false);

  const carregarStats = useCallback(async () => {
    try {
      const r = await fetch("/api/whatsapp/stats");
      if (r.ok) setStats(await r.json());
    } catch { /* offline */ }
  }, []);

  const carregarConversas = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/whatsapp/conversas");
      if (r.ok) {
        const data = await r.json();
        setConversas(data);
      }
    } catch { /* offline */ }
    setLoading(false);
  }, []);

  const checarStatusConexao = useCallback(async () => {
    try {
      const r = await fetch("/api/whatsapp/status-conexao");
      const data = await r.json();
      if (data.ok) setConectado(!!data.conectado);
      else setConectado(false);
    } catch {
      setConectado(false);
    }
  }, []);

  const carregarQr = useCallback(async () => {
    setQrLoading(true);
    setQrErro(null);
    try {
      const r = await fetch("/api/whatsapp/qr");
      const data = await r.json();
      if (data.conectado) {
        setConectado(true);
        setQr(null);
      } else if (data.ok && (data.base64 || data.pairingCode)) {
        setQr({ base64: data.base64, pairingCode: data.pairingCode });
        setConectado(false);
      } else {
        setQrErro(data.erro || "Não foi possível gerar o QR Code agora.");
      }
    } catch {
      setQrErro("Não foi possível contatar o servidor do WhatsApp.");
    }
    setQrLoading(false);
  }, []);

  // Busca sempre os dias das DUAS localidades de uma vez (o painel filtra por
  // aba localmente) — assim trocar de aba não exige um novo fetch.
  const carregarDiasAtendimento = useCallback(async () => {
    setCarregandoDias(true);
    try {
      const r = await fetch("/api/agenda/dias-atendimento");
      if (r.ok) setDiasAtendimento(await r.json());
    } catch { /* offline */ }
    setCarregandoDias(false);
  }, []);

  const carregarBloqueios = useCallback(async () => {
    setCarregandoBloqueios(true);
    try {
      const r = await fetch("/api/agenda/bloqueios");
      if (r.ok) setBloqueios(await r.json());
    } catch { /* offline */ }
    setCarregandoBloqueios(false);
  }, []);

  const carregarConfigIa = useCallback(async () => {
    setCarregandoConfigIa(true);
    try {
      const r = await fetch("/api/config-ia");
      if (r.ok) setConfigIa(await r.json());
    } catch { /* offline */ }
    setCarregandoConfigIa(false);
  }, []);

  useEffect(() => {
    carregarStats();
    const int = setInterval(carregarStats, 30000);
    return () => clearInterval(int);
  }, [carregarStats]);

  useEffect(() => {
    if (aba === "conversas") carregarConversas();
  }, [aba, carregarConversas]);

  // Ao abrir a aba "Configurar": checa se já está conectado ao WhatsApp.
  useEffect(() => {
    if (aba === "configurar") checarStatusConexao();
  }, [aba, checarStatusConexao]);

  // Ao abrir a aba "Dias de Atendimento": carrega o calendário e os bloqueios.
  useEffect(() => {
    if (aba === "dias_atendimento") { carregarDiasAtendimento(); carregarBloqueios(); }
  }, [aba, carregarDiasAtendimento, carregarBloqueios]);

  // Ao abrir a aba "Configurações da IA": carrega preços, chave Pix e instruções.
  useEffect(() => {
    if (aba === "config_ia") carregarConfigIa();
  }, [aba, carregarConfigIa]);

  // Se não estiver conectado, busca o QR Code automaticamente.
  useEffect(() => {
    if (aba === "configurar" && conectado === false && !qr && !qrLoading) {
      carregarQr();
    }
  }, [aba, conectado, qr, qrLoading, carregarQr]);

  // Enquanto o QR estiver na tela, fica checando a cada 4s se a Dra. já escaneou.
  useEffect(() => {
    if (aba !== "configurar" || conectado !== false) return;
    const int = setInterval(async () => {
      try {
        const r = await fetch("/api/whatsapp/status-conexao");
        const data = await r.json();
        if (data.ok && data.conectado) {
          setConectado(true);
          setQr(null);
        }
      } catch { /* offline */ }
    }, 4000);
    return () => clearInterval(int);
  }, [aba, conectado]);

  const handleDesconectar = async () => {
    if (!window.confirm("Desconectar o WhatsApp da clínica? A IA vai parar de responder até reconectar novamente.")) return;
    setDesconectando(true);
    try {
      await fetch("/api/whatsapp/desconectar", { method: "DELETE" });
    } catch { /* offline */ }
    setConectado(false);
    setQr(null);
    setDesconectando(false);
    carregarQr();
  };

  const togglePausaIA = async (telefone: string, pausarAgora: boolean) => {
    try {
      await fetch(`/api/whatsapp/${pausarAgora ? "pausar" : "retomar"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone }),
      });
      setConversas(prev => prev.map(c => c.telefone === telefone ? { ...c, iaPausada: pausarAgora } : c));
    } catch { /* offline */ }
  };

  const handleDeleteConversa = async (telefone: string) => {
    if (!window.confirm("Excluir esta conversa? Todo o historico de mensagens sera apagado permanentemente.")) return;
    setExcluindoConversa(telefone);
    try {
      const res = await fetch(`/api/whatsapp/conversas/${encodeURIComponent(telefone)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir");
      setConversas(prev => prev.filter(c => c.telefone !== telefone));
      if (conversaSelecionada?.telefone === telefone) setConversaSelecionada(null);
    } catch {
      alert("Nao foi possivel excluir a conversa. Tente novamente.");
    } finally {
      setExcluindoConversa(null);
    }
  };

  const salvarConfig = async () => {
    setSalvando(true);
    try {
      await fetch("/api/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      setSalvoOk(true);
      setTimeout(() => setSalvoOk(false), 2500);
    } catch { /* offline */ }
    setSalvando(false);
  };

  // ── Calendário de dias de atendimento ──
  const diasDoLocalSet = useMemo(() => {
    const map = new Map<string, DiaAtendimento>();
    diasAtendimento.filter(d => d.local === localCalendario).forEach(d => map.set(d.data, d));
    return map;
  }, [diasAtendimento, localCalendario]);

  const diasDoLocalOrdenados = useMemo(() => {
    return diasAtendimento
      .filter(d => d.local === localCalendario)
      .slice()
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [diasAtendimento, localCalendario]);

  const hoje = new Date();

  const calendarCells = useMemo(() => {
    const primeiroDoMes = new Date(anoCalendario, mesCalendario, 1);
    const diasNoMes = new Date(anoCalendario, mesCalendario + 1, 0).getDate();
    const offset = (primeiroDoMes.getDay() + 6) % 7; // segunda como primeiro dia
    const cells: { num: number | null; iso: string | null }[] = [];
    for (let i = 0; i < offset; i++) cells.push({ num: null, iso: null });
    for (let d = 1; d <= diasNoMes; d++) {
      cells.push({ num: d, iso: toISODate(new Date(anoCalendario, mesCalendario, d)) });
    }
    while (cells.length % 7 !== 0) cells.push({ num: null, iso: null });
    return cells;
  }, [mesCalendario, anoCalendario]);

  // ── Bloqueios e Feriados ──
  const diasSemanaBloqueados = useMemo(
    () => new Set(bloqueios.filter(b => b.tipo === "semana").map(b => b.diaSemana)),
    [bloqueios]
  );
  const datasBloqueadas = useMemo(() => {
    const map = new Map<string, Bloqueio>();
    bloqueios.filter(b => b.tipo === "data" && b.data).forEach(b => map.set(b.data!, b));
    return map;
  }, [bloqueios]);

  // Próximos feriados nacionais (fixos + móveis) ainda não bloqueados, pro ano
  // atual e o seguinte — usado na lista de "um clique" abaixo do calendário.
  const proximosFeriados = useMemo(() => {
    const hojeISO = toISODate(new Date());
    const anoAtual = new Date().getFullYear();
    const lista: { data: string; nome: string }[] = [];
    [anoAtual, anoAtual + 1].forEach(ano => {
      FERIADOS_FIXOS.forEach(f => {
        lista.push({ data: `${ano}-${String(f.mes).padStart(2, "0")}-${String(f.dia).padStart(2, "0")}`, nome: f.nome });
      });
      (FERIADOS_MOVEIS[ano] || []).forEach(f => lista.push(f));
    });
    return lista.filter(f => f.data >= hojeISO).sort((a, b) => a.data.localeCompare(b.data)).slice(0, 12);
  }, []);

  const toggleBloqueioSemana = async (diaSemana: number) => {
    const id = `semana::${diaSemana}`;
    setSalvandoBloqueioId(id);
    try {
      if (diasSemanaBloqueados.has(diaSemana)) {
        await fetch(`/api/agenda/bloqueios/${encodeURIComponent(id)}`, { method: "DELETE" });
        setBloqueios(prev => prev.filter(b => b.id !== id));
      } else {
        const r = await fetch("/api/agenda/bloqueios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo: "semana", diaSemana }),
        });
        if (r.ok) {
          const novo = await r.json();
          setBloqueios(prev => [...prev, novo]);
        }
      }
    } catch { /* offline */ }
    setSalvandoBloqueioId(null);
  };

  const adicionarBloqueioData = async (data: string, motivo: string) => {
    if (!data) return;
    const id = `data::${data}`;
    setSalvandoBloqueioId(id);
    try {
      const r = await fetch("/api/agenda/bloqueios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "data", data, motivo: motivo || null }),
      });
      if (r.ok) {
        const novo = await r.json();
        setBloqueios(prev => [...prev.filter(b => b.data !== data), novo]);
      }
    } catch { /* offline */ }
    setSalvandoBloqueioId(null);
  };

  const removerBloqueio = async (id: string) => {
    setSalvandoBloqueioId(id);
    try {
      await fetch(`/api/agenda/bloqueios/${encodeURIComponent(id)}`, { method: "DELETE" });
      setBloqueios(prev => prev.filter(b => b.id !== id));
    } catch { /* offline */ }
    setSalvandoBloqueioId(null);
  };

  const handleAdicionarFeriado = async () => {
    if (!novoFeriadoData) return;
    setSalvandoFeriado(true);
    await adicionarBloqueioData(novoFeriadoData, novoFeriadoMotivo.trim());
    setNovoFeriadoData("");
    setNovoFeriadoMotivo("");
    setSalvandoFeriado(false);
  };

  const salvarConfigIa = async () => {
    setSalvandoConfigIa(true);
    try {
      const r = await fetch("/api/config-ia", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configIa),
      });
      if (r.ok) {
        setConfigIa(await r.json());
        setConfigIaSalvaOk(true);
        setTimeout(() => setConfigIaSalvaOk(false), 2500);
      }
    } catch { /* offline */ }
    setSalvandoConfigIa(false);
  };

  const irParaMesAnterior = () => {
    if (mesCalendario === 0) { setMesCalendario(11); setAnoCalendario(a => a - 1); }
    else setMesCalendario(m => m - 1);
  };
  const irParaProximoMes = () => {
    if (mesCalendario === 11) { setMesCalendario(0); setAnoCalendario(a => a + 1); }
    else setMesCalendario(m => m + 1);
  };

  // Clique num dia do calendário: alterna marcado/desmarcado. Salva na hora —
  // sem precisar de um botão "salvar" separado, pra ela conseguir ir clicando
  // dia após dia e ver o mês inteiro tomando forma.
  const toggleDia = async (dataISO: string) => {
    setDiaClicando(dataISO);
    const existente = diasDoLocalSet.get(dataISO);
    try {
      if (existente) {
        await fetch(`/api/agenda/dias-atendimento/${encodeURIComponent(existente.id)}`, { method: "DELETE" });
        setDiasAtendimento(prev => prev.filter(d => d.id !== existente.id));
        if (diaEditandoId === existente.id) setDiaEditandoId(null);
      } else {
        const r = await fetch("/api/agenda/dias-atendimento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ local: localCalendario, data: dataISO }),
        });
        if (r.ok) {
          const novo = await r.json();
          setDiasAtendimento(prev => [...prev, novo]);
        }
      }
    } catch { /* offline */ }
    setDiaClicando(null);
  };

  const abrirEdicaoHorarios = (dia: DiaAtendimento) => {
    setDiaEditandoId(dia.id);
    setHorariosEditando(dia.horarios && dia.horarios.length ? [...dia.horarios] : [...HORARIOS_PADRAO]);
  };

  const alternarHorarioEditando = (h: string) => {
    setHorariosEditando(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h].sort());
  };

  const salvarHorariosEditando = async () => {
    if (!diaEditandoId) return;
    setSalvandoHorarios(true);
    try {
      const r = await fetch(`/api/agenda/dias-atendimento/${encodeURIComponent(diaEditandoId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horarios: horariosEditando }),
      });
      if (r.ok) {
        const atualizado = await r.json();
        setDiasAtendimento(prev => prev.map(d => d.id === diaEditandoId ? atualizado : d));
      }
    } catch { /* offline */ }
    setSalvandoHorarios(false);
    setDiaEditandoId(null);
  };

  const resetarHorarioPadrao = async (dia: DiaAtendimento) => {
    try {
      const r = await fetch(`/api/agenda/dias-atendimento/${encodeURIComponent(dia.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horarios: null }),
      });
      if (r.ok) {
        const atualizado = await r.json();
        setDiasAtendimento(prev => prev.map(d => d.id === dia.id ? atualizado : d));
      }
    } catch { /* offline */ }
  };

  const removerDia = async (dia: DiaAtendimento) => {
    try {
      await fetch(`/api/agenda/dias-atendimento/${encodeURIComponent(dia.id)}`, { method: "DELETE" });
      setDiasAtendimento(prev => prev.filter(d => d.id !== dia.id));
      if (diaEditandoId === dia.id) setDiaEditandoId(null);
    } catch { /* offline */ }
  };

  const abas = [
    { id: "visao_geral", label: "Visão Geral", icon: Bot },
    { id: "conversas", label: "Conversas", icon: MessageCircle },
    { id: "dias_atendimento", label: "Dias de Atendimento", icon: Calendar },
    { id: "config_ia", label: "Configurações da IA", icon: Brain },
    { id: "configurar", label: "Configurar", icon: Settings },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-[#25D366]" />
          </div>
          <div>
            <h1 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0A0A0A]">
              IA Secretária WhatsApp
            </h1>
            <p className="text-xs text-neutral-500 font-mono">Agendamento automático · Pix · 24 h</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${stats.botOnline ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {stats.botOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {stats.botOnline ? "Bot Ativo" : "Bot Offline"}
          </div>
          <button onClick={carregarStats} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
        {abas.map(a => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              aba === a.id ? "bg-white text-[#0A0A0A] shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            <a.icon className="w-4 h-4" />
            {a.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── VISÃO GERAL ─────────────────────────── */}
        {aba === "visao_geral" && (
          <motion.div key="vg" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Conversas hoje", value: stats.conversasHoje, icon: MessageCircle, cor: "text-blue-600", bg: "bg-blue-50" },
                { label: "Agendados via bot", value: stats.agendadosBot, icon: Calendar, cor: "text-green-600", bg: "bg-green-50" },
                { label: "Total mensagens", value: stats.mensagensTotal, icon: Send, cor: "text-purple-600",bg: "bg-purple-50" },
                { label: "Status", value: stats.botOnline ? "Online" : "Offline", icon: Wifi, cor: stats.botOnline ? "text-green-600" : "text-red-500", bg: stats.botOnline ? "bg-green-50" : "bg-red-50" },
              ].map(s => (
                <div key={s.label} className="bg-white border border-neutral-200 rounded-xl p-4">
                  <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                    <s.icon className={`w-4.5 h-4.5 ${s.cor}`} />
                  </div>
                  <div className="text-2xl font-bold text-[#0A0A0A]">{s.value}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Fluxo de Atendimento */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <h3 className="font-semibold text-neutral-800 mb-5 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Fluxo de Atendimento Automático
              </h3>
              <div className="flex flex-wrap gap-3">
                {[
                  { n: "1", label: "Paciente manda mensagem no WhatsApp da clínica", icon: Smartphone },
                  { n: "2", label: "IA responde humanizada e coleta dados", icon: Bot },
                  { n: "3", label: "Sistema verifica agenda da Dra. Mariah", icon: Calendar },
                  { n: "4", label: "Paciente escolhe horário e confirma", icon: CheckCircle2 },
                  { n: "5", label: "IA gera link Pix de R$ 100 (sinal)", icon: DollarSign },
                  { n: "6", label: "Pagamento confirmado automaticamente", icon: Shield },
                  { n: "7", label: "Dra. Mariah recebe notificação completa", icon: BellRing },
                ].map((step, i, arr) => (
                  <React.Fragment key={step.n}>
                    <div className="flex flex-col items-center gap-2 min-w-[120px]">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A96E]/20 to-[#C9A96E]/5 border border-[#C9A96E]/30 flex items-center justify-center text-[#C9A96E] font-bold text-sm">
                        {step.n}
                      </div>
                      <step.icon className="w-4 h-4 text-neutral-400" />
                      <p className="text-[11px] text-neutral-600 text-center leading-tight">{step.label}</p>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="flex items-start pt-3">
                        <ChevronRight className="w-4 h-4 text-neutral-300 shrink-0" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── CONVERSAS ───────────────────────────── */}
        {aba === "conversas" && (
          <motion.div key="conv" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500">{conversas.length} conversa(s) ativa(s)</p>
              <button onClick={carregarConversas} className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-700 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Atualizar
              </button>
            </div>

            {conversas.length === 0 && !loading && (
              <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
                <MessageCircle className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500 font-medium">Nenhuma conversa ainda</p>
                <p className="text-sm text-neutral-400 mt-1">Conecte o WhatsApp na aba "Configurar" e aguarde as mensagens chegarem</p>
              </div>
            )}

            <div className="grid gap-3">
              {conversas.map((c, i) => (
                <div
                  key={i}
                  onClick={() => setConversaSelecionada(conversaSelecionada?.telefone === c.telefone ? null : c)}
                  className="w-full text-left bg-white border border-neutral-200 rounded-xl p-4 hover:border-neutral-300 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-[#25D366]" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-800 text-sm">{c.telefone}</p>
                        <p className="text-xs text-neutral-500 truncate max-w-[300px]">
                          {c.mensagens[c.mensagens.length - 1]?.conteudo?.slice(0, 60) || "..."}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {c.iaPausada && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-neutral-800 text-white flex items-center gap-1">
                          <Pause className="w-3 h-3" /> IA pausada
                        </span>
                      )}
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status] || "bg-neutral-100 text-neutral-600"}`}>
                        {STATUS_LABELS[c.status] || c.status}
                      </span>
                      <span className="text-xs text-neutral-400">{c.ultimaAtividade}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePausaIA(c.telefone, !c.iaPausada); }}
                        title={c.iaPausada ? "Retomar atendimento pela IA" : "Pausar IA e assumir manualmente"}
                        className={`p-1.5 rounded-lg border transition-colors ${c.iaPausada ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50" : "border-neutral-200 text-neutral-500 hover:bg-neutral-100"}`}
                      >
                        {c.iaPausada ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteConversa(c.telefone); }}
                        disabled={excluindoConversa === c.telefone}
                        title="Excluir conversa"
                        className="p-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {conversaSelecionada?.telefone === c.telefone && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 border-t border-neutral-100 pt-4 overflow-hidden">
                        {/* Conversa completa (não só as últimas mensagens), com rolagem própria e
                            quebra de linha correta — antes o texto ficava sem "whitespace-pre-wrap"
                            e só as últimas 6 mensagens apareciam, dando a impressão de mensagem
                            cortada e de conversa incompleta. */}
                        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1" onClick={(e) => e.stopPropagation()}>
                          {c.mensagens.map((m, j) => (
                            <div key={j} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${m.role === "user" ? "bg-neutral-100 text-neutral-700" : "bg-[#25D366]/10 text-neutral-800"}`}>
                                <p className="text-[10px] text-neutral-400 mb-0.5 font-medium">{m.role === "user" ? "Paciente" : "IA"}</p>
                                {m.conteudo}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── DIAS DE ATENDIMENTO ─────────────────── */}
        {aba === "dias_atendimento" && (
          <motion.div key="dias" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* Cabeçalho com contagem por local — visão rápida sem precisar trocar de aba */}
            <div className="grid grid-cols-2 gap-4">
              {LOCAIS.map(local => {
                const count = diasAtendimento.filter(d => d.local === local).length;
                const ativo = localCalendario === local;
                return (
                  <button
                    key={local}
                    onClick={() => setLocalCalendario(local)}
                    className={`text-left rounded-2xl p-5 border transition-all ${
                      ativo
                        ? "bg-gradient-to-br from-[#0A0A0A] to-neutral-800 border-neutral-900 text-white shadow-lg shadow-neutral-900/10"
                        : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-mono uppercase tracking-wider ${ativo ? "text-white/60" : "text-neutral-400"}`}>{local}</p>
                      <Calendar className={`w-4 h-4 ${ativo ? "text-[#C9A96E]" : "text-neutral-300"}`} />
                    </div>
                    <p className="text-3xl font-bold mt-2" style={{ fontFamily: "Georgia, serif" }}>{count}</p>
                    <p className={`text-xs mt-0.5 ${ativo ? "text-white/70" : "text-neutral-400"}`}>dia(s) de atendimento marcado(s)</p>
                  </button>
                );
              })}
            </div>

            {localCalendario === "Fátima do Sul" && (
              <div className="flex items-center gap-2 text-xs text-neutral-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                A IA ainda não agenda sozinha em Fátima do Sul — esses dias ficam registrados aqui só para controle da equipe.
              </div>
            )}

            {/* Calendário grande e visual — sempre visível, sem precisar expandir nada */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <button onClick={irParaMesAnterior} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5 text-neutral-500" />
                  </button>
                  <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl sm:text-3xl text-[#0A0A0A] w-56 text-center capitalize">
                    {MESES[mesCalendario]} <span className="text-neutral-400">{anoCalendario}</span>
                  </h2>
                  <button onClick={irParaProximoMes} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                    <ChevronRight className="w-5 h-5 text-neutral-500" />
                  </button>
                </div>
                <div className="flex gap-1 bg-neutral-100 p-1 rounded-lg">
                  {LOCAIS.map(local => (
                    <button
                      key={local}
                      onClick={() => setLocalCalendario(local)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        localCalendario === local ? "bg-white text-[#0A0A0A] shadow-sm" : "text-neutral-500 hover:text-neutral-700"
                      }`}
                    >
                      {local}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-7 text-center text-xs font-mono text-neutral-400 font-bold border-b border-neutral-100 pb-3 mb-2">
                {DIAS_SEMANA_LABEL.map(d => <span key={d}>{d}</span>)}
              </div>

              <div className="grid grid-cols-7 gap-2 sm:gap-3">
                {calendarCells.map((cell, i) => {
                  if (cell.num === null) return <div key={i} />;
                  const marcado = diasDoLocalSet.has(cell.iso!);
                  const dia = diasDoLocalSet.get(cell.iso!);
                  const isHoje = cell.iso === toISODate(hoje);
                  const passado = cell.iso! < toISODate(hoje);
                  const diaSemanaNum = new Date(cell.iso + "T12:00:00").getDay();
                  const bloqueioData = datasBloqueadas.get(cell.iso!);
                  const bloqueado = !!bloqueioData || diasSemanaBloqueados.has(diaSemanaNum);
                  const carregandoEsteDia = diaClicando === cell.iso;
                  return (
                    <button
                      key={i}
                      onClick={() => !passado && !bloqueado && toggleDia(cell.iso!)}
                      disabled={passado || bloqueado || carregandoEsteDia}
                      title={
                        bloqueado
                          ? `Bloqueado${bloqueioData?.motivo ? ": " + bloqueioData.motivo : " (dia da semana)"}`
                          : dia?.horarios?.length ? `Horário personalizado: ${dia.horarios.join(", ")}` : undefined
                      }
                      className={`relative rounded-xl h-14 sm:h-16 flex flex-col items-center justify-center text-sm font-semibold transition-all border ${
                        bloqueado
                          ? "bg-red-50 border-red-100 text-red-300 line-through"
                          : marcado
                          ? "bg-gradient-to-br from-[#C9A96E] to-[#b3925c] border-[#C9A96E] text-white shadow-md shadow-[#C9A96E]/30 scale-[1.02]"
                          : isHoje
                          ? "bg-neutral-100 border-neutral-300 text-neutral-700"
                          : "bg-white border-neutral-100 text-neutral-600 hover:border-[#C9A96E]/40 hover:bg-[#C9A96E]/5"
                      } ${passado ? "opacity-25 cursor-not-allowed" : bloqueado ? "cursor-not-allowed" : "cursor-pointer hover:scale-[1.03]"}`}
                    >
                      {carregandoEsteDia ? <RefreshCw className="w-4 h-4 animate-spin" /> : cell.num}
                      {isHoje && !marcado && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#C9A96E]" />
                      )}
                      {marcado && dia?.horarios?.length ? (
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white/80" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* Legenda */}
              <div className="flex flex-wrap items-center gap-4 mt-6 pt-5 border-t border-neutral-100 text-xs text-neutral-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-gradient-to-br from-[#C9A96E] to-[#b3925c]" /> Dia de atendimento</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-neutral-100 border border-neutral-300" /> Hoje</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-neutral-400" /> Horário personalizado nesse dia</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-red-50 border border-red-100" /> Bloqueado</span>
                <span className="ml-auto text-neutral-400">Clique num dia para marcar ou desmarcar</span>
              </div>
            </div>

            {/* Bloqueios e Feriados — vale para as duas unidades, tem prioridade
                sobre os dias marcados no calendário acima (ver checkAvailability
                em src/services/whatsappCore.ts). */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <Ban className="w-4 h-4 text-red-500" />
                <h3 className="font-semibold text-neutral-800">Bloqueios e Feriados</h3>
              </div>
              <p className="text-xs text-neutral-400 mb-5">
                Dias bloqueados aqui nunca são oferecidos pela IA, mesmo que apareçam marcados no calendário acima. Vale para Toledo e Fátima do Sul.
              </p>

              {/* Fins de semana recorrentes */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[{ dia: 6, label: "Sábado" }, { dia: 0, label: "Domingo" }].map(({ dia, label }) => {
                  const ativo = diasSemanaBloqueados.has(dia);
                  const carregando = salvandoBloqueioId === `semana::${dia}`;
                  return (
                    <button
                      key={dia}
                      onClick={() => toggleBloqueioSemana(dia)}
                      disabled={carregando}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all disabled:opacity-50 ${
                        ativo ? "bg-red-50 border-red-200 text-red-700" : "bg-neutral-50 border-neutral-200 text-neutral-600"
                      }`}
                    >
                      <span className="text-sm font-medium">{label}</span>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${ativo ? "bg-red-100 text-red-600" : "bg-neutral-200 text-neutral-500"}`}>
                        {carregando ? "..." : ativo ? "Bloqueado" : "Livre"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Bloquear uma data específica manualmente */}
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <input
                  type="date"
                  value={novoFeriadoData}
                  onChange={e => setNovoFeriadoData(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-700 focus:outline-none focus:border-[#C9A96E]"
                />
                <input
                  type="text"
                  placeholder="Motivo (opcional) — ex: viagem, feriado"
                  value={novoFeriadoMotivo}
                  onChange={e => setNovoFeriadoMotivo(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-700 focus:outline-none focus:border-[#C9A96E]"
                />
                <button
                  onClick={handleAdicionarFeriado}
                  disabled={!novoFeriadoData || salvandoFeriado}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#0A0A0A] text-white text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40"
                >
                  <Ban className="w-3.5 h-3.5" /> Bloquear data
                </button>
              </div>

              {/* Próximos feriados nacionais — um clique pra bloquear */}
              <div className="mb-5">
                <p className="text-[11px] text-neutral-400 mb-2">Próximos feriados nacionais — clique para bloquear:</p>
                <div className="flex flex-wrap gap-1.5">
                  {proximosFeriados.filter(f => !datasBloqueadas.has(f.data)).map(f => (
                    <button
                      key={f.data}
                      onClick={() => adicionarBloqueioData(f.data, f.nome)}
                      disabled={salvandoBloqueioId === `data::${f.data}`}
                      className="px-2.5 py-1.5 rounded-lg border border-neutral-200 text-[11px] text-neutral-600 hover:border-[#C9A96E] hover:text-[#C9A96E] transition-colors disabled:opacity-40"
                    >
                      {formatarDataCurta(f.data)} · {f.nome}
                    </button>
                  ))}
                  {proximosFeriados.filter(f => !datasBloqueadas.has(f.data)).length === 0 && (
                    <span className="text-xs text-neutral-300">Todos os próximos feriados já estão bloqueados.</span>
                  )}
                </div>
              </div>

              {/* Datas específicas já bloqueadas */}
              {carregandoBloqueios ? (
                <div className="flex items-center gap-2 py-4 text-neutral-400 text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Carregando bloqueios...
                </div>
              ) : datasBloqueadas.size === 0 ? (
                <p className="text-xs text-neutral-300">Nenhuma data específica bloqueada ainda.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {[...datasBloqueadas.values()].sort((a, b) => (a.data || "").localeCompare(b.data || "")).map(b => (
                    <span key={b.id} className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-lg bg-red-50 border border-red-100 text-[11px] text-red-700">
                      {formatarDataCurta(b.data!)}{b.motivo ? ` · ${b.motivo}` : ""}
                      <button
                        onClick={() => removerBloqueio(b.id)}
                        disabled={salvandoBloqueioId === b.id}
                        className="p-0.5 rounded hover:bg-red-100 disabled:opacity-40"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Painel dos dias já marcados no mês/local selecionado */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-800">Dias marcados em {localCalendario}</h3>
                <span className="text-xs text-neutral-400">{diasDoLocalOrdenados.length} no total</span>
              </div>

              {carregandoDias && (
                <div className="flex items-center gap-2 py-6 text-neutral-400 text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Carregando...
                </div>
              )}

              {!carregandoDias && diasDoLocalOrdenados.length === 0 && (
                <div className="text-center py-8 border border-dashed border-neutral-200 rounded-xl">
                  <Calendar className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-400">Nenhum dia marcado ainda. Clique nos dias do calendário acima para começar.</p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {diasDoLocalOrdenados.map(dia => (
                  <div key={dia.id} className="rounded-xl border border-neutral-200 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2.5 bg-neutral-50">
                      <div>
                        <p className="text-sm font-semibold text-neutral-800 capitalize">{formatarDataCurta(dia.data)}</p>
                        {dia.horarios?.length ? (
                          <p className="text-[10px] text-[#C9A96E] font-medium">Horário personalizado</p>
                        ) : (
                          <p className="text-[10px] text-neutral-400">Horário padrão</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => diaEditandoId === dia.id ? setDiaEditandoId(null) : abrirEdicaoHorarios(dia)}
                          title="Editar horário deste dia"
                          className="p-1.5 rounded-md text-neutral-400 hover:text-[#C9A96E] hover:bg-[#C9A96E]/10 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removerDia(dia)}
                          title="Remover este dia"
                          className="p-1.5 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {diaEditandoId === dia.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-neutral-100 px-3 py-3 overflow-hidden bg-white"
                        >
                          <p className="text-[10px] text-neutral-500 mb-2">Horários disponíveis nesse dia:</p>
                          <div className="flex flex-wrap gap-1.5 mb-2.5">
                            {HORARIOS_PADRAO.map(h => (
                              <button
                                key={h}
                                onClick={() => alternarHorarioEditando(h)}
                                className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                                  horariosEditando.includes(h)
                                    ? "bg-[#C9A96E] border-[#C9A96E] text-white"
                                    : "bg-white border-neutral-200 text-neutral-500"
                                }`}
                              >
                                {h}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={salvarHorariosEditando}
                              disabled={salvandoHorarios}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#0A0A0A] text-white text-[11px] font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40"
                            >
                              <Check className="w-3 h-3" /> Salvar
                            </button>
                            {dia.horarios?.length ? (
                              <button
                                onClick={() => resetarHorarioPadrao(dia)}
                                className="text-[11px] text-neutral-500 hover:text-neutral-700 underline"
                              >
                                Usar horário padrão
                              </button>
                            ) : null}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── CONFIGURAÇÕES DA IA (Fase 2) ─────────── */}
        {aba === "config_ia" && (
          <motion.div key="config_ia" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="flex items-center gap-2 text-xs text-neutral-600 bg-[#C9A96E]/10 border border-[#C9A96E]/30 rounded-xl px-4 py-3">
              <Brain className="w-4 h-4 shrink-0 text-[#C9A96E]" />
              Mude preços, chave Pix e ensine novas regras pra Eduarda aqui — sem precisar pedir nenhuma alteração de código. As mudanças valem a partir da próxima mensagem respondida.
            </div>

            {carregandoConfigIa ? (
              <div className="flex items-center gap-2 py-10 text-neutral-400 text-sm justify-center">
                <RefreshCw className="w-4 h-4 animate-spin" /> Carregando configurações...
              </div>
            ) : (
              <>
                {/* Preços e Pix */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                  <h3 className="font-semibold text-neutral-800 mb-1">Preços e Pix</h3>
                  <p className="text-xs text-neutral-400 mb-5">Valores que a Eduarda usa em toda conversa — sinal, consulta e a chave Pix pra pagamento.</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-neutral-500 mb-1 block">Valor do sinal (R$)</label>
                      <input
                        type="number"
                        min={0}
                        value={configIa.valorSinal}
                        onChange={e => setConfigIa(prev => ({ ...prev, valorSinal: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-700 focus:outline-none focus:border-[#C9A96E]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-500 mb-1 block">Valor da consulta (R$)</label>
                      <input
                        type="number"
                        min={0}
                        value={configIa.valorConsulta}
                        onChange={e => setConfigIa(prev => ({ ...prev, valorConsulta: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-700 focus:outline-none focus:border-[#C9A96E]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-neutral-500 mb-1 block">Chave Pix</label>
                      <input
                        type="text"
                        value={configIa.chavePix}
                        onChange={e => setConfigIa(prev => ({ ...prev, chavePix: e.target.value }))}
                        placeholder="CNPJ, CPF, e-mail ou telefone"
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-700 focus:outline-none focus:border-[#C9A96E]"
                      />
                    </div>
                  </div>
                </div>

                {/* Ensinar a IA */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                  <h3 className="font-semibold text-neutral-800 mb-1">Ensinar a Eduarda</h3>
                  <p className="text-xs text-neutral-400 mb-3">
                    Escreva aqui regras ou orientações extras — a Eduarda passa a seguir isso em toda conversa, com prioridade sobre o restante. Ex: "nunca ofereça parcelamento de procedimento acima de 5x", "se perguntarem sobre o Instagram, mande @dramariahzibetti", "pacientes de retorno não precisam pagar sinal".
                  </p>
                  <textarea
                    value={configIa.instrucoesExtras}
                    onChange={e => setConfigIa(prev => ({ ...prev, instrucoesExtras: e.target.value }))}
                    rows={8}
                    placeholder="Escreva uma regra por linha..."
                    className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 text-sm text-neutral-700 focus:outline-none focus:border-[#C9A96E] resize-y"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={salvarConfigIa}
                    disabled={salvandoConfigIa}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0A0A0A] text-white text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40"
                  >
                    {salvandoConfigIa ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar configurações
                  </button>
                  {configIaSalvaOk && (
                    <span className="flex items-center gap-1.5 text-sm text-green-600">
                      <Check className="w-4 h-4" /> Salvo!
                    </span>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ── CONFIGURAR ──────────────────────────── */}
        {aba === "configurar" && (
          <motion.div key="cfg" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* Conectar WhatsApp — autoconexão via QR Code, sem painel técnico */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-[#25D366]/10 flex items-center justify-center">
                  <Smartphone className="w-4.5 h-4.5 text-[#25D366]" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">Conectar WhatsApp da Clínica</h3>
                  <p className="text-xs text-neutral-500">Escaneie o código com o celular da clínica, como no WhatsApp Web</p>
                </div>
              </div>

              {conectado === null && (
                <div className="flex items-center justify-center gap-2 py-10 text-neutral-400 text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Checando conexão...
                </div>
              )}

              {conectado === true && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-5 flex items-center gap-3">
                  <CheckCheck className="w-6 h-6 text-green-600 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-800 text-sm">WhatsApp conectado</p>
                    <p className="text-xs text-green-700 mt-0.5">A IA já está respondendo pela linha da clínica.</p>
                  </div>
                  <button
                    onClick={handleDesconectar}
                    disabled={desconectando}
                    className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    {desconectando ? "Desconectando..." : "Desconectar"}
                  </button>
                </div>
              )}

              {conectado === false && (
                <div className="flex flex-col items-center gap-4 py-2">
                  {qrLoading && (
                    <div className="w-56 h-56 flex items-center justify-center bg-neutral-50 border border-neutral-200 rounded-xl">
                      <RefreshCw className="w-6 h-6 text-neutral-400 animate-spin" />
                    </div>
                  )}
                  {!qrLoading && qr?.base64 && (
                    <img
                      src={qr.base64.startsWith("data:") ? qr.base64 : `data:image/png;base64,${qr.base64}`}
                      alt="QR Code para conectar o WhatsApp"
                      className="w-56 h-56 rounded-xl border border-neutral-200 p-2 bg-white"
                    />
                  )}
                  {!qrLoading && qrErro && (
                    <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 text-center">
                      {qrErro}
                    </div>
                  )}
                  <p className="text-xs text-neutral-500 text-center max-w-xs">
                    No celular da clínica: abra o WhatsApp → Configurações → Aparelhos conectados → Conectar um aparelho, e aponte a câmera para o código acima.
                  </p>
                  <button
                    onClick={carregarQr}
                    disabled={qrLoading}
                    className="flex items-center gap-2 px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors disabled:opacity-40"
                  >
                    <RefreshCw className={`w-4 h-4 ${qrLoading ? "animate-spin" : ""}`} /> Gerar novo código
                  </button>
                </div>
              )}
            </div>

            {/* Notificação Dra */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <BellRing className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">Notificação da Dra. Mariah</h3>
                  <p className="text-xs text-neutral-500">WhatsApp pessoal para receber alertas de agendamento</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">WhatsApp da Dra. (com DDI)</label>
                <input
                  type="text"
                  value={config.whatsappDra}
                  onChange={e => setConfig(p => ({ ...p, whatsappDra: e.target.value }))}
                  placeholder="5544999990000"
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm font-mono focus:outline-none focus:border-[#C9A96E] bg-neutral-50"
                />
                <p className="text-xs text-neutral-400 mt-1.5">Formato: 55 + DDD + número (sem espaços ou traços).</p>
              </div>
            </div>

            {/* IA Toggle */}
            <div className="bg-white border border-neutral-200 rounded-xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot className="w-5 h-5 text-neutral-500" />
                <div>
                  <p className="font-medium text-neutral-800 text-sm">IA Secretária Ativa</p>
                  <p className="text-xs text-neutral-500">Quando inativa, mensagens não são respondidas automaticamente</p>
                </div>
              </div>
              <button
                onClick={() => setConfig(p => ({ ...p, iaAtiva: !p.iaAtiva }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${config.iaAtiva ? "bg-[#25D366]" : "bg-neutral-300"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.iaAtiva ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>

            {/* Save */}
            <button
              onClick={salvarConfig}
              disabled={salvando}
              className="w-full py-3 bg-[#0A0A0A] text-white rounded-xl font-semibold text-sm hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {salvando ? <RefreshCw className="w-4 h-4 animate-spin" /> : salvoOk ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Shield className="w-4 h-4" />}
              {salvando ? "Salvando..." : salvoOk ? "Configurações salvas!" : "Salvar configurações"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
