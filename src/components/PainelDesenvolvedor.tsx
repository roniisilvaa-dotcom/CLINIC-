import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Terminal, Users, ShieldCheck, ShieldOff, Plus, Trash2,
  RefreshCw, Eye, EyeOff, Copy, CheckCheck, Code2, Sparkles
} from "lucide-react";

interface DevUser {
  id: string;
  nome: string;
  cpf: string;
  role: "medica" | "paciente" | "admin";
  ativo: boolean;
  senhaHash: string;
  criadoEm: string;
}

const INITIAL_USERS: DevUser[] = [
  {
    id: "usr-dev-001",
    nome: "Dra. Mariah Zibetti",
    cpf: "000.000.000-00",
    role: "medica",
    ativo: true,
    senhaHash: "caro2025",
    criadoEm: "2026-01-01",
  },
  {
    id: "usr-dev-002",
    nome: "Helena Silveira",
    cpf: "123.456.789-00",
    role: "paciente",
    ativo: true,
    senhaHash: "paciente123",
    criadoEm: "2026-02-10",
  },
  {
    id: "usr-dev-003",
    nome: "Gabriela Portela",
    cpf: "987.654.321-11",
    role: "paciente",
    ativo: false,
    senhaHash: "paciente456",
    criadoEm: "2026-03-05",
  },
];

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin:    { label: "Admin",    color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  medica:   { label: "Médica",   color: "bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/30" },
  paciente: { label: "Paciente", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
};

interface NewUserForm {
  nome: string;
  cpf: string;
  role: "medica" | "paciente" | "admin";
  senha: string;
}

export default function PainelDesenvolvedor() {
  const [users, setUsers] = useState<DevUser[]>(INITIAL_USERS);
  const [showSenha, setShowSenha] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<NewUserForm>({
    nome: "", cpf: "", role: "paciente", senha: "",
  });

  const toggleAtivo = (id: string) => {
    setUsers(prev => prev.map(u =>
      u.id === id ? { ...u, ativo: !u.ativo } : u
    ));
  };

  const handleDelete = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    setConfirmDelete(null);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `usr-${Date.now()}`;
    setUsers(prev => [...prev, {
      id,
      nome: newUser.nome,
      cpf: newUser.cpf,
      role: newUser.role,
      ativo: true,
      senhaHash: newUser.senha,
      criadoEm: new Date().toISOString().slice(0, 10),
    }]);
    setNewUser({ nome: "", cpf: "", role: "paciente", senha: "" });
    setShowNewForm(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const ativos   = users.filter(u => u.ativo).length;
  const inativos = users.filter(u => !u.ativo).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center">
            <Terminal className="w-5 h-5 text-[#C9A84C]" />
          </div>
          <div>
            <h1 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0A0A0A]">
              Painel Desenvolvedor
            </h1>
            <p className="text-xs text-neutral-500 font-mono">Gestão de usuários e acessos do sistema</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 bg-[#C9A84C] hover:bg-[#D9B85C] text-black text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: users.length, icon: Users, color: "text-neutral-700", bg: "bg-neutral-100" },
          { label: "Ativos", value: ativos, icon: ShieldCheck, color: "text-green-700", bg: "bg-green-50 border border-green-200" },
          { label: "Inativos", value: inativos, icon: ShieldOff, color: "text-red-600", bg: "bg-red-50 border border-red-200" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`${stat.bg} rounded-xl p-4 flex items-center gap-3`}>
              <Icon className={`w-5 h-5 ${stat.color}`} />
              <div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-mono">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#0A0A0A] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#C9A84C]" />
            Usuários do Sistema
          </h2>
          <span className="text-xs text-neutral-400 font-mono">{users.length} registros</span>
        </div>

        <div className="divide-y divide-neutral-100">
          {users.map((user) => (
            <motion.div
              key={user.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`px-6 py-4 flex items-center gap-4 transition-colors ${
                user.ativo ? "bg-white hover:bg-neutral-50/70" : "bg-neutral-50 opacity-60"
              }`}
            >
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                user.ativo
                  ? "bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30"
                  : "bg-neutral-200 text-neutral-400 border border-neutral-300"
              }`}>
                {user.nome.split(" ").map(n => n[0]).slice(0, 2).join("")}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-[#0A0A0A] truncate">{user.nome}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${ROLE_LABELS[user.role].color}`}>
                    {ROLE_LABELS[user.role].label}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-neutral-400 font-mono">{user.cpf}</span>
                  <span className="text-neutral-300">·</span>
                  <span className="text-[10px] text-neutral-400">desde {user.criadoEm}</span>
                </div>
              </div>

              {/* Senha */}
              <div className="flex items-center gap-1 bg-neutral-100 rounded-lg px-3 py-1.5 min-w-[120px]">
                <span className="text-xs font-mono text-neutral-500 flex-1 truncate">
                  {showSenha === user.id ? user.senhaHash : "••••••••"}
                </span>
                <button
                  onClick={() => setShowSenha(showSenha === user.id ? null : user.id)}
                  className="text-neutral-400 hover:text-neutral-700 transition cursor-pointer ml-1"
                  title="Ver senha"
                >
                  {showSenha === user.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => copyToClipboard(user.senhaHash, user.id)}
                  className="text-neutral-400 hover:text-[#C9A84C] transition cursor-pointer"
                  title="Copiar senha"
                >
                  {copied === user.id ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleAtivo(user.id)}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer focus:outline-none ${
                    user.ativo ? "bg-green-400" : "bg-neutral-300"
                  }`}
                  title={user.ativo ? "Desativar usuário" : "Ativar usuário"}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
                    user.ativo ? "left-7" : "left-1"
                  }`} />
                </button>
                <span className={`text-xs font-semibold w-14 ${user.ativo ? "text-green-600" : "text-neutral-400"}`}>
                  {user.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>

              {/* Delete */}
              {confirmDelete === user.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 font-semibold">Confirmar?</span>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-xs bg-red-500 text-white px-2 py-1 rounded cursor-pointer hover:bg-red-600 transition"
                  >
                    Sim
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="text-xs text-neutral-500 px-2 py-1 rounded cursor-pointer hover:bg-neutral-100 transition"
                  >
                    Não
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(user.id)}
                  className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                  title="Remover usuário"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* System Info */}
      <div className="bg-[#0A0A0A] border border-[#C9A84C]/20 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Code2 className="w-4 h-4 text-[#C9A84C]" />
          <span className="text-xs text-[#C9A84C] font-mono uppercase tracking-widest">Info do Sistema</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Versão", value: "v3.0.0" },
            { label: "Banco", value: "Neon PostgreSQL" },
            { label: "Deploy", value: "Vercel Edge" },
            { label: "IA", value: "Gemini 2.0 Flash" },
          ].map(info => (
            <div key={info.label} className="space-y-1">
              <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-mono">{info.label}</p>
              <p className="text-sm text-white font-mono">{info.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* New User Modal */}
      <AnimatePresence>
        {showNewForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowNewForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-[#C9A84C]" />
                <h3 className="text-lg font-semibold text-[#0A0A0A]" style={{ fontFamily: "Georgia, serif" }}>
                  Novo Usuário
                </h3>
              </div>

              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">Nome Completo</label>
                  <input
                    required value={newUser.nome}
                    onChange={e => setNewUser(p => ({ ...p, nome: e.target.value }))}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#C9A84C] transition"
                    placeholder="Nome do usuário"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">CPF</label>
                  <input
                    required value={newUser.cpf}
                    onChange={e => setNewUser(p => ({ ...p, cpf: e.target.value }))}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#C9A84C] transition font-mono"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">Perfil</label>
                    <select
                      value={newUser.role}
                      onChange={e => setNewUser(p => ({ ...p, role: e.target.value as any }))}
                      className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#C9A84C] transition bg-white"
                    >
                      <option value="paciente">Paciente</option>
                      <option value="medica">Médica</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-1">Senha</label>
                    <input
                      required value={newUser.senha}
                      onChange={e => setNewUser(p => ({ ...p, senha: e.target.value }))}
                      type="text"
                      className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#C9A84C] transition font-mono"
                      placeholder="senha123"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewForm(false)}
                    className="flex-1 border border-neutral-200 text-neutral-600 text-sm py-2.5 rounded-lg hover:bg-neutral-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#C9A84C] hover:bg-[#D9B85C] text-black text-sm font-bold py-2.5 rounded-lg transition cursor-pointer"
                  >
                    Criar Usuário
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
