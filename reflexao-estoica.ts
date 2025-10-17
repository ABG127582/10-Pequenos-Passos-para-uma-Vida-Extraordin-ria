// reflexao-estoica.ts

import { storageService } from './storage';
import { STORAGE_KEYS } from './constants';
import { getCategories } from './tarefas';

// Re-declare window interface
declare global {
    interface Window {
        showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    }
}

let pageElements: {
    form: HTMLFormElement | null,
    categorySelect: HTMLSelectElement | null,
} = {
    form: null,
    categorySelect: null,
};

function handleReflectionSubmit(e: Event) {
    e.preventDefault();
    if (!pageElements.form || !pageElements.categorySelect) return;

    const textareas = pageElements.form.querySelectorAll<HTMLTextAreaElement>('.reflection-input');
    const category = pageElements.categorySelect.value;
    let savedCount = 0;

    const allReflections = storageService.get<any[]>(STORAGE_KEYS.UNIFIED_REFLECTIONS) || [];

    textareas.forEach(textarea => {
        const text = textarea.value.trim();
        if (text) {
            const now = new Date();
            const newReflection = {
                id: `${now.getTime()}-${Math.random()}`,
                category: category,
                title: textarea.dataset.title || 'Reflexão',
                text: text,
                date: now.toISOString().split('T')[0],
                timestamp: now.getTime()
            };
            allReflections.push(newReflection);
            textarea.value = ''; // Clear after saving
            textarea.dispatchEvent(new Event('input')); // Trigger resize to shrink
            savedCount++;
        }
    });

    if (savedCount > 0) {
        storageService.set(STORAGE_KEYS.UNIFIED_REFLECTIONS, allReflections);
        window.showToast(`${savedCount} reflexão(ões) salva(s) na categoria ${category}!`, 'success');
    } else {
        window.showToast('Nenhuma reflexão preenchida para salvar.', 'info');
    }
}

function setupAutoResizeTextareas(container: HTMLElement) {
    container.querySelectorAll<HTMLTextAreaElement>('textarea.reflection-input').forEach(textarea => {
        const adjustHeight = () => {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        };
        textarea.addEventListener('input', adjustHeight);
        adjustHeight(); // Initial check in case there's pre-filled text
    });
}

function populateCategories() {
    if (!pageElements.categorySelect) return;
    const categories = ['Pessoal', ...getCategories()];
    pageElements.categorySelect.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}


export function setup(): void {
    const page = document.getElementById('page-reflexao-estoica');
    if (!page) return;

    pageElements.form = page.querySelector('#central-reflection-form');
    pageElements.categorySelect = page.querySelector('#reflection-category');

    if (pageElements.form && !pageElements.form.dataset.listenerAttached) {
        pageElements.form.addEventListener('submit', handleReflectionSubmit);
        setupAutoResizeTextareas(pageElements.form);
        pageElements.form.dataset.listenerAttached = 'true';
    }
}

export function show(): void {
    populateCategories();
    // Clear form on show
    pageElements.form?.reset();
    pageElements.form?.querySelectorAll('textarea').forEach(ta => {
        ta.value = '';
        ta.dispatchEvent(new Event('input'));
    });
}