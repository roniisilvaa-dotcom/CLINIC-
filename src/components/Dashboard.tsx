import React from "react";
import { motion } from "motion/react";
import { 
  Users, 
  Clock, 
  Activity, 
  RefreshCw, 
  BellRing, 
  MapPin, 
  Video, 
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Stethoscope
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { Paciente, AlertaClinico, EventoAgenda } from "../types";

interface DashboardProps {
  pacientes: Paciente[];
  alertas: AlertaClinico[];
  agendaHoje: EventoAgenda[];
  onStartConsulta: (pacienteId: string) => void;
  onViewPaciente: (pacienteId: string) => void;
}

export default function Dashboard({ 
  pacientes, 
  alertas, 
  agendaHoje, 
  onStartConsulta,
  onViewPaciente 
}: DashboardProps) {

  // Current date in Portuguese formatting
  const formattedDate = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  // Calculate stats based on real data
  const totalPacientes = pacientes.length;
  const pacientesEmTratamento = pacientes.filter(p => p.status === "Em Tratamento").length;
  const pacientesAlta = pacientes.filter(p => p.status === "Alta").length;
  const totalConsultasHoje = agendaHoje.length;

  // Pie chart data for Diagnoses
  const diagCounts: Record<string, number> = {};
  pacientes.forEach(p => {
    const diag = p.diagnostico.principal;
    diagCounts[diag] = (diagCounts[diag] || 0) + 1;
  });

  const chartDataDiagnose = Object.entries(diagCounts).map(([name, value]) => ({
    name: name.length > 25 ? name.substring(0, 25) + "..." : name,
    value
  }));

  const COLORS = ["#C9A84C", "#E2CD8A", "#D1C2A5", "#8E7D5C", "#A2906C", "#DFD5BF"];

  // Bar chart data for patient progress
  const progressData = pacientes.map(p => ({
    Nome: p.nome.split(" ")[0] + " " + (p.nome.split(" ")[2] || ""),
    Progresso: p.progresso,
  }));

  // Status Badge Helper
  const getStatusBadge = (status: Paciente["status"]) => {
    switch (status) {
      case "Em Tratamento":
        return <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200/40 text-[10px] font-bold rounded uppercase tracking-wide">Em Tratamento</span>;
      case "Em Pausa":
        return <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200/40 text-[10px] font-bold rounded uppercase tracking-wide font-medium">Em Pausa</span>;
      case "Alta":
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200/40 text-[10px] font-bold rounded uppercase tracking-wide font-medium">Alta Clínica</span>;
      case "Sem Retorno":
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200/40 text-[10px] font-bold rounded uppercase tracking-wide font-medium">Sem Retorno</span>;
      default:
        return null;
    }
  };

  // Severity style helper
  const getAlertStyle = (severity: AlertaClinico["severidade"]) => {
    switch (severity) {
      case "error":
        return { pill: "bg-red-500" };
      case "warning":
        return { pill: "bg-[#C9A84C]" };
      case "success":
        return { pill: "bg-emerald-500" };
      default:
        return { pill: "bg-neutral-600" };
    }
  };

  return (
    <div id="dashboard_view" className="space-y-8 animate-fadeIn text-[#0A0A0A]">
      {/* Greetings Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#0A0A0A]/5 pb-6">
        <div>
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl sm:text-4xl italic text-[#0A0A0A] font-normal tracking-tight">
            Bom dia, Dra. Mariah
          </h2>
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-1.5 font-semibold">
            {formattedDate} • CRM PR 57.133
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#F5F0E8] rounded-full text-[11px] font-bold text-[#0A0A0A]/70 border border-[#C9A84C]/15">
            <span className="w-2   h-2 rounded-full bg-green-500"></span> TOLEDO & FÁTIMA
          </div>
          <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/25 px-4 py-2 rounded-lg flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
            <span className="text-[10px] text-[#C9A84C] uppercase tracking-wider font-semibold font-mono">Premium Suite Ativa</span>
          </div>
        </div>
      </div>

      {/* 4 Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="bg-white p-5 border-l-4 border-[#C9A84C] border-y border-r border-[#E5E5E5] shadow-sm flex flex-col justify-between h-28 hover:shadow-md transition duration-200">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pacientes Ativos</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-serif font-light text-[#0A0A0A]">{totalPacientes}</span>
            <span className="text-[10px] text-green-600 font-bold mb-1">+12%</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 border-l-4 border-[#0A0A0A] border-y border-r border-[#E5E5E5] shadow-sm flex flex-col justify-between h-28 hover:shadow-md transition duration-200">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Consultas Hoje</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-serif font-light text-[#0A0A0A]">{String(totalConsultasHoje).padStart(2, '0')}</span>
            <span className="text-[10px] text-blue-600 font-bold mb-1">Prox: 14:30</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 border-l-4 border-[#C9A84C] border-y border-r border-[#E5E5E5] shadow-sm flex flex-col justify-between h-28 hover:shadow-md transition duration-200">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tratamentos Ativos</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-serif font-light text-[#0A0A0A]">{pacientesEmTratamento}</span>
            <span className="text-[10px] text-gray-500 font-bold mb-1">Em curso</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 border-l-4 border-[#0A0A0A] border-y border-r border-[#E5E5E5] shadow-sm flex flex-col justify-between h-28 hover:shadow-md transition duration-200">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Taxa de Presença</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-serif font-light text-[#0A0A0A]">88%</span>
            <span className="text-[10px] text-green-600 font-bold mb-1">90 dias</span>
          </div>
        </div>
      </div>

      {/* Main Content Split Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Agenda Capilar & Evolution Progress */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: Agenda de Consultas Hoje */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6 flex flex-col overflow-hidden space-y-4">
            <div className="flex justify-between items-center">
              <h4 style={{ fontFamily: "Georgia, serif" }} className="text-lg text-[#0A0A0A]">
                Agenda de Consultas
              </h4>
              <span className="text-[10px] text-[#C9A84C] font-mono tracking-widest uppercase bg-[#F5F0E8] px-2.5 py-1 rounded font-bold">
                {totalConsultasHoje} Atendimentos
              </span>
            </div>

            <div className="space-y-4">
              {agendaHoje.map((evento) => {
                const pInfo = pacientes.find(p => p.id === evento.pacienteId);
                const isActive = evento.status !== "Realizada";
                return (
                  <div 
                    key={evento.id} 
                    className={`p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition duration-200 ${
                      isActive 
                        ? "bg-[#F5F0E8] border border-[#C9A84C]/25" 
                        : "border border-gray-100 bg-white opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-white text-[#0A0A0A] border border-[#C9A84C]/30 flex items-center justify-center font-serif font-bold text-sm shrink-0">
                        {pInfo?.nome.substring(0, 2).toUpperCase() || evento.pacienteNome.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span 
                            className="font-medium text-[#0A0A0A] text-sm hover:text-[#C9A84C] hover:underline transition cursor-pointer" 
                            onClick={() => onViewPaciente(evento.pacienteId)}
                          >
                            {evento.pacienteNome}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-semibold uppercase tracking-wider ${
                            evento.tipo === "Online" 
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200/50" 
                              : "bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20"
                          } flex items-center gap-1`}>
                            {evento.tipo}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{evento.diagnosticoResumo}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-[#0A0A0A]/5 pt-3 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[9px] text-gray-400 font-mono block uppercase">Horário</span>
                        <span className="text-xs font-semibold text-[#0A0A0A] font-mono">{evento.horario}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {evento.status === "Realizada" ? (
                          <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-200/60 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                            Realizada
                          </span>
                        ) : (
                          <button 
                            onClick={() => onStartConsulta(evento.pacienteId)}
                            className="text-[10px] bg-[#0A0A0A] text-white px-4 py-1.5 rounded-full hover:bg-[#C9A84C] hover:text-black transition-colors font-bold uppercase tracking-wider cursor-pointer"
                          >
                            Iniciar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Evolução dos Pacientes (Progress Tracker) */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-lg text-[#0A0A0A]">
                Evolução dos Pacientes
              </h3>
              <button 
                onClick={() => onViewPaciente(pacientes[0]?.id || "")}
                className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-widest hover:underline"
              >
                Ver Detalhes
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-sm">
                <thead>
                  <tr className="text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-50 bg-gray-50/50">
                    <th className="px-6 py-4 font-semibold">Paciente</th>
                    <th className="px-6 py-4 font-semibold">Diagnóstico</th>
                    <th className="px-6 py-4 font-semibold">Progresso</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pacientes.map((paciente) => (
                    <tr key={paciente.id} className="hover:bg-[#F5F0E8]/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#F5F0E8] text-[#0A0A0A] flex items-center justify-center text-[10px] border border-[#C9A84C]/30 font-serif font-bold shrink-0">
                            {paciente.nome.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span 
                              className="text-sm font-medium text-[#0A0A0A] hover:text-[#C9A84C] transition cursor-pointer"
                              onClick={() => onViewPaciente(paciente.id)}
                            >
                              {paciente.nome}
                            </span>
                            <span className="text-[10px] text-[#C9A84C] font-mono tracking-wide">{paciente.idade} anos • {paciente.cidade}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-600">{paciente.diagnostico.principal}</span>
                      </td>
                      <td className="px-6 py-4 w-36">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-1 overflow-hidden">
                            <div 
                              className="bg-[#C9A84C] h-1 rounded-full animate-pulse" 
                              style={{ width: `${paciente.progresso}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-semibold text-gray-500">{paciente.progresso}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(paciente.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Technical Charts of Treatment progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 shadow-sm space-y-4">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Taxa de Redensificação (%)</span>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={progressData}>
                    <XAxis dataKey="Nome" stroke="#8c8c8c" fontSize={8} tickLine={false} />
                    <YAxis stroke="#8c8c8c" fontSize={9} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E5E5E5", borderRadius: 8, color: "#0A0A0A" }} />
                    <Bar dataKey="Progresso" fill="#C9A84C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 shadow-sm space-y-4">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Índice de Diagnósticos</span>
              <div className="h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartDataDiagnose}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartDataDiagnose.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E5E5E5", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1 text-[9px] text-gray-500 pl-2">
                  {chartDataDiagnose.slice(0, 3).map((entry, i) => (
                    <div key={entry.name} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i] }} />
                      <span className="truncate max-w-[100px]">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Alerts and quick tips */}
        <div className="space-y-6">
          
          {/* Section: Alertas Clínicos */}
          <div className="bg-[#0A0A0A] p-6 rounded-xl text-white shadow-2xl border border-[#C9A84C]/25">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#C9A84C] mb-4">
              Alertas Clínicos
            </h4>

            <div className="space-y-4">
              {alertas.map((alerta) => {
                const styles = getAlertStyle(alerta.severidade);
                return (
                  <div 
                    key={alerta.id} 
                    className="flex gap-3.5 items-start bg-neutral-900/40 p-3 rounded-lg border border-neutral-850"
                  >
                    <div className={`w-1 h-10 ${styles.pill} rounded-full`}></div>
                    <div>
                      <p 
                        className="text-xs font-semibold text-[#FAFAFA] hover:text-[#C9A84C] transition cursor-pointer"
                        onClick={() => onViewPaciente(alerta.pacienteId)}
                      >
                        {alerta.pacienteNome}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{alerta.mensagem}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Clinical Tips / Dra. Mariah Quick Resources */}
          <div className="bg-white border border-[#E5E5E5] shadow-sm rounded-xl p-6 relative overflow-hidden bg-gradient-to-tr from-[#F5F0E8]/20 to-white">
            <h3 className="text-sm font-serif font-bold text-[#0A0A0A] tracking-wide flex items-center gap-1.5 mb-2 py-0.5 border-b border-gray-100 pb-2">
              <Sparkles className="w-4 h-4 text-[#C9A84C]" /> Assistências Ativas em IA
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Você pode solicitar análises inteligentes das bioquímicas laboratoriais diretamente na ficha de exames de cada paciente, ou comparar fotos microscópicas sequenciais de dermoscopia. Todas as interações contêm o selo de apoio da tecnologia CA.RO Clinic IA.
            </p>
            <div className="pt-4 mt-4 flex justify-between items-center border-t border-gray-150">
              <span className="text-[9px] text-gray-400 font-mono uppercase">Certificado CRM PR 57.133</span>
              <span className="text-xs text-[#C9A84C] font-semibold italic">Mariah Zibetti</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
