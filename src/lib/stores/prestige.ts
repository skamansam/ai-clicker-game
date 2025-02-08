import { writable, derived } from 'svelte/store';
import { db, auth } from '$lib/supabase';
import { gameStore } from './game';

interface PrestigeStore {
    level: number;
    multiplier: number;
    lifetimeClicks: number;
    nextPrestigeMultiplier: number;
}

function createPrestigeStore() {
    const { subscribe, set, update } = writable<PrestigeStore>({
        level: 0,
        multiplier: 1,
        lifetimeClicks: 0,
        nextPrestigeMultiplier: 1.5
    });

    return {
        subscribe,
        loadPrestige: async () => {
            const user = auth.user();
            if (!user) return;

            const { data: profile } = await db
                .from('profiles')
                .select()
                .eq('id', user.id)
                .single();

            if (profile) {
                set({
                    level: profile.prestige_level,
                    multiplier: profile.prestige_multiplier,
                    lifetimeClicks: profile.lifetime_clicks,
                    nextPrestigeMultiplier: calculateNextPrestigeMultiplier(profile.prestige_level)
                });
            }
        },
        prestige: async () => {
            const user = auth.user();
            if (!user) return;

            const state = get(gameStore);
            const currentStore = get(prestigeStore);

            // Calculate new prestige values
            const newLevel = currentStore.level + 1;
            const newMultiplier = calculateNextPrestigeMultiplier(currentStore.level);
            const newLifetimeClicks = currentStore.lifetimeClicks + state.totalClicks;

            // Update profile in database
            const { data: profile } = await db
                .from('profiles')
                .update({
                    prestige_level: newLevel,
                    prestige_multiplier: newMultiplier,
                    lifetime_clicks: newLifetimeClicks
                })
                .eq('id', user.id)
                .select()
                .single();

            if (profile) {
                // Reset game state
                await gameStore.reset();

                // Update prestige store
                set({
                    level: newLevel,
                    multiplier: newMultiplier,
                    lifetimeClicks: newLifetimeClicks,
                    nextPrestigeMultiplier: calculateNextPrestigeMultiplier(newLevel)
                });

                showPrestigeNotification(newLevel, newMultiplier);
            }
        },
        canPrestige: derived(gameStore, ($gameStore) => {
            // Require at least 1 million clicks to prestige
            return $gameStore.totalClicks >= 1_000_000;
        })
    };
}

function calculateNextPrestigeMultiplier(currentLevel: number): number {
    // Each prestige level increases the multiplier by 50%
    return 1 + (currentLevel + 1) * 0.5;
}

function showPrestigeNotification(level: number, multiplier: number) {
    const notification = document.createElement('div');
    notification.className = 'prestige-notification';
    notification.innerHTML = `
        <h3>🌟 Prestige Level ${level}!</h3>
        <p>Your new click multiplier: ${multiplier.toFixed(1)}x</p>
    `;

    const style = document.createElement('style');
    style.textContent = `
        .prestige-notification {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #845ec2, #d65db1);
            color: white;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            animation: prestige-appear 0.5s ease-out;
            z-index: 1000;
            text-align: center;
        }
        .prestige-notification h3 {
            margin: 0;
            font-size: 1.5rem;
        }
        .prestige-notification p {
            margin: 1rem 0 0 0;
            font-size: 1.2rem;
        }
        @keyframes prestige-appear {
            from {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.8);
            }
            to {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

export const prestigeStore = createPrestigeStore();
