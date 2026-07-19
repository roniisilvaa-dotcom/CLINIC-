import express from "express";
import { db } from "../db/index.js";
import { conversasWhatsapp, agendaEventos } from "../db/schema.js";
import { REMARKETING_MENSAGENS } from "../services/iaSecretaria.js";
import { enviarMensagem } from "../services/evolutionWhatsappService.js";
import { listarTelefonesSilenciados } from "../services/whatsappCore.js";

const router = express.Router();
const CRON_TOKEN = process.env.REMARKETING_CRON_TOKEN || "";

const LIMITES_MS = [
    4 * 60 * 60 * 1000,
    24 * 60 * 60 * 1000,
    48 * 60 * 60 * 1000,
    7 * 24 * 60 * 60 * 1000,
  ];

const MARCA_TRANSFERENCIA = "Vou encaminhar seu atendimento para a Dra. Mariah.";

router.post("/remarketing-cron", async (req, res) => {
    if (CRON_TOKEN && req.headers.authorization !== `Bearer ${CRON_TOKEN}`) {
          return res.sendStatus(401);
    }
    try {
          const todas = await db.select().from(conversasWhatsapp);
          const porTelefone = new Map<string, typeof todas>();
          for (const m of todas) {
                  if (!porTelefone.has(m.telefone)) porTelefone.set(m.telefone, []);
                  porTelefone.get(m.telefone)!.push(m);
          }

      const agendamentos = await db.select().from(agendaEventos);
          const telefonesConvertidos = new Set(
                  agendamentos.map(a => (a.pacienteId || "").replace(/^wpp_/, "")).filter(Boolean)
                );

      // Números com a IA pausada (manualmente pela Dra./equipe) nunca devem
      // receber remarketing automático — antes disso o cron ignorava a pausa
      // e continuava mandando mensagem de nudge mesmo com o contato silenciado
      // no painel de Conversas.
      const telefonesSilenciados = await listarTelefonesSilenciados();

      let enviados = 0;
          const agora = Date.now();

      for (const [telefone, mensagens] of porTelefone) {
              if (telefonesConvertidos.has(telefone)) continue;
              if (telefonesSilenciados.has(telefone)) continue;

            mensagens.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
              const ultima = mensagens[mensagens.length - 1];
              if (!ultima || ultima.role !== "ia") continue;
              if (ultima.conteudo && ultima.conteudo.startsWith(MARCA_TRANSFERENCIA)) continue;

            let streak = 0;
              for (let i = mensagens.length - 1; i >= 0; i--) {
                        if (mensagens[i].role === "ia") streak++;
                        else break;
              }

            const nudgesEnviados = Math.max(streak - 1, 0);
              if (nudgesEnviados >= LIMITES_MS.length) continue;

            const decorrido = agora - new Date(ultima.timestamp).getTime();
              if (decorrido < LIMITES_MS[nudgesEnviados]) continue;

            const texto = REMARKETING_MENSAGENS[nudgesEnviados];
              const ok = await enviarMensagem(telefone, texto);
              if (ok) {
                        await db.insert(conversasWhatsapp).values({
                                    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                                    telefone,
                                    role: "ia",
                                    conteudo: texto,
                                    timestamp: new Date().toISOString(),
                        });
                        enviados++;
              }
      }

      res.json({ ok: true, enviados });
    } catch (err) {
          console.error("Erro remarketing-cron:", err);
          res.status(500).json({ ok: false });
    }
});

export default router;
