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
            // Run migration for the newly set profile if it hasn't run before
            this.migrateLegacyData();
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

    // --- Data Migration ---
    private migrateLegacyData() {
        // This function moves data from the old, non-profiled storage to the current profile.
        // It should only run ONCE ever across all profiles.
        const migrationInfoKey = 'legacy_data_migration_info_v2';
        const migrationInfo = localStorage.getItem(migrationInfoKey);

        if (migrationInfo) {
            // Migration has already been performed or deemed unnecessary.
            return;
        }

        if (!this.currentProfile) {
            return; // Cannot migrate without a target profile.
        }
        
        // Check if there is any legacy data to migrate by looking for one of the old keys.
        const hasLegacyData = localStorage.getItem('unifiedTasksData') !== null;

        if (!hasLegacyData) {
            // No legacy data was found, so we don't need to ever run this check again.
            localStorage.setItem(migrationInfoKey, 'no_legacy_data_found');
            return;
        }

        // If we are here, it means legacy data exists AND this is the first time a profile is being set
        // since this code was deployed. We will move the legacy data to the current profile.
        console.log(`Performing one-time migration of legacy data to profile: ${this.currentProfile}`);
        
        const keysToMigrate = [
            { oldKey: 'unifiedTasksData', newKey: STORAGE_KEYS.TASKS_DATA },
            { oldKey: 'tasksCategories', newKey: STORAGE_KEYS.TASKS_CATEGORIES },
            { oldKey: 'unifiedReflections', newKey: STORAGE_KEYS.UNIFIED_REFLECTIONS },
            { oldKey: 'financeiraAssets', newKey: STORAGE_KEYS.FINANCE_ASSETS },
            { oldKey: 'preventivaProfile', newKey: STORAGE_KEYS.PREVENTIVA_PROFILE },
            { oldKey: 'preventivaVaccineDates', newKey: STORAGE_KEYS.PREVENTIVA_VACCINES },
            { oldKey: 'preventivaSupplements', newKey: STORAGE_KEYS.PREVENTIVA_SUPPLEMENTS },
            { oldKey: 'preventivaDiagnostics', newKey: STORAGE_KEYS.PREVENTIVA_DIAGNOSTICS },
            { oldKey: 'userContractData', newKey: STORAGE_KEYS.USER_CONTRACT },
            { oldKey: 'dailyMedals', newKey: STORAGE_KEYS.DAILY_MEDALS },
            { oldKey: 'activityStreak', newKey: STORAGE_KEYS.ACTIVITY_STREAK },
        ];

        let migrationOccurred = false;
        keysToMigrate.forEach(({ oldKey, newKey }) => {
            const oldData = localStorage.getItem(oldKey);
            const newPrefixedKey = this.getPrefixedKey(newKey);

            if (oldData && newPrefixedKey) {
                // Move the data: set new key, but only if it doesn't already exist to be safe.
                if (!localStorage.getItem(newPrefixedKey)) {
                    localStorage.setItem(newPrefixedKey, oldData);
                }
                migrationOccurred = true;
            }
        });
        
        if (migrationOccurred) {
             showToast('Seus dados antigos foram restaurados e associados a este perfil.', 'success');
             // Now that we've successfully moved the data, delete all old keys
             // to prevent this from ever running again.
             keysToMigrate.forEach(({ oldKey }) => {
                localStorage.removeItem(oldKey);
             });
             console.log('Legacy data migration complete. Old keys removed.');
        }

        // Set the global flag indicating that the migration process has been completed.
        localStorage.setItem(migrationInfoKey, this.currentProfile);
    }


    // --- Data Access (Modified) ---
    get<T>(key: string): T | null {
        // For global, non-profile settings like 'theme'
        if (key === 'theme') {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        }

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
         // For global, non-profile settings like 'theme'
        if (key === 'theme') {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        }
        
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