import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Stethoscope, User, Terminal, Lock, CreditCard, Mail, ArrowLeft } from "lucide-react";
import { Paciente } from "../types";

interface LoginScreenProps {
  onLogin: (role: "medica" | "paciente" | "dev", data?: string, token?: string) => void;
  pacientes: Paciente[];
}

type MainRole = "medica" | "paciente";

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [mainRole, setMainRole] = useState<MainRole>("medica");
  const [devMode, setDevMode]   = useState(false);

  const [email, setEmail]       = useState("");
  const [senha, setSenha]       = useState("");
  const [errMedica, setErrMedica] = useState("");
  const [cpf, setCpf]           = useState("");
  const [errPac, setErrPac]     = useState("");
  const [pin, setPin]           = useState("");
  const [errDev, setErrDev]     = useState("");
  const [loading, setLoading]   = useState(false);

  const clearFields = () => { setEmail(""); setSenha(""); setCpf(""); setPin(""); setErrMedica(""); setErrPac(""); setErrDev(""); };
  const selectMainRole = (r: MainRole) => { if (r === mainRole) return; clearFields(); setMainRole(r); };
  const openDev  = () => { clearFields(); setDevMode(true); };
  const closeDev = () => { clearFields(); setDevMode(false); };

  const handleMedica = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrMedica("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await r.json();
      if (!r.ok) {
        setErrMedica(data.error || "E-mail ou senha incorretos.");
        setLoading(false);
        return;
      }
      onLogin("medica", data.nome, data.token);
    } catch {
      setErrMedica("Não foi possível conectar ao servidor. Tente novamente.");
    }
    setLoading(false);
  };

  // Antes, o CPF era comparado no navegador contra a lista COMPLETA de
  // pacientes (baixada previamente, sem login nenhum) — qualquer visitante do
  // site conseguia ver os dados de todo mundo pelo DevTools, só pra permitir
  // essa checagem local. Agora a checagem é feita no servidor
  // (/api/auth/paciente-login), que devolve só o id e nome de quem digitou o
  // CPF certo — nada mais sai do banco.
  const handlePaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrPac("");
    const cpfLimpo = cpf.replace(/\D/g, "");
    try {
      const r = await fetch("/api/auth/paciente-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: cpfLimpo }),
      });
      const data = await r.json();
      if (!r.ok) {
        setErrPac(data.error || "CPF não encontrado. Verifique com a clínica.");
        setLoading(false);
        return;
      }
      onLogin("paciente", data.id, data.token);
    } catch {
      setErrPac("Não foi possível conectar ao servidor. Tente novamente.");
    }
    setLoading(false);
  };

  // Antes o PIN de desenvolvedor era comparado no navegador contra uma variável
  // VITE_DEV_PIN — o Vite empacota qualquer env var com esse prefixo dentro do
  // JS que vai pro navegador, então bastava abrir o DevTools > Sources e ler o
  // PIN direto do bundle. Agora a checagem é feita no servidor
  // (/api/auth/dev-login), que nunca expõe o PIN, só devolve um token de sessão
  // se ele estiver correto.
  const handleDev = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrDev("");
    try {
      const r = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await r.json();
      if (!r.ok) {
        setErrDev(data.error || "PIN incorreto.");
        setPin("");
        setLoading(false);
        return;
      }
      onLogin("dev", data.nome, data.token);
    } catch {
      setErrDev("Não foi possível conectar ao servidor. Tente novamente.");
    }
    setLoading(false);
  };

  const formatCpf = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
    return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
  };

  const mainRoles: { id: MainRole; icon: typeof Stethoscope; label: string }[] = [
    { id: "medica",   icon: Stethoscope, label: "Médica" },
    { id: "paciente", icon: User,        label: "Paciente" },
  ];

  const errBox = (msg: string) => (
    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-lg flex items-center gap-2">
      <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" /> {msg}
    </motion.p>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] lg:grid lg:grid-cols-2">
      {/* ── Painel de marca (desktop) ─────────────────────────────── */}
      <div className="hidden lg:flex relative flex-col justify-between overflow-hidden p-14 border-r border-[#161616]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#141414] via-[#0A0A0A] to-black" />
        <motion.div className="absolute top-[-12%] left-[-10%] w-[520px] h-[520px] rounded-full bg-[#C9A84C]/10 blur-[130px]"
          animate={{ opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-[-15%] right-[-10%] w-[460px] h-[460px] rounded-full bg-[#6B9FD4]/10 blur-[140px]"
          animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }} />
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "26px 26px" }} />

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full border-2 border-[#C9A84C]/60 bg-black flex items-center justify-center shadow-[0_0_30px_rgba(201,168,76,0.2)]">
            <Sparkles className="w-5 h-5 text-[#C9A84C]" />
          </div>
          <span style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#C9A84C] font-semibold tracking-tight">CA.RO CLINIC</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="relative z-10 max-w-md">
          <p className="text-[11px] uppercase tracking-[0.35em] text-[#C9A84C]/70 font-mono mb-4">Precision Hair Medicine</p>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-4xl leading-tight text-white font-medium mb-5">
            Cuidado capilar guiado<br />por ciência e precisão.
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed">
            Painel clínico da Dra. Mariah Zibetti — diagnóstico, protocolos e acompanhamento de pacientes em um só lugar.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="relative z-10 flex items-center gap-3 text-[10px] text-neutral-700 font-mono uppercase tracking-widest">
          <div className="w-8 h-px bg-neutral-800" />
          CA.RO Studio
        </motion.div>
      </div>

      {/* ── Painel de acesso ──────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center px-6 py-12 sm:px-10 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-[#C9A84C]/[0.04] blur-[150px] pointer-events-none lg:hidden" />

        <div className="w-full max-w-sm relative z-10">
          {/* logo compacto (mobile) */}
          <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="flex lg:hidden flex-col items-center mb-10">
            <div className="w-14 h-14 rounded-full border-2 border-[#C9A84C]/60 bg-black flex items-center justify-center shadow-[0_0_30px_rgba(201,168,76,0.15)] mb-3">
              <Sparkles className="w-6 h-6 text-[#C9A84C]" />
            </div>
            <h1 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#C9A84C] font-semibold tracking-tight">CA.RO CLINIC</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 font-mono mt-1">Precision Hair Medicine</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
            <AnimatePresence mode="wait">
              {!devMode ? (
                <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <h2 className="text-xl font-semibold text-white mb-1">Bem-vinda de volta</h2>
                  <p className="text-xs text-neutral-500 mb-7">
                    {mainRole === "medica" ? "Entre com seu e-mail e senha para acessar o painel." : "Digite seu CPF para acompanhar seu tratamento."}
                  </p>

                  <div className="relative grid grid-cols-2 bg-[#111111] border border-[#222] rounded-xl p-1 mb-7">
                    {mainRoles.map(r => (
                      <button key={r.id} type="button" onClick={() => selectMainRole(r.id)}
                        className="relative py-2.5 rounded-lg cursor-pointer">
                        {mainRole === r.id && (
                          <motion.div layoutId="tab-pill" className="absolute inset-0 bg-[#C9A84C] rounded-lg"
                            transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                        )}
                        <span className={`relative z-10 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${mainRole === r.id ? "text-black" : "text-neutral-400"}`}>
                          <r.icon className="w-3.5 h-3.5" />{r.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {mainRole === "medica" ? (
                      <motion.form key="medica" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}
                        onSubmit={handleMedica} className="space-y-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">E-mail</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrMedica(""); }} autoFocus
                              placeholder="dra.mariah@caroclinic.com.br"
                              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/15 text-white text-sm py-3 pl-10 pr-4 rounded-lg outline-none transition-all placeholder:text-neutral-700" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">Senha</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                            <input type="password" value={senha} onChange={e => { setSenha(e.target.value); setErrMedica(""); }}
                              placeholder="••••••••"
                              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/15 text-white text-sm py-3 pl-10 pr-4 rounded-lg outline-none transition-all" />
                          </div>
                        </div>
                        {errMedica && errBox(errMedica)}
                        <button type="submit" disabled={loading}
                          className="w-full bg-gradient-to-r from-[#C9A84C] to-[#D9B85C] hover:from-[#D9B85C] hover:to-[#E9C86C] disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-bold uppercase tracking-widest py-3.5 rounded-lg transition-all shadow-[0_4px_20px_rgba(201,168,76,0.15)] hover:shadow-[0_6px_28px_rgba(201,168,76,0.25)] flex items-center justify-center gap-2 cursor-pointer mt-1">
                          {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <><Lock className="w-3.5 h-3.5" />Entrar no Painel</>}
                        </button>
                      </motion.form>
                    ) : (
                      <motion.form key="paciente" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}
                        onSubmit={handlePaciente} className="space-y-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">CPF</label>
                          <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                            <input type="text" value={cpf} onChange={e => { setCpf(formatCpf(e.target.value)); setErrPac(""); }} autoFocus
                              placeholder="000.000.000-00"
                              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#6B9FD4] focus:ring-2 focus:ring-[#6B9FD4]/15 text-white text-sm py-3 pl-10 pr-4 rounded-lg outline-none transition-all placeholder:text-neutral-700 font-mono tracking-wider" />
                          </div>
                        </div>
                        {errPac && errBox(errPac)}
                        <button type="submit" disabled={loading || cpf.replace(/\D/g,"").length < 11}
                          className="w-full bg-gradient-to-r from-[#6B9FD4] to-[#7BAEE4] hover:from-[#7BAEE4] hover:to-[#8BBEF4] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest py-3.5 rounded-lg transition-all shadow-[0_4px_20px_rgba(107,159,212,0.15)] hover:shadow-[0_6px_28px_rgba(107,159,212,0.25)] flex items-center justify-center gap-2 cursor-pointer mt-1">
                          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><User className="w-3.5 h-3.5" />Acessar Portal</>}
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  <button type="button" onClick={openDev}
                    className="w-full mt-6 flex items-center justify-center gap-1.5 text-[10px] text-neutral-700 hover:text-neutral-500 transition cursor-pointer uppercase tracking-widest font-mono">
                    <Terminal className="w-3 h-3" /> Acesso técnico
                  </button>
                </motion.div>
              ) : (
                <motion.div key="dev" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                  className="bg-[#111111] border border-[#222] rounded-2xl p-7 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <Terminal className="w-5 h-5 text-[#9B8EAF]" />
                    <h2 className="text-sm font-semibold text-white">Acesso Desenvolvedor</h2>
                  </div>
                  <form onSubmit={handleDev} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">PIN de Desenvolvedor</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                        <input type="password" value={pin} onChange={e => { setPin(e.target.value); setErrDev(""); }} autoFocus
                          placeholder="••••••••"
                          className="w-full bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#9B8EAF] focus:ring-2 focus:ring-[#9B8EAF]/15 text-white text-sm py-3 pl-10 pr-4 rounded-lg outline-none transition-all font-mono tracking-widest" />
                      </div>
                    </div>
                    {errDev && errBox(errDev)}
                    <button type="submit" disabled={loading || !pin}
                      className="w-full bg-[#9B8EAF] hover:bg-[#AB9EBF] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest py-3.5 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer mt-1">
                      {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Terminal className="w-3.5 h-3.5" />Acessar Sistema</>}
                    </button>
                  </form>
                  <button onClick={closeDev} className="w-full mt-4 flex items-center justify-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-400 transition cursor-pointer py-1">
                    <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <p className="text-center text-[10px] text-neutral-700 mt-10 font-mono">CA.RO CLINIC · Desenvolvido por CA.RO Studio</p>
        </div>
      </div>
    </div>
  );
}
