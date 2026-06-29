import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  LogOut, 
  UserCheck, 
  TrendingUp, 
  Calendar, 
  Activity, 
  Dna, 
  Send, 
  Bot, 
  User, 
  ShieldCheck, 
  Download, 
  MapPin, 
  FileCheck 
} from "lucide-react";
import { Paciente, ConsultaHistorial } from "../types";

interface Message {
  id: string;
  sender: "medica" | "paciente";
  content: string;
  timestamp: string;
}

interface PortalPacienteProps {
  paciente: Paciente;
  onLogout: () => void;
  patientChat: Message[];
  onSendMessage: (content: string) => void;
}

export default function PortalPaciente({ 
  paciente, 
  onLogout, 
  patientChat, 
  onSendMessage 
}: PortalPacienteProps) {
  const [activeTab, setActiveTab] = useState<"evolucao" | "exames" | "fotos" | "chat">("evolucao");
  const [inputMsg, setInputMsg] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [patientChat, activeTab]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    onSendMessage(inputMsg);
    setInputMsg("");
  };

  return (
    <div id="portal_paciente_container" className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A] font-sans antialiased pb-20 select-none">
      
      {/* Upper Premium Header */}
      <header className="bg-[#0A0A0A] text-[#F5F0E8] border-b border-[#C9A84C]/20 px-4 py-3 sticky top-0 z-30 shadow-md">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full border border-[#C9A84C]/80 bg-black flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#C9A84C]" />
            </div>
            <div>
              <span style={{ fontFamily: "Georgia, serif" }} className="text-lg font-semibold tracking-tight text-[#C9A84C]">CA.RO Clinic</span>
              <span className="text-[8px] bg-[#C9A84C]/15 border border-[#C9A84C]/35 text-[#C9A84C] ml-2 px-1.5 py-0.5 rounded uppercase font-mono font-bold tracking-wider">Acesso Paciente</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-850 hover:bg-red-500/10 hover:text-red-400 text-xs text-neutral-400 font-mono rounded transition duration-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair do Portal</span>
          </button>

        </div>
      </header>

      {/* Hero Welcome banner */}
      <section className="bg-gradient-to-br from-[#12110F] via-[#1A1A1A] to-[#0A0A0A] text-white py-10 px-4 border-b border-[#C9A84C]/15">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-xs uppercase font-mono tracking-widest text-[#C9A84C] font-semibold">Boas-vindas ao seu Espaço de Saúde</h1>
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl font-light text-[#F5F0E8]">{paciente.nome}</h2>
            <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-gray-400">
              <span className="bg-[#C9A84C]/15 text-[#C9A84C] px-2 py-0.5 rounded font-bold uppercase">{paciente.status}</span>
              <span>•</span>
              <span>CRM PR 57.133 • Unidade {paciente.cidade}</span>
            </div>
          </div>

          {/* Treatment Progress */}
          <div className="bg-neutral-900/80 border border-neutral-800 p-4 rounded-xl min-w-[245px] w-full md:w-auto space-y-2 shadow-lg">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-neutral-450 uppercase font-bold text-[10px]">Evolução do tratamento</span>
              <span className="text-[#C9A84C] font-bold">{paciente.progresso}%</span>
            </div>
            
            <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#C9A84C] to-[#E3C875] rounded-full transition-all duration-1000"
                style={{ width: `${paciente.progresso}%` }}
              />
            </div>
            <p className="text-[9px] text-gray-400 font-sans tracking-wide leading-relaxed">Sua jornada clínica está em conformidade com o cronograma de regeneração celular.</p>
          </div>
        </div>
      </section>

      {/* Main Tab Navigation */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div className="flex bg-white border border-gray-200 p-1 rounded-xl mb-6 shadow-sm overflow-x-auto text-xs font-semibold select-none scrollbar-none">
          {[
            { id: "evolucao", label: "📋 Minha Evolução", desc: "Protocolos e consultas" },
            { id: "exames", label: "🩸 Exames Clínicos", desc: "Análises de exames" },
            { id: "fotos", label: "📸 Minha Galeria", desc: "Análise fotográfica" },
            { id: "chat", label: "💬 Chat Dra. Mariah", desc: "Canal direto e seguro" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[120px] py-3.5 px-4 rounded-lg transition text-left cursor-pointer ${
                activeTab === tab.id 
                  ? "bg-[#0A0A0A] text-white shadow-md font-bold" 
                  : "text-gray-500 hover:text-black hover:bg-gray-50"
              }`}
            >
              <div className="block font-medium tracking-wide leading-tight">{tab.label}</div>
              <span className={`text-[9px] block mt-0.5 font-normal ${activeTab === tab.id ? "text-[#C9A84C]" : "text-gray-400"}`}>{tab.desc}</span>
            </button>
          ))}
        </div>

        {/* Tab view containers */}
        <div className="space-y-6">
          
          {/* TAB 1: Evolucao / Consultas / Protocolos */}
          {activeTab === "evolucao" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
              
              {/* Protocolo Box */}
              <div className="md:col-span-2 space-y-6">
                
                <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-6.5 space-y-4">
                  <h3 style={{ fontFamily: "Georgia, serif" }} className="text-lg text-[#0A0A0A] font-semibold border-b border-gray-100 pb-2 flex items-center gap-1.5">
                    <Dna className="w-4.5 h-4.5 text-[#C9A84C]" /> Protocolo de Cuidados Atuais
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs text-gray-700 font-sans leading-relaxed">
                    
                    {paciente.protocolo.medicamentos && (
                      <div className="bg-gray-50 p-4 border border-gray-150 rounded-lg space-y-1.5">
                        <span className="text-[9px] font-mono text-gray-450 uppercase font-bold tracking-widest block">Medicamentoso</span>
                        <div className="whitespace-pre-line font-medium text-gray-800">{paciente.protocolo.medicamentos}</div>
                      </div>
                    )}

                    {paciente.protocolo.suplementacao && (
                      <div className="bg-gray-50 p-4 border border-gray-150 rounded-lg space-y-1.5">
                        <span className="text-[9px] font-mono text-gray-450 uppercase font-bold tracking-widest block">Nutracêuticos</span>
                        <div className="whitespace-pre-line font-medium text-gray-800">{paciente.protocolo.suplementacao}</div>
                      </div>
                    )}

                    {paciente.protocolo.cosmeticos && (
                      <div className="bg-gray-50 p-4 border border-gray-150 rounded-lg space-y-1.5">
                        <span className="text-[9px] font-mono text-gray-450 uppercase font-bold tracking-widest block">Shampoos e Tópicos</span>
                        <div className="whitespace-pre-line font-medium text-gray-800">{paciente.protocolo.cosmeticos}</div>
                      </div>
                    )}

                    {paciente.protocolo.procedimentos && (
                      <div className="bg-gray-50 p-4 border border-gray-150 rounded-lg space-y-1.5">
                        <span className="text-[9px] font-mono text-gray-450 uppercase font-bold tracking-widest block">Sessões em Clínica</span>
                        <div className="whitespace-pre-line font-medium text-gray-800">{paciente.protocolo.procedimentos}</div>
                      </div>
                    )}

                  </div>

                  <div className="bg-[#F5F0E8]/40 border border-[#C9A84C]/25 rounded-lg p-3.5 flex gap-3 text-xs items-center text-gray-600">
                    <ShieldCheck className="w-5 h-5 text-[#C9A84C]" />
                    <p className="font-sans font-medium">Siga rigorosamente as dosagens descritas. Quaisquer sintomas indesejados ou reações adicionais nas linhas capilares, fale conosco no canal de chat.</p>
                  </div>
                </div>

                {/* Historial de Consultas */}
                <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-6.5 space-y-4">
                  <h3 style={{ fontFamily: "Georgia, serif" }} className="text-lg text-[#0A0A0A] font-semibold border-b border-gray-100 pb-2 flex items-center gap-1.5">
                    <Calendar className="w-4.5 h-4.5 text-[#C9A84C]" /> Meu Histórico de Consultas
                  </h3>

                  <div className="space-y-4">
                    {paciente.consultas.map((visit) => (
                      <div key={visit.id} className="border border-gray-150 rounded-lg p-4 space-y-2 bg-gray-50 hover:bg-gray-50/50 transition duration-150">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-mono text-[10px] text-gray-450 font-bold">{visit.data}</span>
                          <span className="bg-white px-2 py-0.5 rounded border border-gray-200 font-semibold">{visit.tipo}</span>
                        </div>
                        <h4 style={{ fontFamily: "Georgia, serif" }} className="text-[#0A0A0A] font-bold text-sm">Queixa acompanhada</h4>
                        <p className="text-xs text-gray-600 font-sans font-medium">{visit.queixa}</p>
                        <hr className="border-gray-200" />
                        <h4 style={{ fontFamily: "Georgia, serif" }} className="text-gray-500 font-semibold text-xs">Evolução global / Parecer Médico</h4>
                        <p className="text-xs text-gray-600 italic font-sans font-medium">{visit.evolucao}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Diagnostico Sidebar Box */}
              <div className="space-y-6">
                <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[9px] font-mono text-[#C9A84C] uppercase font-bold tracking-widest block">Sumário Diagnóstico</span>
                    <h3 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-neutral-800 leading-tight font-medium">
                      {paciente.diagnostico.principal}
                    </h3>

                    {paciente.diagnostico.escalaLudwig && (
                      <div className="flex justify-between border-t border-b border-gray-100 py-2.5 text-xs font-mono">
                        <span className="text-neutral-450 uppercase font-bold">Escala Ludwig:</span>
                        <span className="font-bold text-gray-800">{paciente.diagnostico.escalaLudwig}</span>
                      </div>
                    )}

                    {paciente.diagnostico.escalaHamiltonNorwood && (
                      <div className="flex justify-between border-t border-b border-gray-100 py-2.5 text-xs font-mono">
                        <span className="text-neutral-450 uppercase font-bold">Escala Hamilton:</span>
                        <span className="font-bold text-gray-800">{paciente.diagnostico.escalaHamiltonNorwood}</span>
                      </div>
                    )}

                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] text-gray-450 font-mono uppercase font-bold">Condições Identificadas:</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {paciente.diagnostico.condicoesAssociadas.map((cond, i) => (
                          <span key={i} className="bg-gray-150 border border-gray-200 text-gray-800 text-[9px] px-2.5 py-1 rounded font-sans font-semibold">
                            {cond}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 mt-3 space-y-2">
                    <span className="text-[9px] text-gray-400 font-mono uppercase font-bold">Início do Acompanhamento</span>
                    <p className="text-xs text-[#0A0A0A] font-mono font-bold">{paciente.protocolo.dataInicio} ({paciente.protocolo.duracaoPrevista})</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Exames Clinicos */}
          {activeTab === "exames" && (
            <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-6.5 space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                  <h3 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#0A0A0A]">Seus Resultados e Laudos de Exames</h3>
                  <p className="text-xs text-gray-450 mt-0.5">Visão analítica dos biomarcadores otimizados para saúde capilar.</p>
                </div>

                <div className="font-mono text-[10px] text-gray-400">
                  Data de Coleta: <span className="font-bold text-neutral-800">{paciente.exames[0]?.data || "Não disponível"}</span>
                </div>
              </div>

              {paciente.exames.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6.5">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      
                      {[
                        { label: "Ferritina Séria", val: paciente.exames[0].ferritina, target: "> 70 ng/mL", key: "ferritina" },
                        { label: "Vitamina D", val: paciente.exames[0].vitD, target: "> 45 ng/mL", key: "vitD" },
                        { label: "TSH (Tireóide)", val: paciente.exames[0].tsh, target: "1.0 - 2.5 mIU/L", key: "tsh" },
                        { label: "Vitamina B12", val: paciente.exames[0].vitB12, target: "> 400 pg/mL", key: "vitB12" },
                        { label: "Zinco Séria", val: paciente.exames[0].zinco, target: "> 80 ug/dL", key: "zinco" },
                        { label: "Hemoglobina", val: paciente.exames[0].hemoglobina, target: "> 12.0 g/dL", key: "hemoglobina" },
                      ].map((item, i) => {
                        const status = paciente.exames[0].statusMap?.[item.key] || "normal";
                        return (
                          <div 
                            key={i} 
                            className={`p-4 rounded-lg border ${
                              status === "alterado" 
                                ? "bg-red-50/50 border-red-250 text-red-900" 
                                : status === "limitrofe"
                                ? "bg-amber-50/50 border-amber-250 text-amber-900"
                                : "bg-gray-50 border-gray-200 text-gray-800"
                            }`}
                          >
                            <span className="text-[9px] uppercase font-mono text-gray-400 font-bold block">{item.label}</span>
                            <div className="text-xl font-mono font-bold mt-1">{item.val || "N/D"}</div>
                            <span className="text-[8px] font-mono text-gray-400 block mt-0.5">Alvo capilar: {item.target}</span>
                          </div>
                        );
                      })}

                    </div>
                  </div>

                  {/* IA Analysis feedback laudo */}
                  <div className="bg-[#F5F0E8]/40 border border-[#C9A84C]/25 p-5 rounded-xl space-y-3 shadow-sm flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-mono text-[#C9A84C] font-semibold">
                        <Activity className="w-4 h-4" /> Laudo de Interpretação por IA
                      </div>
                      
                      <div className="text-xs text-gray-700 leading-relaxed font-sans font-medium whitespace-pre-wrap max-h-[220px] overflow-y-auto">
                        {paciente.exames[0].analiseIA || "O laudo interpretativo de otimização metabólica é gerado e revisado na clínica à luz dos estritos biomarcadores tricológicos da Dra. Mariah."}
                      </div>
                    </div>

                    <div className="border-t border-[#C9A84C]/15 pt-3 text-[10px] text-gray-400 italic">
                      Interpretado por CA.RO CLINIC Inteligência de Precisão.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 border border-dashed border-gray-200 text-center text-gray-400 italic font-mono">
                  Nenhum exame sanguíneo anexado no momento. Solicite na recepção ou em atendimento.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Minha Galeria Fotográfica */}
          {activeTab === "fotos" && (
            <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-6.5 space-y-6 animate-fadeIn">
              <div>
                <h3 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#0A0A0A]">Minha Evolução em Fotografia</h3>
                <p className="text-xs text-gray-450 mt-0.5">Acompanhe visualmente os resultados e nascimentos de novos fios.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {paciente.galeria.map((pic) => (
                  <div key={pic.id} className="border border-gray-250 bg-white p-2.5 rounded-xl space-y-2.5 shadow-sm">
                    <div className="relative h-48 rounded-lg overflow-hidden bg-gray-100">
                      <img src={pic.url} alt={pic.posicao} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute top-2.5 left-2.5 bg-black/85 text-[10px] text-neutral-350 px-2 py-1 rounded font-mono">
                        {pic.data}
                      </div>

                      <div className="absolute bottom-2.5 right-2.5 bg-[#C9A84C] text-black font-bold text-[10px] uppercase font-mono px-2.5 py-1 rounded">
                        {pic.posicao}
                      </div>
                    </div>

                    {pic.notaIa && (
                      <div className="p-2.5 bg-gray-50 border border-gray-150 rounded text-xs text-gray-600 leading-normal font-sans font-medium">
                        <span className="font-mono text-[9px] uppercase font-bold text-[#C9A84C] block mb-0.5">Laudo Comparativo:</span>
                        {pic.notaIa}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Live Chat securely connected with doctor */}
          {activeTab === "chat" && (
            <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl flex flex-col h-[520px] overflow-hidden animate-fadeIn">
              
              {/* Chat upper doctor presence bar */}
              <div className="bg-[#F5F0E8]/40 border-b border-[#E5E5E5] p-4 flex justify-between items-center sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full border border-[#C9A84C]/50 bg-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] text-xs font-serif font-bold">
                    MZ
                  </div>
                  <div>
                    <h4 style={{ fontFamily: "Georgia, serif" }} className="text-xs font-bold text-[#0A0A0A]">Dra. Mariah Zibetti</h4>
                    <span className="text-[10px] text-gray-400 font-mono block font-medium">Canal de Chat Seguro • Atendimento Individual</span>
                  </div>
                </div>

                <div className="flex bg-emerald-50 border border-emerald-250 text-emerald-700 text-[10px] font-mono font-bold uppercase py-1 px-3 rounded shadow-sm">
                  ● Conexão Segura
                </div>
              </div>

              {/* Chat Scroll container messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {patientChat.map((msg) => {
                  const isDoctor = msg.sender === "medica";
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex gap-3 max-w-[85%] sm:max-w-xl ${isDoctor ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                    >
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold ${
                        isDoctor 
                          ? "bg-white border-[#C9A84C]/50 text-[#C9A84C]" 
                          : "bg-[#0A0A0A] border-transparent text-[#F5F0E8]"
                      }`}>
                        {isDoctor ? "MZ" : <User className="w-4 h-4" />}
                      </div>

                      <div className="space-y-0.5">
                        <div className={`p-3.5 rounded-xl text-xs sm:text-sm shadow-sm leading-relaxed border ${
                          isDoctor 
                            ? "bg-white text-gray-800 border-gray-150 rounded-tl-none" 
                            : "bg-[#F5F0E8] text-gray-900 border-[#C9A84C]/35 rounded-tr-none"
                        }`}>
                          {msg.content}
                        </div>
                        <span className={`text-[8px] font-mono text-gray-400 block ${isDoctor ? "text-left" : "text-right"}`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Form message composer */}
              <form onSubmit={handleSend} className="bg-white p-3 border-t border-gray-150 flex gap-2">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Escreva uma mensagem com carinho para Dra. Mariah..."
                  className="flex-1 bg-gray-50 border border-gray-250 focus:border-[#C9A84C] focus:bg-white text-xs sm:text-sm py-2.5 px-3.5 rounded-lg outline-none font-sans font-medium"
                />
                <button
                  type="submit"
                  disabled={!inputMsg.trim()}
                  className="bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black hover:scale-102 transition duration-150 py-2.5 px-4 rounded-lg flex items-center justify-center shrink-0 cursor-pointer shadow disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}
