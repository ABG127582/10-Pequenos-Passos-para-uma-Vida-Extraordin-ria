import DOMPurify from 'dompurify';
import { storageService } from './storage';
import { STORAGE_KEYS } from './constants';
import { showMedalAnimation, awardMedalForCategory, updateStreak } from './utils';
import { ai } from './ai';
import { errorHandler } from './errorHandler';
// FIX: Import from the unified 'tarefas.ts' module
import { Task, getTasks, openTaskModal, updateTask, deleteTask } from './tarefas';

// Re-declare window interface for global functions from index.tsx
declare global {
    interface Window {
        showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    }
}

// --- DOM Elements ---
const elements = {
    pageContainer: null as HTMLElement | null,
    tasksList: null as HTMLUListElement | null,
    addTaskBtn: null as HTMLButtonElement | null,
    reflectionForm: null as HTMLFormElement | null,
};


// --- RENDER FUNCTION ---
const renderTasks = () => {
    if (!elements.tasksList) return;
    
    const todayStr = new Date().toISOString().split('T')[0];
    // FIX: Use getTasks() from the unified task system
    const allTasks = getTasks();
    const tasksForToday = allTasks.filter(task => task.dueDate === todayStr && task.category === 'Espiritual');

    elements.tasksList.innerHTML = '';

    if (tasksForToday.length === 0) {
        elements.tasksList.innerHTML = '<li class="empty-list-placeholder">Nenhuma tarefa de Saúde Espiritual agendada para hoje.</li>';
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


// --- EVENT HANDLERS ---
const handleTaskAction = async (e: Event) => {
    const target = e.target as HTMLElement;
    const li = target.closest('li');
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
            
            const categoryTasks = getTasks().filter(t => t.category === 'Espiritual' && t.dueDate === task.dueDate);
            const allCategoryTasksCompleted = categoryTasks.every(t => t.completed);
            
            if (allCategoryTasksCompleted) {
                awardMedalForCategory('espiritual');
                showMedalAnimation(li);
                window.showToast('Parabéns! Você completou todas as tarefas de Saúde Espiritual e ganhou uma medalha!', 'success');
            }
        }
    }
};

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
    const page = document.getElementById('page-espiritual');
    if (!page) return;

    elements.pageContainer = page;
    elements.tasksList = page.querySelector('#espiritual-tasks-list');
    elements.addTaskBtn = page.querySelector('#add-espiritual-task-btn');
    elements.reflectionForm = page.querySelector('.reflection-form');
    
    elements.addTaskBtn?.addEventListener('click', () => {
        // FIX: Use openTaskModal and 'title' instead of 'description'
        openTaskModal(undefined, { category: 'Espiritual', title: '' });
    });
    elements.tasksList?.addEventListener('click', handleTaskAction);
    setupReflectionForm();

    // FIX: Listen for the correct data changed event
    document.body.addEventListener('datachanged:tasks', () => {
        if (window.location.hash === '#espiritual') {
             renderTasks();
        }
    });
}

export function show() {
    renderTasks();
}