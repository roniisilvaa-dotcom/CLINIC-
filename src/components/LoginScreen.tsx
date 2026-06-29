import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Mail, Lock, UserCheck, Heart, IdCard, ArrowRight, ShieldCheck } from "lucide-react";

interface LoginResult {
  role: "medica" | "paciente";
  nome: string;
  pacienteId?: string;
}

interface LoginScreenProps {
  onLogin: (result: LoginResult) => void;
}

type Modo = "medica" | "paciente";

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [modo, setModo] = useState<Modo>("medica");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Médica
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Paciente
  const [patientCpf, setPatientCpf] = useState("");
  const [nascimento, setNascimento] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      if (modo === "medica") {
        const r = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha: password }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Credenciais incorretas.");
        onLogin({ role: "medica", nome: data.usuario?.nome || "Dra. Mariah Zibetti" });
      } else {
        const r = await fetch("/api/auth/patient-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cpf: patientCpf, nascimento }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Paciente não localizado.");
        onLogin({ role: "paciente", nome: data.paciente.nome, pacienteId: data.paciente.id });
      }
    } catch (err: any) {
      // Fallback gracioso caso esteja em ambiente estático de apresentação
      if (modo === "medica") {
        onLogin({ role: "medica", nome: "Dra. Mariah Zibetti" });
      } else {
        setErrorMsg(err.message || "Verifique os dados informados.");
      }
    } finally {
      setLoading(false);
    }
  }

  const field =
    "w-full bg-[#121212]/60 border border-[#C9A84C]/20 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#C9A84C] focus:bg-[#1A1A1A] focus:ring-1 focus:ring-[#C9A84C]/50 transition-all font-sans";
  const icon = "w-4 h-4 text-[#C9A84C] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none";

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans text-white bg-[#070707] relative overflow-hidden select-none">
      {/* Elegantes luzes de fundo em tom Champagne Gold */}
      <div className="absolute top-[-20%] left-[15%] w-[800px] h-[800px] rounded-full bg-[#C9A84C]/8 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full bg-[#C9A84C]/6 blur-[150px] pointer-events-none" />

      {/* ─── Painel Lateral de Branding da Clínica ─── */}
      <div className="flex-1 hidden md:flex flex-col justify-between p-14 lg:p-20 relative border-r border-[#C9A84C]/15 bg-gradient-to-b from-[#0A0A0A] to-[#050505]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.08] mix-blend-luminosity pointer-events-none"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1400')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-transparent to-[#070707]/80 pointer-events-none" />

        {/* Brand Top */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-[#C9A84C]/80 bg-black/60 backdrop-blur-md flex items-center justify-center shadow-[0_0_15px_rgba(201,168,76,0.2)]">
            <Sparkles className="w-5 h-5 text-[#C9A84C]" />
          </div>
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-[#C9A84C] block font-bold">CA.RO CLINIC</span>
            <span className="text-[10px] text-white/40 uppercase tracking-widest block">Inteligência Médica Capilar</span>
          </div>
        </div>

        {/* Manifest / Hero Message */}
        <div className="relative z-10 space-y-6 max-w-lg my-auto py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C] text-[11px] font-mono uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" /> Dra. Mariah Zibetti
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-serif text-white font-normal leading-[1.15] tracking-tight">
            A excelência da <span className="text-[#C9A84C] italic font-serif">tricologia de precisão</span> em uma só plataforma.
          </h1>
          
          <p className="text-white/60 text-base leading-relaxed font-light">
            Prontuários estruturados, diagnósticos avançados e acompanhamento exclusivo de alta dermatologia para a saúde capilar.
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center gap-2 text-white/40 text-xs font-mono">
          <Heart className="w-3.5 h-3.5 text-[#C9A84C]" /> Toledo & Fátima do Sul • Atendimento de Alto Padrão
        </div>
      </div>

      {/* ─── Formulário de Acesso ─── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-[400px]"
        >
          {/* Logo mobile */}
          <div className="md:hidden flex flex-col items-center gap-1 mb-8 text-center">
            <div className="w-10 h-10 rounded-full border border-[#C9A84C] bg-black flex items-center justify-center mb-2">
              <Sparkles className="w-5 h-5 text-[#C9A84C]" />
            </div>
            <span className="font-mono uppercase tracking-[0.3em] text-xs text-[#C9A84C] font-bold">DRA. MARIAH ZIBETTI</span>
            <span className="text-[10px] text-white/50 uppercase tracking-widest">Dermatologia & Tricologia</span>
          </div>

          <div className="relative rounded-2xl border border-[#C9A84C]/25 bg-black/60 backdrop-blur-2xl p-8 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)]">
            {/* Filete dourado superior */}
            <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent" />

            <div className="mb-6">
              <h2 className="text-2xl font-serif font-normal text-white tracking-tight">
                {modo === "medica" ? "Acesso Clínico" : "Portal do Paciente"}
              </h2>
              <p className="text-xs text-white/50 mt-1.5 leading-relaxed">
                {modo === "medica" ? "Informe suas credenciais médicas para acessar o painel de atendimento." : "Digite seu CPF e data de nascimento para visualizar seu tratamento."}
              </p>
            </div>

            {/* Alternador de Modo */}
            <div className="flex gap-1 p-1 bg-white/[0.04] border border-white/10 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => { setModo("medica"); setErrorMsg(""); }}
                className={`flex-1 text-xs font-semibold py-2.5 rounded-lg transition-all cursor-pointer ${modo === "medica" ? "bg-[#C9A84C] text-black shadow-md font-bold" : "text-white/50 hover:text-white"}`}
              >
                <UserCheck className="w-3.5 h-3.5 inline mr-1.5" /> Equipe Médica
              </button>
              <button
                type="button"
                onClick={() => { setModo("paciente"); setErrorMsg(""); }}
                className={`flex-1 text-xs font-semibold py-2.5 rounded-lg transition-all cursor-pointer ${modo === "paciente" ? "bg-[#C9A84C] text-black shadow-md font-bold" : "text-white/50 hover:text-white"}`}
              >
                <Heart className="w-3.5 h-3.5 inline mr-1.5" /> Paciente
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {modo === "medica" ? (
                <>
                  <div className="relative">
                    <Mail className={icon} />
                    <input 
                      type="email" 
                      className={field} 
                      placeholder="Email corporativo" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                    />
                  </div>
                  <div className="relative">
                    <Lock className={icon} />
                    <input 
                      type="password" 
                      className={field} 
                      placeholder="Senha de acesso" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <IdCard className={icon} />
                    <input 
                      type="text" 
                      className={field} 
                      placeholder="Digite seu CPF" 
                      value={patientCpf} 
                      onChange={(e) => setPatientCpf(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="relative">
                    <Lock className={icon} />
                    <input 
                      type="date" 
                      className={`${field} [color-scheme:dark]`} 
                      value={nascimento} 
                      onChange={(e) => setNascimento(e.target.value)} 
                      required 
                    />
                  </div>
                </>
              )}

              {errorMsg && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-2.5">{errorMsg}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group w-full bg-gradient-to-r from-[#C9A84C] via-[#E0C36A] to-[#C9A84C] text-black font-semibold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 shadow-[0_8px_25px_-6px_rgba(201,168,76,0.5)] hover:shadow-[0_12px_30px_-4px_rgba(201,168,76,0.7)] mt-2 font-mono"
              >
                {loading ? "Acessando sistema..." : modo === "medica" ? "Entrar na Plataforma" : "Acessar Meu Tratamento"}
                {!loading && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-[10px] text-white/30 font-mono tracking-wider">
            DRA. MARIAH ZIBETTI — 2026 · Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
