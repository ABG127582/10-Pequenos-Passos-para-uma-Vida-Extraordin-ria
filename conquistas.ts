

// conquistas.ts

import { storageService } from './storage';
import { STORAGE_KEYS } from './constants';
import { getStreak, STREAK_MILESTONES } from './utils';
import DOMPurify from 'dompurify';

const categoryDetails: { [key: string]: { icon: string, name: string, color: string } } = {
    'fisica': { icon: 'fa-heart-pulse', name: 'Física', color: 'var(--color-fisica)' },
    'mental': { icon: 'fa-brain', name: 'Mental', color: 'var(--color-mental)' },
    'financeira': { icon: 'fa-hand-holding-dollar', name: 'Financeira', color: 'var(--color-financeira)' },
    'familiar': { icon: 'fa-users', name: 'Familiar', color: 'var(--color-familiar)' },
    'profissional': { icon: 'fa-briefcase', name: 'Profissional', color: 'var(--color-profissional)' },
    'social': { icon: 'fa-comments', name: 'Social', color: 'var(--color-social)' },
    'espiritual': { icon: 'fa-om', name: 'Espiritual', color: 'var(--color-espiritual)' },
    'preventiva': { icon: 'fa-shield-alt', name: 'Preventiva', color: 'var(--color-preventiva)' },
    'pessoal': { icon: 'fa-user', name: 'Pessoal', color: 'var(--color-pessoal)' },
};

// The `MILESTONE_DETAILS` constant was a faulty fix attempt and was removed.
// The `STREAK_MILESTONES` object imported from `utils.ts` is now used as the single source of truth.

function renderStreakMilestones() {
    const grid = document.getElementById('streak-milestones-grid');
    if (!grid) return;

    const streak = getStreak();
    const achievements = storageService.get<string[]>(STORAGE_KEYS.USER_ACHIEVEMENTS) || [];

    // FIX: Correctly iterate over STREAK_MILESTONES. The `milestoneDetails` variable now correctly holds the milestone object,
    // resolving the "cannot be used as an index type" error.
    grid.innerHTML = Object.entries(STREAK_MILESTONES).map(([days, milestoneDetails]) => {
        const isUnlocked = streak.current >= parseInt(days, 10) || achievements.includes(`streak-${days}`);
        const icon = milestoneDetails.icon || 'fa-star';
        
        return `
            <div class="achievement-card ${isUnlocked ? 'unlocked' : ''}" style="border-left-color: ${isUnlocked ? milestoneDetails.color : 'transparent'};">
                <div class="achievement-card-icon" style="color: ${milestoneDetails.color};">
                    <i class="fas ${icon}"></i>
                </div>
                <h3>${milestoneDetails.name}</h3>
                <p>${milestoneDetails.description}</p>
            </div>
        `;
    }).join('');
}


function renderDailyMedals() {
    const grid = document.getElementById('medals-summary-grid');
    if (!grid) return;

    const dailyMedals = storageService.get<{ [key: string]: string[] }>(STORAGE_KEYS.DAILY_MEDALS) || {};
    const medalCounts: { [key: string]: number } = {};

    Object.values(dailyMedals).forEach(medalsOnDay => {
        medalsOnDay.forEach(category => {
            medalCounts[category] = (medalCounts[category] || 0) + 1;
        });
    });

    if (Object.keys(medalCounts).length === 0) {
        grid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-color-muted);">Nenhuma medalha conquistada ainda. Complete todas as tarefas de uma categoria em um dia para ganhar uma!</p>';
        return;
    }

    grid.innerHTML = Object.entries(medalCounts).map(([categoryKey, count]) => {
        const details = categoryDetails[categoryKey.toLowerCase()] || { icon: 'fa-question-circle', name: categoryKey, color: 'var(--color-secondary)'};
        return `
             <div class="achievement-card unlocked" style="border-left-color: ${details.color}; flex-direction: row; align-items: center; gap: 15px; text-align: left;">
                <div class="achievement-card-icon" style="color: ${details.color}; margin-bottom: 0; font-size: 2rem;">
                    <i class="fas ${details.icon}"></i>
                </div>
                <div>
                    <h3 style="font-size: 1rem;">${DOMPurify.sanitize(details.name)}</h3>
                    <p style="font-size: 1.2rem; font-weight: bold; color: var(--text-color);">${count} Medalha(s)</p>
                </div>
            </div>
        `;
    }).join('');
}

export function setup(): void {
    // Page is mostly static, logic is in show()
}

export function show(): void {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.scrollTop = 0;
    }
    renderStreakMilestones();
    renderDailyMedals();
}