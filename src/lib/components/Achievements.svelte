<!-- src/lib/components/Achievements.svelte -->
<script lang="ts">
    import { achievementStore, filteredAchievements } from '$lib/stores/achievements';
    import AchievementCategories from './AchievementCategories.svelte';
    import { fade, slide } from 'svelte/transition';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let loading = true;
    let error: string | null = null;
    let selectedAchievement: any = null;

    onMount(async () => {
        if (!browser) return;
        
        try {
            await achievementStore.loadAchievements();
        } catch (err) {
            error = 'Failed to load achievements';
            console.error(err);
        } finally {
            loading = false;
        }
    });

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            const achievement = event.currentTarget.getAttribute('data-achievement-id');
            if (achievement) {
                // Handle achievement selection
                console.log('Achievement selected:', achievement);
            }
        }
    }

    function closeModal() {
        selectedAchievement = null;
    }

    function handleModalKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            closeModal();
        }
    }
</script>

<svelte:window on:keydown={handleModalKeyDown} />

<div class="achievements">
    <div class="header">
        <h2>Achievements</h2>
        <div class="progress">
            {#if $achievementStore.achievements.length > 0}
                {$achievementStore.unlockedAchievements.length} / {$achievementStore.achievements.length}
            {:else}
                Loading...
            {/if}
        </div>
    </div>

    {#if loading}
        <div class="loading" transition:fade>Loading achievements...</div>
    {:else if error}
        <div class="error" transition:fade>{error}</div>
    {:else}
        <AchievementCategories />
        
        <div class="achievements-grid">
            {#each $filteredAchievements as achievement (achievement.id)}
                <button 
                    type="button"
                    class="achievement"
                    class:unlocked={achievement.unlocked}
                    data-achievement-id={achievement.id}
                    on:click={() => selectedAchievement = achievement}
                    on:keydown={handleKeyDown}
                    transition:slide
                >
                    <div class="icon">{achievement.icon || '🏆'}</div>
                    <div class="info">
                        <h3>{achievement.name}</h3>
                        <p>{achievement.description}</p>
                    </div>
                </button>
            {/each}
        </div>
    {/if}
</div>

{#if selectedAchievement}
    <div 
        class="modal-backdrop"
        role="dialog"
        aria-labelledby="modal-title"
        aria-modal="true"
        transition:fade
    >
        <div 
            class="modal-content"
            role="document"
        >
            <button 
                type="button"
                class="close-button"
                aria-label="Close modal"
                on:click={closeModal}
            >
                ×
            </button>
            <div class="achievement-details">
                <h2 id="modal-title" class="modal-title">
                    {selectedAchievement.name}
                </h2>
                <div class="achievement-info">
                    <div class="tier-badge" style="background: {selectedAchievement.tier_color}">
                        {selectedAchievement.tier.charAt(0).toUpperCase()}
                    </div>
                    <p class="description">{selectedAchievement.description}</p>
                    <div class="progress-bar">
                        <div 
                            class="progress-fill"
                            style="width: {selectedAchievement.unlocked ? '100' : '0'}%"
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .achievements {
        background: var(--bg-secondary);
        border-radius: 8px;
        padding: 1rem;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    h2 {
        margin: 0;
        font-size: 1.5rem;
        color: var(--text-primary);
    }

    .progress {
        font-size: 1.1rem;
        color: var(--text-accent);
    }

    .loading,
    .error {
        text-align: center;
        padding: 2rem;
        color: var(--text-secondary);
    }

    .error {
        color: var(--error);
    }

    .achievements-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }

    .achievement {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: var(--bg-tertiary);
        border-radius: 4px;
        opacity: 0.7;
        filter: grayscale(1);
        transition: all 0.2s ease;
        text-align: left;
        width: 100%;
    }

    .achievement:hover,
    .achievement:focus {
        opacity: 0.85;
        outline: 2px solid var(--text-accent);
        outline-offset: 2px;
    }

    .achievement.unlocked {
        opacity: 1;
        filter: none;
    }

    .icon {
        font-size: 2rem;
        min-width: 2.5rem;
        height: 2.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .info {
        flex: 1;
    }

    .info h3 {
        margin: 0;
        font-size: 1.1rem;
        color: var(--text-primary);
    }

    .info p {
        margin: 0.5rem 0 0;
        font-size: 0.9rem;
        color: var(--text-secondary);
    }

    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-content {
        background: var(--bg-primary);
        border-radius: 8px;
        padding: 2rem;
        max-width: 90%;
        width: 500px;
        position: relative;
        max-height: 90vh;
        overflow-y: auto;
    }

    .close-button {
        position: absolute;
        top: 1rem;
        right: 1rem;
        font-size: 1.5rem;
        line-height: 1;
        padding: 0.5rem;
        background: var(--bg-tertiary);
        border-radius: 50%;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
    }

    .close-button:hover,
    .close-button:focus {
        background: var(--bg-button);
        color: var(--text-button);
    }

    .modal-title {
        margin-bottom: 1rem;
        color: var(--text-primary);
    }

    .achievement-info {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .tier-badge {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
    }

    .description {
        color: var(--text-secondary);
        line-height: 1.6;
    }

    .progress-bar {
        height: 0.5rem;
        background: var(--bg-tertiary);
        border-radius: 0.25rem;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: var(--bg-button);
        transition: width 0.3s ease;
    }

    @media (max-width: 768px) {
        .achievements-grid {
            grid-template-columns: 1fr;
        }

        .modal-content {
            width: 95%;
            padding: 1.5rem;
        }
    }
</style>
