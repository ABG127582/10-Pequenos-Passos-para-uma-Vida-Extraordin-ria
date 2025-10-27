// reflexoes.ts - Unified Reflections Page Logic

import DOMPurify from 'dompurify';
import { storageService } from './storage';
import { STORAGE_KEYS } from './constants';
import { confirmAction, debounce } from './utils';
// Fix: The 'Task' type is not exported from 'tarefas.ts'. It is not explicitly used here, so it is removed from the import.
import { getCategories, getTasks } from './tarefas';
import { ai } from './ai';
import { loadingManager } from './loadingManager';
import { errorHandler } from './errorHandler';
import { Reflection } from './types';

// --- CONSTANTS & STATE ---
const categoryMap: { [key: string]: { name: string; color: string; } } = {
    'Física': { name: 'Física', color: 'var(--color-fisica)' },
    'Mental': { name: 'Mental', color: 'var(--color-mental)' },
    'Financeira': { name: 'Financeira', color: 'var(--color-financeira)' },
    'Familiar': { name: 'Familiar', color: 'var(--color-familiar)' },
    'Profissional': { name: 'Profissional', color: 'var(--color-profissional)' },
    'Social': { name: 'Social', color: 'var(--color-social)' },
    'Espiritual': { name: 'Espiritual', color: 'var(--color-espiritual)' },
    'Pessoal': { name: 'Pessoal', color: 'var(--color-pessoal)' },
};

let allReflections: Reflection[] = [];
let filteredReflections: Reflection[] = [];
let elements: { [key: string]: HTMLElement | null } = {};

// --- UTILITY FUNCTIONS ---
const getEl = <T extends HTMLElement>(selector: string, context: HTMLElement) => context.querySelector(selector) as T;

// --- TAB SWITCHING LOGIC ---
function switchTab(tabId: 'diaria' | 'historico') {
    elements.page?.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    elements.page?.querySelectorAll('.tab-link').forEach(el => el.classList.remove('active'));

    document.getElementById(`tab-${tabId}`)?.classList.add('active');
    elements.page?.querySelector(`.tab-link[data-tab="${tabId}"]`)?.classList.add('active');
}

// --- REFLECTION FORM LOGIC ---
function handleReflectionSubmit(e: Event) {
    e.preventDefault();
    if (!elements.form || !elements.formCategorySelect || !elements.formTitleInput || !elements.formTextInput) return;

    const category = (elements.formCategorySelect as HTMLSelectElement).value;
    const title = (elements.formTitleInput as HTMLInputElement).value.trim();
    const mainText = (elements.formTextInput as HTMLTextAreaElement).value.trim();

    if (!title || !mainText) {
        window.app.showToast('Por favor, preencha o título e o texto da reflexão principal.', 'info');
        return;
    }

    // Gather text from schedule reflection inputs
    let scheduleReflectionsText = '';
    const scheduleInputs = elements.page?.querySelectorAll<HTMLTextAreaElement>('.reflection-schedule-input');
    if (scheduleInputs) {
        scheduleInputs.forEach(input => {
            const reflectionText = input.value.trim();
            if (reflectionText) {
                const taskTitle = input.dataset.taskTitle || 'Tarefa';
                const taskTime = input.dataset.taskTime ? `(${input.dataset.taskTime})` : '';
                scheduleReflectionsText += `\n\n**Reflexão sobre ${taskTitle} ${taskTime}:**\n${reflectionText}`;
            }
        });
    }

    const combinedText = mainText + scheduleReflectionsText;
    
    const now = new Date();
    const newReflection: Reflection = {
        id: `${now.getTime()}-${Math.random()}`,
        category: category,
        title: title,
        text: combinedText,
        date: now.toISOString().split('T')[0],
        timestamp: now.getTime()
    };

    allReflections.unshift(newReflection);
    storageService.set(STORAGE_KEYS.UNIFIED_REFLECTIONS, allReflections);

    window.app.showToast(`Reflexão "${title}" salva na categoria ${category}!`, 'success');
    
    (elements.form as HTMLFormElement).reset();
    (elements.formTextInput as HTMLTextAreaElement).dispatchEvent(new Event('input'));
    
    // Also reset schedule inputs
    scheduleInputs?.forEach(input => {
        input.value = '';
        input.dispatchEvent(new Event('input'));
    });
    
    renderReflections();
    switchTab('historico');
}

function setupAutoResizeTextareas(container: HTMLElement | null, selector: string) {
    if (!container) return;
    container.querySelectorAll<HTMLTextAreaElement>(selector).forEach(textarea => {
        const adjustHeight = () => {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        };
        textarea.addEventListener('input', adjustHeight);
        adjustHeight(); // Initial call
    });
}

function populateCategories() {
    const categories = ['Pessoal', ...getCategories()];
    const formSelect = elements.formCategorySelect as HTMLSelectElement;
    const historySelect = elements.historyCategoryFilter as HTMLSelectElement;

    if (formSelect) {
        formSelect.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }
    if (historySelect) {
        historySelect.innerHTML = '<option value="all">Todas</option>';
        Object.keys(categoryMap).forEach(key => {
             const option = document.createElement('option');
             option.value = key;
             option.textContent = key;
             historySelect.appendChild(option);
        });
    }
}

// --- SCHEDULE REFLECTION ---
function renderReflectionSchedule() {
    if (!elements.reflectionScheduleContainer) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const todaysTasks = getTasks()
        .filter(task => task.dueDate === todayStr && task.startTime)
        .sort((a, b) => (a.startTime || '23:59').localeCompare(b.startTime || '23:59'));

    if (todaysTasks.length === 0) {
        elements.reflectionScheduleContainer.innerHTML = `<p class="empty-list-placeholder" style="border: none; padding: 0;">Nenhuma tarefa agendada para hoje. Adicione tarefas no seu <a href="#planejamento-diario" data-page="planejamento-diario">Planejamento Diário</a>.</p>`;
        return;
    }

    elements.reflectionScheduleContainer.innerHTML = todaysTasks.map(task => {
        const time = task.startTime + (task.endTime ? ` - ${task.endTime}` : '');
        return `
            <div class="reflection-schedule-item">
                <div class="reflection-schedule-task-info">
                    <span class="task-title">${DOMPurify.sanitize(task.title)}</span>
                    <span class="task-time"><i class="fas fa-clock"></i> ${time}</span>
                </div>
                <div class="input-wrapper textarea-wrapper">
                    <textarea
                        class="reflection-schedule-input input-minimal"
                        rows="1"
                        placeholder="Digite ou toque no microfone para refletir..."
                        data-task-title="${DOMPurify.sanitize(task.title)}"
                        data-task-time="${time}"
                    ></textarea>
                    <button type="button" class="clear-input-btn" title="Limpar"><i class="fas fa-times-circle"></i></button>
                    <button type="button" class="speech-to-text-btn" title="Digitar por Voz"><i class="fas fa-microphone"></i></button>
                </div>
            </div>
        `;
    }).join('');

    setupAutoResizeTextareas(elements.reflectionScheduleContainer, '.reflection-schedule-input');
}


// --- HISTORY TAB LOGIC ---
function loadReflections() {
    allReflections = storageService.get<Reflection[]>(STORAGE_KEYS.UNIFIED_REFLECTIONS) || [];
}

function applyFilters() {
    const searchTerm = (elements.searchInput as HTMLInputElement).value.toLowerCase();
    const category = (elements.historyCategoryFilter as HTMLSelectElement).value;
    const dateRange = (elements.dateFilter as HTMLSelectElement).value;
    const sortOrder = (elements.sortFilter as HTMLSelectElement).value;

    let result = [...allReflections];
    
    if (searchTerm) {
        result = result.filter(r =>
            r.text.toLowerCase().includes(searchTerm) ||
            r.title.toLowerCase().includes(searchTerm)
        );
    }
    if (category !== 'all') result = result.filter(r => r.category === category);

    if (dateRange !== 'all') {
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        let startTime: number;
        switch (dateRange) {
            case 'today':
                const todayStart = new Date();
                todayStart.setHours(0,0,0,0);
                startTime = todayStart.getTime();
                break;
            case 'week': startTime = now.getTime() - 7 * 24 * 60 * 60 * 1000; break;
            case 'month': startTime = now.getTime() - 30 * 24 * 60 * 60 * 1000; break;
            default: startTime = 0;
        }
        result = result.filter(r => r.timestamp >= startTime);
    }

    result.sort((a, b) => sortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);
    filteredReflections = result;
}

function createReflectionCardElement(reflection: Reflection): HTMLElement {
    const categoryInfo = categoryMap[reflection.category] || { name: reflection.category, color: 'var(--color-secondary)' };
    const formattedDate = new Date(reflection.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const card = document.createElement('div');
    card.className = 'reflection-card-item';
    card.style.borderLeftColor = categoryInfo.color;
    card.dataset.id = reflection.id;

    const p = document.createElement('p');
    p.innerHTML = DOMPurify.sanitize(reflection.text).replace(/\n/g, '<br>');

    const isLongText = p.scrollHeight > 120 || p.innerText.length > 300;

    card.innerHTML = `
        <div class="reflection-card-header">
            <span class="reflection-card-category" style="background-color: ${categoryInfo.color};">${DOMPurify.sanitize(categoryInfo.name)}</span>
            <span class="reflection-card-date">${formattedDate}</span>
        </div>
        <div class="reflection-card-body">
            <strong class="reflection-title">${DOMPurify.sanitize(reflection.title)}</strong>
            <p>${p.innerHTML}</p>
            ${isLongText ? '<button class="expand-reflection-btn">Ler mais</button>' : ''}
        </div>
        <div class="reflection-card-actions">
            <button class="action-btn delete-reflection-btn delete" aria-label="Excluir reflexão"><i class="fas fa-trash"></i></button>
        </div>
    `;

    if (isLongText) {
        const textEl = card.querySelector('p')!;
        const btn = card.querySelector('.expand-reflection-btn')!;
        btn.addEventListener('click', () => {
            textEl.classList.toggle('expanded');
            btn.textContent = textEl.classList.contains('expanded') ? 'Ler menos' : 'Ler mais';
        });
    }

    return card;
}


function renderReflections() {
    applyFilters();
    const fragment = document.createDocumentFragment();
    if (filteredReflections.length === 0) {
        (elements.emptyState as HTMLElement).style.display = 'block';
        (elements.listContainer as HTMLElement).innerHTML = '';
        (elements.generateInsightsBtn as HTMLButtonElement).disabled = true;
    } else {
        (elements.emptyState as HTMLElement).style.display = 'none';
        (elements.generateInsightsBtn as HTMLButtonElement).disabled = false;
        filteredReflections.forEach(reflection => {
            fragment.appendChild(createReflectionCardElement(reflection));
        });
        (elements.listContainer as HTMLElement).replaceChildren(fragment);
    }
}

async function handleDeleteReflection(e: Event) {
    const target = e.target as HTMLElement;
    const deleteBtn = target.closest('.delete-reflection-btn');
    if (!deleteBtn) return;
    
    const card = deleteBtn.closest<HTMLElement>('.reflection-card-item');
    if (!card?.dataset.id) return;
    
    const reflectionId = card.dataset.id;
    
    const confirmed = await window.app.confirmAction('Tem certeza que deseja excluir esta reflexão?');
    if (confirmed) {
        allReflections = allReflections.filter(r => r.id !== reflectionId);
        storageService.set(STORAGE_KEYS.UNIFIED_REFLECTIONS, allReflections);
        window.app.showToast('Reflexão excluída.', 'success');
        renderReflections();
    }
}

async function handleGenerateInsights() {
    if (filteredReflections.length === 0) {
        window.app.showToast('Não há reflexões para analisar.', 'info');
        return;
    }
    const generateBtn = elements.generateInsightsBtn as HTMLButtonElement;
    const btnText = generateBtn.querySelector('.btn-text') as HTMLElement;

    loadingManager.start('ai-insights');
    generateBtn.classList.add('loading');
    generateBtn.disabled = true;
    if (btnText) btnText.textContent = 'Gerando...';

    const combinedReflections = filteredReflections.map(r => `Data: ${r.date}\nTítulo: ${r.title}\nCategoria: ${r.category}\nReflexão: ${r.text}`).join('\n\n---\n\n');
    const prompt = `Aja como um psicólogo compassivo e analista de padrões. Analise as seguintes entradas de diário. Identifique temas recorrentes, padrões emocionais e áreas de força. Apresente suas percepções em uma lista de marcadores ('*'). As entradas são:\n\n${combinedReflections}`;

    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const insights = response.text;
        openInsightsModal(insights);
    } catch (error) {
        errorHandler.handle(error as Error, 'generating AI insights');
    } finally {
        loadingManager.stop('ai-insights');
        if (btnText) btnText.textContent = 'Gerar Insights';
        generateBtn.classList.remove('loading');
        generateBtn.disabled = false;
    }
}

function openInsightsModal(content: string) {
    (elements.aiInsightsBody as HTMLElement).innerHTML = DOMPurify.sanitize(content.replace(/\* /g, '• ').replace(/\n/g, '<br>'));
    (elements.aiInsightsModal as HTMLElement).style.display = 'flex';
}

function handlePromptChipClick(e: Event) {
    const target = e.target as HTMLElement;
    const chip = target.closest<HTMLButtonElement>('.prompt-chip');
    if (!chip || !chip.dataset.prompt || !elements.formTextInput) return;

    const textarea = elements.formTextInput as HTMLTextAreaElement;
    const promptText = `\n**${chip.dataset.prompt}**\n`;
    
    textarea.value += promptText;
    textarea.focus();
    textarea.dispatchEvent(new Event('input')); // Trigger auto-resize
}

// --- LIFECYCLE FUNCTIONS ---
export function setup() {
    const page = document.getElementById('page-reflexoes');
    if (!page) return;

    elements = {
        page,
        tabDiariaBtn: getEl('[data-tab="diaria"]', page),
        tabHistoricoBtn: getEl('[data-tab="historico"]', page),
        reflectionScheduleContainer: getEl('#reflection-schedule-container', page),
        form: getEl('#central-reflection-form', page),
        formCategorySelect: getEl('#reflection-category', page),
        formTitleInput: getEl('#reflection-title', page),
        formTextInput: getEl('#reflection-text', page),
        inspirationPrompts: getEl('.inspiration-prompts', page),
        searchInput: getEl('#reflexoes-search-input', page),
        historyCategoryFilter: getEl('#reflexoes-category-filter-history', page),
        dateFilter: getEl('#reflexoes-date-filter', page),
        sortFilter: getEl('#reflexoes-sort-filter', page),
        listViewBtn: getEl('#list-view-btn', page),
        gridViewBtn: getEl('#grid-view-btn', page),
        listContainer: getEl('#reflexoes-list-container', page),
        emptyState: getEl('#reflexoes-empty-state', page),
        generateInsightsBtn: getEl('#generate-insights-btn', page),
        aiInsightsModal: document.getElementById('ai-insights-modal'),
        aiInsightsBody: document.getElementById('ai-insights-body'),
    };

    // --- Attach Listeners ---
    elements.tabDiariaBtn?.addEventListener('click', () => switchTab('diaria'));
    elements.tabHistoricoBtn?.addEventListener('click', () => {
        // Fix: This was the corrupted line. It now correctly loads and renders reflections before switching the tab.
        loadReflections();
        renderReflections();
        switchTab('historico');
    });

    elements.form?.addEventListener('submit', handleReflectionSubmit);
    elements.inspirationPrompts?.addEventListener('click', handlePromptChipClick);
    
    // Auto-resize for main textarea
    if (elements.formTextInput) {
        setupAutoResizeTextareas(page, '#reflection-text');
    }

    // Filters for history tab
    const debouncedRender = debounce(renderReflections, 300);
    elements.searchInput?.addEventListener('input', debouncedRender);
    elements.historyCategoryFilter?.addEventListener('change', renderReflections);
    elements.dateFilter?.addEventListener('change', renderReflections);
    elements.sortFilter?.addEventListener('change', renderReflections);

    // List actions
    elements.listContainer?.addEventListener('click', handleDeleteReflection);

    // AI insights
    elements.generateInsightsBtn?.addEventListener('click', handleGenerateInsights);
    document.getElementById('ai-insights-close-btn')?.addEventListener('click', () => {
        if (elements.aiInsightsModal) elements.aiInsightsModal.style.display = 'none';
    });
    
    // Close AI modal with OK button
    document.getElementById('ai-insights-ok-btn')?.addEventListener('click', () => {
        if (elements.aiInsightsModal) elements.aiInsightsModal.style.display = 'none';
    });
    
    // Copy AI insights
    document.getElementById('ai-insights-copy-btn')?.addEventListener('click', () => {
        if (elements.aiInsightsBody) {
            navigator.clipboard.writeText(elements.aiInsightsBody.innerText)
                .then(() => window.app.showToast('Insights copiados!', 'success'))
                .catch(() => window.app.showToast('Falha ao copiar.', 'error'));
        }
    });

    // View toggle
    elements.listViewBtn?.addEventListener('click', () => {
        elements.listContainer?.classList.remove('grid-view');
        elements.listViewBtn?.classList.add('active');
        elements.gridViewBtn?.classList.remove('active');
    });
    elements.gridViewBtn?.addEventListener('click', () => {
        elements.listContainer?.classList.add('grid-view');
        elements.gridViewBtn?.classList.add('active');
        elements.listViewBtn?.classList.remove('active');
    });
}

export function show() {
    loadReflections();
    populateCategories();
    renderReflectionSchedule();
    renderReflections();
    switchTab('diaria'); // Default to daily reflection tab
    
    // Reset form and filters
    if (elements.form) (elements.form as HTMLFormElement).reset();
    if (elements.searchInput) (elements.searchInput as HTMLInputElement).value = '';
    if (elements.historyCategoryFilter) (elements.historyCategoryFilter as HTMLSelectElement).value = 'all';
    if (elements.dateFilter) (elements.dateFilter as HTMLSelectElement).value = 'all';
    if (elements.sortFilter) (elements.sortFilter as HTMLSelectElement).value = 'desc';

    // Reset view to list
    elements.listContainer?.classList.remove('grid-view');
    elements.listViewBtn?.classList.add('active');
    elements.gridViewBtn?.classList.remove('active');
}