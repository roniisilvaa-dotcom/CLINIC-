import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  ImageIcon, 
  Search, 
  Sparkles, 
  Columns, 
  Video, 
  Grid, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Eye,
  Trash
} from "lucide-react";
import { Paciente, FotoCapilar } from "../types";
import ImageSlider from "./ImageSlider";

interface GaleriaGlobalProps {
  pacientes: Paciente[];
  onViewPaciente: (pacienteId: string) => void;
}

interface ImageGridItem {
  id: string;
  pacienteId: string;
  pacienteNome: string;
  diagnostico: string;
  data: string;
  posicao: string;
  url: string;
}

export default function GaleriaGlobal({ pacientes, onViewPaciente }: GaleriaGlobalProps) {
  const [search, setSearch] = useState("");
  const [selectedPhotoLeft, setSelectedPhotoLeft] = useState<ImageGridItem | null>(null);
  const [selectedPhotoRight, setSelectedPhotoRight] = useState<ImageGridItem | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isSliding, setIsSliding] = useState(false);

  // Consolidate all photos from all patient galleries
  const allPhotos: ImageGridItem[] = [];
  pacientes.forEach(p => {
    p.galeria.forEach(f => {
      allPhotos.push({
        id: f.id,
        pacienteId: p.id,
        pacienteNome: p.nome,
        diagnostico: p.diagnostico.principal,
        data: f.data,
        posicao: f.posicao,
        url: f.url
      });
    });
  });

  const filteredPhotos = allPhotos.filter(f => 
    f.pacienteNome.toLowerCase().includes(search.toLowerCase()) || 
    f.diagnostico.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div id="galeria_global_view" className="space-y-6 animate-fadeIn text-[#0A0A0A]">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#0A0A0A]/5 pb-6">
        <div>
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0A0A0A] font-normal">Galeria Capilar</h2>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1.5 font-sans">Acervo unificado de dermoscopias e evolução fotográfica clínica.</p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-250 px-3.5 py-1.5 rounded-lg shadow-sm">
          <ImageIcon className="w-4 h-4 text-[#C9A84C]" />
          <span className="text-xs font-mono font-bold text-gray-600 uppercase tracking-widest">{allPhotos.length} Fotos Registradas</span>
        </div>
      </div>

      {/* Side by side Compare workbench block */}
      <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-5 space-y-4">
        <h3 style={{ fontFamily: "Georgia, serif" }} className="text-base text-[#0A0A0A] font-semibold tracking-wide flex items-center gap-1.5 pb-2 border-b border-gray-100">
          <Columns className="w-4 h-4 text-[#C9A84C]" /> Bancada de Comparação Dinâmica (Split-Screen Slider)
        </h3>

        {selectedPhotoLeft && selectedPhotoRight ? (
          <div className="flex flex-col lg:flex-row gap-6 animate-fadeIn">
            
            {/* Split screen canvas container using ImageSlider */}
            <div className="w-full max-w-xl mx-auto lg:mx-0 relative">
              <ImageSlider 
                beforeImage={selectedPhotoLeft.url}
                afterImage={selectedPhotoRight.url}
              />
              
              {/* Overlays for patient names */}
              <div className="absolute top-3 left-3 bg-black/80 text-xs text-neutral-300 border border-neutral-700 px-3 py-1.5 rounded space-y-0.5 pointer-events-none z-10">
                <span className="font-semibold block font-sans truncate max-w-[125px]">{selectedPhotoLeft.pacienteNome}</span>
                <span className="text-[10px] text-[#C9A84C] font-mono block">{selectedPhotoLeft.data} • {selectedPhotoLeft.posicao}</span>
              </div>
              <div className="absolute top-3 right-3 bg-[#C9A84C] text-black text-xs font-semibold px-3 py-1.5 rounded space-y-0.5 text-right flex flex-col items-end pointer-events-none z-10">
                <span className="font-bold block truncate max-w-[125px]">{selectedPhotoRight.pacienteNome}</span>
                <span className="text-[10px] text-zinc-900 font-mono block font-bold">{selectedPhotoRight.data} • {selectedPhotoRight.posicao}</span>
              </div>

              <div className="mt-2 text-center text-[10px] text-gray-400 font-bold font-sans">
                Arraste o divisor horizontal para cruzar os resultados das fotos selecionadas.
              </div>
            </div>

            {/* Selected stats info card */}
            <div className="flex-1 bg-gray-50 border border-gray-200 p-5 rounded-xl flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs uppercase tracking-widest font-mono text-[#C9A84C] font-bold">Relação da Bancada</span>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-white p-3.5 rounded border border-gray-200 space-y-1 shadow-sm">
                    <span className="text-gray-450 block font-mono text-[9px] uppercase font-bold">Foto Esquerda</span>
                    <span className="font-semibold text-gray-800 block truncate">{selectedPhotoLeft.pacienteNome}</span>
                    <span className="text-[10px] text-[#C9A84C] font-semibold block">{selectedPhotoLeft.diagnostico}</span>
                  </div>

                  <div className="bg-white p-3.5 rounded border border-gray-200 space-y-1 shadow-sm">
                    <span className="text-gray-450 block font-mono text-[9px] uppercase font-bold">Foto Direita</span>
                    <span className="font-semibold text-gray-800 block truncate">{selectedPhotoRight.pacienteNome}</span>
                    <span className="text-[10px] text-[#C9A84C] font-semibold block">{selectedPhotoRight.diagnostico}</span>
                  </div>
                </div>

                <p className="text-gray-500 text-xs leading-relaxed font-sans font-medium">
                  Esta ferramenta de análise volumétrica visual auxilia a médica responsável a quantificar com exatidão a taxa de repovoamento folicular e o surgimento de novas hastes a partir de folículos miniaturizados ativos.
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedPhotoLeft(null);
                  setSelectedPhotoRight(null);
                }}
                className="w-full bg-[#0A0A0A] hover:bg-neutral-800 text-xs text-white hover:text-[#C9A84C] font-mono py-2.5 rounded shadow transition-colors cursor-pointer mt-4 uppercase font-bold tracking-wider"
              >
                Limpar Banco de Comparação
              </button>
            </div>

          </div>
        ) : (
          <div className="bg-gray-50 py-10 rounded-xl border border-dashed border-gray-300 text-center space-y-2 flex flex-col items-center">
            <HelpCircle className="w-8 h-8 text-gray-300 mb-1" />
            <h4 style={{ fontFamily: "Georgia, serif" }} className="text-gray-700 text-sm font-medium">Nenhuma foto selecionada para split-screen</h4>
            <p className="text-gray-400 text-xs max-w-sm mx-auto font-sans">
              Selecione duas fotos do catálogo geral abaixo (uma para a esquerda e outra para a direita) para habilitar o comparador capilar com antes / depois deslizante.
            </p>
          </div>
        )}
      </div>

      {/* Catalog lists of all pictures */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-t border-gray-100 pt-6">
          <h3 style={{ fontFamily: "Georgia, serif" }} className="text-lg text-[#0A0A0A]">Catálogo de Imagens</h3>
          
          <div className="relative max-w-xs w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Filtrar por paciente ou queixa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-250 font-sans focus:border-[#C9A84C] text-xs text-[#0A0A0A] py-2.5 pl-8 pr-3 rounded-lg outline-none shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredPhotos.map((item) => {
            const isLeft = selectedPhotoLeft?.id === item.id;
            const isRight = selectedPhotoRight?.id === item.id;
            return (
              <div 
                key={item.id} 
                className={`bg-white border rounded-lg p-2 space-y-2 transition relative shadow-sm hover:shadow-md ${
                  isLeft || isRight 
                    ? "border-[#C9A84C] bg-[#C9A84C]/5" 
                    : "border-gray-200 hover:border-gray-350"
                }`}
              >
                <div className="h-28 rounded overflow-hidden relative">
                  <img src={item.url} alt={item.posicao} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex flex-col justify-between">
                    <span className="self-end text-[8px] bg-black/60 border border-neutral-800 text-[#C9A84C] px-1.5 py-0.5 rounded font-mono font-bold">
                      {item.data}
                    </span>
                    <span className="text-[10px] text-white font-serif font-bold truncate">{item.pacienteNome}</span>
                  </div>
                </div>

                <div className="space-y-1 text-[10px] px-1">
                  <span className="text-gray-400 font-mono uppercase tracking-wider block font-bold">{item.posicao}</span>
                  <span className="text-gray-600 font-medium truncate block leading-tight font-sans">{item.diagnostico}</span>
                </div>

                {/* Compare Selection Buttons */}
                <div className="pt-2 border-t border-gray-150 flex justify-between gap-1 select-none">
                  <button
                    onClick={() => {
                      if (isLeft) setSelectedPhotoLeft(null);
                      else setSelectedPhotoLeft(item);
                    }}
                    className={`flex-1 text-[9px] uppercase tracking-wider font-mono py-1 rounded text-center transition cursor-pointer font-bold ${
                      isLeft 
                        ? "bg-[#C9A84C] text-black font-extrabold" 
                        : "bg-gray-50 border border-gray-200 hover:bg-[#F5F0E8]/40 hover:border-gray-300 text-gray-500 hover:text-black"
                    }`}
                  >
                    ◄ Esq
                  </button>

                  <button
                    onClick={() => {
                      if (isRight) setSelectedPhotoRight(null);
                      else setSelectedPhotoRight(item);
                    }}
                    className={`flex-1 text-[9px] uppercase tracking-wider font-mono py-1 rounded text-center transition cursor-pointer font-bold ${
                      isRight 
                        ? "bg-[#C9A84C] text-black font-extrabold" 
                        : "bg-gray-50 border border-gray-200 hover:bg-[#F5F0E8]/40 hover:border-gray-300 text-gray-500 hover:text-black"
                    }`}
                  >
                    Dir ►
                  </button>
                </div>
              </div>
            );
          })}

          {filteredPhotos.length === 0 && (
            <p className="col-span-full py-10 text-center text-xs text-gray-400 italic font-mono font-bold">Nenhuma imagem localizada com estes filtros.</p>
          )}
        </div>
      </div>

    </div>
  );
}
export {};
