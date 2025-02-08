import { writable } from 'svelte/store';
import type { Achievement } from '$lib/types';

export interface Notification {
    id: string;
    type: 'achievement' | 'combo' | 'challenge' | 'tier';
    title: string;
    message: string;
    icon: string;
    color: string;
    timestamp: number;
    duration?: number;
    achievement?: Achievement;
    comboCount?: number;
    comboMultiplier?: number;
}

function createNotificationStore() {
    const { subscribe, update } = writable<Notification[]>([]);
    let notificationId = 0;

    return {
        subscribe,
        
        notify(notification: Omit<Notification, 'id' | 'timestamp'>) {
            const id = `notification_${++notificationId}`;
            const timestamp = Date.now();
            
            update(notifications => {
                // Remove old notifications (older than 5 seconds)
                const filtered = notifications.filter(n => 
                    timestamp - n.timestamp < (n.duration || 5000)
                );
                
                return [...filtered, { ...notification, id, timestamp }];
            });

            // Auto-remove notification after duration
            setTimeout(() => {
                update(notifications => 
                    notifications.filter(n => n.id !== id)
                );
            }, notification.duration || 5000);
        },

        // Achievement unlock notification
        achievementUnlocked(achievement: Achievement, isCombo = false) {
            this.notify({
                type: 'achievement',
                title: 'Achievement Unlocked!',
                message: achievement.name,
                icon: '🏆',
                color: achievement.tier_color,
                achievement,
                duration: isCombo ? 3000 : 5000
            });
        },

        // Combo notification
        comboUnlock(achievements: Achievement[], multiplier: number) {
            this.notify({
                type: 'combo',
                title: 'Achievement Combo!',
                message: `${achievements.length}x Combo - ${multiplier}x Multiplier!`,
                icon: '🔥',
                color: '#ff922b',
                comboCount: achievements.length,
                comboMultiplier: multiplier,
                duration: 6000
            });
        },

        // Challenge notification
        challengeUpdate(title: string, message: string, success: boolean) {
            this.notify({
                type: 'challenge',
                title,
                message,
                icon: success ? '✨' : '⚠️',
                color: success ? '#40c057' : '#ff6b6b',
                duration: 4000
            });
        },

        // Tier completion notification
        tierCompleted(achievement: Achievement) {
            this.notify({
                type: 'tier',
                title: 'Tier Completed!',
                message: `${achievement.tier.toUpperCase()} - ${achievement.name.split(' ')[0]}`,
                icon: achievement.tier === 'diamond' ? '💎' : '⭐',
                color: achievement.tier_color,
                achievement,
                duration: 7000
            });
        }
    };
}

export const notificationStore = createNotificationStore();
