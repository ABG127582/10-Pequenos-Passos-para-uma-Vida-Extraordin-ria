// ui-elements.ts
// Centralizes references to global DOM elements for better organization.

function getElement<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Element with id "${id}" not found.`);
    }
    return el as T;
}

export const dom = {
    // Login Page
    loginPage: getElement('login-page'),
    appContainer: getElement('app-container'),
    loginForm: getElement<HTMLFormElement>('login-form'),
    profileInput: getElement<HTMLInputElement>('profile-email-input'),
    loginBtn: getElement<HTMLButtonElement>('login-btn'),
    existingProfilesContainer: getElement('existing-profiles-container'),
    existingProfilesList: getElement('existing-profiles-list'),
    
    // App Shell
    userProfileName: getElement('user-profile-name'),
    userProfileWidget: getElement('user-profile-widget'),
    switchProfileBtn: getElement<HTMLButtonElement>('switch-profile-btn'),
    sidebar: getElement('sidebar-menu'),
    sidebarToggle: getElement<HTMLButtonElement>('sidebar-toggle'),
    body: document.body,
    sidebarOverlay: getElement('sidebar-overlay'),
    rainToggle: getElement<HTMLButtonElement>('rain-sound-toggle'),
    rainAudio: getElement<HTMLAudioElement>('rain-sound'),
    themeToggle: getElement<HTMLButtonElement>('theme-toggle'),
    htmlEl: document.documentElement,

    // Modals
    levelUpModal: getElement('level-up-modal'),
    levelUpCloseBtn: getElement('level-up-close-btn'),
    achievementModal: getElement('achievement-unlocked-modal'),
    achievementCloseBtn: getElement('achievement-unlocked-close-btn'),
};