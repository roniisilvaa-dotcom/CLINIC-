import React, { useEffect, useRef, useState } from "react";
import {
  Building2, Users, UserSquare2, LogOut, RefreshCw, Sparkles, LayoutDashboard,
  Plus, X, Pencil, Trash2, ImagePlus, Check,
} from "lucide-react";

interface Clinica {
  id: string;
  nome: string;
  slug: string;
  plano: string;
  ativo: boolean;
  criada_em: string;
  logo_url: string | null;
  telefone: string | null;
  email: string | null;
  cnpj: string | null;
  endereco: string | null;
  cidade: string | null;
  responsavel_nome: string | null;
  responsavel_crm: string | null;
  observacoes: string | null;
  usuarios: number;
  pacientes: number;
  email_acesso: string | null;
}

const PLANOS = ["Standard", "Precision", "Enterprise"];

interface FormState {
  clinicaNome: string;
  nome: string;          // responsável
  crm: string;
  email: string;         // login
  senha: string;
  emailClinica: string;  // contato
  telefone: string;
  cnpj: string;
  cidade: string;
  endereco: string;
  plano: string;
  ativo: boolean;
  observacoes: string;
  logoUrl: string;
}

const vazio: FormState = {
  clinicaNome: "", nome: "", crm: "", email: "", senha: "", emailClinica: "",
  telefone: "", cnpj: "", cidade: "", endereco: "", plano: "Standard", ativo: true,
  observacoes: "", logoUrl: "",
};

function redimensionar(file: File, maxDim = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function DevPanel({ onLogout, onOpenApp }: { onLogout: () => void; onOpenApp: () => void }) {
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [modal, setModal] = useState<null | { modo: "criar" | "editar"; id?: string }>(null);
  const [form, setForm] = useState<FormState>(vazio);
  const [salvando, setSalvando] = useState(false);
  const [formMsg, setFormMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function carregar() {
    setLoading(true); setErro("");
    try {
      const r = await fetch("/api/admin/clinicas");
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Falha ao carregar.");
      setClinicas(data.clinicas || []);
    } catch (e: any) { setErro(e.message); } finally { setLoading(false); }
  }
  useEffect(() => { carregar(); }, []);

  function abrirCriar() {
    setForm(vazio); setFormMsg(""); setModal({ modo: "criar" });
  }
  function abrirEditar(c: Clinica) {
    setForm({
      clinicaNome: c.nome, nome: c.responsavel_nome || "", crm: c.responsavel_crm || "",
      email: c.email_acesso || "", senha: "", emailClinica: c.email || "",
      telefone: c.telefone || "", cnpj: c.cnpj || "", cidade: c.cidade || "",
      endereco: c.endereco || "", plano: c.plano, ativo: c.ativo,
      observacoes: c.observacoes || "", logoUrl: c.logo_url || "",
    });
    setFormMsg(""); setModal({ modo: "editar", id: c.id });
  }

  const set = (k: keyof FormState, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function enviarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try { set("logoUrl", await redimensionar(file)); }
    catch { setFormMsg("Não foi possível carregar a imagem."); }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true); setFormMsg("");
    try {
      const criar = modal?.modo === "criar";
      const url = criar ? "/api/admin/create-clinic" : "/api/admin/update-clinic";
      const body: any = { ...form };
      if (!criar) body.clinicaId = modal?.id;
      const r = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Falha ao salvar.");
      setModal(null); carregar();
    } catch (e: any) { setFormMsg(e.message); } finally { setSalvando(false); }
  }

  async function excluir() {
    if (!modal?.id) return;
    if (!confirm("Excluir esta clínica e todos os seus dados? Esta ação não pode ser desfeita.")) return;
    setSalvando(true);
    try {
      await fetch("/api/admin/delete-clinic", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicaId: modal.id }),
      });
      setModal(null); carregar();
    } finally { setSalvando(false); }
  }

  async function mudarPlano(id: string, plano: string) {
    setClinicas((p) => p.map((c) => (c.id === id ? { ...c, plano } : c)));
    try {
      await fetch("/api/admin/set-plano", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicaId: id, plano }),
      });
    } catch { carregar(); }
  }

  const totalPacientes = clinicas.reduce((s, c) => s + Number(c.pacientes), 0);
  const totalUsuarios = clinicas.reduce((s, c) => s + Number(c.usuarios), 0);

  return (
    <div className="min-h-screen bg-[#0B0A08] text-gray-100 font-sans">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg border border-[#C9A84C]/40 bg-[#C9A84C]/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#C9A84C]" />
          </div>
          <div>
            <div className="font-mono uppercase tracking-[0.25em] text-xs text-[#C9A84C]">CA.RO Clinic</div>
            <div className="text-sm text-gray-400">Painel do Desenvolvedor · Super-Admin</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onOpenApp} className="flex items-center gap-1.5 text-xs font-semibold bg-[#C9A84C] text-black hover:bg-[#E0C36A] px-3.5 py-2 rounded-lg transition">
            <LayoutDashboard className="w-3.5 h-3.5" /> Abrir aplicativo
          </button>
          <button onClick={carregar} className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition">
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </button>
          <button onClick={onLogout} className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-red-500/20 px-3 py-2 rounded-lg transition">
            <LogOut className="w-3.5 h-3.5" /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card icon={<Building2 className="w-5 h-5" />} label="Clínicas" value={clinicas.length} />
          <Card icon={<Users className="w-5 h-5" />} label="Usuários" value={totalUsuarios} />
          <Card icon={<UserSquare2 className="w-5 h-5" />} label="Pacientes" value={totalPacientes} />
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white/80">Clínicas cadastradas</h2>
          <button onClick={abrirCriar} className="flex items-center gap-1.5 text-xs font-semibold bg-[#C9A84C] text-black hover:bg-[#E0C36A] px-3.5 py-2 rounded-lg transition">
            <Plus className="w-3.5 h-3.5" /> Nova clínica
          </button>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Carregando…</div>
          ) : erro ? (
            <div className="p-8 text-center text-red-400 text-sm">{erro}</div>
          ) : clinicas.length === 0 ? (
            <div className="p-10 text-center text-gray-500 text-sm">
              Nenhuma clínica cadastrada. Clique em <span className="text-[#C9A84C]">Nova clínica</span> para começar.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-gray-500 text-xs uppercase">
                <tr className="border-b border-white/10">
                  <th className="text-left px-5 py-2.5 font-medium">Clínica</th>
                  <th className="text-left px-5 py-2.5 font-medium">Plano</th>
                  <th className="text-center px-5 py-2.5 font-medium">Status</th>
                  <th className="text-right px-5 py-2.5 font-medium">Usuários</th>
                  <th className="text-right px-5 py-2.5 font-medium">Pacientes</th>
                  <th className="text-right px-5 py-2.5 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clinicas.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {c.logo_url ? (
                          <img src={c.logo_url} alt="" className="w-9 h-9 rounded-lg object-cover border border-white/10" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#C9A84C]">
                            <Building2 className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-100">{c.nome}</div>
                          <div className="text-xs text-gray-500">{c.cidade || `/${c.slug}`}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={c.plano}
                        onChange={(e) => mudarPlano(c.id, e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-[#C9A84C] font-semibold focus:outline-none focus:border-[#C9A84C]/60 cursor-pointer"
                      >
                        {PLANOS.map((p) => <option key={p} value={p} className="bg-[#15140F] text-white">{p}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {c.ativo ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Ativa
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">Inativa</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-300">{c.usuarios}</td>
                    <td className="px-5 py-3 text-right text-gray-300">{c.pacientes}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => abrirEditar(c)} className="inline-flex items-center gap-1 text-xs border border-white/10 hover:border-[#C9A84C]/50 hover:text-[#C9A84C] px-2.5 py-1.5 rounded-lg transition">
                        <Pencil className="w-3 h-3" /> Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <footer className="pt-4 text-center text-[11px] text-gray-600">
          Desenvolvido por CA.RO Tech — 2026 · Todos os direitos reservados.
        </footer>
      </main>

      {/* ───── Modal de cadastro / edição ───── */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4">
          <form onSubmit={salvar} className="w-full max-w-2xl my-6 bg-[#15140F] border border-white/10 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold">{modal.modo === "criar" ? "Nova clínica" : "Editar clínica"}</h3>
              <button type="button" onClick={() => setModal(null)} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Foto */}
              <div className="flex items-center gap-4">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="" className="w-20 h-20 rounded-xl object-cover border border-white/10" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-white/5 border border-dashed border-white/15 flex items-center justify-center text-white/30">
                    <Building2 className="w-7 h-7" />
                  </div>
                )}
                <div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={enviarFoto} />
                  <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 text-xs border border-white/15 hover:border-[#C9A84C]/50 hover:text-[#C9A84C] px-3 py-2 rounded-lg transition">
                    <ImagePlus className="w-3.5 h-3.5" /> {form.logoUrl ? "Trocar foto" : "Adicionar foto da clínica"}
                  </button>
                  {form.logoUrl && (
                    <button type="button" onClick={() => set("logoUrl", "")} className="ml-2 text-xs text-white/40 hover:text-red-300">Remover</button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Campo label="Nome da clínica *"><input className={inp} value={form.clinicaNome} onChange={(e) => set("clinicaNome", e.target.value)} required /></Campo>
                <Campo label="Responsável (médica) *"><input className={inp} value={form.nome} onChange={(e) => set("nome", e.target.value)} required /></Campo>
                <Campo label="CRM"><input className={inp} value={form.crm} onChange={(e) => set("crm", e.target.value)} /></Campo>
                <Campo label="Plano">
                  <select className={inp} value={form.plano} onChange={(e) => set("plano", e.target.value)}>
                    {PLANOS.map((p) => <option key={p} value={p} className="bg-[#15140F]">{p}</option>)}
                  </select>
                </Campo>

                <Campo label="Email de acesso (login) *"><input type="email" className={inp} value={form.email} onChange={(e) => set("email", e.target.value)} required /></Campo>
                <Campo label={modal.modo === "criar" ? "Senha de acesso *" : "Nova senha (vazio = manter)"}>
                  <input type="text" className={inp} value={form.senha} onChange={(e) => set("senha", e.target.value)} required={modal.modo === "criar"} placeholder={modal.modo === "editar" ? "•••••• (inalterada)" : ""} />
                </Campo>

                <Campo label="Telefone"><input className={inp} value={form.telefone} onChange={(e) => set("telefone", e.target.value)} /></Campo>
                <Campo label="CNPJ"><input className={inp} value={form.cnpj} onChange={(e) => set("cnpj", e.target.value)} /></Campo>
                <Campo label="Email de contato"><input type="email" className={inp} value={form.emailClinica} onChange={(e) => set("emailClinica", e.target.value)} /></Campo>
                <Campo label="Cidade"><input className={inp} value={form.cidade} onChange={(e) => set("cidade", e.target.value)} /></Campo>
                <div className="sm:col-span-2">
                  <Campo label="Endereço"><input className={inp} value={form.endereco} onChange={(e) => set("endereco", e.target.value)} /></Campo>
                </div>
                <div className="sm:col-span-2">
                  <Campo label="Observações"><textarea className={`${inp} min-h-[70px] resize-y`} value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} /></Campo>
                </div>
              </div>

              {modal.modo === "editar" && (
                <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                  <input type="checkbox" checked={form.ativo} onChange={(e) => set("ativo", e.target.checked)} className="accent-[#C9A84C] w-4 h-4" />
                  Clínica ativa
                </label>
              )}

              {formMsg && <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">{formMsg}</div>}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
              {modal.modo === "editar" ? (
                <button type="button" onClick={excluir} disabled={salvando} className="flex items-center gap-1.5 text-xs text-red-300 hover:text-red-200 border border-red-500/20 hover:bg-red-500/10 px-3 py-2 rounded-lg transition">
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              ) : <span />}
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setModal(null)} className="text-sm text-white/60 hover:text-white px-4 py-2">Cancelar</button>
                <button type="submit" disabled={salvando} className="bg-[#C9A84C] text-black font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#E0C36A] transition disabled:opacity-60">
                  {salvando ? "Salvando…" : modal.modo === "criar" ? "Criar clínica" : "Salvar alterações"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const inp = "w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#C9A84C]/60 transition";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wide text-white/40 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Card({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
      <div className="flex items-center gap-2 text-[#C9A84C]">{icon}<span className="text-xs uppercase tracking-wide text-gray-400">{label}</span></div>
      <div className="text-3xl font-semibold mt-2">{value}</div>
    </div>
  );
}
