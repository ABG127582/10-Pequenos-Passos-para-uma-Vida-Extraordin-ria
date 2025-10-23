

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

function renderStreakMilestones() {
    const container = document.getElementById('streak-timeline-container');
    if (!container) return;

    const streak = getStreak();
    const achievements = storageService.get<string[]>(STORAGE_KEYS.USER_ACHIEVEMENTS) || [];

    const milestoneDays = Object.keys(STREAK_MILESTONES).map(d => parseInt(d, 10)).sort((a, b) => a - b);
    
    let nextMilestoneDays = milestoneDays.find(days => streak.current < days) || milestoneDays[milestoneDays.length - 1];
    let prevMilestoneDays = [...milestoneDays].reverse().find(days => streak.current >= days) || 0;
    
    if (streak.current >= nextMilestoneDays) {
         prevMilestoneDays = nextMilestoneDays;
    }

    const progressPercentage = prevMilestoneDays === nextMilestoneDays 
        ? 100 
        : ((streak.current - prevMilestoneDays) / (nextMilestoneDays - prevMilestoneDays)) * 100;

    const milestonesHtml = milestoneDays.map(days => {
        const milestone = STREAK_MILESTONES[days];
        const isUnlocked = streak.current >= days || achievements.includes(`streak-${days}`);
        const isNextGoal = days === nextMilestoneDays && !isUnlocked;
        
        let statusClass = 'locked';
        if (isUnlocked) statusClass = 'unlocked';
        if (isNextGoal) statusClass = 'next-goal';

        return `
            <div class="milestone-node ${statusClass}" style="left: ${((days / milestoneDays[milestoneDays.length-1]) * 100)}%" data-tooltip="${milestone.name}: ${milestone.description}">
                <div class="milestone-icon"><i class="fas ${milestone.icon}"></i></div>
                <div class="milestone-label">${days}d</div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="streak-timeline-header">
            <h3>Sequência Atual: <strong>${streak.current}</strong> dias</h3>
            <span>Faltam ${Math.max(0, nextMilestoneDays - streak.current)} dias para o próximo marco!</span>
        </div>
        <div class="streak-timeline">
            <div class="streak-progress-bar" style="width: ${progressPercentage}%"></div>
            ${milestonesHtml}
        </div>
    `;
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
             <div class="medal-badge" style="--badge-color: ${details.color};">
                <div class="medal-badge-icon">
                    <i class="fas ${details.icon}"></i>
                </div>
                <div class="medal-badge-content">
                    <h4>${DOMPurify.sanitize(details.name)}</h4>
                    <p>
                        <i class="fas fa-medal"></i>
                        <span>${count} Conquistada(s)</span>
                    </p>
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