// constants.ts
// This file centralizes all magic strings, especially localStorage keys, for better maintainability.

export const CONFIG = {
    TOAST_DURATION: 5000,
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes
    MAX_CACHE_SIZE: 15,
    DEBOUNCE_DELAY: 300,
    STORAGE_CACHE_SIZE: 50,
} as const;


export const STORAGE_KEYS = {
    // --- Profile Management (Global, not user-specific) ---
    USER_PROFILES: 'userProfiles',
    CURRENT_PROFILE: 'currentProfile',

    // --- User-Specific Data (will be prefixed by storageService) ---
    // Unified Task Management System
    TASKS_DATA: 'unifiedTasksData', // Single source of truth for all tasks
    TASKS_CATEGORIES: 'tasksCategories',

    // Unified Reflections
    UNIFIED_REFLECTIONS: 'unifiedReflections',
    
    // Finance page specifics
    FINANCE_ASSETS: 'financeiraAssets',

    // Preventiva page specifics
    PREVENTIVA_PROFILE: 'preventivaProfile',
    PREVENTIVA_VACCINES: 'preventivaVaccineDates',
    PREVENTIVA_INDICATOR_PREFIX: 'preventiva-indicator-',
    PREVENTIVA_SUPPLEMENTS: 'preventivaSupplements',
    PREVENTIVA_DIAGNOSTICS: 'preventivaDiagnostics',

    // User Contract
    USER_CONTRACT: 'userContractData',

    // App Settings
    TTS_SETTINGS: 'ttsReaderSettings',
    DAILY_MEDALS: 'dailyMedals',
    ACTIVITY_STREAK: 'activityStreak',
    HOME_TASKS_EXPANDED: 'homeTasksExpanded',
    // Sidebar menu state (prefix)
    SIDEBAR_DETAILS_PREFIX: 'sidebar-details-', // e.g., 'sidebar-details-fisica'
} as const;