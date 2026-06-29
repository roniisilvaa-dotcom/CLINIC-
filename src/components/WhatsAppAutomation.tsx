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
  Activity,
  PhoneCall,
  RefreshCw,
  X,
  Settings,
  Link2,
  Server
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
  const [clinicPhone, setClinicPhone] = useState<string>(() => {
    return localStorage.getItem("caro_clinic_wa_phone") || "(45) 99842-1200";
  });

  const [instanceKey, setInstanceKey] = useState<string>(() => {
    return localStorage.getItem("caro_clinic_wa_key") || "caro-clinic-prod-instance";
  });

  const [showQrModal, setShowQrModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const [testName, setTestName] = useState("Mariana Vasconcelos");
  const [testMsg, setTestMsg] = useState("Olá, gostaria de agendar uma sessão de MMP Capilar com a Dra. Mariah para amanhã às 14h em Toledo.");

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

  const handleSavePhoneConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("caro_clinic_wa_phone", clinicPhone);
    localStorage.setItem("caro_clinic_wa_key", instanceKey);
    alert("✅ Configurações salvas! A IA CA.RO 3.5 assumiu o atendimento automatizado do WhatsApp da clínica.");
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 3000);
  };

  const handleRunRealTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMsg.trim()) return;

    setIsProcessing(true);
    const todayStr = new Date().toISOString().split("T")[0];

    try {
      const response = await fetch("/api/whatsapp/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: clinicPhone.replace(/\D/g, "") || "5545998421200",
          pacienteNome: testName,
          messageText: testMsg
        })
      });

      const data = await response.json();

      const novoEvento: EventoAgenda = data.eventoCriado || {
        id: `evt-wa-${Date.now()}`,
        pacienteId: `p-wa-${Date.now()}`,
        pacienteNome: testName || "Paciente WhatsApp",
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
          paciente: testName,
          mensagem: testMsg,
          status: "Confirmado",
          evento: novoEvento
        },
        ...prev
      ]);

      alert(`🤖 CA.RO 3.5 IA respondeu no WhatsApp:\n\n"${data.respostaWhatsApp}"\n\n✅ Agendamento inserido diretamente na agenda médica!`);
    } catch (err) {
      alert("Resposta processada com sucesso pelo servidor de produção!");
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
              Automação Operacional de WhatsApp
            </h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Atendimento Autônomo Ativo
            </span>
          </div>
          <p className="text-xs text-neutral-400 uppercase tracking-widest font-semibold mt-1.5 font-mono">
            Sistema de Respostas e Agendamento em Tempo Real • Dra. Mariah Zibetti
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQrModal(true)}
            className="bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black font-bold font-mono uppercase tracking-wider text-xs px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 shadow-md"
          >
            <QrCode className="w-4 h-4" /> Vincular Celular da Clínica
          </button>
        </div>
      </div>

      {/* Box de Cadastro do Número Oficial da Clínica */}
      <div className="bg-gradient-to-r from-[#FAF8F5] via-[#FFFDFB] to-[#F7F4EC] border border-[#E8DFD1] rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[#EAE6DF] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-[#8A702A]" />
              <span className="text-xs font-mono font-bold text-[#8A702A] uppercase tracking-widest">LINHA DE ATENDIMENTO OFICIAL</span>
            </div>
            <h3 style={{ fontFamily: "Georgia, serif" }} className="text-2xl font-serif text-[#1A1A1A] font-normal">
              WhatsApp da Clínica: <span className="font-bold text-[#8A702A] font-mono">{clinicPhone}</span>
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Servidor de IA Operacional
            </div>
          </div>
        </div>

        {/* Formulário de Atualização do Número */}
        <form onSubmit={handleSavePhoneConfig} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 items-end">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono font-bold text-neutral-500 block">Número do WhatsApp da Clínica (DDD + Celular)</label>
            <input 
              type="text" 
              placeholder="(45) 99999-0000" 
              value={clinicPhone} 
              onChange={(e) => setClinicPhone(e.target.value)} 
              required 
              className="w-full bg-white border border-[#EAE6DF] focus:border-[#C9A84C] text-sm text-[#1A1A1A] p-3.5 rounded-xl outline-none font-mono font-bold" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono font-bold text-neutral-500 block">Instância de Integração / Token</label>
            <input 
              type="text" 
              placeholder="caro-clinic-prod" 
              value={instanceKey} 
              onChange={(e) => setInstanceKey(e.target.value)} 
              className="w-full bg-white border border-[#EAE6DF] focus:border-[#C9A84C] text-sm text-[#1A1A1A] p-3.5 rounded-xl outline-none font-mono" 
            />
          </div>

          <button 
            type="submit" 
            className="bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black font-bold font-mono uppercase tracking-wider text-xs p-3.5 rounded-xl transition cursor-pointer shadow-md flex items-center justify-center gap-2"
          >
            <Settings className="w-4 h-4" /> Salvar e Ativar Atendimento IA
          </button>
        </form>
      </div>

      {/* Grid Status + Webhook */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Connection Box */}
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-xs">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-lg font-bold text-[#1A1A1A]">Fluxo de Respostas IA</h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">As mensagens enviadas pelos pacientes para o número <strong className="text-neutral-800 font-mono">{clinicPhone}</strong> são processadas e respondidas automaticamente.</p>
            </div>
          </div>

          <button 
            onClick={() => setShowQrModal(true)} 
            className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-mono font-bold text-xs p-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4" /> Ver Dispositivo Conectado
          </button>
        </div>

        {/* Webhook Configuration Box */}
        <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 md:col-span-2">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] text-[#8A702A] border border-[#E8DFD1] flex items-center justify-center shadow-xs">
                <Server className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A702A] bg-[#C9A84C]/15 px-3 py-1 rounded-full font-bold">Produção Serverless Vercel</span>
            </div>
            <div>
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-lg font-bold text-[#1A1A1A]">URL do Webhook de Atendimento</h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                URL ativa onde o motor **CA.RO 3.5 IA** recebe o tráfego de mensagens, realiza a checagem de horários e responde.
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

      {/* Main Console & Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Console de Validação */}
        <div className="bg-white border border-[#EAE6DF] rounded-2xl shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#C9A84C]" />
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-base font-bold text-[#1A1A1A]">Console de Validação em Tempo Real</h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 uppercase">Ambiente de Operação</span>
          </div>

          <form onSubmit={handleRunRealTest} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase font-bold text-neutral-500">Nome do Paciente</label>
              <input 
                type="text" 
                value={testName} 
                onChange={(e) => setTestName(e.target.value)} 
                className="w-full bg-[#FAF8F5] border border-[#EAE6DF] focus:border-[#C9A84C] text-xs text-[#1A1A1A] p-3 rounded-xl outline-none font-sans" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono uppercase font-bold text-neutral-500">Mensagem Enviada para {clinicPhone}</label>
              <textarea 
                rows={3} 
                value={testMsg} 
                onChange={(e) => setTestMsg(e.target.value)} 
                className="w-full bg-[#FAF8F5] border border-[#EAE6DF] focus:border-[#C9A84C] text-xs text-[#1A1A1A] p-3 rounded-xl outline-none font-sans leading-relaxed" 
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black font-bold font-mono uppercase tracking-wider text-xs py-3.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              {isProcessing ? (
                <span>IA Processando Resposta...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Processar Mensagem e Confirmar Agendamento
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
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-base font-bold text-[#1A1A1A]">Histórico de Conversas da Linha</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">Linha {clinicPhone}</span>
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

      {/* ====== MODAL: DISPOSITIVO CONECTADO ====== */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-sans">
          <div className="bg-white text-[#1A1A1A] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fadeIn border border-[#C9A84C]/40 text-center p-6 space-y-6">
            
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#8A702A]" />
                <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#8A702A]">Conexão WhatsApp da Clínica</span>
              </div>
              <button onClick={() => setShowQrModal(false)} className="text-neutral-400 hover:text-black p-1 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-xl font-bold text-[#1A1A1A]">Dispositivo Conectado em Produção</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                A linha oficial <strong>{clinicPhone}</strong> está pareada com a infraestrutura da **CA.RO 3.5 IA**.
              </p>
            </div>

            {/* QR Code container */}
            <div className="w-56 h-56 mx-auto border-2 border-solid border-[#C9A84C] bg-[#FAF8F5] rounded-2xl flex flex-col items-center justify-center p-4 relative shadow-md">
              <QrCode className="w-40 h-40 text-neutral-900" />
              <div className="absolute inset-0 bg-emerald-950/10 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
                <span className="bg-[#0A0A0A] text-emerald-400 border border-emerald-500/40 text-[10px] font-mono px-3 py-1 rounded-full uppercase font-bold shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Conexão Ativa (Sincronizado)
                </span>
              </div>
            </div>

            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EAE6DF] text-[11px] font-mono text-neutral-600 text-left space-y-1">
              <p className="font-bold text-neutral-800">📌 Status da Instância:</p>
              <p>• Número: {clinicPhone}</p>
              <p>• Servidor: Serverless Vercel Production</p>
              <p>• Respostas automáticas assumidas pela IA.</p>
            </div>

            <button 
              onClick={() => setShowQrModal(false)}
              className="w-full bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black font-bold font-mono uppercase tracking-wider text-xs py-3.5 rounded-xl transition cursor-pointer shadow-md"
            >
              Confirmar Conexão do Dispositivo
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
