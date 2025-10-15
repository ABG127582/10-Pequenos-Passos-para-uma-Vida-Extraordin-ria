// storage.ts
// Centralized service for managing localStorage with an in-memory cache, now with multi-profile support.

import { showToast } from './utils';
import { CONFIG, STORAGE_KEYS } from './constants';

class StorageService {
    private cache = new Map<string, any>();
    private readonly MAX_CACHE_SIZE = CONFIG.STORAGE_CACHE_SIZE;
    private currentProfile: string | null = null;

    constructor() {
        this.currentProfile = localStorage.getItem(STORAGE_KEYS.CURRENT_PROFILE) || null;
        if (this.currentProfile === '') this.currentProfile = null;
    }

    private getPrefixedKey(key: string): string | null {
        if (!this.currentProfile) {
            console.warn("StorageService: No profile is currently selected. Operation aborted.");
            return null;
        }
        return `${this.currentProfile}__${key}`;
    }

    // --- Profile Management ---
    setCurrentProfile(profile: string | null) {
        this.currentProfile = profile;
        this.cache.clear(); // Clear cache when switching profiles
        if (profile) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_PROFILE, profile);
            this.addProfile(profile);
        } else {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_PROFILE);
        }
    }

    getCurrentProfile(): string | null {
        return this.currentProfile;
    }

    getAvailableProfiles(): string[] {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PROFILES) || '[]');
    }

    addProfile(profile: string) {
        const profiles = this.getAvailableProfiles();
        if (!profiles.includes(profile)) {
            profiles.push(profile);
            localStorage.setItem(STORAGE_KEYS.USER_PROFILES, JSON.stringify(profiles));
        }
    }

    // --- Data Access (Modified) ---
    get<T>(key: string): T | null {
        const prefixedKey = this.getPrefixedKey(key);
        if (!prefixedKey) return null;

        if (this.cache.has(prefixedKey)) {
            return this.cache.get(prefixedKey) as T;
        }
        
        try {
            const item = localStorage.getItem(prefixedKey);
            if (!item) return null;
            
            const parsed = JSON.parse(item);
            this.updateCache(prefixedKey, parsed);
            return parsed as T;
        } catch (error) {
            console.error(`StorageService: Error getting item for key "${key}" (prefixed: "${prefixedKey}"):`, error);
            return null;
        }
    }

    set<T>(key: string, value: T): boolean {
        const prefixedKey = this.getPrefixedKey(key);
        if (!prefixedKey) return false;

        try {
            const stringifiedValue = JSON.stringify(value);
            localStorage.setItem(prefixedKey, stringifiedValue);
            this.updateCache(prefixedKey, value);
            return true;
        } catch (error) {
            console.error(`StorageService: Error setting item for key "${key}" (prefixed: "${prefixedKey}"):`, error);
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                showToast('O armazenamento local está cheio. Não foi possível salvar os dados.', 'error');
            }
            return false;
        }
    }

    remove(key: string): void {
        const prefixedKey = this.getPrefixedKey(key);
        if (!prefixedKey) return;

        this.cache.delete(prefixedKey);
        try {
            localStorage.removeItem(prefixedKey);
        } catch (error) {
            console.error(`StorageService: Error removing item for key "${key}" (prefixed: "${prefixedKey}"):`, error);
        }
    }

    /**
     * Updates the in-memory cache, managing its size.
     * @param key The key to add/update.
     * @param value The value to cache.
     */
    private updateCache(key: string, value: any) {
        if (this.cache.has(key)) {
            this.cache.delete(key); // Delete and re-add to move it to the end (most recent)
        }
        
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
            // Evict the least recently used item (the first one in the Map's insertion order)
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }
}

// Export a singleton instance of the service
export const storageService = new StorageService();
