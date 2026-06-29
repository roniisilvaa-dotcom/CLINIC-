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
  Activity,
  Mic,
  MicOff,
  User,
  PlusCircle
} from "lucide-react";
import { Paciente, ConsultaHistorial } from "../types";

interface NovaConsultaProps {
  paciente?: Paciente | null;
  pacientesList?: Paciente[];
  onClose: () => void;
  onSave: (pacienteId: string, novaConsulta: ConsultaHistorial) => void;
  onAddNewPaciente?: (novoPaciente: Paciente) => void;
}

export default function NovaConsulta({ 
  paciente, 
  pacientesList = [], 
  onClose, 
  onSave,
  onAddNewPaciente
}: NovaConsultaProps) {
  
  // Patient Mode State (existing vs avulso)
  const [patientMode, setPatientMode] = useState<"existing" | "avulso">(paciente ? "existing" : (pacientesList.length > 0 ? "existing" : "avulso"));
  const [selectedId, setSelectedId] = useState<string>(paciente?.id || (pacientesList[0]?.id || ""));
  
  // Avulso / New Patient state
  const [avulsoNome, setAvulsoNome] = useState("");
  const [avulsoCpf, setAvulsoCpf] = useState("");
  const [avulsoTelefone, setAvulsoTelefone] = useState("");
  const [avulsoCidade, setAvulsoCidade] = useState<"Toledo" | "Fátima do Sul">("Toledo");

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

  // Speech Recognition state
  const [isRecording, setIsRecording] = useState(false);
  
  // Active selected patient object
  const activePacienteObj = patientMode === "existing" 
    ? (pacientesList.find(p => p.id === selectedId) || paciente || null)
    : null;

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não suporta ditado por voz. Tente usar o Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = (event: any) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      if (currentTranscript) {
         setQueixa(prev => prev ? `${prev} ${currentTranscript}` : currentTranscript);
      }
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
  };

  const handleGenerateSummaryWithIA = async () => {
    const nomeFinal = activePacienteObj ? activePacienteObj.nome : (avulsoNome || "Paciente Avulso");
    const diagFinal = activePacienteObj ? activePacienteObj.diagnostico.principal : "Consulta Avulsa Capilar";

    setLoadingSummary(true);
    setAiSummaryText("");
    
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pacienteNome: nomeFinal,
          diagnostico: diagFinal,
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

  const handleFinishAndPublish = async () => {
    let targetPacienteId = selectedId;

    if (patientMode === "avulso") {
      const nomeFinal = avulsoNome.trim() || "Paciente Avulso";
      const newId = `paciente-${Date.now()}`;
      
      const novoP: Paciente = {
        id: newId,
        nome: nomeFinal,
        idade: 30,
        dataNascimento: "1995-01-01",
        cpf: avulsoCpf.trim() || "000.000.000-00",
        telefone: avulsoTelefone.trim() || "(45) 99999-9999",
        email: `${newId}@paciente.com`,
        cidade: avulsoCidade,
        comoConheceu: "Atendimento Avulso",
        queixaPrincipal: queixa || "Consulta Avulsa de Tricologia",
        status: "Em Tratamento",
        progresso: 10,
        ultimaAtualizacao: new Date().toISOString().split("T")[0],
        antecedentes: { usoMedicamentos: "Nenhum", historicoFamiliar: "Nega", gestacaoAmamentacao: "Nega", menopausa: "Nega", outros: "" },
        diagnostico: { principal: "Atendimento Avulso Capilar", secundario: [], escalaLudwig: "Grau I", condicoesAssociadas: [], fatoresContribuintes: [], observacoes: "" },
        exames: [],
        protocolo: { medicamentos: "", procedimentos: "", cosmeticos: "", suplementacao: "", estiloVida: "", duracaoPrevista: "6 meses", dataInicio: new Date().toISOString().split("T")[0] },
        galeria: [],
        consultas: []
      };

      if (onAddNewPaciente) {
        onAddNewPaciente(novoP);
      }
      targetPacienteId = newId;

      try {
        await fetch("/api/pacientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(novoP)
        });
      } catch {}
    }

    const novaVisita: ConsultaHistorial = {
      id: `vis-${Date.now()}`,
      data: new Date().toISOString().split("T")[0],
      tipo: "Presencial - Toledo",
      queixa: queixa || "Queixa de afinamento ativo acompanhada no consultório.",
      evolucao: evolucaoNota || `Paciente apresenta densitometria capilar de ${densidadeVertex} fios/cm² em região de ápice e miniaturização classificada como ${indicadorMiniaturizacao}.`,
      alteracoesProtocolo: condutas || "Continuidade das loções padrão prescritas.",
      examesSolicitados: "Nenhum no momento",
      resumoIa: aiSummaryText || "Resumo inteligente gerado para esta consulta."
    };

    onSave(targetPacienteId, novaVisita);
    alert("Consulta finalizada e gravada com sucesso no prontuário capilar!");
  };

  return (
    <div id="nova_consulta_sheet" className="p-1 max-w-4xl mx-auto space-y-6 animate-fadeIn text-[#1A1A1A] font-sans">
      
      {/* Header controls back */}
      <div className="flex justify-between items-center border-b border-[#EAE6DF] pb-4">
        <div>
          <button 
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-[#C9A84C] font-mono uppercase tracking-wider font-bold mb-1.5 cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Cancelar / Voltar
          </button>
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#1A1A1A] font-normal">Ficha de Atendimento Clínico</h2>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest font-bold">Prontuário Capilar • Dra. Mariah Zibetti</p>
        </div>
      </div>

      {/* Patient Selection Selector (Registered vs Avulso) */}
      <div className="bg-[#FAF8F5] border border-[#EAE6DF] p-5 rounded-2xl space-y-3 shadow-xs">
        <span className="text-[10px] uppercase font-mono tracking-widest text-[#8A702A] font-bold block">1. Identificação do Paciente</span>
        
        <div className="flex flex-wrap items-center gap-4 border-b border-[#EAE6DF] pb-3">
          <label className="flex items-center gap-2 text-xs font-mono font-bold cursor-pointer">
            <input 
              type="radio" 
              name="patientMode" 
              checked={patientMode === "existing"} 
              onChange={() => setPatientMode("existing")} 
              className="accent-[#C9A84C]" 
            />
            <User className="w-4 h-4 text-neutral-600" /> Paciente Cadastrado no Banco
          </label>

          <label className="flex items-center gap-2 text-xs font-mono font-bold cursor-pointer text-[#8A702A]">
            <input 
              type="radio" 
              name="patientMode" 
              checked={patientMode === "avulso"} 
              onChange={() => setPatientMode("avulso")} 
              className="accent-[#C9A84C]" 
            />
            <PlusCircle className="w-4 h-4 text-[#C9A84C]" /> ⚡ Atendimento Avulso / Novo Paciente (na hora)
          </label>
        </div>

        {patientMode === "existing" ? (
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono text-neutral-400 block font-semibold">Selecione o Paciente</label>
            {pacientesList.length > 0 ? (
              <select 
                value={selectedId} 
                onChange={(e) => setSelectedId(e.target.value)} 
                className="w-full bg-white border border-[#EAE6DF] focus:border-[#C9A84C] text-sm text-[#1A1A1A] p-3.5 rounded-xl outline-none font-sans"
              >
                {pacientesList.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} — CPF: {p.cpf || "N/A"} ({p.cidade})</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-neutral-500 font-mono italic">Nenhum paciente cadastrado. Alterne para Atendimento Avulso abaixo.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] uppercase font-mono text-neutral-500 block font-bold">Nome Completo do Paciente Avulso</label>
              <input 
                type="text" 
                placeholder="Ex: Camila Fernandes Ramos" 
                value={avulsoNome} 
                onChange={(e) => setAvulsoNome(e.target.value)} 
                required 
                className="w-full bg-white border border-[#EAE6DF] focus:border-[#C9A84C] text-sm text-[#1A1A1A] p-3 rounded-xl outline-none font-sans" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono text-neutral-500 block font-bold">CPF (Opcional)</label>
              <input 
                type="text" 
                placeholder="000.000.000-00" 
                value={avulsoCpf} 
                onChange={(e) => setAvulsoCpf(e.target.value)} 
                className="w-full bg-white border border-[#EAE6DF] focus:border-[#C9A84C] text-sm text-[#1A1A1A] p-3 rounded-xl outline-none font-mono" 
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form Fields details */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Section: Symptoms / Anamnese Capilar */}
          <div className="bg-white border border-[#EAE6DF] shadow-xs rounded-2xl p-6 space-y-4">
            <h3 style={{ fontFamily: "Georgia, serif" }} className="text-base text-[#1A1A1A] font-semibold tracking-wide pb-2 border-b border-[#EAE6DF] flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-[#C9A84C]" /> 2. Anamnese de Queixa Atual
            </h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase text-neutral-400 font-mono block font-bold">Anamnese clínica detalhada desta visita</label>
                  <button 
                    onClick={toggleRecording} 
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-black'}`}
                  >
                    {isRecording ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                    {isRecording ? "Gravando..." : "Ditar por Voz"}
                  </button>
                </div>
                <textarea 
                  rows={4} 
                  placeholder="Descreva a evolução relatada pelo paciente, perda diária aproximada de fios, sensibilidade do couro..." 
                  value={queixa} 
                  onChange={(e) => setQueixa(e.target.value)} 
                  className="w-full bg-[#FAF8F5] border border-[#EAE6DF] focus:border-[#C9A84C] focus:bg-white text-sm text-[#1A1A1A] p-3.5 rounded-xl outline-none transition" 
                />
              </div>

              {/* Physical Exam checkboxes */}
              <div className="space-y-2">
                <label className="text-xs uppercase text-neutral-400 font-mono block font-bold">Sinais Dermatológicos no Couro Cabeludo</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <label className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer transition ${eritema ? 'bg-[#C9A84C]/15 border-[#C9A84C] text-[#8A702A] font-bold' : 'bg-[#FAF8F5] border-[#EAE6DF] text-neutral-600'}`}>
                    <input type="checkbox" checked={eritema} onChange={(e) => setEritema(e.target.checked)} className="hidden" /> Eritema
                  </label>
                  <label className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer transition ${desquamacao ? 'bg-[#C9A84C]/15 border-[#C9A84C] text-[#8A702A] font-bold' : 'bg-[#FAF8F5] border-[#EAE6DF] text-neutral-600'}`}>
                    <input type="checkbox" checked={desquamacao} onChange={(e) => setDesquamacao(e.target.checked)} className="hidden" /> Descamação
                  </label>
                  <label className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer transition ${prurido ? 'bg-[#C9A84C]/15 border-[#C9A84C] text-[#8A702A] font-bold' : 'bg-[#FAF8F5] border-[#EAE6DF] text-neutral-600'}`}>
                    <input type="checkbox" checked={prurido} onChange={(e) => setPrurido(e.target.checked)} className="hidden" /> Prurido
                  </label>
                  <label className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer transition ${tampoesCorneos ? 'bg-[#C9A84C]/15 border-[#C9A84C] text-[#8A702A] font-bold' : 'bg-[#FAF8F5] border-[#EAE6DF] text-neutral-600'}`}>
                    <input type="checkbox" checked={tampoesCorneos} onChange={(e) => setTampoesCorneos(e.target.checked)} className="hidden" /> Tampões
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Physical Tricoscopy Metrics */}
          <div className="bg-white border border-[#EAE6DF] shadow-xs rounded-2xl p-6 space-y-4">
            <h3 style={{ fontFamily: "Georgia, serif" }} className="text-base text-[#1A1A1A] font-semibold tracking-wide pb-2 border-b border-[#EAE6DF] flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-[#C9A84C]" /> 3. Métricas de Tricoscopia & Densitometria
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-500 font-mono block uppercase font-bold text-[10px]">Hair Pull Test (Tração)</label>
                <select 
                  value={hairPullTest} 
                  onChange={(e) => setHairPullTest(e.target.value as any)} 
                  className="w-full bg-[#FAF8F5] border border-[#EAE6DF] focus:border-[#C9A84C] text-xs p-3 rounded-xl outline-none font-mono"
                >
                  <option value="Negativo">Negativo (&lt; 4 fios)</option>
                  <option value="Positivo">Positivo (&gt; 6 fios ativos)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-500 font-mono block uppercase font-bold text-[10px]">Densidade Vértice (fios/cm²)</label>
                <input 
                  type="number" 
                  value={densidadeVertex} 
                  onChange={(e) => setDensidadeVertex(e.target.value)} 
                  className="w-full bg-[#FAF8F5] border border-[#EAE6DF] focus:border-[#C9A84C] text-xs p-3 rounded-xl outline-none font-mono font-bold text-[#1A1A1A]" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-500 font-mono block uppercase font-bold text-[10px]">Densidade Occipital (fios/cm²)</label>
                <input 
                  type="number" 
                  value={densidadeOccipital} 
                  onChange={(e) => setDensidadeOccipital(e.target.value)} 
                  className="w-full bg-[#FAF8F5] border border-[#EAE6DF] focus:border-[#C9A84C] text-xs p-3 rounded-xl outline-none font-mono font-bold text-[#1A1A1A]" 
                />
              </div>
            </div>
          </div>

          {/* Section 3: Conducts & Therapeutics */}
          <div className="bg-white border border-[#EAE6DF] shadow-xs rounded-2xl p-6 space-y-4">
            <h3 style={{ fontFamily: "Georgia, serif" }} className="text-base text-[#1A1A1A] font-semibold tracking-wide pb-2 border-b border-[#EAE6DF] flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-[#C9A84C]" /> 4. Conduta Terapêutica & Evolução
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs uppercase text-neutral-400 font-mono block font-bold">Alterações no Protocolo / Procedimentos Prescritos</label>
                <textarea 
                  rows={3} 
                  placeholder="Ex: Aumentado dose de Minoxidil Oral para 1.5mg; Prescrito 4 sessões de MMP Capilar..." 
                  value={condutas} 
                  onChange={(e) => setCondutas(e.target.value)} 
                  className="w-full bg-[#FAF8F5] border border-[#EAE6DF] focus:border-[#C9A84C] text-xs text-[#1A1A1A] p-3.5 rounded-xl outline-none font-mono" 
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: AI Assistant Summary & Finalize */}
        <div className="space-y-5">
          <div className="bg-[#0A0A0A] text-white rounded-2xl p-6 shadow-xl border border-[#C9A84C]/40 relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#C9A84C]" />
                <span className="font-mono text-xs uppercase tracking-widest text-[#C9A84C] font-bold">CA.RO 3.5 IA • Resumo Clínico</span>
              </div>
            </div>

            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              Gere uma síntese automatizada com interpretação diagnóstica dos achados desta consulta para anexar ao prontuário.
            </p>

            <button
              onClick={handleGenerateSummaryWithIA}
              disabled={loadingSummary}
              className="w-full bg-[#C9A84C] hover:bg-[#D9B85C] text-black font-bold font-mono uppercase tracking-wider text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              {loadingSummary ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Sintetizando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Gerar Resumo IA
                </>
              )}
            </button>

            {aiSummaryText && (
              <div className="bg-[#141414] border border-[#C9A84C]/30 p-4 rounded-xl text-xs text-neutral-300 font-mono whitespace-pre-line leading-relaxed animate-fadeIn">
                {aiSummaryText}
              </div>
            )}
          </div>

          {/* Finalize button */}
          <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 space-y-3 shadow-xs">
            <button
              onClick={handleFinishAndPublish}
              className="w-full bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black font-bold font-mono uppercase tracking-widest text-xs py-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              <CheckCircle className="w-4.5 h-4.5 text-[#C9A84C] group-hover:text-black" /> Finalizar & Gravar Prontuário
            </button>
            <span className="text-[10px] text-neutral-400 font-mono text-center block">Sincronização imediata com a nuvem da clínica.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
