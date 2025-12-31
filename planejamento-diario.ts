// planejamento-diario.ts
// This module handles the daily planning logic and task scheduling.

/**
 * Task category types available in the daily planner.
 */
export type TaskCategory = 'fisica' | 'mental' | 'financeira' | 'familiar' | 'profissional' | 'social' | 'espiritual' | 'preventiva';

/**
 * Opens the modal to schedule a new task or edit an existing one in the daily plan.
 * @param id Optional task ID for editing.
 * @param initialData Optional pre-filled data (description and category) for the task.
 */
export function openModal(id?: string, initialData?: { description: string; category: TaskCategory }) {
    const modal = document.getElementById('daily-plan-modal');
    if (modal) {
        modal.style.display = 'flex';
        console.log('Daily plan modal opened with data:', { id, initialData });
    } else {
        console.warn('Daily plan modal element not found.');
    }
}

/**
 * Lifecycle setup function for the daily planning page.
 */
export function setup() {
    console.debug('Daily planning page module initialized.');
}

/**
 * Lifecycle show function for the daily planning page.
 */
export function show() {
    console.debug('Daily planning page module shown.');
}
