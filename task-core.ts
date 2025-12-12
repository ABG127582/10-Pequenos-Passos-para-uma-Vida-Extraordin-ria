import { Task } from './types';
import { storageService } from './storage';
import { eventBus } from './event-bus';
import { STORAGE_KEYS } from './constants';
import { awardMedalForCategory, awardPoints, confirmAction, updateStreak } from './utils';

// --- Module-scoped state ---
let allTasks: Task[] = [];
let allCategories: string[] = [];

// --- CORE DATA FUNCTIONS ---

export function saveData() {
    storageService.set(STORAGE_KEYS.TASKS_DATA, allTasks);
    storageService.set(STORAGE_KEYS.TASKS_CATEGORIES, allCategories);
    eventBus.emit('datachanged:tasks');
}

export function loadData() {
    allTasks = storageService.get<Task[]>(STORAGE_KEYS.TASKS_DATA) || [];
    allCategories = storageService.get<string[]>(STORAGE_KEYS.TASKS_CATEGORIES) || ['Física', 'Mental', 'Financeira', 'Familiar', 'Profissional', 'Social', 'Espiritual'];
}

export function getTasks(): Task[] {
    return allTasks;
}

export function getCategories(): string[] {
    return allCategories;
}

export function addCategory(newCategory: string): boolean {
    if (newCategory && newCategory.trim() !== '') {
        if (!allCategories.includes(newCategory)) {
            allCategories.push(newCategory);
            saveData();
            return true;
        }
    }
    return false;
}

export function addTask(taskData: Partial<Task>): Task {
    const newTask: Task = {
        id: crypto.randomUUID(),
        title: taskData.title || 'Nova Tarefa',
        description: taskData.description || '',
        completed: false,
        category: taskData.category || '',
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate || '',
        startTime: taskData.startTime,
        endTime: taskData.endTime,
        reminder: taskData.reminder,
        reminderSent: false,
    };
    allTasks.unshift(newTask);
    saveData();
    return newTask;
}

export function updateTask(taskId: string, updates: Partial<Task>, options?: { targetRect?: DOMRect }) {
    const task = allTasks.find(t => t.id === taskId);
    if (task) {
        const wasIncomplete = !task.completed;
        Object.assign(task, updates);

        // Check for medal award only when a task is marked as complete
        if (wasIncomplete && task.completed) {
            if (task.category && task.dueDate) {
                // Check if all tasks for this category on this day are now complete
                const tasksForCategoryDay = allTasks.filter(t => t.category === task.category && t.dueDate === task.dueDate);
                const allComplete = tasksForCategoryDay.every(t => t.completed);

                if (allComplete) {
                    const categoryKey = task.category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    // The awardMedalForCategory function will show the animation if options are passed
                    const newlyAwarded = awardMedalForCategory(categoryKey, task.dueDate, options);
                    if (newlyAwarded) {
                        window.showToast(`Medalha de ${task.category} conquistada para ${new Date(task.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}!`, 'success');
                    }
                }
            }

            // Award points for simple completion
            const taskPoints = task.priority === 'high' ? 20 : 10;
            awardPoints(taskPoints, options);
            // Update streak for daily activity
            updateStreak(options);
        }

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
