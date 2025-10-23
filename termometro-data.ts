// termometro-data.ts
// This file stores the detailed data for the Emotional Thermometer component.

import { Heart, Frown, Flame, AlertCircle, Zap, ThumbsDown } from "lucide-react";

export const emotionalScales: { [key: string]: any } = {
  alegria: {
    name: "Alegria",
    englishName: "Joy",
    scientificName: "Positive Affect - High Valence",
    icon: Heart,
    color: "from-amber-200 via-yellow-400 to-emerald-500",
    valenceBase: 7.5,
    neuralCorrelates: "Sistema dopaminérgico mesolímbico, córtex pré-frontal ventromedial, nucleus accumbens",
    evolutionaryFunction: "Reforça comportamentos adaptativos, fortalece vínculos sociais e promove exploração do ambiente",
    bodyMap: { chest: 85, face: 90, arms: 60, legs: 55, stomach: 40 },
    levels: [
      { 
        level: 1, 
        label: "Alívio",
        valence: 6.5,
        arousal: 3.0,
        neurotransmitters: "↓Cortisol, ↑Serotonina",
        desc: "Redução da ativação simpática após remoção de ameaça; retorno à homeostase do eixo HPA.",
        examples: "Terminar uma prova difícil, receber notícia de que um problema foi resolvido, sair de situação estressante",
        regulation: "Respiração profunda, alongamento muscular, reconhecimento da conquista"
      },
      { 
        level: 2, 
        label: "Serenidade",
        valence: 7.0,
        arousal: 2.5,
        neurotransmitters: "Oxitocina, GABA",
        desc: "Estado de baixo arousal e valência positiva; ativação parassimpática predominante.",
        examples: "Meditar ao amanhecer, caminhar na natureza, momento de paz após dia produtivo",
        regulation: "Mindfulness, meditação, tempo na natureza, música suave"
      },
      { 
        level: 3, 
        label: "Gratidão",
        valence: 7.5,
        arousal: 4.0,
        neurotransmitters: "Dopamina, Oxitocina",
        desc: "Emoção pró-social com ativação do córtex cingulado anterior; fortalece vínculos.",
        examples: "Receber ajuda inesperada, reconhecer apoio de amigos, apreciar pequenas coisas",
        regulation: "Diário de gratidão, expressar agradecimento, meditação loving-kindness"
      },
      { 
        level: 4, 
        label: "Contentamento",
        valence: 8.0,
        arousal: 4.5,
        neurotransmitters: "Dopamina basal, Serotonina",
        desc: "Satisfação sustentada com equilíbrio entre sistemas de recompensa e regulação.",
        examples: "Finalizar projeto importante, estar com pessoas queridas, sentir-se realizado",
        regulation: "Savoring (saborear o momento), compartilhar conquistas, autocuidado"
      },
      { 
        level: 5, 
        label: "Prazer",
        valence: 8.5,
        arousal: 6.5,
        neurotransmitters: "↑↑Dopamina, Endorfinas",
        desc: "Ativação hedônica do nucleus accumbens; resposta a estímulos rewarding.",
        examples: "Comer comida deliciosa, ouvir música favorita, atividade prazerosa, elogio sincero",
        regulation: "Engajar em hobbies, exercício físico, conexões sociais positivas"
      },
      { 
        level: 6, 
        label: "Êxtase",
        valence: 9.0,
        arousal: 8.0,
        neurotransmitters: "Dopamina, Serotonina, Endocannabinoides",
        desc: "Estado de absorção total (flow) com supressão da rede de modo padrão (DMN).",
        examples: "Flow em atividade criativa, experiência transcendente, momento de epifania",
        regulation: "Criar condições para flow, práticas contemplativas, arte"
      },
      { 
        level: 7, 
        label: "Euforia",
        valence: 9.5,
        arousal: 9.5,
        neurotransmitters: "↑↑↑Dopamina, Noradrenalina, β-Endorfina",
        desc: "Pico de arousal positivo; pode indicar estado maníaco se persistente sem causa.",
        examples: "Nascimento de filho, grande conquista, experiência transformadora",
        regulation: "Grounding, compartilhar com outros, documentar experiência, cautela se sem causa"
      }
    ]
  },
  tristeza: {
    name: "Tristeza",
    englishName: "Sadness",
    scientificName: "Negative Affect - Low Arousal",
    icon: Frown,
    color: "from-slate-300 via-blue-400 to-indigo-700",
    valenceBase: 3.0,
    neuralCorrelates: "Amígdala, córtex cingulado anterior dorsal, ínsula anterior, córtex pré-frontal dorsolateral",
    evolutionaryFunction: "Sinaliza perda, promove busca por suporte social e facilita processamento de eventos negativos",
    bodyMap: { chest: 70, face: 60, arms: 30, legs: 25, stomach: 55 },
    levels: [
      { 
        level: 1, 
        label: "Desapontamento",
        valence: 4.0,
        arousal: 3.5,
        neurotransmitters: "↓Dopamina transitória",
        desc: "Frustração leve por discrepância entre expectativa e resultado.",
        examples: "Plano cancelado, resposta não esperada, resultado aquém do desejado",
        regulation: "Reestruturação cognitiva, aceitação, foco em alternativas"
      },
      { 
        level: 2, 
        label: "Decepção",
        valence: 3.5,
        arousal: 4.0,
        neurotransmitters: "↓Dopamina, ↑Cortisol leve",
        desc: "Violação de esquemas cognitivos estabelecidos; reavaliação de crenças.",
        examples: "Quebra de promessa, confiança abalada, expectativa significativa não atendida",
        regulation: "Conversar com pessoas confiáveis, journaling, reavaliação de expectativas"
      },
      { 
        level: 3, 
        label: "Melancolia",
        valence: 3.0,
        arousal: 3.0,
        neurotransmitters: "↓Serotonina, Acetilcolina",
        desc: "Tristeza introspectiva; facilita processamento de memórias autobiográficas.",
        examples: "Nostalgia do passado, reflexão sobre perdas, solidão contemplativa",
        regulation: "Arte criativa, música, escrita expressiva, permitir-se sentir"
      },
      { 
        level: 4, 
        label: "Mágoa",
        valence: 2.5,
        arousal: 5.0,
        neurotransmitters: "↑Cortisol, ↓Oxitocina",
        desc: "Dor social processada em regiões sobrepostas à dor física (ACC dorsal).",
        examples: "Rejeição social, crítica injusta, sentir-se excluído ou traído",
        regulation: "Comunicação assertiva, estabelecer limites, apoio social, terapia"
      },
      { 
        level: 5, 
        label: "Sofrimento",
        valence: 2.0,
        arousal: 6.0,
        neurotransmitters: "↓↓Serotonina, ↑↑Cortisol",
        desc: "Ativação intensa do sistema límbico; pode cronificar em depressão se prolongado.",
        examples: "Perda significativa, trauma emocional, dor psíquica intensa",
        regulation: "Buscar suporte profissional, não isolar-se, atividade física leve, rotina"
      },
      { 
        level: 6, 
        label: "Angústia",
        valence: 1.5,
        arousal: 7.0,
        neurotransmitters: "↑Noradrenalina, ↑Cortisol, ↓GABA",
        desc: "Componente ansioso sobreposto; ativação simpática com sintomas somáticos.",
        examples: "Crise existencial, situação sem saída aparente, desamparo agudo",
        regulation: "Intervenção profissional urgente, técnicas de grounding, rede de apoio"
      },
      { 
        level: 7, 
        label: "Desespero",
        valence: 1.0,
        arousal: 5.5,
        neurotransmitters: "↓↓Dopamina, ↓↓Serotonina, ↓Noradrenalina",
        desc: "Desamparo aprendido; disfunção executiva característica de depressão maior.",
        examples: "Depressão severa, perda de esperança, ideação de morte",
        regulation: "BUSCAR AJUDA PROFISSIONAL IMEDIATA - psiquiatra/psicólogo, linha de apoio"
      }
    ]
  },
  raiva: {
    name: "Raiva",
    englishName: "Anger",
    scientificName: "Negative Affect - High Arousal",
    icon: Flame,
    color: "from-orange-300 via-red-500 to-rose-800",
    valenceBase: 3.0,
    neuralCorrelates: "Amígdala, hipotálamo, substância cinzenta periaquedutal, córtex orbitofrontal",
    evolutionaryFunction: "Mobiliza recursos para remover obstáculos, defender território e estabelecer limites sociais",
    bodyMap: { chest: 80, face: 85, arms: 75, legs: 50, stomach: 65 },
    levels: [
      { 
        level: 1, 
        label: "Aversão",
        valence: 4.5,
        arousal: 4.0,
        neurotransmitters: "↑Glutamato (ínsula)",
        desc: "Resposta de evitação com ativação leve da ínsula.",
        examples: "Comportamento inconveniente, situação desagradável, violação menor de normas",
        regulation: "Afastamento temporário, redirecionamento de atenção"
      },
      { 
        level: 2, 
        label: "Irritação",
        valence: 4.0,
        arousal: 5.5,
        neurotransmitters: "↑Noradrenalina, ↑Cortisol",
        desc: "Ativação simpática inicial; sensibilização ao estresse.",
        examples: "Trânsito congestionado, interrupções frequentes, ruídos persistentes",
        regulation: "Pausas regulares, exercício físico, identificar gatilhos"
      },
      { 
        level: 3, 
        label: "Ressentimento",
        valence: 3.5,
        arousal: 5.0,
        neurotransmitters: "↑Cortisol crônico, Glutamato",
        desc: "Raiva rumativa com hiperatividade do córtex pré-frontal dorsolateral.",
        examples: "Injustiça não resolvida, mágoas acumuladas, sentir-se menosprezado",
        regulation: "Terapia cognitiva, assertividade, perdão (quando apropriado), boundaries"
      },
      { 
        level: 4, 
        label: "Raiva",
        valence: 3.0,
        arousal: 7.0,
        neurotransmitters: "↑↑Adrenalina, ↑Testosterona",
        desc: "Ativação da amígdala e hipotálamo; prepara para confronto.",
        examples: "Injustiça direta, desrespeito, obstáculo à meta importante",
        regulation: "Time-out, respiração, expressar assertivamente (não agressivamente)"
      },
      { 
        level: 5, 
        label: "Rancor",
        valence: 2.5,
        arousal: 6.5,
        neurotransmitters: "↑Cortisol, ↓Serotonina",
        desc: "Persistência cognitiva com consolidação de memórias negativas.",
        examples: "Traição não resolvida, vingança fantasiada, hostilidade crônica",
        regulation: "Terapia, trabalho de perdão, distanciamento da fonte"
      },
      { 
        level: 6, 
        label: "Ódio",
        valence: 2.0,
        arousal: 7.5,
        neurotransmitters: "↓Oxitocina, ↑Testosterona",
        desc: "Aversão duradoura com desativação do córtex pré-frontal medial (empatia).",
        examples: "Animosidade intensa, desumanização do outro, conflito prolongado",
        regulation: "Intervenção profissional, evitar contato, trabalho terapêutico profundo"
      },
      { 
        level: 7, 
        label: "Fúria",
        valence: 1.5,
        arousal: 9.5,
        neurotransmitters: "↑↑↑Adrenalina, ↑↑Noradrenalina, ↓GABA",
        desc: "Sequestro amigdalar com desconexão do córtex pré-frontal.",
        examples: "Raiva explosiva, perda de controle, agressividade impulsiva",
        regulation: "AFASTAMENTO IMEDIATO, técnicas de segurança, buscar ajuda profissional"
      }
    ]
  },
  medo: {
    name: "Medo",
    englishName: "Fear",
    scientificName: "Negative Affect - Threat Response",
    icon: AlertCircle,
    color: "from-purple-300 via-indigo-500 to-violet-800",
    valenceBase: 3.0,
    neuralCorrelates: "Amígdala, hipocampo, córtex cingulado anterior, hipotálamo, substância cinzenta periaquedutal",
    evolutionaryFunction: "Sistema de detecção de ameaças; ativa respostas de luta, fuga ou congelamento para sobrevivência",
    bodyMap: { chest: 85, face: 70, arms: 40, legs: 60, stomach: 80 },
    levels: [
      { 
        level: 1, 
        label: "Nervosismo",
        valence: 4.5,
        arousal: 5.0,
        neurotransmitters: "↑Noradrenalina leve",
        desc: "Ativação antecipatória leve; aumento da vigilância.",
        examples: "Apresentação próxima, encontro importante, situação nova",
        regulation: "Preparação adequada, respiração diafragmática, autoinstrução positiva"
      },
      { 
        level: 2, 
        label: "Insegurança",
        valence: 4.0,
        arousal: 5.5,
        neurotransmitters: "↑Cortisol, ↓Serotonina",
        desc: "Incerteza com hiperativação do córtex pré-frontal.",
        examples: "Dúvida sobre capacidades, situação ambígua, falta de controle",
        regulation: "Desenvolver autoeficácia, exposição gradual, validação de emoções"
      },
      { 
        level: 3, 
        label: "Preocupação",
        valence: 3.5,
        arousal: 6.0,
        neurotransmitters: "↑CRH, ↑Cortisol",
        desc: "Ansiedade antecipatória com ruminação cognitiva.",
        examples: "Preocupação com futuro, cenários catastróficos, 'e se...'",
        regulation: "Técnicas cognitivas, atenção plena, resolução de problemas estruturada"
      },
      { 
        level: 4, 
        label: "Ansiedade",
        valence: 3.0,
        arousal: 7.0,
        neurotransmitters: "↑↑Cortisol, ↑Adrenalina, ↓GABA",
        desc: "Estado de arousal elevado com ativação do eixo HPA; sintomas somáticos.",
        examples: "Ansiedade generalizada, sintomas físicos (taquicardia, sudorese, tensão)",
        regulation: "Terapia cognitivo-comportamental, relaxamento progressivo, exercício"
      },
      { 
        level: 5, 
        label: "Medo",
        valence: 2.5,
        arousal: 8.0,
        neurotransmitters: "↑↑Adrenalina, ↑CRH",
        desc: "Resposta defensiva básica; ativa via rápida para luta-fuga-congelamento.",
        examples: "Ameaça real imediata, perigo físico, situação assustadora",
        regulation: "Avaliar ameaça real, buscar segurança, técnicas de grounding"
      },
      { 
        level: 6, 
        label: "Terror",
        valence: 2.0,
        arousal: 9.0,
        neurotransmitters: "↑↑↑Adrenalina, ↑↑Noradrenalina",
        desc: "Medo extremo com desorganização cognitiva.",
        examples: "Situação de perigo extremo, ameaça à vida, evento traumático",
        regulation: "Garantir segurança física, suporte imediato, tratamento para trauma"
      },
      { 
        level: 7, 
        label: "Pânico",
        valence: 1.0,
        arousal: 10.0,
        neurotransmitters: "↑↑↑Adrenalina, ↓↓GABA, ↑Glutamato",
        desc: "Descarga autonômica descontrolada; resposta de congelamento tônico.",
        examples: "Ataque de pânico, paralisia por medo, terror incapacitante",
        regulation: "Técnicas de grounding urgentes, respiração 4-7-8, buscar ajuda imediata"
      }
    ]
  },
  surpresa: {
    name: "Surpresa",
    englishName: "Surprise",
    scientificName: "Valence-Neutral - Attention Reset",
    icon: Zap,
    color: "from-cyan-300 via-sky-400 to-blue-500",
    valenceBase: 5.0,
    neuralCorrelates: "Locus coeruleus, córtex parietal posterior, córtex pré-frontal, hipocampo",
    evolutionaryFunction: "Interrompe processamento atual para reorientar atenção a estímulos novos ou inesperados",
    bodyMap: { chest: 50, face: 95, arms: 45, legs: 30, stomach: 40 },
    levels: [
      { 
        level: 1, 
        label: "Surpresa Neutra",
        valence: 5.0,
        arousal: 5.5,
        neurotransmitters: "↑Noradrenalina (fásica)",
        desc: "Resposta de orientação com pausa comportamental breve.",
        examples: "Evento inesperado neutro, mudança súbita, interrupção",
        regulation: "Avaliar situação, processar nova informação"
      },
      { 
        level: 2, 
        label: "Curiosidade",
        valence: 6.5,
        arousal: 6.0,
        neurotransmitters: "↑Dopamina, Acetilcolina",
        desc: "Motivação exploratória; busca ativa de informação.",
        examples: "Descoberta intrigante, mistério a resolver, aprendizado novo",
        regulation: "Permitir exploração, fazer perguntas, investigar"
      },
      { 
        level: 3, 
        label: "Fascínio",
        valence: 7.0,
        arousal: 6.5,
        neurotransmitters: "↑Dopamina, ↑Noradrenalina",
        desc: "Atenção sustentada com supressão da rede de modo padrão.",
        examples: "Demonstração impressionante, história cativante, experiência absorsiva",
        regulation: "Imersão completa, documentar experiência"
      },
      { 
        level: 4, 
        label: "Admiração",
        valence: 7.5,
        arousal: 6.0,
        neurotransmitters: "Dopamina, Oxitocina",
        desc: "Experiência de awe; reavaliação de esquemas sobre grandeza.",
        examples: "Obra de arte poderosa, ato de bondade excepcional, beleza natural",
        regulation: "Contemplação, gratidão, expansão de perspectiva"
      },
      { 
        level: 5, 
        label: "Assombro",
        valence: 8.0,
        arousal: 7.0,
        neurotransmitters: "↑Dopamina, Serotonina",
        desc: "Surpresa intensa positiva com sensação de vastidão.",
        examples: "Experiência transcendente, insight profundo, momento transformador",
        regulation: "Integração da experiência, compartilhar, reflexão"
      },
      { 
        level: 6, 
        label: "Pasmo",
        valence: 5.0,
        arousal: 8.0,
        neurotransmitters: "↑↑Noradrenalina",
        desc: "Interrupção cognitiva abrupta com paralisação momentânea.",
        examples: "Evento chocante, revelação inesperada, virada dramática",
        regulation: "Tempo para processar, buscar contexto, não tomar decisões imediatas"
      },
      { 
        level: 7, 
        label: "Espanto",
        valence: 5.0,
        arousal: 9.0,
        neurotransmitters: "↑↑Noradrenalina, ↑Adrenalina",
        desc: "Reação máxima do sistema de orientação.",
        examples: "Evento extraordinário, surpresa extrema, impossível acontecendo",
        regulation: "Verificar realidade, processar gradualmente, apoio social"
      }
    ]
  },
  nojo: {
    name: "Nojo",
    englishName: "Disgust",
    scientificName: "Negative Affect - Contamination Avoidance",
    icon: ThumbsDown,
    color: "from-lime-300 via-green-500 to-emerald-700",
    valenceBase: 3.0,
    neuralCorrelates: "Ínsula anterior, gânglios da base, córtex orbitofrontal, amígdala",
    evolutionaryFunction: "Proteção contra patógenos, toxinas e violações morais; evitação de contaminação física e social",
    bodyMap: { chest: 40, face: 90, arms: 30, legs: 20, stomach: 85 },
    levels: [
      { 
        level: 1, 
        label: "Desprezo",
        valence: 4.0,
        arousal: 4.5,
        neurotransmitters: "↑Serotonina (ínsula)",
        desc: "Julgamento moral negativo; sinalização de violação de normas.",
        examples: "Comportamento antiético leve, violação de etiqueta, hipocrisia",
        regulation: "Estabelecer limites, expressar desaprovação apropriadamente"
      },
      { 
        level: 2, 
        label: "Desgosto",
        valence: 3.5,
        arousal: 5.0,
        neurotransmitters: "↑Glutamato (ínsula)",
        desc: "Rejeição sensorial leve com ativação da ínsula anterior.",
        examples: "Comida estragada, cheiro desagradável, ambiente sujo",
        regulation: "Afastamento, limpeza, mudança de ambiente"
      },
      { 
        level: 3, 
        label: "Repulsa",
        valence: 3.0,
        arousal: 6.5,
        neurotransmitters: "↑Noradrenalina, ↑Cortisol",
        desc: "Resposta de evitação com ativação do sistema motor.",
        examples: "Contaminação percebida, material repugnante, contato indesejado",
        regulation: "Afastamento imediato, higiene, redução de exposição"
      },
      { 
        level: 4, 
        label: "Indignação",
        valence: 2.5,
        arousal: 7.0,
        neurotransmitters: "↑Adrenalina, ↑Testosterona",
        desc: "Nojo moral com coativação de regiões de raiva.",
        examples: "Injustiça grave, abuso de poder, violação de direitos",
        regulation: "Ação social construtiva, advocacy, canalizar para mudança"
      },
      { 
        level: 5, 
        label: "Aversão Profunda",
        valence: 2.0,
        arousal: 8.0,
        neurotransmitters: "↑Serotonina periférica, Acetilcolina",
        desc: "Resposta autonômica intensa; ativação do núcleo do trato solitário.",
        examples: "Experiência nauseante, trauma associado a nojo, violação extrema",
        regulation: "Remover-se da situação, buscar conforto, processamento terapêutico se traumático"
      }
    ]
  }
};
