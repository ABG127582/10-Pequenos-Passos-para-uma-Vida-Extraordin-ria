// pdcaPage.ts
// A factory for creating handlers for the standard PDCA (Plan, Do, Check/Act) pages.

import DOMPurify from 'dompurify';
import { storageService } from './storage';
import { STORAGE_KEYS } from './constants';
import { showMedalAnimation, awardMedalForCategory, updateStreak, awardPoints } from './utils';
import { ai } from './ai';
import { errorHandler } from './errorHandler';
import { getTasks, openTaskModal, updateTask, deleteTask } from './tarefas';

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
                    <button class="action-btn edit" data-id="${task.id}" aria-label="Editar tarefa"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" data-id="${task.id}" aria-label="Excluir tarefa"><i class="fas fa-trash"></i></button>
                </div>
            `;
            tasksListEl.appendChild(li);
        });
    };

    const handleTaskListClick = async (e: Event, page: HTMLElement) => {
        const target = e.target as HTMLElement;
        const taskItem = target.closest<HTMLLIElement>('li[data-id]');
        if (!taskItem || !taskItem.dataset.id) return;
        
        const taskId = taskItem.dataset.id;
        const task = getTasks().find(t => t.id === taskId);
        if (!task) return;

        if (target.matches('.task-checkbox')) {
            const wasIncomplete = !task.completed;
            const targetRect = taskItem.getBoundingClientRect();
            
            updateTask(taskId, { completed: !task.completed });

            if (wasIncomplete) {
                const taskPoints = task.priority === 'high' ? 20 : 10;
                awardPoints(taskPoints, { targetRect });
                updateStreak({ targetRect });
                
                if (task.category) {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const categoryKey = task.category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const newlyAwarded = awardMedalForCategory(categoryKey, todayStr, { targetRect });
                    if (newlyAwarded) {
                        window.showToast(`Medalha de ${task.category} conquistada para hoje!`, 'success');
                    }
                }
            }
            return;
        }

        if (target.closest('.delete')) {
            await deleteTask(taskId);
            return;
        }

        if (target.closest('.edit') || target.closest('.item-text-wrapper')) {
            openTaskModal(task);
            return;
        }
    };

    const setup = () => {
        const page = document.getElementById(pageId);
        if (!page) {
            console.warn(`PDCA page container (#${pageId}) not found during setup.`);
            return;
        }
        
        document.body.addEventListener('datachanged:tasks', () => {
            if (window.location.hash.includes(pageId) || (window.location.hash === '' && pageId === 'page-inicio')) {
                 const currentPageEl = document.getElementById(pageId);
                 if (currentPageEl) renderTasks(currentPageEl);
            }
        });

        page.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            
            if (target.closest('[data-action="add-task-for-category"]')) {
                openTaskModal(undefined, { 
                    category: category as any, 
                    dueDate: new Date().toISOString().split('T')[0] 
                });
                return;
            }

            if (target.closest('.lista-planejamento')) {
                handleTaskListClick(e, page);
            }
        });
    };
    
    const show = () => {
        const page = document.getElementById(pageId);
        if (!page) {
            console.warn(`PDCA page container (#${pageId}) not found on show.`);
            return;
        }
        renderTasks(page);
    };

    return { setup, show };
}