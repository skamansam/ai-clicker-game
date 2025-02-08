<!-- src/lib/components/AchievementSocial.svelte -->
<script lang="ts">
    import { slide } from 'svelte/transition';
    import type { Achievement } from '$lib/types';
    import AchievementStats from './AchievementStats.svelte';
    import AchievementFeed from './AchievementFeed.svelte';

    export let achievement: Achievement;

    let activeTab: 'stats' | 'social' = 'stats';
</script>

<div class="social-container" transition:slide>
    <div class="tabs">
        <button
            class="tab-btn"
            class:active={activeTab === 'stats'}
            on:click={() => activeTab = 'stats'}
        >
            📊 Stats & Leaderboard
        </button>
        <button
            class="tab-btn"
            class:active={activeTab === 'social'}
            on:click={() => activeTab = 'social'}
        >
            💬 Social Feed
        </button>
    </div>

    <div class="tab-content">
        {#if activeTab === 'stats'}
            <AchievementStats {achievement} />
        {:else}
            <AchievementFeed {achievement} />
        {/if}
    </div>
</div>

<style>
    .social-container {
        margin-top: 1rem;
        background: #f8f9fa;
        border-radius: 0.5rem;
        overflow: hidden;
    }

    .tabs {
        display: flex;
        gap: 0.5rem;
        padding: 0.75rem;
        background: white;
        border-bottom: 1px solid #dee2e6;
    }

    .tab-btn {
        flex: 1;
        padding: 0.5rem;
        border: none;
        border-radius: 0.25rem;
        background: #f1f3f5;
        color: #495057;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .tab-btn:hover {
        background: #e9ecef;
    }

    .tab-btn.active {
        background: #339af0;
        color: white;
    }

    .tab-content {
        padding: 0.75rem;
    }

    @media (max-width: 768px) {
        .tabs {
            padding: 0.5rem;
        }

        .tab-btn {
            padding: 0.5rem;
            font-size: 0.9rem;
        }
    }
</style>
