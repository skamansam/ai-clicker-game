import { writable, derived, get } from 'svelte/store';
import type { GameState, Upgrade, UserUpgrade } from '$lib/types';
import { browser } from '$app/environment';
import { db, auth } from '$lib/firebase';
import { collection, doc, setDoc, getDoc, updateDoc, increment, query, where, getDocs } from 'firebase/firestore';
import { defaultUpgrades } from '$lib/data/upgrades';
import { prestigeStore } from './prestige';
import { stardateStore, getCurrentStardate } from '$lib/utils/stardate';

interface GameStore {
    // Basic metal/mineral resources (original clicks)
    metal: number;
    metalPerSecond: number;
    manualMetalPerSecond: number;
    totalMetal: number;
    
    // Crystal resources (second resource type)
    crystal: number;
    crystalPerSecond: number;
    totalCrystal: number;
    crystalUnlocked: boolean;
    
    // Energy resources (third resource type)
    energy: number;
    energyPerSecond: number;
    totalEnergy: number;
    energyUnlocked: boolean;
    
    // Quantum resources (fourth resource type, after prestige)
    quantum: number;
    quantumPerSecond: number;
    totalQuantum: number;
    quantumUnlocked: boolean;
    
    // Resource generators
    upgrades: { [id: string]: UserUpgrade };
    crystalGenerators: { [id: string]: UserUpgrade };
    energyGenerators: { [id: string]: UserUpgrade };
    quantumGenerators: { [id: string]: UserUpgrade };
    
    // Collection delay (for button press animation)
    collectingMetal: boolean;
    collectingCrystal: boolean;
    collectingEnergy: boolean;
    collectingQuantum: boolean;
    
    // Sync status
    lastSynced: Date | null;
    dirty: boolean;
    
    // Resource collection status
    processingDelay: number; // Delay in milliseconds for resource collection
    
    // Stardate when the game was last saved
    savedStardate: string;
}

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const LOCAL_STORAGE_KEY = 'gameState';
const MANUAL_CLICKS_WINDOW = 5000; // 5 second window for manual clicks

function createGameStore() {
    let recentClicks: number[] = [];

    // Initialize with default values or stored values
    const initialState: GameStore = browser ? loadFromLocalStorage() : {
        // Basic metal/mineral resources
        metal: 0,
        metalPerSecond: 0,
        manualMetalPerSecond: 0,
        totalMetal: 0,
        
        // Crystal resources
        crystal: 0,
        crystalPerSecond: 0,
        totalCrystal: 0,
        crystalUnlocked: false,
        
        // Energy resources
        energy: 0,
        energyPerSecond: 0,
        totalEnergy: 0,
        energyUnlocked: false,
        
        // Quantum resources
        quantum: 0,
        quantumPerSecond: 0,
        totalQuantum: 0,
        quantumUnlocked: false,
        
        // Resource generators
        upgrades: {},
        crystalGenerators: {},
        energyGenerators: {},
        quantumGenerators: {},
        
        // Collection status
        collectingMetal: false,
        collectingCrystal: false,
        collectingEnergy: false,
        collectingQuantum: false,
        
        // Sync status
        lastSynced: null,
        dirty: false,
        
        // Stardate when the game was last saved
        savedStardate: getCurrentStardate(),
        
        // Resource collection delay
        processingDelay: 3000 // 3 seconds delay for resource collection
    };

    // Helper function to calculate click power
    function calculateClickPower() {
        const store = get(prestigeStore);
        return store?.upgrades ? Math.pow(2, store.upgrades['golden_mouse'] || 0) : 1;
    }

    const { subscribe, set, update } = writable<GameStore>(initialState);

    let saveInterval: NodeJS.Timeout | undefined;
    let autoClickInterval: NodeJS.Timeout | undefined;
    let syncInterval: NodeJS.Timeout | undefined;
    let manualClicksInterval: NodeJS.Timeout | undefined;
    let resourceCheckInterval: NodeJS.Timeout | undefined;

    function loadFromLocalStorage(): GameStore {
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                
                // Handle migration from old format to new format
                if (parsed.clicks !== undefined && parsed.metal === undefined) {
                    return {
                        // Basic metal/mineral resources (migrated from clicks)
                        metal: parsed.clicks || 0,
                        metalPerSecond: parsed.clicksPerSecond || 0,
                        manualMetalPerSecond: 0,
                        totalMetal: parsed.totalClicks || 0,
                        
                        // Crystal resources
                        crystal: 0,
                        crystalPerSecond: 0,
                        totalCrystal: 0,
                        crystalUnlocked: false,
                        
                        // Energy resources
                        energy: 0,
                        energyPerSecond: 0,
                        totalEnergy: 0,
                        energyUnlocked: false,
                        
                        // Quantum resources
                        quantum: 0,
                        quantumPerSecond: 0,
                        totalQuantum: 0,
                        quantumUnlocked: false,
                        
                        // Resource generators
                        upgrades: parsed.upgrades || {},
                        crystalGenerators: {},
                        energyGenerators: {},
                        quantumGenerators: {},
                        
                        // Collection status
                        collectingMetal: false,
                        collectingCrystal: false,
                        collectingEnergy: false,
                        collectingQuantum: false,
                        
                        // Sync status
                        lastSynced: parsed.lastSynced ? new Date(parsed.lastSynced) : null,
                        dirty: true,
                        
                        // Stardate when the game was last saved
                        savedStardate: parsed.savedStardate || getCurrentStardate(),
                        
                        // Resource collection delay
                        processingDelay: 3000
                    };
                }
                
                // Return parsed data with defaults for any missing fields
                return {
                    // Basic metal/mineral resources
                    metal: parsed.metal || 0,
                    metalPerSecond: parsed.metalPerSecond || 0,
                    manualMetalPerSecond: 0,
                    totalMetal: parsed.totalMetal || 0,
                    
                    // Crystal resources
                    crystal: parsed.crystal || 0,
                    crystalPerSecond: parsed.crystalPerSecond || 0,
                    totalCrystal: parsed.totalCrystal || 0,
                    crystalUnlocked: parsed.crystalUnlocked || false,
                    
                    // Energy resources
                    energy: parsed.energy || 0,
                    energyPerSecond: parsed.energyPerSecond || 0,
                    totalEnergy: parsed.totalEnergy || 0,
                    energyUnlocked: parsed.energyUnlocked || false,
                    
                    // Quantum resources
                    quantum: parsed.quantum || 0,
                    quantumPerSecond: parsed.quantumPerSecond || 0,
                    totalQuantum: parsed.totalQuantum || 0,
                    quantumUnlocked: parsed.quantumUnlocked || false,
                    
                    // Resource generators
                    upgrades: parsed.upgrades || {},
                    crystalGenerators: parsed.crystalGenerators || {},
                    energyGenerators: parsed.energyGenerators || {},
                    quantumGenerators: parsed.quantumGenerators || {},
                    
                    // Collection status
                    collectingMetal: false,
                    collectingCrystal: false,
                    collectingEnergy: false,
                    collectingQuantum: false,
                    
                    // Sync status
                    lastSynced: parsed.lastSynced ? new Date(parsed.lastSynced) : null,
                    dirty: parsed.dirty || false,
                    
                    // Resource collection delay
                    processingDelay: parsed.processingDelay || 3000,
                    
                    // Stardate when the game was last saved
                    savedStardate: parsed.savedStardate || getCurrentStardate()
                };
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
        
        // Default state if nothing in localStorage
        return {
            // Basic metal/mineral resources
            metal: 0,
            metalPerSecond: 0,
            manualMetalPerSecond: 0,
            totalMetal: 0,
            
            // Crystal resources
            crystal: 0,
            crystalPerSecond: 0,
            totalCrystal: 0,
            crystalUnlocked: false,
            
            // Energy resources
            energy: 0,
            energyPerSecond: 0,
            totalEnergy: 0,
            energyUnlocked: false,
            
            // Quantum resources
            quantum: 0,
            quantumPerSecond: 0,
            totalQuantum: 0,
            quantumUnlocked: false,
            
            // Resource generators
            upgrades: {},
            crystalGenerators: {},
            energyGenerators: {},
            quantumGenerators: {},
            
            // Collection status
            collectingMetal: false,
            collectingCrystal: false,
            collectingEnergy: false,
            collectingQuantum: false,
            
            // Sync status
            lastSynced: null,
            dirty: false,
            
            // Resource collection delay
            processingDelay: 3000,
            
            // Stardate when the game was last saved
            savedStardate: getCurrentStardate()
        };
    }

    function saveToLocalStorage(state: GameStore) {
        if (!browser) return;
        try {
            // Update the saved stardate
            state.savedStardate = stardateStore.getCurrentForSave();
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
        
        // Update the saved stardate before syncing
        update(s => ({ ...s, savedStardate: stardateStore.getCurrentForSave() }));
        
        try {
            const gameStateRef = doc(db, 'game_states', user.uid);
            await setDoc(gameStateRef, {
                // Basic metal resources
                metal: state.metal,
                totalMetal: state.totalMetal,
                metalPerSecond: state.metalPerSecond,
                
                // Crystal resources
                crystal: state.crystal,
                totalCrystal: state.totalCrystal,
                crystalPerSecond: state.crystalPerSecond,
                crystalUnlocked: state.crystalUnlocked,
                
                // Energy resources
                energy: state.energy,
                totalEnergy: state.totalEnergy,
                energyPerSecond: state.energyPerSecond,
                energyUnlocked: state.energyUnlocked,
                
                // Quantum resources
                quantum: state.quantum,
                totalQuantum: state.totalQuantum,
                quantumPerSecond: state.quantumPerSecond,
                quantumUnlocked: state.quantumUnlocked,
                
                // Resource generators
                upgrades: state.upgrades,
                crystalGenerators: state.crystalGenerators,
                energyGenerators: state.energyGenerators,
                quantumGenerators: state.quantumGenerators,
                
                // Sync status
                lastSynced: new Date(),
                
                // Save the current stardate
                savedStardate: state.savedStardate
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

        // Resource generation interval
        autoClickInterval = setInterval(() => {
            update(state => {
                const store = get(prestigeStore);
                const prestigeMultiplier = store?.multiplier || 1;
                
                // Calculate metal generation
                const autoMetalPerSecond = state.metalPerSecond - state.manualMetalPerSecond;
                const timeWarpMultiplier = Math.pow(1.5, store?.upgrades?.['time_warp'] || 0);
                const boostedMetalRate = autoMetalPerSecond * timeWarpMultiplier;
                
                // Add quantum engine passive generation
                const quantumLevel = store?.upgrades?.['quantum_engine'] || 0;
                const passiveMetalRate = quantumLevel;
                
                // Apply prestige multiplier to everything except quantum engine
                const totalMetalGenerated = (boostedMetalRate * prestigeMultiplier) + passiveMetalRate;
                
                // Calculate crystal generation if unlocked
                let crystalGenerated = 0;
                if (state.crystalUnlocked) {
                    crystalGenerated = state.crystalPerSecond * prestigeMultiplier;
                }
                
                // Calculate energy generation if unlocked
                let energyGenerated = 0;
                if (state.energyUnlocked) {
                    energyGenerated = state.energyPerSecond * prestigeMultiplier;
                }
                
                // Calculate quantum generation if unlocked
                let quantumGenerated = 0;
                if (state.quantumUnlocked) {
                    quantumGenerated = state.quantumPerSecond * prestigeMultiplier;
                }
                
                // Check if crystal should be unlocked (once player has 100 metal)
                const crystalUnlocked = state.crystalUnlocked || state.metal >= 100;
                
                // Check if energy should be unlocked (once player has 50 crystal)
                const energyUnlocked = state.energyUnlocked || (crystalUnlocked && state.crystal >= 50);
                
                // Quantum is only unlocked through prestige
                
                return {
                    ...state,
                    // Update metal
                    metal: state.metal + totalMetalGenerated,
                    totalMetal: state.totalMetal + totalMetalGenerated,
                    
                    // Update crystal if unlocked
                    crystal: crystalUnlocked ? state.crystal + crystalGenerated : state.crystal,
                    totalCrystal: crystalUnlocked ? state.totalCrystal + crystalGenerated : state.totalCrystal,
                    crystalUnlocked,
                    
                    // Update energy if unlocked
                    energy: energyUnlocked ? state.energy + energyGenerated : state.energy,
                    totalEnergy: energyUnlocked ? state.totalEnergy + energyGenerated : state.totalEnergy,
                    energyUnlocked,
                    
                    // Update quantum if unlocked
                    quantum: state.quantumUnlocked ? state.quantum + quantumGenerated : state.quantum,
                    totalQuantum: state.quantumUnlocked ? state.totalQuantum + quantumGenerated : state.totalQuantum,
                    
                    dirty: true
                };
            });
        }, 1000);

        // Update manual clicks per second and calculate resource generation rates
        manualClicksInterval = setInterval(() => {
            const now = Date.now();
            recentClicks = recentClicks.filter(time => now - time < MANUAL_CLICKS_WINDOW);
            const manualMetalPerSecond = recentClicks.length / (MANUAL_CLICKS_WINDOW / 1000);
            
            update(state => {
                // Calculate metal generation from upgrades
                const metalFromUpgrades = Object.values(state.upgrades).reduce((sum, upgrade) => {
                    if (upgrade.resource_type === 'metal') {
                        return sum + (upgrade.clicks_per_second * upgrade.count);
                    }
                    return sum;
                }, 0);
                
                // Calculate crystal generation from upgrades
                const crystalFromUpgrades = Object.values(state.crystalGenerators).reduce((sum, upgrade) => {
                    if (upgrade.resource_type === 'crystal') {
                        return sum + (upgrade.clicks_per_second * upgrade.count);
                    }
                    return sum;
                }, 0);
                
                // Calculate energy generation from upgrades
                const energyFromUpgrades = Object.values(state.energyGenerators).reduce((sum, upgrade) => {
                    if (upgrade.resource_type === 'energy') {
                        return sum + (upgrade.clicks_per_second * upgrade.count);
                    }
                    return sum;
                }, 0);
                
                // Calculate quantum generation from upgrades
                const quantumFromUpgrades = Object.values(state.quantumGenerators).reduce((sum, upgrade) => {
                    if (upgrade.resource_type === 'quantum') {
                        return sum + (upgrade.clicks_per_second * upgrade.count);
                    }
                    return sum;
                }, 0);
                
                return {
                    ...state,
                    manualMetalPerSecond,
                    metalPerSecond: manualMetalPerSecond + metalFromUpgrades,
                    crystalPerSecond: crystalFromUpgrades,
                    energyPerSecond: energyFromUpgrades,
                    quantumPerSecond: quantumFromUpgrades
                };
            });
        }, 100);

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

        // Metal collection (primary resource)
        collectMetal: () => {
            if (!browser) return;
            
            recentClicks.push(Date.now());

            // Use the helper function
            const clickPower = calculateClickPower();
            
            update(state => ({
                ...state,
                collectingMetal: true,
                metal: state.metal + clickPower,
                totalMetal: state.totalMetal + clickPower,
                dirty: true
            }));
            
            // Reset collecting flag after delay
            setTimeout(() => {
                update(state => ({
                    ...state,
                    collectingMetal: false
                }));
            }, get({ subscribe }).processingDelay);
        },

        // Get the current click power based on prestige upgrades
        getClickPower: () => {
            if (!browser) return 1;
            
            // Use the helper function
            return calculateClickPower();
        },

        reset: () => {
            if (!browser) return;
            
            update(state => ({
                ...state,
                // Reset metal resources
                metal: 0,
                totalMetal: 0,
                metalPerSecond: 0,
                manualMetalPerSecond: 0,
                
                // Reset crystal resources
                crystal: 0,
                totalCrystal: 0,
                crystalPerSecond: 0,
                crystalUnlocked: false,
                
                // Reset energy resources
                energy: 0,
                totalEnergy: 0,
                energyPerSecond: 0,
                energyUnlocked: false,
                
                // Reset quantum resources
                quantum: 0,
                totalQuantum: 0,
                quantumPerSecond: 0,
                quantumUnlocked: false,
                
                // Reset generators
                upgrades: {},
                crystalGenerators: {},
                energyGenerators: {},
                quantumGenerators: {},
                
                // Reset collection status
                collectingMetal: false,
                collectingCrystal: false,
                collectingEnergy: false,
                collectingQuantum: false,
                
                dirty: true
            }));

            // Clear recent clicks
            recentClicks = [];
            
            // Save to localStorage
            const state = get({ subscribe });
            saveToLocalStorage(state);
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
                            // Load the saved stardate if it exists
                            if (firebaseData.savedStardate) {
                                stardateStore.loadFromSave(firebaseData.savedStardate);
                            }
                            
                            update(state => ({
                                ...state,
                                // Metal resources
                                metal: firebaseData.metal || 0,
                                totalMetal: firebaseData.totalMetal || 0,
                                metalPerSecond: firebaseData.metalPerSecond || 0,
                                
                                // Crystal resources
                                crystal: firebaseData.crystal || 0,
                                totalCrystal: firebaseData.totalCrystal || 0,
                                crystalPerSecond: firebaseData.crystalPerSecond || 0,
                                crystalUnlocked: firebaseData.crystalUnlocked || false,
                                
                                // Energy resources
                                energy: firebaseData.energy || 0,
                                totalEnergy: firebaseData.totalEnergy || 0,
                                energyPerSecond: firebaseData.energyPerSecond || 0,
                                energyUnlocked: firebaseData.energyUnlocked || false,
                                
                                // Quantum resources
                                quantum: firebaseData.quantum || 0,
                                totalQuantum: firebaseData.totalQuantum || 0,
                                quantumPerSecond: firebaseData.quantumPerSecond || 0,
                                quantumUnlocked: firebaseData.quantumUnlocked || false,
                                
                                // Resource generators
                                upgrades: firebaseData.upgrades || {},
                                crystalGenerators: firebaseData.crystalGenerators || {},
                                energyGenerators: firebaseData.energyGenerators || {},
                                quantumGenerators: firebaseData.quantumGenerators || {},
                                
                                // Saved stardate
                                savedStardate: firebaseData.savedStardate || getCurrentStardate(),
                                
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
                // Determine which resource type this upgrade affects
                const resourceType = upgrade.resource_type || 'metal';
                
                // Select the appropriate generator collection based on resource type
                let generatorCollection: {[id: string]: UserUpgrade};
                let resourceAmount: number;
                
                switch(resourceType) {
                    case 'crystal':
                        generatorCollection = state.crystalGenerators;
                        resourceAmount = state.metal; // Crystal generators cost metal
                        break;
                    case 'energy':
                        generatorCollection = state.energyGenerators;
                        resourceAmount = state.crystal; // Energy generators cost crystal
                        break;
                    case 'quantum':
                        generatorCollection = state.quantumGenerators;
                        resourceAmount = state.energy; // Quantum generators cost energy
                        break;
                    default: // 'metal'
                        generatorCollection = state.upgrades;
                        resourceAmount = state.metal; // Metal generators cost metal
                        break;
                }
                
                // Calculate the cost based on the upgrade's base cost and current count
                const currentCount = generatorCollection[upgradeId]?.count || 0;
                const cost = Math.floor(upgrade.base_cost * Math.pow(1.15, currentCount));
                
                // Create a new user upgrade object if it doesn't exist
                const userUpgrade = generatorCollection[upgradeId] || {
                    id: upgradeId,
                    count: 0,
                    clicks_per_second: upgrade.clicks_per_second,
                    resource_type: resourceType
                };

                // Check if user has enough resources
                if (resourceAmount < cost) return state;

                const newCount = userUpgrade.count + 1;
                
                // Create updated state based on resource type
                let updatedState = { ...state, dirty: true };
                
                // Deduct cost from appropriate resource and update the generator collection
                switch(resourceType) {
                    case 'crystal':
                        updatedState.metal = state.metal - cost;
                        updatedState.crystalGenerators = {
                            ...state.crystalGenerators,
                            [upgradeId]: {
                                ...userUpgrade,
                                count: newCount
                            }
                        };
                        break;
                    case 'energy':
                        updatedState.crystal = state.crystal - cost;
                        updatedState.energyGenerators = {
                            ...state.energyGenerators,
                            [upgradeId]: {
                                ...userUpgrade,
                                count: newCount
                            }
                        };
                        break;
                    case 'quantum':
                        updatedState.energy = state.energy - cost;
                        updatedState.quantumGenerators = {
                            ...state.quantumGenerators,
                            [upgradeId]: {
                                ...userUpgrade,
                                count: newCount
                            }
                        };
                        break;
                    default: // 'metal'
                        updatedState.metal = state.metal - cost;
                        updatedState.upgrades = {
                            ...state.upgrades,
                            [upgradeId]: {
                                ...userUpgrade,
                                count: newCount
                            }
                        };
                        break;
                }
                
                return updatedState;
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
                autoClickInterval = undefined;
            }

            // Stop any other game timers
            if (saveInterval) {
                clearInterval(saveInterval);
                saveInterval = undefined;
            }

            // Stop sync interval
            if (syncInterval) {
                clearInterval(syncInterval);
                syncInterval = undefined;
            }

            // Stop manual clicks interval
            if (manualClicksInterval) {
                clearInterval(manualClicksInterval);
                manualClicksInterval = undefined;
            }

            // Reset game state
            update(state => ({
                ...state,
                clicks: 0,
                clicksPerSecond: 0,
                manualClicksPerSecond: 0,
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
                if (saveInterval) clearInterval(saveInterval);
                if (autoClickInterval) clearInterval(autoClickInterval);
                if (syncInterval) clearInterval(syncInterval);
                if (manualClicksInterval) clearInterval(manualClicksInterval);
                if (resourceCheckInterval) clearInterval(resourceCheckInterval);
                
                saveInterval = undefined;
                autoClickInterval = undefined;
                syncInterval = undefined;
                manualClicksInterval = undefined;
                resourceCheckInterval = undefined;
            }
        }
    };
}

export const gameStore = createGameStore();
