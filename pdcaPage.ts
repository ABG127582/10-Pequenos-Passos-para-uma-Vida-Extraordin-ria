// pdcaPage.ts
// A factory for creating handlers for the standard PDCA (Plan, Do, Check/Act) pages.

import DOMPurify from 'dompurify';
import { storageService } from './storage';
import { STORAGE_KEYS } from './constants';
import { showMedalAnimation, awardMedalForCategory, updateStreak } from './utils';
import { ai } from './ai';
import { errorHandler } from './errorHandler';
import { getTasks, openTaskModal, updateTask, deleteTask } from './task-store';

// Re-declare window interface
declare global {
    interface Window {
        showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    }
}

// A factory function that creates and returns setup and show methods for a given PDCA page category.
export function createPdcaPageHandler(category: string, pageId: string) {

    // --- RENDER & LOGIC FUNCTIONS (scoped to the handler) ---

    const renderTasks = (page: HTMLElement) => {
        const normalizedCategory = category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const tasksListEl = page.querySelector<HTMLUListElement>(`#${normalizedCategory}-tasks-list`);

        if (!tasksListEl) return;
        
        const todayStr = new Date().toISOString().split('T')[0];
        const allTasks = getTasks();
        const tasksForToday = allTasks.filter(task => task.dueDate === todayStr && task.category === category);

        tasksListEl.innerHTML = '';

        if (tasksForToday.length === 0) {
            tasksListEl.innerHTML = `<li class="empty-list-placeholder">Nenhuma tarefa de Saúde ${category} agendada para hoje.</li>`;
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
            tasksListEl.appendChild(li);
        });
    };

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
            const targetRect = li.getBoundingClientRect(); // Capture rect before DOM change

            updateTask(taskId, { completed: newCompletedStatus });

            if (newCompletedStatus && !wasCompleted) {
                updateStreak();
                
                const categoryTasks = getTasks().filter(t => t.category === category && t.dueDate === task.dueDate);
                const allCategoryTasksCompleted = categoryTasks.every(t => t.completed);
                
                if (allCategoryTasksCompleted) {
                    const categoryKey = category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    awardMedalForCategory(categoryKey, task.dueDate); // Pass the task's due date
                    showMedalAnimation(targetRect); // Pass the captured rect
                    window.showToast(`Parabéns! Você completou todas as tarefas de Saúde ${category} e ganhou uma medalha!`, 'success');
                }
            }
        }
    };

    // --- RETURN LIFECYCLE METHODS ---
    return {
        setup() {
            // This listener is global and safe to setup once per module.
            // It listens for data changes and re-renders the task list if the current page is active.
            document.body.addEventListener('datachanged:tasks', () => {
                const page = document.getElementById(pageId);
                const hash = window.location.hash.substring(1);
                if (page && hash === pageId.replace('page-', '')) {
                     renderTasks(page);
                }
            });
        },
        show() {
            const page = document.getElementById(pageId);
            if (!page) return;

            // --- Query elements and attach listeners every time the page is shown ---
            // This is necessary because the router replaces the page's DOM content.
            const addTaskBtn = page.querySelector<HTMLButtonElement>(`[data-action="add-task-for-category"]`);
            const tasksList = page.querySelector<HTMLUListElement>(`#${category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}-tasks-list`);
            
            // The event listeners are attached to the fresh DOM elements.
            // No need to worry about removing them, as the elements are destroyed on navigation.
            addTaskBtn?.addEventListener('click', () => {
                openTaskModal(undefined, { category: category as any, title: '' });
            });

            tasksList?.addEventListener('click', handleTaskAction);
            
            // Render the initial content for the page
            renderTasks(page);
        }
    };
}