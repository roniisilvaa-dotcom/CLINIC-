import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Mail, Lock, UserCheck, Heart, Building2, IdCard, ArrowRight } from "lucide-react";

interface LoginResult {
  role: "medica" | "paciente" | "dev";
  nome: string;
  pacienteId?: string;
}

interface LoginScreenProps {
  onLogin: (result: LoginResult) => void;
}

type Modo = "medica" | "paciente" | "cadastro" | "dev";

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [modo, setModo] = useState<Modo>("medica");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // médica
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // paciente
  const [patientCpf, setPatientCpf] = useState("");
  const [nascimento, setNascimento] = useState("");

  // cadastro de clínica
  const [clinicaNome, setClinicaNome] = useState("");
  const [nomeMedica, setNomeMedica] = useState("");
  const [crm, setCrm] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      if (modo === "dev") {
        const r = await fetch("/api/auth/dev-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha: password }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Falha ao entrar.");
        onLogin({ role: "dev", nome: data.usuario.nome });
      } else if (modo === "medica") {
        const r = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha: password }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Falha ao entrar.");
        onLogin({ role: "medica", nome: data.usuario.nome });
      } else if (modo === "cadastro") {
        const r = await fetch("/api/auth/register-clinic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clinicaNome, nome: nomeMedica, email, senha: password, crm }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Falha ao criar conta.");
        onLogin({ role: "medica", nome: data.usuario.nome });
      } else {
        const r = await fetch("/api/auth/patient-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cpf: patientCpf, nascimento }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Não foi possível entrar.");
        onLogin({ role: "paciente", nome: data.paciente.nome, pacienteId: data.paciente.id });
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  const field =
    "w-full bg-[#15140F]/40 border border-white/10 rounded-xl pl-11 pr-3 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#C9A84C]/70 focus:bg-[#15140F]/70 focus:ring-1 focus:ring-[#C9A84C]/40 transition-all";
  const icon = "w-4 h-4 text-[#C9A84C]/70 absolute left-3.5 top-1/2 -translate-y-1/2";

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans text-white bg-[#0B0A08] relative overflow-hidden">
      {/* Glows dourados */}
      <div className="absolute top-[-25%] left-[20%] w-[700px] h-[700px] rounded-full bg-[#C9A84C]/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#C9A84C]/8 blur-[130px] pointer-events-none" />

      {/* ─── Branding ─── */}
      <div className="flex-1 hidden md:flex flex-col justify-between p-14 lg:p-20 relative border-r border-[#C9A84C]/15">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.12] mix-blend-luminosity"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1400')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B0A08] via-[#0B0A08]/70 to-transparent" />

        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl border border-[#C9A84C]/40 bg-[#C9A84C]/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#C9A84C]" />
          </div>
          <div>
            <div className="font-mono uppercase tracking-[0.32em] text-[11px] text-[#C9A84C]">CA.RO Clinic</div>
            <div className="text-[11px] text-white/40 tracking-wide">Inteligência clínica de precisão</div>
          </div>
        </div>

        <div className="relative space-y-6 max-w-md">
          <div className="h-px w-16 bg-gradient-to-r from-[#C9A84C] to-transparent" />
          <h1 className="text-5xl lg:text-[3.4rem] leading-[1.08] text-white" style={{ fontFamily: "Georgia, serif" }}>
            A excelência da <span className="text-[#C9A84C] italic">tricologia</span>, em uma só plataforma.
          </h1>
          <p className="text-white/55 text-[15px] leading-relaxed">
            Prontuários inteligentes, evolução capilar analisada por IA e um portal exclusivo para
            cada paciente. Gestão de alto padrão, do diagnóstico ao resultado.
          </p>
        </div>

        <div className="relative flex items-center gap-2 text-white/35 text-xs">
          <Heart className="w-3.5 h-3.5 text-[#C9A84C]" /> Desenvolvido com excelência para clínicas premium.
        </div>
      </div>

      {/* ─── Formulário ─── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-[380px]"
        >
          {/* Logo topo (mobile) */}
          <div className="md:hidden flex items-center gap-2 mb-8 justify-center text-[#C9A84C]">
            <Sparkles className="w-5 h-5" />
            <span className="font-mono uppercase tracking-[0.3em] text-xs">CA.RO Clinic</span>
          </div>

          <div className="relative rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl p-7 sm:p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
            {/* Filete dourado superior */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/70 to-transparent" />

            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                {modo === "cadastro" ? "Criar conta da clínica" : modo === "dev" ? "Acesso Desenvolvedor" : "Bem-vindo(a) de volta"}
              </h2>
              <p className="text-sm text-white/45 mt-1.5">
                {modo === "medica" && "Acesse o painel clínico com seu email e senha."}
                {modo === "paciente" && "Entre no seu portal com CPF e data de nascimento."}
                {modo === "cadastro" && "Cadastre sua clínica e comece em segundos."}
                {modo === "dev" && "Painel administrativo do sistema."}
              </p>
            </div>

            {/* Tabs */}
            {modo !== "cadastro" && modo !== "dev" && (
              <div className="flex gap-1 p-1 bg-black/30 border border-white/5 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => { setModo("medica"); setErrorMsg(""); }}
                  className={`flex-1 text-xs font-semibold py-2.5 rounded-lg transition-all ${modo === "medica" ? "bg-[#C9A84C] text-black shadow" : "text-white/50 hover:text-white/80"}`}
                >
                  <UserCheck className="w-3.5 h-3.5 inline mr-1.5" /> Médica / Equipe
                </button>
                <button
                  type="button"
                  onClick={() => { setModo("paciente"); setErrorMsg(""); }}
                  className={`flex-1 text-xs font-semibold py-2.5 rounded-lg transition-all ${modo === "paciente" ? "bg-[#C9A84C] text-black shadow" : "text-white/50 hover:text-white/80"}`}
                >
                  <Heart className="w-3.5 h-3.5 inline mr-1.5" /> Paciente
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {modo === "cadastro" && (
                <>
                  <div className="relative">
                    <Building2 className={icon} />
                    <input className={field} placeholder="Nome da clínica" value={clinicaNome} onChange={(e) => setClinicaNome(e.target.value)} required />
                  </div>
                  <div className="relative">
                    <UserCheck className={icon} />
                    <input className={field} placeholder="Seu nome (ex: Dra. Ana Paula)" value={nomeMedica} onChange={(e) => setNomeMedica(e.target.value)} required />
                  </div>
                  <div className="relative">
                    <IdCard className={icon} />
                    <input className={field} placeholder="CRM (opcional)" value={crm} onChange={(e) => setCrm(e.target.value)} />
                  </div>
                </>
              )}

              {(modo === "medica" || modo === "cadastro" || modo === "dev") && (
                <>
                  <div className="relative">
                    <Mail className={icon} />
                    <input type={modo === "dev" ? "text" : "email"} className={field} placeholder={modo === "dev" ? "Login" : "Email"} value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="relative">
                    <Lock className={icon} />
                    <input type="password" className={field} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </>
              )}

              {modo === "paciente" && (
                <>
                  <div className="relative">
                    <IdCard className={icon} />
                    <input className={field} placeholder="CPF" value={patientCpf} onChange={(e) => setPatientCpf(e.target.value)} required />
                  </div>
                  <div className="relative">
                    <Lock className={icon} />
                    <input type="date" className={`${field} [color-scheme:dark]`} value={nascimento} onChange={(e) => setNascimento(e.target.value)} required />
                  </div>
                </>
              )}

              {errorMsg && (
                <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">{errorMsg}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group w-full bg-gradient-to-r from-[#C9A84C] to-[#E0C36A] hover:to-[#C9A84C] text-black font-semibold text-sm py-3 rounded-xl transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 shadow-[0_8px_24px_-8px_rgba(201,168,76,0.6)]"
              >
                {loading ? "Aguarde…" : modo === "cadastro" ? "Criar clínica e entrar" : "Entrar"}
                {!loading && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/5 text-center text-xs text-white/40 space-y-2.5">
              {modo === "dev" ? (
                <button onClick={() => { setModo("medica"); setErrorMsg(""); }} className="hover:text-[#C9A84C] transition">
                  ← Voltar ao acesso da clínica
                </button>
              ) : modo === "cadastro" ? (
                <button onClick={() => { setModo("medica"); setErrorMsg(""); }} className="hover:text-[#C9A84C] transition">
                  Já tem conta? <span className="font-semibold text-white/70">Entrar</span>
                </button>
              ) : (
                <button onClick={() => { setModo("cadastro"); setErrorMsg(""); }} className="hover:text-[#C9A84C] transition">
                  Não tem conta da clínica? <span className="font-semibold text-white/70">Cadastre-se</span>
                </button>
              )}

              {modo !== "dev" && (
                <div>
                  <button onClick={() => { setModo("dev"); setErrorMsg(""); }} className="text-white/30 hover:text-[#C9A84C] transition">
                    Acesso desenvolvedor
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="mt-7 text-center text-[11px] text-white/30">
            Desenvolvido por CA.RO Tech — 2026 · Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
