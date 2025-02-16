import { writable, derived, get } from 'svelte/store';
import type { GameState, Upgrade, UserUpgrade } from '$lib/types';
import { browser } from '$app/environment';
import { db, auth } from '$lib/firebase';
import { collection, doc, setDoc, getDoc, updateDoc, increment, query, where, getDocs } from 'firebase/firestore';

interface GameStore {
    clicks: number;
    clicksPerSecond: number;
    totalClicks: number;
    upgrades: UserUpgrade[];
    availableUpgrades: Upgrade[];
}

function createGameStore() {
    const { subscribe, set, update } = writable<GameStore>({
        clicks: 0,
        clicksPerSecond: 0,
        totalClicks: 0,
        upgrades: [],
        availableUpgrades: []
    });

    let saveInterval: NodeJS.Timeout;
    let autoClickInterval: NodeJS.Timeout;

    if (browser) {
        // Initialize intervals only in browser environment
        saveInterval = setInterval(async () => {
            const user = auth.currentUser;
            if (!user) return;

            const store = get({ subscribe });
            const gameStateRef = doc(db, 'game_states', user.uid);
            await setDoc(gameStateRef, {
                clicks: store.clicks,
                totalClicks: store.totalClicks,
                lastSaved: new Date()
            }, { merge: true });
        }, 60000); // Save every minute

        autoClickInterval = setInterval(() => {
            update(state => ({
                ...state,
                clicks: state.clicks + state.clicksPerSecond,
                totalClicks: state.totalClicks + state.clicksPerSecond
            }));
        }, 1000);
    }

    const store = {
        subscribe,
        click: () => {
            if (!browser) return;
            
            update(state => ({
                ...state,
                clicks: state.clicks + 1,
                totalClicks: state.totalClicks + 1
            }));
        },
        loadGameState: async () => {
            if (!browser) return;
            
            const user = auth.currentUser;
            if (!user) return;

            try {
                const gameStateRef = doc(db, 'game_states', user.uid);
                const gameStateDoc = await getDoc(gameStateRef);

                if (gameStateDoc.exists()) {
                    const data = gameStateDoc.data();
                    update(state => ({
                        ...state,
                        clicks: data.clicks || 0,
                        totalClicks: data.totalClicks || 0
                    }));
                } else {
                    // Initialize new game state
                    await setDoc(gameStateRef, {
                        clicks: 0,
                        totalClicks: 0,
                        lastSaved: new Date()
                    });
                }

                // Load upgrades after loading game state
                await store.loadUpgrades();
            } catch (error) {
                console.error('Error loading game state:', error);
                throw error;
            }
        },
        purchaseUpgrade: async (upgrade: Upgrade) => {
            if (!browser) return;
            
            const user = auth.currentUser;
            if (!user) return;

            const userUpgradesRef = collection(db, 'user_upgrades');
            const upgradeRef = doc(userUpgradesRef, `${user.uid}_${upgrade.id}`);
            
            try {
                const upgradeDoc = await getDoc(upgradeRef);
                if (upgradeDoc.exists()) {
                    // Update existing upgrade
                    await updateDoc(upgradeRef, {
                        quantity: increment(1)
                    });
                } else {
                    // Create new upgrade
                    await setDoc(upgradeRef, {
                        userId: user.uid,
                        upgradeId: upgrade.id,
                        quantity: 1,
                        purchasedAt: new Date()
                    });
                }

                // Refresh upgrades
                await store.loadUpgrades();
            } catch (error) {
                console.error('Error purchasing upgrade:', error);
                throw error;
            }
        },
        loadUpgrades: async () => {
            if (!browser) return;
            
            const user = auth.currentUser;
            if (!user) return;

            try {
                // Load user upgrades
                const userUpgradesRef = collection(db, 'user_upgrades');
                const userUpgradesQuery = query(userUpgradesRef, where('userId', '==', user.uid));
                const userUpgradesSnapshot = await getDocs(userUpgradesQuery);
                const userUpgrades = userUpgradesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Load available upgrades
                const upgradesRef = collection(db, 'upgrades');
                const upgradesSnapshot = await getDocs(upgradesRef);
                const availableUpgrades = upgradesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                update(state => ({
                    ...state,
                    upgrades: userUpgrades,
                    availableUpgrades
                }));
            } catch (error) {
                console.error('Error loading upgrades:', error);
                throw error;
            }
        },
        destroy: () => {
            if (browser) {
                clearInterval(saveInterval);
                clearInterval(autoClickInterval);
            }
        }
    };

    return store;
}

export const gameStore = createGameStore();
