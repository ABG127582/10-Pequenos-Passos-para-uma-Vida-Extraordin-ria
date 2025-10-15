// inicio.ts
// This file contains the logic for the "Início" (Home) page.
import { storageService } from './storage';
import { STORAGE_KEYS } from './constants';
import { getStreak } from './utils';

/**
 * Sets up event listeners for the home page.
 */
export function setup(): void {
    const page = document.getElementById('page-inicio');
    if (!page) {
        console.warn("Home page container (#page-inicio) not found during setup.");
        return;
    }
    // No specific event listeners needed for the home page cards after the changes.
    // Global click handler in index.tsx handles navigation.
}

/**
 * This function is called by the router when the home page is shown.
 * It now checks for daily medals and updates the streak.
 */
export function show(): void {
    const page = document.getElementById('page-inicio');
    if (!page) return;

    // --- 1. Update Medals ---
    updateMedals(page);

    // --- 2. Update Streak ---
    updateStreakDisplay(page);

    // --- Scroll to top ---
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.scrollTop = 0;
    }
}

function updateMedals(page: HTMLElement) {
    // Hide all medals first to reset the state
    const allMedalIcons = page.querySelectorAll<HTMLElement>('.card-medal-icon');
    allMedalIcons.forEach(icon => icon.style.display = 'none');

    // Check for today's medals
    const today = new Date().toISOString().split('T')[0];
    const dailyMedals = storageService.get<{ [key: string]: string[] }>(STORAGE_KEYS.DAILY_MEDALS) || {};
    const medalsForToday = dailyMedals[today] || [];

    if (medalsForToday.length > 0) {
        medalsForToday.forEach(category => {
            const card = page.querySelector(`.saude-card.${category.toLowerCase()}`); // Match category key with class
            if (card) {
                const medalIcon = card.querySelector<HTMLElement>('.card-medal-icon');
                if (medalIcon) {
                    medalIcon.style.display = 'block';
                }
            }
        });
    }
}

function updateStreakDisplay(page: HTMLElement) {
    const streak = getStreak();
    const streakCountEl = page.querySelector('#streak-count');

    if (streakCountEl) {
        (streakCountEl as HTMLElement).textContent = streak.current.toString();
    }
}
