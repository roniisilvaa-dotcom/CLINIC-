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
  ExternalLink
} from "lucide-react";

export default function SobreTech() {
  return (
    <div id="sobre_tech_container" className="space-y-8 max-w-5xl mx-auto">
      
      {/* Header Hero Banner */}
      <div className="relative rounded-3xl bg-[#0A0A0A] text-white p-8 md:p-12 border border-[#C9A84C]/30 shadow-2xl overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#C9A84C]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C9A84C]/40 bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-mono font-bold uppercase tracking-widest">
            <Sparkles className="w-4 h-4" /> Engenharia de Software Médica
          </div>

          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl md:text-5xl font-serif font-normal text-white tracking-tight leading-tight">
            Desenvolvido por <span className="text-[#C9A84C] italic font-serif">CA.RO TECH</span>
          </h1>

          <p className="text-white/60 text-sm md:text-base max-w-2xl font-light leading-relaxed">
            Plataforma de alta precisão clínica desenvolvida sob medida para a **Dra. Mariah Zibetti** (Dermatologia & Tricologia Avançada). Inteligência artificial aplicada à saúde capilar, gestão de prontuários e experiência boutique do paciente.
          </p>

          <div className="pt-4 flex flex-wrap gap-4 text-xs font-mono text-[#C9A84C]">
            <span className="flex items-center gap-1.5 bg-[#151515] px-3.5 py-2 rounded-xl border border-[#C9A84C]/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Versão 2026.4 Production
            </span>
            <span className="flex items-center gap-1.5 bg-[#151515] px-3.5 py-2 rounded-xl border border-[#C9A84C]/20">
              <Globe className="w-4 h-4 text-sky-400" /> Host: clinic.carostudio.com.br
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Pilares Tecnológicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Inteligência Artificial */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-[#C9A84C]/50 transition duration-200 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#0A0A0A] text-[#C9A84C] flex items-center justify-center border border-[#C9A84C]/30 shadow-md">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 style={{ fontFamily: "Georgia, serif" }} className="text-xl font-bold text-[#0A0A0A]">IA & Tricoscopia</h3>
          <p className="text-xs text-gray-500 leading-relaxed font-sans">
            Motor de inteligência artificial treinado para raciocínio diagnóstico de doenças do couro cabeludo, análise folicular por imagem e cálculo de prescrições manipuladas de alta precisão.
          </p>
        </div>

        {/* Card 2: Arquitetura de Banco Serverless */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-[#C9A84C]/50 transition duration-200 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#0A0A0A] text-[#C9A84C] flex items-center justify-center border border-[#C9A84C]/30 shadow-md">
            <Database className="w-6 h-6" />
          </div>
          <h3 style={{ fontFamily: "Georgia, serif" }} className="text-xl font-bold text-[#0A0A0A]">Neon DB & Cloud</h3>
          <p className="text-xs text-gray-500 leading-relaxed font-sans">
            Infraestrutura de dados PostgreSQL serverless com alta disponibilidade, backups redundantes automáticos e tempo de resposta de ultra baixa latência para sincronização das unidades.
          </p>
        </div>

        {/* Card 3: Segurança e Privacidade */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-[#C9A84C]/50 transition duration-200 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#0A0A0A] text-[#C9A84C] flex items-center justify-center border border-[#C9A84C]/30 shadow-md">
            <Lock className="w-6 h-6" />
          </div>
          <h3 style={{ fontFamily: "Georgia, serif" }} className="text-xl font-bold text-[#0A0A0A]">Segurança HIPPA/LGPD</h3>
          <p className="text-xs text-gray-500 leading-relaxed font-sans">
            Criptografia ponta a ponta em sessões médicas, controle estrito de acesso para pacientes via autenticação por token e proteção total de dados sensíveis de saúde.
          </p>
        </div>

      </div>

      {/* Seção de Especificações e Suporte Técnico */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
          <div>
            <h3 style={{ fontFamily: "Georgia, serif" }} className="text-2xl font-bold text-[#0A0A0A]">Especificações do Sistema</h3>
            <p className="text-xs text-gray-400 font-mono mt-1 uppercase tracking-wider">Desenvolvimento de Software Sob Medida</p>
          </div>
          <span className="bg-[#0A0A0A] text-[#C9A84C] text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg border border-[#C9A84C]/30 uppercase tracking-widest">
            CA.RO TECH OFFICIAL
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
          <div className="space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-wider text-[#C9A84C] font-bold">Módulos Ativos no Sistema:</h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Prontuário Eletrônico com Anamnese de Tricologia</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Biblioteca de Prescrições Magistrais & Receituário Timbrado</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Galeria Capilar com Comparador Visual Antes vs Depois</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Agenda Multi-Unidades (Toledo e Fátima do Sul)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Portal Exclusivo do Paciente com Chat de Acompanhamento</li>
            </ul>
          </div>

          <div className="space-y-3 bg-gray-50 p-5 rounded-xl border border-gray-200/80">
            <h4 className="font-mono text-xs uppercase tracking-wider text-[#0A0A0A] font-bold flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-[#C9A84C]" /> Suporte & Manutenção Especializada
            </h4>
            <p className="text-gray-600 text-xs leading-relaxed">
              Sistema mantido e monitorado de forma contínua pela equipe de engenharia da **CA.RO TECH**. Para atualizações de código ou novas funcionalidades personalizadas, entre em contato com o suporte de desenvolvimento.
            </p>
            <div className="pt-2">
              <span className="text-[11px] font-mono text-[#C9A84C] font-bold block">CA.RO TECH — Software Engineering 2026</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
