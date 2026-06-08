import { Paciente, PrescricaoTemplate, AlertaClinico, EventoAgenda } from "./types";

export const MOCK_PACIENTES: Paciente[] = [
  {
    id: "paciente-1",
    nome: "Helena Silveira de Souza",
    idade: 34,
    dataNascimento: "1992-04-12",
    cpf: "123.456.789-00",
    telefone: "(45) 99882-1244",
    email: "helena.souza@gmail.com",
    cidade: "Toledo",
    comoConheceu: "Instagram (@dra.mariahzibetti)",
    queixaPrincipal: "Queda de cabelo acentuada há mais de 1 ano, com afinamento perceptível no topo da cabeça. Sente que o couro cabeludo está mais visível sob luz forte.",
    status: "Em Tratamento",
    progresso: 75,
    ultimaAtualizacao: "2026-05-20",
    antecedentes: {
      usoMedicamentos: "Anticoncepcional oral (Yasmin) há 4 anos. Nega outros de uso contínuo.",
      historicoFamiliar: "Mãe com afinamento capilar pós-menopausa. Avô materno com calvície moderada.",
      gestacaoAmamentacao: "Não há gestações recentes.",
      menopausa: "Nega.",
      outros: "Ansiedade crônica sob controle medicamentoso temporário. Estresse corporativo elevado nos últimos 6 meses."
    },
    diagnostico: {
      principal: "Alopecia Androgenética Feminina (FPHL)",
      secundario: ["Eflúvio Telógeno Crônico associado"],
      escalaLudwig: "Grau II",
      condicoesAssociadas: ["Couro cabeludo levemente oleoso", "Pequeno eritema perifolicular"],
      fatoresContribuintes: ["Estresse psicogênico", "Desequilíbrio de ferro"],
      observacoes: "Paciente apresenta miniaturização folicular superior a 20% na área frontoparietal comparada à occipital. Presença de 'hair diameter diversity'."
    },
    exames: [
      {
        id: "ex-1",
        data: "2026-04-10",
        tsh: "2.4",
        t4Livre: "1.2",
        ferritina: "18.5", // Baixa!
        hemoglobina: "12.2",
        testosteronaTotal: "24.0",
        testosteronaLivre: "1.8",
        dheas: "120.0",
        zinco: "72.0",
        vitD: "19.0", // Baixa!
        vitB12: "210.0", // Limítrofe!
        analiseIA: "Laudo Clínico Automatizado:\n1. Baixa reserva de Ferro (Ferritina 18.5 ng/mL - ideal acima de 70 para crescimento capilar).\n2. Insuficiência de Vitamina D (19 ng/mL), o que prejudica a proliferação folicular.\n3. Vitamina B12 limítrofe (210 pg/mL).\nRecomendação: Suplementação agressiva de ferro elementar, colecalciferol e metilcobalamina para otimização do ciclo folicular e contenção do eflúvio associado.",
        statusMap: {
          tsh: "normal",
          t4Livre: "normal",
          ferritina: "alterado",
          hemoglobina: "normal",
          testosteronaTotal: "normal",
          testosteronaLivre: "normal",
          dheas: "normal",
          zinco: "limitrofe",
          vitD: "alterado",
          vitB12: "limitrofe"
        }
      }
    ],
    protocolo: {
      medicamentos: "Minoxidil oral 0.5mg à noite.\nEspironolactona 50mg pela manhã.",
      procedimentos: "Sessões quinzenais de MMP Capilar (Microinfusão de Medicamentos na Pele) contendo Minoxidil + Biotina + Fatores de Crescimento.\nLaser de Baixa Potência (LLLT) 2x por semana (em casa).",
      cosmeticos: "Xampu de Limpeza Suave sem sulfatos.\nLoção capilar com Capixyl + Auxina Tricógena de uso diário à noite.",
      suplementacao: "Ferro Quelato 60mg + Vitamina C 100mg pós-almoço.\nVitamina D 50.000 UI semanal por 8 semanas, depois 2.000 UI/dia.\nFórmula Tricológica: Metilfolato 1mg + Metilcobalamina 1mg + Biotina 5mg + L-Cistina 100mg.",
      estiloVida: "Treino aeróbico complementar para melhora da circulação; técnicas de gerenciamento de estresse (meditação diária), melhora da higiene do sono.",
      duracaoPrevista: "12 meses",
      dataInicio: "2025-10-15"
    },
    galeria: [
      {
        id: "foto-1a",
        data: "2025-10-15",
        posicao: "Topo/Vértex",
        url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600",
        notaIa: "Densidade reduzida com alargamento da risca central compatível com Ludwig II."
      },
      {
        id: "foto-1b",
        data: "2026-05-20",
        posicao: "Topo/Vértex",
        url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=600",
        notaIa: "Evolução visível com preenchimento de fios e redução do diâmetro da risca capilar central. Rebrota de fios novos evidente."
      }
    ],
    consultas: [
      {
        id: "consult-1a",
        data: "2025-10-15",
        tipo: "Presencial - Toledo",
        queixa: "Primeira consulta. Queixa de forte queda. Cerca de 150 fios por lavagem.",
        evolucao: "Análise física: couro cabeludo visível em padrão de teto de catedral. Pull test positivo.",
        alteracoesProtocolo: "Iniciado protocolo de indução de crescimento capilar com Minoxidil oral e suplementação básica.",
        examesSolicitados: "TSH, Ferritina, Vitaminas, Perfil hormonal capilar.",
        resumoIa: "Consulta inicial diagnosticando Alopecia Androgenética de padrão feminino Ludwig II. Pull test positivo confirmando eflúvio ativo intercorrente."
      },
      {
        id: "consult-1b",
        data: "2026-02-15",
        tipo: "Presencial - Toledo",
        queixa: "Retorno de 4 meses. Relata que a queda estabilizou de maneira significativa.",
        evolucao: "Pull test negativo. Visualização de múltiplos fios curtos em rebrota no topo.",
        alteracoesProtocolo: "Aumentada dose de Espironolactona de 25mg para 50mg devido a pequenos picos androgênicos leves.",
        examesSolicitados: "Dosagem de potássio sérico (controle da Espironolactona).",
        resumoIa: "Excelente resposta em 120 dias de tratamento. Miniaturização sob controle. Paciente muito motivada e aderente ao tratamento."
      }
    ]
  },
  {
    id: "paciente-2",
    nome: "Gabriela Portela Cavalcanti",
    idade: 29,
    dataNascimento: "1997-01-08",
    cpf: "987.654.321-11",
    telefone: "(45) 99123-5599",
    email: "gabi.portela@outlook.com",
    cidade: "Fátima do Sul",
    comoConheceu: "Indicação de Dermatologista Geral",
    queixaPrincipal: "Perda massiva de cabelo em tufos por toda a cabeça durante o banho e escovação. Queda iniciou abruptamente há 3 meses.",
    status: "Em Tratamento",
    progresso: 40,
    ultimaAtualizacao: "2026-06-01",
    antecedentes: {
      usoMedicamentos: "Nega uso de anticoncepcionais. Nega outros medicamentos contínuos.",
      historicoFamiliar: "Pai com calvície de padrão Hamilton IV. Mãe sem alterações capilares.",
      gestacaoAmamentacao: "Parto vaginal realizado há 6 meses. Amamentação exclusiva até 2 semanas atrás.",
      menopausa: "Nega.",
      outros: "Teve infecção por Dengue moderada há 5 meses (com febre persistente)."
    },
    diagnostico: {
      principal: "Eflúvio Telógeno Agudo Pós-Parto (e Pós-Infeccioso)",
      secundario: ["Hipoferritinemia latente"],
      escalaLudwig: "Sem classificação (difusa)",
      condicoesAssociadas: ["Couro cabeludo assintomático, sem descamação"],
      fatoresContribuintes: ["Flutuação hormonal abrupta do pós-parto", "Privação de ferro crônica devido à amamentação/parto"],
      observacoes: "Pull test extremamente positivo (>20 fios por tração leve). Fios desprendidos apresentam bulbo queratinizado despigmentado (telógenos típicos)."
    },
    exames: [
      {
        id: "ex-2",
        data: "2026-05-15",
        tsh: "1.8",
        t4Livre: "1.1",
        ferritina: "11.2", // Crítica!
        hemoglobina: "11.5",
        testosteronaTotal: "15.0",
        testosteronaLivre: "1.1",
        dheas: "90.0",
        zinco: "61.0",
        vitD: "28.0",
        vitB12: "340.0",
        analiseIA: "Diagnóstico Capilar via IA:\nAs queixas e exames são totalmente condizentes com Eflúvio Telógeno Pós-Parto exacerbado por hipoferritinemia severa (11.2 ng/mL). A Ferritina materna recomendada para restauração da dinâmica de anagênese capilar é > 70 ng/mL.\nConduta sugerida: Reposição intravenosa de ferro (Noripurum) ou suplementação via ultra-concentrada oral, combinada com fatores tróficos foliculares.",
        statusMap: {
          tsh: "normal",
          t4Livre: "normal",
          ferritina: "alterado",
          hemoglobina: "limitrofe",
          testosteronaTotal: "normal",
          testosteronaLivre: "normal",
          dheas: "normal",
          zinco: "normal",
          vitD: "normal",
          vitB12: "normal"
        }
      }
    ],
    protocolo: {
      medicamentos: "Minoxidil oral 0.25mg à noite como tônico folicular ansiolítico folicular (evitar sheding agressivo).\nEvitado finasterida ou espironolactona devido ao período de amamentação recente.",
      procedimentos: "Lasercap profissional em consultório semanalmente.\nInfiltração intradérmica de vitaminas capilares (mesococktail nutritivo).",
      cosmeticos: "Xampu reconstrutor com queratina lipossomada e arginina.",
      suplementacao: "Ferro Sucrossômico 100mg/dia.\nNutracêutico pós-parto sem interferência na lactação (rico em sílicio orgânico, biotina e zinco).",
      estiloVida: "Melhora da rotina alimentar com proteínas magras de alta biodisponibilidade. Exercícios leves para circulação.",
      duracaoPrevista: "6 meses",
      dataInicio: "2026-05-18"
    },
    galeria: [
      {
        id: "foto-2a",
        data: "2026-05-18",
        posicao: "Lateral Direita",
        url: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=600",
        notaIa: "Rarefação difusa, mais pronunciada na área bitemporal (típica do pós-parto)."
      }
    ],
    consultas: [
      {
        id: "consult-2a",
        data: "2026-05-18",
        tipo: "Presencial - Fátima do Sul",
        queixa: "Início há 3 meses. Desespero total ao lavar o cabelo.",
        evolucao: "Visualização de cabelos soltos facilmente. Couro limpo mas com diminuição global de volume.",
        alteracoesProtocolo: "Iniciado protocolo não-hormonal de recuperação precoce.",
        examesSolicitados: "Ferritina sérica imediata, Hemograma.",
        resumoIa: "Diagnóstico estabelecido de Eflúvio Telógeno Agudo gravíssimo pós-parto potenciado por Ferritina crítica de 11."
      }
    ]
  },
  {
    id: "paciente-3",
    nome: "Roberto Carlos Alencar",
    idade: 42,
    dataNascimento: "1984-09-30",
    cpf: "111.222.333-44",
    telefone: "(45) 99911-0022",
    email: "roberto.alencar@agricola.com.br",
    cidade: "Toledo",
    comoConheceu: "Indicação de paciente",
    queixaPrincipal: "Entradas severas na fronte e coroinha capilar desguarnecida. Deseja deter o avanço e evitar o transplante capilar.",
    status: "Em Tratamento",
    progresso: 85,
    ultimaAtualizacao: "2026-04-12",
    antecedentes: {
      usoMedicamentos: "Nega de uso contínuo.",
      historicoFamiliar: "Pai e tio materno com calvície avançada Grau VII.",
      gestacaoAmamentacao: "Não se aplica.",
      menopausa: "Não se aplica.",
      outros: "Hipertensão controlada com Losartana 50mg/dia."
    },
    diagnostico: {
      principal: "Alopecia Androgenética Masculina (AGA)",
      secundario: [],
      escalaHamiltonNorwood: "Grau IV-V",
      condicoesAssociadas: ["Dermatite seborreica leve", "Couro cabeludo muito espesso e fibrótico"],
      fatoresContribuintes: ["Sensibilidade genética severa a DHT (5-alfa-redutase)"],
      observacoes: "Miniaturização acentuada no topo capilar (vértex). Entradas bilaterais profundas com preservação temporária da faixa temporoccipital."
    },
    exames: [
      {
        id: "ex-3",
        data: "2025-08-01",
        tsh: "1.9",
        t4Livre: "1.3",
        ferritina: "145.0",
        hemoglobina: "15.8",
        testosteronaTotal: "580.0",
        testosteronaLivre: "12.4",
        dheas: "210.0",
        zinco: "89.0",
        vitD: "35.0",
        vitB12: "410.0",
        analiseIA: "Exames androgênicos masculinos dentro dos parâmetros saudáveis de referência. A calvície tem caráter estritamente periférico e local (ipersensibilidade dos minireceptores perifoliculares ao DHT). Indicado bloqueio androgênico local e sistêmico via Finasterida.",
        statusMap: {
          tsh: "normal",
          t4Livre: "normal",
          ferritina: "normal",
          hemoglobina: "normal",
          testosteronaTotal: "normal",
          testosteronaLivre: "normal",
          dheas: "normal",
          zinco: "normal",
          vitD: "normal",
          vitB12: "normal"
        }
      }
    ],
    protocolo: {
      medicamentos: "Dutasterida 0.5mg à noite oral.\nMinoxidil oral 2.5mg pela manhã.",
      procedimentos: "Microagulhamento Capilar Robótico (IPCA) com Drug Delivery de fatores de crescimento + dutasterida líquida (sessões mensais).",
      cosmeticos: "Xampu de cetoconazol 2% de duas a três vezes por semana para controle de oleosidade e coceira.",
      suplementacao: "Zinco quelato 30mg + Cobre quelato 2mg + Saw Palmetto extract 320mg à noite.",
      estiloVida: "Diminuir uso de boné diário e evitar dormir com cabelos úmidos.",
      duracaoPrevista: "Contínuo",
      dataInicio: "2025-08-15"
    },
    galeria: [
      {
        id: "foto-3a",
        data: "2025-08-15",
        posicao: "Topo/Vértex",
        url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600",
        notaIa: "Coroa totalmente visível. Ausência quase completa de fios terminais no centro."
      },
      {
        id: "foto-3b",
        data: "2026-04-12",
        posicao: "Topo/Vértex",
        url: "https://images.unsplash.com/photo-1620331713240-1015d2449833?auto=format&fit=crop&q=80&w=600",
        notaIa: "Repovoamento maciço de fios anágenos na coroa. Área de cobertura duplicou nos últimos 8 meses."
      }
    ],
    consultas: [
      {
        id: "consult-3a",
        data: "2025-08-15",
        tipo: "Presencial - Toledo",
        queixa: "Percebendo perda severa de cabelos no ralo do chuveiro. Medo de ficar totalmente calvo como o pai.",
        evolucao: "Primeira consulta de planejamento. Realizados registros fotográficos e dermatoscopia computorizada.",
        alteracoesProtocolo: "Planejado protocolo agressivo inicial de choque, bem aceito pelo paciente.",
        examesSolicitados: "Bioquímica geral capilar.",
        resumoIa: "Consulta de diagnóstico de AGA grau IV masculino. Excelente indicação de IPCA capilar mais tratamento androgênico sistêmico."
      },
      {
        id: "consult-3b",
        data: "2026-01-10",
        tipo: "Presencial - Toledo",
        queixa: "Consulta de acompanhamento sem queixas de efeitos colaterais.",
        evolucao: "Grande contentamento. Testura capilar muito mais grossa e rígida.",
        alteracoesProtocolo: "Subsituição da Finasterida para Dutasterida devido à altíssima eficácia sobre as isoenzimas tipo I e II.",
        examesSolicitados: "Nenhum no momento.",
        resumoIa: "Reavaliação sem efeitos colaterais sexuais ou sistêmicos. Redensificação capilar fantástica em andamento."
      }
    ]
  },
  {
    id: "paciente-4",
    nome: "Isadora Mendes Fagundes",
    idade: 23,
    dataNascimento: "2003-11-20",
    cpf: "222.333.444-55",
    telefone: "(45) 99811-1255",
    email: "isadora.mfagundes@gmail.com",
    cidade: "Toledo",
    comoConheceu: "Google Maps / Busca Local",
    queixaPrincipal: "Descamação oleosa abundante (caspa), coceira insuportável que machuca e queda capilar localizada na área de coceira.",
    status: "Em Tratamento",
    progresso: 90,
    ultimaAtualizacao: "2026-06-05",
    antecedentes: {
      usoMedicamentos: "Loratadina ocasional para processos alérgicos.",
      historicoFamiliar: "Mãe com dermatite atópica moderada.",
      gestacaoAmamentacao: "Nega.",
      menopausa: "Nega.",
      outros: "Alimentação rica em laticínios e carboidratos refinados. Hábitos de dormir sempre de cabelo molhado."
    },
    diagnostico: {
      principal: "Dermatite Seborreica Grave Capilar",
      secundario: ["Eflúvio Seborreico reativo"],
      escalaLudwig: "Grau I",
      condicoesAssociadas: ["Eritema intenso", "Placas amareladas aderidas ao couro", "Prurido moderado a grave"],
      fatoresContribuintes: ["Proliferação fúngica (Malassezia)", "Estresse e dieta inflamatória"],
      observacoes: "Ao exame tricológico, observa-se inflamação perifolicular intensa e obstrução severa dos óstios foliculares por sebo espesso."
    },
    exames: [],
    protocolo: {
      medicamentos: "Poliânion tópico anti-inflamatório após crises.\nSe necessário, corticoide tópico de baixa potência descrescente (3 dias).",
      procedimentos: "Fototerapia LED azul (propriedade bactericida e seborreguladora) e Vermelho em clínica.\nPeeling capilar ácido em consultório (ácido salicílico 2%).",
      cosmeticos: "Xampu medicamentoso com Cetoconazol 2% + Ácido Salicílico alternado com Xampu de extratos calmantes de camomila e calêndula.",
      suplementacao: "Zinco Cisteína + Vitamina B6 para controle sebáceo.\nProbióticos para melhora da barreira intestinal e contenção fúngica.",
      estiloVida: "Proibir de dormir de cabelo molhado. Reduzir laticínios, doces e farinhas brancas. Usar secador na temperatura morna e distante do couro.",
      duracaoPrevista: "3 meses",
      dataInicio: "2026-05-01"
    },
    galeria: [
      {
        id: "foto-4a",
        data: "2026-05-01",
        posicao: "Dermoscopia",
        url: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=600",
        notaIa: "Óstios foliculares obstruídos por rolhas córneas seborreicas. Vasos em grampo evidentes na periferia inflamatória."
      },
      {
        id: "foto-4b",
        data: "2026-06-05",
        posicao: "Dermoscopia",
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
        notaIa: "Óstios limpos e desobstruídos. Ausência total de eritema ativo. Fios nascendo livres."
      }
    ],
    consultas: [
      {
        id: "consult-4a",
        data: "2026-05-01",
        tipo: "Presencial - Toledo",
        queixa: "Coceira contínua com feridas na nuca e descamação que cai nas blusas de cor escura.",
        evolucao: "Verificadas placas aderidas e inflamação difusa. Prescrito tratamento inicial de ataque dermatológico.",
        alteracoesProtocolo: "Criado o cronograma capilar antisséptico de uso domiciliar precoce.",
        examesSolicitados: "Nenhum.",
        resumoIa: "Dermatite seborreica grave com eflúvio inflamatório reativo. Ótimo prognóstico com reeducação comportamental."
      }
    ]
  },
  {
    id: "paciente-5",
    nome: "Juliana Kester Becker",
    idade: 48,
    dataNascimento: "1978-02-15",
    cpf: "444.555.666-88",
    telefone: "(45) 99912-3004",
    email: "julianakester@hotmail.com",
    cidade: "Toledo",
    comoConheceu: "Indicação médica",
    queixaPrincipal: "Fios sumindo no início do couro capilar (linha frontal), com pele lisa no lugar do cabelo. Sensação de queimação leve local.",
    status: "Em Tratamento",
    progresso: 60,
    ultimaAtualizacao: "2026-05-10",
    antecedentes: {
      usoMedicamentos: "Nega de uso contínuo.",
      historicoFamiliar: "Mãe com hipotireoidismo severo.",
      gestacaoAmamentacao: "Não há.",
      menopausa: "Climatério em andamento (irregularidade menstrual, fogachos moderados).",
      outros: "Hipotireoidismo de Hashimoto sob tratamento regular com Levotiroxina 50mcg."
    },
    diagnostico: {
      principal: "Alopecia Frontal Fibrosante (AFF)",
      secundario: ["Líquen Plano Pilar parcial", "Hipotireoidismo de Hashimoto"],
      escalaLudwig: "Padrão de AFF Grau I",
      condicoesAssociadas: ["Eritema perifolicular leve", "Descamação em colar capilar", "Perda de sobrancelhas externa"],
      fatoresContribuintes: ["Fator autoimune sistêmico", "Climatério hormonal"],
      observacoes: "Paciente apresenta clássica de recessão da linha anterior de implantação capilar (aspecto em cicatriz cerosa e pálida). Presença de queratose perifolicular acentuada."
    },
    exames: [
      {
        id: "ex-5",
        data: "2026-03-20",
        tsh: "4.8", // Leve alterado Hashimoto
        t4Livre: "0.95",
        ferritina: "82.0",
        hemoglobina: "12.8",
        testosteronaTotal: "20.0",
        testosteronaLivre: "1.2",
        dheas: "110.0",
        zinco: "80.0",
        vitD: "32.0",
        vitB12: "310.0",
        analiseIA: "Relatório Imunológico de Apoio:\n1. TSH levemente elevado (4.8 mIU/L), confirmando necessidade de calibração hormonal da Levotiroxina junto ao endocrinologista.\n2. Presença de AFF com traço autoimune evidente.\nConduta: Introdução de imunorregulador sistêmico e imunobiológico associado tópicos para contenção do avanço cicatricial definitivo.",
        statusMap: {
          tsh: "alterado",
          t4Livre: "normal",
          ferritina: "normal",
          hemoglobina: "normal",
          testosteronaTotal: "normal",
          testosteronaLivre: "normal",
          dheas: "normal",
          zinco: "normal",
          vitD: "normal",
          vitB12: "normal"
        }
      }
    ],
    protocolo: {
      medicamentos: "Poliânion sistêmico específico sob dosagem médica.\nClobetasol loção capilar 0.05% nas margens da linha capilar inflamadas, 3 noites por semana.",
      procedimentos: "Infiltração de triancinolona acetonida localizado (mensal nas áreas com hiperqueratose ativa).\nSessões de vacuoterapia e alta frequência calmante.",
      cosmeticos: "Xampu extra suave hidratante sem fragrâncias artificiais.",
      suplementacao: "Melatonina 2mg à noite (protetor imunológico periférico).\nLactobacillus específicos para autoimunidade capilar.",
      estiloVida: "Dietoterapia antioxidante estrita, eliminação do glúten opcional temporária por Hashimoto, evitar exposição solar direta na cicatriz frontal.",
      duracaoPrevista: "Indefinida (controle de doença crônica)",
      dataInicio: "2026-03-25"
    },
    galeria: [
      {
        id: "foto-5a",
        data: "2026-03-25",
        posicao: "Frontal",
        url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600",
        notaIa: "Recessão nítida de 1 a 1.5cm da faixa frontoparietal com perda de pelos nas sobrancelhas."
      }
    ],
    consultas: [
      {
        id: "consult-5a",
        data: "2026-03-25",
        tipo: "Presencial - Toledo",
        queixa: "Início há 1 ano de sumiço dos cabelos da testa. Testificou perda completa dos pelos das sobrancelhas.",
        evolucao: "Biópsia trazida confirma infiltrado inflamatório em colar de Líquen Plano Pilar capilar clássico de AFF.",
        alteracoesProtocolo: "Introduzido corticoide de alta potência local e fitoterápicos sistêmicos anti-andrógenos protetores.",
        examesSolicitados: "Investigação imunológica e tireoidiana detalhada.",
        resumoIa: "Início de acompanhamento de AFF cicatricial. O foco imediato do tratamento não é crescimento, mas sim travar o avanço da cicatriz."
      }
    ]
  },
  {
    id: "paciente-6",
    nome: "Carlos Eduardo da Silva",
    idade: 31,
    dataNascimento: "1995-07-14",
    cpf: "555.666.777-99",
    telefone: "(45) 99822-0941",
    email: "carlos.eduardo@silvadv.com",
    cidade: "Fátima do Sul",
    comoConheceu: "Indicação de Dermatologista",
    queixaPrincipal: "Placas totalmente sem cabelos circulares que surgiram na nuca há 3 semanas. Estão se espalhando.",
    status: "Em Pausa",
    progresso: 15,
    ultimaAtualizacao: "2026-05-02",
    antecedentes: {
      usoMedicamentos: "Nega uso recorrente.",
      historicoFamiliar: "Nega histórico de calvície precoce ou areata.",
      gestacaoAmamentacao: "Não se aplica.",
      menopausa: "Não se aplica.",
      outros: "Passou por burnout acadêmico de alta intensidade nos últimos meses, associado a perturbação de pânico."
    },
    diagnostico: {
      principal: "Alopecia Areata (Placa Única)",
      secundario: ["Crise Ansiosa Generalizada"],
      escalaHamiltonNorwood: "Não se aplica (Areata)",
      condicoesAssociadas: ["Couro cabeludo extremamente liso e sedoso dentro das placas", "Pontos de exclamação na borda da lesão"],
      fatoresContribuintes: ["Estresse ambiental psicossomático severo", "Provocação autoimune dos linfócitos T"],
      observacoes: "Duas lesões anulares nítidas no couro cabeludo occipito-temporal. Dermoscopia mostra clássicos cabelos em ponto de exclamação e pontos pretos."
    },
    exames: [
      {
        id: "ex-6",
        data: "2026-04-20",
        tsh: "2.1",
        t4Livre: "1.15",
        ferritina: "189.0",
        hemoglobina: "16.2",
        testosteronaTotal: "490.0",
        testosteronaLivre: "9.8",
        dheas: "180.0",
        zinco: "95.0",
        vitD: "41.0",
        vitB12: "520.0",
        analiseIA: "Níveis imunogenéticos normais. Diagnóstico estritamente focado em gatilho somático do sistema autônomo sobre microglandular folicular. Indicação prioritária de contenção corticoide para evitar evolução para 'Areata Totalis'.",
        statusMap: {
          tsh: "normal",
          t4Livre: "normal",
          ferritina: "normal",
          hemoglobina: "normal",
          testosteronaTotal: "normal",
          testosteronaLivre: "normal",
          dheas: "normal",
          zinco: "normal",
          vitD: "normal",
          vitB12: "normal"
        }
      }
    ],
    protocolo: {
      medicamentos: "Minoxidil de uso local em dose leve para indução de crescimento anágeno.\nCorticoide intradérmico na clínica.\nClax para estresse agudo sob indicação psiquiátrica.",
      procedimentos: "Infiltração capilar de acetonida de triancinolona a cada 21 dias direto na lesão ativa.\nLaser hélio-neônio regenerativo capilar.",
      cosmeticos: "Xampu antisséptico neutro sem fragrância.",
      suplementacao: "Suplementação de Zinco e Vitamina D em dose sistêmica imunomoduladora.",
      estiloVida: "Psicoterapia imediata continuada. Prática de exercícios ao ar livre para redução do cortisol. Descanso regulado.",
      duracaoPrevista: "4 meses para repilação",
      dataInicio: "2026-04-25"
    },
    galeria: [
      {
        id: "foto-6a",
        data: "2026-04-25",
        posicao: "Nuca",
        url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
        notaIa: "Placa lisa de alopecia na nuca medindo 3x4cm com bordas bem definidas."
      }
    ],
    consultas: [
      {
        id: "consult-6a",
        data: "2026-04-25",
        tipo: "Presencial - Fátima do Sul",
        queixa: "Surgimento repentino de buraco sem pelos na nuca de tamanho de uma moeda grande que cresceu em poucas semanas.",
        evolucao: "Constatado Alopecia Areata em placa ativa. Feita primeira infiltração local de triancinolona imediata.",
        alteracoesProtocolo: "Introduzido plano de imunossupressão folicular periférica de emergência.",
        examesSolicitados: "Bioquímica geral e tireóide.",
        resumoIa: "Areata unifocal deflagrada por gatilho emocional muito claro. Infiltração executada sem complicações."
      }
    ]
  }
];

export const MOCK_PRESCRIÇÕES_TEMPLATES: PrescricaoTemplate[] = [
  {
    id: "temp-1",
    titulo: "AAG Feminina Clássica (Ludwig I e II)",
    diagnosticoRef: "Alopecia Androgenética Feminina (FPHL)",
    categoria: "Medicamentoso",
    medicamentos: "Minoxidil oral 0.5mg à noite.\nEspironolactona 50mg pela manhã.",
    procedimentos: "MMP Capilar quinzena ou mensal.\nLaser de Baixa Potência diário (Helmet).",
    suplementacao: "Silício Orgânico 100mg + Biotina 5mg + L-Cistina 100mg.",
    cosmeticos: "Xampu antiqueda fitoterápico (Ginkgo Biloba e Cafeína).\nLoção tônica capilar com Capixyl aplicada à noite."
  },
  {
    id: "temp-2",
    titulo: "AGA Masculina Estágio IV (Hamilton-Norwood)",
    diagnosticoRef: "Alopecia Androgenética Masculina (AGA)",
    categoria: "Procedimentos",
    medicamentos: "Dutasterida 0.5mg à noite.\nMinoxidil oral 2.5mg pela manhã.",
    procedimentos: "Microagulhamento Capilar Robótico mensal com Drug Delivery de Dutasterida e Fatores de Crescimento.",
    suplementacao: "Zinco quelato 30mg + Saw Palmetto extract 320mg à noite.",
    cosmeticos: "Xampu de Limpeza Seborregulador com Cetoconazol 2%."
  },
  {
    id: "temp-3",
    titulo: "Eflúvio Agudo Pós-Dengue ou Pós-Parto",
    diagnosticoRef: "Eflúvio Telógeno Agudo",
    categoria: "Suplementação",
    medicamentos: "Evitar bloqueadores hormonais se houver lactação.",
    procedimentos: "Laser terapêutico capilar de Baixa Potência semanal em consultório.",
    suplementacao: "Ferro Quelato 60mg + Vitamina D 5.000 UI diário + Ômega 3 1g pós almoço.\nMetilfolato 1mg e Biotina 5mg.",
    cosmeticos: "Xampu suave com Pantenol e óleos essenciais remineralizantes."
  },
  {
    id: "temp-4",
    titulo: "Dermatite Seborreica Ativa com Eritema",
    diagnosticoRef: "Dermatite Seborreica",
    categoria: "Cuidados Domiciliares",
    medicamentos: "Corticoide capilar em emulsão suave (máximo 5 dias se coceira crônica).",
    procedimentos: "Peeling capilar ácido com ácido salicílico 2% em consultório.",
    suplementacao: "Zinco Quelado 30mg + Vitamina B6 50mg + L-Metionina 100mg pós-almoço.",
    cosmeticos: "Xampu de Cetoconazol alternado com Xampu de Piritionato de Zinco 1.5%."
  }
];

export const MOCK_ALERTAS: AlertaClinico[] = [
  {
    id: "al-1",
    pacienteId: "paciente-2",
    pacienteNome: "Gabriela Portela Cavalcanti",
    tipo: "exame_pendente",
    mensagem: "Exames de Ferritina e Ferro séricos há 24 dias pendentes de repetição para avaliar infusão capilar.",
    severidade: "error"
  },
  {
    id: "al-2",
    pacienteId: "paciente-6",
    pacienteNome: "Carlos Eduardo da Silva",
    tipo: "foto_atrasada",
    mensagem: "Sem registros fotográficos da nuca de Carlos Eduardo há mais de 40 dias. Necessário pull test.",
    severidade: "warning"
  },
  {
    id: "al-3",
    pacienteId: "paciente-1",
    pacienteNome: "Helena Silveira de Souza",
    tipo: "positivo",
    mensagem: "Helena reportou alta de energia e redução drástica da queixa na escova capilar central. Excelente adesão!",
    severidade: "success"
  },
  {
    id: "al-4",
    pacienteId: "paciente-5",
    pacienteNome: "Juliana Kester Becker",
    tipo: "retorno_vencido",
    mensagem: "Juliana Kester está com consulta de retorno vencida há 14 dias para nova triancilona infiltrativa.",
    severidade: "info"
  }
];

export const MOCK_AGENDA_HOJE: EventoAgenda[] = [
  {
    id: "ev-1",
    pacienteId: "paciente-1",
    pacienteNome: "Helena Silveira de Souza",
    data: "2026-06-08",
    horario: "09:00",
    tipo: "Presencial - Toledo",
    status: "Confirmada",
    diagnosticoResumo: "Alopecia Androgenética (Ludwig II)"
  },
  {
    id: "ev-2",
    pacienteId: "paciente-4",
    pacienteNome: "Isadora Mendes Fagundes",
    data: "2026-06-08",
    horario: "10:30",
    tipo: "Presencial - Toledo",
    status: "Realizada",
    diagnosticoResumo: "Dermatite Seborreica Grave"
  },
  {
    id: "ev-3",
    pacienteId: "paciente-2",
    pacienteNome: "Gabriela Portela Cavalcanti",
    data: "2026-06-08",
    horario: "14:00",
    tipo: "Online",
    status: "Confirmada",
    diagnosticoResumo: "Eflúvio Telógeno Agudo"
  },
  {
    id: "ev-4",
    pacienteId: "paciente-6",
    pacienteNome: "Carlos Eduardo da Silva",
    data: "2026-06-08",
    horario: "16:15",
    tipo: "Presencial - Fátima do Sul",
    status: "Pendente",
    diagnosticoResumo: "Alopecia Areata Placas"
  }
];
