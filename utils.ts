// utils.ts
// This module contains globally shared helper functions.
import { storageService } from './storage';
import { STORAGE_KEYS } from './constants';

/**
 * Displays a toast notification.
 * @param message The message to display.
 * @param type The type of toast (info, success, warning, error).
 */
export function showToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const toastContainer = document.getElementById('toast-notification-container');
    if (!toastContainer) {
        console.warn('Toast container not found.');
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}

/**
 * Starts speech recognition for an input field after ensuring microphone permission.
 * @param button The microphone button that was clicked.
 */
export async function startSpeechRecognition(button: HTMLButtonElement): Promise<void> {
    // @ts-ignore (for browser compatibility with webkitSpeechRecognition)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showToast("Seu navegador não suporta reconhecimento de voz.", 'warning');
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
    } catch (err) {
        console.error('Microphone access denied:', err);
        showToast('Permissão para o microfone foi negada. Por favor, habilite nas configurações do seu navegador.', 'error');
        return;
    }

    const wrapper = button.closest('.input-wrapper');
    if (!wrapper) return;
    const targetInput = wrapper.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null;
    if (!targetInput) return;

    button.disabled = true;
    button.classList.add('listening');

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        const existingText = targetInput.value.trim();
        if (existingText) {
            targetInput.value = `${existingText} ${speechResult}`;
        } else {
            targetInput.value = speechResult;
        }
        targetInput.dispatchEvent(new Event('input', { bubbles: true }));
    };

    recognition.onspeechend = () => {
        recognition.stop();
    };
    
    recognition.onend = () => {
        button.disabled = false;
        button.classList.remove('listening');
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        let message = 'Ocorreu um erro no reconhecimento de voz.';
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            message = 'Permissão para o microfone foi negada.';
        } else if (event.error === 'no-speech') {
            message = 'Nenhuma fala foi detectada. Tente falar mais perto do microfone.';
        }
        showToast(message, 'error');
    };
}

/**
 * Creates a debounced function that delays invoking the provided function
 * until after `wait` milliseconds have elapsed since the last time it was invoked.
 * @param func The function to debounce.
 * @param wait The number of milliseconds to delay.
 * @returns A new debounced function.
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: number | undefined;

    return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
        const context = this;
        clearTimeout(timeout);
        timeout = window.setTimeout(() => func.apply(context, args), wait);
    };
}


/**
 * Shows a custom confirmation modal and returns a promise that resolves with the user's choice.
 * @param message The message to display in the confirmation dialog.
 * @returns A promise that resolves to `true` if "Yes" is clicked, and `false` otherwise.
 */
export function confirmAction(message: string): Promise<boolean> {
    return new Promise(resolve => {
        const modal = document.getElementById('confirm-modal');
        const messageEl = document.getElementById('confirm-modal-message');
        const yesBtn = document.getElementById('confirm-modal-yes');
        const noBtn = document.getElementById('confirm-modal-no');

        if (!modal || !messageEl || !yesBtn || !noBtn) {
            resolve(window.confirm(message));
            return;
        }
        
        messageEl.textContent = message;
        modal.style.display = 'flex';

        const cleanup = (result: boolean) => {
            modal.style.display = 'none';
            const newYes = yesBtn.cloneNode(true);
            const newNo = noBtn.cloneNode(true);
            yesBtn.parentNode?.replaceChild(newYes, yesBtn);
            noBtn.parentNode?.replaceChild(newNo, noBtn);
            resolve(result);
        };
        
        yesBtn.addEventListener('click', () => cleanup(true), { once: true });
        noBtn.addEventListener('click', () => cleanup(false), { once: true });
        modal.addEventListener('click', (e) => {
             if (e.target === modal) {
                cleanup(false);
             }
        }, { once: true });
    });
}

/**
 * Traps focus within a given element (typically a modal) for accessibility.
 * @param element The container element to trap focus within.
 * @returns A function to remove the event listeners when the modal is closed.
 */
export function trapFocus(element: HTMLElement): () => void {
    const focusableEls = element.querySelectorAll<HTMLElement>(
        'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusableEls.length === 0) {
        return () => {};
    }
    const firstFocusableEl = focusableEls[0];
    const lastFocusableEl = focusableEls[focusableEls.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') {
            return;
        }

        if (e.shiftKey) { // shift + tab
            if (document.activeElement === firstFocusableEl) {
                lastFocusableEl.focus();
                e.preventDefault();
            }
        } else { // tab
            if (document.activeElement === lastFocusableEl) {
                firstFocusableEl.focus();
                e.preventDefault();
            }
        }
    };

    element.addEventListener('keydown', handleKeyDown);

    return () => {
        element.removeEventListener('keydown', handleKeyDown);
    };
}

// --- GAMIFICATION LOGIC ---
interface GamificationProfile {
    level: number;
    ps: number;
    nextLevelPs: number;
}

interface Streak {
    current: number;
    longest: number;
    lastActivityDate: string; // YYYY-MM-DD
}

export const STREAK_MILESTONES: { [key: number]: { name: string, description: string, icon: string, color: string, bonus: number } } = {
    7: { name: "Semana Consistente", description: "Você manteve o foco por 7 dias!", icon: 'fa-award', color: '#cd7f32', bonus: 100 },
    14: { name: "Hábito em Formação", description: "Duas semanas de dedicação!", icon: 'fa-medal', color: '#c0c0c0', bonus: 250 },
    30: { name: "Mês de Foco", description: "Um mês inteiro de pequenos passos!", icon: 'fa-trophy', color: '#ffd700', bonus: 500 },
    90: { name: "Transformação Trimestral", description: "90 dias de progresso contínuo!", icon: 'fa-gem', color: '#e5e4e2', bonus: 1000 },
    365: { name: "Ano Extraordinário", description: "365 dias de compromisso!", icon: 'fa-crown', color: '#ffc107', bonus: 5000 },
};

let pointsBatchTimeout: number | undefined;
let pointsBatch: { total: number, targetRect: DOMRect | undefined } = { total: 0, targetRect: undefined };


function getGamificationProfile(): GamificationProfile {
    const defaultProfile: GamificationProfile = { level: 1, ps: 0, nextLevelPs: 200 };
    return storageService.get<GamificationProfile>(STORAGE_KEYS.GAMIFICATION_PROFILE) || defaultProfile;
}

function saveGamificationProfile(profile: GamificationProfile) {
    storageService.set(STORAGE_KEYS.GAMIFICATION_PROFILE, profile);
    document.body.dispatchEvent(new CustomEvent('gamification:update'));
}

export function updateProfileWidget() {
    const profile = getGamificationProfile();
    const nameEl = document.getElementById('user-profile-name');
    const levelEl = document.getElementById('user-level');
    const psBar = document.getElementById('user-ps-bar');
    const psText = document.getElementById('user-ps-progress-text');

    if (nameEl && storageService.getCurrentProfile()) {
        nameEl.textContent = storageService.getCurrentProfile()!.split('@')[0];
    }
    if (levelEl) levelEl.textContent = `Nível ${profile.level}`;
    if (psBar) {
        const percentage = Math.min(100, (profile.ps / profile.nextLevelPs) * 100);
        (psBar as HTMLElement).style.width = `${percentage}%`;
    }
    if(psText) psText.textContent = `${profile.ps} / ${profile.nextLevelPs} PS`;
}

function showLevelUpAnimation(newLevel: number) {
    const modal = document.getElementById('level-up-modal');
    const levelEl = document.getElementById('new-level-text');
    if (modal && levelEl) {
        levelEl.textContent = `Nível ${newLevel}`;
        modal.style.display = 'flex';
    }
}

function showPointsAnimation(points: number, targetRect?: DOMRect) {
    if (!targetRect) return;

    const pointsEl = document.createElement('div');
    pointsEl.className = 'ps-animation';
    pointsEl.textContent = `+${points} PS`;
    document.body.appendChild(pointsEl);

    const x = targetRect.left + targetRect.width / 2;
    const y = targetRect.top + targetRect.height / 2;
    pointsEl.style.left = `${x}px`;
    pointsEl.style.top = `${y}px`;

    pointsEl.addEventListener('animationend', () => {
        pointsEl.remove();
    });
}

export function showMedalAnimation(targetRect: DOMRect) {
    const medalEl = document.createElement('div');
    medalEl.className = 'medal-animation';
    medalEl.innerHTML = '<i class="fas fa-medal"></i>';
    document.body.appendChild(medalEl);

    const x = targetRect.left + targetRect.width / 2;
    const y = targetRect.top + targetRect.height / 2;
    medalEl.style.left = `${x}px`;
    medalEl.style.top = `${y}px`;

    medalEl.addEventListener('animationend', () => {
        medalEl.remove();
    });
}

function awardAchievement(milestone: { name: string, description: string, icon: string, bonus: number }) {
    const modal = document.getElementById('achievement-unlocked-modal');
    const titleEl = document.getElementById('achievement-unlocked-title');
    const textEl = document.getElementById('achievement-unlocked-text');
    const bonusEl = document.getElementById('achievement-unlocked-bonus');
    const iconEl = document.getElementById('achievement-animation-icon');

    if (modal && titleEl && textEl && bonusEl && iconEl) {
        titleEl.textContent = milestone.name;
        textEl.textContent = milestone.description;
        bonusEl.textContent = `+${milestone.bonus} PS`;
        iconEl.innerHTML = `<i class="fas ${milestone.icon}"></i>`;
        modal.style.display = 'flex';
    }
}

export function awardPoints(points: number, options?: { targetRect?: DOMRect }) {
    clearTimeout(pointsBatchTimeout);
    
    pointsBatch.total += points;
    if (options?.targetRect) {
        pointsBatch.targetRect = options.targetRect;
    }

    pointsBatchTimeout = window.setTimeout(() => {
        const profile = getGamificationProfile();
        profile.ps += pointsBatch.total;

        let leveledUp = false;
        while (profile.ps >= profile.nextLevelPs) {
            profile.ps -= profile.nextLevelPs;
            profile.level++;
            profile.nextLevelPs = Math.floor(profile.nextLevelPs * 1.5);
            leveledUp = true;
        }

        saveGamificationProfile(profile);
        
        if (pointsBatch.targetRect) {
            showPointsAnimation(pointsBatch.total, pointsBatch.targetRect);
        }

        if (leveledUp) {
            showLevelUpAnimation(profile.level);
        }

        // Reset batch
        pointsBatch = { total: 0, targetRect: undefined };
    }, 200); // Wait 200ms to batch points from the same action
}

export function getStreak(): Streak {
    const defaultStreak: Streak = { current: 0, longest: 0, lastActivityDate: '' };
    return storageService.get<Streak>(STORAGE_KEYS.ACTIVITY_STREAK) || defaultStreak;
}

export function updateStreak(options?: { targetRect?: DOMRect }) {
    const streak = getStreak();
    const today = new Date().toISOString().split('T')[0];

    if (streak.lastActivityDate === today) {
        return; // Streak already updated today
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (streak.lastActivityDate === yesterdayStr) {
        streak.current++;
    } else {
        streak.current = 1; // Streak was broken
    }
    
    streak.lastActivityDate = today;
    if (streak.current > streak.longest) {
        streak.longest = streak.current;
    }

    storageService.set(STORAGE_KEYS.ACTIVITY_STREAK, streak);

    awardPoints(25, options); // Streak bonus

    const milestone = STREAK_MILESTONES[streak.current];
    if (milestone) {
        const achievements = storageService.get<string[]>(STORAGE_KEYS.USER_ACHIEVEMENTS) || [];
        const achievementId = `streak-${streak.current}`;
        if (!achievements.includes(achievementId)) {
            achievements.push(achievementId);
            storageService.set(STORAGE_KEYS.USER_ACHIEVEMENTS, achievements);
            awardPoints(milestone.bonus, options);
            awardAchievement(milestone);
        }
    }
}

export function awardMedalForCategory(category: string, date: string, options?: { targetRect?: DOMRect }) {
    const dailyMedals = storageService.get<{ [key: string]: string[] }>(STORAGE_KEYS.DAILY_MEDALS) || {};
    
    if (!dailyMedals[date]) {
        dailyMedals[date] = [];
    }

    if (!dailyMedals[date].includes(category)) {
        dailyMedals[date].push(category);
        storageService.set(STORAGE_KEYS.DAILY_MEDALS, dailyMedals);
        
        awardPoints(50, options); // Medal bonus
        
        if(options?.targetRect) {
            showMedalAnimation(options.targetRect);
        }
        document.body.dispatchEvent(new CustomEvent('datachanged:tasks'));
    }
}