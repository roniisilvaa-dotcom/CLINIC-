import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Stethoscope, User, Terminal, Lock, CreditCard, ChevronRight } from "lucide-react";

interface LoginScreenProps {
  onLogin: (role: "medica" | "paciente" | "dev", data?: string) => void;
}

type ActiveRole = "medica" | "paciente" | "dev" | null;

const MEDICA_EMAIL = "dra.mariah@caroclinic.com.br";
const MEDICA_SENHA = "caro2025";
const DEV_PIN      = "caro2025";

const PACIENTES_CPF: Record<string, string> = {
  "12345678900": "Helena Silveira",
  "98765432111": "Gabriela Portela",
  "11122233344": "Roberto Almeida",
};

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [active, setActive]     = useState<ActiveRole>(null);
  const [email, setEmail]       = useState("");
  const [senha, setSenha]       = useState("");
  const [errMedica, setErrMedica] = useState("");
  const [cpf, setCpf]           = useState("");
  const [errPac, setErrPac]     = useState("");
  const [pin, setPin]           = useState("");
  const [errDev, setErrDev]     = useState("");
  const [loading, setLoading]   = useState(false);

  const reset = () => { setActive(null); setEmail(""); setSenha(""); setCpf(""); setPin(""); setErrMedica(""); setErrPac(""); setErrDev(""); };

  const handleMedica = (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    setTimeout(() => {
      if (email === MEDICA_EMAIL && senha === MEDICA_SENHA) onLogin("medica", "Dra. Mariah Zibetti");
      else setErrMedica("E-mail ou senha incorretos.");
      setLoading(false);
    }, 600);
  };

  const handlePaciente = (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const cpfLimpo = cpf.replace(/\D/g, "");
    setTimeout(() => {
      if (PACIENTES_CPF[cpfLimpo]) onLogin("paciente", cpfLimpo);
      else setErrPac("CPF não encontrado. Verifique com a clínica.");
      setLoading(false);
    }, 600);
  };

  const handleDev = (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    setTimeout(() => {
      if (pin === DEV_PIN) onLogin("dev");
      else { setErrDev("PIN incorreto."); setPin(""); }
      setLoading(false);
    }, 600);
  };

  const formatCpf = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
    return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
  };

  const roles = [
    { id: "medica" as ActiveRole,   icon: Stethoscope, label: "Médica",       desc: "Acesso ao painel clínico completo", color: "#C9A84C" },
    { id: "paciente" as ActiveRole, icon: User,        label: "Paciente",     desc: "Portal de acompanhamento pessoal",  color: "#6B9FD4" },
    { id: "dev" as ActiveRole,      icon: Terminal,    label: "Desenvolvedor",desc: "Administração e configuração",      color: "#9B8EAF" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center relative overflow-hidden p-4">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#C9A84C]/4 blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-full border-2 border-[#C9A84C]/60 bg-black flex items-center justify-center shadow-[0_0_40px_rgba(201,168,76,0.15)] mb-4">
            <Sparkles className="w-7 h-7 text-[#C9A84C]" />
          </div>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#C9A84C] font-semibold tracking-tight">CLINIC CA.RO</h1>
          <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-600 font-mono mt-1">Precision Medicine</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!active ? (
            <motion.div key="roles" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-3">
              <p className="text-center text-[10px] text-neutral-600 font-mono mb-5 uppercase tracking-widest">Selecione seu perfil</p>
              {roles.map((r, i) => {
                const Icon = r.icon;
                return (
                  <motion.button key={r.id!} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                    onClick={() => setActive(r.id)}
                    className="w-full flex items-center gap-4 bg-[#111111] hover:bg-[#161616] border border-[#222] hover:border-[#333] rounded-xl px-5 py-4 text-left transition-all duration-200 group cursor-pointer">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border" style={{ background: `${r.color}15`, borderColor: `${r.color}35` }}>
                      <Icon className="w-5 h-5" style={{ color: r.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{r.label}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{r.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition" />
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }}
              className="bg-[#111111] border border-[#222] rounded-2xl p-7 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                {active === "medica"   && <Stethoscope className="w-5 h-5 text-[#C9A84C]" />}
                {active === "paciente" && <User className="w-5 h-5 text-[#6B9FD4]" />}
                {active === "dev"      && <Terminal className="w-5 h-5 text-[#9B8EAF]" />}
                <h2 className="text-sm font-semibold text-white">
                  {active === "medica" && "Acesso Médica"}
                  {active === "paciente" && "Portal do Paciente"}
                  {active === "dev" && "Acesso Desenvolvedor"}
                </h2>
              </div>

              {active === "medica" && (
                <form onSubmit={handleMedica} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">E-mail</label>
                    <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrMedica(""); }} autoFocus
                      placeholder="dra.mariah@caroclinic.com.br"
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#C9A84C]/50 text-white text-sm py-3 px-4 rounded-lg outline-none transition placeholder:text-neutral-700" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">Senha</label>
                    <input type="password" value={senha} onChange={e => { setSenha(e.target.value); setErrMedica(""); }}
                      placeholder="••••••••"
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#C9A84C]/50 text-white text-sm py-3 px-4 rounded-lg outline-none transition" />
                  </div>
                  {errMedica && <p className="text-xs text-red-400 font-mono bg-red-500/10 px-3 py-2 rounded-lg">⛔ {errMedica}</p>}
                  <button type="submit" disabled={loading} className="w-full bg-[#C9A84C] hover:bg-[#D9B85C] disabled:opacity-50 text-black text-xs font-bold uppercase tracking-widest py-3.5 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer mt-1">
                    {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <><Lock className="w-3.5 h-3.5" />Entrar no Painel</>}
                  </button>
                </form>
              )}

              {active === "paciente" && (
                <form onSubmit={handlePaciente} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">CPF</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                      <input type="text" value={cpf} onChange={e => { setCpf(formatCpf(e.target.value)); setErrPac(""); }} autoFocus
                        placeholder="000.000.000-00"
                        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#6B9FD4]/50 text-white text-sm py-3 pl-10 pr-4 rounded-lg outline-none transition placeholder:text-neutral-700 font-mono tracking-wider" />
                    </div>
                  </div>
                  {errPac && <p className="text-xs text-red-400 font-mono bg-red-500/10 px-3 py-2 rounded-lg">⛔ {errPac}</p>}
                  <button type="submit" disabled={loading || cpf.replace(/\D/g,"").length < 11} className="w-full bg-[#6B9FD4] hover:bg-[#7BAEE4] disabled:opacity-40 text-white text-xs font-bold uppercase tracking-widest py-3.5 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer mt-1">
                    {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><User className="w-3.5 h-3.5" />Acessar Portal</>}
                  </button>
                </form>
              )}

              {active === "dev" && (
                <form onSubmit={handleDev} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">PIN de Desenvolvedor</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                      <input type="password" value={pin} onChange={e => { setPin(e.target.value); setErrDev(""); }} autoFocus
                        placeholder="••••••••"
                        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#9B8EAF]/60 text-white text-sm py-3 pl-10 pr-4 rounded-lg outline-none transition font-mono tracking-widest" />
                    </div>
                  </div>
                  {errDev && <p className="text-xs text-red-400 font-mono bg-red-500/10 px-3 py-2 rounded-lg">⛔ {errDev}</p>}
                  <button type="submit" disabled={loading || !pin} className="w-full bg-[#9B8EAF] hover:bg-[#AB9EBF] disabled:opacity-40 text-white text-xs font-bold uppercase tracking-widest py-3.5 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer mt-1">
                    {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Terminal className="w-3.5 h-3.5" />Acessar Sistema</>}
                  </button>
                </form>
              )}

              <button onClick={reset} className="w-full mt-4 text-xs text-neutral-600 hover:text-neutral-400 transition cursor-pointer py-1">
                ← Voltar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-[10px] text-neutral-700 mt-8 font-mono">CLINIC CA.RO v3.0 · CA.RO Studio</p>
      </div>
    </div>
  );
}
