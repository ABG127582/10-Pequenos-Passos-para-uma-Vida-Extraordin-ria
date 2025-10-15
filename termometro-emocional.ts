// termometro-emocional.ts

// --- DATA STRUCTURE ---
const emotionalScales: { [key: string]: any } = {
  alegria: { name: "Alegria", scientificName: "Positive Affect - High Valence", icon: 'fa-heart', color: "linear-gradient(to right, #fde68a, #facc15, #22c55e)", valence: "+", arousalRange: "Baixo → Alto", neuralCorrelates: "Sistema dopaminérgico mesolímbico, córtex pré-frontal ventromedial", levels: [ { level: 1, label: "Alívio", desc: "Redução da ativação simpática após remoção de ameaça; retorno à homeostase do eixo HPA.", valence: 6.5, arousal: 3.0, neurotransmitters: "↓Cortisol, ↑Serotonina" }, { level: 2, label: "Serenidade", desc: "Estado de baixo arousal e valência positiva; ativação parassimpática predominante.", valence: 7.0, arousal: 2.5, neurotransmitters: "Oxitocina, GABA" }, { level: 3, label: "Gratidão", desc: "Ativação do córtex cingulado anterior; fortalece vínculos e memória positiva.", valence: 7.5, arousal: 4.0, neurotransmitters: "Dopamina, Oxitocina" }, { level: 4, label: "Contentamento", desc: "Satisfação sustentada com equilíbrio entre sistemas de recompensa e regulação.", valence: 8.0, arousal: 4.5, neurotransmitters: "Dopamina basal, Serotonina" }, { level: 5, label: "Prazer", desc: "Ativação hedônica do nucleus accumbens com liberação fásica de dopamina.", valence: 8.5, arousal: 6.5, neurotransmitters: "↑↑Dopamina, Endorfinas" }, { level: 6, label: "Êxtase", desc: "Estado de absorção total (flow) com supressão da rede de modo padrão (DMN).", valence: 9.0, arousal: 8.0, neurotransmitters: "Dopamina, Endocanabinoides" }, { level: 7, label: "Euforia", desc: "Pico de arousal positivo com hiperativação mesolímbica.", valence: 9.5, arousal: 9.5, neurotransmitters: "↑↑↑Dopamina, Noradrenalina" } ] },
  tristeza: { name: "Tristeza", scientificName: "Negative Affect - Low Arousal", icon: 'fa-frown', color: "linear-gradient(to right, #d1d5db, #60a5fa, #4338ca)", valence: "−", arousalRange: "Baixo → Moderado", neuralCorrelates: "Amígdala, córtex cingulado anterior dorsal, ínsula anterior", levels: [ { level: 1, label: "Desapontamento", desc: "Frustração leve por discrepância entre expectativa e resultado.", valence: 4.0, arousal: 3.5, neurotransmitters: "↓Dopamina transitória" }, { level: 2, label: "Decepção", desc: "Violação de esquemas cognitivos; reavaliação de crenças.", valence: 3.5, arousal: 4.0, neurotransmitters: "↓Dopamina, ↑Cortisol leve" }, { level: 3, label: "Melancolia", desc: "Tristeza introspectiva com ativação do giro cingulado posterior.", valence: 3.0, arousal: 3.0, neurotransmitters: "↓Serotonina, Acetilcolina" }, { level: 4, label: "Mágoa", desc: "Dor social processada em regiões sobrepostas à dor física (ACC dorsal).", valence: 2.5, arousal: 5.0, neurotransmitters: "↑Cortisol, ↓Oxitocina" }, { level: 5, label: "Sofrimento", desc: "Ativação intensa do sistema límbico com hiperconectividade amígdala-córtex.", valence: 2.0, arousal: 6.0, neurotransmitters: "↓↓Serotonina, ↑↑Cortisol" }, { level: 6, label: "Angústia", desc: "Componente ansioso sobreposto; ativação simpática com taquicardia.", valence: 1.5, arousal: 7.0, neurotransmitters: "↑Noradrenalina, ↑Cortisol, ↓GABA" }, { level: 7, label: "Desespero", desc: "Desamparo aprendido com hipoativação do córtex pré-frontal.", valence: 1.0, arousal: 5.5, neurotransmitters: "↓↓Dopamina, ↓↓Serotonina" } ] },
  raiva: { name: "Raiva", scientificName: "Negative Affect - High Arousal", icon: 'fa-fire', color: "linear-gradient(to right, #fdba74, #ef4444, #881337)", valence: "−", arousalRange: "Moderado → Muito Alto", neuralCorrelates: "Amígdala, hipotálamo, substância cinzenta periaquedutal", levels: [ { level: 1, label: "Aversão", desc: "Resposta de evitação com ativação leve da ínsula.", valence: 4.5, arousal: 4.0, neurotransmitters: "↑Glutamato (ínsula)" }, { level: 2, label: "Irritação", desc: "Ativação simpática inicial com aumento de frequência cardíaca.", valence: 4.0, arousal: 5.5, neurotransmitters: "↑Noradrenalina, ↑Cortisol" }, { level: 3, label: "Ressentimento", desc: "Raiva rumativa com hiperatividade do córtex pré-frontal dorsolateral.", valence: 3.5, arousal: 5.0, neurotransmitters: "↑Cortisol crônico" }, { level: 4, label: "Raiva", desc: "Ativação da amígdala e hipotálamo medial; prepara para confronto.", valence: 3.0, arousal: 7.0, neurotransmitters: "↑↑Adrenalina, ↑Testosterona" }, { level: 5, label: "Rancor", desc: "Persistência cognitiva com consolidação de memórias negativas.", valence: 2.5, arousal: 6.5, neurotransmitters: "↑Cortisol, ↓Serotonina" }, { level: 6, label: "Ódio", desc: "Aversão duradoura com desativação do córtex pré-frontal medial (empatia).", valence: 2.0, arousal: 7.5, neurotransmitters: "↓Oxitocina, ↑Testosterona" }, { level: 7, label: "Fúria", desc: "Sequestro amigdalar com desconexão do córtex pré-frontal.", valence: 1.5, arousal: 9.5, neurotransmitters: "↑↑↑Adrenalina, ↑↑Noradrenalina" } ] },
  medo: { name: "Medo", scientificName: "Negative Affect - Threat Response", icon: 'fa-circle-exclamation', color: "linear-gradient(to right, #c4b5fd, #6d28d9, #4c1d95)", valence: "−", arousalRange: "Baixo → Extremo", neuralCorrelates: "Amígdala, hipocampo, córtex cingulado anterior, hipotálamo", levels: [ { level: 1, label: "Nervosismo", desc: "Ativação antecipatória leve do sistema nervoso autônomo.", valence: 4.5, arousal: 5.0, neurotransmitters: "↑Noradrenalina leve" }, { level: 2, label: "Insegurança", desc: "Incerteza com hiperativação do córtex pré-frontal.", valence: 4.0, arousal: 5.5, neurotransmitters: "↑Cortisol, ↓Serotonina" }, { level: 3, label: "Preocupação", desc: "Ansiedade antecipatória com ruminação cognitiva; hiperatividade do córtex cingulado anterior.", valence: 3.5, arousal: 6.0, neurotransmitters: "↑CRH, ↑Cortisol" }, { level: 4, label: "Ansiedade", desc: "Estado de arousal elevado com ativação do eixo HPA.", valence: 3.0, arousal: 7.0, neurotransmitters: "↑↑Cortisol, ↑Adrenalina, ↓GABA" }, { level: 5, label: "Medo", desc: "Resposta defensiva básica mediada pela amígdala (luta-fuga-congelamento).", valence: 2.5, arousal: 8.0, neurotransmitters: "↑↑Adrenalina, ↑CRH" }, { level: 6, label: "Terror", desc: "Medo extremo com desorganização cognitiva; hiperativação amigdalar.", valence: 2.0, arousal: 9.0, neurotransmitters: "↑↑↑Adrenalina" }, { level: 7, label: "Pânico", desc: "Descarga autonômica descontrolada; ativação da substância cinzenta periaquedutal.", valence: 1.0, arousal: 10.0, neurotransmitters: "↑↑↑Adrenalina, ↓↓GABA" } ] },
  surpresa: { name: "Surpresa", scientificName: "Valence-Neutral - Attention Reset", icon: 'fa-bolt', color: "linear-gradient(to right, #67e8f9, #0ea5e9, #2563eb)", valence: "Neutra → +/−", arousalRange: "Moderado → Alto", neuralCorrelates: "Locus coeruleus, córtex parietal posterior, córtex pré-frontal", levels: [ { level: 1, label: "Surpresa Neutra", desc: "Resposta de orientação com pausa comportamental breve; reorientação atencional.", valence: 5.0, arousal: 5.5, neurotransmitters: "↑Noradrenalina (phasic)" }, { level: 2, label: "Curiosidade", desc: "Motivação exploratória com ativação do sistema dopaminérgico.", valence: 6.5, arousal: 6.0, neurotransmitters: "↑Dopamina, Acetilcolina" }, { level: 3, label: "Fascínio", desc: "Atenção sustentada com supressão da rede de modo padrão (DMN).", valence: 7.0, arousal: 6.5, neurotransmitters: "↑Dopamina, ↑Noradrenalina" }, { level: 4, label: "Admiração", desc: "Experiência de 'awe' com reavaliação de esquemas sobre grandeza e transcendência.", valence: 7.5, arousal: 6.0, neurotransmitters: "Dopamina, Oxitocina" }, { level: 5, label: "Assombro", desc: "Surpresa intensa positiva com sensação de vastidão.", valence: 8.0, arousal: 7.0, neurotransmitters: "↑Dopamina, Serotonina" }, { level: 6, label: "Pasmo", desc: "Interrupção cognitiva abrupta com paralisação momentânea.", valence: 5.0, arousal: 8.0, neurotransmitters: "↑↑Noradrenalina" }, { level: 7, label: "Espanto", desc: "Reação máxima do sistema de orientação; pode preceder medo ou alegria.", valence: 5.0, arousal: 9.0, neurotransmitters: "↑↑Noradrenalina, ↑Adrenalina" } ] },
  nojo: { name: "Nojo", scientificName: "Negative Affect - Contamination Avoidance", icon: 'fa-thumbs-down', color: "linear-gradient(to right, #bef264, #22c55e, #065f46)", valence: "−", arousalRange: "Moderado → Alto", neuralCorrelates: "Ínsula anterior, gânglios da base, córtex orbitofrontal", levels: [ { level: 1, label: "Desprezo", desc: "Julgamento moral negativo com ativação do giro frontal inferior.", valence: 4.0, arousal: 4.5, neurotransmitters: "↑Serotonina (ínsula)" }, { level: 2, label: "Desgosto", desc: "Rejeição sensorial leve com ativação da ínsula anterior.", valence: 3.5, arousal: 5.0, neurotransmitters: "↑Glutamato (ínsula)" }, { level: 3, label: "Repulsa", desc: "Resposta de evitação com ativação do sistema motor.", valence: 3.0, arousal: 6.5, neurotransmitters: "↑Noradrenalina, ↑Cortisol" }, { level: 4, label: "Indignação", desc: "Nojo moral com coativação de regiões de raiva.", valence: 2.5, arousal: 7.0, neurotransmitters: "↑Adrenalina, ↑Testosterona" }, { level: 5, label: "Aversão Profunda", desc: "Resposta autonômica intensa com náusea; ativação do nervo vago.", valence: 2.0, arousal: 8.0, neurotransmitters: "↑Serotonina periférica" } ] }
};

// --- STATE ---
let selectedEmotionKey = 'alegria';
let selectedLevel: number | null = null;
let hoveredLevel: number | null = null;

// --- DOM ELEMENTS ---
const elements = {
    page: null as HTMLElement | null,
    emotionSelector: null as HTMLElement | null,
    thermometerHeader: null as HTMLElement | null,
    neuralInfo: null as HTMLElement | null,
    gradientBar: null as HTMLElement | null,
    markers: null as HTMLElement | null,
    infoDisplay: null as HTMLElement | null,
    toggleTheoryBtn: null as HTMLButtonElement | null,
    theorySection: null as HTMLElement | null,
};

// --- RENDER FUNCTIONS ---
function render() {
    renderEmotionSelector();
    renderThermometer();
    renderInfoDisplay();
}

function renderEmotionSelector() {
    if (!elements.emotionSelector) return;
    elements.emotionSelector.innerHTML = Object.keys(emotionalScales).map(key => {
        const emotion = emotionalScales[key];
        return `
            <button class="emotion-selector-btn ${selectedEmotionKey === key ? 'active' : ''}" data-emotion-key="${key}">
                <i class="fas ${emotion.icon}"></i>
                <span>${emotion.name}</span>
            </button>
        `;
    }).join('');
}

function renderThermometer() {
    if (!elements.thermometerHeader || !elements.neuralInfo || !elements.gradientBar || !elements.markers) return;
    
    const scale = emotionalScales[selectedEmotionKey];
    
    elements.thermometerHeader.innerHTML = `
        <div class="thermometer-title">
            <i class="fas ${scale.icon}"></i>
            <div>
                <h2>${scale.name}</h2>
                <p>${scale.scientificName}</p>
            </div>
        </div>
        <div class="thermometer-stats">
            <p><strong>Valência:</strong> ${scale.valence}</p>
            <p><i class="fas fa-chart-line"></i> <strong>Arousal:</strong> ${scale.arousalRange}</p>
        </div>
    `;

    elements.neuralInfo.innerHTML = `<p><strong>Correlatos Neurais:</strong> ${scale.neuralCorrelates}</p>`;
    
    elements.gradientBar.style.background = scale.color;
    
    const maxLevel = scale.levels.length - 1;
    elements.markers.innerHTML = scale.levels.map((level: any, index: number) => {
        const position = (index / maxLevel) * 100;
        return `
            <div class="level-marker-wrapper" style="left: ${position}%">
                <button class="level-marker" data-level="${level.level}">
                    ${level.level}
                </button>
                <div class="level-marker-line"></div>
                <span class="level-marker-label">${level.label}</span>
            </div>
        `;
    }).join('');

    updateMarkerClasses();
}

function renderInfoDisplay() {
    if (!elements.infoDisplay) return;

    const levelToShow = hoveredLevel ?? selectedLevel;
    
    if (levelToShow === null) {
        elements.infoDisplay.innerHTML = `
            <div class="thermometer-info-placeholder">
                <i class="fas fa-hand-pointer"></i>
                <p>Passe o mouse ou clique em um nível para ver detalhes.</p>
            </div>
        `;
        return;
    }

    const scale = emotionalScales[selectedEmotionKey];
    const levelData = scale.levels.find((l: any) => l.level === levelToShow);

    if (!levelData) return;

    elements.infoDisplay.innerHTML = `
        <div class="thermometer-info-card">
            <div class="info-card-header">
                <h3>Nível ${levelData.level}: ${levelData.label}</h3>
                <div class="info-card-tags">
                    <span>Valência: ${levelData.valence}/10</span>
                    <span>Arousal: ${levelData.arousal}/10</span>
                </div>
            </div>
            <p class="info-card-desc">${levelData.desc}</p>
            <div class="info-card-neuro">
                <p><strong>Neurotransmissores:</strong> ${levelData.neurotransmitters}</p>
            </div>
        </div>
    `;
}

function updateMarkerClasses() {
    const markers = elements.markers?.querySelectorAll('.level-marker');
    markers?.forEach(marker => {
        const level = parseInt(marker.getAttribute('data-level') || '0', 10);
        marker.classList.remove('selected', 'hovered');
        if (level === selectedLevel) marker.classList.add('selected');
        if (level === hoveredLevel) marker.classList.add('hovered');
    });
}

// --- EVENT HANDLERS ---
function handleEmotionSelect(e: Event) {
    const target = e.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>('.emotion-selector-btn');
    if (!button || !button.dataset.emotionKey) return;

    selectedEmotionKey = button.dataset.emotionKey;
    selectedLevel = null;
    hoveredLevel = null;
    render();
}

function handleMarkerInteraction(e: Event) {
    const target = e.target as HTMLElement;
    const marker = target.closest<HTMLButtonElement>('.level-marker');
    if (!marker) return;

    const level = parseInt(marker.dataset.level || '0', 10);

    if (e.type === 'click') {
        selectedLevel = (selectedLevel === level) ? null : level;
        hoveredLevel = null;
    } else if (e.type === 'mouseover') {
        hoveredLevel = level;
    } else if (e.type === 'mouseout') {
        hoveredLevel = null;
    }
    
    updateMarkerClasses();
    renderInfoDisplay();
}

function toggleTheorySection() {
    if (!elements.theorySection || !elements.toggleTheoryBtn) return;
    const isHidden = elements.theorySection.style.display === 'none';
    elements.theorySection.style.display = isHidden ? 'block' : 'none';
    const textSpan = elements.toggleTheoryBtn.querySelector('span');
    if (textSpan) {
        textSpan.textContent = isHidden ? 'Ocultar Fundamentação' : 'Ver Fundamentação';
    }
}


// --- LIFECYCLE FUNCTIONS ---
export function setup(): void {
    const page = document.getElementById('page-termometro-emocional');
    if (!page) {
        console.warn("Termômetro Emocional page container not found.");
        return;
    }

    elements.page = page;
    elements.emotionSelector = page.querySelector('#emotion-selector');
    elements.thermometerHeader = page.querySelector('#thermometer-header');
    elements.neuralInfo = page.querySelector('#thermometer-neural-info');
    elements.gradientBar = page.querySelector('#thermometer-gradient-bar');
    elements.markers = page.querySelector('#thermometer-markers');
    elements.infoDisplay = page.querySelector('#thermometer-info-display');
    elements.toggleTheoryBtn = page.querySelector('#toggle-theory-btn');
    elements.theorySection = page.querySelector('#theory-section');

    elements.emotionSelector?.addEventListener('click', handleEmotionSelect);
    elements.markers?.addEventListener('click', handleMarkerInteraction);
    elements.markers?.addEventListener('mouseover', handleMarkerInteraction);
    elements.markers?.addEventListener('mouseout', handleMarkerInteraction);
    elements.toggleTheoryBtn?.addEventListener('click', toggleTheorySection);
}

export function show(): void {
    selectedEmotionKey = 'alegria';
    selectedLevel = null;
    hoveredLevel = null;
    render();
}