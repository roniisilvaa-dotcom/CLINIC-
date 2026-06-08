import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

// Components Imports
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

// Mock Data & Types
import { MOCK_PACIENTES, MOCK_ALERTAS, MOCK_AGENDA_HOJE } from "./mockData";
import { Paciente, AlertaClinico, EventoAgenda, ConsultaHistorial } from "./types";

type TabOption = 
  | "dashboard" 
  | "pacientes" 
  | "nova_consulta" 
  | "agenda" 
  | "prescricoes" 
  | "financeiro"
  | "galeria_capilar" 
  | "ia_assistente" 
  | "planos";

interface Message {
  id: string;
  sender: "medica" | "paciente";
  content: string;
  timestamp: string;
}

export default function App() {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"medica" | "paciente">("medica");
  const [medicaNome, setMedicaNome] = useState("Dra. Mariah Zibetti");
  const [loggedPacienteId, setLoggedPacienteId] = useState<string | null>(null);

  // Patient chat state per-patientId
  const [patientChats, setPatientChats] = useState<Record<string, Message[]>>({
    "paciente-1": [
      { id: "ch-11", sender: "medica", content: "Olá Helena! Como está se adaptando ao novo xampu medicamentoso?", timestamp: "08:15" },
      { id: "ch-12", sender: "paciente", content: "Doutora, sinto que a descamação melhorou muito, quase não coça mais!", timestamp: "09:30" }
    ],
    "paciente-2": [
      { id: "ch-21", sender: "medica", content: "Gabriela, agendei seu retorno para realizarmos o pull test preventivo.", timestamp: "11:00" }
    ],
    "paciente-3": [
      { id: "ch-31", sender: "medica", content: "Roberto, seu repovoamento de coroa está excelente no acompanhamento fotográfico.", timestamp: "14:00" }
    ]
  });
  
  // Navigation & Drawer states
  const [currentTab, setCurrentTab] = useState<TabOption>("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  // Subscription plan & IA Limit tracking (Standard gets up to 5 analyses limit)
  const [activePlan, setActivePlan] = useState<"Standard" | "Precision" | "Enterprise">("Precision");
  const [aiRunsCounter, setAiRunsCounter] = useState<number>(2); // Initializes to 2 of 5 used under Standard plan

  // Core syncing state
  const [pacientes, setPacientes] = useState<Paciente[]>(MOCK_PACIENTES);
  const [alertas, setAlertas] = useState<AlertaClinico[]>(MOCK_ALERTAS);
  const [agendaHoje, setAgendaHoje] = useState<EventoAgenda[]>(MOCK_AGENDA_HOJE);

  // Selected Profile state
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);

  // Helper: Find patient for the active consultation sheet
  const activePacienteForConsulta = pacientes.find(p => p.id === selectedPacienteId) || null;

  // Handle addition of a completed consultation
  const handleSaveNewConsultation = (pacienteId: string, novaConsulta: ConsultaHistorial) => {
    // 1. Append the consultation to the specific patient
    const updatedPatients = pacientes.map(p => {
      if (p.id === pacienteId) {
        return {
          ...p,
          progresso: Math.min(100, p.progresso + 15), // Progress automatically steps up
          ultimaAtualizacao: novaConsulta.data,
          consultas: [novaConsulta, ...p.consultas]
        };
      }
      return p;
    });

    setPacientes(updatedPatients);

    // 2. Mark this appointment as "Realizada" in today's agenda if exists
    const updatedAgenda = agendaHoje.map(evt => {
      if (evt.pacienteId === pacienteId) {
        return { ...evt, status: "Realizada" as const };
      }
      return evt;
    });
    setAgendaHoje(updatedAgenda);

    // 3. Remove/Resolve any corresponding alerts
    const updatedAlerts = alertas.filter(alt => alt.pacienteId !== pacienteId);
    setAlertas(updatedAlerts);

    // 4. Return to Patient Profile
    setCurrentTab("pacientes");
  };

  const handleStartLogin = (role: "medica" | "paciente", data: string) => {
    setUserRole(role);
    if (role === "medica") {
      setMedicaNome(data);
    } else {
      // Lookup mapped patient
      const found = pacientes.find(p => p.cpf.replace(/\D/g, "") === data.replace(/\D/g, "") || p.cpf === data);
      if (found) {
        setLoggedPacienteId(found.id);
      }
    }
    setIsAuthenticated(true);
  };

  const handleSendPatientMessage = (pacienteId: string, content: string, sender: "medica" | "paciente") => {
    const formattedTime = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender,
      content,
      timestamp: formattedTime
    };

    setPatientChats(prev => {
      const chat = prev[pacienteId] || [];
      return {
        ...prev,
        [pacienteId]: [...chat, newMsg]
      };
    });

    // Simulated auto-reply when patient sends message to make the live chat look incredible
    if (sender === "paciente") {
      setTimeout(() => {
        const replyTime = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        const autoReply: Message = {
          id: `msg-${Date.now() + 1}`,
          sender: "medica",
          content: `Oi! Recebi sua mensagem no painel clínico da Dra. Mariah. Analisaremos com carinho e responderemos detalhadamente em breve. Continue firme no seu protocolo de saúde capilar!`,
          timestamp: replyTime
        };
        setPatientChats(prev => {
          const chat = prev[pacienteId] || [];
          return {
            ...prev,
            [pacienteId]: [...chat, autoReply]
          };
        });
      }, 1500);
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleStartLogin} />;
  }

  // If patient logs in, render the dedicated client PortalPaciente directly
  if (userRole === "paciente") {
    const loggedPaciente = pacientes.find(p => p.id === loggedPacienteId);
    if (loggedPaciente) {
      return (
        <PortalPaciente 
          paciente={loggedPaciente} 
          onLogout={() => {
            setIsAuthenticated(false);
            setLoggedPacienteId(null);
            setUserRole("medica");
          }} 
          patientChat={patientChats[loggedPaciente.id] || []}
          onSendMessage={(content) => handleSendPatientMessage(loggedPaciente.id, content, "paciente")}
        />
      );
    }
  }

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] text-[#0A0A0A] font-sans antialiased overflow-x-hidden selection:bg-[#C9A84C]/35 selection:text-[#0A0A0A]">
      {/* Sidebar Navigation Panel with exactly aligned states */}
      <Sidebar 
        currentTab={currentTab === "nova_consulta" ? "pacientes" : currentTab} 
        setCurrentTab={(tab) => {
          setCurrentTab(tab as TabOption);
          // If moving between tabs, clear the direct selection overlay unless it's patients
          if (tab !== "pacientes") {
            setSelectedPacienteId(null);
          }
        }}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        onLogout={() => setIsAuthenticated(false)}
        medicaNome={medicaNome}
      />

      {/* Main Content Workspace viewport */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {currentTab === "dashboard" && (
              <Dashboard 
                pacientes={pacientes}
                alertas={alertas}
                agendaHoje={agendaHoje}
                onStartConsulta={(id) => {
                  setSelectedPacienteId(id);
                  setCurrentTab("nova_consulta");
                }}
                onViewPaciente={(id) => {
                  setSelectedPacienteId(id);
                  setCurrentTab("pacientes");
                }}
              />
            )}

            {currentTab === "pacientes" && (
              <PacientesModulo 
                pacientes={pacientes}
                onChangePacientes={(novosPacientes) => setPacientes(novosPacientes)}
                selectedPacienteId={selectedPacienteId}
                onSelectPaciente={(id) => setSelectedPacienteId(id)}
                onOpenNovaConsulta={(id) => {
                  setSelectedPacienteId(id);
                  setCurrentTab("nova_consulta");
                }}
                patientChats={patientChats}
                onSendDoctorMessage={(pId, text) => handleSendPatientMessage(pId, text, "medica")}
                activePlan={activePlan}
                aiRunsCounter={aiRunsCounter}
                onIncrementAiRuns={() => setAiRunsCounter(prev => prev + 1)}
              />
            )}

            {currentTab === "nova_consulta" && activePacienteForConsulta && (
              <NovaConsulta 
                paciente={activePacienteForConsulta}
                onClose={() => setCurrentTab("pacientes")}
                onSave={handleSaveNewConsultation}
              />
            )}

            {currentTab === "nova_consulta" && !activePacienteForConsulta && (
              <div className="text-center py-20 border border-dashed border-gray-300 bg-white shadow-sm rounded-xl space-y-4 max-w-lg mx-auto">
                <p style={{ fontFamily: "Georgia, serif" }} className="text-gray-600 text-base">Nenhum paciente selecionado para atendimento.</p>
                <button 
                  onClick={() => setCurrentTab("pacientes")}
                  className="bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black font-semibold text-xs font-mono uppercase px-5 py-2.5 rounded-lg cursor-pointer transition-colors shadow"
                >
                  Selecionar no Banco de Pacientes
                </button>
              </div>
            )}

            {currentTab === "agenda" && (
              <AgendaModulo 
                agendaHoje={agendaHoje}
                pacientes={pacientes}
                onViewPaciente={(id) => {
                  setSelectedPacienteId(id);
                  setCurrentTab("pacientes");
                }}
                onOpenNovaConsulta={(id) => {
                  setSelectedPacienteId(id);
                  setCurrentTab("nova_consulta");
                }}
              />
            )}

            {currentTab === "ia_assistente" && (
              <IaAssistente 
                pacientes={pacientes} 
                activePlan={activePlan} 
                aiRunsCounter={aiRunsCounter} 
                onIncrementAiRuns={() => setAiRunsCounter(prev => prev + 1)} 
              />
            )}

            {currentTab === "prescricoes" && (
              <PrescricoesModulo />
            )}

            {currentTab === "financeiro" && (
              <FinanceiroModulo pacientes={pacientes} />
            )}

            {currentTab === "galeria_capilar" && (
              <GaleriaGlobal 
                pacientes={pacientes}
                onViewPaciente={(id) => {
                  setSelectedPacienteId(id);
                  setCurrentTab("pacientes");
                }}
              />
            )}

            {currentTab === "planos" && (
              <PlanosAssinaturas activePlan={activePlan} onChangeActivePlan={setActivePlan} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
