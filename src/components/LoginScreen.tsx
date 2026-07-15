import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Stethoscope, User, Terminal, Lock, CreditCard, Mail, ArrowLeft } from "lucide-react";
import { Paciente } from "../types";

interface LoginScreenProps {
  onLogin: (role: "medica" | "paciente" | "dev", data?: string, token?: string) => void;
  pacientes: Paciente[];
}

type MainRole = "medica" | "paciente";

const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const shimmerStyle: React.CSSProperties = {
  fontFamily: "Georgia, serif",
  backgroundImage: "linear-gradient(100deg, #C9A84C 30%, #F7E7B0 50%, #C9A84C 70%)",
  backgroundSize: "220% auto",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.6))",
};

// Esfera dourada com brilho especular + sombra de contato — lê como objeto físico
// real (metal polido), não como ícone plano.
function GlossyOrb({ size }: { size: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="absolute -inset-2 rounded-full bg-[#C9A84C]/25 blur-md" />
      <div className="relative rounded-full" style={{
        width: size, height: size,
        background: "radial-gradient(circle at 33% 28%, #FCF2D2 0%, #F0D68A 16%, #D9B85C 34%, #C9A84C 52%, #9C7A2E 74%, #4E3E17 100%)",
        boxShadow: "inset -4px -5px 9px rgba(0,0,0,0.55), inset 3px 4px 6px rgba(255,255,255,0.45), 0 8px 20px rgba(201,168,76,0.35), 0 2px 6px rgba(0,0,0,0.6)",
      }}>
        <div className="absolute rounded-full bg-white blur-[2.5px]"
          style={{ width: size * 0.32, height: size * 0.18, top: size * 0.16, left: size * 0.2, opacity: 0.75, transform: "rotate(-18deg)" }} />
        <Sparkles className="absolute inset-0 m-auto text-black/60" style={{ width: size * 0.42, height: size * 0.42 }} strokeWidth={1.75} />
      </div>
    </div>
  );
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [mainRole, setMainRole] = useState<MainRole>("medica");
  const [devMode, setDevMode]   = useState(false);
  const [mouse, setMouse]       = useState({ x: 50, y: 42 });
  const [tilt, setTilt]         = useState({ rx: 0, ry: 0, mx: 50, my: 38 });

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

  const handlePanelMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  // Inclinação 3D da carteira de vidro seguindo o cursor — como se fosse um
  // objeto físico com peso e reflexo, não uma div chapada.
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ rx: (0.5 - py) * 7, ry: (px - 0.5) * 7, mx: px * 100, my: py * 100 });
  };
  const resetTilt = () => setTilt({ rx: 0, ry: 0, mx: 50, my: 38 });

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

  // Input com sublinhado dourado que "desenha" ao focar — pequeno detalhe de joalheria.
  const fieldWrap = (children: React.ReactNode, accent: string) => (
    <div className="relative group">
      {children}
      <span className="pointer-events-none absolute left-0 -bottom-px h-px w-full origin-center scale-x-0 transition-transform duration-300 ease-out peer-focus:scale-x-100"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
    </div>
  );

  // Botão com acabamento de vidro/metal: faixa especular no topo + brilho diagonal
  // no hover + leve "afundada" real ao clicar.
  const glossButton = (className: string, disabled: boolean | undefined, content: React.ReactNode) => (
    <button type="submit" disabled={disabled}
      className={`relative overflow-hidden isolate flex items-center justify-center gap-2 cursor-pointer mt-1 active:scale-[0.98] transition-transform ${className}`}>
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-lg bg-gradient-to-b from-white/30 to-transparent" />
      <span className="pointer-events-none absolute inset-0 -translate-x-[120%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[120%]" />
      <span className="relative z-10 flex items-center justify-center gap-2">{content}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#08080A] lg:grid lg:grid-cols-2 relative">
      {/* Textura de grão sutil sobre toda a tela — evita o look "chapado" digital */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: GRAIN_URL }} />
      {/* Vinheta — escurece as bordas, dá profundidade cinematográfica */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ background: "radial-gradient(120% 100% at 50% 45%, transparent 45%, rgba(0,0,0,0.55) 100%)" }} />

      {/* ── Painel de marca (desktop) ─────────────────────────────── */}
      <div onMouseMove={handlePanelMouseMove}
        className="hidden lg:flex relative flex-col justify-between overflow-hidden p-14 border-r border-[#161616]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#141414] via-[#0A0A0A] to-black" />
        <motion.div className="absolute rounded-full bg-[#C9A84C]/12 blur-[130px]"
          style={{ width: 520, height: 520 }}
          animate={{ top: ["-14%", "-8%", "-14%"], left: ["-12%", "-6%", "-12%"], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute rounded-full bg-[#6B9FD4]/10 blur-[140px]"
          style={{ width: 460, height: 460 }}
          animate={{ bottom: ["-17%", "-11%", "-17%"], right: ["-12%", "-6%", "-12%"], opacity: [0.35, 0.65, 0.35] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2 }} />
        <motion.div className="absolute rounded-full bg-[#B8863A]/10 blur-[120px]"
          style={{ width: 380, height: 380, top: "38%", left: "28%" }}
          animate={{ opacity: [0.2, 0.45, 0.2] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
        {/* Brilho que segue o cursor — dá vida ao painel escuro */}
        <div className="absolute inset-0 pointer-events-none transition-[background] duration-200 ease-out"
          style={{ background: `radial-gradient(500px circle at ${mouse.x}% ${mouse.y}%, rgba(201,168,76,0.10), transparent 62%)` }} />
        {/* Poeira dourada flutuante */}
        {[...Array(7)].map((_, i) => (
          <motion.div key={i} className="absolute w-[3px] h-[3px] rounded-full bg-[#C9A84C] pointer-events-none"
            style={{ left: `${12 + i * 12.5}%`, top: `${18 + ((i * 41) % 62)}%` }}
            animate={{ y: [0, -18, 0], opacity: [0.1, 0.55, 0.1] }}
            transition={{ duration: 7 + (i % 3), repeat: Infinity, ease: "easeInOut", delay: i * 0.55 }} />
        ))}

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center gap-3.5">
          <GlossyOrb size={46} />
          <span style={shimmerStyle} className="text-xl font-semibold tracking-tight animate-[shimmer_4.5s_linear_infinite]">CA.RO CLINIC</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
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
          <div className="w-8 h-px bg-gradient-to-r from-transparent via-neutral-700 to-neutral-700" />
          CA.RO Studio
        </motion.div>
      </div>

      {/* ── Painel de acesso ──────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center px-6 py-12 sm:px-10 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-[#C9A84C]/[0.05] blur-[150px] pointer-events-none lg:hidden" />

        <div className="w-full max-w-sm relative z-10">
          {/* logo compacto (mobile) */}
          <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="flex lg:hidden flex-col items-center mb-10">
            <div className="mb-3"><GlossyOrb size={58} /></div>
            <h1 style={shimmerStyle} className="text-2xl font-semibold tracking-tight animate-[shimmer_4.5s_linear_infinite]">CA.RO CLINIC</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 font-mono mt-1">Precision Hair Medicine</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}
            className="relative" style={{ perspective: 1200 }}>
            {/* cartão de vidro com inclinação 3D real seguindo o cursor */}
            <motion.div onMouseMove={handleCardMouseMove} onMouseLeave={resetTilt}
              animate={{ rotateX: tilt.rx, rotateY: tilt.ry }} transition={{ type: "spring", stiffness: 200, damping: 22 }}
              className="relative rounded-2xl p-6 sm:p-7"
              style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
                backdropFilter: "blur(22px)",
                WebkitBackdropFilter: "blur(22px)",
                boxShadow: "0 30px 60px -20px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 0 0 1px rgba(255,255,255,0.05)",
                transformStyle: "preserve-3d",
              }}>
              {/* reflexo de vidro seguindo o cursor */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ background: `radial-gradient(360px circle at ${tilt.mx}% ${tilt.my}%, rgba(255,255,255,0.10), transparent 65%)` }} />
              <span className="absolute -top-px -left-px w-4 h-4 border-t border-l border-[#C9A84C]/50 rounded-tl-2xl" />
              <span className="absolute -top-px -right-px w-4 h-4 border-t border-r border-[#C9A84C]/50 rounded-tr-2xl" />
              <span className="absolute -bottom-px -left-px w-4 h-4 border-b border-l border-[#C9A84C]/50 rounded-bl-2xl" />
              <span className="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-[#C9A84C]/50 rounded-br-2xl" />

              <div className="relative">
                <AnimatePresence mode="wait">
                  {!devMode ? (
                    <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                      <h2 className="text-xl font-semibold text-white mb-1">Bem-vinda de volta</h2>
                      <p className="text-xs text-neutral-500 mb-7">
                        {mainRole === "medica" ? "Entre com seu e-mail e senha para acessar o painel." : "Digite seu CPF para acompanhar seu tratamento."}
                      </p>

                      <div className="relative grid grid-cols-2 bg-black/40 border border-[#222] rounded-xl p-1 mb-7">
                        {mainRoles.map(r => (
                          <button key={r.id} type="button" onClick={() => selectMainRole(r.id)}
                            className="relative py-2.5 rounded-lg cursor-pointer">
                            {mainRole === r.id && (
                              <motion.div layoutId="tab-pill" className="absolute inset-0 bg-[#C9A84C] rounded-lg shadow-[0_0_18px_rgba(201,168,76,0.4)]"
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
                              {fieldWrap(
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrMedica(""); }} autoFocus
                                    placeholder="dra.mariah@caroclinic.com.br"
                                    className="peer w-full bg-black/40 border border-[#2A2A2A] focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/15 text-white text-sm py-3 pl-10 pr-4 rounded-lg outline-none transition-all placeholder:text-neutral-700" />
                                </div>, "#C9A84C"
                              )}
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">Senha</label>
                              {fieldWrap(
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                  <input type="password" value={senha} onChange={e => { setSenha(e.target.value); setErrMedica(""); }}
                                    placeholder="••••••••"
                                    className="peer w-full bg-black/40 border border-[#2A2A2A] focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/15 text-white text-sm py-3 pl-10 pr-4 rounded-lg outline-none transition-all" />
                                </div>, "#C9A84C"
                              )}
                            </div>
                            {errMedica && errBox(errMedica)}
                            <div className="group">
                              {glossButton(
                                "w-full bg-gradient-to-b from-[#E9C86C] to-[#C9A84C] hover:from-[#F2D67E] hover:to-[#D9B85C] disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-bold uppercase tracking-widest py-3.5 rounded-lg transition-all shadow-[0_4px_20px_rgba(201,168,76,0.2)] hover:shadow-[0_8px_30px_rgba(201,168,76,0.35)]",
                                loading,
                                loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <><Lock className="w-3.5 h-3.5" />Entrar no Painel</>
                              )}
                            </div>
                          </motion.form>
                        ) : (
                          <motion.form key="paciente" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}
                            onSubmit={handlePaciente} className="space-y-4">
                            <div>
                              <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">CPF</label>
                              {fieldWrap(
                                <div className="relative">
                                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                  <input type="text" value={cpf} onChange={e => { setCpf(formatCpf(e.target.value)); setErrPac(""); }} autoFocus
                                    placeholder="000.000.000-00"
                                    className="peer w-full bg-black/40 border border-[#2A2A2A] focus:border-[#6B9FD4] focus:ring-2 focus:ring-[#6B9FD4]/15 text-white text-sm py-3 pl-10 pr-4 rounded-lg outline-none transition-all placeholder:text-neutral-700 font-mono tracking-wider" />
                                </div>, "#6B9FD4"
                              )}
                            </div>
                            {errPac && errBox(errPac)}
                            <div className="group">
                              {glossButton(
                                "w-full bg-gradient-to-b from-[#8BBEF4] to-[#6B9FD4] hover:from-[#9BC9F6] hover:to-[#7BAEE4] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest py-3.5 rounded-lg transition-all shadow-[0_4px_20px_rgba(107,159,212,0.2)] hover:shadow-[0_8px_30px_rgba(107,159,212,0.35)]",
                                loading || cpf.replace(/\D/g, "").length < 11,
                                loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><User className="w-3.5 h-3.5" />Acessar Portal</>
                              )}
                            </div>
                          </motion.form>
                        )}
                      </AnimatePresence>

                      <button type="button" onClick={openDev}
                        className="w-full mt-6 flex items-center justify-center gap-1.5 text-[10px] text-neutral-700 hover:text-neutral-500 transition cursor-pointer uppercase tracking-widest font-mono">
                        <Terminal className="w-3 h-3" /> Acesso técnico
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div key="dev" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                      <div className="flex items-center gap-3 mb-6">
                        <Terminal className="w-5 h-5 text-[#9B8EAF]" />
                        <h2 className="text-sm font-semibold text-white">Acesso Desenvolvedor</h2>
                      </div>
                      <form onSubmit={handleDev} className="space-y-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5">PIN de Desenvolvedor</label>
                          {fieldWrap(
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                              <input type="password" value={pin} onChange={e => { setPin(e.target.value); setErrDev(""); }} autoFocus
                                placeholder="••••••••"
                                className="peer w-full bg-black/40 border border-[#2A2A2A] focus:border-[#9B8EAF] focus:ring-2 focus:ring-[#9B8EAF]/15 text-white text-sm py-3 pl-10 pr-4 rounded-lg outline-none transition-all font-mono tracking-widest" />
                            </div>, "#9B8EAF"
                          )}
                        </div>
                        {errDev && errBox(errDev)}
                        <button type="submit" disabled={loading || !pin}
                          className="w-full bg-[#9B8EAF] hover:bg-[#AB9EBF] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest py-3.5 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer mt-1 active:scale-[0.98]">
                          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Terminal className="w-3.5 h-3.5" />Acessar Sistema</>}
                        </button>
                      </form>
                      <button onClick={closeDev} className="w-full mt-4 flex items-center justify-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-400 transition cursor-pointer py-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>

          <p className="text-center text-[10px] text-neutral-700 mt-10 font-mono">CA.RO CLINIC · Desenvolvido por CA.RO Studio</p>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}
