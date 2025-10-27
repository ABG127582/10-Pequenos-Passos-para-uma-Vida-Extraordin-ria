// inicio.ts
// This file contains the logic for the "Início" (Home) page.
import { storageService } from './storage';
import { STORAGE_KEYS } from './constants';
import { getStreak, STREAK_MILESTONES } from './utils';
import { eventBus } from './event-bus';

let page: HTMLElement | null = null;

/**
 * Sets up event listeners for the home page.
 */
export function setup(): void {
    // No specific setup needed for medals anymore, as they are always visible via CSS.
    // The event bus listener for task changes is no longer needed to update home page medals.
}

/**
 * This function is called by the router when the home page is shown.
 * It now just updates the streak display.
 */
export function show(): void {
    page = document.getElementById('page-inicio');
    if (!page) return;

    // --- Standard Page Logic ---
    updateStreakDisplay(page);

    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.scrollTop = 0;
    }
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