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
 * @returns Current stardate with 2 decimal places
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
    
    // Calculate decimal portion with higher precision (day of year / 365 * 100)
    // This gives us a value between 0-100 for the decimal portion
    const decimalPortion = (dayOfYear / 365) * 100;
    
    // Format to 2 decimal places
    return (baseStardate + decimalPortion).toFixed(2);
}

/**
 * Ensures a stardate string has exactly 2 decimal places
 */
function ensureTwoDecimalPlaces(stardate: string): string {
    // If it's already a valid stardate with 2 decimal places, return it
    if (/^\d+\.\d{2}$/.test(stardate)) {
        return stardate;
    }
    
    // If it has 1 decimal place, add a 0
    if (/^\d+\.\d$/.test(stardate)) {
        return `${stardate}0`;
    }
    
    // If it has more than 2 decimal places, truncate to 2
    if (/^\d+\.\d{3,}$/.test(stardate)) {
        const parts = stardate.split('.');
        return `${parts[0]}.${parts[1].substring(0, 2)}`;
    }
    
    // If it's a number without decimal places, add .00
    if (/^\d+$/.test(stardate)) {
        return `${stardate}.00`;
    }
    
    // If it's not a valid stardate format, return current stardate
    return getCurrentStardate();
}

/**
 * Load saved stardate from localStorage or use current
 */
function loadSavedStardate(): string {
    if (!browser) return getCurrentStardate();
    
    try {
        const saved = localStorage.getItem(STARDATE_STORAGE_KEY);
        if (saved) {
            // Ensure the saved stardate has 2 decimal places
            return ensureTwoDecimalPlaces(saved);
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
    
    // Ensure the initial stardate has 2 decimal places
    const formattedInitialStardate = ensureTwoDecimalPlaces(initialStardate);
    
    const { subscribe, set, update } = writable<string>(formattedInitialStardate);
    
    let updateInterval: NodeJS.Timeout | undefined;
    
    /**
     * Initialize the stardate update timer
     */
    function initStardateTimer() {
        if (!browser) return;
        
        // Clear any existing interval
        if (updateInterval) {
            clearInterval(updateInterval);
        }
        
        // Update function
        const updateStardate = () => {
            const newStardate = getCurrentStardate();
            set(newStardate);
            saveTolocalStorage(newStardate);
        };
        
        // Run immediately once
        updateStardate();
        
        // Then set up the interval to update every 10 minutes
        updateInterval = setInterval(updateStardate, 10 * 60 * 1000);
        
        return () => {
            if (updateInterval) {
                clearInterval(updateInterval);
                updateInterval = undefined;
            }
        };
    }
    
    // Start the update timer when the store is created
    const cleanup = initStardateTimer();
    
    return {
        subscribe,
        set: (value: string) => {
            // Ensure the value has 2 decimal places
            const formattedValue = ensureTwoDecimalPlaces(value);
            set(formattedValue);
            saveTolocalStorage(formattedValue);
        },
        update: (fn: (value: string) => string) => {
            update(state => {
                const newState = fn(state);
                // Ensure the new state has 2 decimal places
                const formattedState = ensureTwoDecimalPlaces(newState);
                saveTolocalStorage(formattedState);
                return formattedState;
            });
        },
        // Method to save the current stardate to game state
        getCurrentForSave: () => ensureTwoDecimalPlaces(get({ subscribe })),
        // Method to load a stardate from game state
        loadFromSave: (stardate: string) => {
            // Ensure the loaded stardate has 2 decimal places
            const formattedStardate = ensureTwoDecimalPlaces(stardate);
            set(formattedStardate);
            saveTolocalStorage(formattedStardate);
        },
        // Method to manually restart the timer (useful for testing)
        restartTimer: () => {
            if (cleanup) cleanup();
            return initStardateTimer();
        }
    };
}

// Export the stardate store
export const stardateStore = createStardateStore();

// For backward compatibility, also export as currentStardate
export const currentStardate = derived(stardateStore, $stardateStore => $stardateStore);
