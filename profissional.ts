import DOMPurify from 'dompurify';
import { storageService } from './storage';
import { STORAGE_KEYS } from './constants';

// Re-declare window interface
declare global {
    interface Window {
        showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    }
}

// --- DOM Elements ---
const elements = {
    pageContainer: null as HTMLElement | null,
};

// --- LIFECYCLE FUNCTIONS ---
export function setup() {
    const page = document.getElementById('page-profissional');
    if (!page) return;
    
    elements.pageContainer = page;
}

export function show() {
    // No specific show logic needed for now
}
