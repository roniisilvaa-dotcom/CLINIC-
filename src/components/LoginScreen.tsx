import React, { useState } from "react";
import { Stethoscope, User, Terminal, Lock, CreditCard, Mail, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Paciente } from "../types";

interface LoginScreenProps {
  onLogin: (role: "medica" | "paciente" | "dev", data?: string, token?: string) => void;
  pacientes: Paciente[];
}

type MainRole = "medica" | "paciente";

const CSS = `
:root{
  --bg:#070707;
  --gold:#c99b43;
  --gold-light:#f0d38d;
  --gold-deep:#8d6528;
  --text:#f5f1e7;
  --muted:#9d9a94;
  --shadow:0 24px 80px rgba(0,0,0,.55);
}
.caro-login *{box-sizing:border-box}
.caro-login{
  min-height:100vh;
  font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at 14% 20%, rgba(201,155,67,.08), transparent 24%),
    radial-gradient(circle at 88% 78%, rgba(201,155,67,.05), transparent 30%),
    #050505;
  color:var(--text);
  overflow-x:hidden;
}
.caro-page{
  min-height:100vh;
  display:grid;
  grid-template-columns:minmax(0,1.1fr) minmax(360px,.9fr);
  position:relative;
}
.caro-visual{
  position:relative;
  min-height:100vh;
  padding:56px 64px;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  overflow:hidden;
  border-right:1px solid rgba(201,155,67,.12);
}
.caro-visual::before{
  content:"";
  position:absolute;
  inset:0;
  background:
    linear-gradient(90deg, rgba(0,0,0,.15), rgba(0,0,0,.55)),
    radial-gradient(circle at 28% 35%, rgba(201,155,67,.14), transparent 26%);
  z-index:-2;
}
.caro-brand{ display:flex; align-items:center; gap:18px; max-width:max-content; }
.caro-brand-mark{
  width:60px; height:60px; border:1px solid var(--gold); border-radius:50%;
  display:grid; place-items:center; color:var(--gold-light);
  font-family:Georgia, serif; font-size:21px; letter-spacing:-3px;
  box-shadow:inset 0 0 24px rgba(201,155,67,.08); flex-shrink:0;
}
.caro-brand-copy strong{
  display:block; font-family:Georgia, "Times New Roman", serif; font-size:24px;
  font-weight:500; letter-spacing:.12em; color:var(--gold-light);
}
.caro-brand-copy span{
  display:block; margin-top:6px; font-size:10px; letter-spacing:.32em;
  text-transform:uppercase; color:var(--gold);
}
.caro-hero{ max-width:600px; margin:64px 0 26px; }
.caro-eyebrow{ display:flex; align-items:center; gap:12px; color:var(--gold); font-size:11px; letter-spacing:.28em; text-transform:uppercase; }
.caro-eyebrow::before{ content:""; width:34px; height:1px; background:var(--gold); }
.caro-hero h1{
  margin:20px 0 16px; font-family:Georgia, "Times New Roman", serif;
  font-size:clamp(32px,3.6vw,48px); line-height:1.12; font-weight:500; letter-spacing:-.02em; max-width:640px;
}
.caro-hero h1 span{ color:var(--gold-light); }
.caro-hero p{ margin:0; max-width:520px; color:var(--muted); font-size:15px; line-height:1.7; }
.caro-med-visual{ position:relative; height:150px; max-width:640px; margin-top:30px; border-top:1px solid rgba(201,155,67,.14); overflow:hidden; }
.caro-nodes{ position:absolute; inset:0; opacity:.5; background-image:radial-gradient(circle, rgba(201,155,67,.8) 0 1px, transparent 2px); background-size:38px 38px; mask-image:linear-gradient(to top, black, transparent 78%); }
.caro-pulse{ position:absolute; left:0; right:0; top:44px; height:70px; }
.caro-pulse svg{ width:100%; height:100%; overflow:visible; filter:drop-shadow(0 0 12px rgba(201,155,67,.25)); }
.caro-pulse path{ fill:none; stroke:url(#caroGoldStroke); stroke-width:2; stroke-linejoin:round; stroke-linecap:round; stroke-dasharray:1200; stroke-dashoffset:1200; animation:caroDraw 3.6s ease forwards infinite; }
@keyframes caroDraw{ 0%{stroke-dashoffset:1200;opacity:.2} 15%{opacity:1} 70%{stroke-dashoffset:0;opacity:1} 100%{stroke-dashoffset:0;opacity:.25} }
.caro-visual-footer{ display:flex; gap:16px; align-items:center; color:#7c7973; font-size:11px; letter-spacing:.1em; text-transform:uppercase; }
.caro-shield{ width:34px; height:40px; border:1px solid rgba(201,155,67,.65); border-radius:17px 17px 11px 11px; display:grid; place-items:center; color:var(--gold); font-size:14px; flex-shrink:0; }
.caro-login-side{ min-height:100vh; padding:40px; display:grid; place-items:center; position:relative; }
.caro-card{
  width:min(100%, 440px); padding:38px 36px 30px; border:1px solid rgba(201,155,67,.4); border-radius:22px;
  background: linear-gradient(145deg, rgba(255,255,255,.03), transparent 42%), rgba(14,14,14,.9);
  backdrop-filter:blur(16px); box-shadow:var(--shadow), inset 0 1px 0 rgba(255,255,255,.03);
  position:relative; overflow:hidden;
}
.caro-card::before{ content:""; position:absolute; width:220px; height:220px; right:-100px; top:-100px; border-radius:50%; background:radial-gradient(circle, rgba(201,155,67,.09), transparent 65%); }
.caro-card-header{ text-align:center; margin-bottom:26px; position:relative; }
.caro-mini-mark{ margin:0 auto 16px; width:48px; height:48px; border:1px solid rgba(201,155,67,.75); border-radius:50%; display:grid; place-items:center; color:var(--gold-light); font-family:Georgia, serif; font-size:18px; letter-spacing:-2px; box-shadow:inset 0 0 20px rgba(201,155,67,.08); }
.caro-card-header h2{ margin:0; font-family:Georgia, serif; font-size:28px; font-weight:500; color:var(--gold-light); }
.caro-card-header p{ margin:8px 0 0; color:var(--muted); font-size:13px; }
.caro-divider{ width:40px; height:1px; background:var(--gold); margin:18px auto 0; box-shadow:0 0 12px rgba(201,155,67,.25); }
.caro-role-switch{ display:flex; gap:6px; margin-bottom:22px; padding:4px; border:1px solid rgba(201,155,67,.25); border-radius:11px; background:#0d0d0d; }
.caro-role-switch button{ flex:1; display:flex; align-items:center; justify-content:center; gap:7px; height:38px; border:0; border-radius:8px; background:transparent; color:#9d9a94; font-size:12px; font-weight:700; letter-spacing:.03em; text-transform:uppercase; cursor:pointer; transition:.2s ease; }
.caro-role-switch button.active{ background:linear-gradient(100deg, var(--gold-deep), var(--gold-light) 50%, #b98936); color:#0b0b0b; }
.caro-field{ margin-bottom:18px; }
.caro-field label{ display:block; margin-bottom:8px; color:var(--gold-light); font-size:12px; font-weight:600; letter-spacing:.02em; }
.caro-input-wrap{ position:relative; }
.caro-input-wrap svg{ position:absolute; left:15px; top:50%; transform:translateY(-50%); width:17px; height:17px; stroke:var(--gold); opacity:.9; pointer-events:none; }
.caro-input-wrap input{ width:100%; height:52px; padding:0 44px; border:1px solid rgba(201,155,67,.3); border-radius:11px; background:#151515; color:var(--text); outline:none; font-size:14px; transition:.2s ease; box-shadow:inset 0 1px 0 rgba(255,255,255,.02); }
.caro-input-wrap input::placeholder{ color:#696762; }
.caro-input-wrap input:focus{ border-color:var(--gold); background:#171717; box-shadow:0 0 0 4px rgba(201,155,67,.08); }
.caro-toggle-pass{ position:absolute; right:13px; top:50%; transform:translateY(-50%); border:0; background:transparent; color:var(--gold); cursor:pointer; padding:4px; display:grid; place-items:center; }
.caro-toggle-pass svg{ position:static; transform:none; width:18px; height:18px; }
.caro-btn{
  width:100%; height:54px; border:1px solid rgba(255,255,255,.12); border-radius:11px;
  background:linear-gradient(100deg, var(--gold-deep), var(--gold-light) 50%, #b98936);
  color:#0b0b0b; font-weight:800; font-size:14px; letter-spacing:.02em; text-transform:uppercase; cursor:pointer;
  transition:.2s ease; box-shadow:0 14px 34px rgba(201,155,67,.16); display:flex; align-items:center; justify-content:center; gap:8px; margin-top:4px;
}
.caro-btn:hover:not(:disabled){ transform:translateY(-2px); box-shadow:0 18px 42px rgba(201,155,67,.24); filter:brightness(1.05); }
.caro-btn:disabled{ opacity:.5; cursor:not-allowed; }
.caro-status{ margin-top:12px; padding:11px 13px; border-radius:9px; font-size:12.5px; line-height:1.45; color:#ffd0d0; background:rgba(150,30,30,.16); border:1px solid rgba(255,100,100,.22); }
.caro-support{ margin-top:22px; padding-top:20px; border-top:1px solid rgba(201,155,67,.16); text-align:center; }
.caro-support button{ background:none; border:0; color:var(--muted); font-size:12px; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:.2s ease; }
.caro-support button:hover{ color:var(--gold-light); }
.caro-vfooter-text{ line-height:1.5; }
@media (max-width:1000px){
  .caro-page{ grid-template-columns:1fr; }
  .caro-visual{ min-height:auto; padding:32px 26px 22px; border-right:0; border-bottom:1px solid rgba(201,155,67,.12); }
  .caro-hero{ margin:40px 0 10px; }
  .caro-med-visual{ height:110px; }
  .caro-visual-footer{ display:none; }
  .caro-login-side{ min-height:auto; padding:32px 18px 44px; }
}
@media (max-width:560px){
  .caro-visual{ padding:24px 18px 14px; }
  .caro-brand-copy strong{ font-size:19px; }
  .caro-brand-mark{ width:48px; height:48px; }
  .caro-hero h1{ font-size:30px; }
  .caro-card{ border-radius:18px; padding:28px 20px; }
}
`;

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [mainRole, setMainRole] = useState<MainRole>("medica");
  const [devMode, setDevMode]   = useState(false);

  const [email, setEmail]       = useState("");
  const [senha, setSenha]       = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [errMedica, setErrMedica] = useState("");
  const [cpf, setCpf]           = useState("");
  const [errPac, setErrPac]     = useState("");
  const [pin, setPin]           = useState("");
  const [showPin, setShowPin]   = useState(false);
  const [errDev, setErrDev]     = useState("");
  const [loading, setLoading]   = useState(false);

  const clearFields = () => { setEmail(""); setSenha(""); setCpf(""); setPin(""); setErrMedica(""); setErrPac(""); setErrDev(""); setShowSenha(false); setShowPin(false); };
  const selectMainRole = (r: MainRole) => { if (r === mainRole) return; clearFields(); setMainRole(r); };
  const openDev  = () => { clearFields(); setDevMode(true); };
  const closeDev = () => { clearFields(); setDevMode(false); };

  const handleMedica = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrMedica("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await r.json();
      if (!r.ok) {
        setErrMedica(data.error || "E-mail ou senha incorretos.");
        setLoading(false);
        return;
      }
      onLogin("medica", data.nome, data.token);
    } catch {
      setErrMedica("Não foi possível conectar ao servidor. Tente novamente.");
    }
    setLoading(false);
  };

  // Antes, o CPF era comparado no navegador contra a lista COMPLETA de
  // pacientes (baixada previamente, sem login nenhum) — qualquer visitante do
  // site conseguia ver os dados de todo mundo pelo DevTools, só pra permitir
  // essa checagem local. Agora a checagem é feita no servidor
  // (/api/auth/paciente-login), que devolve só o id e nome de quem digitou o
  // CPF certo — nada mais sai do banco.
  const handlePaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrPac("");
    const cpfLimpo = cpf.replace(/\D/g, "");
    try {
      const r = await fetch("/api/auth/paciente-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: cpfLimpo }),
      });
      const data = await r.json();
      if (!r.ok) {
        setErrPac(data.error || "CPF não encontrado. Verifique com a clínica.");
        setLoading(false);
        return;
      }
      onLogin("paciente", data.id, data.token);
    } catch {
      setErrPac("Não foi possível conectar ao servidor. Tente novamente.");
    }
    setLoading(false);
  };

  // Antes o PIN de desenvolvedor era comparado no navegador contra uma variável
  // VITE_DEV_PIN — o Vite empacota qualquer env var com esse prefixo dentro do
  // JS que vai pro navegador, então bastava abrir o DevTools > Sources e ler o
  // PIN direto do bundle. Agora a checagem é feita no servidor
  // (/api/auth/dev-login), que nunca expõe o PIN, só devolve um token de sessão
  // se ele estiver correto.
  const handleDev = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrDev("");
    try {
      const r = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await r.json();
      if (!r.ok) {
        setErrDev(data.error || "PIN incorreto.");
        setPin("");
        setLoading(false);
        return;
      }
      onLogin("dev", data.nome, data.token);
    } catch {
      setErrDev("Não foi possível conectar ao servidor. Tente novamente.");
    }
    setLoading(false);
  };

  const formatCpf = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
    return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
  };

  const spinner = (light?: boolean) => (
    <span style={{
      width: 15, height: 15, borderRadius: "50%",
      border: `2px solid ${light ? "#0b0b0b" : "#fff"}`,
      borderTopColor: "transparent",
      display: "inline-block",
      animation: "spin 0.7s linear infinite",
    }} />
  );

  return (
    <div className="caro-login">
      <style>{CSS + `@keyframes spin{ to{ transform:rotate(360deg); } }`}</style>
      <main className="caro-page">
        {/* ── Painel de marca ──────────────────────────────────────── */}
        <section className="caro-visual">
          <div>
            <div className="caro-brand">
              <div className="caro-brand-mark" aria-hidden="true">CR</div>
              <div className="caro-brand-copy">
                <strong>CA.RO CLINIC</strong>
                <span>Precision Hair Medicine</span>
              </div>
            </div>

            <div className="caro-hero">
              <div className="caro-eyebrow">Sistema clínico inteligente</div>
              <h1>Cuidado capilar guiado por <span>ciência e precisão.</span></h1>
              <p>Painel clínico da Dra. Mariah Zibetti — diagnóstico, protocolos e acompanhamento de pacientes em um só lugar.</p>
            </div>

            <div className="caro-med-visual" aria-hidden="true">
              <div className="caro-nodes" />
              <div className="caro-pulse">
                <svg viewBox="0 0 1000 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="caroGoldStroke" x1="0" x2="1">
                      <stop offset="0%" stopColor="#715020" />
                      <stop offset="50%" stopColor="#f0d38d" />
                      <stop offset="100%" stopColor="#9e722d" />
                    </linearGradient>
                  </defs>
                  <path d="M0,65 L120,65 L175,65 L198,62 L215,65 L245,65 L270,20 L295,100 L320,52 L345,65 L520,65 L575,65 L600,58 L620,65 L690,65 L720,18 L748,105 L775,48 L805,65 L1000,65" />
                </svg>
              </div>
            </div>
          </div>

          <div className="caro-visual-footer">
            <div className="caro-shield">+</div>
            <div className="caro-vfooter-text">Ambiente protegido<br />Segurança, precisão e confidencialidade</div>
          </div>
        </section>

        {/* ── Painel de acesso ─────────────────────────────────────── */}
        <section className="caro-login-side">
          <div className="caro-card">
            <header className="caro-card-header">
              <div className="caro-mini-mark" aria-hidden="true">CR</div>
              <h2>{devMode ? "Acesso Técnico" : "Entrar"}</h2>
              <p>
                {devMode ? "Ambiente restrito de administração."
                  : mainRole === "medica" ? "Acesse sua plataforma médica" : "Acompanhe seu tratamento"}
              </p>
              <div className="caro-divider" />
            </header>

            {!devMode ? (
              <>
                <div className="caro-role-switch">
                  <button type="button" className={mainRole === "medica" ? "active" : ""} onClick={() => selectMainRole("medica")}>
                    <Stethoscope size={14} />Médica
                  </button>
                  <button type="button" className={mainRole === "paciente" ? "active" : ""} onClick={() => selectMainRole("paciente")}>
                    <User size={14} />Paciente
                  </button>
                </div>

                {mainRole === "medica" ? (
                  <form onSubmit={handleMedica} noValidate>
                    <div className="caro-field">
                      <label htmlFor="email">E-mail</label>
                      <div className="caro-input-wrap">
                        <Mail />
                        <input id="email" type="email" value={email} onChange={e => { setEmail(e.target.value); setErrMedica(""); }}
                          autoFocus placeholder="seu@email.com" autoComplete="email" />
                      </div>
                    </div>
                    <div className="caro-field">
                      <label htmlFor="senha">Senha</label>
                      <div className="caro-input-wrap">
                        <Lock />
                        <input id="senha" type={showSenha ? "text" : "password"} value={senha} onChange={e => { setSenha(e.target.value); setErrMedica(""); }}
                          placeholder="••••••••" autoComplete="current-password" style={{ paddingRight: 44 }} />
                        <button type="button" className="caro-toggle-pass" onClick={() => setShowSenha(s => !s)} aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}>
                          {showSenha ? <EyeOff /> : <Eye />}
                        </button>
                      </div>
                    </div>
                    {errMedica && <div className="caro-status">{errMedica}</div>}
                    <button className="caro-btn" type="submit" disabled={loading}>
                      {loading ? spinner(true) : <><Lock size={15} />Acessar sistema</>}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handlePaciente} noValidate>
                    <div className="caro-field">
                      <label htmlFor="cpf">CPF</label>
                      <div className="caro-input-wrap">
                        <CreditCard />
                        <input id="cpf" type="text" value={cpf} onChange={e => { setCpf(formatCpf(e.target.value)); setErrPac(""); }}
                          autoFocus placeholder="000.000.000-00" />
                      </div>
                    </div>
                    {errPac && <div className="caro-status">{errPac}</div>}
                    <button className="caro-btn" type="submit" disabled={loading || cpf.replace(/\D/g, "").length < 11}>
                      {loading ? spinner(true) : <><User size={15} />Acessar portal</>}
                    </button>
                  </form>
                )}

                <div className="caro-support">
                  <button type="button" onClick={openDev}><Terminal size={12} />Acesso técnico</button>
                </div>
              </>
            ) : (
              <>
                <form onSubmit={handleDev} noValidate>
                  <div className="caro-field">
                    <label htmlFor="pin">PIN de Desenvolvedor</label>
                    <div className="caro-input-wrap">
                      <Lock />
                      <input id="pin" type={showPin ? "text" : "password"} value={pin} onChange={e => { setPin(e.target.value); setErrDev(""); }}
                        autoFocus placeholder="••••••••" style={{ paddingRight: 44 }} />
                      <button type="button" className="caro-toggle-pass" onClick={() => setShowPin(s => !s)} aria-label={showPin ? "Ocultar PIN" : "Mostrar PIN"}>
                        {showPin ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>
                  {errDev && <div className="caro-status">{errDev}</div>}
                  <button className="caro-btn" type="submit" disabled={loading || !pin}>
                    {loading ? spinner(true) : <><Terminal size={15} />Acessar sistema</>}
                  </button>
                </form>
                <div className="caro-support">
                  <button type="button" onClick={closeDev}><ArrowLeft size={12} />Voltar</button>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
