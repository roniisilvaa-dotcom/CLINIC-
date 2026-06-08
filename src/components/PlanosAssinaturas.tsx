import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Crown, 
  Check, 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  Sparkles, 
  Calendar,
  Lock,
  Download
} from "lucide-react";

interface PlanosAssinaturasProps {
  activePlan?: "Standard" | "Precision" | "Enterprise";
  onChangeActivePlan?: (plan: "Standard" | "Precision" | "Enterprise") => void;
}

export default function PlanosAssinaturas({ 
  activePlan = "Precision", 
  onChangeActivePlan 
}: PlanosAssinaturasProps) {

  const pricingPlans = [
    {
      id: "Standard",
      name: "Standard Clinical IA",
      price: "R$ 599/mês",
      desc: "Prontuário tricológico completo com agenda unificada, emissão de prescrições e limite de até 5 análises de exames/dermoscopia mensais via Inteligência Artificial.",
      features: [
        "Prontuário Capilar Eletrônico Completo (Fichas e Anamnese)",
        "Agenda Médica Unificada (Todas as Unidades)",
        "CA.RO Clinic IA Lite (Até 5 análises inteligentes de exames ou fotos/mês)",
        "Emissão e Histórico de Receituários Customizados",
        "Galeria de Fotos Comparativas Simples (Até 50 imagens por paciente)",
        "Portal de Acesso Permanente Seguro para Pacientes (Web/Celular)",
        "Canal de Chat Direto com Paciente (Mensagens Criptografadas)",
        "Faturamento Integrado Simplificado (Controle básico de caixa)",
        "Suporte técnico em horário comercial por Chat/E-mail"
      ],
      gold: false,
      badge: "Entrada"
    },
    {
      id: "Precision",
      name: "Precision Premium IA",
      price: "R$ 1.250/mês",
      desc: "Plataforma de alta precisão com IA analítica ilimitada, bio-sinaleiras, split-screen comparador de imagens e sincronização de prontuários de unidades.",
      features: [
        "Tudo do plano Standard (Ilimitado)",
        "CA.RO Clinic IA - Analisador Ilimitado de Exames",
        "CA.RO Clinic IA - Analisador de Sequência de Fotos",
        "Co-Piloto Diagnóstico em Chat Permanente",
        "Histórico e Emissão de Receituários em Letterhead",
        "Sincronização Integrada (Toledo & Fátima do Sul)",
        "Suporte Prioritário 24/7 via WhatsApp"
      ],
      gold: true,
      badge: "Mais Vendido"
    },
    {
      id: "Enterprise",
      name: "Enterprise Multi-Clinic IA",
      price: "R$ 2.150/mês",
      desc: "A solução definitiva sob medida para redes de clínicas, franquias ou cirurgiões capilares com alto volume e necessidades customizadas.",
      features: [
        "Tudo do plano Precision Premium",
        "Módulos de Telemedicina Avançados Integrados",
        "Suporte Multi-CNPJ e Controle Tributário Rateado",
        "API Pública para Integração Externa de CRM",
        "Backup em tempo real em Nuvem Federada",
        "Treinamento Remoto Dedicado de Equipes de Recepção",
        "Gerente de Conta Exclusivo e SLA de 2 horas"
      ],
      gold: false,
      badge: "Completo"
    }
  ];

  const invoices = [
    { id: "inv-1", data: "01/06/2026", valor: "R$ 1.250,00", status: "Pago", cartao: "Mastercard (**** 9081)" },
    { id: "inv-2", data: "01/05/2026", valor: "R$ 1.250,00", status: "Pago", cartao: "Mastercard (**** 9081)" },
    { id: "inv-3", data: "01/04/2026", valor: "R$ 1.250,00", status: "Pago", cartao: "Mastercard (**** 9081)" }
  ];

  return (
    <div id="planos_assinaturas_view" className="space-y-6 animate-fadeIn text-[#0A0A0A]">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#0A0A0A]/5 pb-6">
        <div>
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0A0A0A] font-normal">Planos e Assinaturas</h2>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1.5 font-sans">Gerencie seu licenciamento clinic premium e controle faturamentos recorrentes.</p>
        </div>

        <div className="bg-[#C9A84C]/15 border border-[#C9A84C]/35 px-3.5 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
          <Crown className="w-4.5 h-4.5 text-[#C9A84C]" />
          <span className="text-xs text-[#C9A84C] font-mono tracking-wider uppercase font-bold">Dra. Mariah (Precision Ativo)</span>
        </div>
      </div>

      {/* Grid of plans cards selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {pricingPlans.map((plan) => {
          const isActive = activePlan === plan.id;
          return (
            <div 
              key={plan.id}
              className={`bg-white border rounded-xl p-6 flex flex-col justify-between gap-6 transition relative overflow-hidden shadow-sm ${
                isActive 
                  ? "border-[#C9A84C] bg-[#F5F0E8]/20 shadow-md scale-102" 
                  : "border-gray-250 hover:border-[#C9A84C]/45"
              }`}
            >
              {isActive && (
                <div className="absolute right-0 top-0 bg-[#C9A84C] text-[#0A0A0A] text-[9px] uppercase tracking-widest font-extrabold font-mono px-3 py-1.5 rounded-bl-lg animate-pulse">
                  Plano Ativo Recorrente
                </div>
              )}
              
              {!isActive && plan.gold && (
                <div className="absolute right-0 top-0 bg-black text-[#C9A84C] text-[9px] uppercase tracking-widest font-extrabold font-mono px-3 py-1.5 rounded-bl-lg">
                  {plan.badge}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 style={{ fontFamily: "Georgia, serif" }} className={`text-xl font-medium ${isActive || plan.gold ? "text-[#C9A84C]" : "text-[#0A0A0A]"}`}>
                      {plan.name}
                    </h3>
                    {!isActive && !plan.gold && (
                      <span className="text-[8px] border border-gray-300 px-1.5 py-0.5 rounded text-gray-550 uppercase font-mono font-bold tracking-wider">{plan.badge}</span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-serif text-[#0A0A0A] font-light">{plan.price}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block ml-1">/ recorrência</span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed font-sans font-medium">
                  {plan.desc}
                </p>

                <div className="border-t border-gray-150 pt-4 space-y-2.5 text-xs">
                  <span className="text-[9px] uppercase tracking-wider font-mono text-gray-400 font-bold block">Recursos Integrados</span>
                  
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isActive ? "bg-[#C9A84C]/25 text-[#C9A84C]" : "bg-gray-100 text-gray-400 animate-none"
                      }`}>
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-gray-700 font-sans font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {isActive ? (
                <div className="bg-[#C9A84C]/15 border border-[#C9A84C]/40 rounded-lg p-3 text-center text-xs text-[#C9A84C] font-extrabold font-mono uppercase tracking-wider">
                  Licença Ativa com Sucesso
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (confirm(`Deseja alterar sua assinatura clínica para o plano ${plan.name}?`)) {
                      onChangeActivePlan?.(plan.id as any);
                    }
                  }}
                  className="w-full bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black py-2.5 rounded-lg text-xs font-mono font-bold uppercase transition cursor-pointer shadow-sm"
                >
                  Migrar para este Plano
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Synchronized offices details */}
      <div className="bg-white border border-gray-250 shadow-sm rounded-xl p-5 space-y-4">
        <h3 style={{ fontFamily: "Georgia, serif" }} className="text-base text-[#0A0A0A] font-semibold flex items-center gap-1.5 pb-2 border-b border-gray-100">
          <MapPin className="w-4 h-4 text-[#C9A84C]" /> Unidades e Dispositivos Licenciados
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg flex justify-between items-center shadow-inner">
            <div>
              <span className="font-bold text-gray-800 block font-serif">Unidade Toledo (PR)</span>
              <span className="text-gray-400 text-[10px] font-mono block mt-0.5">Dispositivo Clínico Ativo</span>
            </div>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-mono px-2.5 py-1 rounded font-bold uppercase tracking-wider">Vinculado</span>
          </div>

          <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg flex justify-between items-center shadow-inner">
            <div>
              <span className="font-bold text-gray-800 block font-serif">Unidade Fátima do Sul (MS)</span>
              <span className="text-gray-400 text-[10px] font-mono block mt-0.5">Dispositivo Clínico Ativo</span>
            </div>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-mono px-2.5 py-1 rounded font-bold uppercase tracking-wider">Vinculado</span>
          </div>
        </div>
      </div>

      {/* Recurrent Invoices logs */}
      <div className="bg-white border border-gray-250 shadow-sm rounded-xl p-5 space-y-4">
        <h3 style={{ fontFamily: "Georgia, serif" }} className="text-base text-[#0A0A0A] font-semibold flex items-center gap-1.5 pb-2 border-b border-gray-100">
          <CreditCard className="w-4.5 h-4.5 text-[#C9A84C]" /> Histórico de Faturamento Recorrente
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="text-gray-400 font-mono border-b border-gray-100 pb-2 text-[10px] uppercase tracking-wider font-bold">
                <th className="pb-3 font-bold">Código Cobrança</th>
                <th className="pb-3 font-bold">Data de Emissão</th>
                <th className="pb-3 font-bold">Valor Pago</th>
                <th className="pb-3 font-bold">Cartão de Crédito</th>
                <th className="pb-3 font-bold">Nota de Transação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map(inv => (
                <tr key={inv.id} className="text-gray-600 font-sans font-medium hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 font-mono font-bold text-gray-400">{inv.id}</td>
                  <td className="py-3">{inv.data}</td>
                  <td className="py-3 font-mono font-bold text-[#0A0A0A]">{inv.valor}</td>
                  <td className="py-3 text-gray-500">{inv.cartao}</td>
                  <td className="py-3">
                    <button 
                      onClick={() => alert("Histórico de nota fiscal eletrônica impressa!")}
                      className="text-[#C9A84C] hover:underline font-bold font-mono text-[10px] uppercase flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-[#C9A84C]" /> Obter PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
export {};
