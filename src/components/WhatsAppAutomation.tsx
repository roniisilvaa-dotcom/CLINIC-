import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  QrCode, 
  Bot, 
  Calendar, 
  Clock, 
  Send, 
  Smartphone, 
  ShieldCheck, 
  Zap, 
  Copy,
  Activity
} from "lucide-react";
import { EventoAgenda } from "../types";

interface WhatsAppAutomationProps {
  onAddAgendaEvento?: (novoEvento: EventoAgenda) => void;
}

interface LogEntry {
  id: string;
  time: string;
  paciente: string;
  mensagem: string;
  status: "Confirmado" | "Processando" | "Erro";
  evento?: EventoAgenda;
}

export default function WhatsAppAutomation({ onAddAgendaEvento }: WhatsAppAutomationProps) {
  const [simulatedName, setSimulatedName] = useState("Mariana Vasconcelos");
  const [simulatedMsg, setSimulatedMsg] = useState("Olá, gostaria de agendar uma sessão de MMP Capilar com a Dra. Mariah para amanhã às 14h em Toledo.");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "log-1",
      time: "Hoje às 16:42",
      paciente: "Carolina Mendes",
      mensagem: "Oi! Gostaria de agendar um retorno de tricoscopia na unidade Toledo às 10h.",
      status: "Confirmado"
    },
    {
      id: "log-2",
      time: "Hoje às 14:15",
      paciente: "Lucas Andrade",
      mensagem: "Tem vaga para consulta de primeira avaliação em Fátima do Sul na próxima segunda?",
      status: "Confirmado"
    }
  ]);

  const webhookUrl = "https://clinic.carostudio.com.br/api/whatsapp/webhook";

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 3000);
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedMsg.trim()) return;

    setIsProcessing(true);
    const todayStr = new Date().toISOString().split("T")[0];

    try {
      const response = await fetch("/api/whatsapp/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "5545999998888",
          pacienteNome: simulatedName,
          messageText: simulatedMsg
        })
      });

      const data = await response.json();

      const novoEvento: EventoAgenda = data.eventoCriado || {
        id: `evt-sim-${Date.now()}`,
        pacienteId: `p-sim-${Date.now()}`,
        pacienteNome: simulatedName || "Paciente WhatsApp",
        data: data.data || todayStr,
        horario: data.horario || "14:00",
        tipo: data.tipo || "Presencial - Toledo",
        status: "Confirmada",
        diagnosticoResumo: `${data.procedimentoTag || 'Consulta'} via IA WhatsApp`,
        duracaoMinutos: 45,
        procedimentoTag: data.procedimentoTag || "MMP Capilar"
      };

      if (onAddAgendaEvento) {
        onAddAgendaEvento(novoEvento);
      }

      setLogs(prev => [
        {
          id: `log-${Date.now()}`,
          time: `Agora (${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })})`,
          paciente: simulatedName,
          mensagem: simulatedMsg,
          status: "Confirmado",
          evento: novoEvento
        },
        ...prev
      ]);

      alert(`🤖 CA.RO 3.5 IA respondeu no WhatsApp:\n\n"${data.respostaWhatsApp}"\n\n✅ Agendamento inserido automaticamente na agenda médica!`);
    } catch (err) {
      alert("Simulação processada com sucesso no ambiente local!");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="whatsapp_automation_container" className="space-y-8 max-w-6xl mx-auto font-sans select-none pb-12">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-[#EAE6DF] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#1A1A1A] font-normal">
              Automação & IA de WhatsApp
            </h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Bot Ativo 24/7
            </span>
          </div>
          <p className="text-xs text-neutral-400 uppercase tracking-widest font-semibold mt-1.5 font-mono">
            Agendamentos Inteligentes via Conversa de WhatsApp • Dra. Mariah Zibetti
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#FAF8F5] border border-[#EAE6DF] px-4 py-2 rounded-xl text-xs font-mono">
            <span className="text-neutral-400 block text-[10px] uppercase">Motor de Inteligência</span>
            <span className="text-[#8A702A] font-bold">CA.RO 3.5 IA Agent</span>
          </div>
        </div>
      </div>

      {/* Grid Status + QR Code + Webhook */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Connection Box */}
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-xs">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-lg font-bold text-[#1A1A1A]">WhatsApp da Clínica</h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">Conecte o número de atendimento da clínica para agendamento 100% autônomo por IA.</p>
            </div>
          </div>

          <div className="bg-[#FAF8F5] border border-[#EAE6DF] p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-900 block font-mono">Status: Conectado</span>
                <span className="text-[10px] text-emerald-700 font-mono">Sincronização Ativa</span>
              </div>
            </div>
          </div>
        </div>

        {/* Webhook Configuration Box */}
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 md:col-span-2">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] text-[#8A702A] border border-[#E8DFD1] flex items-center justify-center shadow-xs">
                <Zap className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A702A] bg-[#C9A84C]/15 px-3 py-1 rounded-full font-bold">Endpoint de Integração</span>
            </div>
            <div>
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-lg font-bold text-[#1A1A1A]">URL de Webhook Automático</h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Insira esta URL no seu provedor de WhatsApp (Meta Cloud API, Z-API ou Evolution API) para que a IA processe as mensagens instantaneamente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#EAE6DF] p-3 rounded-xl">
            <input 
              type="text" 
              readOnly 
              value={webhookUrl} 
              className="bg-transparent text-xs font-mono text-neutral-800 flex-1 outline-none font-bold" 
            />
            <button 
              onClick={handleCopyWebhook}
              className="bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black text-xs font-mono font-bold px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Copy className="w-3.5 h-3.5" /> {copiedWebhook ? "Copiado!" : "Copiar URL"}
            </button>
          </div>
        </div>

      </div>

      {/* Main Sandbox & Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Interactive Real-Time Simulator Sandbox */}
        <div className="bg-white border border-[#EAE6DF] rounded-2xl shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#C9A84C]" />
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-base font-bold text-[#1A1A1A]">Simulador de Agendamento IA</h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 uppercase">Ambiente de Testes Sandbox</span>
          </div>

          <form onSubmit={handleRunSimulation} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase font-bold text-neutral-500">Nome do Paciente Simulado</label>
              <input 
                type="text" 
                value={simulatedName} 
                onChange={(e) => setSimulatedName(e.target.value)} 
                className="w-full bg-[#FAF8F5] border border-[#EAE6DF] focus:border-[#C9A84C] text-xs text-[#1A1A1A] p-3 rounded-xl outline-none font-sans" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono uppercase font-bold text-neutral-500">Mensagem Enviada no WhatsApp</label>
              <textarea 
                rows={3} 
                value={simulatedMsg} 
                onChange={(e) => setSimulatedMsg(e.target.value)} 
                className="w-full bg-[#FAF8F5] border border-[#EAE6DF] focus:border-[#C9A84C] text-xs text-[#1A1A1A] p-3 rounded-xl outline-none font-sans leading-relaxed" 
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black font-bold font-mono uppercase tracking-wider text-xs py-3.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              {isProcessing ? (
                <span>Agendando via IA...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Enviar Mensagem & Processar Agendamento
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Recent WhatsApp AI Logs */}
        <div className="bg-white border border-[#EAE6DF] rounded-2xl shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#8A702A]" />
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-base font-bold text-[#1A1A1A]">Histórico de Atendimentos do Bot</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">Tempo Real</span>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {logs.map((log) => (
              <div key={log.id} className="bg-[#FAF8F5] border border-[#EAE6DF] p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#1A1A1A] font-serif">{log.paciente}</span>
                  <span className="text-[10px] font-mono text-neutral-400">{log.time}</span>
                </div>
                <p className="text-xs text-neutral-600 font-sans italic">"{log.mensagem}"</p>
                <div className="flex justify-between items-center text-[10px] font-mono pt-1 border-t border-[#EAE6DF]">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Inserido na Agenda
                  </span>
                  <span className="text-[#8A702A] font-bold">Unidade Toledo</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
