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
                    title: "Rotina Matinal: Gratidão, Sol e Hidratação",
                    description: "Acordar com calma, praticar gratidão, se expor ao sol matinal para regular o ciclo circadiano e beber 1L de água.",
                    category: "Mental",
                    startTime: "06:00",
                    endTime: "06:15",
                    dueDate: today,
                    priority: 'high'
                });

                addTask({
                    title: "Meditar 10min para regulação emocional",
                    description: "Prática de mindfulness para começar o dia com clareza.",
                    category: "Mental",
                    startTime: "06:15",
                    endTime: "06:30",
                    dueDate: today,
                    priority: 'medium'
                });
                
                addTask({
                    title: "Ritual de Desligamento",
                    description: "Desacelerar, ler, meditar e evitar telas para preparar para um sono de qualidade.",
                    category: "Mental",
                    startTime: "20:00",
                    endTime: "22:00",
                    dueDate: today,
                    priority: 'medium'
                });

                addTask({
                    title: "Santuário do Sono (escuro, silencioso, fresco)",
                    description: "Preparar o ambiente para o sono, garantindo escuridão total, silêncio e temperatura fresca para otimizar a qualidade do descanso.",
                    category: "Mental",
                    startTime: "21:00",
                    endTime: "21:15",
                    dueDate: today,
                    priority: 'medium'
                });

                // --- Saúde Familiar ---
                 addTask({
                    title: "Escuta ativa: guardar celular, manter contato visual",
                    description: "Dedicado a conversas e conexões de qualidade com a família.",
                    category: "Familiar",
                    startTime: "19:00",
                    endTime: "19:30",
                    dueDate: today,
                    priority: 'high'
                });

                // --- Saúde Profissional ---
                const pomodoroTimes = ['07:00', '08:00', '09:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
                pomodoroTimes.forEach(startTime => {
                    const startHour = startTime.split(':')[0];
                    const endTime = `${startHour}:25`;

                    addTask({
                        title: "Técnica Pomodoro",
                        description: "25 minutos de trabalho focado sem interrupções.",
                        category: "Profissional",
                        startTime: startTime,
                        endTime: endTime,
                        dueDate: today,
                        priority: 'medium'
                    });
                });

                showToast('Tarefas padrão adicionadas ao seu dia!', 'info');
            }

        } else {
            // If app is already initialized, just reload the router to reflect new user data
            window.location.hash = 'inicio';
            window.location.reload(); // Simple way to force all data to reload for the new profile
        }
    };
    
    // Check for nulls before adding listeners
    if (existingProfilesList) {
        existingProfilesList.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const profileBtn = target.closest('.profile-avatar-btn') as HTMLButtonElement;
            if (profileBtn && profileBtn.dataset.profile) {
                loadAppForProfile(profileBtn.dataset.profile);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const profile = profileInput.value.trim();
            if (profile) {
                loadAppForProfile(profile);
                profileInput.value = '';
            } else {
                showToast('Por favor, insira um e-mail para criar ou acessar um perfil.', 'warning');
            }
        });
    }
    
    if (switchProfileBtn) {
        switchProfileBtn.addEventListener('click', () => {
            storageService.setCurrentProfile(null);
            window.location.reload();
        });
    }

    // Initial check
    const currentProfile = storageService.getCurrentProfile();
    if (currentProfile) {
        loadAppForProfile(currentProfile);
    } else {
        showLoginPage();
    }
}


// --- NOTIFICATION SERVICE ---

function sendNotification(task: Task) {
    if (!('Notification' in window)) {
        console.warn('Este navegador não suporta notificações de desktop.');
        return;
    }

    const permissionCallback = (permission: NotificationPermission) => {
        if (permission === 'granted') {
            const reminderMinutes = parseInt(task.reminder!, 10);
            const notification = new Notification(`Lembrete: ${task.title}`, {
                body: `Sua tarefa começa em ${reminderMinutes} minutos às ${task.startTime}.`,
                icon: '/favicon.ico', // You can use a more specific icon if available
            });

            notification.onclick = () => {
                window.focus();
                window.location.hash = 'planejamento-diario';
            };
            
            // Mark as sent after creating the notification to prevent duplicates
            updateTask(task.id, { reminderSent: true });

        } else if (permission === 'denied') {
            // If denied, we mark it as sent to not ask again for this specific task reminder.
             updateTask(task.id, { reminderSent: true });
        }
    };

    if (Notification.permission === 'granted') {
        permissionCallback('granted');
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permissionCallback);
    } else {
        // If permission is already denied, mark as sent to avoid re-checking.
        updateTask(task.id, { reminderSent: true });
    }
}


function checkReminders() {
    const now = new Date();
    const allTasks = getTasks();
    const todayStr = now.toISOString().split('T')[0];

    const tasksToCheck = allTasks.filter(task => 
        task.dueDate === todayStr &&
        task.startTime &&
        task.reminder &&
        !task.reminderSent
    );

    tasksToCheck.forEach(task => {
        const reminderMinutes = parseInt(task.reminder!, 10);
        
        const [hour, minute] = task.startTime!.split(':').map(Number);
        const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);

        const reminderTime = new Date(startTime.getTime() - reminderMinutes * 60 * 1000);

        // Check if it's time to send the notification
        // and also ensure we don't send it after the task has already started
        if (now >= reminderTime && now < startTime) {
            sendNotification(task);
        }
    });
}

function initNotificationService() {
    // Check for reminders every minute
    setInterval(checkReminders, 60 * 1000);
    // Initial check on load, with a small delay to ensure tasks are loaded
    setTimeout(checkReminders, 2000); 
}


// --- CORE APP INITIALIZATION ---
function initializeApp() {
    // 2. Initialize core application modules
    ttsReader.init();
    setupModals();
    initTasks(); // Initialize the unified task modal system globally
    initNotificationService(); // Initialize the reminder checker
    initRouter(pageModuleImports, ttsReader);

    // 3. Setup main UI elements and global event listeners
    const sidebar = document.getElementById('sidebar-menu');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const detailsElements = document.querySelectorAll<HTMLDetailsElement>('.sidebar-links details');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle?.querySelector('i');

    // --- Gamification UI Update ---
    updateProfileWidget(); // Initial update
    document.body.addEventListener('gamification:update', () => {
        updateProfileWidget();
    });

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

        // Handle clear input button
        const clearBtn = target.closest<HTMLButtonElement>('.clear-input-btn');
        if (clearBtn) {
            e.preventDefault();
            const wrapper = clearBtn.closest('.input-wrapper');
            const input = wrapper?.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null;
            if (input) {
                input.value = '';
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
            return;
        }

        // Handle speech-to-text buttons
        const speechBtn = target.closest<HTMLButtonElement>('button.speech-to-text-btn');
        if (speechBtn) {
            e.preventDefault();
            window.startSpeechRecognition(speechBtn);
            return;
        }

        // Handle voice input on wrapper click (triggers speechBtn)
        const voiceInputWrapper = target.closest<HTMLElement>('.input-wrapper');
        if (voiceInputWrapper) {
            // If the click was on the input/textarea itself, let the default focus behavior happen.
            if (target.matches('input, textarea')) {
                // Do nothing to allow editing.
            } else {
                // If click was on wrapper padding, trigger the speech button.
                const micButton = voiceInputWrapper.querySelector<HTMLButtonElement>('.speech-to-text-btn');
                if (micButton) {
                    micButton.click();
                }
            }
            return; // Don't process other link clicks if inside a voice wrapper
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

    // Global input handler for clear button visibility
    document.body.addEventListener('input', (e) => {
        const input = e.target as HTMLInputElement | HTMLTextAreaElement;
        if (input.matches && input.matches('input, textarea')) {
            const wrapper = input.closest('.input-wrapper');
            if (wrapper) {
                wrapper.classList.toggle('has-content', !!input.value);
            }
        }
    }, true);


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

    sidebarToggle?.addEventListener('click', () => {
        const isCollapsed = sidebar?.classList.toggle('collapsed');
        document.body.classList.toggle('sidebar-collapsed', isCollapsed);
        sidebarToggle.setAttribute('aria-expanded', String(!isCollapsed));
    });

    const navSummaries = document.querySelectorAll<HTMLElement>('.sidebar-links summary[data-page-parent]');
    navSummaries.forEach(summary => {
        summary.addEventListener('click', (e) => {
            if (sidebar?.classList.contains('collapsed')) {
                e.preventDefault();
                const pageKey = summary.dataset.pageParent;
                if (pageKey) {
                    window.location.hash = pageKey;
                }
            }
        });
    });
    
    // Default sidebar state to collapsed
    sidebar?.classList.add('collapsed');
    document.body.classList.add('sidebar-collapsed');
    sidebarToggle?.setAttribute('aria-expanded', 'false');

    // --- Rain Sound ---
    const rainSoundToggle = document.getElementById('rain-sound-toggle');
    const rainSound = document.getElementById('rain-sound') as HTMLAudioElement;

    rainSoundToggle?.addEventListener('click', () => {
        if (!rainSound) return;
        if (rainSound.paused) {
            rainSound.play().then(() => {
                rainSoundToggle.classList.add('playing');
                rainSoundToggle.setAttribute('aria-label', 'Pausar som de chuva');
            }).catch(error => {
                console.error("Error playing sound:", error);
                if (error.name !== 'AbortError') {
                    window.showToast('Não foi possível tocar o som.', 'error');
                }
            });
        } else {
            rainSound.pause();
            rainSoundToggle.classList.remove('playing');
            rainSoundToggle.setAttribute('aria-label', 'Tocar som de chuva');
        }
    });

    // --- Level Up Modal ---
    const levelUpCloseBtn = document.getElementById('level-up-close-btn');
    const levelUpModal = document.getElementById('level-up-modal');
    levelUpCloseBtn?.addEventListener('click', () => {
        if(levelUpModal) levelUpModal.style.display = 'none';
    });

    // --- Achievement Unlocked Modal ---
    const achievementCloseBtn = document.getElementById('achievement-unlocked-close-btn');
    const achievementModal = document.getElementById('achievement-unlocked-modal');
    achievementCloseBtn?.addEventListener('click', () => {
        if (achievementModal) achievementModal.style.display = 'none';
    });
}