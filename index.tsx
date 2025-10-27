// index.tsx
// This file is the main entry point for the application.
// It sets up global utilities and starts the app initialization process.

import { showToast, startSpeechRecognition, confirmAction, trapFocus } from './utils';
import { storageService } from './storage';
import { errorHandler } from './errorHandler';
import { loadingManager } from './loadingManager';
import { performanceMonitor } from './performance';
import { startApp } from './app-initializer';

// --- Type definitions for the global window object ---
declare global {
    interface Window {
        Chart: any;
        openImageViewer: (src: string, alt?: string) => void;
        
        // Centralized namespace for global utilities and services
        app: {
            showToast: typeof showToast;
            startSpeechRecognition: typeof startSpeechRecognition;
            confirmAction: typeof confirmAction;
            trapFocus: typeof trapFocus;
            storageService: typeof storageService;
            errorHandler: typeof errorHandler;
            loadingManager: typeof loadingManager;
            performanceMonitor: typeof performanceMonitor;
        }
    }
}

// --- Main Application Setup ---
document.addEventListener('DOMContentLoaded', () => {
    // Attach a global 'app' object to the window for universal (but organized) access
    window.app = {
        showToast,
        startSpeechRecognition,
        confirmAction,
        trapFocus,
        storageService,
        errorHandler,
        loadingManager,
        performanceMonitor,
    };
    
    // Start the application initialization process
    startApp();
});
