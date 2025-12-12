// app-initializer.ts
// This file contains the main application initialization logic,
// separated from the entry point (index.tsx) for better organization.

import { initRouter, pageModuleImports } from './router';
import { ttsReader } from './tts';
import { setupModals, openContractModal } from './modals';
import { updateProfileWidget, showMedalAnimation, showToast } from './utils';
import { storageService } from './storage';
import { initTasks } from './tarefas-modal';
import { addTask, getTasks } from './task-core';
import { eventBus } from './event-bus';
import { dom } from './ui-elements';
import { Task } from './types';

/**
 * Initializes all core application modules. This function is called only once
 * after the first successful profile login.
 */
function initializeApp() {
    initRouter(pageModuleImports, ttsReader);
    setupModals();
    ttsReader.init();
    initTasks();

    // --- Global Event Listeners ---
    dom.body.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const pageLink = target.closest<HTMLElement>('[data-page]');
        if (pageLink && pageLink.dataset.page) {
            e.preventDefault();
            window.location.hash = pageLink.dataset.page;
        }
        
        if (target.closest('#open-contract-home') || target.closest('#open-contract-sidebar')) {
            e.preventDefault();
            openContractModal();
        }
        
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

        const speechBtn = target.closest('.speech-to-text-btn');
        if (speechBtn && !(speechBtn as HTMLButtonElement).disabled) {
            window.app.startSpeechRecognition(speechBtn as HTMLButtonElement);
        }
    });

    dom.body.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const visibleModals = Array.from(document.querySelectorAll<HTMLElement>('.modal-container'))
                .filter(modal => modal.style.display === 'flex');

            if (visibleModals.length > 0) {
                const topModal = visibleModals[visibleModals.length - 1];
                const closeButton = topModal.querySelector<HTMLButtonElement>(
                    '.modal-close-button, #unified-task-cancel-btn, #contract-modal-cancel-btn, #confirm-modal-no, #level-up-close-btn, #achievement-unlocked-close-btn, #asset-modal-cancel-btn, #ai-insights-ok-btn'
                );
                
                if (closeButton) {
                    closeButton.click();
                }
            }
        }
    });

    // --- Sidebar Logic ---
    const toggleSidebar = () => {
        const isCollapsed = dom.sidebar.classList.toggle('collapsed');
        dom.body.classList.toggle('sidebar-collapsed', isCollapsed);
        dom.sidebarToggle.setAttribute('aria-expanded', String(!isCollapsed));
        localStorage.setItem('sidebarCollapsed', String(isCollapsed));
    };

    dom.sidebarToggle.addEventListener('click', toggleSidebar);
    dom.sidebarOverlay?.addEventListener('click', toggleSidebar);

    window.addEventListener('hashchange', () => {
        if (window.innerWidth < 992 && !dom.sidebar.classList.contains('collapsed')) {
            toggleSidebar();
        }
    });

    if (localStorage.getItem('sidebarCollapsed') === 'true' && window.innerWidth >= 992) {
        dom.sidebar.classList.add('collapsed');
        dom.body.classList.add('sidebar-collapsed');
        dom.sidebarToggle.setAttribute('aria-expanded', 'false');
    } else {
        // Default to collapsed (hidden) on mobile, expanded on desktop
        const isMobile = window.innerWidth < 992;
        dom.sidebar.classList.toggle('collapsed', isMobile);
        dom.body.classList.toggle('sidebar-collapsed', isMobile);
        dom.sidebarToggle.setAttribute('aria-expanded', String(!isMobile));
    }
    
    // --- Other Global Logic ---
    dom.body.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        if (target.matches('input, textarea')) {
            const wrapper = target.closest('.input-wrapper');
            if (wrapper) {
                wrapper.classList.toggle('has-content', target.value.length > 0);
            }
        }
    }, true);
    
    dom.rainToggle.addEventListener('click', () => {
        if (dom.rainAudio.paused) {
            dom.rainAudio.play();
            dom.rainToggle.classList.add('playing');
            dom.rainToggle.setAttribute('aria-label', 'Pausar som de chuva');
        } else {
            dom.rainAudio.pause();
            dom.rainToggle.classList.remove('playing');
            dom.rainToggle.setAttribute('aria-label', 'Tocar som de chuva');
        }
    });

    const themeIcon = dom.themeToggle.querySelector('i') as HTMLElement;
    const applyTheme = (theme: 'dark' | 'light') => {
        if (theme === 'dark') {
            dom.htmlEl.classList.add('dark-mode');
            if (themeIcon) {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            }
            dom.themeToggle.setAttribute('aria-label', 'Alternar para modo claro');
        } else {
            dom.htmlEl.classList.remove('dark-mode');
            if (themeIcon) {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            }
            dom.themeToggle.setAttribute('aria-label', 'Alternar para modo escuro');
        }
    };

    dom.themeToggle.addEventListener('click', () => {
        const currentTheme = dom.htmlEl.classList.contains('dark-mode') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        storageService.set('theme', newTheme);
    });

    const savedTheme = storageService.get<'dark' | 'light'>('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        const isInitiallyDark = dom.htmlEl.classList.contains('dark-mode');
        applyTheme(isInitiallyDark ? 'dark' : 'light');
    }

    eventBus.on('gamification:update', () => updateProfileWidget());
    
    dom.levelUpCloseBtn?.addEventListener('click', () => {
        if (dom.levelUpModal) dom.levelUpModal.style.display = 'none';
    });

    dom.achievementCloseBtn?.addEventListener('click', () => {
        if (dom.achievementModal) dom.achievementModal.style.display = 'none';
    });
}


/**
 * Manages the profile selection/creation screen and loads the app
 * for the selected profile.
 */
function initProfileManager() {
    let isAppInitialized = false;
    const loginBtn = dom.loginBtn;
    const profileInput = dom.profileInput;

    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    loginBtn.disabled = !validateEmail(profileInput.value);

    profileInput.addEventListener('input', () => {
        loginBtn.disabled = !validateEmail(profileInput.value);
    });

    const showLoginPage = () => {
        const profiles = storageService.getAvailableProfiles();
        if (profiles.length > 0) {
            dom.existingProfilesList.innerHTML = '';
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
                dom.existingProfilesList.appendChild(btn);
            });
            dom.existingProfilesContainer.style.display = 'block';
        } else {
            dom.existingProfilesContainer.style.display = 'none';
        }
        
        const icon = loginBtn.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-arrow-right';
        }
        loginBtn.disabled = !validateEmail(profileInput.value);

        dom.loginPage.style.display = 'flex';
        dom.appContainer.style.display = 'none';
        dom.profileInput.focus();
    };
    
    const showApp = () => {
        dom.loginPage.style.display = 'none';
        dom.appContainer.style.display = 'block';
    };

    const loadAppForProfile = (profile: string) => {
        loginBtn.disabled = true;
        const icon = loginBtn.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-spinner fa-spin';
        }
        
        setTimeout(() => {
            storageService.setCurrentProfile(profile);
            showApp();

            // Update UI within the app
            dom.userProfileName.textContent = profile.split('@')[0];
            dom.userProfileWidget.style.display = 'flex';
            
            // Welcome animation logic
            if (!sessionStorage.getItem('welcomeAnimationShown')) {
                showToast('Parabéns por dar o primeiro passo na sua jornada!', 'success');

                const centerRect = {
                    left: window.innerWidth / 2,
                    top: window.innerHeight / 3, // A bit higher is better for animations
                    width: 0,
                    height: 0,
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 3,
                    right: window.innerWidth / 2,
                    bottom: window.innerHeight / 3,
                    toJSON: () => JSON.stringify(this)
                } as DOMRect;

                setTimeout(() => {
                    showMedalAnimation(centerRect);
                }, 500); // Delay to let toast appear

                sessionStorage.setItem('welcomeAnimationShown', 'true');
            }


            // Initialize the rest of the app only once
            if (!isAppInitialized) {
                initializeApp();
                isAppInitialized = true;
                
                // For new profiles, add default tasks
                const existingTasks = getTasks();
                if (existingTasks.length === 0) {
                    // Fix: Use local time for default tasks to avoid "yesterday" bugs
                    // This constructs YYYY-MM-DD in local time
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');
                    const today = `${year}-${month}-${day}`;
                    
                    // --- Saúde Física ---
                    addTask({ title: "Sono Qualitativo", description: "Garantir de 7 a 9 horas de sono para recuperação física e mental.", category: "Física", startTime: "22:00", endTime: "06:00", dueDate: today, priority: 'high' });
                    addTask({ title: "Jejum Intermitente e Metabólico", description: "Janela de jejum das 14h às 06h do dia seguinte para otimização metabólica.", category: "Física", startTime: "14:00", endTime: "06:00", dueDate: today, priority: 'high' });
                    addTask({ title: "Pilar 3: Exercício Físico (O Catalisador)", description: "Prática de atividade física para saúde cardiovascular e bem-estar.", category: "Física", startTime: "09:00", endTime: "10:00", dueDate: today, priority: 'high' });
                    addTask({ title: "Pilar 2: Alimentação (O Combustível)", description: "Pausa para uma refeição nutritiva e consciente.", category: "Física", startTime: "12:00", endTime: "12:30", dueDate: today, priority: 'high' });
                    addTask({ title: "Micro pausa", description: "Pausa para alongar, respirar ou descansar a mente.", category: "Física", startTime: "13:00", endTime: "13:15", dueDate: today, priority: 'medium' });
                    addTask({ title: "Micro pausa", description: "Pausa para alongar, respirar ou descansar a mente.", category: "Física", startTime: "18:00", endTime: "18:15", dueDate: today, priority: 'medium' });
                    // --- Saúde Mental ---
                    addTask({ title: "Gerenciamento de Estresse e Ansiedade", description: "Prática de técnicas de relaxamento e mindfulness.", category: "Mental", startTime: "07:00", endTime: "07:15", dueDate: today, priority: 'high' });
                    // --- Saúde Financeira ---
                     addTask({ title: "Orçamento e Controle de Gastos", description: "Revisão diária ou semanal do orçamento.", category: "Financeira", startTime: "19:00", endTime: "19:15", dueDate: today, priority: 'medium' });
                    // --- Saúde Familiar ---
                     addTask({ title: "Tempo de Qualidade em Família", description: "Jantar em família sem distrações tecnológicas.", category: "Familiar", startTime: "20:00", endTime: "21:00", dueDate: today, priority: 'medium' });
                     // --- Saúde Profissional ---
                     addTask({ title: "Bolsa de valores", description: "Acompanhamento e operações no mercado de ações.", category: "Profissional", startTime: "09:00", endTime: "16:30", dueDate: today, priority: 'high' });
                     addTask({ title: "Foco e Produtividade", description: "Trabalho focado em tarefas de alta prioridade.", category: "Profissional", startTime: "10:00", endTime: "12:00", dueDate: today, priority: 'high' });
                    // --- Saúde Social ---
                     addTask({ title: "Conexão Social", description: "Ligar ou encontrar um amigo.", category: "Social", startTime: "18:30", endTime: "19:00", dueDate: today, priority: 'low' });
                    // --- Saúde Espiritual ---
                    addTask({ title: "Acordar com calma, Gratidão", description: "Começar o dia com calma e gratidão.", category: "Espiritual", startTime: "06:00", endTime: "06:15", dueDate: today, priority: 'medium' });
                    addTask({ title: "Reflexão e Gratidão", description: "Momento para meditar ou escrever em um diário.", category: "Espiritual", startTime: "06:45", endTime: "07:00", dueDate: today, priority: 'medium' });
                }
            }
            
            updateProfileWidget();
            window.dispatchEvent(new HashChangeEvent("hashchange"));
        }, 300);
    };

    dom.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const profile = dom.profileInput.value.trim().toLowerCase();
        if (profile) {
            loadAppForProfile(profile);
        }
    });

    dom.existingProfilesList.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const profileBtn = target.closest<HTMLButtonElement>('.profile-avatar-btn');
        if (profileBtn && profileBtn.dataset.profile) {
            loadAppForProfile(profileBtn.dataset.profile);
        }
    });

    dom.switchProfileBtn.addEventListener('click', () => {
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
 * The single entry point for the application, called from index.tsx.
 */
export function startApp() {
    initProfileManager();
}
