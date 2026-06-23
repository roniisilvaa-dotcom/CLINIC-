import React, { useState, useRef, useEffect } from "react";

interface ImageSliderProps {
  beforeImage: string;
  afterImage: string;
}

export default function ImageSlider({ beforeImage, afterImage }: ImageSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", () => setIsDragging(false));
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", () => setIsDragging(false));
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", () => setIsDragging(false));
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", () => setIsDragging(false));
    };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[400px] sm:h-[500px] overflow-hidden rounded-lg select-none cursor-ew-resize bg-black"
      onMouseDown={(e) => {
        setIsDragging(true);
        handleMove(e.clientX);
      }}
      onTouchStart={(e) => {
        setIsDragging(true);
        handleMove(e.touches[0].clientX);
      }}
    >
      {/* Imagem de Fundo (Depois) */}
      <img 
        src={afterImage} 
        alt="Depois" 
        className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Imagem de Sobreposição (Antes) */}
      <div 
        className="absolute top-0 left-0 h-full overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img 
          src={beforeImage} 
          alt="Antes" 
          className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
          style={{ width: containerRef.current ? containerRef.current.offsetWidth : '100vw', maxWidth: 'none' }}
        />
      </div>

      {/* Linha Divisória do Slider */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-[#C9A84C] cursor-ew-resize"
        style={{ left: `calc(${sliderPosition}% - 2px)` }}
      >
        {/* Controle Redondo do Meio */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white border-2 border-[#C9A84C] rounded-full flex items-center justify-center shadow-lg pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-180">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </div>
      </div>
      
      <div className="absolute top-4 left-4 bg-black/60 text-white text-[10px] font-mono uppercase px-2 py-1 rounded">Antes</div>
      <div className="absolute top-4 right-4 bg-black/60 text-white text-[10px] font-mono uppercase px-2 py-1 rounded">Depois</div>
    </div>
  );
}
