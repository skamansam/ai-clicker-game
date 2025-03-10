/**
 * Stardate utility functions
 * Based on the formula where 2005 = 58000.00
 */
import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

// Local storage key for saved stardate
const STARDATE_STORAGE_KEY = 'savedStardate';

/**
 * Calculate the current stardate based on the current date
 * Each year is approximately 1000 stardate units
 * @returns Current stardate with 1 decimal place
 */
export function getCurrentStardate(): string {
    const now = new Date();
    const year = now.getFullYear();
    
    // Base: 2005 = 58000.00
    const yearsSince2005 = year - 2005;
    const baseStardate = 58000 + (yearsSince2005 * 1000);
    
    // Calculate day of year
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now.getTime() - start.getTime()) + 
                ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    // Calculate decimal portion (day of year / 365 * 1000)
    const decimalPortion = Math.floor((dayOfYear / 365) * 1000) / 10;
    
    // Format to 1 decimal place
    return (baseStardate + decimalPortion).toFixed(1);
}

/**
 * Load saved stardate from localStorage or use current
 */
function loadSavedStardate(): string {
    if (!browser) return getCurrentStardate();
    
    try {
        const saved = localStorage.getItem(STARDATE_STORAGE_KEY);
        if (saved) {
            return saved;
        }
    } catch (error) {
        console.error('Error loading saved stardate:', error);
    }
    
    // If no saved stardate, use current
    const current = getCurrentStardate();
    saveTolocalStorage(current);
    return current;
}

/**
 * Save stardate to localStorage
 */
function saveTolocalStorage(stardate: string) {
    if (!browser) return;
    
    try {
        localStorage.setItem(STARDATE_STORAGE_KEY, stardate);
    } catch (error) {
        console.error('Error saving stardate:', error);
    }
}

/**
 * Create a writable store for the stardate that persists
 */
function createStardateStore() {
    // Initialize with saved stardate or current
    const initialStardate = loadSavedStardate();
    
    const { subscribe, set, update } = writable<string>(initialStardate);
    
    let updateInterval: NodeJS.Timeout | undefined;
    
    // Start the update interval
    if (browser) {
        updateInterval = setInterval(() => {
            const newStardate = getCurrentStardate();
            set(newStardate);
            saveTolocalStorage(newStardate);
        }, 10 * 60 * 1000); // Update every 10 minutes
    }
    
    return {
        subscribe,
        set: (value: string) => {
            set(value);
            saveTolocalStorage(value);
        },
        update: (fn: (value: string) => string) => {
            update(state => {
                const newState = fn(state);
                saveTolocalStorage(newState);
                return newState;
            });
        },
        // Method to save the current stardate to game state
        getCurrentForSave: () => get({ subscribe }),
        // Method to load a stardate from game state
        loadFromSave: (stardate: string) => {
            set(stardate);
            saveTolocalStorage(stardate);
        }
    };
}

// Export the stardate store
export const stardateStore = createStardateStore();

// For backward compatibility, also export as currentStardate
export const currentStardate = derived(stardateStore, $stardateStore => $stardateStore);
