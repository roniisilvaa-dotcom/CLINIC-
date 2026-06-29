import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  Search, 
  Plus, 
  Filter, 
  Sparkles, 
  Printer, 
  Trash, 
  Check, 
  FileSignature, 
  FolderLock,
  ChevronRight,
  ClipboardCopy,
  Share2,
  MapPin,
  ShieldCheck,
  Award
} from "lucide-react";
import { PrescricaoTemplate } from "../types";

const INITIAL_CLINICAL_TEMPLATES: PrescricaoTemplate[] = [
  {
    id: "temp-aga-fem",
    titulo: "Protocolo Indução Capilar — Alopecia Androgenética Feminina (AGA-F)",
    diagnosticoRef: "Alopecia Androgenética Feminina (Fibras & Indução)",
    categoria: "Medicamentoso",
    medicamentos: "• Minoxidil Oral 0.5mg + Espironolactona 50mg — Tomar 1 cápsula via oral diariamente após o almoço.\n• Loção Capilar Magistral: Minoxidil 5% + Latanoprosta 0.005% + Capixyl 3% em veículo TrichoSol qsp 60mL. Aplicar 20 gotas no couro cabeludo limpo e seco todas as noites.",
    procedimentos: "• MMP Capilar (Microinfusão de Medicamentos na Pele) com Fatores de Crescimento (IGF, bFGF, VEGF) — Sessões quinzenais (Total: 4 a 6 sessões).\n• Laser LLLT (Low-Level Laser Therapy) / LEDterapia Capilar 660nm — 2x por semana.",
    suplementacao: "• Fórmula Nutracêutica Capilar Exclusiva Dra. Mariah:\n  - Ferro Quelato 60mg\n  - Vitamina D3 2.000 UI\n  - Zinco Quelato 15mg\n  - Coenzima Q10 50mg\n  - Biotina 2.5mg\n  - Silício Orgânico Nutricolin 100mg\n  Tomar 1 cápsula junto ao café da manhã.",
    cosmeticos: "• Shampoo Fortificante com Cafeína 1% + D-Pantenol 2% + Extrato de Jaborandi. Lavar o couro cabeludo alternando dias."
  },
  {
    id: "temp-aga-masc",
    titulo: "Protocolo Alta Performance — Alopecia Androgenética Masculina (AGA-M)",
    diagnosticoRef: "Alopecia Androgenética Masculina (Bloqueio DHT)",
    categoria: "Medicamentoso",
    medicamentos: "• Dutasterida 0.5mg — Tomar 1 cápsula via oral diariamente.\n• Minoxidil Oral 2.5mg — Tomar 1 tablet via oral ao deitar.\n• Loção Tópica: Minoxidil 5% + Finasterida 0.1% + Alfa-Estradiol 0.025% em solução hidroalcoólica qsp 100mL. Borrifar 6 jatos na área calva à noite.",
    procedimentos: "• Microagulhamento Capilar de Alta Precisão com Exossomas Foliculares — Sessões mensais em consultório.\n• Fotobiomodulação Capilar no consultório pré-procedimento.",
    suplementacao: "• Saw Palmetto (Serenoa repens) 320mg + Queratina Hidrolisada 200mg + Metilsulfonilmetano (MSM) 300mg. Tomar 1 cápsula via oral 2x ao dia.",
    cosmeticos: "• Shampoo Controle de Oleosidade e Dihidrotestosterona (Cetoconazol 1% + Extrato de Alecrim 2%). Usar 3x por semana."
  },
  {
    id: "temp-efluvio",
    titulo: "Protocolo Regeneração & Anágeno — Eflúvio Telógeno Agudo / Pós-Estresse",
    diagnosticoRef: "Eflúvio Telógeno Agudo / Pós-COVID / Pós-Parto",
    categoria: "Suplementação",
    medicamentos: "• Pantogar Magistral Renovado: L-Cistina 20mg + Pantotenato de Cálcio 60mg + Levedura de Cerveja 100mg + Queratina 20mg + PABA 20mg. Tomar 1 cápsula 3x ao dia durante as refeições.",
    procedimentos: "• Sessões semanais de Fototerapia LEDterapia Capilar Vermelha (660nm) no consultório.",
    suplementacao: "• Booster Bioativo de Recuperação Folicular:\n  - Metilfolato 400mcg\n  - Metilcobalamina (Vitamina B12) 1.000mcg\n  - Vitamina C Revestida 250mg\n  - L-Metionina 100mg\n  Tomar 1 dose pela manhã por 90 dias.",
    cosmeticos: "• Tônico Estimulante com Capillisil 3% + Baicapil 4%. Borrifar no couro cabeludo diariamente à noite com suave massagem."
  },
  {
    id: "temp-dermatite",
    titulo: "Protocolo Detox & Calminho — Dermatite Seborreica & Sensibilidade",
    diagnosticoRef: "Dermatite Seborreica / Descamação / Eritema Capilar",
    categoria: "Cuidados Domiciliares",
    medicamentos: "• Cetoconazol 2% Shampoo Medicamentoso. Aplicação no couro cabeludo 3x por semana, deixando agir por 5 a 8 minutos antes de enxaguar abundantemente.",
    procedimentos: "• Peeling Capilar Desintoxicante com Ácido Salicílico 2% e Terapêutica de Argila Branca Purificante em consultório.",
    suplementacao: "• Ômega 3 Ultra Puro (EPA 360mg / DHA 240mg) — Tomar 2 cápsulas ao dia junto às refeições principais.\n• Piridoxina (Vitamina B6) 50mg + Zinco Quelato 20mg ao dia.",
    cosmeticos: "• Tônico Calmante Antisseborreico com Alfa-Bisabolol 1% + Extrato de Barbatimão 3% + Óleo Essencial de Melaleuca 0.5%. Usar nos dias intercalados sem a lavagem com Cetoconazol."
  }
];

export default function PrescricoesModulo({ medicaNome = "Dra. Mariah Zibetti" }: { medicaNome?: string }) {
  const [library, setLibrary] = useState<PrescricaoTemplate[]>(INITIAL_CLINICAL_TEMPLATES);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Create Template form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDiag, setNewDiag] = useState("");
  const [newCat, setNewCat] = useState<PrescricaoTemplate["categoria"]>("Medicamentoso");
  const [newMeds, setNewMeds] = useState("");
  const [newProcs, setNewProcs] = useState("");
  const [newSupls, setNewSupls] = useState("");
  const [newCosms, setNewCosms] = useState("");

  // Print Preview state
  const [previewTemplate, setPreviewTemplate] = useState<PrescricaoTemplate | null>(null);
  const [selectedUnidade, setSelectedUnidade] = useState<"Toledo" | "Fátima do Sul">("Toledo");

  // Search logic
  const filteredTemplates = library.filter(t => {
    const matchesSearch = t.titulo.toLowerCase().includes(search.toLowerCase()) || t.diagnosticoRef.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === "all" || t.categoria === activeCategory;
    return matchesSearch && matchesCat;
  });

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const novo: PrescricaoTemplate = {
      id: `temp-${Date.now()}`,
      titulo: newTitle,
      diagnosticoRef: newDiag || "Geral",
      categoria: newCat,
      medicamentos: newMeds,
      procedimentos: newProcs,
      suplementacao: newSupls,
      cosmeticos: newCosms
    };
    setLibrary([novo, ...library]);
    setShowCreateModal(false);

    // Reset fields
    setNewTitle("");
    setNewDiag("");
    setNewMeds("");
    setNewProcs("");
    setNewSupls("");
    setNewCosms("");
  };

  const handleDeleteTemplate = (id: string) => {
    setLibrary(library.filter(t => t.id !== id));
  };

  const handleShareWhatsApp = (temp: PrescricaoTemplate) => {
    const text = `*RECEITUÁRIO MÉDICO - DRA. MARIAH ZIBETTI*\n_Dermatologia e Tricologia Avançada_\n\n📋 *Tratamento:* ${temp.titulo}\n\n*1. FÁRMACOS SISTÊMICOS / TÓPICOS:*\n${temp.medicamentos || "N/A"}\n\n*2. SUPLEMENTAÇÃO NUTRACÊUTICA:*\n${temp.suplementacao || "N/A"}\n\n*3. CUIDADOS DOMICILIARES / SHAMPOOS:*\n${temp.cosmeticos || "N/A"}\n\n*4. PROCEDIMENTOS DE CONSULTÓRIO:*\n${temp.procedimentos || "N/A"}\n\n_Dúvidas ou manipulação direta: entrar em contato com nossa equipe clínica._`;
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  return (
    <div id="prescricoes_module_container" className="space-y-6">
      
      {/* Header section with Create Template action */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#0A0A0A]/5 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0A0A0A] font-normal">Biblioteca de Prescrições</h2>
            <span className="bg-[#C9A84C]/15 text-[#C9A84C] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Award className="w-3 h-3" /> Exclusivo Dra. Mariah
            </span>
          </div>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mt-1.5 font-sans">Lançamento rápido de fórmulas manipuladas, suplementações e protocolos de tricologia médica.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black text-xs font-bold font-mono tracking-wider uppercase px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition duration-200 cursor-pointer self-start sm:self-auto shadow-md"
        >
          <Plus className="w-4 h-4" /> Criar Novo Protocolo
        </button>
      </div>

      {/* Advanced search controls */}
      <div className="bg-white border border-[#E5E5E5] p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center shadow-sm">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar protocolo por diagnóstico (ex: Alopecia, Eflúvio, Seborreia)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 text-sm text-[#0A0A0A] border border-gray-200 focus:border-[#C9A84C] focus:bg-white py-2 pl-9 pr-4 rounded-lg outline-none transition"
          />
        </div>

        <div className="flex bg-gray-50 border border-gray-200 p-1 rounded-lg w-full md:w-auto shrink-0 select-none overflow-x-auto gap-1">
          {[
            { id: "all", label: "Todos" },
            { id: "Medicamentoso", label: "Medicamentos" },
            { id: "Procedimentos", label: "Procedimentos" },
            { id: "Suplementação", label: "Suplementação" },
            { id: "Cuidados Domiciliares", label: "Cuidados" },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded transition whitespace-nowrap cursor-pointer ${
                activeCategory === cat.id 
                  ? "bg-[#C9A84C] text-black font-semibold shadow-sm" 
                  : "text-gray-500 hover:text-[#0A0A0A]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template lists representation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTemplates.map(temp => (
          <div 
            key={temp.id} 
            className="bg-white border border-[#E5E5E5] rounded-xl p-5 hover:border-[#C9A84C]/60 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between gap-4 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#C9A84C] to-[#0A0A0A]" />
            
            <div className="space-y-3 pl-2">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#C9A84C] bg-[#C9A84C]/10 px-2.5 py-0.5 rounded font-bold inline-block">
                    {temp.categoria}
                  </span>
                  <h3 style={{ fontFamily: "Georgia, serif" }} className="text-lg font-semibold text-[#0A0A0A] mt-2 leading-snug">{temp.titulo}</h3>
                  <p className="text-xs text-gray-400 font-mono mt-1 font-semibold">Indicação: {temp.diagnosticoRef}</p>
                </div>
                
                <button 
                  onClick={() => handleDeleteTemplate(temp.id)}
                  className="text-gray-300 hover:text-red-500 p-1 rounded transition cursor-pointer shrink-0"
                  title="Excluir"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>

              {/* Formula brief snippets representation */}
              <div className="border-t border-gray-100 pt-3.5 space-y-2.5">
                {temp.medicamentos && (
                  <div className="text-xs">
                    <span className="text-[9px] text-gray-400 uppercase font-mono block font-bold">Fármacos Sistêmicos / Tópicos</span>
                    <p className="text-gray-700 font-mono text-[11px] line-clamp-2 bg-gray-50/80 p-2 rounded border border-gray-100 mt-1 whitespace-pre-line">{temp.medicamentos}</p>
                  </div>
                )}
                {temp.suplementacao && (
                  <div className="text-xs">
                    <span className="text-[9px] text-gray-400 uppercase font-mono block font-bold">Suplementação Nutracêutica</span>
                    <p className="text-gray-700 font-mono text-[11px] line-clamp-2 bg-gray-50/80 p-2 rounded border border-gray-100 mt-1 whitespace-pre-line">{temp.suplementacao}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs pl-2">
              <button
                onClick={() => handleShareWhatsApp(temp)}
                className="text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition cursor-pointer font-bold font-mono text-[10px]"
                title="Compartilhar no WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" /> WhatsApp
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `RECEITUÁRIO DRA. MARIAH ZIBETTI - ${temp.titulo}\n\n[Medicamentos]\n${temp.medicamentos}\n\n[Procedimentos]\n${temp.procedimentos}\n\n[Suplementação]\n${temp.suplementacao}\n\n[Cosméticos]\n${temp.cosmeticos}`
                    );
                    alert("Todas as formulações deste protocolo foram copiadas para a área de transferência!");
                  }}
                  className="text-gray-600 hover:text-[#0A0A0A] px-3 py-1.5 border border-gray-200 hover:bg-gray-50 rounded-md flex items-center gap-1.5 transition cursor-pointer font-bold font-mono text-[10px]"
                >
                  <ClipboardCopy className="w-3.5 h-3.5" /> Copiar
                </button>

                <button
                  onClick={() => setPreviewTemplate(temp)}
                  className="bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black px-3.5 py-1.5 rounded-md flex items-center gap-1.5 transition cursor-pointer font-bold font-mono text-[10px] shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-[#C9A84C] group-hover:text-black" /> Receituário Timbrado
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white border border-dashed border-gray-300 rounded-xl">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">Nenhum protocolo encontrado com os termos pesquisados.</p>
          </div>
        )}
      </div>

      {/* ====== DIALOG: CREATE NEW TEMPLATE MODAL ====== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white text-[#0A0A0A] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-fadeIn border border-[#C9A84C]/30">
            <div className="bg-[#0A0A0A] text-white p-4 flex justify-between items-center border-b border-[#252525]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                <span className="font-mono text-xs uppercase tracking-wider text-[#C9A84C] font-bold">Novo Protocolo Clínico • Dra. Mariah Zibetti</span>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white transition text-xs font-semibold px-2.5 py-1 bg-neutral-800 rounded cursor-pointer">Fechar</button>
            </div>

            <form onSubmit={handleCreateTemplate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs uppercase text-gray-500 font-mono font-bold block">Título do Protocolo</label>
                  <input required type="text" placeholder="Ex: Protocolo Alopecia Areata — Imunomodulação" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-sm text-[#0A0A0A] p-2.5 rounded outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase text-gray-500 font-mono font-bold block">Indicação / Diagnóstico</label>
                  <input type="text" placeholder="Ex: Alopecia Areata em placas" value={newDiag} onChange={(e) => setNewDiag(e.target.value)} className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-sm text-[#0A0A0A] p-2.5 rounded outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase text-gray-500 font-mono font-bold block">Categoria</label>
                  <select value={newCat} onChange={(e) => setNewCat(e.target.value as any)} className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-sm text-[#0A0A0A] p-2.5 rounded outline-none">
                    <option value="Medicamentoso">Medicamentoso</option>
                    <option value="Procedimentos">Procedimentos</option>
                    <option value="Suplementação">Suplementação</option>
                    <option value="Cuidados Domiciliares">Cuidados Domiciliares</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3.5 border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase text-gray-500 font-mono font-bold block">Fármacos Sistêmicos / Tópicos</label>
                  <textarea rows={3} placeholder="Prescrição de medicamentos..." value={newMeds} onChange={(e) => setNewMeds(e.target.value)} className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-xs text-[#0A0A0A] p-2.5 rounded outline-none font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase text-gray-500 font-mono font-bold block">Procedimentos de Consultório</label>
                  <textarea rows={3} placeholder="MMP, Laser, Microagulhamento..." value={newProcs} onChange={(e) => setNewProcs(e.target.value)} className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-xs text-[#0A0A0A] p-2.5 rounded outline-none font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase text-gray-500 font-mono font-bold block">Suplementações Nutracêuticas</label>
                  <textarea rows={3} placeholder="Vitamins, minerais, antioxidantes..." value={newSupls} onChange={(e) => setNewSupls(e.target.value)} className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-xs text-[#0A0A0A] p-2.5 rounded outline-none font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase text-gray-500 font-mono font-bold block">Cosméticos & Shampoos</label>
                  <textarea rows={3} placeholder="Higienização e tônicos..." value={newCosms} onChange={(e) => setNewCosms(e.target.value)} className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-xs text-[#0A0A0A] p-2.5 rounded outline-none font-mono" />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-end gap-2.5 text-xs">
                <button type="button" onClick={() => setShowCreateModal(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded font-mono uppercase cursor-pointer">Cancelar</button>
                <button type="submit" className="bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black font-semibold px-4 py-2 rounded font-mono uppercase tracking-wider cursor-pointer transition">Salvar Protocolo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== DIALOG: PRINT PREVIEW MODAL (RECEITUÁRIO TIMBRADO) ====== */}
      {previewTemplate && (
        <div id="print_modal" className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-sans">
          <div className="bg-white text-[#0A0A0A] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-fadeIn border border-[#C9A84C]/40">
            
            {/* Modal Control Header */}
            <div className="bg-[#0A0A0A] text-neutral-300 p-4 px-6 flex justify-between items-center border-b border-[#252525]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C9A84C]" />
                <span className="font-mono text-xs uppercase tracking-widest text-[#C9A84C] font-bold">Emissão de Receituário Oficial • Timbrado Médica</span>
              </div>
              <button onClick={() => setPreviewTemplate(null)} className="text-neutral-400 hover:text-white transition text-xs font-semibold px-3 py-1.5 bg-[#202020] rounded-lg cursor-pointer">Fechar</button>
            </div>

            {/* Selection bar for clinic unit */}
            <div className="bg-[#F8F6F0] p-3 px-6 border-b border-gray-200 flex justify-between items-center text-xs">
              <span className="text-gray-600 font-medium">Selecione a Unidade de Atendimento:</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedUnidade("Toledo")}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${selectedUnidade === "Toledo" ? "bg-[#0A0A0A] text-[#C9A84C]" : "bg-gray-200 text-gray-600"}`}
                >
                  📍 Unidade Toledo
                </button>
                <button 
                  onClick={() => setSelectedUnidade("Fátima do Sul")}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${selectedUnidade === "Fátima do Sul" ? "bg-[#0A0A0A] text-[#C9A84C]" : "bg-gray-200 text-gray-600"}`}
                >
                  📍 Unidade Fátima do Sul
                </button>
              </div>
            </div>

            {/* Formal Prescription Paper Sheet */}
            <div className="p-8 md:p-12 bg-gray-100 font-sans flex justify-center">
              <div className="bg-white border border-gray-300 p-8 md:p-10 w-full max-w-2xl min-h-[520px] flex flex-col justify-between shadow-lg rounded-sm relative">
                
                {/* Background Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
                  <Sparkles className="w-80 h-80 text-black" />
                </div>

                <div>
                  {/* Doctor Timbrado Header */}
                  <div className="flex justify-between items-start border-b-2 border-[#C9A84C] pb-5">
                    <div>
                      <h1 style={{ fontFamily: "Georgia, serif" }} className="text-2xl font-bold text-[#0A0A0A] tracking-tight">{medicaNome}</h1>
                      <p className="text-xs text-[#C9A84C] font-mono uppercase font-bold tracking-widest mt-0.5">Dermatologia & Tricologia Avançada</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-1">CRM-PR • Registro de Qualificação de Especialista (RQE)</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="w-12 h-12 rounded-full border-2 border-[#C9A84C] flex items-center justify-center font-serif text-[#C9A84C] text-lg font-bold bg-[#0A0A0A] shadow-md ml-auto">
                        MZ
                      </div>
                      <span className="text-[9px] font-mono text-gray-400 block mt-1 uppercase tracking-wider">CA.RO Clinic</span>
                    </div>
                  </div>

                  {/* Prescription Title & Items */}
                  <div className="mt-6 space-y-5 text-xs text-neutral-800 leading-relaxed">
                    <div className="bg-[#F8F6F0] p-3 rounded-lg border-l-4 border-[#C9A84C] flex justify-between items-center">
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-[#C9A84C] font-mono font-bold block">Protocolo Clínico Prescrito</span>
                        <h4 style={{ fontFamily: "Georgia, serif" }} className="text-sm font-bold text-[#0A0A0A]">{previewTemplate.titulo}</h4>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">{new Date().toLocaleDateString('pt-BR')}</span>
                    </div>
                    
                    {previewTemplate.medicamentos && (
                      <div className="space-y-1.5">
                        <h5 className="font-bold text-[#0A0A0A] text-xs uppercase tracking-wider font-mono flex items-center gap-1.5 text-[#C9A84C]">
                          <span>I.</span> Fármacos Sistêmicos e Fórmulas Tópicas
                        </h5>
                        <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 font-mono text-[11px] whitespace-pre-line text-gray-800 leading-relaxed">
                          {previewTemplate.medicamentos}
                        </div>
                      </div>
                    )}

                    {previewTemplate.suplementacao && (
                      <div className="space-y-1.5">
                        <h5 className="font-bold text-[#0A0A0A] text-xs uppercase tracking-wider font-mono flex items-center gap-1.5 text-[#C9A84C]">
                          <span>II.</span> Suplementação Nutracêutica Capilar
                        </h5>
                        <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 font-mono text-[11px] whitespace-pre-line text-gray-800 leading-relaxed">
                          {previewTemplate.suplementacao}
                        </div>
                      </div>
                    )}

                    {previewTemplate.cosmeticos && (
                      <div className="space-y-1.5">
                        <h5 className="font-bold text-[#0A0A0A] text-xs uppercase tracking-wider font-mono flex items-center gap-1.5 text-[#C9A84C]">
                          <span>III.</span> Higienização & Dermocosméticos
                        </h5>
                        <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 font-mono text-[11px] whitespace-pre-line text-gray-800 leading-relaxed">
                          {previewTemplate.cosmeticos}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Signature & Location Stamp */}
                <div className="mt-12 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-end">
                    <div className="text-[9px] text-gray-500 font-mono space-y-0.5">
                      <p className="font-bold text-gray-700">
                        {selectedUnidade === "Toledo" ? "📍 Unidade Toledo: Av. Parigot de Souza, 1222 — Ed. Medical Center" : "📍 Unidade Fátima do Sul: Rua Tenente Fátima, 555 — Centro Clínico"}
                      </p>
                      <p>Atendimento Especializado em Saúde Capilar e Dermatologia de Precisão.</p>
                    </div>

                    <div className="text-center shrink-0 ml-4">
                      <div className="w-36 border-b border-gray-800 mb-1 mx-auto" />
                      <p style={{ fontFamily: "Georgia, serif" }} className="text-xs font-bold text-[#0A0A0A]">{medicaNome}</p>
                      <p className="text-[9px] text-gray-400 font-mono uppercase">Assinatura Médica Digital</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Action Bar */}
            <div className="bg-[#0A0A0A] p-4 px-6 flex justify-between items-center text-xs">
              <span className="text-gray-400 text-[11px] font-mono">💡 Você pode enviar este receituário via WhatsApp ou imprimir em papel timbrado.</span>
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleShareWhatsApp(previewTemplate)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg transition font-mono uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" /> Enviar WhatsApp
                </button>

                <button 
                  onClick={() => {
                    window.print();
                  }}
                  className="bg-[#C9A84C] hover:bg-[#D9B85C] text-black font-bold px-5 py-2 rounded-lg transition font-mono uppercase tracking-widest cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Printer className="w-4 h-4" /> Imprimir / Gerar PDF
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
export {};
