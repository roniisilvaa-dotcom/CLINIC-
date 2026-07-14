import React, { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";

import LoginScreen from "./components/LoginScreen";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import PacientesModulo from "./components/PacientesMódulo";
import AgendaModulo from "./components/AgendaMódulo";
import IaAssistente from "./components/IaAssistente";
import PrescricoesModulo from "./components/PrescricoesMódulo";
import NovaConsulta from "./components/NovaConsulta";
import GaleriaGlobal from "./components/GaleriaGlobal";
import PlanosAssinaturas from "./components/PlanosAssinaturas";
import PortalPaciente from "./components/PortalPaciente";
import FinanceiroModulo from "./components/FinanceiroMódulo";
import PainelDesenvolvedor from "./components/PainelDesenvolvedor";
import WhatsAppBot from "./components/WhatsAppBot";

import { Paciente, AlertaClinico, EventoAgenda, ConsultaHistorial } from "./types";

type UserRole = "medica" | "paciente" | "dev";

type TabOption =
  | "dashboard" | "pacientes" | "nova_consulta" | "agenda"
  | "prescricoes" | "financeiro" | "galeria_capilar"
  | "ia_assistente" | "planos" | "dev_panel"
  | "whatsapp_bot";

interface Message {
  id: string;
  sender: "medica" | "paciente";
  content: string;
  timestamp: string;
}

const TOKEN_KEY = "caro_clinic_token";

async function api(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(path, { ...opts, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro ${res.status} em ${path}`);
  }
  return res.json();
}

// Monta a lista de pacientes "completa" (formato usado pelas telas clínicas)
// juntando a tabela pacientes com consultas / exames / galeria vindos do backend.
function montarPacientesCompletos(
  pacientesRaw: any[],
  consultas: any[],
  exames: any[],
  galeriaFotos: any[]
): Paciente[] {
  return pacientesRaw.map((p) => ({
    id: p.id,
    nome: p.nome,
    idade: p.idade,
    dataNascimento: p.dataNascimento,
    cpf: p.cpf,
    telefone: p.telefone,
    email: p.email,
    cidade: p.cidade,
    comoConheceu: p.comoConheceu || "",
    queixaPrincipal: p.queixaPrincipal,
    status: p.status,
    progresso: p.progresso ?? 0,
    ultimaAtualizacao: p.ultimaAtualizacao,
    antecedentes: p.antecedentes,
    diagnostico: p.diagnostico,
    protocolo: p.protocolo,
    exames: exames.filter((e) => e.pacienteId === p.id),
    galeria: galeriaFotos.filter((g) => g.pacienteId === p.id),
    consultas: consultas.filter((c) => c.pacienteId === p.id),
      tags: Array.isArray(p.tags) ? p.tags : [],
  }));
}

// Gera alertas clínicos simples a partir dos dados reais (sem exame cadastrado,
// ou paciente em tratamento sem atualização há mais de 30 dias).
function gerarAlertas(pacientes: Paciente[]): AlertaClinico[] {
  const alertas: AlertaClinico[] = [];
  const hoje = new Date();
  for (const p of pacientes) {
    if (p.status !== "Em Tratamento") continue;
    if (p.exames.length === 0) {
      alertas.push({
        id: `al-exame-${p.id}`,
        pacienteId: p.id,
        pacienteNome: p.nome,
        tipo: "exame_pendente",
        mensagem: `${p.nome} ainda não possui exames laboratoriais cadastrados.`,
        severidade: "warning",
      });
    }
    const dias = Math.floor((hoje.getTime() - new Date(p.ultimaAtualizacao).getTime()) / 86400000);
    if (!isNaN(dias) && dias > 30) {
      alertas.push({
        id: `al-retorno-${p.id}`,
        pacienteId: p.id,
        pacienteNome: p.nome,
        tipo: "retorno_vencido",
        mensagem: `${p.nome} está sem atualização há ${dias} dias.`,
        severidade: "error",
      });
    }
  }
  return alertas;
}

function montarAgenda(agendaRaw: any[], pacientes: Paciente[]): EventoAgenda[] {
  const nomeMap = new Map(pacientes.map((p) => [p.id, p.nome]));
  return agendaRaw.map((ev) => ({
    id: ev.id,
    pacienteId: ev.pacienteId,
    pacienteNome: nomeMap.get(ev.pacienteId) || "Paciente",
    data: ev.data,
    horario: ev.horario,
    tipo: ev.tipo,
    status: ev.status,
    diagnosticoResumo: ev.diagnosticoResumo || "",
  }));
}

export default function App() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole]               = useState<UserRole>("medica");
  const [medicaNome, setMedicaNome]           = useState("Dra. Mariah Zibetti");
  const [loggedPacienteId, setLoggedPacienteId] = useState<string | null>(null);

  const [patientChats, setPatientChats] = useState<Record<string, Message[]>>({});

  const [currentTab, setCurrentTab]   = useState<TabOption>("dashboard");
  const [collapsed, setCollapsed]     = useState(false);
  // Plano real e atual da Dra. Mariah: Standard Clínica IA.
  const [activePlan, setActivePlan]   = useState<"Standard" | "Precision" | "Enterprise">("Standard");
  const [aiRunsCounter, setAiRunsCounter] = useState(0);

  const [pacientes, setPacientes]     = useState<Paciente[]>([]);
  const [alertas, setAlertas]         = useState<AlertaClinico[]>([]);
  const [agendaHoje, setAgendaHoje]   = useState<EventoAgenda[]>([]);
  const [loadingDados, setLoadingDados] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);

  const activePacienteForConsulta = pacientes.find(p => p.id === selectedPacienteId) || null;

  // Carrega os dados clínicos essenciais (chamado após autenticação).
  // OBS: a Galeria Capilar (fotos em base64) fica de fora de propósito — ela é
  // pesada (cada paciente pode ter várias fotos grandes) e a maioria das telas
  // (Dashboard, Agenda, Financeiro, Prescrições...) nem usa isso. As fotos são
  // buscadas sob demanda em carregarGaleriaPara(), só quando a tela que precisa
  // delas é realmente aberta — assim o login e a navegação ficam leves.
  const carregarDadosCompletos = useCallback(async () => {
    setLoadingDados(true);
    try {
      const [pacientesRaw, consultas, exames, agendaRaw] = await Promise.all([
        api("/api/pacientes"),
        api("/api/consultas"),
        api("/api/exames"),
        api("/api/agenda"),
      ]);
      const completos = montarPacientesCompletos(pacientesRaw, consultas, exames, []);
      setPacientes(completos);
      setAlertas(gerarAlertas(completos));
      setAgendaHoje(montarAgenda(agendaRaw, completos));
    } catch (err) {
      console.error("Erro ao carregar dados clínicos:", err);
    }
    setLoadingDados(false);
  }, []);

  // Busca as fotos da Galeria Capilar sob demanda. Sem pacienteId, busca de
  // todo mundo (usado na Galeria Capilar global); com pacienteId, busca só
  // daquele paciente (usado no prontuário individual e no Portal do Paciente).
  const galeriaCompletaCarregadaRef = useRef(false);
  const carregarGaleriaPara = useCallback(async (pacienteId?: string) => {
    try {
      const url = pacienteId ? `/api/galeria?pacienteId=${pacienteId}` : "/api/galeria";
      const galeriaFotos: any[] = await api(url);
      setPacientes(prev => prev.map((p) => {
        if (pacienteId && p.id !== pacienteId) return p;
        return { ...p, galeria: galeriaFotos.filter((g) => g.pacienteId === p.id) };
      }));
      if (!pacienteId) galeriaCompletaCarregadaRef.current = true;
    } catch (err) {
      console.error("Erro ao carregar galeria:", err);
    }
  }, []);

  // Carrega a galeria completa (de todos os pacientes) só quando a médica
  // realmente abre uma tela que precisa dela — Pacientes (prontuário individual)
  // ou Galeria Capilar (catálogo geral). Só busca uma vez por sessão.
  useEffect(() => {
    if (!isAuthenticated || userRole === "paciente") return;
    if (currentTab !== "pacientes" && currentTab !== "galeria_capilar") return;
    if (galeriaCompletaCarregadaRef.current) return;
    carregarGaleriaPara();
  }, [currentTab, isAuthenticated, userRole, carregarGaleriaPara]);

  // Ao montar: tenta restaurar sessão salva (só da médica, que usa token real).
  // Antes essa checagem também baixava a lista COMPLETA de pacientes (CPF,
  // diagnóstico, tudo) pro navegador de QUALQUER visitante do site, mesmo sem
  // login nenhum — só pra permitir a checagem de CPF no portal do paciente ser
  // feita no cliente. Isso saiu daqui: o login de paciente agora valida o CPF
  // no servidor (/api/auth/paciente-login, em LoginScreen.tsx), então nenhum
  // dado de paciente é baixado antes de alguém realmente se autenticar.
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        try {
          const me = await api("/api/auth/me");
          setUserRole("medica");
          setMedicaNome(me.nome);
          setIsAuthenticated(true);
          await carregarDadosCompletos();
        } catch {
          localStorage.removeItem(TOKEN_KEY);
        }
      }
      setCheckingSession(false);
    })();
  }, [carregarDadosCompletos]);

  const handleLogin = async (role: "medica" | "paciente" | "dev", data?: string, token?: string) => {
    setUserRole(role);
    if (role === "medica") {
      if (data) setMedicaNome(data);
      if (token) localStorage.setItem(TOKEN_KEY, token);
      setIsAuthenticated(true);
      await carregarDadosCompletos();
    } else if (role === "paciente" && data) {
      // "data" já vem como o id do paciente, resolvido no servidor pelo CPF
      // (ver /api/auth/paciente-login) — não precisa mais procurar numa lista
      // pré-carregada no cliente.
      setLoggedPacienteId(data);
      setIsAuthenticated(true);
      await carregarDadosCompletos();
      // Paciente só precisa da própria galeria (leve) — não da de todo mundo.
      await carregarGaleriaPara(data);
    } else {
      setIsAuthenticated(true);
      await carregarDadosCompletos();
    }
  };

  const handleLogout = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    setIsAuthenticated(false);
    setLoggedPacienteId(null);
    setCurrentTab("dashboard");
  };

  const handleSaveNewConsultation = async (pacienteId: string, novaConsulta: ConsultaHistorial) => {
    try {
      await api("/api/consultas", {
        method: "POST",
        body: JSON.stringify({
          id: novaConsulta.id,
          pacienteId,
          data: novaConsulta.data,
          tipo: novaConsulta.tipo,
          queixa: novaConsulta.queixa,
          evolucao: novaConsulta.evolucao,
          alteracoesProtocolo: novaConsulta.alteracoesProtocolo,
          examesSolicitados: novaConsulta.examesSolicitados,
          resumoIa: novaConsulta.resumoIa || null,
        }),
      });
      const pacienteAtual = pacientes.find((p) => p.id === pacienteId);
      const novoProgresso = Math.min(100, (pacienteAtual?.progresso || 0) + 15);
      await api(`/api/pacientes/${pacienteId}`, {
        method: "PUT",
        body: JSON.stringify({ progresso: novoProgresso, ultimaAtualizacao: novaConsulta.data }),
      });
    } catch (err) {
      console.error("Erro ao salvar consulta:", err);
    }
    setPacientes(prev => prev.map(p => p.id === pacienteId
      ? { ...p, progresso: Math.min(100, p.progresso + 15), ultimaAtualizacao: novaConsulta.data, consultas: [novaConsulta, ...p.consultas] }
      : p
    ));
    setAgendaHoje(prev => prev.map(evt => evt.pacienteId === pacienteId ? { ...evt, status: "Realizada" as const } : evt));
    setAlertas(prev => prev.filter(a => a.pacienteId !== pacienteId));
    setCurrentTab("pacientes");
  };

  // Cria um novo evento de agenda a partir do modal "Novo Agendamento" (AgendaModulo).
  const handleCreateEvento = async (dados: {
    pacienteId: string;
    data: string;
    horario: string;
    tipo: EventoAgenda["tipo"];
    procedimentoTag: string;
    duracaoMinutos: number;
    status: EventoAgenda["status"];
    diagnosticoResumo?: string;
  }) => {
    const id = `evt-${Date.now()}`;
    await api("/api/agenda", {
      method: "POST",
      body: JSON.stringify({
        id,
        pacienteId: dados.pacienteId,
        data: dados.data,
        horario: dados.horario,
        tipo: dados.tipo,
        procedimentoTag: dados.procedimentoTag,
        duracaoMinutos: dados.duracaoMinutos,
        status: dados.status,
        diagnosticoResumo: dados.diagnosticoResumo || "",
      }),
    });
    const paciente = pacientes.find((p) => p.id === dados.pacienteId);
    const novoEvento: EventoAgenda = {
      id,
      pacienteId: dados.pacienteId,
      pacienteNome: paciente?.nome || "Paciente",
      data: dados.data,
      horario: dados.horario,
      tipo: dados.tipo,
      status: dados.status,
      diagnosticoResumo: dados.diagnosticoResumo || dados.procedimentoTag || "",
    };
    setAgendaHoje(prev => [...prev, novoEvento]);
  };

  const handleSendPatientMessage = (pacienteId: string, content: string, sender: "medica" | "paciente") => {
    const ts = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const msg: Message = { id: `msg-${Date.now()}`, sender, content, timestamp: ts };
    setPatientChats(prev => ({ ...prev, [pacienteId]: [...(prev[pacienteId] || []), msg] }));
  };

  // ── Checando sessão salva ──
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Não autenticado ──
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} pacientes={pacientes} />;
  }

  // ── Portal do Paciente ──
  if (userRole === "paciente") {
    const loggedPaciente = pacientes.find(p => p.id === loggedPacienteId);
    if (loggedPaciente) {
      return (
        <PortalPaciente
          paciente={loggedPaciente}
          onLogout={handleLogout}
          patientChat={patientChats[loggedPaciente.id] || []}
          onSendMessage={(content) => handleSendPatientMessage(loggedPaciente.id, content, "paciente")}
        />
      );
    }
    handleLogout();
    return null;
  }

  // ── Painel Clínico (Médica ou Dev) ──
  return (
    <div className="flex min-h-screen bg-[#FAFAFA] text-[#0A0A0A] font-sans antialiased overflow-x-hidden selection:bg-[#C9A84C]/35">
      <Sidebar
        currentTab={currentTab === "nova_consulta" ? "pacientes" : currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab as TabOption);
          if (tab !== "pacientes") setSelectedPacienteId(null);
        }}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        onLogout={handleLogout}
        userRole={userRole}
        medicaNome={medicaNome}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 overflow-y-auto">
        {loadingDados && (
          <div className="mb-4 text-xs font-mono text-neutral-500 flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
            Sincronizando dados...
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {currentTab === "dashboard" && (
              <Dashboard pacientes={pacientes} alertas={alertas} agendaHoje={agendaHoje}
                onStartConsulta={(id) => { setSelectedPacienteId(id); setCurrentTab("nova_consulta"); }}
                onViewPaciente={(id) => { setSelectedPacienteId(id); setCurrentTab("pacientes"); }} />
            )}
            {currentTab === "pacientes" && (
              <PacientesModulo pacientes={pacientes} onChangePacientes={setPacientes}
                selectedPacienteId={selectedPacienteId} onSelectPaciente={setSelectedPacienteId}
                onOpenNovaConsulta={(id) => { setSelectedPacienteId(id); setCurrentTab("nova_consulta"); }}
                patientChats={patientChats}
                onSendDoctorMessage={(pId, text) => handleSendPatientMessage(pId, text, "medica")}
                activePlan={activePlan} aiRunsCounter={aiRunsCounter}
                onIncrementAiRuns={() => setAiRunsCounter(p => p + 1)} />
            )}
            {currentTab === "nova_consulta" && activePacienteForConsulta && (
              <NovaConsulta paciente={activePacienteForConsulta}
                onClose={() => setCurrentTab("pacientes")} onSave={handleSaveNewConsultation} />
            )}
            {currentTab === "nova_consulta" && !activePacienteForConsulta && (
              <div className="text-center py-20 border border-dashed border-gray-300 bg-white rounded-xl space-y-4 max-w-lg mx-auto">
                <p style={{ fontFamily: "Georgia, serif" }} className="text-gray-600">Nenhum paciente selecionado.</p>
                <button onClick={() => setCurrentTab("pacientes")}
                  className="bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black text-xs font-mono uppercase px-5 py-2.5 rounded-lg cursor-pointer transition">
                  Selecionar Paciente
                </button>
              </div>
            )}
            {currentTab === "agenda" && (
              <AgendaModulo agendaHoje={agendaHoje} pacientes={pacientes}
                onViewPaciente={(id) => { setSelectedPacienteId(id); setCurrentTab("pacientes"); }}
                onOpenNovaConsulta={(id) => { setSelectedPacienteId(id); setCurrentTab("nova_consulta"); }}
                onCreateEvento={handleCreateEvento} />
            )}
            {currentTab === "ia_assistente" && (
              <IaAssistente pacientes={pacientes} activePlan={activePlan}
                aiRunsCounter={aiRunsCounter} onIncrementAiRuns={() => setAiRunsCounter(p => p + 1)} />
            )}
            {currentTab === "prescricoes"    && <PrescricoesModulo />}
            {currentTab === "financeiro"     && <FinanceiroModulo pacientes={pacientes} />}
            {currentTab === "galeria_capilar" && (
              <GaleriaGlobal pacientes={pacientes}
                onViewPaciente={(id) => { setSelectedPacienteId(id); setCurrentTab("pacientes"); }} />
            )}
            {currentTab === "planos" && (
              <PlanosAssinaturas activePlan={activePlan} onChangeActivePlan={setActivePlan} />
            )}
            {currentTab === "dev_panel" && userRole === "dev" && <PainelDesenvolvedor />}
            {currentTab === "whatsapp_bot" && <WhatsAppBot />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
