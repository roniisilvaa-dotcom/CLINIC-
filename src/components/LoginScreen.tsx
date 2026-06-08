import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, KeyRound, Mail, Lock, UserCheck, Heart } from "lucide-react";

interface LoginScreenProps {
  onLogin: (role: "medica" | "paciente", data: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [loginType, setLoginType] = useState<"medica" | "paciente">("medica");
  const [email, setEmail] = useState("dra.mariah@caroclinic.com.br");
  const [password, setPassword] = useState("senha123");
  const [patientCpf, setPatientCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    setTimeout(() => {
      if (loginType === "medica") {
        onLogin("medica", "Dra. Mariah Zibetti");
        setLoading(false);
      } else {
        // Validate CPF against MOCK patients
        const CPFS = [
          "123.456.789-00",
          "987.654.321-11",
          "111.222.333-44",
          "222.333.444-55",
          "444.555.666-88",
          "555.666.777-99"
        ];
        // strip dots/dashes
        const normalizedInput = patientCpf.replace(/\D/g, "");
        const matchedCpf = CPFS.find(cpf => cpf.replace(/\D/g, "") === normalizedInput || cpf === patientCpf);

        if (matchedCpf) {
          onLogin("paciente", matchedCpf);
          setLoading(false);
        } else {
          setErrorMsg("CPF não localizado no banco de pacientes. Verifique os dados ou solicite à Dra. Mariah.");
          setLoading(false);
        }
      }
    }, 1000);
  };

  return (
    <div id="login_container" className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A] flex flex-col md:flex-row font-sans items-stretch relative overflow-hidden">
      {/* Decorative Gold Radial Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#C9A84C]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#C9A84C]/5 blur-[120px] pointer-events-none" />

      {/* Left side: Golden luxury aesthetics branding */}
      <div className="flex-1 hidden md:flex flex-col justify-between p-12 lg:p-20 bg-gradient-to-br from-[#0F0F0F] via-[#1A1A1A] to-[#12110F] border-r border-[#C9A84C]/25 relative">
        <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-15" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1200')" }} />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full border border-[#C9A84C]/80 flex items-center justify-center bg-black shadow-[0_0_15px_rgba(201,168,76,0.3)]">
            <Sparkles className="w-5 h-5 text-[#C9A84C]" />
          </div>
          <div className="flex flex-col">
            <span style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#C9A84C] font-semibold tracking-tighter">CA.RO Clinic</span>
            <span className="text-[9px] block text-neutral-400 font-mono tracking-widest uppercase">Precision Tricology</span>
          </div>
        </div>

        <div className="max-w-md relative z-10 my-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl lg:text-5xl font-serif font-light leading-tight text-white mb-6"
          >
            Precisão clínica em <br />
            <span className="text-[#C9A84C] italic">cada fio</span>.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-neutral-300 text-sm leading-relaxed"
          >
            Plataforma Integrada de Tricologia de Alta Precisão e Inteligência Médica. Gerenciamento otimizado de exames metabólicos, exames de dermoscopia, evolução cromática e acompanhamento exclusivo de pacientes sob medida para a Dra. Mariah Zibetti.
          </motion.p>
        </div>

        <div className="relative z-10 text-xs text-neutral-500 border-t border-neutral-800 pt-6 flex justify-between">
          <span>Dra. Mariah Zibetti • CRM PR 57.133</span>
          <span>v3.0 CA.RO Edition</span>
        </div>
      </div>

      {/* Right side: Modern Golden/Black login form */}
      <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 lg:p-20 relative z-10 bg-white">
        <div className="max-w-md w-full mx-auto">
          
          {/* Logo on Mobile */}
          <div className="flex items-center gap-3 mb-8 md:hidden">
            <div className="w-9 h-9 rounded-full border border-[#C9A84C] flex items-center justify-center bg-black">
              <Sparkles className="w-4 h-4 text-[#C9A84C]" />
            </div>
            <div>
              <span style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#C9A84C] font-semibold tracking-tighter">CA.RO Clinic</span>
              <span className="text-[9px] block text-neutral-500 font-mono tracking-widest uppercase">Precision Tricology</span>
            </div>
          </div>

          <div className="mb-6">
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0A0A0A] font-normal mb-2">Portal de Acesso</h2>
            <p className="text-gray-500 text-sm">Selecione o seu perfil para prosseguir.</p>
          </div>

          {/* Tab Selector for Login Type */}
          <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-lg mb-6 text-xs font-semibold select-none">
            <button
              type="button"
              onClick={() => { setLoginType("medica"); setErrorMsg(""); }}
              className={`py-2 px-3 rounded-md transition text-center cursor-pointer font-bold ${
                loginType === "medica"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              👩‍⚕️ Dra. Mariah (Médico)
            </button>
            <button
              type="button"
              onClick={() => { setLoginType("paciente"); setErrorMsg(""); }}
              className={`py-2 px-3 rounded-md transition text-center cursor-pointer font-bold ${
                loginType === "paciente"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              🙋‍♀️ Sou Paciente (Acesso)
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 mb-5 rounded bg-red-50 border border-red-200 text-red-700 text-xs font-sans font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {loginType === "medica" ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-[#0A0A0A]/70 font-semibold block">
                    E-mail ou Usuário
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="dra.mariah@caroclinic.com.br"
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-[#0A0A0A] text-sm py-3 pl-10 pr-4 rounded-md outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs uppercase tracking-wider text-[#0A0A0A]/70 font-semibold block">
                      Senha de Segurança
                    </label>
                    <a href="#recuperar" className="text-xs text-gray-400 hover:text-[#C9A84C] transition">
                      Esqueceu a senha?
                    </a>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-[#0A0A0A] text-sm py-3 pl-10 pr-4 rounded-md outline-none transition"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2 text-xs">
                <label className="text-xs uppercase tracking-wider text-[#0A0A0A]/70 font-semibold block">
                  Informe seu CPF Cadastrado
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <UserCheck className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={patientCpf}
                    onChange={(e) => setPatientCpf(e.target.value)}
                    placeholder="Ex: 123.456.789-00"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-[#0A0A0A] text-sm py-3 pl-10 pr-4 rounded-md outline-none transition font-mono font-semibold"
                  />
                </div>
                <span className="text-[10px] text-[#C9A84C] font-semibold tracking-wide block mt-1">
                  💡 Credencial obtida diretamente na clínica da Dra. Mariah pelas guias de atendimento.
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-white border-gray-300 text-[#C9A84C] focus:ring-0 focus:ring-offset-0"
                />
                Lembrar neste dispositivo
              </label>
              <span className="text-xs text-gray-400">CA.RO CLINIC</span>
            </div>

            <button
              id="signin_btn"
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9A84C] hover:bg-[#D9B85C] disabled:opacity-55 active:scale-98 text-black text-sm uppercase tracking-widest font-semibold py-3.5 rounded-md transition shadow-[0_4px_20px_rgba(201,168,76,0.3)] mt-8 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Acessando...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>{loginType === "medica" ? "Entrar na Plataforma" : "Acessar Meu Tratamento"}</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Assist */}
          <div className="mt-10 p-4 rounded-md border border-[#C9A84C]/20 bg-[#F5F0E8]/40 text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-[#C9A84C] uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <Sparkles className="w-3.5 h-3.5" /> Demonstração e Testes Rápidos
            </p>
            <p className="font-sans font-medium">
              • **Médica**: Use credenciais padrão e entre diretamente.<br />
              • **Pacientes cadastrados**: Entre utilizando o CPF fictício de um dos pacientes, ex: **123.456.789-00** (Helena Silveira) ou **987.654.321-11** (Gabriela Portela) para testar o Portal do Paciente com seu desenvolvimento, histórico e chat dedicado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
