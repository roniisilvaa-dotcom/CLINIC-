import React, { useState, useEffect } from "react";
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
import SobreTech from "./components/SobreTech";
import PortalPaciente from "./components/PortalPaciente";
import FinanceiroModulo from "./components/FinanceiroMódulo";

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
  | "sobre_tech";

interface Message {
  id: string;
  sender: "medica" | "paciente";
  content: string;
  timestamp: string;
}

export default function App() {
  // Authentication states with instant localStorage memory
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("caro_clinic_auth") === "true";
  });
  const [userRole, setUserRole] = useState<"medica" | "paciente">(() => {
    return (localStorage.getItem("caro_clinic_role") as "medica" | "paciente") || "medica";
  });
  const [medicaNome, setMedicaNome] = useState<string>(() => {
    return localStorage.getItem("caro_clinic_doctor") || "Dra. Mariah Zibetti";
  });
  const [loggedPacienteId, setLoggedPacienteId] = useState<string | null>(() => {
    return localStorage.getItem("caro_clinic_patient_id");
  });

  // Patient chat state per-patientId
  const [patientChats, setPatientChats] = useState<Record<string, Message[]>>({});
  
  // Navigation & Drawer states
  const [currentTab, setCurrentTab] = useState<TabOption>("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  // Subscription plan & IA Limit tracking (Standard gets up to 5 analyses limit)
  const [activePlan, setActivePlan] = useState<"Standard" | "Precision" | "Enterprise">("Precision");
  const [aiRunsCounter, setAiRunsCounter] = useState<number>(2); // Initializes to 2 of 5 used under Standard plan

  // Core syncing state — começa zerado; o Doutor cadastra seus próprios dados
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [alertas, setAlertas] = useState<AlertaClinico[]>([]);
  const [agendaHoje, setAgendaHoje] = useState<EventoAgenda[]>([]);

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

  // Restaura a sessão real (cookie httpOnly) ao carregar a página
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.authenticated && data.sessao) {
          const s = data.sessao;
          if (s.tipo === "paciente") {
            setUserRole("paciente");
            setLoggedPacienteId(s.uid);
          } else if (s.papel === "dev") {
            setUserRole("dev");
            setMedicaNome(s.nome);
          } else {
            setUserRole("medica");
            setMedicaNome(s.nome);
          }
          setIsAuthenticated(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleStartLogin = (result: { role: "medica" | "paciente"; nome: string; pacienteId?: string }) => {
    setUserRole(result.role);
    localStorage.setItem("caro_clinic_auth", "true");
    localStorage.setItem("caro_clinic_role", result.role);
    if (result.role === "medica") {
      setMedicaNome(result.nome);
      localStorage.setItem("caro_clinic_doctor", result.nome);
    } else if (result.pacienteId) {
      setLoggedPacienteId(result.pacienteId);
      localStorage.setItem("caro_clinic_patient_id", result.pacienteId);
    }
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    localStorage.removeItem("caro_clinic_auth");
    localStorage.removeItem("caro_clinic_role");
    localStorage.removeItem("caro_clinic_doctor");
    localStorage.removeItem("caro_clinic_patient_id");
    setIsAuthenticated(false);
    setLoggedPacienteId(null);
    setUserRole("medica");
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
          content: `Oi! Recebi sua mensagem no painel clínico. Analisaremos com carinho e responderemos detalhadamente em breve. Continue firme no seu protocolo de saúde capilar!`,
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
          onLogout={handleLogout}
          patientChat={patientChats[loggedPaciente.id] || []}
          onSendMessage={(content) => handleSendPatientMessage(loggedPaciente.id, content, "paciente")}
        />
      );
    }
  }

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] text-[#0A0A0A] font-sans antialiased overflow-x-hidden selection:bg-[#C9A84C]/35 selection:text-[#0A0A0A]">
      {userRole === "dev" && (
        <button
          onClick={() => setDevOpenApp(false)}
          className="fixed bottom-5 left-5 z-50 flex items-center gap-2 bg-[#0A0A0A] text-[#C9A84C] border border-[#C9A84C]/40 text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg hover:bg-[#15140F] transition"
        >
          ← Painel do Desenvolvedor
        </button>
      )}
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
        onLogout={handleLogout}
        medicaNome={medicaNome}
      />

      {/* Main Content Workspace viewport */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 overflow-y-auto">
        {/* Top Branding Bar — Dra. Mariah Zibetti */}
        <div className="mb-8 p-4 md:p-5 rounded-2xl bg-[#0A0A0A] text-white border border-[#C9A84C]/30 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full border border-[#C9A84C] bg-black flex items-center justify-center text-[#C9A84C] font-serif font-bold text-base shadow-inner shrink-0">
              MZ
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 style={{ fontFamily: "Georgia, serif" }} className="text-xl md:text-2xl font-serif text-white tracking-tight font-medium">
                  {medicaNome}
                </h1>
                <span className="bg-[#C9A84C]/20 text-[#C9A84C] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Dermatologia & Tricologia Avançada
                </span>
              </div>
              <p className="text-xs text-white/50 font-mono mt-0.5">
                Plataforma de Inteligência Capilar • Unidades Toledo & Fátima do Sul
              </p>
            </div>
          </div>
          
          <div className="relative z-10 flex items-center gap-3 self-end md:self-auto text-xs font-mono">
            <span className="text-[#C9A84C] flex items-center gap-1.5 bg-[#151515] px-3 py-1.5 rounded-lg border border-[#C9A84C]/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sistema Clínico Conectado
            </span>
          </div>
        </div>

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
                medicaNome={medicaNome}
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
                medicaNome={medicaNome}
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
                medicaNome={medicaNome}
                activePlan={activePlan}
                aiRunsCounter={aiRunsCounter} 
                onIncrementAiRuns={() => setAiRunsCounter(prev => prev + 1)} 
              />
            )}

            {currentTab === "prescricoes" && (
              <PrescricoesModulo medicaNome={medicaNome} />
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

            {currentTab === "sobre_tech" && (
              <SobreTech />
            )}
          </motion.div>
        </AnimatePresence>

        <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-[11px] text-gray-400">
          Desenvolvido por CA.RO Tech — 2026 · Todos os direitos reservados.
        </footer>
      </main>
    </div>
  );
}
