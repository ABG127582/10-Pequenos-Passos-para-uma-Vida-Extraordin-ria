import DOMPurify from 'dompurify';
import { confirmAction, showMedalAnimation, awardMedalForCategory, updateStreak } from './utils';
import { STORAGE_KEYS } from './constants';
import { storageService } from './storage';
import { ai } from './ai';
import { errorHandler } from './errorHandler';
import { getTasks, openTaskModal, updateTask, deleteTask } from './tarefas';


// Type definitions
interface Asset {
    id: string;
    name: string;
    purchaseDate: string; // YYYY-MM-DD
}

// Re-declare window interface
declare global {
    interface Window {
        showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    }
}

// --- Module-scoped state ---
let assets: Asset[] = [];
let editingAssetId: string | null = null;

// --- DOM Elements ---
const elements = {
    pageContainer: null as HTMLElement | null,
    // Tasks
    tasksList: null as HTMLUListElement | null,
    addTaskBtn: null as HTMLButtonElement | null,
    // Asset Replacement
    assetList: null as HTMLTableSectionElement | null,
    assetForm: null as HTMLFormElement | null,
    assetNameInput: null as HTMLInputElement | null,
    assetPurchaseDateInput: null as HTMLInputElement | null,
    // Asset Modal
    assetModal: null as HTMLElement | null,
    assetModalForm: null as HTMLFormElement | null,
    assetModalCloseBtn: null as HTMLButtonElement | null,
    assetModalCancelBtn: null as HTMLButtonElement | null,
    saveAssetEditBtn: null as HTMLButtonElement | null,
    assetNameEditInput: null as HTMLInputElement | null,
    assetPurchaseDateEditInput: null as HTMLInputElement | null,
    // Reflection
    reflectionForm: null as HTMLFormElement | null,
};


// --- ASSET REPLACEMENT ---
const renderAssets = () => {
    if (!elements.assetList) return;
    elements.assetList.innerHTML = '';

    if (assets.length === 0) {
        elements.assetList.innerHTML = `<tr><td colspan="4" class="empty-list-placeholder">Nenhum item adicionado.</td></tr>`;
        return;
    }

    assets.sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());

    assets.forEach(asset => {
        const purchaseDate = new Date(asset.purchaseDate + 'T00:00:00');
        const replacementDate = new Date(purchaseDate);
        replacementDate.setFullYear(replacementDate.getFullYear() + 7);

        const row = document.createElement('tr');
        row.dataset.id = asset.id;

        row.innerHTML = `
            <td>${DOMPurify.sanitize(asset.name)}</td>
            <td>${purchaseDate.toLocaleDateString('pt-BR')}</td>
            <td>${replacementDate.toLocaleDateString('pt-BR')}</td>
            <td>
                <div class="item-actions">
                    <button class="action-btn edit" aria-label="Editar item"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" aria-label="Apagar item"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        elements.assetList!.appendChild(row);
    });
};

const handleAddAsset = (e: Event) => {
    e.preventDefault();
    if (!elements.assetNameInput || !elements.assetPurchaseDateInput) return;
    const name = elements.assetNameInput.value.trim();
    const purchaseDate = elements.assetPurchaseDateInput.value;

    if (name && purchaseDate) {
        const newAsset: Asset = { id: Date.now().toString(), name, purchaseDate };
        assets.unshift(newAsset);
        storageService.set(STORAGE_KEYS.FINANCE_ASSETS, assets);
        renderAssets();
        elements.assetForm?.reset();
    } else {
        window.showToast('Por favor, preencha o nome e a data de compra do item.', 'warning');
    }
};

const openAssetModal = (asset: Asset) => {
    if (!elements.assetModal || !elements.assetNameEditInput || !elements.assetPurchaseDateEditInput) return;
    editingAssetId = asset.id;
    elements.assetNameEditInput.value = asset.name;
    elements.assetPurchaseDateEditInput.value = asset.purchaseDate;
    elements.assetModal.style.display = 'flex';
    elements.assetNameEditInput.focus();
};

const closeAssetModal = () => {
    if (!elements.assetModal) return;
    elements.assetModal.style.display = 'none';
    editingAssetId = null;
};

const handleSaveAssetEdit = (e: Event) => {
    e.preventDefault();
    if (!editingAssetId || !elements.assetNameEditInput || !elements.assetPurchaseDateEditInput) return;
    const name = elements.assetNameEditInput.value.trim();
    const purchaseDate = elements.assetPurchaseDateEditInput.value;

    if (name && purchaseDate) {
        const assetIndex = assets.findIndex(a => a.id === editingAssetId);
        if (assetIndex > -1) {
            assets[assetIndex] = { ...assets[assetIndex], name, purchaseDate };
            storageService.set(STORAGE_KEYS.FINANCE_ASSETS, assets);
            renderAssets();
            closeAssetModal();
        }
    } else {
        window.showToast('O nome e a data são obrigatórios.', 'warning');
    }
};

const handleAssetListClick = async (e: Event) => {
    const target = e.target as HTMLElement;
    // FIX: Cast the result of closest() to HTMLTableRowElement to access dataset property.
    const row = target.closest<HTMLTableRowElement>('tr[data-id]');
    if (!row || !row.dataset.id) return;
    const assetId = row.dataset.id;
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    if (target.closest('.edit')) {
        openAssetModal(asset);
    } else if (target.closest('.delete')) {
        const confirmed = await confirmAction(`Tem certeza que deseja apagar o item "${asset.name}"?`);
        if (confirmed) {
            assets = assets.filter(a => a.id !== assetId);
            storageService.set(STORAGE_KEYS.FINANCE_ASSETS, assets);
            renderAssets();
            window.showToast('Item apagado com sucesso.', 'success');
        }
    }
};

// --- TASKS ---
const renderTasks = () => {
    if (!elements.tasksList) return;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const allTasks = getTasks();
    const tasksForToday = allTasks.filter(task => task.dueDate === todayStr && task.category === 'Financeira');

    elements.tasksList.innerHTML = '';

    if (tasksForToday.length === 0) {
        elements.tasksList.innerHTML = '<li class="empty-list-placeholder">Nenhuma tarefa de Saúde Financeira agendada para hoje.</li>';
        return;
    }

    tasksForToday.sort((a, b) => (a.startTime || '23:59').localeCompare(b.startTime || '23:59'));

    tasksForToday.forEach(task => {
        const li = document.createElement('li');
        li.className = task.completed ? 'completed' : '';
        li.dataset.id = task.id;
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} id="task-${task.id}" aria-labelledby="task-label-${task.id}">
            <div class="item-text-wrapper" data-id="${task.id}">
                <span class="item-text" id="task-label-${task.id}">${DOMPurify.sanitize(task.title)}</span>
                ${task.startTime ? `<span class="item-time"><i class="fas fa-clock"></i> ${task.startTime} - ${task.endTime || ''}</span>` : ''}
            </div>
            <div class="item-actions">
                <button class="action-btn edit-btn edit" aria-label="Editar tarefa"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn delete" aria-label="Apagar tarefa"><i class="fas fa-trash"></i></button>
            </div>
        `;
        elements.tasksList!.appendChild(li);
    });
};

const handleTaskAction = async (e: Event) => {
    const target = e.target as HTMLElement;
    // FIX: Cast the result of closest() to HTMLLIElement to access dataset and ensure compatibility with showMedalAnimation.
    const li = target.closest<HTMLLIElement>('li[data-id]');
    if (!li || !li.dataset.id) return;
    
    const taskId = li.dataset.id;
    const task = getTasks().find(t => t.id === taskId);
    if (!task) return;

    if (target.closest('.edit-btn') || target.closest('.item-text-wrapper')) {
        openTaskModal(task);
    } else if (target.closest('.delete-btn')) {
        await deleteTask(taskId);
    } else if (target.matches('.task-checkbox')) {
        const wasCompleted = task.completed;
        const newCompletedStatus = !task.completed;
        updateTask(taskId, { completed: newCompletedStatus });

        if (newCompletedStatus && !wasCompleted) {
            updateStreak();
            
            const categoryTasks = getTasks().filter(t => t.category === 'Financeira' && t.dueDate === task.dueDate);
            const allCategoryTasksCompleted = categoryTasks.every(t => t.completed);
            
            if (allCategoryTasksCompleted) {
                awardMedalForCategory('financeira');
                showMedalAnimation(li);
                window.showToast('Parabéns! Você completou todas as tarefas de Saúde Financeira e ganhou uma medalha!', 'success');
            }
        }
    }
};

// --- REFLECTION ---
async function handleAiSuggestionClick(e: Event) {
    const button = (e.target as HTMLElement).closest<HTMLButtonElement>('.ai-suggestion-btn');
    if (!button) return;

    const wrapper = button.closest('.input-wrapper');
    const textarea = wrapper?.querySelector<HTMLTextAreaElement>('textarea');
    const label = wrapper?.parentElement?.querySelector<HTMLLabelElement>('label');

    if (!textarea || !label) return;

    const topic = label.textContent || 'reflexão pessoal';
    const prompt = `Gere uma única pergunta introspectiva e profunda para um diário pessoal sobre o seguinte tópico: "${topic}". A pergunta deve ser aberta, curta e encorajar uma reflexão significativa.`;

    button.classList.add('loading');
    button.disabled = true;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const suggestion = result.text.trim();
        textarea.value = suggestion;
        textarea.focus();
    } catch (error) {
        errorHandler.handle(error as Error, 'ai.generateReflectionPrompt');
    } finally {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

function setupReflectionForm() {
    if (!elements.reflectionForm) return;

    elements.reflectionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const textareas = elements.reflectionForm!.querySelectorAll<HTMLTextAreaElement>('.reflection-input');
        const category = elements.reflectionForm!.dataset.category as any;
        let savedCount = 0;

        const allReflections = storageService.get<any[]>(STORAGE_KEYS.UNIFIED_REFLECTIONS) || [];

        textareas.forEach(textarea => {
            const text = textarea.value.trim();
            if (text) {
                const now = new Date();
                const newReflection = {
                    id: `${now.getTime()}-${Math.random()}`,
                    category: category,
                    title: textarea.dataset.title || 'Reflexão',
                    text: text,
                    date: now.toISOString().split('T')[0],
                    timestamp: now.getTime()
                };
                allReflections.push(newReflection);
                textarea.value = ''; // Clear after saving
                savedCount++;
            }
        });
        
        if (savedCount > 0) {
            storageService.set(STORAGE_KEYS.UNIFIED_REFLECTIONS, allReflections);
            window.showToast(`${savedCount} reflex${savedCount > 1 ? 'ões salvas' : 'ão salva'} com sucesso!`, 'success');
        } else {
            window.showToast('Nenhuma reflexão preenchida para salvar.', 'info');
        }
    });

    elements.reflectionForm.addEventListener('click', handleAiSuggestionClick);
}

// --- LIFECYCLE FUNCTIONS ---
export function setup() {
    const page = document.getElementById('page-financeira');
    if (!page) return;

    elements.pageContainer = page;
    elements.tasksList = page.querySelector('#financeira-tasks-list');
    elements.addTaskBtn = page.querySelector('#add-financeira-task-btn');
    elements.assetList = page.querySelector('#asset-replacement-list');
    elements.assetForm = page.querySelector('#add-asset-form');
    elements.assetNameInput = page.querySelector('#asset-name-input');
    elements.assetPurchaseDateInput = page.querySelector('#asset-purchase-date-input');
    elements.reflectionForm = page.querySelector('.reflection-form');
    
    // Modal elements are global
    elements.assetModal = document.getElementById('asset-modal');
    elements.assetModalForm = document.getElementById('asset-edit-form') as HTMLFormElement;
    elements.assetModalCloseBtn = document.getElementById('asset-modal-close-btn') as HTMLButtonElement;
    elements.assetModalCancelBtn = document.getElementById('asset-modal-cancel-btn') as HTMLButtonElement;
    elements.saveAssetEditBtn = document.getElementById('save-asset-edit-btn') as HTMLButtonElement;
    elements.assetNameEditInput = document.getElementById('asset-name-edit-input') as HTMLInputElement;
    elements.assetPurchaseDateEditInput = document.getElementById('asset-purchase-date-edit-input') as HTMLInputElement;

    // Event Listeners
    elements.addTaskBtn?.addEventListener('click', () => {
        openTaskModal(undefined, { category: 'Financeira', title: '' });
    });
    elements.tasksList?.addEventListener('click', handleTaskAction);

    elements.assetForm?.addEventListener('submit', handleAddAsset);
    elements.assetList?.addEventListener('click', handleAssetListClick);
    
    // Asset Modal listeners
    elements.assetModalForm?.addEventListener('submit', handleSaveAssetEdit);
    elements.assetModalCloseBtn?.addEventListener('click', closeAssetModal);
    elements.assetModalCancelBtn?.addEventListener('click', closeAssetModal);
    elements.assetModal?.addEventListener('click', (e) => {
        if (e.target === elements.assetModal) closeAssetModal();
    });

    setupReflectionForm();

    document.body.addEventListener('datachanged:tasks', () => {
        if (window.location.hash === '#financeira') {
             renderTasks();
        }
    });
}

export function show() {
    assets = storageService.get<Asset[]>(STORAGE_KEYS.FINANCE_ASSETS) || [];
    renderAssets();
    renderTasks();
}