<!-- src/lib/components/AchievementNotifications.svelte -->
<script lang="ts">
    import { achievementStore } from '$lib/stores/achievements';
    import { fade, fly } from 'svelte/transition';

    let recentAchievements: any[] = [];
    const MAX_NOTIFICATIONS = 3;
    const NOTIFICATION_DURATION = 5000; // 5 seconds

    $: {
        if ($achievementStore.recentUnlocks?.length > 0) {
            const newAchievement = $achievementStore.recentUnlocks[$achievementStore.recentUnlocks.length - 1];
            if (!recentAchievements.find(a => a.id === newAchievement.id)) {
                recentAchievements = [...recentAchievements, newAchievement].slice(-MAX_NOTIFICATIONS);
                setTimeout(() => {
                    recentAchievements = recentAchievements.filter(a => a.id !== newAchievement.id);
                }, NOTIFICATION_DURATION);
            }
        }
    }
</script>

<div class="achievement-notifications">
    {#each recentAchievements as achievement (achievement.id)}
        <div 
            class="notification"
            in:fly={{ y: 50, duration: 300 }}
            out:fade={{ duration: 200 }}
        >
            <div class="icon">{achievement.icon || '🏆'}</div>
            <div class="content">
                <div class="title">Achievement Unlocked!</div>
                <div class="name">{achievement.name}</div>
            </div>
        </div>
    {/each}
</div>

<style>
    .achievement-notifications {
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        z-index: 1000;
        pointer-events: none;
    }

    .notification {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: var(--primary-600);
        color: white;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        max-width: 300px;
    }

    .icon {
        font-size: 1.5rem;
        flex-shrink: 0;
    }

    .content {
        min-width: 0;
    }

    .title {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        opacity: 0.9;
    }

    .name {
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
