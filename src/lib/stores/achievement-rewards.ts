import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { Achievement } from '$lib/types';
import { achievementStore } from './achievements';
import { achievementStatsStore } from './achievement-stats';
import { shopStore } from './achievement-shop';

interface RewardTier {
    id: string;
    name: string;
    color: string;
    icon: string;
    requirements: {
        achievements?: number;
        perfect_sets?: number;
        challenges?: number;
        competitions?: number;
        points?: number;
        multiplier?: number;
    };
    rewards: {
        type: 'multiplier' | 'points' | 'badge' | 'title' | 'theme' | 'effect';
        value: number | string;
    }[];
}

interface Milestone {
    id: string;
    name: string;
    description: string;
    type: 'achievement' | 'collection' | 'challenge' | 'social';
    target: number;
    rewards: {
        type: 'multiplier' | 'points' | 'badge' | 'title' | 'theme' | 'effect';
        value: number | string;
    }[];
    repeatable: boolean;
    completion_count: number;
}

interface DailyReward {
    day: number;
    claimed: boolean;
    rewards: {
        type: 'multiplier' | 'points' | 'badge' | 'title' | 'theme' | 'effect';
        value: number | string;
    }[];
    bonus: boolean;
}

interface RewardStore {
    tiers: RewardTier[];
    currentTier: string;
    nextTier: string;
    milestones: Milestone[];
    dailyRewards: DailyReward[];
    currentStreak: number;
    lastClaimDate: string;
    loading: boolean;
    error: string | null;
}

function createRewardStore() {
    const { subscribe, set, update } = writable<RewardStore>({
        tiers: [],
        currentTier: '',
        nextTier: '',
        milestones: [],
        dailyRewards: [],
        currentStreak: 0,
        lastClaimDate: '',
        loading: false,
        error: null
    });

    return {
        subscribe,
        set,
        update,

        async loadRewards() {
            update(store => ({ ...store, loading: true, error: null }));

            try {
                // Load reward tiers
                const { data: tiers, error: tiersError } = await supabase
                    .from('achievement_tiers')
                    .select('*')
                    .order('requirements->achievements', { ascending: true });

                if (tiersError) throw tiersError;

                // Load milestones
                const { data: milestones, error: milestonesError } = await supabase
                    .from('achievement_milestones')
                    .select('*');

                if (milestonesError) throw milestonesError;

                // Load daily rewards
                const { data: dailyRewards, error: dailyError } = await supabase
                    .from('daily_rewards')
                    .select('*')
                    .order('day', { ascending: true });

                if (dailyError) throw dailyError;

                // Calculate current tier
                const stats = achievementStatsStore.playerStats;
                let currentTier = tiers[0].id;
                let nextTier = tiers[1]?.id;

                for (let i = tiers.length - 1; i >= 0; i--) {
                    const tier = tiers[i];
                    if (this.meetsRequirements(tier.requirements)) {
                        currentTier = tier.id;
                        nextTier = tiers[i + 1]?.id;
                        break;
                    }
                }

                update(store => ({
                    ...store,
                    tiers,
                    currentTier,
                    nextTier,
                    milestones,
                    dailyRewards,
                    loading: false
                }));
            } catch (error) {
                console.error('Error loading rewards:', error);
                update(store => ({
                    ...store,
                    loading: false,
                    error: error.message
                }));
            }
        },

        meetsRequirements(requirements: RewardTier['requirements']) {
            const stats = achievementStatsStore.playerStats;
            const inventory = shopStore.inventory;

            return (
                (!requirements.achievements || stats.totalUnlocked >= requirements.achievements) &&
                (!requirements.perfect_sets || stats.perfectSets >= requirements.perfect_sets) &&
                (!requirements.challenges || stats.completedChallenges >= requirements.challenges) &&
                (!requirements.competitions || stats.completedCompetitions >= requirements.competitions) &&
                (!requirements.points || inventory.points >= requirements.points) &&
                (!requirements.multiplier || inventory.multiplier >= requirements.multiplier)
            );
        },

        async claimDailyReward() {
            const today = new Date().toISOString().split('T')[0];
            
            try {
                const { data, error } = await supabase
                    .rpc('claim_daily_reward', {
                        claim_date: today
                    });

                if (error) throw error;

                const {
                    rewards,
                    streak,
                    bonus
                } = data;

                // Apply rewards
                for (const reward of rewards) {
                    switch (reward.type) {
                        case 'points':
                            await shopStore.addPoints(reward.value);
                            break;
                        case 'multiplier':
                            // Apply temporary multiplier
                            break;
                        default:
                            // Add item to inventory
                            break;
                    }
                }

                update(store => ({
                    ...store,
                    currentStreak: streak,
                    lastClaimDate: today,
                    dailyRewards: store.dailyRewards.map(dr =>
                        dr.day === streak
                            ? { ...dr, claimed: true, bonus }
                            : dr
                    )
                }));

                return { rewards, streak, bonus };
            } catch (error) {
                console.error('Error claiming daily reward:', error);
                throw error;
            }
        },

        async checkMilestones() {
            const stats = achievementStatsStore.playerStats;

            try {
                for (const milestone of this.milestones) {
                    let progress = 0;

                    switch (milestone.type) {
                        case 'achievement':
                            progress = stats.totalUnlocked;
                            break;
                        case 'collection':
                            progress = stats.completedCollections;
                            break;
                        case 'challenge':
                            progress = stats.completedChallenges;
                            break;
                        case 'social':
                            progress = stats.socialActions;
                            break;
                    }

                    if (progress >= milestone.target && 
                        (milestone.repeatable || milestone.completion_count === 0)) {
                        await this.claimMilestone(milestone.id);
                    }
                }
            } catch (error) {
                console.error('Error checking milestones:', error);
            }
        },

        async claimMilestone(milestoneId: string) {
            try {
                const { data, error } = await supabase
                    .rpc('claim_milestone_reward', {
                        milestone_id: milestoneId
                    });

                if (error) throw error;

                update(store => ({
                    ...store,
                    milestones: store.milestones.map(m =>
                        m.id === milestoneId
                            ? { ...m, completion_count: m.completion_count + 1 }
                            : m
                    )
                }));

                return data.rewards;
            } catch (error) {
                console.error('Error claiming milestone:', error);
                throw error;
            }
        },

        async checkTierProgress() {
            const currentTier = this.tiers.find(t => t.id === this.currentTier);
            const nextTier = this.tiers.find(t => t.id === this.nextTier);

            if (nextTier && this.meetsRequirements(nextTier.requirements)) {
                try {
                    const { data, error } = await supabase
                        .rpc('upgrade_achievement_tier', {
                            new_tier_id: nextTier.id
                        });

                    if (error) throw error;

                    update(store => ({
                        ...store,
                        currentTier: nextTier.id,
                        nextTier: this.tiers[this.tiers.indexOf(nextTier) + 1]?.id
                    }));

                    return {
                        oldTier: currentTier,
                        newTier: nextTier,
                        rewards: data.rewards
                    };
                } catch (error) {
                    console.error('Error upgrading tier:', error);
                }
            }

            return null;
        },

        getTier(tierId: string) {
            return this.tiers.find(t => t.id === tierId);
        },

        getMilestone(milestoneId: string) {
            return this.milestones.find(m => m.id === milestoneId);
        },

        getDailyReward(day: number) {
            return this.dailyRewards.find(dr => dr.day === day);
        },

        canClaimDaily() {
            const today = new Date().toISOString().split('T')[0];
            return today !== this.lastClaimDate;
        },

        getNextMilestone(type: Milestone['type']) {
            const stats = achievementStatsStore.playerStats;
            let progress = 0;

            switch (type) {
                case 'achievement':
                    progress = stats.totalUnlocked;
                    break;
                case 'collection':
                    progress = stats.completedCollections;
                    break;
                case 'challenge':
                    progress = stats.completedChallenges;
                    break;
                case 'social':
                    progress = stats.socialActions;
                    break;
            }

            return this.milestones
                .filter(m => m.type === type && 
                    (m.repeatable || m.completion_count === 0) &&
                    m.target > progress)
                .sort((a, b) => a.target - b.target)[0];
        },

        getTierProgress(tierId: string) {
            const tier = this.getTier(tierId);
            if (!tier) return null;

            const stats = achievementStatsStore.playerStats;
            const inventory = shopStore.inventory;
            const progress: Record<string, { current: number; required: number }> = {};

            if (tier.requirements.achievements) {
                progress.achievements = {
                    current: stats.totalUnlocked,
                    required: tier.requirements.achievements
                };
            }

            if (tier.requirements.perfect_sets) {
                progress.perfect_sets = {
                    current: stats.perfectSets,
                    required: tier.requirements.perfect_sets
                };
            }

            if (tier.requirements.challenges) {
                progress.challenges = {
                    current: stats.completedChallenges,
                    required: tier.requirements.challenges
                };
            }

            if (tier.requirements.competitions) {
                progress.competitions = {
                    current: stats.completedCompetitions,
                    required: tier.requirements.competitions
                };
            }

            if (tier.requirements.points) {
                progress.points = {
                    current: inventory.points,
                    required: tier.requirements.points
                };
            }

            if (tier.requirements.multiplier) {
                progress.multiplier = {
                    current: inventory.multiplier,
                    required: tier.requirements.multiplier
                };
            }

            return progress;
        }
    };
}

export const rewardStore = createRewardStore();
