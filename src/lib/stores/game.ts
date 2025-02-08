import { writable, derived } from 'svelte/store';
import type { GameState, Upgrade, UserUpgrade } from '$lib/types';
import { db, auth } from '$lib/supabase';

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
            const user = auth.user();
            if (!user) return;

            const { data: userUpgrade, error } = await db
                .from('user_upgrades')
                .upsert({
                    user_id: user.id,
                    upgrade_id: upgrade.id,
                    quantity: 1
                }, {
                    onConflict: 'user_id,upgrade_id'
                })
                .select()
                .single();

            if (error) throw error;

            update(state => {
                const newClicksPerSecond = state.clicksPerSecond + upgrade.clicks_per_second;
                return {
                    ...state,
                    clicksPerSecond: newClicksPerSecond,
                    upgrades: [...state.upgrades, userUpgrade]
                };
            });
        },
        loadGameState: async () => {
            const user = auth.user();
            if (!user) return;

            // Load game state
            const { data: gameState } = await db
                .from('game_states')
                .select()
                .eq('user_id', user.id)
                .single();

            // Load user upgrades
            const { data: userUpgrades } = await db
                .from('user_upgrades')
                .select('*, upgrades(*)')
                .eq('user_id', user.id);

            // Load available upgrades
            const { data: availableUpgrades } = await db
                .from('upgrades')
                .select();

            // Calculate clicks per second from upgrades
            const clicksPerSecond = userUpgrades?.reduce((total, upgrade) => {
                return total + (upgrade.upgrades?.clicks_per_second ?? 0) * upgrade.quantity;
            }, 0) ?? 0;

            set({
                clicks: gameState?.clicks ?? 0,
                clicksPerSecond,
                totalClicks: gameState?.total_clicks ?? 0,
                upgrades: userUpgrades ?? [],
                availableUpgrades: availableUpgrades ?? []
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
            const user = auth.user();
            if (!user) return;

            const state = get(gameStore);
            await db
                .from('game_states')
                .upsert({
                    user_id: user.id,
                    clicks: Math.floor(state.clicks),
                    clicks_per_second: state.clicksPerSecond,
                    total_clicks: Math.floor(state.totalClicks)
                });
        }, 5000); // Save every 5 seconds
    }

    function stopIntervals() {
        if (autoClickInterval) clearInterval(autoClickInterval);
        if (saveInterval) clearInterval(saveInterval);
    }
}

export const gameStore = createGameStore();
