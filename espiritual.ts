// Re-declare window interface for global functions from index.tsx
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
    const page = document.getElementById('page-espiritual');
    if (!page) return;

    elements.pageContainer = page;
}

export function show() {
    // No specific show logic needed for now
}
