<!-- src/lib/components/Notifications.svelte -->
<script lang="ts">
    import { notificationStore } from '$lib/stores/notifications';
    import { fly, fade } from 'svelte/transition';
    import { backOut } from 'svelte/easing';
    import type { Notification } from '$lib/stores/notifications';

    function getProgressColor(type: Notification['type']) {
        switch (type) {
            case 'achievement': return '#40c057';
            case 'combo': return '#ff922b';
            case 'challenge': return '#339af0';
            case 'tier': return '#845ef7';
            default: return '#868e96';
        }
    }
</script>

<div class="notifications-container">
    {#each $notificationStore as notification (notification.id)}
        <div
            class="notification"
            style="--notification-color: {notification.color}"
            in:fly={{ y: 50, duration: 500, easing: backOut }}
            out:fade={{ duration: 300 }}
        >
            <div class="icon">{notification.icon}</div>
            <div class="content">
                <div class="header">
                    <h4>{notification.title}</h4>
                    {#if notification.type === 'combo'}
                        <div class="combo-counter" style="--combo-color: {getProgressColor('combo')}">
                            {notification.comboCount}x
                        </div>
                    {/if}
                </div>
                <p>{notification.message}</p>
                {#if notification.achievement}
                    <div class="achievement-preview">
                        <div class="tier" style="background: {notification.achievement.tier_color}">
                            {notification.achievement.tier}
                        </div>
                        <div class="multiplier">
                            +{((notification.achievement.reward_multiplier - 1) * 100).toFixed(0)}%
                        </div>
                    </div>
                {/if}
            </div>
            <div class="progress-bar" style="--progress-color: {getProgressColor(notification.type)}">
                <div class="progress"></div>
            </div>
        </div>
    {/each}
</div>

<style>
    .notifications-container {
        position: fixed;
        top: 20px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 1000;
        pointer-events: none;
    }

    .notification {
        background: white;
        border-radius: 8px;
        padding: 15px;
        min-width: 300px;
        max-width: 400px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        display: flex;
        gap: 15px;
        position: relative;
        overflow: hidden;
        pointer-events: auto;
        border-left: 4px solid var(--notification-color);
    }

    .icon {
        font-size: 24px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: color-mix(in srgb, var(--notification-color) 15%, white);
        border-radius: 8px;
    }

    .content {
        flex: 1;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
    }

    h4 {
        margin: 0;
        color: #212529;
        font-size: 1rem;
    }

    p {
        margin: 0;
        color: #495057;
        font-size: 0.9rem;
    }

    .combo-counter {
        background: var(--combo-color);
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: bold;
    }

    .achievement-preview {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;
        font-size: 0.8rem;
    }

    .tier {
        padding: 2px 8px;
        border-radius: 4px;
        color: white;
        text-transform: uppercase;
        font-weight: bold;
    }

    .multiplier {
        color: #40c057;
        font-weight: bold;
    }

    .progress-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 3px;
        background: #e9ecef;
    }

    .progress {
        height: 100%;
        background: var(--progress-color);
        animation: progress-animation linear forwards;
    }

    @keyframes progress-animation {
        from {
            width: 100%;
        }
        to {
            width: 0%;
        }
    }

    @media (max-width: 768px) {
        .notifications-container {
            left: 50%;
            right: auto;
            transform: translateX(-50%);
            width: calc(100% - 40px);
            max-width: 400px;
        }

        .notification {
            width: 100%;
            min-width: unset;
        }
    }
</style>
