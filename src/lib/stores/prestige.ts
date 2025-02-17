import { writable, get } from 'svelte/store';
import { gameStore } from './game';
import { browser } from '$app/environment';
import { prestigeUpgrades, type PrestigeUpgrade } from '$lib/data/prestige-upgrades';

interface PrestigeStore {
    prestigePoints: number;
    multiplier: number;
    upgrades: { [id: string]: number }; // id -> level mapping
    loading: boolean;
    error: string | null;
}

const LOCAL_STORAGE_KEY = 'prestigeState';

function loadFromLocalStorage(): PrestigeStore {
    if (!browser) {
        return {
            prestigePoints: 0,
            multiplier: 1,
            upgrades: {},
            loading: false,
            error: null
        };
    }

    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return {
                ...parsed,
                // Ensure all required fields exist
                prestigePoints: parsed.prestigePoints || 0,
                multiplier: parsed.multiplier || 1,
                upgrades: parsed.upgrades || {},
                loading: false,
                error: null
            };
        }
    } catch (error) {
        console.error('Error loading prestige state:', error);
    }
    return {
        prestigePoints: 0,
        multiplier: 1,
        upgrades: {},
        loading: false,
        error: null
    };
}

function saveToLocalStorage(state: PrestigeStore) {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error('Error saving prestige state:', error);
    }
}

function calculateMultiplier(upgrades: { [id: string]: number }): number {
    let baseMultiplier = 1;
    let prestigeEffectiveness = 1;

    // Check if infinity gauntlet is owned
    if (upgrades['infinity_gauntlet']) {
        prestigeEffectiveness = 2;
    }

    // Calculate multiplier from cosmic power
    const cosmicLevel = upgrades['cosmic_power'] || 0;
    if (cosmicLevel > 0) {
        baseMultiplier *= Math.pow(2, cosmicLevel);
    }

    return baseMultiplier * prestigeEffectiveness;
}

function createPrestigeStore() {
    const initialState: PrestigeStore = browser ? loadFromLocalStorage() : {
        prestigePoints: 0,
        multiplier: 1,
        upgrades: {},
        loading: false,
        error: null
    };

    const { subscribe, set, update } = writable<PrestigeStore>(initialState);

    let saveInterval: NodeJS.Timeout;

    if (browser) {
        // Save to localStorage every second
        saveInterval = setInterval(() => {
            const state = get({ subscribe });
            saveToLocalStorage(state);
        }, 1000);
    }

    return {
        subscribe,

        prestige: () => {
            const game = get(gameStore);
            if (game.totalClicks < 1000) return;

            try {
                update(state => ({ ...state, loading: true, error: null }));

                // Calculate prestige points based on total clicks
                const newPoints = Math.floor(Math.log10(game.totalClicks));

                // Reset game progress
                gameStore.reset();

                // Update prestige state
                update(state => {
                    const updatedPoints = state.prestigePoints + newPoints;
                    return {
                        ...state,
                        prestigePoints: updatedPoints,
                        loading: false
                    };
                });

                // Save immediately
                const state = get({ subscribe });
                saveToLocalStorage(state);
            } catch (error) {
                console.error('Error during prestige:', error);
                update(state => ({
                    ...state,
                    loading: false,
                    error: 'Failed to prestige'
                }));
            }
        },

        buyUpgrade: (upgradeId: string) => {
            const upgrade = prestigeUpgrades.find(u => u.id === upgradeId);
            if (!upgrade) return;

            update(state => {
                const currentLevel = state.upgrades[upgradeId] || 0;
                
                // Check if max level reached
                if (upgrade.maxLevel && currentLevel >= upgrade.maxLevel) {
                    return {
                        ...state,
                        error: 'Maximum level reached'
                    };
                }

                // Check if can afford
                if (state.prestigePoints < upgrade.cost) {
                    return {
                        ...state,
                        error: 'Not enough prestige points'
                    };
                }

                // Buy upgrade
                const newUpgrades = {
                    ...state.upgrades,
                    [upgradeId]: (state.upgrades[upgradeId] || 0) + 1
                };

                // Calculate new multiplier
                const newMultiplier = calculateMultiplier(newUpgrades);

                return {
                    ...state,
                    prestigePoints: state.prestigePoints - upgrade.cost,
                    upgrades: newUpgrades,
                    multiplier: newMultiplier,
                    error: null
                };
            });

            // Save immediately
            const state = get({ subscribe });
            saveToLocalStorage(state);
        },

        reset: () => {
            if (!browser) return;

            set({
                prestigePoints: 0,
                multiplier: 1,
                upgrades: {},
                loading: false,
                error: null
            });

            saveToLocalStorage(get({ subscribe }));
        }
    };
}

export const prestigeStore = createPrestigeStore();
