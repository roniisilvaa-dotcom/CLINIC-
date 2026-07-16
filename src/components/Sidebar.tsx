import React from "react";
import {
  LayoutDashboard, Users, FilePlus, Calendar,
  FileText, Image as ImageIcon, Bot, CreditCard,
  ChevronLeft, ChevronRight, LogOut, Receipt, Terminal,
  MessageCircle, FileBarChart,
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onLogout: () => void;
  userRole: "medica" | "paciente" | "dev";
  medicaNome: string;
}

export default function Sidebar({ currentTab, setCurrentTab, collapsed, setCollapsed, onLogout, userRole, medicaNome }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
    { id: "pacientes", label: "Pacientes", icon: Users },
    { id: "nova_consulta", label: "Nova Consulta", icon: FilePlus },
    { id: "agenda", label: "Agenda", icon: Calendar },
    { id: "prescricoes", label: "Prescrições", icon: FileText },
    { id: "financeiro", label: "Faturamento e Caixa", icon: Receipt },
    { id: "relatorios", label: "Relatórios", icon: FileBarChart },
    { id: "galeria_capilar", label: "Galeria Capilar", icon: ImageIcon },
    { id: "ia_assistente", label: "IA Assistente", icon: Bot },
    { id: "whatsapp_bot", label: "IA Secretária WhatsApp", icon: MessageCircle },
    { id: "planos", label: "Planos e Assinaturas", icon: CreditCard },
  ];

  const NavBtn = ({ id, label, icon: Icon, accent = false }: { id: string; label: string; icon: React.ElementType; accent?: boolean; [k: string]: any }) => {
    const isActive = currentTab === id;
    return (
      <button onClick={() => setCurrentTab(id)} title={collapsed ? label : undefined}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
          isActive
            ? "bg-[#C9A84C]/10 text-[#C9A84C] font-medium border-l-2 border-[#C9A84C]"
            : accent
            ? "text-[#C9A84C]/60 hover:text-[#C9A84C] hover:bg-[#C9A84C]/5"
            : "text-[#F5F0E8]/60 hover:text-white hover:bg-[#111111]"
        }`}>
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#C9A84C]" : accent ? "text-[#C9A84C]/50" : "text-neutral-500"}`} />
        {!collapsed && <span className="truncate">{label}</span>}
      </button>
    );
  };

  const initials = medicaNome.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("");

  return (
    <aside className={`hidden md:flex flex-col bg-[#0A0A0A] border-r border-[#C9A84C]/20 text-neutral-300 transition-all duration-300 h-screen sticky top-0 z-40 shadow-2xl ${collapsed ? "w-20" : "w-64"}`}>
      {/* Header */}
      <div className="p-8 pb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-full border border-[#C9A84C]/80 bg-black flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(201,168,76,0.15)]">
            <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "-1.5px" }} className="text-[13px] text-[#C9A84C]">CR</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col select-none">
              <h1 style={{ fontFamily: "Georgia, serif" }} className="text-2xl tracking-tight text-[#C9A84C] font-semibold">CA.RO Clinic</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#F5F0E8]/50 mt-1 font-mono">Precision Medicine</p>
            </div>
          )}
        </div>
        <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex p-1 hover:bg-[#1A1A1A] rounded-md text-neutral-500 hover:text-neutral-200 transition cursor-pointer">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="p-4 space-y-1 mt-4 flex-1 overflow-y-auto">
        {menuItems.map(({ id, label, icon }) => {
          return <NavBtn key={id} id={id} label={label} icon={icon} />;
        })}

        {/* Dev Panel — só para dev */}
        {userRole === "dev" && (
          <>
            <div className="pt-4 pb-1">
              {!collapsed
                ? <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-600 px-4 font-mono">Desenvolvedor</p>
                : <div className="border-t border-[#C9A84C]/10 my-2" />
              }
            </div>
            <NavBtn id="dev_panel" label="Painel Dev" icon={Terminal} accent />
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-[#F5F0E8]/10 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden py-1 mb-4">
          <div className="w-10 h-10 rounded-full border border-[#C9A84C] bg-[#F5F0E8]/10 flex items-center justify-center text-[#C9A84C] text-xs font-serif shrink-0">
            {userRole === "dev" ? <Terminal className="w-4 h-4" /> : initials}
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold text-white truncate">
                {userRole === "dev" ? "Dev Admin" : medicaNome}
              </span>
              <span className="text-[10px] text-[#F5F0E8]/40 truncate">
                {userRole === "dev" ? "Acesso Total" : "CRM PR 57.133"}
              </span>
            </div>
          )}
        </div>
        {!collapsed
          ? <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-neutral-500 hover:text-red-400 bg-[#161616] hover:bg-red-500/10 rounded-md transition cursor-pointer">
              <LogOut className="w-3.5 h-3.5" /><span>Sair do Painel</span>
            </button>
          : <button onClick={onLogout} className="w-full flex items-center justify-center p-2 text-neutral-500 hover:text-red-400 transition cursor-pointer" title="Sair">
              <LogOut className="w-4 h-4" />
            </button>
        }
      </div>
    </aside>
  );
}
export {};
