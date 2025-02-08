import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { Achievement } from '$lib/types';
import { achievementStore } from './achievements';
import { achievementStatsStore } from './achievement-stats';

interface ComboState {
    active: boolean;
    multiplier: number;
    achievements: Achievement[];
    timeRemaining: number;
    maxMultiplier: number;
    currentStreak: number;
    bestStreak: number;
    comboEffects: string[];
    recentCombos: {
        achievements: Achievement[];
        multiplier: number;
        time: string;
    }[];
}

interface AchievementComboStore {
    combo: ComboState;
    loading: boolean;
    error: string | null;
}

const COMBO_DURATION = 10000; // 10 seconds
const BASE_MULTIPLIER = 1;
const COMBO_MULTIPLIERS = [
    { streak: 2, multiplier: 1.2 },
    { streak: 3, multiplier: 1.5 },
    { streak: 4, multiplier: 2.0 },
    { streak: 5, multiplier: 3.0 },
    { streak: 7, multiplier: 5.0 },
    { streak: 10, multiplier: 7.0 }
];

const COMBO_EFFECTS = [
    { streak: 3, effect: 'sparkles' },
    { streak: 5, effect: 'rainbow' },
    { streak: 7, effect: 'fireworks' },
    { streak: 10, effect: 'cosmic' }
];

function createAchievementComboStore() {
    let comboTimer: number | null = null;

    const { subscribe, set, update } = writable<AchievementComboStore>({
        combo: {
            active: false,
            multiplier: BASE_MULTIPLIER,
            achievements: [],
            timeRemaining: 0,
            maxMultiplier: BASE_MULTIPLIER,
            currentStreak: 0,
            bestStreak: 0,
            comboEffects: [],
            recentCombos: []
        },
        loading: false,
        error: null
    });

    function clearComboTimer() {
        if (comboTimer) {
            clearInterval(comboTimer);
            comboTimer = null;
        }
    }

    return {
        subscribe,
        set,
        update,

        async startCombo(achievement: Achievement) {
            clearComboTimer();

            update(store => ({
                ...store,
                combo: {
                    ...store.combo,
                    active: true,
                    achievements: [achievement],
                    timeRemaining: COMBO_DURATION,
                    currentStreak: 1,
                    multiplier: BASE_MULTIPLIER,
                    comboEffects: []
                }
            }));

            // Start combo timer
            let timeLeft = COMBO_DURATION;
            comboTimer = setInterval(() => {
                timeLeft -= 100;

                if (timeLeft <= 0) {
                    this.endCombo();
                } else {
                    update(store => ({
                        ...store,
                        combo: {
                            ...store.combo,
                            timeRemaining: timeLeft
                        }
                    }));
                }
            }, 100);
        },

        async addToCombo(achievement: Achievement) {
            update(store => {
                const newStreak = store.combo.currentStreak + 1;
                const multiplierInfo = COMBO_MULTIPLIERS
                    .slice()
                    .reverse()
                    .find(m => newStreak >= m.streak);
                
                const newMultiplier = multiplierInfo ? multiplierInfo.multiplier : BASE_MULTIPLIER;
                const maxMultiplier = Math.max(store.combo.maxMultiplier, newMultiplier);

                // Get new effects
                const newEffects = COMBO_EFFECTS
                    .filter(e => e.streak === newStreak)
                    .map(e => e.effect);

                return {
                    ...store,
                    combo: {
                        ...store.combo,
                        achievements: [...store.combo.achievements, achievement],
                        currentStreak: newStreak,
                        bestStreak: Math.max(store.combo.bestStreak, newStreak),
                        multiplier: newMultiplier,
                        maxMultiplier,
                        timeRemaining: COMBO_DURATION,
                        comboEffects: [...store.combo.comboEffects, ...newEffects]
                    }
                };
            });

            // Reset combo timer
            clearComboTimer();
            let timeLeft = COMBO_DURATION;
            comboTimer = setInterval(() => {
                timeLeft -= 100;

                if (timeLeft <= 0) {
                    this.endCombo();
                } else {
                    update(store => ({
                        ...store,
                        combo: {
                            ...store.combo,
                            timeRemaining: timeLeft
                        }
                    }));
                }
            }, 100);
        },

        async endCombo() {
            clearComboTimer();

            update(store => {
                const combo = {
                    achievements: store.combo.achievements,
                    multiplier: store.combo.multiplier,
                    time: new Date().toISOString()
                };

                // Record combo if it's significant
                if (store.combo.currentStreak >= 3) {
                    achievementStatsStore.recordActivity(
                        'combo',
                        undefined,
                        `Achieved ${store.combo.currentStreak}x combo with ${store.combo.multiplier}x multiplier!`
                    );
                }

                return {
                    ...store,
                    combo: {
                        ...store.combo,
                        active: false,
                        achievements: [],
                        timeRemaining: 0,
                        multiplier: BASE_MULTIPLIER,
                        currentStreak: 0,
                        comboEffects: [],
                        recentCombos: [combo, ...store.combo.recentCombos].slice(0, 10)
                    }
                };
            });
        },

        getComboMultiplier() {
            return this.combo.multiplier;
        },

        getTimeRemaining() {
            return this.combo.timeRemaining;
        },

        getCurrentStreak() {
            return this.combo.currentStreak;
        },

        getBestStreak() {
            return this.combo.bestStreak;
        },

        getComboEffects() {
            return this.combo.comboEffects;
        },

        getRecentCombos() {
            return this.combo.recentCombos;
        },

        destroy() {
            clearComboTimer();
        }
    };
}

export const achievementComboStore = createAchievementComboStore();
