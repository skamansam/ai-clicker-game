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
            in:fly={{ y: -50, duration: 300 }}
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
        top: 1rem;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        z-index: 1000;
        pointer-events: none;
        width: min(90%, 400px);
    }

    .notification {
        background: #1f2937;
        color: white;
        padding: 1rem;
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border: 1px solid #374151;
        width: 100%;
    }

    .icon {
        font-size: 2rem;
        min-width: 2.5rem;
        text-align: center;
    }

    .content {
        flex: 1;
    }

    .title {
        font-weight: 600;
        color: #10b981;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .name {
        font-size: 1.125rem;
        font-weight: 500;
        color: #f3f4f6;
        margin-top: 0.25rem;
    }
</style>
