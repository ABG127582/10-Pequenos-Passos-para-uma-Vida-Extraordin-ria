// This file is the main entry point for the application.
// It initializes all modules and sets up global event handlers.

// Import core application services
import { initRouter, pageModuleImports } from './router';
import { ttsReader } from './tts';
import { setupModals, openContractModal } from './modals';
import { showToast, startSpeechRecognition, confirmAction, trapFocus } from './utils';
import { storageService } from './storage';
import { errorHandler } from './errorHandler';
import { loadingManager } from './loadingManager';
import { performanceMonitor } from './performance';

// --- Type definitions for the global window object ---
// This ensures TypeScript knows about the functions we're attaching globally.
declare global {
    interface Window {
        showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
        startSpeechRecognition: (button: HTMLButtonElement) => Promise<void>;
        Chart: any;
        openImageViewer: (src: string, alt?: string) => void;
        
        // Add service instances to window for broader, controlled access
        storageService: typeof storageService;
        errorHandler: typeof errorHandler;
        loadingManager: typeof loadingManager;
        performanceMonitor: typeof performanceMonitor;
        confirmAction: (message: string) => Promise<boolean>;
        trapFocus: (element: HTMLElement) => () => void;
    }
}

// --- Main Application Setup Function ---
const initApp = () => {
    // 1. Attach global helper functions and services to the window object for universal access
    window.showToast = showToast;
    window.startSpeechRecognition = startSpeechRecognition;
    window.confirmAction = confirmAction;
    window.trapFocus = trapFocus;

    // Attach service instances
    window.storageService = storageService;
    window.errorHandler = errorHandler;
    window.loadingManager = loadingManager;
    window.performanceMonitor = performanceMonitor;

    // 2. Initialize core application modules
    ttsReader.init();
    setupModals();
    initRouter(pageModuleImports, ttsReader);

    // 3. Setup main UI elements and global event listeners
    const sidebar = document.getElementById('sidebar-menu');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const detailsElements = document.querySelectorAll<HTMLDetailsElement>('.sidebar-links details');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle?.querySelector('i');

    // --- Theme Management ---
    let currentTheme: 'light' | 'dark';

    const applyTheme = (theme: 'light' | 'dark') => {
        document.documentElement.classList.toggle('dark-mode', theme === 'dark');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        themeToggle?.setAttribute('aria-label', theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro');
    };

    const toggleTheme = () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        storageService.set('theme', currentTheme);
        applyTheme(currentTheme);
    };
    
    themeToggle?.addEventListener('click', toggleTheme);

    // Initialize theme: Load from storage or default to dark mode
    const savedTheme = storageService.get<'light' | 'dark'>('theme');
    currentTheme = savedTheme || 'dark'; // Default to dark mode if no theme is saved
    applyTheme(currentTheme);


    // --- Global Click Handler (Event Delegation) ---
    document.body.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;

        // Add loading cursor class for all clicks to provide immediate feedback
        document.body.classList.add('is-loading-cursor');
        // Remove it after a short delay to handle non-async actions smoothly
        setTimeout(() => document.body.classList.remove('is-loading-cursor'), 300);

        // Handle speech-to-text buttons
        const speechBtn = target.closest<HTMLButtonElement>('button.speech-to-text-btn');
        if (speechBtn) {
            e.preventDefault();
            window.startSpeechRecognition(speechBtn);
            return;
        }

        // Handle contract modal links
        if (target.closest('#open-contract-sidebar') || target.closest('#open-contract-home')) {
            e.preventDefault();
            openContractModal();
            return;
        }

        // Handle standard page navigation
        const pageLink = target.closest<HTMLElement>('button[data-page], a[data-page]');
        if (pageLink && pageLink.dataset.page) {
            e.preventDefault();
            ttsReader.stop(); // Stop any ongoing speech before navigating
            window.location.hash = pageLink.dataset.page;
        }
    });

    // --- Sidebar State Persistence & Logic ---
    const restoreMenuState = () => {
        detailsElements.forEach(details => {
            if (details.id && storageService.get(details.id) === 'open') {
                details.open = true;
            }
        });
    };
    restoreMenuState();

    detailsElements.forEach(details => {
        details.addEventListener('toggle', () => {
            if (details.id) {
                storageService.set(details.id, details.open ? 'open' : 'closed');
            }
        });
    });

    // Function to handle Sidebar Expansion/Collapse
    const toggleSidebar = (forceState?: boolean) => {
        if (forceState === undefined) {
             sidebar?.classList.toggle('collapsed');
        }
        
        if (sidebar) {
            if (forceState !== undefined) {
                sidebar.classList.toggle('collapsed', !forceState);
            }
            const collapsedState = sidebar.classList.contains('collapsed');
            document.body.classList.toggle('sidebar-collapsed', collapsedState);
            sidebarToggle?.setAttribute('aria-expanded', String(!collapsedState));
        }
    };

    sidebarToggle?.addEventListener('click', () => toggleSidebar());

    // Enhanced Logic for Details/Summary inside Sidebar
    const navSummaries = document.querySelectorAll<HTMLElement>('.sidebar-links summary');
    navSummaries.forEach(summary => {
        summary.addEventListener('click', (e) => {
            const details = summary.parentElement as HTMLDetailsElement;
            
            // Scenario: Sidebar is collapsed and user clicks a submenu header
            if (sidebar?.classList.contains('collapsed')) {
                e.preventDefault(); // Stop the default 'open' behavior immediately
                
                // 1. Expand the sidebar first
                toggleSidebar(true); // Force expand

                // 2. Wait slightly for the expansion animation, then open the details
                setTimeout(() => {
                    if (details && !details.open) {
                        details.open = true;
                    }
                }, 100); 
            }
            // Normal behavior applies if sidebar is already expanded
        });
    });
    
    // Default sidebar state to collapsed
    sidebar?.classList.add('collapsed');
    document.body.classList.add('sidebar-collapsed');
    sidebarToggle?.setAttribute('aria-expanded', 'false');

    // --- Rain Sound ---
    const rainSoundToggle = document.getElementById('rain-sound-toggle');
    const rainSound = document.getElementById('rain-sound') as HTMLAudioElement;

    // Monitor for source errors
    if (rainSound) {
        rainSound.addEventListener('error', (e) => {
            console.error("Rain audio error:", e);
            rainSoundToggle?.classList.remove('playing');
            window.showToast('Erro ao carregar o som ambiente. Verifique sua conexão.', 'error');
        });
    }

    rainSoundToggle?.addEventListener('click', () => {
        if (!rainSound) return;

        // Check if the element has failed to load sources
        if (rainSound.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
            window.showToast('Nenhuma fonte de áudio válida encontrada.', 'error');
            return;
        }

        if (rainSound.paused) {
            const playPromise = rainSound.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        rainSoundToggle.classList.add('playing');
                        rainSoundToggle.setAttribute('aria-label', 'Pausar som de chuva');
                    })
                    .catch(error => {
                        // Prevent console spam for AbortError (interrupted playback)
                        if (error.name !== 'AbortError') {
                            console.error("Error playing sound:", error);
                            window.showToast('Não foi possível tocar o som.', 'error');
                        }
                        // Reset UI state
                        rainSoundToggle.classList.remove('playing');
                        rainSoundToggle.setAttribute('aria-label', 'Tocar som de chuva');
                    });
            }
        } else {
            rainSound.pause();
            rainSoundToggle.classList.remove('playing');
            rainSoundToggle.setAttribute('aria-label', 'Tocar som de chuva');
        }
    });
};

// Robust startup check: run initApp if DOM is already ready, otherwise wait for event.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
