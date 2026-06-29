import React, { useState } from "react";
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

import { MOCK_PACIENTES, MOCK_ALERTAS, MOCK_AGENDA_HOJE } from "./mockData";
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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole]               = useState<UserRole>("medica");
  const [medicaNome, setMedicaNome]           = useState("Dra. Mariah Zibetti");
  const [loggedPacienteId, setLoggedPacienteId] = useState<string | null>(null);

  const [patientChats, setPatientChats] = useState<Record<string, Message[]>>({
    "paciente-1": [
      { id: "ch-11", sender: "medica",   content: "Olá Helena! Como está se adaptando ao novo xampu medicamentoso?", timestamp: "08:15" },
      { id: "ch-12", sender: "paciente", content: "Doutora, sinto que a descamação melhorou muito, quase não coça mais!", timestamp: "09:30" },
    ],
    "paciente-2": [
      { id: "ch-21", sender: "medica", content: "Gabriela, agendei seu retorno para realizarmos o pull test preventivo.", timestamp: "11:00" },
    ],
    "paciente-3": [
      { id: "ch-31", sender: "medica", content: "Roberto, seu repovoamento de coroa está excelente no acompanhamento fotográfico.", timestamp: "14:00" },
    ],
  });

  const [currentTab, setCurrentTab]   = useState<TabOption>("dashboard");
  const [collapsed, setCollapsed]     = useState(false);
  const [activePlan, setActivePlan]   = useState<"Standard" | "Precision" | "Enterprise">("Precision");
  const [aiRunsCounter, setAiRunsCounter] = useState(2);
  const [pacientes, setPacientes]     = useState<Paciente[]>(MOCK_PACIENTES);
  const [alertas, setAlertas]         = useState<AlertaClinico[]>(MOCK_ALERTAS);
  const [agendaHoje, setAgendaHoje]   = useState<EventoAgenda[]>(MOCK_AGENDA_HOJE);
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);

  const activePacienteForConsulta = pacientes.find(p => p.id === selectedPacienteId) || null;

  const handleLogin = (role: "medica" | "paciente" | "dev", data?: string) => {
    setUserRole(role);
    if (role === "medica" && data) {
      setMedicaNome(data);
    } else if (role === "paciente" && data) {
      const found = pacientes.find(p => p.cpf.replace(/\D/g, "") === data);
      if (found) setLoggedPacienteId(found.id);
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoggedPacienteId(null);
    setCurrentTab("dashboard");
  };

  const handleSaveNewConsultation = (pacienteId: string, novaConsulta: ConsultaHistorial) => {
    setPacientes(prev => prev.map(p => p.id === pacienteId
      ? { ...p, progresso: Math.min(100, p.progresso + 15), ultimaAtualizacao: novaConsulta.data, consultas: [novaConsulta, ...p.consultas] }
      : p
    ));
    setAgendaHoje(prev => prev.map(evt => evt.pacienteId === pacienteId ? { ...evt, status: "Realizada" as const } : evt));
    setAlertas(prev => prev.filter(a => a.pacienteId !== pacienteId));
    setCurrentTab("pacientes");
  };

  const handleSendPatientMessage = (pacienteId: string, content: string, sender: "medica" | "paciente") => {
    const ts = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const msg: Message = { id: `msg-${Date.now()}`, sender, content, timestamp: ts };
    setPatientChats(prev => ({ ...prev, [pacienteId]: [...(prev[pacienteId] || []), msg] }));
    if (sender === "paciente") {
      setTimeout(() => {
        const ts2 = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        setPatientChats(prev => ({
          ...prev,
          [pacienteId]: [...(prev[pacienteId] || []),
            { id: `msg-${Date.now()+1}`, sender: "medica", content: "Oi! Recebi sua mensagem. Responderei em breve!", timestamp: ts2 }
          ]
        }));
      }, 1500);
    }
  };

  // ── Não autenticado ──
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
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
    // CPF não encontrado — volta ao login
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
                onOpenNovaConsulta={(id) => { setSelectedPacienteId(id); setCurrentTab("nova_consulta"); }} />
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
