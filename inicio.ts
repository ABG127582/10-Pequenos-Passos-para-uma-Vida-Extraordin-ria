// inicio.ts
// This file contains the logic for the "Início" (Home) page.
import { storageService } from './storage';
import { STORAGE_KEYS } from './constants';

interface DailyPlan {
    tasks: { completed: boolean }[];
}

interface Task {
    completed: boolean;
}

/**
 * Sets up event listeners for the home page.
 */
export function setup(): void {
    const page = document.getElementById('page-inicio');
    if (!page) {
        console.warn("Home page container (#page-inicio) not found during setup.");
        return;
    }
}

/**
 * This function is called by the router when the home page is shown.
 */
export function show(): void {
    const page = document.getElementById('page-inicio');
    if (!page) return;

    // --- 1. Dashboard Greeting & Date ---
    const greetingEl = document.getElementById('dashboard-greeting');
    const dateEl = document.getElementById('dashboard-date');
    const now = new Date();
    const hour = now.getHours();

    if (greetingEl) {
        let greeting = 'Olá!';
        if (hour >= 5 && hour < 12) greeting = 'Bom dia!';
        else if (hour >= 12 && hour < 18) greeting = 'Boa tarde!';
        else greeting = 'Boa noite!';
        greetingEl.textContent = greeting;
    }

    if (dateEl) {
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = now.toLocaleDateString('pt-BR', options);
    }

    // --- 2. Calculate Daily Plan Progress ---
    const todayStr = now.toISOString().split('T')[0];
    const planKey = `${STORAGE_KEYS.DAILY_PLAN_PREFIX}${todayStr}`;
    const dailyPlan = storageService.get<DailyPlan>(planKey);
    
    let planPercent = 0;
    if (dailyPlan && dailyPlan.tasks && dailyPlan.tasks.length > 0) {
        const completed = dailyPlan.tasks.filter(t => t.completed).length;
        planPercent = Math.round((completed / dailyPlan.tasks.length) * 100);
    }

    // Render Plan Ring
    const planRing = document.getElementById('dash-plan-ring') as unknown as SVGCircleElement;
    const planText = document.getElementById('dash-plan-text');
    if (planRing && planText) {
        const radius = planRing.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        planRing.style.strokeDasharray = `${circumference} ${circumference}`;
        const offset = circumference - (planPercent / 100) * circumference;
        planRing.style.strokeDashoffset = String(offset);
        planText.textContent = `${planPercent}%`;
    }

    // --- 3. Calculate General Tasks Progress ---
    const allTasks = storageService.get<Task[]>(STORAGE_KEYS.TASKS_DATA) || [];
    let taskPercent = 0;
    if (allTasks.length > 0) {
        const completed = allTasks.filter(t => t.completed).length;
        taskPercent = Math.round((completed / allTasks.length) * 100);
    }

    // Render Task Ring
    const taskRing = document.getElementById('dash-task-ring') as unknown as SVGCircleElement;
    const taskText = document.getElementById('dash-task-text');
    if (taskRing && taskText) {
        const radius = taskRing.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        taskRing.style.strokeDasharray = `${circumference} ${circumference}`;
        const offset = circumference - (taskPercent / 100) * circumference;
        taskRing.style.strokeDashoffset = String(offset);
        taskText.textContent = `${taskPercent}%`;
    }

    // --- 4. Medals Logic ---
    // Hide all medals first to reset the state
    const allMedalIcons = page.querySelectorAll<HTMLElement>('.card-medal-icon');
    allMedalIcons.forEach(icon => icon.style.display = 'none');

    // Check for today's medals
    const dailyMedals = storageService.get<{ [key: string]: string[] }>(STORAGE_KEYS.DAILY_MEDALS) || {};
    const medalsForToday = dailyMedals[todayStr] || [];

    if (medalsForToday.length > 0) {
        medalsForToday.forEach(category => {
            const card = page.querySelector(`.saude-card.${category}`);
            if (card) {
                const medalIcon = card.querySelector<HTMLElement>('.card-medal-icon');
                if (medalIcon) {
                    medalIcon.style.display = 'block';
                }
            }
        });
    }

    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.scrollTop = 0;
    }
}