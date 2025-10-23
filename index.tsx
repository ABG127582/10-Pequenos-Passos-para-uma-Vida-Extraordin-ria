// This file is the main entry point for the application.
// It initializes all modules and sets up global event handlers.

// Import core application services
import { initRouter, pageModuleImports } from './router';
import { ttsReader } from './tts';
import { setupModals, openContractModal } from './modals';
import { showToast, startSpeechRecognition, confirmAction, trapFocus, updateProfileWidget } from './utils';
import { storageService } from './storage';
import { errorHandler } from './errorHandler';
import { loadingManager } from './loadingManager';
import { performanceMonitor } from './performance';
import { initTasks, addTask, getTasks, updateTask, Task } from './tarefas';

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

// --- Main Application Setup ---
document.addEventListener('DOMContentLoaded', () => {
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
    
    // 2. Initialize Profile Management
    initProfileManager();
});


// --- PROFILE MANAGEMENT ---
function initProfileManager() {
    const loginPage = document.getElementById('login-page') as HTMLElement;
    const appContainer = document.getElementById('app-container') as HTMLElement;
    const loginForm = document.getElementById('login-form') as HTMLFormElement;
    const profileInput = document.getElementById('profile-email-input') as HTMLInputElement;
    const existingProfilesContainer = document.getElementById('existing-profiles-container') as HTMLElement;
    const existingProfilesList = document.getElementById('existing-profiles-list') as HTMLElement;
    const switchProfileBtn = document.getElementById('switch-profile-btn') as HTMLButtonElement;
    
    let isAppInitialized = false;

    const showLoginPage = () => {
        const profiles = storageService.getAvailableProfiles();
        if (profiles.length > 0) {
            existingProfilesList.innerHTML = '';
            profiles.forEach(profile => {
                const name = profile.split('@')[0];
                const initial = name.charAt(0).toUpperCase();

                const btn = document.createElement('button');
                btn.className = 'profile-avatar-btn';
                btn.dataset.profile = profile;
                btn.title = `Acessar perfil de ${name}`;

                btn.innerHTML = `
                    <div class="profile-avatar">
                        <span class="profile-avatar-letter">${initial}</span>
                    </div>
                    <span class="profile-avatar-name">${name}</span>
                `;
                existingProfilesList.appendChild(btn);
            });
            if (existingProfilesContainer) existingProfilesContainer.style.display = 'block';
        } else {
            if (existingProfilesContainer) existingProfilesContainer.style.display = 'none';
        }
        
        if (loginPage) loginPage.style.display = 'flex';
        if (appContainer) appContainer.style.display = 'none';
        if (profileInput) profileInput.focus();
    };
    
    const showApp = () => {
        if (loginPage) loginPage.style.display = 'none';
        if (appContainer) appContainer.style.display = 'block';
    };

    const loadAppForProfile = (profile: string) => {
        storageService.setCurrentProfile(profile);
        showApp();

        // Update UI within the app
        const profileNameEl = document.getElementById('user-profile-name') as HTMLElement;
        const profileWidget = document.getElementById('user-profile-widget') as HTMLElement;
        if(profileNameEl) profileNameEl.textContent = profile.split('@')[0]; // Show user-friendly name
        if(profileWidget) profileWidget.style.display = 'flex';
        
        // Initialize the rest of the app only once
        if (!isAppInitialized) {
            initializeApp();
            isAppInitialized = true;
            
            // For new profiles, add default tasks
            const existingTasks = getTasks();
            if (existingTasks.length === 0) {
                const today = new Date().toISOString().split('T')[0];
                
                // --- Saúde Física ---
                addTask({
                    title: "Sono Qualitativo",
                    description: "Garantir de 7 a 9 horas de sono para recuperação física e mental.",
                    category: "Física",
                    startTime: "22:00",
                    endTime: "06:00",
                    dueDate: today,
                    priority: 'high'
                });
                
                addTask({
                    title: "Jejum Intermitente e Metabólico",
                    description: "Janela de jejum das 14h às 06h do dia seguinte para otimização metabólica.",
                    category: "Física",
                    startTime: "14:00",
                    endTime: "06:00",
                    dueDate: today,
                    priority: 'high'
                });

                addTask({
                    title: "Pilar 3: Exercício Físico (O Catalisador)",
                    description: "Prática de atividade física para saúde cardiovascular e bem-estar.",
                    category: "Física",
                    startTime: "09:00",
                    endTime: "10:00",
                    dueDate: today,
                    priority: 'high'
                });

                addTask({
                    title: "Pilar 2: Alimentação (O Combustível)",
                    description: "Pausa para uma refeição nutritiva e consciente.",
                    category: "Física",
                    startTime: "12:00",
                    endTime: "12:30",
                    dueDate: today,
                    priority: 'high'
                });

                addTask({
                    title: "Micro pausa",
                    description: "Pausa para alongar, respirar ou descansar a mente.",
                    category: "Física",
                    startTime: "13:00",
                    endTime: "13:15",
                    dueDate: today,
                    priority: 'medium'
                });

                addTask({
                    title: "Micro pausa",
                    description: "Pausa para alongar, respirar ou descansar a mente.",
                    category: "Física",
                    startTime: "18:00",
                    endTime: "18:15",
                    dueDate: today,
                    priority: 'medium'
                });

                // --- Saúde Mental ---
                addTask({
                    title: "Gerenciamento de Estresse e Ansiedade",
                    description: "Prática de técnicas de relaxamento e mindfulness.",
                    category: "Mental",
                    startTime: "07:00",
                    endTime: "07:15",
                    dueDate: today,
                    priority: 'high'
                });

                // --- Saúde Financeira ---
                 addTask({
                    title: "Orçamento e Controle de Gastos",
                    description: "Revisão diária ou semanal do orçamento.",
                    category: "Financeira",
                    startTime: "19:00",
                    endTime: "19:15",
                    dueDate: today,
                    priority: 'medium'
                });

                // --- Saúde Familiar ---
                 addTask({
                    title: "Tempo de Qualidade em Família",
                    description: "Jantar em família sem distrações tecnológicas.",
                    category: "Familiar",
                    startTime: "20:00",
                    endTime: "21:00",
                    dueDate: today,
                    priority: 'medium'
                });

                 // --- Saúde Profissional ---
                 addTask({
                    title: "Foco e Produtividade",
                    description: "Trabalho focado em tarefas de alta prioridade.",
                    category: "Profissional",
                    startTime: "10:00",
                    endTime: "12:00",
                    dueDate: today,
                    priority: 'high'
                });

                // --- Saúde Social ---
                 addTask({
                    title: "Conexão Social",
                    description: "Ligar ou encontrar um amigo.",
                    category: "Social",
                    startTime: "18:30",
                    endTime: "19:00",
                    dueDate: today,
                    priority: 'low'
                });

                // --- Saúde Espiritual ---
                addTask({
                    title: "Reflexão e Gratidão",
                    description: "Momento para meditar ou escrever em um diário.",
                    category: "Espiritual",
                    startTime: "06:45",
                    endTime: "07:00",
                    dueDate: today,
                    priority: 'medium'
                });
            }
        }
        
        // Always trigger a data refresh and UI update
        updateProfileWidget();
        // Manually trigger a hash change to ensure the correct page loads/re-renders with the new profile's data.
        window.dispatchEvent(new HashChangeEvent("hashchange"));
    };

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const profile = profileInput.value.trim().toLowerCase();
        if (profile) {
            loadAppForProfile(profile);
        }
    });

    existingProfilesList.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const profileBtn = target.closest<HTMLButtonElement>('.profile-avatar-btn');
        if (profileBtn && profileBtn.dataset.profile) {
            loadAppForProfile(profileBtn.dataset.profile);
        }
    });

    switchProfileBtn.addEventListener('click', () => {
        storageService.setCurrentProfile(null);
        showLoginPage();
    });

    const currentProfile = storageService.getCurrentProfile();
    if (currentProfile) {
        loadAppForProfile(currentProfile);
    } else {
        showLoginPage();
    }
}


/**
 * Initializes all core application modules. This function is called only once
 * after the first successful profile login.
 */
function initializeApp() {
    // Initialize the router
    initRouter(pageModuleImports, ttsReader);

    // Initialize all global modals
    setupModals();

    // Initialize Text-to-Speech service
    ttsReader.init();
    
    // Initialize the unified task system
    initTasks();

    // --- Global Click Handler ---
    document.body.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;

        // Handle navigation clicks for elements with a data-page attribute
        // FIX: Cast the result of closest() to HTMLElement to ensure the dataset property is available.
        const pageLink = target.closest<HTMLElement>('[data-page]');
        if (pageLink && pageLink.dataset.page) {
            e.preventDefault();
            window.location.hash = pageLink.dataset.page;
        }
        
        // Handle opening the contract modal from multiple locations
        if (target.closest('#open-contract-home') || target.closest('#open-contract-sidebar')) {
            e.preventDefault();
            openContractModal();
        }
        
        // Handle input clear buttons
        const clearBtn = target.closest('.clear-input-btn');
        if (clearBtn) {
            const wrapper = clearBtn.closest('.input-wrapper');
            const input = wrapper?.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement;
            if (input) {
                input.value = '';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.focus();
            }
        }
    });

    // --- Sidebar Toggle Logic ---
    const sidebar = document.getElementById('sidebar-menu') as HTMLElement;
    const sidebarToggle = document.getElementById('sidebar-toggle') as HTMLButtonElement;
    const body = document.body;

    const toggleSidebar = () => {
        const isCollapsed = sidebar.classList.toggle('collapsed');
        body.classList.toggle('sidebar-collapsed', isCollapsed);
        sidebarToggle.setAttribute('aria-expanded', String(!isCollapsed));
        // Save state to localStorage for persistence across sessions
        localStorage.setItem('sidebarCollapsed', String(isCollapsed));
    };

    sidebarToggle.addEventListener('click', toggleSidebar);

    // Restore sidebar state on page load
    if (localStorage.getItem('sidebarCollapsed') === 'true') {
        sidebar.classList.add('collapsed');
        body.classList.add('sidebar-collapsed');
        sidebarToggle.setAttribute('aria-expanded', 'false');
    }

    // --- Theme Toggle Logic ---
    const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement;
    const themeIcon = themeToggle.querySelector('i');

    const applyTheme = (theme: 'light' | 'dark') => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark-mode');
            if (themeIcon) {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            }
            themeToggle.setAttribute('aria-label', 'Ativar modo claro');
        } else {
            document.documentElement.classList.remove('dark-mode');
            if (themeIcon) {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            }
            themeToggle.setAttribute('aria-label', 'Ativar modo escuro');
        }
    };
    
    themeToggle.addEventListener('click', () => {
        const isDarkMode = document.documentElement.classList.contains('dark-mode');
        const newTheme = isDarkMode ? 'light' : 'dark';
        applyTheme(newTheme);
        storageService.set('theme', newTheme);
    });

    // Restore theme on load
    const savedTheme = storageService.get<'light' | 'dark'>('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        // Optional: Respect user's system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            applyTheme('dark');
        }
    }
    
     // --- Global Input Wrapper Logic ---
    document.body.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        if (target.matches('input, textarea')) {
            const wrapper = target.closest('.input-wrapper');
            if (wrapper) {
                wrapper.classList.toggle('has-content', target.value.length > 0);
            }
        }
    }, true);
    
    // --- Rain Sound Toggle ---
    const rainToggle = document.getElementById('rain-sound-toggle') as HTMLButtonElement;
    const rainAudio = document.getElementById('rain-sound') as HTMLAudioElement;

    rainToggle.addEventListener('click', () => {
        if (rainAudio.paused) {
            rainAudio.play();
            rainToggle.classList.add('playing');
            rainToggle.setAttribute('aria-label', 'Pausar som de chuva');
        } else {
            rainAudio.pause();
            rainToggle.classList.remove('playing');
            rainToggle.setAttribute('aria-label', 'Tocar som de chuva');
        }
    });

    // --- Gamification Update Listener ---
    document.body.addEventListener('gamification:update', updateProfileWidget);
    
     // --- Level Up Modal Close ---
    document.getElementById('level-up-close-btn')?.addEventListener('click', () => {
        const modal = document.getElementById('level-up-modal');
        if(modal) modal.style.display = 'none';
    });

    document.getElementById('achievement-unlocked-close-btn')?.addEventListener('click', () => {
        const modal = document.getElementById('achievement-unlocked-modal');
        if(modal) modal.style.display = 'none';
    });
}