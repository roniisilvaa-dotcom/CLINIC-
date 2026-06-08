import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Dna, 
  Bot, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  FileText, 
  TrendingUp, 
  ChevronLeft,
  Activity
} from "lucide-react";
import { Paciente, ConsultaHistorial } from "../types";

interface NovaConsultaProps {
  paciente: Paciente;
  onClose: () => void;
  onSave: (pacienteId: string, novaConsulta: ConsultaHistorial) => void;
}

export default function NovaConsulta({ paciente, onClose, onSave }: NovaConsultaProps) {
  // Symptom states
  const [queixa, setQueixa] = useState("");
  const [indicadorMiniaturizacao, setIndicadorMiniaturizacao] = useState("Leve");
  const [eritema, setEritema] = useState(false);
  const [desquamacao, setDesquamacao] = useState(false);
  const [prurido, setPrurido] = useState(false);
  const [tampoesCorneos, setTampoesCorneos] = useState(false);

  // Hair Pull test physical diagnostic state
  const [hairPullTest, setHairPullTest] = useState<"Positivo" | "Negativo">("Negativo");

  // Densitometry volumes
  const [densidadeVertex, setDensidadeVertex] = useState("120");
  const [densidadeOccipital, setDensidadeOccipital] = useState("180");

  // Medical modifications notes
  const [condutas, setCondutas] = useState("");
  const [evolucaoNota, setEvolucaoNota] = useState("");

  // AI Summary generation state
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState("");

  const handleGenerateSummaryWithIA = async () => {
    setLoadingSummary(true);
    setAiSummaryText("");
    
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pacienteNome: paciente.nome,
          diagnostico: paciente.diagnostico.principal,
          queixaRecente: queixa || "Queda ativa de hastes relatada pelo paciente.",
          miniaturizacao: indicadorMiniaturizacao,
          inflamacao: { eritema, desquamacao, prurido, tampoesCorneos },
          hairPullTest,
          densitometria: { vertex: densidadeVertex, occipital: densidadeOccipital },
          conclusao: condutas || "Inicia protocolo otimizado de indução capilar domiciliar."
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAiSummaryText(data.summary);
      } else {
        setAiSummaryText(`Falha no interpretador: ${data.error}`);
      }
    } catch (err: any) {
      setAiSummaryText(`Erro de rede com a central CA.RO Clinic: ${err.message}`);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleFinishAndPublish = () => {
    const novaVisita: ConsultaHistorial = {
      id: `vis-${Date.now()}`,
      data: new Date().toISOString().split("T")[0],
      tipo: "Online", // Must match types definition literal
      queixa: queixa || "Queixa de afinamento ativo acompanhada no consultório.",
      evolucao: evolucaoNota || `Paciente apresenta densitometria capilar de ${densidadeVertex} fios/cm² em região de ápice e miniaturização classificada como ${indicadorMiniaturizacao}.`,
      alteracoesProtocolo: condutas || "Continuidade das loções padrão prescritas.",
      examesSolicitados: "Nenhum no momento",
      resumoIa: aiSummaryText || "Resumo inteligente não gerado para esta visita."
    };

    onSave(paciente.id, novaVisita);
    alert("Consulta finalizada e gravada com sucesso no prontuário capilar!");
  };

  return (
    <div id="nova_consulta_sheet" className="p-1 max-w-4xl mx-auto space-y-6 animate-fadeIn text-[#0A0A0A]">
      
      {/* Header controls back */}
      <div className="flex justify-between items-center border-b border-gray-150 pb-4">
        <div>
          <button 
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#C9A84C] font-mono uppercase tracking-wider font-bold mb-1.5 cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Cancelar / Voltar
          </button>
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0A0A0A] font-normal">Ficha de Consulta Ativa</h2>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Prontuário capilar: <span className="text-[#0A0A0A]">{paciente.nome}</span></p>
        </div>

        <div className="bg-white border border-gray-250 px-4 py-2 rounded-lg text-right hidden sm:block shadow-sm">
          <span className="text-[9px] text-gray-400 font-mono tracking-wider block uppercase font-bold">Status Paciente</span>
          <span className="text-xs font-bold text-gray-700 font-mono">{paciente.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form Fields details */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Section: Symptoms / Anamnese Capilar */}
          <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-5 space-y-4">
            <h3 style={{ fontFamily: "Georgia, serif" }} className="text-base text-[#0A0A0A] font-semibold tracking-wide pb-1.5 border-b border-gray-100 flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-[#C9A84C]" /> 1. Anamnese de Queixa Atual
            </h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs uppercase text-gray-400 font-mono block font-bold">Anamnese clínica detalhada desta visita</label>
                <textarea 
                  value={queixa} 
                  onChange={(e) => setQueixa(e.target.value)}
                  placeholder="Ex: Refere controle da queda ativa após 2 meses de Minoxidil, mas nota afinamento bitemporal persistente..."
                  rows={2} 
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-xs text-[#0A0A0A] p-2.5 rounded outline-none font-sans font-medium" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase text-gray-400 font-mono block font-bold">Grau de miniaturização clínica detectada</label>
                  <select 
                    value={indicadorMiniaturizacao} 
                    onChange={(e) => setIndicadorMiniaturizacao(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-xs text-gray-700 p-2.5 rounded outline-none cursor-pointer"
                  >
                    <option value="Inexistente">Inexistente</option>
                    <option value="Leve">Leve (&lt; 10% fios)</option>
                    <option value="Moderada">Moderada (10% a 30% fios)</option>
                    <option value="Severa">Severa (&gt; 30% de fios miniaturizados)</option>
                  </select>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-2.5 rounded flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 font-mono uppercase block font-bold">Sinal de Hair Pull Test</span>
                    <span className="text-xs font-semibold text-gray-700">Tração mecânica de hastes</span>
                  </div>

                  <div className="flex bg-white border border-gray-200 p-0.5 rounded shadow-sm">
                    {["Negativo", "Positivo"].map(test => (
                      <button
                        key={test}
                        type="button"
                        onClick={() => setHairPullTest(test as any)}
                        className={`px-3 py-1 text-[10px] font-mono rounded transition cursor-pointer font-bold ${
                          hairPullTest === test 
                            ? "bg-red-50 text-red-700 border border-red-200 shadow-sm" 
                            : "text-gray-400 hover:text-black"
                        }`}
                      >
                        {test}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Signs & Microscopic Inflammatory conditions check */}
          <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-5 space-y-4">
            <h3 style={{ fontFamily: "Georgia, serif" }} className="text-base text-[#0A0A0A] font-semibold tracking-wide pb-1.5 border-b border-gray-100 flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-[#C9A84C]" /> 2. Sinais Inflamatórios (Dermoscopia)
            </h3>

            <p className="text-xs text-gray-500 leading-relaxed font-sans font-medium">Assinale quaisquer biomarcadores inflamatórios de couro cabeludo visíveis sob retroiluminação microscópica:</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { k: "eritema", label: "Eritema Perifolicular", value: eritema, set: setEritema },
                { k: "desquamacao", label: "Descamação / Seborreia", value: desquamacao, set: setDesquamacao },
                { k: "prurido", label: "Sinais de Prurido Ativo", value: prurido, set: setPrurido },
                { k: "tampoes", label: "Tampões Córneos", value: tampoesCorneos, set: setTampoesCorneos },
              ].map(sinal => (
                <button
                  key={sinal.k}
                  type="button"
                  onClick={() => sinal.set(!sinal.value)}
                  className={`p-3 rounded-lg border text-center transition cursor-pointer select-none ${
                    sinal.value 
                      ? "bg-[#C9A84C]/15 border-[#C9A84C]/50 text-[#C9A84C] font-semibold" 
                      : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <span className="block text-[11px] font-mono leading-tight">{sinal.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Accurate Microscopic Densitometry counts */}
          <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-5 space-y-4">
            <h3 style={{ fontFamily: "Georgia, serif" }} className="text-base text-[#0A0A0A] font-semibold tracking-wide pb-1.5 border-b border-gray-100 flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-[#C9A84C]" /> 3. Densitometria Digital Quantitativa
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs uppercase text-gray-400 font-mono block font-bold">Densitometria de Ápice (Vértex) (fios/cm²)</label>
                <input 
                  type="number" 
                  value={densidadeVertex} 
                  onChange={(e) => setDensidadeVertex(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-sm text-[#0A0A0A] p-2.5 rounded outline-none font-mono font-semibold" 
                />
                <span className="text-[9px] text-[#C9A84C] font-mono font-bold uppercase block mt-1 tracking-wider">Alvo fisiológico mínimo &gt; 150 fios/cm²</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase text-gray-400 font-mono block font-bold">Densitometria Occipital (Controle) (fios/cm²)</label>
                <input 
                  type="number" 
                  value={densidadeOccipital} 
                  onChange={(e) => setDensidadeOccipital(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-sm text-[#0A0A0A] p-2.5 rounded outline-none font-mono font-semibold" 
                />
                <span className="text-[9px] text-gray-400 font-mono font-bold uppercase block mt-1 tracking-wider">Área de controle doador-capilar</span>
              </div>
            </div>
          </div>

          {/* Section: Medical conclusions / prescriptions changes */}
          <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-5 space-y-4">
            <h3 style={{ fontFamily: "Georgia, serif" }} className="text-base text-[#0A0A0A] font-semibold tracking-wide pb-1.5 border-b border-gray-100 flex items-center gap-2">
              <Dna className="w-4.5 h-4.5 text-[#C9A84C]" /> 4. Condutas Clínicas Adaptadas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs uppercase text-gray-400 font-mono block font-bold">Anotações da evolução da médica</label>
                <textarea 
                  value={evolucaoNota} 
                  onChange={(e) => setEvolucaoNota(e.target.value)}
                  placeholder="Evolução global observada..."
                  rows={2} 
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-xs text-[#0A0A0A] p-2.5 rounded outline-none font-sans font-medium" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase text-gray-400 font-mono block font-bold">Modificações no Protocolo de Tratamento</label>
                <textarea 
                  value={condutas} 
                  onChange={(e) => setCondutas(e.target.value)}
                  placeholder="Mudanças nas loções, dosagens ou sessões..."
                  rows={2} 
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-xs text-[#0A0A0A] p-2.5 rounded outline-none font-sans font-medium" 
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: AI Co-pilot summarizing consultation summary results */}
        <div className="space-y-5">
          
          <div className="bg-[#F5F0E8]/40 border border-[#C9A84C]/25 rounded-xl p-5 flex flex-col justify-between min-h-[380px] h-full text-xs shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#C9A84C] uppercase tracking-widest font-mono">
                <Bot className="w-4.5 h-4.5 text-[#C9A84C]" /> Resumidor Inteligente de Consulta
              </div>
              
              <p className="text-gray-500 font-sans font-medium leading-relaxed">Gere um sumário estruturado pelo modelo clínico de IA para anexar de forma rica no histórico desse encontro:</p>

              {aiSummaryText ? (
                <div className="p-3 bg-white border border-gray-250/60 shadow-inner rounded text-[11px] leading-relaxed text-gray-700 max-h-[220px] overflow-y-auto font-mono whitespace-pre-wrap">
                  {aiSummaryText}
                </div>
              ) : (
                <div className="py-12 border border-dashed border-gray-300 rounded text-center text-gray-400 italic font-mono bg-white/40">
                  Sumário não gerado ainda.
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-250/50">
              <button
                type="button"
                onClick={handleGenerateSummaryWithIA}
                disabled={loadingSummary}
                className="w-full bg-white hover:bg-gray-50 border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-bold font-mono uppercase tracking-wider py-2.5 rounded flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                {loadingSummary ? "Gerando sumário..." : "Gerar Sumário com IA"}
              </button>

              <button
                type="button"
                onClick={handleFinishAndPublish}
                className="w-full bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black text-xs font-bold font-mono uppercase tracking-wider py-2.5 rounded flex items-center justify-center gap-1.5 transition duration-200 cursor-pointer shadow"
              >
                <CheckCircle className="w-4 h-4" /> Finalizar Consulta
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
export {};
