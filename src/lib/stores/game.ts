import { writable, derived, get } from 'svelte/store';
import type { GameState, Upgrade, UserUpgrade } from '$lib/types';
import { browser } from '$app/environment';
import { db, auth } from '$lib/firebase';
import { collection, doc, setDoc, getDoc, updateDoc, increment, query, where, getDocs } from 'firebase/firestore';
import { defaultUpgrades } from '$lib/data/upgrades';

interface GameStore {
    clicks: number;
    clicksPerSecond: number;
    totalClicks: number;
    upgrades: { [id: string]: UserUpgrade };
    lastSynced: Date | null;
    dirty: boolean;
}

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const LOCAL_STORAGE_KEY = 'gameState';

function createGameStore() {
    // Initialize with default values or stored values
    const initialState: GameStore = browser ? loadFromLocalStorage() : {
        clicks: 0,
        clicksPerSecond: 0,
        totalClicks: 0,
        upgrades: {},
        lastSynced: null,
        dirty: false
    };

    const { subscribe, set, update } = writable<GameStore>(initialState);

    let saveInterval: NodeJS.Timeout;
    let autoClickInterval: NodeJS.Timeout;
    let syncInterval: NodeJS.Timeout;

    function loadFromLocalStorage(): GameStore {
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return {
                    ...parsed,
                    lastSynced: parsed.lastSynced ? new Date(parsed.lastSynced) : null
                };
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
        return {
            clicks: 0,
            clicksPerSecond: 0,
            totalClicks: 0,
            upgrades: {},
            lastSynced: null,
            dirty: false
        };
    }

    function saveToLocalStorage(state: GameStore) {
        if (!browser) return;
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    async function syncWithFirebase() {
        if (!browser) return;
        
        const user = auth.currentUser;
        if (!user) return;

        const state = get({ subscribe });
        
        try {
            const gameStateRef = doc(db, 'game_states', user.uid);
            await setDoc(gameStateRef, {
                clicks: state.clicks,
                totalClicks: state.totalClicks,
                clicksPerSecond: state.clicksPerSecond,
                lastSynced: new Date(),
                upgrades: state.upgrades
            }, { merge: true });

            update(s => ({ ...s, lastSynced: new Date(), dirty: false }));
        } catch (error) {
            console.error('Error syncing with Firebase:', error);
        }
    }

    if (browser) {
        // Save to localStorage every second
        saveInterval = setInterval(() => {
            const state = get({ subscribe });
            saveToLocalStorage(state);
        }, 1000);

        // Auto-click interval
        autoClickInterval = setInterval(() => {
            update(state => {
                const newClicks = state.clicks + state.clicksPerSecond;
                const newTotalClicks = state.totalClicks + state.clicksPerSecond;
                return {
                    ...state,
                    clicks: newClicks,
                    totalClicks: newTotalClicks,
                    dirty: true
                };
            });
        }, 1000);

        // Sync with Firebase every 5 minutes if user is logged in and state is dirty
        syncInterval = setInterval(() => {
            const state = get({ subscribe });
            if (auth.currentUser && state.dirty) {
                syncWithFirebase();
            }
        }, SYNC_INTERVAL);
    }

    return {
        subscribe,
        click: () => {
            if (!browser) return;
            
            update(state => ({
                ...state,
                clicks: state.clicks + 1,
                totalClicks: state.totalClicks + 1,
                dirty: true
            }));
        },
        loadGameState: async () => {
            if (!browser) return;
            
            const user = auth.currentUser;
            const localState = loadFromLocalStorage();

            if (user) {
                try {
                    const gameStateRef = doc(db, 'game_states', user.uid);
                    const gameStateDoc = await getDoc(gameStateRef);

                    if (gameStateDoc.exists()) {
                        const firebaseData = gameStateDoc.data();
                        const firebaseLastSynced = firebaseData.lastSynced?.toDate();
                        const localLastSynced = localState.lastSynced;

                        // Use the most recent data
                        if (!localLastSynced || (firebaseLastSynced && firebaseLastSynced > localLastSynced)) {
                            update(state => ({
                                ...state,
                                clicks: firebaseData.clicks || 0,
                                totalClicks: firebaseData.totalClicks || 0,
                                clicksPerSecond: firebaseData.clicksPerSecond || 0,
                                upgrades: firebaseData.upgrades || {},
                                lastSynced: firebaseLastSynced,
                                dirty: false
                            }));
                            return;
                        }
                    }
                } catch (error) {
                    console.error('Error loading from Firebase:', error);
                }
            }

            // Use local state if no Firebase data or not logged in
            update(state => ({
                ...state,
                ...localState,
                dirty: user ? true : false // Mark as dirty if logged in to trigger sync
            }));
        },
        purchaseUpgrade: (upgradeId: string) => {
            if (!browser) return;
            
            const upgrade = defaultUpgrades.find(u => u.id === upgradeId);
            if (!upgrade) return;

            update(state => {
                const userUpgrade = state.upgrades[upgradeId] || {
                    count: 0,
                    cost: upgrade.base_cost,
                    clicksPerSecond: upgrade.clicks_per_second
                };

                if (state.clicks < userUpgrade.cost) return state;

                const newCount = userUpgrade.count + 1;
                const newCost = Math.floor(upgrade.base_cost * Math.pow(1.15, newCount));
                const newClicksPerSecond = state.clicksPerSecond + upgrade.clicks_per_second;

                return {
                    ...state,
                    clicks: state.clicks - userUpgrade.cost,
                    clicksPerSecond: newClicksPerSecond,
                    upgrades: {
                        ...state.upgrades,
                        [upgradeId]: {
                            count: newCount,
                            cost: newCost,
                            clicksPerSecond: upgrade.clicks_per_second
                        }
                    },
                    dirty: true
                };
            });
        },
        getUpgrades: () => defaultUpgrades,
        forceSync: async () => {
            if (!browser) return;
            await syncWithFirebase();
        },
        stopAllTimers: () => {
            // Stop all auto-click timers
            if (autoClickInterval) {
                clearInterval(autoClickInterval);
                autoClickInterval = null;
            }

            // Stop any other game timers
            if (saveInterval) {
                clearInterval(saveInterval);
                saveInterval = null;
            }

            // Stop sync interval
            if (syncInterval) {
                clearInterval(syncInterval);
                syncInterval = null;
            }

            // Reset game state
            update(state => ({
                ...state,
                clicks: 0,
                clicksPerSecond: 0,
                totalClicks: 0,
                upgrades: {},
                lastSynced: null,
                dirty: true
            }));

            // Save to local storage
            if (browser) {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(get(gameStore)));
            }
        },
        destroy: () => {
            if (browser) {
                clearInterval(saveInterval);
                clearInterval(autoClickInterval);
                clearInterval(syncInterval);
            }
        }
    };
}

export const gameStore = createGameStore();
