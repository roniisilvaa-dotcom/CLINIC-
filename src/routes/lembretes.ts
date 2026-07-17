/**
 * API Route: Lembretes automáticos de consulta via WhatsApp
 * POST /api/whatsapp/lembretes-cron — dispara lembretes para consultas confirmadas
 *
 * Etapas de lembrete (regra oficial da clínica, repassada pelo Igor Carvalho):
 * 5 dias antes, 2 dias antes, 1 dia antes e 3 horas antes do horário agendado.
 * Disparado periodicamente por um workflow do GitHub Actions (ver
 * .github/workflows/lembretes-cron.yml), do mesmo jeito que o remarketing-cron.
 */
import express from "express";
import { db } from "../db/index.js";
import { agendaEventos, pacientes } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { enviarMensagem } from "../services/evolutionWhatsappService.js";

const router = express.Router();
const CRON_TOKEN = process.env.LEMBRETES_CRON_TOKEN || "";

interface Etapa {
  chave: string;
  ms: number;
  texto: (data: string, horario: string) => string;
}

// Ordenadas da mais próxima pra mais distante: checar nessa ordem garante que,
// se o cron ficar um tempo parado (ex: ação do GitHub falhar) e "pular" janelas,
// sempre mandamos o lembrete mais correto pro tempo que realmente resta — nunca
// um "faltam 5 dias" quando na verdade já faltam só 2 horas.
const ETAPAS: Etapa[] = [
  {
    chave: "3h",
    ms: 3 * 60 * 60 * 1000,
    texto: (_data, horario) => `Lembrete: sua consulta com a Dra. Mariah é hoje, às ${horario}, em Toledo. Te esperamos!`,
  },
  {
    chave: "1d",
    ms: 24 * 60 * 60 * 1000,
    texto: (data, horario) => `Lembrete: sua consulta com a Dra. Mariah é amanhã, dia ${data}, às ${horario}, em Toledo. Qualquer imprevisto, nos avise por aqui.`,
  },
  {
    chave: "2d",
    ms: 2 * 24 * 60 * 60 * 1000,
    texto: (data, horario) => `Lembrete: sua consulta com a Dra. Mariah está marcada para o dia ${data}, às ${horario}, em Toledo. Até lá!`,
  },
  {
    chave: "5d",
    ms: 5 * 24 * 60 * 60 * 1000,
    texto: (data, horario) => `Lembrete: sua consulta com a Dra. Mariah está marcada para o dia ${data}, às ${horario}, em Toledo. Qualquer dúvida, estou à disposição!`,
  },
];

// Horário "de agora" ajustado pro fuso de Brasília (UTC-3), igual ao resto do
// sistema (ver whatsappCore.ts) — o servidor roda em UTC.
function agoraBrasil(): Date {
  return new Date(Date.now() - 3 * 60 * 60 * 1000);
}

router.post("/lembretes-cron", async (req, res) => {
  if (CRON_TOKEN && req.headers.authorization !== `Bearer ${CRON_TOKEN}`) {
    return res.sendStatus(401);
  }
  try {
    const eventos = await db.select().from(agendaEventos).where(eq(agendaEventos.status, "Confirmada"));
    const agora = agoraBrasil().getTime();
    let enviados = 0;

    for (const evento of eventos) {
      if (!evento.data || !evento.horario) continue;

      const dataHoraConsulta = new Date(`${evento.data}T${evento.horario}:00`).getTime();
      const restante = dataHoraConsulta - agora;
      if (restante <= 0) continue; // já passou ou está acontecendo agora

      const jaEnviados: string[] = Array.isArray((evento as any).lembretesEnviados) ? (evento as any).lembretesEnviados : [];

      for (const etapa of ETAPAS) {
        if (jaEnviados.includes(etapa.chave)) continue;
        if (restante > etapa.ms) continue;

        const pac = await db.select({ telefone: pacientes.telefone }).from(pacientes)
          .where(eq(pacientes.id, evento.pacienteId)).limit(1);
        const telefone = pac[0]?.telefone;
        if (!telefone) break;

        const texto = etapa.texto(evento.data, evento.horario);
        const ok = await enviarMensagem(telefone, texto);
        if (ok) {
          // Marca essa etapa e todas as mais distantes como enviadas — se o
          // cron ficou parado e já estamos bem perto da consulta, não faz
          // sentido mandar depois um lembrete atrasado de "faltam 5 dias".
          const indiceEtapa = ETAPAS.indexOf(etapa);
          const etapasCobertas = ETAPAS.slice(indiceEtapa).map(e => e.chave);
          const novoLembretes = Array.from(new Set([...jaEnviados, ...etapasCobertas]));
          await db.update(agendaEventos).set({ lembretesEnviados: novoLembretes } as any).where(eq(agendaEventos.id, evento.id));
          enviados++;
        }
        break; // só um lembrete por evento por execução do cron
      }
    }

    res.json({ ok: true, enviados });
  } catch (err) {
    console.error("Erro lembretes-cron:", err);
    res.status(500).json({ ok: false });
  }
});

export default router;
