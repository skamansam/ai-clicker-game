import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { Achievement } from '$lib/types';
import { achievementStore } from './achievements';
import { achievementStatsStore } from './achievement-stats';
import { shopStore } from './achievement-shop';
import { rewardStore } from './achievement-rewards';

interface SkillNode {
    id: string;
    name: string;
    description: string;
    icon: string;
    type: 'passive' | 'active' | 'milestone' | 'prestige';
    effects: {
        type: string;
        value: number;
        scaling?: {
            base: number;
            factor: number;
            max?: number;
        };
    }[];
    requirements: {
        level?: number;
        points?: number;
        nodes?: string[];
        achievements?: string[];
        prestige?: number;
    };
    position: {
        x: number;
        y: number;
        branch: string;
    };
    maxRank: number;
    currentRank: number;
    cost: {
        base: number;
        scaling: number;
    };
}

interface PrestigeLevel {
    level: number;
    requirements: {
        achievements?: number;
        level?: number;
        points?: number;
        time?: number;
    };
    rewards: {
        type: string;
        value: number;
        permanent: boolean;
    }[];
    bonuses: {
        type: string;
        value: number;
    }[];
}

interface Mastery {
    id: string;
    name: string;
    description: string;
    category: string;
    level: number;
    experience: number;
    nextLevelExp: number;
    bonuses: {
        type: string;
        value: number;
        scaling: number;
    }[];
}

interface ProgressionStore {
    skillTrees: {
        [key: string]: {
            name: string;
            description: string;
            nodes: SkillNode[];
            unlockedNodes: string[];
        };
    };
    prestige: {
        level: number;
        experience: number;
        availableLevels: PrestigeLevel[];
        multiplier: number;
        bonuses: Record<string, number>;
    };
    masteries: Mastery[];
    level: number;
    experience: number;
    skillPoints: number;
    prestigePoints: number;
    masteryPoints: number;
    loading: boolean;
    error: string | null;
}

const EXP_SCALING = 1.15;
const PRESTIGE_SCALING = 2;
const MASTERY_SCALING = 1.25;

function calculateExpForLevel(level: number): number {
    return Math.floor(100 * Math.pow(EXP_SCALING, level - 1));
}

function calculatePrestigeBonus(level: number): number {
    return Math.floor(10 * Math.pow(PRESTIGE_SCALING, level - 1));
}

function calculateMasteryBonus(level: number, scaling: number): number {
    return Math.floor(scaling * Math.pow(MASTERY_SCALING, level - 1));
}

function createProgressionStore() {
    const { subscribe, set, update } = writable<ProgressionStore>({
        skillTrees: {},
        prestige: {
            level: 0,
            experience: 0,
            availableLevels: [],
            multiplier: 1,
            bonuses: {}
        },
        masteries: [],
        level: 1,
        experience: 0,
        skillPoints: 0,
        prestigePoints: 0,
        masteryPoints: 0,
        loading: false,
        error: null
    });

    return {
        subscribe,
        set,
        update,

        async loadProgression() {
            update(store => ({ ...store, loading: true, error: null }));

            try {
                // Load skill trees
                const { data: skillTrees, error: skillError } = await supabase
                    .from('skill_trees')
                    .select('*');

                if (skillError) throw skillError;

                // Load prestige data
                const { data: prestigeData, error: prestigeError } = await supabase
                    .from('prestige_levels')
                    .select('*');

                if (prestigeError) throw prestigeError;

                // Load masteries
                const { data: masteries, error: masteryError } = await supabase
                    .from('masteries')
                    .select('*');

                if (masteryError) throw masteryError;

                // Load player progression
                const { data: progression, error: progressionError } = await supabase
                    .from('player_progression')
                    .select('*')
                    .single();

                if (progressionError) throw progressionError;

                update(store => ({
                    ...store,
                    skillTrees: skillTrees.reduce((acc, tree) => {
                        acc[tree.id] = tree;
                        return acc;
                    }, {}),
                    prestige: {
                        ...store.prestige,
                        availableLevels: prestigeData,
                        ...progression.prestige
                    },
                    masteries: masteries.map(mastery => ({
                        ...mastery,
                        nextLevelExp: calculateExpForLevel(mastery.level + 1)
                    })),
                    ...progression,
                    loading: false
                }));
            } catch (error) {
                console.error('Error loading progression:', error);
                update(store => ({
                    ...store,
                    loading: false,
                    error: error.message
                }));
            }
        },

        async addExperience(amount: number) {
            const store = get(this);
            let exp = store.experience + amount;
            let level = store.level;
            let skillPoints = store.skillPoints;

            while (exp >= calculateExpForLevel(level)) {
                exp -= calculateExpForLevel(level);
                level++;
                skillPoints += 1;

                // Check for prestige availability
                const nextPrestige = store.prestige.availableLevels.find(p => 
                    p.level === store.prestige.level + 1 &&
                    p.requirements.level <= level
                );

                if (nextPrestige) {
                    this.notifyPrestigeAvailable(nextPrestige);
                }
            }

            try {
                const { error } = await supabase
                    .from('player_progression')
                    .update({
                        experience: exp,
                        level,
                        skill_points: skillPoints
                    });

                if (error) throw error;

                update(store => ({
                    ...store,
                    experience: exp,
                    level,
                    skillPoints
                }));
            } catch (error) {
                console.error('Error updating experience:', error);
            }
        },

        async unlockSkillNode(treeId: string, nodeId: string) {
            const store = get(this);
            const tree = store.skillTrees[treeId];
            const node = tree.nodes.find(n => n.id === nodeId);

            if (!node || !this.canUnlockNode(treeId, nodeId)) return;

            try {
                const { error } = await supabase
                    .rpc('unlock_skill_node', {
                        tree_id: treeId,
                        node_id: nodeId
                    });

                if (error) throw error;

                update(store => ({
                    ...store,
                    skillTrees: {
                        ...store.skillTrees,
                        [treeId]: {
                            ...tree,
                            unlockedNodes: [...tree.unlockedNodes, nodeId],
                            nodes: tree.nodes.map(n =>
                                n.id === nodeId
                                    ? { ...n, currentRank: 1 }
                                    : n
                            )
                        }
                    },
                    skillPoints: store.skillPoints - node.cost.base
                }));

                // Apply node effects
                await this.applyNodeEffects(node);
            } catch (error) {
                console.error('Error unlocking node:', error);
            }
        },

        async upgradeSkillNode(treeId: string, nodeId: string) {
            const store = get(this);
            const tree = store.skillTrees[treeId];
            const node = tree.nodes.find(n => n.id === nodeId);

            if (!node || node.currentRank >= node.maxRank) return;

            const cost = Math.floor(
                node.cost.base * Math.pow(node.cost.scaling, node.currentRank)
            );

            if (store.skillPoints < cost) return;

            try {
                const { error } = await supabase
                    .rpc('upgrade_skill_node', {
                        tree_id: treeId,
                        node_id: nodeId
                    });

                if (error) throw error;

                update(store => ({
                    ...store,
                    skillTrees: {
                        ...store.skillTrees,
                        [treeId]: {
                            ...tree,
                            nodes: tree.nodes.map(n =>
                                n.id === nodeId
                                    ? { ...n, currentRank: n.currentRank + 1 }
                                    : n
                            )
                        }
                    },
                    skillPoints: store.skillPoints - cost
                }));

                // Apply upgraded effects
                await this.applyNodeEffects(node, node.currentRank + 1);
            } catch (error) {
                console.error('Error upgrading node:', error);
            }
        },

        async prestige() {
            const store = get(this);
            const nextLevel = store.prestige.level + 1;
            const prestigeLevel = store.prestige.availableLevels.find(p => p.level === nextLevel);

            if (!prestigeLevel || !this.canPrestige(nextLevel)) return;

            try {
                const { error } = await supabase
                    .rpc('perform_prestige', {
                        prestige_level: nextLevel
                    });

                if (error) throw error;

                // Apply prestige rewards and reset progress
                const newMultiplier = store.prestige.multiplier + calculatePrestigeBonus(nextLevel);
                const permanentBonuses = prestigeLevel.rewards
                    .filter(r => r.permanent)
                    .reduce((acc, r) => {
                        acc[r.type] = (acc[r.type] || 0) + r.value;
                        return acc;
                    }, { ...store.prestige.bonuses });

                update(store => ({
                    ...store,
                    level: 1,
                    experience: 0,
                    skillPoints: prestigeLevel.rewards.find(r => r.type === 'skill_points')?.value || 0,
                    prestige: {
                        ...store.prestige,
                        level: nextLevel,
                        experience: 0,
                        multiplier: newMultiplier,
                        bonuses: permanentBonuses
                    },
                    skillTrees: Object.keys(store.skillTrees).reduce((acc, key) => {
                        acc[key] = {
                            ...store.skillTrees[key],
                            unlockedNodes: [],
                            nodes: store.skillTrees[key].nodes.map(n => ({
                                ...n,
                                currentRank: 0
                            }))
                        };
                        return acc;
                    }, {})
                }));

                // Record the achievement
                achievementStatsStore.recordActivity(
                    'challenge',
                    undefined,
                    `Reached Prestige Level ${nextLevel}!`
                );
            } catch (error) {
                console.error('Error performing prestige:', error);
            }
        },

        async gainMasteryExperience(category: string, amount: number) {
            const store = get(this);
            const mastery = store.masteries.find(m => m.category === category);
            if (!mastery) return;

            let exp = mastery.experience + amount;
            let level = mastery.level;
            let masteryPoints = store.masteryPoints;

            while (exp >= mastery.nextLevelExp) {
                exp -= mastery.nextLevelExp;
                level++;
                masteryPoints += 1;
            }

            try {
                const { error } = await supabase
                    .rpc('update_mastery', {
                        mastery_id: mastery.id,
                        new_level: level,
                        new_exp: exp
                    });

                if (error) throw error;

                update(store => ({
                    ...store,
                    masteries: store.masteries.map(m =>
                        m.id === mastery.id
                            ? {
                                ...m,
                                level,
                                experience: exp,
                                nextLevelExp: calculateExpForLevel(level + 1)
                            }
                            : m
                    ),
                    masteryPoints
                }));

                // Apply mastery bonuses
                for (const bonus of mastery.bonuses) {
                    const value = calculateMasteryBonus(level, bonus.scaling);
                    await this.applyMasteryBonus(bonus.type, value);
                }
            } catch (error) {
                console.error('Error updating mastery:', error);
            }
        },

        canUnlockNode(treeId: string, nodeId: string): boolean {
            const store = get(this);
            const tree = store.skillTrees[treeId];
            const node = tree.nodes.find(n => n.id === nodeId);

            if (!node || tree.unlockedNodes.includes(nodeId)) return false;

            return (
                (!node.requirements.level || store.level >= node.requirements.level) &&
                (!node.requirements.points || store.skillPoints >= node.cost.base) &&
                (!node.requirements.nodes || node.requirements.nodes.every(n => 
                    tree.unlockedNodes.includes(n)
                )) &&
                (!node.requirements.achievements || node.requirements.achievements.every(a =>
                    achievementStore.hasUnlockedAchievement(a)
                )) &&
                (!node.requirements.prestige || store.prestige.level >= node.requirements.prestige)
            );
        },

        canPrestige(level: number): boolean {
            const store = get(this);
            const prestigeLevel = store.prestige.availableLevels.find(p => p.level === level);
            if (!prestigeLevel) return false;

            return (
                (!prestigeLevel.requirements.achievements || 
                    achievementStore.getUnlockedAchievements().length >= prestigeLevel.requirements.achievements) &&
                (!prestigeLevel.requirements.level || store.level >= prestigeLevel.requirements.level) &&
                (!prestigeLevel.requirements.points || store.skillPoints >= prestigeLevel.requirements.points) &&
                (!prestigeLevel.requirements.time || true) // TODO: Implement time tracking
            );
        },

        getNodeEffectValue(node: SkillNode, effect: SkillNode['effects'][0], rank: number = null): number {
            const actualRank = rank || node.currentRank;
            if (!effect.scaling) return effect.value * actualRank;

            return Math.min(
                effect.scaling.max || Infinity,
                effect.scaling.base * Math.pow(effect.scaling.factor, actualRank - 1)
            );
        },

        async applyNodeEffects(node: SkillNode, rank: number = null) {
            for (const effect of node.effects) {
                const value = this.getNodeEffectValue(node, effect, rank);

                switch (effect.type) {
                    case 'click_multiplier':
                        await shopStore.updateMultiplier(value);
                        break;
                    case 'achievement_points':
                        await shopStore.addPoints(value);
                        break;
                    case 'experience_boost':
                        // Applied directly in addExperience
                        break;
                    // Add more effect types as needed
                }
            }
        },

        async applyMasteryBonus(type: string, value: number) {
            switch (type) {
                case 'click_power':
                    await shopStore.updateMultiplier(value);
                    break;
                case 'achievement_points':
                    await shopStore.addPoints(value);
                    break;
                case 'experience_gain':
                    // Applied directly in addExperience
                    break;
                // Add more bonus types as needed
            }
        },

        getTotalMultiplier(): number {
            const store = get(this);
            return (
                store.prestige.multiplier *
                Object.values(store.skillTrees).reduce((acc, tree) =>
                    acc * tree.nodes
                        .filter(n => tree.unlockedNodes.includes(n.id))
                        .reduce((nodeAcc, node) =>
                            nodeAcc * (1 + node.effects
                                .filter(e => e.type === 'click_multiplier')
                                .reduce((effectAcc, effect) =>
                                    effectAcc + this.getNodeEffectValue(node, effect),
                                    0
                                )
                            ),
                            1
                        ),
                    1
                ) *
                store.masteries.reduce((acc, mastery) =>
                    acc * (1 + mastery.bonuses
                        .filter(b => b.type === 'click_power')
                        .reduce((bonusAcc, bonus) =>
                            bonusAcc + calculateMasteryBonus(mastery.level, bonus.scaling),
                            0
                        )
                    ),
                    1
                )
            );
        },

        notifyPrestigeAvailable(prestigeLevel: PrestigeLevel) {
            // TODO: Implement notification system
            console.log(`Prestige Level ${prestigeLevel.level} available!`);
        }
    };
}

export const progressionStore = createProgressionStore();
