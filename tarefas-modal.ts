import { trapFocus } from './utils';
import { getCategories, getTasks, addTask, updateTask, deleteTask, loadData } from './task-core';
import { Task } from './types';

// --- Module-scoped state and elements ---
let editingTaskId: string | null = null;
let removeFocusTrap: (() => void) | null = null;
let lastFocusedElement: HTMLElement | null = null;

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
    modalReminderSelect: null,
    reminderHelpText: null,
};

// --- MODAL HANDLING (to be used globally) ---

export function openTaskModal(task?: Task, prefill?: Partial<Task>) {
    if (!elements.taskModal || !elements.taskModalForm || !elements.taskModalTitle || !elements.modalCategorySelect || !elements.modalReminderSelect || !elements.reminderHelpText) return;
    elements.taskModalForm.reset();

    lastFocusedElement = document.activeElement as HTMLElement;

    const allCategories = getCategories();
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
        elements.modalReminderSelect.value = task.reminder || '';
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
            elements.modalReminderSelect.value = prefill.reminder || '';
        }
        elements.taskModalDeleteBtn.style.display = 'none';
    }

    // Trigger the logic to enable/disable reminder field on open
    const hasStartTime = !!(elements.modalStartTimeInput?.value);
    elements.modalReminderSelect.disabled = !hasStartTime;
    elements.reminderHelpText.style.display = hasStartTime ? 'none' : 'block';
    if (!hasStartTime) {
        elements.modalReminderSelect.value = '';
    }

    elements.taskModal.style.display = 'flex';

    // Adjust textarea height after modal is displayed
    if (elements.modalDescriptionInput) {
        setTimeout(() => {
            elements.modalDescriptionInput.style.height = 'auto';
            elements.modalDescriptionInput.style.height = `${elements.modalDescriptionInput.scrollHeight}px`;
        }, 0); // setTimeout ensures the browser has rendered the modal
    }

    elements.modalTitleInput?.focus();
    removeFocusTrap = trapFocus(elements.taskModal);
}

const closeTaskModal = () => {
    if (!elements.taskModal) return;
    elements.taskModal.style.display = 'none';

    // Reset textarea height on close
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
        reminder: elements.modalReminderSelect!.value,
    };

    if (!taskData.title || taskData.title.trim() === '') {
        window.showToast('O título da tarefa é obrigatório.', 'warning');
        return;
    }

    if (editingTaskId) {
        // Check if time/date/reminder has changed to reset notification status
        const allTasks = getTasks();
        const originalTask = allTasks.find(t => t.id === editingTaskId);
        if (originalTask && (originalTask.dueDate !== taskData.dueDate || originalTask.startTime !== taskData.startTime || originalTask.reminder !== taskData.reminder)) {
            taskData.reminderSent = false;
        }
        updateTask(editingTaskId, taskData);
    } else {
        addTask(taskData);
    }

    closeTaskModal();
    window.showToast(`Tarefa ${editingTaskId ? 'atualizada' : 'adicionada'} com sucesso!`, 'success');
};

/**
 * Initializes the unified task system, including the global modal.
 * This should be called once when the application starts.
 */
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
        elements.modalReminderSelect = document.getElementById('unified-task-reminder') as HTMLSelectElement;
        elements.reminderHelpText = document.getElementById('reminder-help-text') as HTMLElement;

        if (elements.modalStartTimeInput) {
            elements.modalStartTimeInput.addEventListener('input', () => {
                const hasStartTime = !!elements.modalStartTimeInput.value;
                elements.modalReminderSelect.disabled = !hasStartTime;
                elements.reminderHelpText.style.display = hasStartTime ? 'none' : 'block';
                if (!hasStartTime) {
                    elements.modalReminderSelect.value = '';
                }
            });
        }

        if (elements.modalDescriptionInput) {
            const adjustTextareaHeight = () => {
                elements.modalDescriptionInput.style.height = 'auto'; // Reset height
                // Set height to scrollHeight to fit content
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
