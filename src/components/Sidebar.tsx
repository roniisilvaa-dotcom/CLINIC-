import React from "react";
import { 
  Sparkles, 
  LayoutDashboard, 
  Users, 
  FilePlus, 
  Calendar, 
  FileText, 
  Image as ImageIcon, 
  Bot, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Receipt
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onLogout: () => void;
  medicaNome: string;
}

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  collapsed, 
  setCollapsed, 
  onLogout,
  medicaNome 
}: SidebarProps) {

  const menuItems = [
    { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
    { id: "pacientes", label: "Pacientes", icon: Users },
    { id: "nova_consulta", label: "Nova Consulta", icon: FilePlus },
    { id: "agenda", label: "Agenda", icon: Calendar },
    { id: "prescricoes", label: "Prescrições", icon: FileText },
    { id: "financeiro", label: "Faturamento e Caixa", icon: Receipt },
    { id: "galeria_capilar", label: "Galeria Capilar", icon: ImageIcon },
    { id: "ia_assistente", label: "IA Assistente", icon: Bot },
    { id: "sobre_tech", label: "CA.RO TECH", icon: ShieldCheck },
  ];

  return (
    <aside 
      id="main_sidebar" 
      className={`hidden md:flex flex-col justify-between bg-[#0A0A0A] border-r border-[#C9A84C]/20 text-neutral-300 transition-all duration-300 h-screen sticky top-0 z-40 shadow-2xl ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Sidebar Header: Brand */}
      <div>
        <div className="p-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full border border-[#C9A84C]/80 bg-black flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(201,168,76,0.15)]">
              <Sparkles className="w-4.5 h-4.5 text-[#C9A84C]" />
            </div>
            {!collapsed && (
              <div className="flex flex-col select-none animate-fadeIn">
                <h1 style={{ fontFamily: "Georgia, serif" }} className="text-2xl tracking-tight text-[#C9A84C] font-semibold">CA.RO Clinic</h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#F5F0E8]/50 mt-1 font-mono">Precision Medicine</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1 hover:bg-[#1A1A1A] rounded-md text-neutral-500 hover:text-neutral-200 transition cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Menu Links */}
        <nav className="p-4 space-y-1 mt-4 overflow-y-auto max-h-[calc(100vh-220px)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? "bg-[#C9A84C]/10 text-[#C9A84C] font-medium border-l-2 border-[#C9A84C]" 
                    : "text-[#F5F0E8]/60 hover:text-white hover:bg-[#111111]"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                  isActive ? "text-[#C9A84C]" : "text-neutral-500"
                }`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer: Doctor profile */}
      <div className="p-6 border-t border-[#F5F0E8]/10 bg-[#0A0A0A]">
        <div className="flex items-center gap-3 overflow-hidden py-1">
          <div className="w-10 h-10 rounded-full border border-[#C9A84C] bg-[#F5F0E8]/10 flex items-center justify-center text-[#C9A84C] text-xs font-serif shrink-0">
            {(medicaNome.replace(/Dra?\.?/i, "").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("") || "DR").toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden animate-fadeIn">
              <span className="text-xs font-semibold text-white truncate">{medicaNome}</span>
              <span className="text-[10px] text-[#C9A84C] truncate font-mono uppercase tracking-wider">Dermatologia & Tricologia</span>
            </div>
          )}
        </div>

        {!collapsed ? (
          <button 
            onClick={onLogout}
            className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2 text-xs text-neutral-500 hover:text-red-400 bg-[#161616] hover:bg-red-500/10 rounded-md transition duration-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair do Painel</span>
          </button>
        ) : (
          <button 
            onClick={onLogout}
            className="w-full mt-4 flex items-center justify-center p-2 text-neutral-500 hover:text-red-400 transition cursor-pointer"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
export {};
