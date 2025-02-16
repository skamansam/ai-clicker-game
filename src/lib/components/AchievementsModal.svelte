<!-- src/lib/components/AchievementsModal.svelte -->
<script lang="ts">
    import { achievementStore, filteredAchievements } from '$lib/stores/achievements';
    import AchievementCategories from './AchievementCategories.svelte';
    import { fade, scale } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    export let show = false;

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            dispatch('close');
        }
    }

    function handleBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            dispatch('close');
        }
    }
</script>

{#if show}
<div 
    class="modal-backdrop"
    on:click={handleBackdropClick}
    on:keydown={handleKeyDown}
    transition:fade={{ duration: 200 }}
>
    <div 
        class="modal-content"
        transition:scale={{ duration: 200, start: 0.95 }}
    >
        <div class="modal-header">
            <h2>Achievements</h2>
            <div class="progress">
                {#if $achievementStore.achievements.length > 0}
                    {$achievementStore.unlockedAchievements.length} / {$achievementStore.achievements.length}
                {:else}
                    Loading...
                {/if}
            </div>
            <button class="close-button" on:click={() => dispatch('close')}>×</button>
        </div>

        <div class="modal-body">
            <AchievementCategories />
            
            <div class="achievements-grid">
                {#each $filteredAchievements as achievement (achievement.id)}
                    <div 
                        class="achievement"
                        class:unlocked={achievement.unlocked}
                        transition:scale
                    >
                        <div class="icon">{achievement.icon || '🏆'}</div>
                        <div class="info">
                            <h3>{achievement.name}</h3>
                            <p>{achievement.description}</p>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: grid;
        place-items: center;
        padding: 2rem;
        z-index: 1000;
    }

    .modal-content {
        background: white;
        border-radius: 0.5rem;
        width: 100%;
        max-width: 800px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .modal-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border-bottom: 1px solid var(--border-color, #e9ecef);
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .progress {
        margin-left: auto;
        padding: 0.25rem 0.75rem;
        background: var(--primary-100);
        color: var(--primary-700);
        border-radius: 1rem;
        font-weight: 500;
    }

    .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        line-height: 1;
        padding: 0.25rem;
        cursor: pointer;
        color: var(--text-secondary);
        transition: color 0.2s;
    }

    .close-button:hover {
        color: var(--text-primary);
    }

    .modal-body {
        padding: 1rem;
        overflow-y: auto;
    }

    .achievements-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
        padding: 1rem 0;
    }

    .achievement {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: var(--gray-100);
        border-radius: 0.5rem;
        opacity: 0.7;
    }

    .achievement.unlocked {
        opacity: 1;
        background: var(--primary-50);
    }

    .icon {
        font-size: 1.5rem;
        width: 2.5rem;
        height: 2.5rem;
        display: grid;
        place-items: center;
        background: white;
        border-radius: 0.5rem;
        flex-shrink: 0;
    }

    .info {
        min-width: 0;
    }

    .info h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .info p {
        margin: 0.25rem 0 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    /* Dark mode */
    :global(.dark) .modal-content {
        background: var(--gray-800);
    }

    :global(.dark) .modal-header {
        border-color: var(--gray-700);
    }

    :global(.dark) .progress {
        background: var(--primary-900);
        color: var(--primary-300);
    }

    :global(.dark) .achievement {
        background: var(--gray-700);
    }

    :global(.dark) .achievement.unlocked {
        background: var(--primary-900);
    }

    :global(.dark) .icon {
        background: var(--gray-800);
    }
</style>
