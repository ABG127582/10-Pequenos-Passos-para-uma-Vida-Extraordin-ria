import DOMPurify from 'dompurify';
import { confirmAction } from './utils';
import { STORAGE_KEYS } from './constants';
import { storageService } from './storage';
import { ai } from './ai';
import { loadingManager } from './loadingManager';

// Re-declare window interface for global functions
declare global {
    interface Window {
        showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
        Chart: any;
    }
}

// --- TYPE DEFINITIONS ---
interface Supplement { id: string; name: string; dosage: string; frequency: string; time: string; notes: string; }
interface Diagnostic { id: string; enabled: boolean; date: string; type: string; medication: string; notes: string; severity: string; }
interface UserProfile { birthDate: string; sex: 'male' | 'female'; }
interface IndicatorEntry { value: number; date: string; }

// --- MODULE-SCOPED VARIABLES ---
let supplements: Supplement[] = [];
let diagnostics: { [key: string]: Diagnostic } = {};
let userProfile: UserProfile | null = null;
let historyChart: any = null;

// --- VACCINE DATA ---
const vaccineInfo: { [key: string]: { name: string; scheduleType: 'booster' | 'annual' | 'series' | 'single' | 'check'; validityYears?: number; pendingMonths?: number; details: string; minAge?: number; } } = {
    'tetano': { name: 'Tétano e Difteria (dT/dTpa)', scheduleType: 'booster', validityYears: 10, pendingMonths: 3, details: 'Reforço a cada 10 anos.' },
    'hepatite-b': { name: 'Hepatite B', scheduleType: 'series', details: 'Esquema de 3 doses. Verifique seu status.' },
    'influenza': { name: 'Influenza (Gripe)', scheduleType: 'annual', validityYears: 1, pendingMonths: 2, details: 'Dose anual, antes do inverno.' },
    'triplice-viral': { name: 'Tríplice Viral (SCR)', scheduleType: 'series', details: 'Duas doses na vida para nascidos após 1960.' },
    'febre-amarela': { name: 'Febre Amarela', scheduleType: 'single', details: 'Dose única para a maioria.' },
    'hpv': { name: 'HPV', scheduleType: 'series', details: 'Esquema de 2 ou 3 doses. Verifique seu status.' },
    'pneumococica': { name: 'Pneumocócica', scheduleType: 'check', details: 'Recomendada para 60+ ou com risco. Consulte médico.', minAge: 60 },
    'meningococica': { name: 'Meningocócica', scheduleType: 'check', details: 'Recomendada para adolescentes e jovens adultos. Consulte médico.' },
    'varicela': { name: 'Varicela (Catapora)', scheduleType: 'series', details: 'Esquema de 2 doses se não teve a doença.' },
    'hepatite-a': { name: 'Hepatite A', scheduleType: 'series', details: 'Esquema de 2 doses.' },
    'herpes-zoster': { name: 'Herpes Zóster', scheduleType: 'check', details: 'Recomendada para 50+. Consulte médico.', minAge: 50 },
    'covid-19': { name: 'COVID-19', scheduleType: 'annual', validityYears: 1, pendingMonths: 2, details: 'Reforços podem ser recomendados.' },
    'dengue': { name: 'Dengue', scheduleType: 'series', details: 'Para áreas endêmicas. Consulte médico.' },
};

// --- BIOMARKER DATA ---
const getIndicatorConfig = (id: string, profile: UserProfile | null): any => {
    const configs: { [key: string]: any } = {
        'glicemia': { name: 'Glicemia em Jejum', unit: 'mg/dL', min: 50, max: 150, zones: [{ to: 69, status: 'Atenção', tip: 'Possível hipoglicemia.' }, { to: 99, status: 'Normal', tip: 'Valor ótimo.' }, { to: 125, status: 'Atenção', tip: 'Risco de pré-diabetes.' }, { to: 150, status: 'Alerta', tip: 'Sugestivo de diabetes.' }] },
        'hdl': { name: 'HDL', unit: 'mg/dL', min: 20, max: 100, reversed: true, zones: [{ to: profile?.sex === 'male' ? 39 : 49, status: 'Alerta', tip: 'Nível baixo.' }, { to: 59, status: 'Normal', tip: 'Nível aceitável.' }, { to: 100, status: 'Ótimo', tip: 'Nível protetor.' }] },
        'ldl': { name: 'LDL', unit: 'mg/dL', min: 50, max: 200, zones: [{ to: 99, status: 'Ótimo', tip: 'Ideal.' }, { to: 129, status: 'Normal', tip: 'Próximo ao ótimo.' }, { to: 159, status: 'Atenção', tip: 'Limítrofe.' }, { to: 200, status: 'Alerta', tip: 'Nível alto.' }] },
        'colesterol': { name: 'Colesterol Total', unit: 'mg/dL', min: 100, max: 300, zones: [{ to: 199, status: 'Ótimo', tip: 'Desejável.' }, { to: 239, status: 'Atenção', tip: 'Limítrofe.' }, { to: 300, status: 'Alerta', tip: 'Alto.' }] },
        'triglicerideos': { name: 'Triglicerídeos', unit: 'mg/dL', min: 50, max: 500, zones: [{ to: 149, status: 'Ótimo', tip: 'Desejável.' }, { to: 199, status: 'Atenção', tip: 'Limítrofe.' }, { to: 499, status: 'Alerta', tip: 'Alto.' }, { to: 500, status: 'Alerta', tip: 'Muito alto.' }] },
        'vitd': { name: 'Vitamina D', unit: 'ng/mL', min: 10, max: 100, zones: [{ to: 19, status: 'Alerta', tip: 'Deficiência.' }, { to: 29, status: 'Atenção', tip: 'Insuficiência.' }, { to: 60, status: 'Ótimo', tip: 'Adequado.' }, { to: 100, status: 'Atenção', tip: 'Elevado.' }] },
        'tsh': { name: 'TSH', unit: 'µUI/mL', min: 0.1, max: 10, zones: [{ to: 0.39, status: 'Atenção', tip: 'Sugestivo de hipertireoidismo.' }, { to: 4.0, status: 'Normal', tip: 'Normal.' }, { to: 10, status: 'Atenção', tip: 'Sugestivo de hipotireoidismo.' }] },
        'creatinina': { name: 'Creatinina', unit: 'mg/dL', min: 0.4, max: 1.5, zones: [{ to: 0.59, status: 'Atenção', tip: 'Baixo.' }, { to: 1.2, status: 'Normal', tip: 'Normal.' }, { to: 1.5, status: 'Atenção', tip: 'Elevado.' }] },
        'acidourico': { name: 'Ácido Úrico', unit: 'mg/dL', min: 2, max: 10, zones: [{ to: 2.4, status: 'Atenção', tip: 'Baixo.' }, { to: 6.0, status: 'Normal', tip: 'Normal.' }, { to: 10, status: 'Alerta', tip: 'Elevado.' }] },
        'pcr': { name: 'PCR Ultrassensível', unit: 'mg/L', min: 0, max: 10, zones: [{ to: 0.9, status: 'Normal', tip: 'Baixo risco.' }, { to: 2.9, status: 'Atenção', tip: 'Risco médio.' }, { to: 10, status: 'Alerta', tip: 'Alto risco.' }] },
        'ferritina': { name: 'Ferritina', unit: 'ng/mL', min: 10, max: 400, zones: [{ to: 49, status: 'Atenção', tip: 'Baixo.' }, { to: 150, status: 'Normal', tip: 'Adequado.' }, { to: 400, status: 'Atenção', tip: 'Elevado.' }] },
        'b12': { name: 'Vitamina B12', unit: 'pg/mL', min: 100, max: 1000, zones: [{ to: 399, status: 'Atenção', tip: 'Baixo.' }, { to: 900, status: 'Normal', tip: 'Adequado.' }, { to: 1000, status: 'Atenção', tip: 'Elevado.' }] },
        'gordura_bio': { name: 'Gordura Corporal', unit: '%', min: 5, max: 50, zones: [{ to: profile?.sex === 'male' ? 14 : 21, status: 'Ótimo', tip: 'Atleta.' }, { to: profile?.sex === 'male' ? 20 : 28, status: 'Normal', tip: 'Saudável.' }, { to: profile?.sex === 'male' ? 25 : 33, status: 'Atenção', tip: 'Acima do ideal.' }, { to: 50, status: 'Alerta', tip: 'Obesidade.' }] },
        'massamagra_bio': { name: 'Massa Magra', unit: 'kg', min: 30, max: 90, reversed: true, zones: [{ to: 49, status: 'Alerta', tip: 'Baixa.' }, { to: 80, status: 'Normal', tip: 'Adequado.' }, { to: 90, status: 'Ótimo', tip: 'Excelente.' }] },
    };
    if (!id) {
        return configs;
    }
    return configs[id];
};

// --- HELPER FUNCTIONS ---
function calculateAge(birthDate: string): number {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function simpleMarkdownToHtml(text: string): string {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\n/g, '<br>') // Newlines
        .replace(/<br>\s*-\s/g, '<br>&#8226; ') // Basic list items
        .replace(/<br>\s*\*\s/g, '<br>&#8226; '); // Basic list items (asterisk)
}

function openAiInsightsModal(content: string) {
    const modal = document.getElementById('ai-insights-modal');
    const body = document.getElementById('ai-insights-body');
    if (modal && body) {
        body.innerHTML = simpleMarkdownToHtml(DOMPurify.sanitize(content));
        modal.style.display = 'flex';
    }
}

// --- RENDER & LOGIC FUNCTIONS ---
function updateDashboard() {
    const totalVaccines = Object.keys(vaccineInfo).length;
    let vaccinesInDay = 0;
    
    // Check vaccine status elements
    document.querySelectorAll('#tabela-vacinas .vaccine-status').forEach(el => {
        if (el.textContent === 'Em dia' || el.textContent === 'OK' || el.textContent === 'Tomada' || el.textContent === 'Não aplicável') {
            vaccinesInDay++;
        }
    });

    const totalBiomarkers = Object.keys(getIndicatorConfig('', null)).length;
    let biomarkersUpdated = 0;
    Object.keys(getIndicatorConfig('', null)).forEach(id => {
        const history = storageService.get<IndicatorEntry[]>(`${STORAGE_KEYS.PREVENTIVA_INDICATOR_PREFIX}${id}`) || [];
        if (history.length > 0) {
            const lastDate = new Date(history[history.length - 1].date);
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            if (lastDate > oneYearAgo) biomarkersUpdated++;
        }
    });
    
    const screeningItems = document.querySelectorAll('#preventivaDiagnosticos .risk-item[data-diagnostic-id^="exame-"], #preventivaDiagnosticos .risk-item[data-diagnostic-id^="mamografia"], #preventivaDiagnosticos .risk-item[data-diagnostic-id^="papanicolau"], #preventivaDiagnosticos .risk-item[data-diagnostic-id^="colonoscopia"], #preventivaDiagnosticos .risk-item[data-diagnostic-id^="dermatologico"], #preventivaDiagnosticos .risk-item[data-diagnostic-id^="oftalmologico"], #preventivaDiagnosticos .risk-item[data-diagnostic-id^="odontologico"], #preventivaDiagnosticos .risk-item[data-diagnostic-id^="densitometria"]');
    const totalScreenings = screeningItems.length;
    let screeningsInDay = 0;
    screeningItems.forEach(item => {
        const id = (item as HTMLElement).dataset.diagnosticId;
        if(id && diagnostics[id] && diagnostics[id].date) {
             const lastDate = new Date(diagnostics[id].date);
             const oneYearAgo = new Date();
             oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
             if (lastDate > oneYearAgo) screeningsInDay++;
        }
    });

    const totalItems = totalVaccines + totalBiomarkers + totalScreenings;
    const completedItems = vaccinesInDay + biomarkersUpdated + screeningsInDay;
    const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    const vacEl = document.querySelector('#vaccines-status-count');
    if(vacEl) vacEl.textContent = `${vaccinesInDay}/${totalVaccines}`;
    
    const bioEl = document.querySelector('#biomarkers-status-count');
    if(bioEl) bioEl.textContent = `${biomarkersUpdated}/${totalBiomarkers}`;
    
    const scrEl = document.querySelector('#screenings-status-count');
    if(scrEl) scrEl.textContent = `${screeningsInDay}/${totalScreenings}`;

    const progressRing = document.querySelector('#preventiva-progress-ring .circle') as SVGPathElement;
    const progressText = document.querySelector('#preventiva-progress-ring .percentage') as SVGTextElement;
    if (progressRing) progressRing.style.strokeDasharray = `${percentage}, 100`;
    if (progressText) progressText.textContent = `${percentage}%`;
}

// --- VACCINE LOGIC ---
function calculateAndDisplayVaccineStatus(id: string) {
    const row = document.querySelector(`tr[data-vaccine-id="${id}"]`);
    if (!row) return;

    const lastDoseInput = row.querySelector('.vaccine-last-dose') as HTMLInputElement;
    const nextDoseCell = row.querySelector('.vaccine-next-dose') as HTMLElement;
    const statusCell = row.querySelector('.vaccine-status') as HTMLElement;
    
    // Load saved date
    const savedDates = storageService.get<{[key:string]: string}>(STORAGE_KEYS.PREVENTIVA_VACCINES) || {};
    if (savedDates[id]) {
        lastDoseInput.value = savedDates[id];
    }

    const info = vaccineInfo[id];
    const lastDoseDate = lastDoseInput.value ? new Date(lastDoseInput.value) : null;
    const userAge = userProfile ? calculateAge(userProfile.birthDate) : 30; // Default to 30 if no profile
    
    let status = 'Pendente';
    let statusClass = 'status-pending';
    let nextDoseText = '-';

    // Age Check Logic
    if (info.minAge && userAge < info.minAge) {
        status = 'Não aplicável';
        statusClass = 'status-check'; // Use blue/info for "not yet"
        nextDoseText = `A partir dos ${info.minAge} anos`;
    } else if (lastDoseDate) {
        const today = new Date();
        
        if (info.scheduleType === 'booster' || info.scheduleType === 'annual') {
            const validityYears = info.validityYears || 10;
            const nextDose = new Date(lastDoseDate);
            nextDose.setFullYear(nextDose.getFullYear() + validityYears);
            
            nextDoseText = nextDose.toLocaleDateString('pt-BR');
            
            if (today > nextDose) {
                status = 'Atrasada';
                statusClass = 'status-overdue';
            } else {
                status = 'Em dia';
                statusClass = 'status-ok';
            }
        } else {
            // Series or Single - simple check if taken
            status = 'Tomada';
            statusClass = 'status-ok';
            nextDoseText = 'Concluído/Verificar';
        }
    } else {
        // No date entered
        if (info.scheduleType === 'check') {
            status = 'Verificar';
            statusClass = 'status-check';
        }
    }

    statusCell.textContent = status;
    statusCell.className = `vaccine-status ${statusClass}`;
    nextDoseCell.textContent = nextDoseText;

    // Save on change
    lastDoseInput.onchange = () => {
        const dates = storageService.get<{[key:string]: string}>(STORAGE_KEYS.PREVENTIVA_VACCINES) || {};
        dates[id] = lastDoseInput.value;
        storageService.set(STORAGE_KEYS.PREVENTIVA_VACCINES, dates);
        calculateAndDisplayVaccineStatus(id);
        updateDashboard();
    };
}

// --- SUPPLEMENTS LOGIC ---
function renderSupplements() {
    const list = document.getElementById('supplement-protocol-list');
    if (!list) return;
    list.innerHTML = '';

    if (supplements.length === 0) {
        list.innerHTML = '<tr><td colspan="6" class="empty-list-placeholder">Nenhum item no protocolo.</td></tr>';
        return;
    }

    supplements.forEach(sup => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${DOMPurify.sanitize(sup.name)}</td>
            <td>${DOMPurify.sanitize(sup.dosage)}</td>
            <td>${DOMPurify.sanitize(sup.frequency)}</td>
            <td>${sup.time}</td>
            <td>${DOMPurify.sanitize(sup.notes)}</td>
            <td><button class="action-btn delete-supplement-btn delete" data-id="${sup.id}"><i class="fas fa-trash"></i></button></td>
        `;
        list.appendChild(row);
    });

    // Add delete listeners
    list.querySelectorAll('.delete-supplement-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = (e.currentTarget as HTMLElement).dataset.id;
            if(await confirmAction('Remover este item do protocolo?')) {
                supplements = supplements.filter(s => s.id !== id);
                storageService.set(STORAGE_KEYS.PREVENTIVA_SUPPLEMENTS, supplements);
                renderSupplements();
                window.showToast('Item removido.', 'success');
            }
        });
    });
}

// --- DIAGNOSTICS LOGIC ---
function loadDiagnostics() {
    diagnostics = storageService.get<{ [key: string]: Diagnostic }>(STORAGE_KEYS.PREVENTIVA_DIAGNOSTICS) || {};
    
    document.querySelectorAll('.risk-item').forEach(item => {
        const id = (item as HTMLElement).dataset.diagnosticId;
        if (!id) return;

        const toggle = item.querySelector('.diagnostic-toggle') as HTMLInputElement;
        const details = item.querySelector('.risk-details') as HTMLElement;
        
        // Load state
        if (diagnostics[id]) {
            if (diagnostics[id].enabled) {
                toggle.checked = true;
                details.style.display = 'flex';
            }
            
            // Populate inputs
            const inputs = details.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                const el = input as HTMLInputElement | HTMLTextAreaElement;
                if (el.classList.contains('diagnostic-date')) el.value = diagnostics[id].date || '';
                if (el.classList.contains('diagnostic-type')) el.value = diagnostics[id].type || '';
                if (el.classList.contains('diagnostic-medication')) el.value = diagnostics[id].medication || '';
                if (el.classList.contains('diagnostic-notes')) el.value = diagnostics[id].notes || '';
                if (el.classList.contains('diagnostic-severity')) el.value = diagnostics[id].severity || '';
            });
        }

        // Event Listeners for Toggle
        toggle.addEventListener('change', () => {
            details.style.display = toggle.checked ? 'flex' : 'none';
            saveDiagnostic(id);
        });

        // Event Listeners for Inputs (Auto-save)
        details.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('change', () => saveDiagnostic(id));
        });
    });
}

function saveDiagnostic(id: string) {
    const item = document.querySelector(`.risk-item[data-diagnostic-id="${id}"]`);
    if (!item) return;

    const toggle = item.querySelector('.diagnostic-toggle') as HTMLInputElement;
    const details = item.querySelector('.risk-details') as HTMLElement;

    const data: Diagnostic = {
        id: id,
        enabled: toggle.checked,
        date: (details.querySelector('.diagnostic-date') as HTMLInputElement)?.value || '',
        type: (details.querySelector('.diagnostic-type') as HTMLInputElement)?.value || '',
        medication: (details.querySelector('.diagnostic-medication') as HTMLInputElement)?.value || '',
        notes: (details.querySelector('.diagnostic-notes') as HTMLTextAreaElement)?.value || '',
        severity: (details.querySelector('.diagnostic-severity') as HTMLInputElement)?.value || '',
    };

    diagnostics[id] = data;
    storageService.set(STORAGE_KEYS.PREVENTIVA_DIAGNOSTICS, diagnostics);
    updateDashboard(); // Update dashboard as screenings might have changed
}


// --- INDICATOR LOGIC (Existing + Helpers) ---
function renderIndicatorCard(indicatorId: string) {
    const card = document.querySelector(`.indicator-card[data-indicator-id="${indicatorId}"]`) as HTMLElement;
    if (!card) return;

    const config = getIndicatorConfig(indicatorId, userProfile);
    if (!config) return; 
    
    const history = storageService.get<IndicatorEntry[]>(`${STORAGE_KEYS.PREVENTIVA_INDICATOR_PREFIX}${indicatorId}`) || [];
    const lastEntry = history.length > 0 ? history[history.length - 1] : { value: null, date: '' };

    (card.querySelector('.indicator-value') as HTMLInputElement).value = lastEntry.value?.toString() ?? '';
    (card.querySelector('.indicator-date') as HTMLInputElement).value = lastEntry.date || '';

    const interpretationEl = card.querySelector('.interpretation') as HTMLElement;
    const suggestionEl = card.querySelector('.suggestion') as HTMLElement;
    const marker = card.querySelector('.marker') as HTMLElement;
    const overdueWarning = card.querySelector('.overdue-warning') as HTMLElement;

    if (lastEntry.value !== null && !isNaN(lastEntry.value)) {
        const zone = config.zones.find((z: any) => lastEntry.value! <= z.to) || config.zones[config.zones.length - 1];
        interpretationEl.textContent = zone.status;
        suggestionEl.textContent = zone.tip;
        interpretationEl.className = `interpretation status-${zone.status.toLowerCase().replace(/ /g, '-')}`;
        const percentage = Math.max(0, Math.min(100, ((lastEntry.value - config.min) / (config.max - config.min)) * 100));
        marker.style.left = `${percentage}%`;
    } else {
        interpretationEl.textContent = 'N/A';
        suggestionEl.textContent = 'Insira um valor.';
        marker.style.left = `-100%`;
    }

    if (lastEntry.date) {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        overdueWarning.style.display = new Date(lastEntry.date) < oneYearAgo ? 'block' : 'none';
    } else {
        overdueWarning.style.display = 'none';
    }
}

function updateIndicator(indicatorId: string) {
    const card = document.querySelector(`.indicator-card[data-indicator-id="${indicatorId}"]`) as HTMLElement;
    if (!card) return;

    const valueInput = card.querySelector('.indicator-value') as HTMLInputElement;
    const dateInput = card.querySelector('.indicator-date') as HTMLInputElement;
    
    if (!valueInput.value || !dateInput.value) {
        window.showToast('Por favor, insira o valor e a data.', 'warning');
        return;
    }
    const newEntry: IndicatorEntry = {
        value: parseFloat(valueInput.value),
        date: dateInput.value,
    };

    let history = storageService.get<IndicatorEntry[]>(`${STORAGE_KEYS.PREVENTIVA_INDICATOR_PREFIX}${indicatorId}`) || [];
    history.push(newEntry);
    history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    storageService.set(`${STORAGE_KEYS.PREVENTIVA_INDICATOR_PREFIX}${indicatorId}`, history);
    
    window.showToast(`${getIndicatorConfig(indicatorId, userProfile).name} atualizado!`, 'success');
    renderIndicatorCard(indicatorId);
    updateDashboard();
}

function openHistoryModal(indicatorId: string) {
    const modal = document.getElementById('biomarker-history-modal') as HTMLElement;
    const titleEl = document.getElementById('biomarker-history-title') as HTMLElement;
    const chartContainer = document.getElementById('biomarker-chart-container') as HTMLElement;
    const noHistoryEl = document.getElementById('biomarker-no-history') as HTMLElement;
    
    const config = getIndicatorConfig(indicatorId, userProfile);
    titleEl.textContent = `Histórico de ${config.name}`;

    const history = storageService.get<IndicatorEntry[]>(`${STORAGE_KEYS.PREVENTIVA_INDICATOR_PREFIX}${indicatorId}`) || [];

    if (history.length < 2) {
        chartContainer.style.display = 'none';
        noHistoryEl.style.display = 'block';
    } else {
        chartContainer.style.display = 'block';
        noHistoryEl.style.display = 'none';
        
        if (historyChart) historyChart.destroy();

        const ctx = (document.getElementById('biomarker-history-chart') as HTMLCanvasElement).getContext('2d');
        historyChart = new window.Chart(ctx, {
            type: 'line',
            data: {
                labels: history.map(h => new Date(h.date + 'T00:00:00').toLocaleDateString('pt-BR')),
                datasets: [{
                    label: config.name,
                    data: history.map(h => h.value),
                    borderColor: 'var(--color-preventiva)',
                    backgroundColor: 'rgba(var(--color-preventiva-rgb), 0.1)',
                    fill: true,
                    tension: 0.1,
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    modal.style.display = 'flex';
}

function showSubPage(pageId: string) {
    const mainContainer = document.getElementById('page-preventiva')!;
    mainContainer.querySelectorAll('.preventiva-page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId)?.classList.add('active');
    (document.getElementById('preventivaBackButton') as HTMLElement).style.display = 'block';
    const title = document.querySelector(`#${pageId} .section-title`)?.textContent || 'Saúde Preventiva';
    (document.getElementById('preventivaMainTitle') as HTMLElement).textContent = title;
}

function showMainMenu() {
    const page = document.getElementById('page-preventiva')!;
    page.querySelectorAll('.preventiva-page').forEach(p => p.classList.remove('active'));
    document.getElementById('preventivaMainMenu')?.classList.add('active');
    (document.getElementById('preventivaBackButton') as HTMLElement).style.display = 'none';
    (document.getElementById('preventivaMainTitle') as HTMLElement).textContent = 'Saúde Preventiva';
    updateDashboard();
}

async function handleAnalyzeBiomarkers() {
    const button = document.getElementById('analyze-biomarkers-btn') as HTMLButtonElement;
    if (!button) return;

    // Collect data
    const age = userProfile ? calculateAge(userProfile.birthDate) : 'Desconhecida';
    const sex = userProfile ? (userProfile.sex === 'male' ? 'Masculino' : 'Feminino') : 'Desconhecido';
    
    // Collect biomarkers
    const biomarkers: string[] = [];
    Object.keys(getIndicatorConfig('', null)).forEach(id => {
        const history = storageService.get<IndicatorEntry[]>(`${STORAGE_KEYS.PREVENTIVA_INDICATOR_PREFIX}${id}`) || [];
        if (history.length > 0) {
            const latest = history[history.length - 1];
            const config = getIndicatorConfig(id, userProfile);
            biomarkers.push(`${config.name}: ${latest.value} ${config.unit} (Data: ${new Date(latest.date).toLocaleDateString('pt-BR')})`);
        }
    });

    // Collect diagnostics
    const activeDiagnostics: string[] = [];
    Object.values(diagnostics).forEach(d => {
        if (d.enabled) {
            let info = d.id;
            if (d.medication) info += ` (Med: ${d.medication})`;
            activeDiagnostics.push(info);
        }
    });

    // Collect supplements
    const activeSupplements = supplements.map(s => `${s.name} ${s.dosage}`);

    if (biomarkers.length === 0 && activeDiagnostics.length === 0) {
        window.showToast('Adicione alguns exames ou diagnósticos para análise.', 'info');
        return;
    }

    loadingManager.start('ai-analyze');
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analisando...';

    const prompt = `Aja como um médico especialista em longevidade e medicina preventiva. Analise os seguintes dados de um paciente:
    
    Sexo: ${sex}
    Idade: ${age} anos
    
    Biomarcadores Recentes:
    ${biomarkers.join('\n') || 'Nenhum registrado'}
    
    Diagnósticos/Condições:
    ${activeDiagnostics.join('\n') || 'Nenhum registrado'}
    
    Protocolo de Suplementação:
    ${activeSupplements.join('\n') || 'Nenhum registrado'}
    
    Forneça uma análise concisa e profissional contendo:
    1. Resumo do estado metabólico e inflamatório (baseado nos dados disponíveis).
    2. Identificação de riscos potenciais ou correlações preocupantes (ex: relação Triglicerídeos/HDL).
    3. Três sugestões práticas e baseadas em evidências de estilo de vida ou nutrição para otimização.
    
    Use formatação Markdown com negrito para pontos chave.`;

    try {
        // FIX: Using recommended gemini-3-flash-preview model for analysis tasks.
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        openAiInsightsModal(response.text);
    } catch (error) {
        console.error('AI Error:', error);
        window.showToast('Erro ao analisar dados. Tente novamente.', 'error');
    } finally {
        loadingManager.stop('ai-analyze');
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-brain"></i> Analisar com IA';
    }
}


// --- LIFECYCLE FUNCTIONS ---
export function setup() {
    const page = document.getElementById('page-preventiva');
    if (!page) return;

    // Main navigation
    page.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement;
        const menuItem = target.closest<HTMLElement>('.menu-item');
        if (menuItem?.dataset.target) {
            e.preventDefault();
            showSubPage(menuItem.dataset.target);
        }
        if (target.closest('#preventivaBackButton')) showMainMenu();
    });

    // Biomarkers
    page.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const updateBtn = target.closest('.update-button');
        if (updateBtn) {
            const card = target.closest<HTMLElement>('.indicator-card');
            if (card?.dataset.indicatorId) updateIndicator(card.dataset.indicatorId);
        }
        const historyBtn = target.closest('.history-btn');
        if (historyBtn) {
            const card = target.closest<HTMLElement>('.indicator-card');
            if (card?.dataset.indicatorId) openHistoryModal(card.dataset.indicatorId);
        }
    });
    
    document.getElementById('biomarker-history-close-btn')?.addEventListener('click', () => {
        (document.getElementById('biomarker-history-modal') as HTMLElement).style.display = 'none';
    });

    document.getElementById('analyze-biomarkers-btn')?.addEventListener('click', handleAnalyzeBiomarkers);

    // Profile
    const profileForm = document.getElementById('user-profile-form') as HTMLFormElement;
    profileForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        userProfile = {
            birthDate: (document.getElementById('user-birthdate') as HTMLInputElement).value,
            sex: (document.getElementById('user-sex') as HTMLSelectElement).value as 'male' | 'female',
        };
        storageService.set(STORAGE_KEYS.PREVENTIVA_PROFILE, userProfile);
        window.showToast('Perfil salvo!', 'success');
        // Re-render indicators with new profile info
        Object.keys(getIndicatorConfig('',null)).forEach(renderIndicatorCard);
        
        // Update vaccines based on new age
        Object.keys(vaccineInfo).forEach(id => calculateAndDisplayVaccineStatus(id));

        // Refresh Gender specific fields visibility
        document.querySelectorAll<HTMLElement>('.risk-item[data-gender-specific]').forEach(item => {
            const requiredGender = item.dataset.genderSpecific;
            item.style.display = (!userProfile || userProfile.sex === requiredGender) ? '' : 'none';
        });
        
        // Refresh biomarkers that depend on sex (like HDL)
        Object.keys(getIndicatorConfig('', null)).forEach(renderIndicatorCard);
    });
    
    // Supplement Form
    const supplementForm = document.getElementById('add-supplement-form') as HTMLFormElement;
    supplementForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const newSup: Supplement = {
            id: Date.now().toString(),
            name: (document.getElementById('supplement-name') as HTMLInputElement).value,
            dosage: (document.getElementById('supplement-dosage') as HTMLInputElement).value,
            frequency: (document.getElementById('supplement-frequency') as HTMLInputElement).value,
            time: (document.getElementById('supplement-time') as HTMLInputElement).value,
            notes: (document.getElementById('supplement-notes') as HTMLInputElement).value,
        };
        supplements.push(newSup);
        storageService.set(STORAGE_KEYS.PREVENTIVA_SUPPLEMENTS, supplements);
        renderSupplements();
        supplementForm.reset();
        window.showToast('Suplemento adicionado.', 'success');
    });
}

export function show() {
    userProfile = storageService.get<UserProfile>(STORAGE_KEYS.PREVENTIVA_PROFILE) || null;
    if (userProfile) {
        (document.getElementById('user-birthdate') as HTMLInputElement).value = userProfile.birthDate;
        (document.getElementById('user-sex') as HTMLSelectElement).value = userProfile.sex;
    }
    
    document.querySelectorAll<HTMLElement>('.risk-item[data-gender-specific]').forEach(item => {
        const requiredGender = item.dataset.genderSpecific;
        item.style.display = (!userProfile || userProfile.sex === requiredGender) ? '' : 'none';
    });
    
    showMainMenu();
    
    // Initialize Data
    Object.keys(vaccineInfo).forEach(id => calculateAndDisplayVaccineStatus(id));
    Object.keys(getIndicatorConfig('', null)).forEach(renderIndicatorCard);
    
    supplements = storageService.get<Supplement[]>(STORAGE_KEYS.PREVENTIVA_SUPPLEMENTS) || [];
    renderSupplements();
    
    loadDiagnostics();
    updateDashboard();
}
