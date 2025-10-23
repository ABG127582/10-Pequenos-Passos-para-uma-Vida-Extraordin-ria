import DOMPurify from 'dompurify';
import { storageService } from './storage';
import { STORAGE_KEYS } from './constants';
import { confirmAction, awardMedalForCategory, updateStreak, showMedalAnimation, awardPoints } from './utils';
import { Task, getTasks, openTaskModal, updateTask, deleteTask, addTask } from './tarefas';


// Re-declare global functions from index.tsx
declare global {
    interface Window {
        showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    }
}

// --- MODULE-SCOPED VARIABLES ---

let currentDate: string;
let tasksForDate: Task[] = [];

const elements = {
    pageContainer: null as HTMLElement | null,
    dateInput: null as HTMLInputElement | null,
    progressRing: null as SVGCircleElement | null,
    progressText: null as SVGTextElement | null,
    scheduleList: null as HTMLUListElement | null,
    addEventBtn: null as HTMLButtonElement | null,
};

// --- DATA HANDLING ---
const loadTasksForDate = () => {
    if (!currentDate) {
        currentDate = new Date().toISOString().split('T')[0];
    }
    const allTasks = getTasks();
    tasksForDate = allTasks.filter(task => task.dueDate === currentDate);
};


// --- UI RENDERING ---
const updateProgress = () => {
    if (!elements.progressRing || !elements.progressText) return;
    
    const totalTasks = tasksForDate.length;

    if (totalTasks === 0) {
        elements.progressRing.style.strokeDashoffset = '100';
        elements.progressText.textContent = '0%';
        return;
    }
    const completedTasks = tasksForDate.filter(task => task.completed).length;
    const percentage = Math.round((completedTasks / totalTasks) * 100);
    
    elements.progressRing.style.strokeDashoffset = (100 - percentage).toString();
    elements.progressText.textContent = `${percentage}%`;
};

const renderSchedule = () => {
    if (!elements.scheduleList) return;
    elements.scheduleList.innerHTML = '';

    const allDayTasks = tasksForDate.filter(task => !task.startTime);
    const scheduledTasks = tasksForDate.filter(task => !!task.startTime);

    if (allDayTasks.length > 0) {
        const allDaySlot = document.createElement('li');
        allDaySlot.className = 'hour-slot all-day-slot';
        
        let tasksHtml = '';
        allDayTasks.forEach(task => {
            tasksHtml += `
                <div class="task-block ${task.completed ? 'completed' : ''}" data-task-id="${task.id}" data-category="${task.category}" tabindex="0" aria-label="Tarefa de dia inteiro: ${task.title}">
                    <div class="task-content">
                        <p class="task-description">${DOMPurify.sanitize(task.title)}</p>
                    </div>
                    <div class="task-block-actions">
                        <button class="action-btn edit-btn edit" aria-label="Editar Tarefa"><i class="fas fa-edit"></i></button>
                        <button class="action-btn complete-btn complete ${task.completed ? 'completed' : ''}" aria-label="${task.completed ? 'Desmarcar como concluída' : 'Marcar como concluída'}"><i class="fas fa-check"></i></button>
                    </div>
                </div>
            `;
        });
        
        allDaySlot.innerHTML = `
            <div class="hour-label">Dia Inteiro</div>
            <div class="tasks-in-hour">${tasksHtml}</div>
        `;
        elements.scheduleList.appendChild(allDaySlot);
    }

    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        const hourSlot = document.createElement('li');
        hourSlot.className = 'hour-slot';
        hourSlot.dataset.hour = hour;
        
        // Filter for tasks active during the current hour slot
        const tasksInThisHour = scheduledTasks
            .filter(task => {
                if (!task.startTime) return false;

                const startHour = parseInt(task.startTime.split(':')[0], 10);

                // For tasks without an end time, show them only in their starting hour.
                if (!task.endTime) {
                    return startHour === i;
                }

                const endHour = parseInt(task.endTime.split(':')[0], 10);
                const endMinutes = parseInt(task.endTime.split(':')[1], 10);
                
                // Case 1: Same-day or within-hour task (e.g., 10:00 -> 14:30)
                if (startHour <= endHour) {
                    // Exclude if it ends exactly at the start of this hour (e.g. 10:00-12:00 should not be in 12h slot)
                    if (endHour === i && endMinutes === 0) {
                        return false;
                    }
                    return i >= startHour && i <= endHour;
                } 
                // Case 2: Overnight task (e.g., 21:00 -> 06:00)
                else { // startHour > endHour
                    // Exclude if it ends exactly at the start of this hour
                    if (endHour === i && endMinutes === 0) {
                        return false;
                    }
                    return i >= startHour || i <= endHour;
                }
            })
            .sort((a, b) => a.startTime!.localeCompare(b.startTime!));

        let tasksHtml = '';
        tasksInThisHour.forEach(task => {
            tasksHtml += `
                <div class="task-block ${task.completed ? 'completed' : ''}" data-task-id="${task.id}" data-category="${task.category}" tabindex="0" aria-label="Tarefa: ${task.title}, das ${task.startTime} às ${task.endTime}">
                    <div class="task-content">
                        <div class="task-time-range">${task.startTime} - ${task.endTime || ''}</div>
                        <p class="task-description">${DOMPurify.sanitize(task.title)}</p>
                    </div>
                    <div class="task-block-actions">
                        <button class="action-btn edit-btn edit" aria-label="Editar Evento"><i class="fas fa-edit"></i></button>
                        <button class="action-btn complete-btn complete ${task.completed ? 'completed' : ''}" aria-label="${task.completed ? 'Desmarcar como concluída' : 'Marcar como concluída'}"><i class="fas fa-check"></i></button>
                    </div>
                </div>
            `;
        });

        hourSlot.innerHTML = `
            <div class="hour-label">${hour}:00</div>
            <div class="tasks-in-hour">
                ${tasksHtml || ''}
            </div>
        `;
        elements.scheduleList.appendChild(hourSlot);
    }
    updateProgress();
};

const renderPage = () => {
    loadTasksForDate();
    renderSchedule();
};

function createInlineTaskInput(container: HTMLElement, hour: string) {
    // If an input already exists in this container, just focus it and return.
    if (container.querySelector('#inline-task-input-wrapper')) {
        (container.querySelector('#inline-task-input') as HTMLInputElement)?.focus();
        return;
    }
    // Remove any other inline inputs that might exist elsewhere on the page
    const anyExistingWrapper = document.getElementById('inline-task-input-wrapper');
    if (anyExistingWrapper) {
        anyExistingWrapper.remove();
    }

    const wrapper = document.createElement('div');
    wrapper.id = 'inline-task-input-wrapper';
    wrapper.className = 'inline-input-container input-wrapper'; // Add input-wrapper here

    wrapper.innerHTML = `
        <input type="text" id="inline-task-input" placeholder="Digite ou toque no microfone para adicionar..." class="inline-task-input-field input-minimal">
        <button type="button" class="clear-input-btn" title="Limpar"><i class="fas fa-times-circle"></i></button>
        <button type="button" class="speech-to-text-btn" title="Digitar por Voz"><i class="fas fa-microphone"></i></button>
    `;

    container.appendChild(wrapper);
    const input = wrapper.querySelector('input') as HTMLInputElement;

    // Auto-trigger microphone
    (wrapper.querySelector('.speech-to-text-btn') as HTMLButtonElement)?.click();


    const saveAndRemove = () => {
        // Prevent running twice
        if (!document.body.contains(wrapper)) return;

        const title = input.value.trim();
        if (title) {
            const startTime = `${hour.padStart(2, '0')}:00`;
            // Calculate end time, handling midnight case
            const startHour = parseInt(hour, 10);
            const endHour = (startHour + 1) % 24;
            const endTime = `${endHour.toString().padStart(2, '0')}:00`;
            
            addTask({
                title: title,
                dueDate: currentDate,
                startTime: startTime,
                endTime: endTime,
                priority: 'medium',
                category: 'Pessoal',
            });
            // The 'datachanged:tasks' event will re-render the page
        }
        wrapper.remove();
    };

    input.addEventListener('blur', saveAndRemove);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            input.value = ''; // Ensure it doesn't save
            input.blur(); // Trigger the blur event handler to remove
        }
    });
}


// --- EVENT HANDLERS ---
const handleDateChange = () => {
    if (!elements.dateInput) return;
    currentDate = elements.dateInput.value;
    renderPage();
};

const handleScheduleClick = (e: Event) => {
    const target = e.target as HTMLElement;

    const taskBlock = target.closest<HTMLElement>('.task-block');
    if (taskBlock) {
        // Clicks on task blocks are handled by the global click handler in index.tsx now
        // to avoid duplicating logic. We just need to handle the completion logic here.
        const taskId = taskBlock.dataset.taskId;
        if (!taskId) return;
        
        const task = tasksForDate.find(t => t.id === taskId);
        if (!task) return;
        
        if (target.closest('.complete-btn')) {
            const wasIncomplete = !task.completed;
            const targetRect = taskBlock.getBoundingClientRect();

            updateTask(task.id, { completed: !task.completed });

            if (wasIncomplete) {
                // Award points for task completion
                const taskPoints = task.priority === 'high' ? 20 : 10;
                awardPoints(taskPoints, { targetRect });
                updateStreak({ targetRect }); // This will award its own bonus points

                if (task.category) {
                    const categoryKey = task.category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const newlyAwarded = awardMedalForCategory(categoryKey, currentDate, { targetRect });
                    if (newlyAwarded) {
                       window.showToast(`Medalha de ${task.category} conquistada para ${new Date(currentDate + 'T00:00:00').toLocaleDateString('pt-BR')}!`, 'success');
                   }
                }
            }
        } else if (target.closest('.edit-btn') || target.closest('.task-content')) {
             openTaskModal(task);
        }
        return;
    }

    if (target.closest('#inline-task-input-wrapper')) {
        // Clicks inside the input wrapper are handled globally now.
        return;
    }

    const tasksInHour = target.closest<HTMLElement>('.tasks-in-hour');
    if (tasksInHour) {
        const hourSlot = tasksInHour.parentElement as HTMLElement;
        const hour = hourSlot?.dataset.hour;
        
        if (hour) {
            createInlineTaskInput(tasksInHour, hour);
        }
    }
};

// --- LIFECYCLE FUNCTIONS ---
export function setup() {
    document.body.addEventListener('datachanged:tasks', () => {
        if (window.location.hash.includes('planejamento-diario')) {
            renderPage();
        }
    });
}

export function show() {
    elements.pageContainer = document.getElementById('page-planejamento-diario');
    if (!elements.pageContainer) return;

    elements.dateInput = elements.pageContainer.querySelector('#daily-plan-date');
    elements.progressRing = elements.pageContainer.querySelector('#daily-progress-ring .progress-ring-fg');
    elements.progressText = elements.pageContainer.querySelector('#progress-ring-text');
    elements.scheduleList = elements.pageContainer.querySelector('#schedule-hours-list');
    elements.addEventBtn = elements.pageContainer.querySelector('#add-event-btn') as HTMLButtonElement;

    elements.dateInput?.addEventListener('change', handleDateChange);
    elements.addEventBtn?.addEventListener('click', () => openTaskModal(undefined, { 
        dueDate: currentDate,
        startTime: `${new Date().getHours().toString().padStart(2, '0')}:00`
    }));
    elements.scheduleList?.addEventListener('click', handleScheduleClick);

    currentDate = new Date().toISOString().split('T')[0];
    if(elements.dateInput) {
        elements.dateInput.value = currentDate;
    }
    
    renderPage();

    setTimeout(() => {
        const currentHour = new Date().getHours();
        const currentHourSlot = elements.scheduleList?.querySelector(`[data-hour="${currentHour.toString().padStart(2, '0')}"]`);
        currentHourSlot?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
}