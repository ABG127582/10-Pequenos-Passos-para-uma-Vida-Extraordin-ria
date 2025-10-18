// task-store.ts
import { storageService } from './storage';
import { STORAGE_KEYS } from './constants';
import { confirmAction, trapFocus } from './utils';

// --- TYPE DEFINITIONS ---
export type TaskCategory = 'Física' | 'Mental' | 'Financeira' | 'Familiar' | 'Profissional' | 'Social' | 'Espiritual' | 'Preventiva' | 'Pessoal';

export interface Task {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    category: TaskCategory | '';
    priority: 'low' | 'medium' | 'high';
    dueDate: string; // YYYY-MM-DD
    startTime?: string; // HH:MM
    endTime?: string;   // HH:MM
}

// --- Module-scoped state ---
let allTasks: Task[] = [];
let allCategories: string[] = [];
let editingTaskId: string | null = null;
let lastFocusedElement: HTMLElement | null = null;
let removeFocusTrap: (() => void) | null = null;

const elements: { [key: string]: HTMLElement | null | any } = {
    taskModal: null,
    taskModalTitle: null,
    taskModalForm: null,
    taskModalCloseBtn: null,
    taskModalCancelBtn: null,
    taskModalDeleteBtn: null,
    modalTitleInput: null,
    modalDescriptionInput: null,
    modalDueDateInput: null,
    modalStartTimeInput: null,
    modalEndTimeInput: null,
    modalPrioritySelect: null,
    modalCategorySelect: null,
};

// --- CORE DATA FUNCTIONS ---

function saveData() {
    storageService.set(STORAGE_KEYS.TASKS_DATA, allTasks);
    storageService.set(STORAGE_KEYS.TASKS_CATEGORIES, allCategories);
    document.body.dispatchEvent(new CustomEvent('datachanged:tasks'));
}

function loadData() {
    allTasks = storageService.get<Task[]>(STORAGE_KEYS.TASKS_DATA) || [];
    allCategories = storageService.get<string[]>(STORAGE_KEYS.TASKS_CATEGORIES) || ['Física', 'Mental', 'Financeira', 'Familiar', 'Profissional', 'Social', 'Espiritual'];
}

export function getTasks(): Task[] {
    return allTasks;
}

export function getCategories(): string[] {
    return allCategories;
}

export function addCategory(category: string): boolean {
    if (category && category.trim() !== '' && !allCategories.includes(category)) {
        allCategories.push(category);
        saveData();
        return true;
    }
    return false;
}

export function addTask(taskData: Partial<Task>): Task {
    const newTask: Task = {
        id: Date.now().toString(),
        title: taskData.title || 'Nova Tarefa',
        description: taskData.description || '',
        completed: false,
        category: taskData.category || '',
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate || '',
        startTime: taskData.startTime,
        endTime: taskData.endTime,
    };
    allTasks.unshift(newTask);
    saveData();
    return newTask;
}

export function updateTask(taskId: string, updates: Partial<Task>) {
    const taskIndex = allTasks.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
        allTasks[taskIndex] = { ...allTasks[taskIndex], ...updates };
        saveData();
    }
}

export async function deleteTask(taskId: string): Promise<boolean> {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return false;

    const confirmed = await confirmAction(`Tem certeza que deseja excluir a tarefa "${task.title}"?`);
    if (confirmed) {
        allTasks = allTasks.filter(t => t.id !== taskId);
        saveData();
        window.showToast('Tarefa excluída.', 'success');
        return true;
    }
    return false;
}

// --- MODAL HANDLING ---

export function openTaskModal(task?: Task, prefill?: Partial<Task>) {
    if (!elements.taskModal || !elements.taskModalForm || !elements.taskModalTitle || !elements.modalCategorySelect) return;
    elements.taskModalForm.reset();

    lastFocusedElement = document.activeElement as HTMLElement;

    elements.modalCategorySelect.innerHTML = '<option value="">Nenhuma</option>';
    allCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        elements.modalCategorySelect.appendChild(option);
    });

    if (task) { // Editing
        editingTaskId = task.id;
        elements.taskModalTitle.textContent = 'Editar Tarefa';
        elements.modalTitleInput!.value = task.title;
        elements.modalDescriptionInput!.value = task.description;
        elements.modalDueDateInput!.value = task.dueDate;
        elements.modalStartTimeInput!.value = task.startTime || '';
        elements.modalEndTimeInput!.value = task.endTime || '';
        elements.modalPrioritySelect!.value = task.priority;
        elements.modalCategorySelect.value = task.category;
        elements.taskModalDeleteBtn.style.display = 'inline-flex';
    } else { // Adding
        editingTaskId = null;
        elements.taskModalTitle.textContent = 'Adicionar Tarefa';
        if (prefill) {
            elements.modalTitleInput!.value = prefill.title || '';
            elements.modalDescriptionInput!.value = prefill.description || '';
            elements.modalDueDateInput!.value = prefill.dueDate || '';
            elements.modalStartTimeInput!.value = prefill.startTime || '';
            elements.modalEndTimeInput!.value = prefill.endTime || '';
            elements.modalPrioritySelect!.value = prefill.priority || 'medium';
            elements.modalCategorySelect!.value = prefill.category || '';
        }
        elements.taskModalDeleteBtn.style.display = 'none';
    }
    elements.taskModal.style.display = 'flex';

    if (elements.modalDescriptionInput) {
        setTimeout(() => {
            elements.modalDescriptionInput.style.height = 'auto';
            elements.modalDescriptionInput.style.height = `${elements.modalDescriptionInput.scrollHeight}px`;
        }, 0);
    }

    elements.modalTitleInput?.focus();
    removeFocusTrap = trapFocus(elements.taskModal);
}

const closeTaskModal = () => {
    if (!elements.taskModal) return;
    elements.taskModal.style.display = 'none';

    if (elements.modalDescriptionInput) {
        elements.modalDescriptionInput.style.height = 'auto';
    }

    if (removeFocusTrap) {
        removeFocusTrap();
        removeFocusTrap = null;
    }
    lastFocusedElement?.focus();
};

const handleTaskFormSubmit = (e: Event) => {
    e.preventDefault();
    const taskData: Partial<Task> = {
        title: elements.modalTitleInput!.value,
        description: elements.modalDescriptionInput!.value,
        dueDate: elements.modalDueDateInput!.value,
        startTime: elements.modalStartTimeInput!.value || undefined,
        endTime: elements.modalEndTimeInput!.value || undefined,
        priority: elements.modalPrioritySelect!.value as 'low' | 'medium' | 'high',
        category: elements.modalCategorySelect!.value as Task['category'],
    };

    if (!taskData.title || taskData.title.trim() === '') {
        window.showToast('O título da tarefa é obrigatório.', 'warning');
        return;
    }

    if (editingTaskId) {
        updateTask(editingTaskId, taskData);
    } else {
        addTask(taskData);
    }

    closeTaskModal();
    window.showToast(`Tarefa ${editingTaskId ? 'atualizada' : 'adicionada'} com sucesso!`, 'success');
};

export function initTasks() {
    loadData();

    elements.taskModal = document.getElementById('unified-task-modal');
    if (elements.taskModal && !elements.taskModal.dataset.handlerAttached) {
        elements.taskModalTitle = document.getElementById('unified-task-modal-title');
        elements.taskModalForm = document.getElementById('unified-task-form') as HTMLFormElement;
        elements.taskModalCloseBtn = document.getElementById('unified-task-modal-close-btn');
        elements.taskModalCancelBtn = document.getElementById('unified-task-cancel-btn');
        elements.taskModalDeleteBtn = document.getElementById('unified-task-delete-btn');
        elements.modalTitleInput = document.getElementById('unified-task-title') as HTMLInputElement;
        elements.modalDescriptionInput = document.getElementById('unified-task-description') as HTMLTextAreaElement;
        elements.modalDueDateInput = document.getElementById('unified-task-due-date') as HTMLInputElement;
        elements.modalStartTimeInput = document.getElementById('unified-task-start-time') as HTMLInputElement;
        elements.modalEndTimeInput = document.getElementById('unified-task-end-time') as HTMLInputElement;
        elements.modalPrioritySelect = document.getElementById('unified-task-priority') as HTMLSelectElement;
        elements.modalCategorySelect = document.getElementById('unified-task-category') as HTMLSelectElement;

        if (elements.modalDescriptionInput) {
            const adjustTextareaHeight = () => {
                elements.modalDescriptionInput.style.height = 'auto';
                elements.modalDescriptionInput.style.height = `${elements.modalDescriptionInput.scrollHeight}px`;
            };
            elements.modalDescriptionInput.addEventListener('input', adjustTextareaHeight);
        }

        elements.taskModalCloseBtn?.addEventListener('click', closeTaskModal);
        elements.taskModalCancelBtn?.addEventListener('click', closeTaskModal);
        elements.taskModalForm?.addEventListener('submit', handleTaskFormSubmit);
        elements.taskModalDeleteBtn?.addEventListener('click', async () => {
            if (editingTaskId) {
               if (await deleteTask(editingTaskId)) {
                    closeTaskModal();
               }
            }
        });
        elements.taskModal.dataset.handlerAttached = 'true';
    }
}
