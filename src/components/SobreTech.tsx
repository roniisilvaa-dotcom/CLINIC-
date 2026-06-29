import React from "react";
import { motion } from "motion/react";
import { 
  ShieldCheck, 
  Cpu, 
  Code2, 
  Database, 
  Zap, 
  Lock, 
  Sparkles, 
  Globe, 
  Award, 
  Terminal,
  CheckCircle2,
  Activity,
  Layers,
  Flame,
  Fingerprint,
  Radio,
  Binary,
  Server
} from "lucide-react";

export default function SobreTech() {
  return (
    <div id="sobre_tech_container" className="space-y-8 max-w-6xl mx-auto font-sans select-none pb-10">
      
      {/* Hero Header Supra Sumo */}
      <div className="relative rounded-3xl bg-[#070707] text-white p-8 md:p-14 border border-[#C9A84C]/40 shadow-[0_25px_80px_-15px_rgba(201,168,76,0.2)] overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute top-[-30%] right-[-10%] w-[600px] h-[600px] bg-[#C9A84C]/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#C9A84C]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#121212_1px,transparent_1px),linear-gradient(to_bottom,#121212_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#C9A84C]/50 bg-[#C9A84C]/15 text-[#C9A84C] text-xs font-mono font-bold uppercase tracking-widest backdrop-blur-md shadow-sm">
              <Sparkles className="w-4 h-4" /> Supra Sumo em Engenharia Médica & IA
            </div>
            
            <div className="flex items-center gap-2 text-xs font-mono text-[#C9A84C]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" /> 
              <span className="text-white font-semibold">CA.RO OS 2026.4</span> • Core Ativo
            </div>
          </div>

          <div className="space-y-3">
            <h1 style={{ fontFamily: "Georgia, serif" }} className="text-4xl md:text-6xl font-serif font-normal text-white tracking-tight leading-[1.1]">
              Arquitetura de Alta Dermatologia <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A84C] via-[#F3E5AB] to-[#C9A84C] italic font-serif">
                Desenvolvido por CA.RO TECH
              </span>
            </h1>
            
            <p className="text-white/70 text-base md:text-lg max-w-3xl font-light leading-relaxed">
              Sistema computacional de alta especificação projetado sob medida para a **Dra. Mariah Zibetti**. Fusão de Visão Computacional Follicular, Redes Neurais para Tricoscopia e Segurança Quântica de Dados em Nuvem.
            </p>
          </div>

          {/* Telemetry Bar */}
          <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/10 text-xs font-mono">
            <div className="bg-white/[0.03] border border-white/10 p-3.5 rounded-2xl backdrop-blur-md">
              <span className="text-white/40 block text-[10px] uppercase tracking-wider">Motor de IA</span>
              <span className="text-[#C9A84C] text-sm font-bold block mt-0.5">CA.RO 3.5 IA</span>
            </div>
            <div className="bg-white/[0.03] border border-white/10 p-3.5 rounded-2xl backdrop-blur-md">
              <span className="text-white/40 block text-[10px] uppercase tracking-wider">Latência de Inferência</span>
              <span className="text-emerald-400 text-sm font-bold block mt-0.5">&lt; 180ms Ultra-Fast</span>
            </div>
            <div className="bg-white/[0.03] border border-white/10 p-3.5 rounded-2xl backdrop-blur-md">
              <span className="text-white/40 block text-[10px] uppercase tracking-wider">Banco de Dados</span>
              <span className="text-sky-400 text-sm font-bold block mt-0.5">Neon PostgreSQL Serverless</span>
            </div>
            <div className="bg-white/[0.03] border border-white/10 p-3.5 rounded-2xl backdrop-blur-md">
              <span className="text-white/40 block text-[10px] uppercase tracking-wider">Criptografia</span>
              <span className="text-purple-400 text-sm font-bold block mt-0.5">AES-256 / Zero-Trust</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Inovações Exclusivas CA.RO TECH */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Pilar 1 */}
        <div className="bg-[#0D0D0D] text-white border border-[#C9A84C]/30 rounded-3xl p-7 shadow-xl relative overflow-hidden group hover:border-[#C9A84C] transition duration-300 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-black border border-[#C9A84C]/40 text-[#C9A84C] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Cpu className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#C9A84C] font-bold">Inovação #01</span>
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-2xl font-bold text-white leading-snug">Visão Computacional Subfolicular</h3>
            </div>
            <p className="text-xs text-white/60 leading-relaxed font-light">
              Algoritmos proprietários de análise microscópica que identificam ostios foliculares, contagem automática de densidade por $cm^2$ e mapeamento comparativo tridimensionado de alopecia.
            </p>
          </div>
          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#C9A84C]">
            <span>Módulo Tricologia IA</span>
            <span className="w-2 h-2 rounded-full bg-[#C9A84C]" />
          </div>
        </div>

        {/* Pilar 2 */}
        <div className="bg-[#0D0D0D] text-white border border-[#C9A84C]/30 rounded-3xl p-7 shadow-xl relative overflow-hidden group hover:border-[#C9A84C] transition duration-300 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-black border border-[#C9A84C]/40 text-[#C9A84C] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Fingerprint className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#C9A84C] font-bold">Inovação #02</span>
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-2xl font-bold text-white leading-snug">Sincronização Multi-Unidades</h3>
            </div>
            <p className="text-xs text-white/60 leading-relaxed font-light">
              Conexão distribuída em tempo real entre as unidades de Toledo e Fátima do Sul. O paciente é atendido em qualquer endereço com seus prontuários e receitas sincronizadas instantaneamente.
            </p>
          </div>
          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#C9A84C]">
            <span>Toledo & Fátima do Sul</span>
            <span className="w-2 h-2 rounded-full bg-[#C9A84C]" />
          </div>
        </div>

        {/* Pilar 3 */}
        <div className="bg-[#0D0D0D] text-white border border-[#C9A84C]/30 rounded-3xl p-7 shadow-xl relative overflow-hidden group hover:border-[#C9A84C] transition duration-300 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-black border border-[#C9A84C]/40 text-[#C9A84C] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#C9A84C] font-bold">Inovação #03</span>
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-2xl font-bold text-white leading-snug">Segurança de Nível Internacional</h3>
            </div>
            <p className="text-xs text-white/60 leading-relaxed font-light">
              Protocolos rígidos de privacidade médica em conformidade com a LGPD e HIPAA. Sessões encriptadas com assinaturas de chave única para proteção total dos exames e fotos.
            </p>
          </div>
          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#C9A84C]">
            <span>Zero-Trust Protocol</span>
            <span className="w-2 h-2 rounded-full bg-[#C9A84C]" />
          </div>
        </div>

      </div>

      {/* Certificado de Excelência e Autenticidade */}
      <div className="bg-[#0A0A0A] border border-[#C9A84C]/50 rounded-3xl p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <span className="text-xs font-mono text-[#C9A84C] uppercase tracking-widest font-bold">CERTIFICADO DE AUTENTICIDADE DA PLATAFORMA</span>
            <h3 style={{ fontFamily: "Georgia, serif" }} className="text-3xl font-serif text-white font-normal">Exclusividade Dra. Mariah Zibetti</h3>
          </div>

          <div className="w-16 h-16 rounded-full border-2 border-[#C9A84C] flex items-center justify-center font-serif text-[#C9A84C] text-xl font-bold bg-black shadow-[0_0_20px_rgba(201,168,76,0.3)]">
            MZ
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 text-xs text-white/70 leading-relaxed">
          <div className="space-y-3">
            <h4 className="font-mono text-xs text-[#C9A84C] uppercase font-bold tracking-wider">Compromisso de Engenharia CA.RO TECH:</h4>
            <p>
              Esta plataforma foi concebida, projetada e desenvolvida sob diretrizes científicas rigorosas para atender aos padrões estéticos e clínicos da clínica da Dra. Mariah Zibetti. Todo o ecossistema digital opera em alta performance no domínio exclusivo <strong className="text-white font-mono">clinic.carostudio.com.br</strong>.
            </p>
          </div>

          <div className="space-y-3 bg-white/[0.03] p-5 rounded-2xl border border-white/10">
            <h4 className="font-mono text-xs text-white uppercase font-bold tracking-wider flex items-center gap-2">
              <Binary className="w-4 h-4 text-[#C9A84C]" /> Engenharia de Sistemas 2026
            </h4>
            <p className="text-white/60">
              Desenvolvimento contínuo, inteligência generativa e manutenção proativa pela equipe de tecnologia da CA.RO TECH.
            </p>
            <div className="pt-2 font-mono text-[11px] text-[#C9A84C] font-bold">
              CA.RO TECH — High Tech Software Systems
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
