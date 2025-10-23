// inicio.ts
// This file contains the logic for the "Início" (Home) page.
import { storageService } from './storage';
import { STORAGE_KEYS } from './constants';
import { getStreak, awardMedalForCategory, showMedalAnimation, updateStreak, awardPoints, STREAK_MILESTONES } from './utils';
import { getTasks, openTaskModal, updateTask } from './tarefas';
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
        if ((window.location.hash === '#inicio' || window.location.hash === '') && page) {
            updateMedals(page);
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

    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.scrollTop = 0;
    }

    // --- Element Querying and Event Listeners (must be in `show`) ---
    // The home page no longer has a task list, so the old listeners were removed.
}

function updateMedals(page: HTMLElement) {
    const allMedalIcons = page.querySelectorAll<HTMLElement>('.card-medal-icon');
    allMedalIcons.forEach(icon => {
        icon.style.display = 'none';
    });

    const today = new Date().toISOString().split('T')[0];
    const dailyMedals = storageService.get<{ [key: string]: string[] }>(STORAGE_KEYS.DAILY_MEDALS) || {};
    const medalsForToday = dailyMedals[today] || [];

    medalsForToday.forEach(category => {
        // Use the correct selector and find by the category class name
        const card = page.querySelector(`.saude-card.${category.toLowerCase()}`);
        if (card) {
            const medalIcon = card.querySelector<HTMLElement>('.card-medal-icon');
            if (medalIcon) {
                medalIcon.style.display = 'block';
            }
        }
    });
}

function updateStreakDisplay(page: HTMLElement) {
    const streak = getStreak();
    const streakCountEl = page.querySelector('#streak-count');
    const streakWidget = page.querySelector<HTMLElement>('.streak-widget');

    if (streakCountEl) {
        (streakCountEl as HTMLElement).textContent = streak.current.toString();
    }
    
    if (streakWidget) {
        // Remove old milestone classes
        streakWidget.className.split(' ').forEach(className => {
            if (className.startsWith('milestone-')) {
                streakWidget.classList.remove(className);
            }
        });

        // Find highest milestone achieved and apply class
        const achievedMilestoneDays = Object.keys(STREAK_MILESTONES)
            .map(d => parseInt(d, 10))
            .filter(d => streak.current >= d)
            .sort((a, b) => b - a);
        
        if (achievedMilestoneDays.length > 0) {
            const highestMilestone = achievedMilestoneDays[0];
            streakWidget.classList.add(`milestone-${highestMilestone}`);
        }
    }
}