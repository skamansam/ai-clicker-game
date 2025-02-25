<script lang="ts">
    import { achievementStore } from '$lib/stores/achievements';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
</script>

<button 
    class="trophy-button" 
    on:click={() => dispatch('click')}
    title="View Mission Accomplishments"
>
    🏆
    <span class="achievement-count">
        {$achievementStore.unlockedAchievements.length} / {$achievementStore.achievements.length}
    </span>
</button>

<style>
    .trophy-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.25rem;
        color: var(--text-color);
        transition: transform 0.2s ease;
    }

    .trophy-button:hover {
        transform: scale(1.1);
    }

    .achievement-count {
        font-size: 0.875rem;
    }
</style>
