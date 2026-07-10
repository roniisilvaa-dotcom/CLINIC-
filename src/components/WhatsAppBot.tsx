import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageCircle, Bot, Zap, CheckCircle2, Clock, Users,
  Settings, Phone, DollarSign, Calendar, ChevronRight,
  Copy, CheckCheck, AlertCircle, Wifi, WifiOff, RefreshCw,
  ShieldCheck, Smartphone, Link2, Shield, BellRing, Send,
  Pause, Play
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

const STATUS_COLORS = {
  ativo:                "bg-blue-100 text-blue-700",
  aguardando_pagamento: "bg-amber-100 text-amber-700",
  agendado:             "bg-green-100 text-green-700",
};
const STATUS_LABELS = {
  ativo:                "Conversando",
  aguardando_pagamento: "Aguard. Pag.",
  agendado:             "Agendado ✓",
};

// ─── Componente Principal ────────────────────────────────────────────
export default function WhatsAppBot() {
  const [aba, setAba] = useState<"visao_geral" | "conversas" | "configurar">("visao_geral");
  const [stats, setStats] = useState<Stats>({ conversasHoje: 0, agendadosBot: 0, mensagensTotal: 0, botOnline: false });
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaSelecionada, setConversaSelecionada] = useState<Conversa | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [config, setConfig] = useState<ConfigNotificacao>({ whatsappDra: "", iaAtiva: true });
  const [salvando, setSalvando] = useState(false);
  const [salvoOk, setSalvoOk] = useState(false);
  const [testando, setTestando] = useState(false);
  const [testeOk, setTesteOk] = useState<boolean | null>(null);

  const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;
  const paymentWebhookUrl = `${window.location.origin}/api/whatsapp/payment-webhook`;

  const copiar = (texto: string, id: string) => {
    navigator.clipboard.writeText(texto);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

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

  useEffect(() => {
    carregarStats();
    const int = setInterval(carregarStats, 30000);
    return () => clearInterval(int);
  }, [carregarStats]);

  useEffect(() => {
    if (aba === "conversas") carregarConversas();
  }, [aba, carregarConversas]);

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

  const testarConexao = async () => {
    setTestando(true);
    setTesteOk(null);
    try {
      const r = await fetch("/api/whatsapp/test-connection");
      setTesteOk(r.ok);
    } catch {
      setTesteOk(false);
    }
    setTestando(false);
  };

  const abas = [
    { id: "visao_geral", label: "Visão Geral", icon: Bot },
    { id: "conversas",   label: "Conversas",   icon: MessageCircle },
    { id: "configurar",  label: "Configurar",  icon: Settings },
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
            <p className="text-xs text-neutral-500 font-mono">Agendamento automático · Pix · 24 h · Meta Cloud API</p>
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
                { label: "Conversas hoje",   value: stats.conversasHoje, icon: MessageCircle, cor: "text-blue-600",  bg: "bg-blue-50" },
                { label: "Agendados via bot", value: stats.agendadosBot,  icon: Calendar,      cor: "text-green-600", bg: "bg-green-50" },
                { label: "Total mensagens",   value: stats.mensagensTotal, icon: Send,          cor: "text-purple-600",bg: "bg-purple-50" },
                { label: "Status",            value: stats.botOnline ? "Online" : "Offline", icon: Wifi, cor: stats.botOnline ? "text-green-600" : "text-red-500", bg: stats.botOnline ? "bg-green-50" : "bg-red-50" },
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
                  { n: "2", label: "IA responde humanizada e coleta dados",           icon: Bot },
                  { n: "3", label: "Sistema verifica agenda da Dra. Mariah",          icon: Calendar },
                  { n: "4", label: "Paciente escolhe horário e confirma",             icon: CheckCircle2 },
                  { n: "5", label: "IA gera link Pix de R$ 100 (sinal)",             icon: DollarSign },
                  { n: "6", label: "Pagamento confirmado automaticamente",            icon: Shield },
                  { n: "7", label: "Dra. Mariah recebe notificação completa",        icon: BellRing },
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

            {/* Webhook URLs */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
              <h3 className="font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                URLs para configurar no painel Meta e no Asaas
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Webhook WhatsApp (Meta Cloud API)", url: webhookUrl },
                  { label: "Webhook Pagamentos (Asaas)", url: paymentWebhookUrl },
                ].map(w => (
                  <div key={w.label} className="flex items-center gap-3 bg-white rounded-lg border border-neutral-200 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-500 mb-0.5">{w.label}</p>
                      <p className="text-sm font-mono text-neutral-800 truncate">{w.url}</p>
                    </div>
                    <button
                      onClick={() => copiar(w.url, w.label)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-xs text-neutral-600 font-medium transition-colors"
                    >
                      {copied === w.label ? <><CheckCheck className="w-3.5 h-3.5 text-green-500" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-neutral-400 mt-3">
                O webhook do WhatsApp é configurado direto no painel do app Meta (developers.facebook.com), não aqui — cole essa URL lá em "Configure Webhooks".
              </p>
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
                <p className="text-sm text-neutral-400 mt-1">Configure o WhatsApp e aguarde as mensagens chegarem</p>
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
                    </div>
                  </div>

                  <AnimatePresence>
                    {conversaSelecionada?.telefone === c.telefone && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 border-t border-neutral-100 pt-4 space-y-2 overflow-hidden">
                        {c.mensagens.slice(-6).map((m, j) => (
                          <div key={j} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-neutral-100 text-neutral-700" : "bg-[#25D366]/10 text-neutral-800"}`}>
                              <p className="text-[10px] text-neutral-400 mb-0.5 font-medium">{m.role === "user" ? "Paciente" : "IA"}</p>
                              {m.conteudo}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── CONFIGURAR ──────────────────────────── */}
        {aba === "configurar" && (
          <motion.div key="cfg" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* Meta Cloud API — status */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-[#25D366]/10 flex items-center justify-center">
                  <ShieldCheck className="w-4.5 h-4.5 text-[#25D366]" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">Conexão WhatsApp · Meta Cloud API (oficial)</h3>
                  <p className="text-xs text-neutral-500">developers.facebook.com · Sem QR Code, sem risco de banimento</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-4">
                <p className="font-semibold mb-1">🔐 Por segurança, o token da Meta não é cadastrado por aqui.</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  As credenciais (<code className="font-mono">META_WHATSAPP_TOKEN</code>, <code className="font-mono">META_PHONE_NUMBER_ID</code>, <code className="font-mono">META_APP_SECRET</code>, <code className="font-mono">META_VERIFY_TOKEN</code>) ficam guardadas como variáveis de ambiente no painel da Vercel, não em texto na tela do sistema.
                </p>
                <ol className="space-y-1 text-blue-700 list-decimal list-inside text-xs mt-2">
                  <li>Acesse developers.facebook.com → seu app → WhatsApp → Production setup</li>
                  <li>Copie o token permanente e o Phone Number ID</li>
                  <li>Cole a URL do webhook (acima, aba "Visão Geral") em "Configure Webhooks"</li>
                  <li>Defina as 4 variáveis no painel da Vercel (Project Settings → Environment Variables)</li>
                  <li>Faça um novo deploy pra aplicar</li>
                </ol>
              </div>

              <button
                onClick={testarConexao}
                disabled={testando}
                className="flex items-center gap-2 px-4 py-2 border border-[#25D366] text-[#25D366] rounded-lg text-sm font-medium hover:bg-[#25D366]/5 transition-colors disabled:opacity-40"
              >
                {testando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                {testando ? "Testando..." : "Testar Conexão"}
                {testeOk === true && <CheckCheck className="w-4 h-4 text-green-500" />}
                {testeOk === false && <AlertCircle className="w-4 h-4 text-red-500" />}
              </button>
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
                <p className="text-xs text-neutral-400 mt-1.5">Formato: 55 + DDD + número (sem espaços ou traços). Também pode ser definido direto na variável WHATSAPP_DRA na Vercel.</p>
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

            <p className="text-center text-xs text-neutral-400">
              Apenas as preferências acima (número da Dra., IA ativa) são salvas por aqui. Credenciais sensíveis (token Meta, chave Asaas) ficam nas variáveis de ambiente da Vercel.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
