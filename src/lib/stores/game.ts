import { writable, derived } from 'svelte/store';
import type { GameState, Upgrade, UserUpgrade } from '$lib/types';
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

    return {
        subscribe,
        click: () => {
            update(state => ({
                ...state,
                clicks: state.clicks + 1,
                totalClicks: state.totalClicks + 1
            }));
        },
        purchaseUpgrade: async (upgrade: Upgrade) => {
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
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                }

                update(state => ({
                    ...state,
                    clicks: state.clicks - upgrade.cost,
                    clicksPerSecond: state.clicksPerSecond + upgrade.clicksPerSecond,
                    upgrades: [...state.upgrades, { ...upgrade, quantity: 1 }]
                }));
            } catch (error) {
                console.error('Error purchasing upgrade:', error);
                throw error;
            }
        },
        loadGameState: async () => {
            const user = auth.currentUser;
            if (!user) return;

            // Load game state
            const gameStateRef = doc(db, 'game_states', user.uid);
            const gameStateDoc = await getDoc(gameStateRef);
            const gameState = gameStateDoc.data() as GameState;

            // Load user upgrades
            const userUpgradesRef = collection(db, 'user_upgrades');
            const userUpgradesQuery = query(userUpgradesRef, where('userId', '==', user.uid));
            const userUpgradesDocs = await getDocs(userUpgradesQuery);
            const userUpgrades = userUpgradesDocs.docs.map(doc => ({ ...doc.data(), id: doc.id }));

            // Load available upgrades
            const availableUpgradesRef = collection(db, 'upgrades');
            const availableUpgradesDocs = await getDocs(availableUpgradesRef);
            const availableUpgrades = availableUpgradesDocs.docs.map(doc => ({ ...doc.data(), id: doc.id }));

            // Calculate clicks per second from upgrades
            const clicksPerSecond = userUpgrades.reduce((total, upgrade) => {
                return total + (upgrade.upgrade.clicksPerSecond ?? 0) * upgrade.quantity;
            }, 0);

            set({
                clicks: gameState.clicks ?? 0,
                clicksPerSecond,
                totalClicks: gameState.totalClicks ?? 0,
                upgrades: userUpgrades,
                availableUpgrades: availableUpgrades
            });

            // Start auto-clicking based on upgrades
            startAutoClick();
            // Start auto-saving
            startAutoSave();
        },
        reset: () => {
            stopIntervals();
            set({
                clicks: 0,
                clicksPerSecond: 0,
                totalClicks: 0,
                upgrades: [],
                availableUpgrades: []
            });
        }
    };

    function startAutoClick() {
        stopIntervals();
        autoClickInterval = setInterval(() => {
            update(state => ({
                ...state,
                clicks: state.clicks + state.clicksPerSecond / 10,
                totalClicks: state.totalClicks + state.clicksPerSecond / 10
            }));
        }, 100); // Update every 100ms for smoother animation
    }

    function startAutoSave() {
        saveInterval = setInterval(async () => {
            const user = auth.currentUser;
            if (!user) return;

            const state = get(gameStore);
            await setDoc(doc(db, 'game_states', user.uid), {
                clicks: Math.floor(state.clicks),
                clicksPerSecond: state.clicksPerSecond,
                totalClicks: Math.floor(state.totalClicks)
            });
        }, 5000); // Save every 5 seconds
    }

    function stopIntervals() {
        if (autoClickInterval) clearInterval(autoClickInterval);
        if (saveInterval) clearInterval(saveInterval);
    }
}

export const gameStore = createGameStore();
