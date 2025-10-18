// inicio.ts
// This file contains the logic for the "Início" (Home) page.
import { storageService } from './storage';
import { STORAGE_KEYS } from './constants';
import { getStreak, awardMedalForCategory, showMedalAnimation, updateStreak } from './utils';
import { getTasks, openTaskModal, updateTask } from './task-store';
import DOMPurify from 'dompurify';
import { ai } from './ai';
import { errorHandler } from './errorHandler';


let page: HTMLElement | null = null;


/**
 * Sets up event listeners for the home page.
 */
export function setup(): void {
    // This listener is on the body, so it's safe to set up once.
    document.body.addEventListener('datachanged:tasks', () => {
        if (window.location.hash === '#inicio' || window.location.hash === '') {
            renderTodaySchedule();
        }
    });
}

/**
 * This function is called by the router when the home page is shown.
 * It now checks for daily medals, updates the streak, and renders the daily schedule.
 */
export function show(): void {
    page = document.getElementById('page-inicio');
    if (!page) return;

    // --- Standard Page Logic ---
    updateMedals(page);
    updateStreakDisplay(page);
    renderTodaySchedule();
    renderMedalLeaderboard();
    setInitialExpandState();

    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.scrollTop = 0;
    }

    // --- Element Querying and Event Listeners (must be in `show`) ---
    const toggleBtn = page.querySelector('#toggle-expand-tasks-btn');
    toggleBtn?.addEventListener('click', toggleTasksExpanded);

    const scheduleContainer = page.querySelector('#today-schedule-container');
    scheduleContainer?.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const taskBlock = target.closest<HTMLElement>('.task-block[data-task-id]');
        if (!taskBlock) return;

        const taskId = taskBlock.dataset.taskId;
        if (!taskId) return;
        
        const task = getTasks().find(t => t.id === taskId);
        if (!task) return;

        // Handle complete button click
        if (target.closest('.action-btn.complete')) {
            const wasIncomplete = !task.completed;
            const targetRect = taskBlock.getBoundingClientRect(); // Capture rect before DOM change
            
            updateTask(task.id, { completed: !task.completed });

            if (wasIncomplete) {
                updateStreak();
                
                const allTasks = getTasks(); // get new, updated state
                const todayStr = new Date().toISOString().split('T')[0];
                const categoryTasksForDay = allTasks.filter(t => t.category === task.category && t.dueDate === todayStr);
                
                if (task.category && categoryTasksForDay.every(t => t.completed)) {
                    awardMedalForCategory(task.category.toLowerCase(), todayStr);
                    window.showToast(`Medalha de ${task.category} conquistada para hoje!`, 'success');
                    showMedalAnimation(targetRect);
                }
            }
            return;
        }

        // Handle edit button click or content click
        if (target.closest('.action-btn.edit') || target.closest('.task-content')) {
            openTaskModal(task);
            return;
        }
    });
}

function updateMedals(page: HTMLElement) {
    const allMedalIcons = page.querySelectorAll<HTMLElement>('.card-medal-icon');
    allMedalIcons.forEach(icon => icon.style.display = 'none');

    const today = new Date().toISOString().split('T')[0];
    const dailyMedals = storageService.get<{ [key: string]: string[] }>(STORAGE_KEYS.DAILY_MEDALS) || {};
    const medalsForToday = dailyMedals[today] || [];

    medalsForToday.forEach(category => {
        const card = page.querySelector(`.saude-card-small.${category.toLowerCase()}`);
        if (card) {
            const medalIcon = card.querySelector<HTMLElement>('.card-medal-icon');
            if (medalIcon) medalIcon.style.display = 'block';
        }
    });
}

function updateStreakDisplay(page: HTMLElement) {
    const streak = getStreak();
    const streakCountEl = page.querySelector('#streak-count');
    if (streakCountEl) {
        (streakCountEl as HTMLElement).textContent = streak.current.toString();
    }
}

function renderTodaySchedule() {
    if (!page) return;
    const scheduleList = page.querySelector('#today-schedule-hours-list');
    if (!scheduleList) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const allTasks = getTasks();
    const tasksForToday = allTasks.filter(task => task.dueDate === todayStr);

    scheduleList.innerHTML = ''; // Clear previous content

    if (tasksForToday.length === 0) {
        scheduleList.innerHTML = '<li class="empty-list-placeholder" style="margin: 1rem;">Nenhuma tarefa para hoje. Aproveite para planejar!</li>';
        return;
    }

    const allDayTasks = tasksForToday.filter(task => !task.startTime).sort((a,b) => a.title.localeCompare(b.title));
    const scheduledTasks = tasksForToday.filter(task => !!task.startTime).sort((a, b) => a.startTime!.localeCompare(b.startTime!));

    // Render All-Day tasks
    if (allDayTasks.length > 0) {
        const allDaySlot = document.createElement('li');
        allDaySlot.className = 'hour-slot all-day-slot';
        let tasksHtml = allDayTasks.map(task => createTaskBlockHtml(task)).join('');
        allDaySlot.innerHTML = `<div class="hour-label">Dia Inteiro</div><div class="tasks-in-hour">${tasksHtml}</div>`;
        scheduleList.appendChild(allDaySlot);
    }
    
    // Render hourly tasks
    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        
        // Filter for tasks active during the current hour slot, including multi-hour and overnight tasks.
        const tasksInThisHour = scheduledTasks.filter(task => {
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
        });

        if (tasksInThisHour.length > 0) {
            const hourSlot = document.createElement('li');
            hourSlot.className = 'hour-slot';
            const tasksHtml = tasksInThisHour.map(task => createTaskBlockHtml(task)).join('');
            hourSlot.innerHTML = `<div class="hour-label">${hour}:00</div><div class="tasks-in-hour">${tasksHtml}</div>`;
            scheduleList.appendChild(hourSlot);
        }
    }
}

function renderMedalLeaderboard() {
    if (!page) return;
    const leaderboardEl = page.querySelector('#medal-leaderboard');
    if (!leaderboardEl) return;

    const profiles = storageService.getAvailableProfiles();
    const leaderboardData = profiles.map(profile => {
        // Use direct localStorage access because storageService is scoped to the current user
        const medalData = JSON.parse(localStorage.getItem(`${profile}__${STORAGE_KEYS.DAILY_MEDALS}`) || '{}');
        
        // FIX: Refactored medal calculation to use a more robust `for...of` loop.
        // This avoids potential type issues with `reduce` and ensures that only array
        // values from storage contribute to the total medal count.
        let totalMedals = 0;
        for (const medals of Object.values(medalData)) {
            if (Array.isArray(medals)) {
                totalMedals += medals.length;
            }
        }
        return { name: profile, medals: totalMedals };
    });

    leaderboardData.sort((a, b) => b.medals - a.medals);

    if (leaderboardData.length === 0) {
        leaderboardEl.innerHTML = '<li class="ranking-empty">Nenhum perfil encontrado.</li>';
        return;
    }

    leaderboardEl.innerHTML = leaderboardData.map((player, index) => {
        const rank = index + 1;
        const trophy = rank === 1 ? '<i class="fas fa-trophy"></i>' : '';
        return `
            <li class="ranking-item">
                <span class="ranking-position">${rank}</span>
                <span class="ranking-name">${DOMPurify.sanitize(player.name.split('@')[0])} ${trophy}</span>
                <span class="ranking-medals">${player.medals} <i class="fas fa-medal"></i></span>
            </li>
        `;
    }).join('');
}


function createTaskBlockHtml(task: any): string {
    const isCompleted = task.completed;
    const completeButtonLabel = isCompleted ? 'Desmarcar como concluída' : 'Marcar como concluída';

    return `
        <div class="task-block ${isCompleted ? 'completed' : ''}" data-task-id="${task.id}" data-category="${task.category}" tabindex="0">
            <div class="task-content" style="cursor: pointer;" title="Abrir detalhes da tarefa">
                ${task.startTime ? `<div class="task-time-range">${task.startTime} - ${task.endTime || ''}</div>` : ''}
                <p class="task-description">${DOMPurify.sanitize(task.title)}</p>
            </div>
            <div class="task-block-actions">
                <button class="action-btn edit" aria-label="Editar Tarefa" title="Editar Tarefa"><i class="fas fa-edit"></i></button>
                <button class="action-btn complete ${isCompleted ? 'completed' : ''}" aria-label="${completeButtonLabel}" title="${completeButtonLabel}"><i class="fas fa-check"></i></button>
            </div>
        </div>
    `;
}

function toggleTasksExpanded() {
    if (!page) return;
    const container = page.querySelector('#today-schedule-container');
    const icon = page.querySelector('#toggle-expand-tasks-btn i');
    if (container && icon) {
        const isExpanded = container.classList.toggle('is-expanded');
        icon.className = isExpanded ? 'fas fa-compress-alt' : 'fas fa-expand-alt';
        storageService.set(STORAGE_KEYS.HOME_TASKS_EXPANDED, isExpanded);
    }
}

function setInitialExpandState() {
     if (!page) return;
    const container = page.querySelector('#today-schedule-container');
    const icon = page.querySelector('#toggle-expand-tasks-btn i');
    const isExpanded = storageService.get<boolean>(STORAGE_KEYS.HOME_TASKS_EXPANDED) || false;

    if (container && icon) {
        container.classList.toggle('is-expanded', isExpanded);
        icon.className = isExpanded ? 'fas fa-compress-alt' : 'fas fa-expand-alt';
    }
}