import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Bot, 
  Send, 
  Sparkles, 
  CornerDownLeft, 
  ClipboardCopy, 
  User, 
  Flame, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";
import { Paciente } from "../types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface IaAssistenteProps {
  pacientes?: Paciente[];
  activePlan?: "Standard" | "Precision" | "Enterprise";
  aiRunsCounter?: number;
  onIncrementAiRuns?: () => void;
  medicaNome?: string;
}

export default function IaAssistente({
  pacientes = [],
  activePlan = "Precision",
  aiRunsCounter = 2,
  onIncrementAiRuns,
  medicaNome = "Dra. Mariah Zibetti"
}: IaAssistenteProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init-1",
      role: "assistant",
      content: `Olá, ${medicaNome}. Sou o **CA.RO 3.5 IA**, seu copiloto de inteligência clínica em tricologia avançada.

Estou sincronizado com os prontuários capilares, análises de tricoscopia, exames laboratoriais e fórmulas manipuladas das unidades de Toledo e Fátima do Sul.

Como posso auxiliá-la na conduta terapêutica ou no raciocínio diagnóstico de hoje?`
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState("");

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll down chats
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const quickPrompts = [
    { label: "Caso Helena Silveira", text: "Como está o caso da paciente Helena Silveira? Faça um compilado da evolução dela." },
    { label: "Caso Gabriela Oliveira", text: "Me explique todos os detalhes do prontuário, exames e conduta da Gabriela." },
    { label: "Diferença: Eflúvio vs FPHL", text: "Explique em detalhes como diferenciar o diagnóstico clínico de Eflúvio Telógeno Crônico e FPHL (Female Pattern Hair Loss) no consultório." },
    { label: "Suplementação p/ Ferritina Baixa", text: "Qual a melhor dosagem e composto de ferro elementar para uma paciente com queixa de queda ativa e Ferritina sérica de 15 ng/mL?" }
  ];

  const handleSendMessage = async (rawText: string) => {
    if (!rawText.trim()) return;

    if (activePlan === "Standard" && aiRunsCounter >= 5) {
      alert("Aviso: Limite de cota atingido para o plano Standard IA.");
      return;
    }

    setLoading(true);

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: rawText
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");

    // Dynamically serialize clinical patient context for the Gemini model
    const pacientesContextoPrompt = pacientes.map(p => {
      return `
• Paciente ID: ${p.id}
  Nome: ${p.nome}
  Idade: ${p.idade} anos
  Cidade: Unidade ${p.cidade}
  CPF: ${p.cpf}
  Status de Tratamento: ${p.status} (Progresso Geral: ${p.progresso}%)
  Queixa Inicial: ${p.queixaPrincipal}
  Diagnóstico Técnico Principal: ${p.diagnostico.principal} (Condições Associadas: ${p.diagnostico.condicoesAssociadas.join(", ")})
  Escalas: Ludwig = ${p.diagnostico.escalaLudwig || "N/A"}, Hamilton-Norwood = ${p.diagnostico.escalaHamiltonNorwood || "N/A"}
  Protocolo Atualizado:
    - Medicamentos: ${p.protocolo.medicamentos}
    - Suplementação / Nutracêuticos: ${p.protocolo.suplementacao}
    - Cosméticos: ${p.protocolo.cosmeticos}
    - Procedimentos Clínicos: ${p.protocolo.procedimentos}
  Histórico de Consultas anteriores:
    ${p.consultas.map(c => `[Data: ${c.data} | Tipo: ${c.tipo}] - Queixa: ${c.queixa} | Evoluções Clínicas: ${c.evolucao}`).join("\n    ")}
  Resultados Laboratoriais Recentes:
    TSH: ${p.exames[0]?.tsh || "N/D"}, T4 Livre: ${p.exames[0]?.t4Livre || "N/D"}, Ferritina: ${p.exames[0]?.ferritina || "N/D"}, Vitamina D: ${p.exames[0]?.vitD || "N/D"}, Vitamina B12: ${p.exames[0]?.vitB12 || "N/D"}, Zinco: ${p.exames[0]?.zinco || "N/D"}
`;
    }).join("\n---\n");

    const systemInstruction = `Você é o CA.RO Clinic IA, um assistente de decisão de precisão capilar em saúde capilar, que atua como copiloto clínico exclusivo da médica responsável da clínica.

Você tem acesso completo aos prontuários e dados clínicos em tempo real dos seguintes pacientes cadastrados na clínica:
=========================================
${pacientesContextoPrompt}
=========================================

Suas diretrizes fundamentais:
1. Forneça raciocínio clínico de altíssimo nível, citando ativos e condutas científicas (Finasterida, Minoxidil oral, Dutasterida, MMP, Microgulhamento). Conecte as evoluções clínicas dos pacientes respondendo perguntas como "como está o caso da paciente Helena Silveira?". Dê detalhes como diagnóstico, progresso, exames recentes e condutas.
2. Seja objetivo, sofisticado, humanizado e extremamente preciso. Redija respostas em PORTUGUÊS brasileiro clássico de padrão acadêmico e médico formal. Use Markdown.
3. Se a pergunta for sobre um paciente não cadastrado acima, responda sob uma ótica geral de diretrizes clínicas internacionais.
4. Sempre exiba o seguinte rodapé curto de disclaimer:
"*CA.RO Clinic IA: Ferramenta de inteligência crítica de precisão e apoio à conduta exclusiva da médica responsável.*"`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          systemInstruction
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content: data.text
        }]);
        onIncrementAiRuns?.();
      } else {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content: `Falha na requisição com o servidor: ${data.error || "Erro desconhecido."}`
        }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: `Sem conectividade ativa com a IA CA.RO Clinic. ${err.message}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  };

  const isLimitReached = activePlan === "Standard" && (aiRunsCounter ?? 0) >= 5;

  return (
    <div id="ia_assistente_view" className="flex flex-col h-[calc(100vh-140px)] bg-white border border-[#E5E5E5] shadow-sm rounded-xl overflow-hidden animate-fadeIn text-[#0A0A0A]">
      
      {/* Panel Top Header */}
      <div className="bg-[#F5F0E8]/40 p-4 border-b border-[#E5E5E5] flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/50 flex items-center justify-center shadow-sm">
            <Bot className="w-4.5 h-4.5 text-[#C9A84C]" />
          </div>
          <div>
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-base font-semibold text-[#0A0A0A]">CA.RO Clinic IA • Co-Piloto de Decisão</h2>
            <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase font-semibold">Suporte Médico em Tricologia</span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between">
          {activePlan === "Standard" && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-[10px] font-semibold text-amber-700 font-mono uppercase">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              Cota Standard: {aiRunsCounter}/5 Mensais
            </div>
          )}
          {activePlan !== "Standard" && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-250 rounded-full text-[10px] font-semibold text-emerald-700 font-mono uppercase">
              <span className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full" />
              IA Ilimitada • {activePlan}
            </div>
          )}
          <div className="hidden md:flex items-center gap-1.5 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full animate-pulse" />
            <span className="text-[9px] text-[#C9A84C] font-semibold tracking-widest font-mono uppercase">Modelo gemini-3.5-flash</span>
          </div>
        </div>
      </div>

      {/* Main Conversational scrollbox */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gray-50/50"
      >
        {messages.map((msg) => {
          const isBot = msg.role === "assistant";
          return (
            <div 
              key={msg.id} 
              className={`flex gap-3.5 max-w-3xl ${isBot ? "mr-auto" : "ml-auto flex-row-reverse"}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                isBot 
                  ? "bg-white border-[#C9A84C]/45 text-[#C9A84C]" 
                  : "bg-[#C9A84C] border-transparent text-white"
              }`}>
                {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div className="space-y-1">
                <div className={`p-4 rounded-xl text-xs sm:text-sm leading-relaxed border ${
                  isBot 
                    ? "bg-white text-gray-800 border-[#E5E5E5] shadow-sm rounded-tl-none" 
                    : "bg-[#F5F0E8] text-gray-900 border-[#C9A84C]/35 rounded-tr-none"
                }`}>
                  <div className="prose prose-sm">
                    {msg.content.split("\n").map((para, idx) => {
                      let renderText = para;
                      
                      // Handle headers
                      if (para.startsWith("### ")) {
                        return <h4 key={idx} className="font-sans font-bold text-[#C9A84C] mt-3 mb-1 text-sm">{para.replace("### ", "")}</h4>;
                      }
                      if (para.startsWith("## ")) {
                        return <h3 key={idx} style={{ fontFamily: "Georgia, serif" }} className="font-bold text-[#0A0A0A] mt-4 mb-2 text-base">{para.replace("## ", "")}</h3>;
                      }

                      // Render basic markdown italic / bold styling
                      const boldRegex = /\*\*(.*?)\*\*/g;
                      const parts = [];
                      let lastIndex = 0;
                      let match;
                      
                      while ((match = boldRegex.exec(para)) !== null) {
                        if (match.index > lastIndex) {
                          parts.push(para.substring(lastIndex, match.index));
                        }
                        parts.push(<strong key={match.index} className="text-[#C9A84C] font-semibold">{match[1]}</strong>);
                        lastIndex = boldRegex.lastIndex;
                      }
                      if (lastIndex < para.length) {
                        parts.push(para.substring(lastIndex));
                      }

                      return (
                        <p key={idx} className="mb-2 text-gray-700 font-sans tracking-wide leading-relaxed">
                          {parts.length > 0 ? parts : renderText}
                        </p>
                      );
                    })}
                  </div>
                </div>

                {/* Quick copy clinical notes button */}
                {isBot && (
                  <button
                    onClick={() => copyToClipboard(msg.content, msg.id)}
                    className="text-[10px] text-gray-400 hover:text-[#C9A84C] transition flex items-center gap-1 font-mono pt-1 cursor-pointer select-none"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500 font-semibold">Copiado para Área Clínica!</span>
                      </>
                    ) : (
                      <>
                        <ClipboardCopy className="w-3.5 h-3.5" />
                        <span>Copiar para Prontuário do Paciente</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-2xl">
            <div className="w-8 h-8 rounded-full bg-white border border-[#C9A84C]/35 text-[#C9A84C] flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-[#E5E5E5] p-4 rounded-xl rounded-tl-none flex items-center gap-3 shadow-sm">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-xs text-gray-450 font-mono italic">Consultando diretrizes tricológicas...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input panel with suggestions bar */}
      <div className="bg-white p-4 border-t border-[#E5E5E5] space-y-3.5 select-none font-sans">
        
        {/* Suggestion Chips */}
        {!isLimitReached && (
          <div className="flex gap-2.5 overflow-x-auto pb-1 select-none">
            {quickPrompts.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip.text)}
                className="px-3.5 py-1.5 rounded-full bg-gray-50 hover:bg-[#F5F0E8]/50 hover:border-[#C9A84C]/50 border border-gray-250 text-[10px] uppercase font-bold tracking-wider text-[#C9A84C] transition whitespace-nowrap cursor-pointer shrink-0"
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Form controls or Paywall */}
        {isLimitReached ? (
          <div className="bg-[#F5F0E8]/50 border border-[#C9A84C]/50 rounded-lg p-5 text-center space-y-3 animate-fadeIn">
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-[#C9A84C]/25 text-[#C9A84C] flex items-center justify-center shadow-inner">
                <Flame className="w-5 h-5 animate-bounce" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 style={{ fontFamily: "Georgia, serif" }} className="text-sm font-semibold text-gray-900">Cota Mensal de 5 Análises Esgotada</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                Você atingiu o limite de 5 consultas à IA do plano <strong>Standard Clinical IA</strong> de R$ 599/mês. 
                Atualize para o plano <strong>Precision Premium IA</strong> para copilotagem ilimitada, análises de exames infinitas e split-screen comparador.
              </p>
            </div>
            <div className="pt-1.5">
              <span className="text-[10px] uppercase font-bold text-[#C9A84C] bg-white border border-[#C9A84C]/35 px-3 py-1 rounded-full font-mono">
                Recomendado pela Associação de Tricologia
              </span>
            </div>
          </div>
        ) : (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputMessage);
            }}
            className="relative bg-gray-50 rounded-lg border border-gray-250 focus-within:border-[#C9A84C] focus-within:bg-white transition-all p-2"
          >
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputMessage);
                }
              }}
              placeholder="Pergunte ao CA.RO Clinic IA (Ex. 'Latanoprosta 0.05% loção contra-indicações'...) ..."
              rows={1}
              className="w-full bg-transparent text-sm max-h-24 resize-none outline-none border-none py-1.5 px-2 text-[#0A0A0A] font-sans font-medium"
            />
            <div className="flex justify-between items-center mt-2 border-t border-gray-100 pt-2 px-1">
              <span className="text-[10px] text-gray-450 font-sans flex items-center gap-1 select-none">
                <AlertTriangle className="w-3.5 h-3.5 text-[#C9A84C]" /> Assistente de apoio clínico — decisão final é da médica responsável.
              </span>

              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="bg-[#0A0A0A] text-white hover:bg-[#C9A84C] hover:text-black disabled:opacity-40 p-1.5 rounded-md transition cursor-pointer flex items-center justify-center shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
}
export {};
