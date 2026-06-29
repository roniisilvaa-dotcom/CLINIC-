import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageCircle, Bot, Zap, CheckCircle2, Clock, Users,
  Settings, Phone, DollarSign, Calendar, ChevronRight,
  Copy, CheckCheck, AlertCircle, Wifi, WifiOff
} from "lucide-react";

interface ConversaPreview {
  telefone: string;
  ultimaMensagem: string;
  horario: string;
  status: "ativo" | "aguardando_pagamento" | "agendado";
}

// Mock data para demo
const CONVERSAS_MOCK: ConversaPreview[] = [
  { telefone: "+55 (44) 9 9876-3587", ultimaMensagem: "Perfeito! O pagamento foi confirmado ✅", horario: "09:25", status: "agendado" },
  { telefone: "+55 (67) 9 9974-1134", ultimaMensagem: "Você tem um horário disponível amanhã às 10h", horario: "15:10", status: "aguardando_pagamento" },
  { telefone: "+55 (44) 9 8854-2211", ultimaMensagem: "Olá! Gostaria de agendar uma consulta...", horario: "08:43", status: "ativo" },
];

const AGENDAMENTOS_MOCK = [
  { nome: "Leonardo Galant",    telefone: "+55 (44) 9 9876-3587", procedimento: "Consulta Médica", data: "2026-07-13", horario: "17:30", sinal: 100 },
  { nome: "Helena Silveira",    telefone: "+55 (11) 9 8765-4321", procedimento: "Dermoscopia Capilar", data: "2026-07-14", horario: "10:00", sinal: 100 },
  { nome: "Mariana Costa",      telefone: "+55 (44) 9 9123-4567", procedimento: "Laserterapia", data: "2026-07-15", horario: "14:00", sinal: 100 },
];

const STATUS_COLORS = {
  ativo:                "bg-blue-100 text-blue-700",
  aguardando_pagamento: "bg-yellow-100 text-yellow-700",
  agendado:             "bg-green-100 text-green-700",
};
const STATUS_LABELS = {
  ativo:                "Conversando",
  aguardando_pagamento: "Aguard. Pag.",
  agendado:             "Agendado ✓",
};

export default function WhatsAppBot() {
  const [aba, setAba]             = useState<"visao_geral"|"conversas"|"agendamentos"|"config">("visao_geral");
  const [configSalva, setConfigSalva] = useState(false);
  const [copied, setCopied]       = useState(false);
  const [botAtivo, setBotAtivo]   = useState(true);

  const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;

  const copiar = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const abas = [
    { id: "visao_geral",   label: "Visão Geral",  icon: Bot },
    { id: "conversas",     label: "Conversas",    icon: MessageCircle },
    { id: "agendamentos",  label: "Agendamentos", icon: Calendar },
    { id: "config",        label: "Configurar",   icon: Settings },
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
            <p className="text-xs text-neutral-500 font-mono">Agendamento automático · Pagamento Pix · 24h/7d</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${botAtivo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {botAtivo ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {botAtivo ? "Bot Ativo" : "Bot Pausado"}
          </div>
          <button onClick={() => setBotAtivo(!botAtivo)}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer ${botAtivo ? "bg-green-400" : "bg-neutral-300"}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${botAtivo ? "left-7" : "left-1"}`} />
          </button>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
        {abas.map(a => {
          const Icon = a.icon;
          return (
            <button key={a.id} onClick={() => setAba(a.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${aba === a.id ? "bg-white shadow text-[#0A0A0A]" : "text-neutral-500 hover:text-neutral-700"}`}>
              <Icon className="w-3.5 h-3.5" />
              {a.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={aba} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

          {/* ── VISÃO GERAL ── */}
          {aba === "visao_geral" && (
            <div className="space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Conversas hoje", value: "8", icon: MessageCircle, color: "text-blue-600", bg: "bg-blue-50 border border-blue-100" },
                  { label: "Agendados via bot", value: "3", icon: Calendar, color: "text-green-600", bg: "bg-green-50 border border-green-100" },
                  { label: "Sinal recebido", value: "R$ 300", icon: DollarSign, color: "text-[#C9A84C]", bg: "bg-[#C9A84C]/5 border border-[#C9A84C]/20" },
                  { label: "Na fila de espera", value: "1", icon: Clock, color: "text-orange-600", bg: "bg-orange-50 border border-orange-100" },
                ].map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
                      <Icon className={`w-5 h-5 ${s.color} shrink-0`} />
                      <div>
                        <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">{s.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fluxo visual */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-[#0A0A0A] mb-5 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#C9A84C]" /> Fluxo Automático
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { emoji: "💬", label: "Mensagem WhatsApp" },
                    { emoji: "🤖", label: "IA responde (Ana)" },
                    { emoji: "📅", label: "Consulta agenda" },
                    { emoji: "💳", label: "Gera link Pix" },
                    { emoji: "✅", label: "Pag. confirmado" },
                    { emoji: "📋", label: "Agenda criada" },
                    { emoji: "👩‍⚕️", label: "Dra. notificada" },
                  ].map((step, i) => (
                    <React.Fragment key={i}>
                      <div className="flex flex-col items-center gap-1 min-w-[72px]">
                        <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-lg">{step.emoji}</div>
                        <span className="text-[9px] text-center text-neutral-500 font-mono leading-tight">{step.label}</span>
                      </div>
                      {i < 6 && <ChevronRight className="w-3.5 h-3.5 text-neutral-300 shrink-0" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Últimas conversas */}
              <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-[#25D366]" /> Conversas Recentes</h2>
                  <button onClick={() => setAba("conversas")} className="text-xs text-[#C9A84C] hover:underline cursor-pointer">Ver todas →</button>
                </div>
                {CONVERSAS_MOCK.map((c, i) => (
                  <div key={i} className="px-6 py-3 border-b border-neutral-50 last:border-0 flex items-center gap-3 hover:bg-neutral-50 transition">
                    <div className="w-9 h-9 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-[#25D366]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0A0A0A] font-mono">{c.telefone}</p>
                      <p className="text-xs text-neutral-400 truncate">{c.ultimaMensagem}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-neutral-400">{c.horario}</span>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status]}`}>{STATUS_LABELS[c.status]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CONVERSAS ── */}
          {aba === "conversas" && (
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100">
                <h2 className="text-sm font-semibold">Todas as Conversas</h2>
              </div>
              {CONVERSAS_MOCK.map((c, i) => (
                <div key={i} className="px-6 py-4 border-b border-neutral-50 last:border-0 flex items-center gap-4 hover:bg-neutral-50 transition cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-[#25D366]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold font-mono">{c.telefone}</p>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">{c.ultimaMensagem}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[10px] text-neutral-400">{c.horario}</span>
                    <span className={`text-[9px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[c.status]}`}>{STATUS_LABELS[c.status]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── AGENDAMENTOS VIA BOT ── */}
          {aba === "agendamentos" && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-sm text-green-800 font-semibold">{AGENDAMENTOS_MOCK.length} agendamentos realizados pela IA este mês — R$ {AGENDAMENTOS_MOCK.length * 100},00 em sinais recebidos</p>
              </div>
              <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
                {AGENDAMENTOS_MOCK.map((a, i) => (
                  <div key={i} className="px-6 py-4 border-b border-neutral-50 last:border-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-sm font-bold text-[#C9A84C]">
                          {a.nome.split(" ").map(n => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{a.nome}</p>
                          <p className="text-xs text-neutral-400 font-mono">{a.telefone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-neutral-500">{a.data} · {a.horario}</p>
                        <p className="text-xs font-semibold text-green-600 mt-0.5">Sinal R$ {a.sinal} ✓</p>
                      </div>
                    </div>
                    <div className="mt-2 ml-13">
                      <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-mono">{a.procedimento}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CONFIGURAR ── */}
          {aba === "config" && (
            <div className="space-y-5 max-w-2xl">
              {/* Z-API */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-[#25D366]/10 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  </div>
                  <h3 className="text-sm font-semibold">Z-API · Conexão WhatsApp</h3>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700 space-y-1">
                  <p className="font-semibold">Como conectar:</p>
                  <p>1. Acesse <strong>zapi.io</strong> e crie uma conta</p>
                  <p>2. Crie uma instância e conecte seu WhatsApp (QR Code)</p>
                  <p>3. Cole o URL base e o token abaixo</p>
                  <p>4. Cole o Webhook URL no painel do Z-API</p>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">URL Base da Instância Z-API</label>
                  <input className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#25D366] transition font-mono" placeholder="https://api.z-api.io/instances/SEU_ID/token/SEU_TOKEN" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">Client-Token Z-API</label>
                  <input type="password" className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#25D366] transition font-mono" placeholder="••••••••••••••••" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">WhatsApp da Dra. (para notificações)</label>
                  <input className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#25D366] transition font-mono" placeholder="5544999999999" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">URL do Webhook (cole no Z-API)</label>
                  <div className="flex gap-2">
                    <input value={webhookUrl} readOnly className="flex-1 border border-neutral-200 rounded-lg px-3 py-2.5 text-xs font-mono bg-neutral-50 outline-none" />
                    <button onClick={() => copiar(webhookUrl)} className="px-3 py-2.5 bg-neutral-100 hover:bg-[#C9A84C]/10 border border-neutral-200 rounded-lg transition cursor-pointer">
                      {copied ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-neutral-400" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Asaas Pagamento */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-[#C9A84C]" />
                  </div>
                  <h3 className="text-sm font-semibold">Asaas · Pagamento Pix</h3>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700 space-y-1">
                  <p className="font-semibold">Como conectar:</p>
                  <p>1. Crie conta em <strong>asaas.com</strong> (gratuito para começar)</p>
                  <p>2. Acesse Configurações → API → Gere uma chave</p>
                  <p>3. Cole a chave abaixo</p>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">Chave API Asaas</label>
                  <input type="password" className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#C9A84C] transition font-mono" placeholder="$aact_••••••••••••" />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-[#C9A84C]" />
                  <span className="text-sm text-neutral-600">Usar ambiente Sandbox (para testes)</span>
                </label>
              </div>

              {/* Personalidade */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="text-sm font-semibold">Personalidade da IA</h3>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">Nome da Secretária</label>
                  <input defaultValue="Ana" className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-purple-400 transition" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">Valor do Sinal (R$)</label>
                  <input defaultValue="100" type="number" className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-purple-400 transition" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">Mensagem de boas-vindas</label>
                  <textarea defaultValue="Olá! Aqui é a Ana, secretária da Clínica CA.RO da Dra. Mariah Zibetti 💜 Como posso te ajudar hoje?" rows={3} className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-purple-400 transition resize-none" />
                </div>
              </div>

              <button onClick={() => { setConfigSalva(true); setTimeout(() => setConfigSalva(false), 2000); }}
                className="w-full bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black text-xs font-bold uppercase tracking-widest py-3.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2">
                {configSalva ? <><CheckCircle2 className="w-4 h-4" /> Configurações salvas!</> : "Salvar e Ativar Bot"}
              </button>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
