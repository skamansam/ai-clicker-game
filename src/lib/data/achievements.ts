import type { Achievement } from '$lib/types';
import type { AchievementCategory } from '$lib/stores/achievements';

export const achievements: Achievement[] = [
    // Click Milestones
    {
        id: 'first-click',
        name: 'First Click',
        description: 'Click the button for the first time',
        category: 'clicks',
        type: 'clicks',
        requirement: 1,
        icon: '🖱️'
    },
    {
        id: 'click-100',
        name: 'Century Clicker',
        description: 'Click 100 times',
        category: 'clicks',
        type: 'clicks',
        requirement: 100,
        icon: '💯'
    },
    {
        id: 'click-1000',
        name: 'Click Master',
        description: 'Click 1,000 times',
        category: 'clicks',
        type: 'clicks',
        requirement: 1000,
        icon: '🎯'
    },

    // Speed Records
    {
        id: 'speed-10',
        name: 'Quick Fingers',
        description: 'Click 10 times in 5 seconds',
        category: 'speed',
        type: 'speed',
        requirement: 2,  // clicks per second
        icon: '⚡'
    },
    {
        id: 'speed-20',
        name: 'Lightning Fast',
        description: 'Click 20 times in 5 seconds',
        category: 'speed',
        type: 'speed',
        requirement: 4,  // clicks per second
        icon: '⚡⚡'
    },

    // Upgrade Collection
    {
        id: 'first-upgrade',
        name: 'Upgrade Beginner',
        description: 'Purchase your first upgrade',
        category: 'upgrades',
        type: 'upgrades',
        requirement: 1,
        icon: '⬆️'
    },
    {
        id: 'all-basic-upgrades',
        name: 'Basic Collection',
        description: 'Own all basic upgrades',
        category: 'upgrades',
        type: 'upgrades',
        requirement: 5,
        icon: '📦'
    },

    // Click Streaks
    {
        id: 'streak-10',
        name: 'Getting Warmed Up',
        description: 'Maintain a 10-click streak',
        category: 'streaks',
        type: 'streaks',
        requirement: 10,
        icon: '🔥'
    },
    {
        id: 'streak-50',
        name: 'On Fire',
        description: 'Maintain a 50-click streak',
        category: 'streaks',
        type: 'streaks',
        requirement: 50,
        icon: '🔥🔥'
    },

    // Time Played
    {
        id: 'time-1h',
        name: 'Dedicated',
        description: 'Play for 1 hour',
        category: 'time',
        type: 'time',
        requirement: 3600,  // seconds
        icon: '⏰'
    },
    {
        id: 'time-24h',
        name: 'Day One',
        description: 'Play for 24 hours total',
        category: 'time',
        type: 'time',
        requirement: 86400,  // seconds
        icon: '📅'
    },

    // Prestige Ranks
    {
        id: 'first-prestige',
        name: 'New Beginning',
        description: 'Prestige for the first time',
        category: 'prestige',
        type: 'prestige',
        requirement: 1,
        icon: '✨'
    },
    {
        id: 'prestige-5',
        name: 'Prestigious',
        description: 'Reach prestige level 5',
        category: 'prestige',
        type: 'prestige',
        requirement: 5,
        icon: '🌟'
    },

    // Achievement Combos
    {
        id: 'combo-2',
        name: 'Double Trouble',
        description: 'Unlock 2 achievements within 2 seconds',
        category: 'combos',
        type: 'combos',
        requirement: 2,
        icon: '🎯'
    },
    {
        id: 'combo-3',
        name: 'Triple Threat',
        description: 'Unlock 3 achievements within 2 seconds',
        category: 'combos',
        type: 'combos',
        requirement: 3,
        icon: '🎯🎯'
    },

    // Social Status
    {
        id: 'share-first',
        name: 'Social Butterfly',
        description: 'Share your progress for the first time',
        category: 'social',
        type: 'social',
        requirement: 1,
        icon: '💬'
    },
    {
        id: 'share-10',
        name: 'Influencer',
        description: 'Share your progress 10 times',
        category: 'social',
        type: 'social',
        requirement: 10,
        icon: '🌟'
    },

    // Daily Dedication
    {
        id: 'daily-streak-3',
        name: 'Regular Player',
        description: 'Play for 3 days in a row',
        category: 'dedication',
        type: 'dedication',
        requirement: 3,
        icon: '📅'
    },
    {
        id: 'daily-streak-7',
        name: 'Week Warrior',
        description: 'Play for 7 days in a row',
        category: 'dedication',
        type: 'dedication',
        requirement: 7,
        icon: '📅📅'
    },

    // Challenge Master
    {
        id: 'challenge-first',
        name: 'Challenger',
        description: 'Complete your first challenge',
        category: 'challenges',
        type: 'challenges',
        requirement: 1,
        icon: '⚔️'
    },
    {
        id: 'challenge-all',
        name: 'Challenge Master',
        description: 'Complete all available challenges',
        category: 'challenges',
        type: 'challenges',
        requirement: 10,
        icon: '👑'
    }
];
