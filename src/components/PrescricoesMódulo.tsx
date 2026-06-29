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
  ClipboardCopy
} from "lucide-react";
import { PrescricaoTemplate } from "../types";

export default function PrescricoesModulo({ medicaNome = "Médico(a) Responsável" }: { medicaNome?: string }) {
  const [library, setLibrary] = useState<PrescricaoTemplate[]>([]);
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

  return (
    <div id="prescricoes_module_container" className="space-y-6">
      
      {/* Header section with Create Template action */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#0A0A0A]/5 pb-6">
        <div>
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0A0A0A] font-normal">Biblioteca de Prescrições</h2>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1.5 font-sans">Lançamento rápido e manutenção de fórmulas e terapias capilares recorrentes.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#0A0A0A] hover:bg-[#C9A84C] text-white hover:text-black text-xs font-bold font-mono tracking-wider uppercase px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition duration-200 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Criar Novo Template
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
            placeholder="Buscar template por diagnóstico ou título..."
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
                  ? "bg-[#C9A84C] text-black font-semibold" 
                  : "text-gray-500 hover:text-[#0A0A0A]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template lists representation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map(temp => (
          <div 
            key={temp.id} 
            className="bg-white border border-[#E5E5E5] rounded-xl p-5 hover:border-[#C9A84C]/50 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#C9A84C] bg-[#C9A84C]/10 px-2.5 py-0.5 rounded font-bold">
                    {temp.categoria}
                  </span>
                  <h3 style={{ fontFamily: "Georgia, serif" }} className="text-lg font-semibold text-[#0A0A0A] mt-2">{temp.titulo}</h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5 font-semibold">Ref: {temp.diagnosticoRef}</p>
                </div>
                
                <button 
                  onClick={() => handleDeleteTemplate(temp.id)}
                  className="text-gray-400 hover:text-red-500 p-1 rounded transition cursor-pointer"
                  title="Excluir"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>

              {/* Formula brief snippets representation */}
              <div className="border-t border-gray-100 pt-3.5 space-y-2">
                {temp.medicamentos && (
                  <div className="text-xs">
                    <span className="text-[9px] text-gray-400 uppercase font-mono block font-bold">Fármacos Sistêmicos</span>
                    <span className="text-gray-700 font-mono line-clamp-1">{temp.medicamentos}</span>
                  </div>
                )}
                {temp.suplementacao && (
                  <div className="text-xs">
                    <span className="text-[9px] text-gray-400 uppercase font-mono block font-bold">Suplementação capilar</span>
                    <span className="text-gray-700 font-mono line-clamp-1">{temp.suplementacao}</span>
                  </div>
                )}
                {temp.cosmeticos && (
                  <div className="text-xs">
                    <span className="text-[9px] text-gray-400 uppercase font-mono block font-bold">Cosméticos de higienização</span>
                    <span className="text-gray-700 font-mono line-clamp-1">{temp.cosmeticos}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-2.5 flex justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `RECEITA ${medicaNome.toUpperCase()} - ${temp.titulo}\n\n[Medicamentos]\n${temp.medicamentos}\n\n[Procedimentos]\n${temp.procedimentos}\n\n[Suplementação]\n${temp.suplementacao}\n\n[Cosméticos]\n${temp.cosmeticos}`
                  );
                  alert("Todas as formulações deste template foram copiadas para a área de transferência!");
                }}
                className="text-gray-500 hover:text-[#0A0A0A] px-3 py-1.5 border border-gray-200 hover:bg-gray-50 rounded-md flex items-center gap-1.5 transition cursor-pointer font-bold font-mono text-[10px]"
              >
                <ClipboardCopy className="w-3.5 h-3.5" /> Copiar Fórmula
              </button>

              <button
                onClick={() => setPreviewTemplate(temp)}
                className="bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 border border-[#C9A84C]/30 text-[#C9A84C] px-3.5 py-1.5 rounded-md flex items-center gap-1.5 transition cursor-pointer font-bold font-mono text-[10px]"
              >
                <Printer className="w-3.5 h-3.5" /> Visualizar Receituário
              </button>
            </div>
          </div>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-2 border border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center">
            <FolderLock className="w-10 h-10 text-gray-300 mb-1" />
            <p className="text-gray-500 font-serif text-lg">Nenhum template localizado na biblioteca.</p>
          </div>
        )}
      </div>

      {/* ====== DIALOG: CREATE NEW TEMPLATE MODAL ====== */}
      {showCreateModal && (
        <div id="create_template_modal" className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 font-sans">
          <div className="bg-white border-none text-[#0A0A0A] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center text-xs bg-[#F5F0E8]/40">
              <span className="font-mono text-xs uppercase tracking-wider text-[#C9A84C] font-semibold">Novo Template Clínico</span>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-black transition cursor-pointer font-bold font-mono">Fechar</button>
            </div>

            <form onSubmit={handleCreateTemplate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase text-gray-400 font-mono font-bold">Título do Template</label>
                  <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ex. Eflúvio Telógeno Leve" className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-sm text-[#0A0A0A] p-2.5 rounded outline-none" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase text-gray-400 font-mono font-bold">Diagnóstico Vinculado</label>
                  <input type="text" value={newDiag} onChange={(e) => setNewDiag(e.target.value)} placeholder="Ex. Alopecia Androgenética" className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-sm text-[#0A0A0A] p-2.5 rounded outline-none" />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs uppercase text-gray-400 font-mono font-bold">Categoria Principal</label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-xs text-gray-700 p-2.5 rounded outline-none cursor-pointer"
                  >
                    <option value="Medicamentoso">Medicamentoso</option>
                    <option value="Procedimentos">Procedimentos</option>
                    <option value="Suplementação">Suplementação</option>
                    <option value="Cuidados Domiciliares">Cuidados Domiciliares</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3.5 border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase text-gray-400 font-mono font-bold block">Fármacos Sistêmicos / Tópicos</label>
                  <textarea rows={3} value={newMeds} onChange={(e) => setNewMeds(e.target.value)} className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-xs text-[#0A0A0A] p-2.5 rounded outline-none font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase text-gray-400 font-mono font-bold block">Procedimentos Clinica</label>
                  <textarea rows={3} value={newProcs} onChange={(e) => setNewProcs(e.target.value)} className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-xs text-[#0A0A0A] p-2.5 rounded outline-none font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase text-gray-400 font-mono font-bold block">Suplementos / Ativos de Saúde</label>
                  <textarea rows={3} value={newSupls} onChange={(e) => setNewSupls(e.target.value)} className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-xs text-[#0A0A0A] p-2.5 rounded outline-none font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase text-gray-400 font-mono font-bold block">Fórmula de Higienização Shampoos</label>
                  <textarea rows={3} value={newCosms} onChange={(e) => setNewCosms(e.target.value)} className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A84C] focus:bg-white text-xs text-[#0A0A0A] p-2.5 rounded outline-none font-mono" />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-end gap-2.5 text-xs">
                <button type="button" onClick={() => setShowCreateModal(false)} className="bg-gray-100 hover:bg-gray-250 text-gray-600 px-4 py-2 rounded font-mono uppercase cursor-pointer">Fechar</button>
                <button type="submit" className="bg-[#C9A84C] hover:bg-[#D9B85C] text-black font-semibold px-4 py-2 rounded font-mono uppercase tracking-wider cursor-pointer">Salvar Template</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== DIALOG: PRINT PREVIEW MODAL ====== */}
      {previewTemplate && (
        <div id="print_modal" className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 font-sans">
          <div className="bg-[#F5F0E8] text-[#0A0A0A] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="bg-[#0C0C0C] text-neutral-300 p-4 flex justify-between items-center border-b border-[#252525]">
              <span className="font-mono text-xs uppercase tracking-wider text-[#C9A84C]">Fórmula Clínica • Receituário Oficial</span>
              <button onClick={() => setPreviewTemplate(null)} className="text-neutral-400 hover:text-white transition text-xs font-semibold px-3 py-1 bg-[#202020] rounded cursor-pointer">Fechar</button>
            </div>

            <div className="p-8 font-sans">
              <div className="border border-neutral-300 p-6 bg-[#FCFAF7] min-h-[400px] flex flex-col justify-between shadow-sm">
                
                <div>
                  <div className="flex justify-between border-b-2 border-[#C9A84C]/40 pb-4">
                    <div>
                      <h2 style={{ fontFamily: "Georgia, serif" }} className="text-lg font-serif font-bold text-[#0A0A0A]">{medicaNome}</h2>
                      <p className="text-[10px] text-gray-500 font-mono uppercase font-bold">Especialista em Tricologia Médica</p>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-[#C9A84C] shrink-0 flex items-center justify-center font-serif text-[#C9A84C] text-[13px] font-bold bg-white">M</div>
                  </div>

                  <div className="mt-6 space-y-4 text-xs text-neutral-800 pr-2 leading-relaxed">
                    <p style={{ fontFamily: "Georgia, serif" }} className="font-semibold text-[#0A0A0A] uppercase tracking-widest text-[10px]">Estratégia de Tratamento: {previewTemplate.titulo}</p>
                    
                    {previewTemplate.medicamentos && (
                      <div className="space-y-1">
                        <strong>I. Fármacos Sistêmicos / Tópicos:</strong>
                        <p className="bg-white border border-gray-200/60 p-3 rounded font-mono text-[11px] whitespace-pre-wrap text-gray-700">{previewTemplate.medicamentos}</p>
                      </div>
                    )}

                    {previewTemplate.suplementacao && (
                      <div className="space-y-1">
                        <strong>II. Suplementações Nutracêuticas:</strong>
                        <p className="bg-white border border-gray-200/60 p-3 rounded font-mono text-[11px] whitespace-pre-wrap text-gray-700">{previewTemplate.suplementacao}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center mt-12 border-t border-gray-200 pt-4 text-[9px] text-gray-400">
                  <p>Unidade Toledo: Av. Parigot de Souza, 1222 • Unidade Fátima do Sul: Rua Tenente Fátima, 555</p>
                  <p className="italic mt-1 font-bold">{medicaNome}</p>
                </div>

              </div>
            </div>

            <div className="bg-[#121212] p-4 flex justify-end text-xs">
              <button 
                onClick={() => {
                  alert("Impressão simulada com sucesso!");
                  setPreviewTemplate(null);
                }}
                className="bg-[#C9A84C] hover:bg-[#D9B85C] text-black font-semibold px-4 py-2 rounded transition font-mono uppercase tracking-widest cursor-pointer"
              >
                Imprimir Documento
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
export {};
