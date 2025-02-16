<!-- src/lib/components/Achievements.svelte -->
<script lang="ts">
    import { achievementStore, filteredAchievements } from '$lib/stores/achievements';
    import AchievementCategories from './AchievementCategories.svelte';
    import AchievementFilters from './AchievementFilters.svelte';
    import AchievementSuggestions from './AchievementSuggestions.svelte';
    import AchievementSocial from './AchievementSocial.svelte';
    import { fade, slide } from 'svelte/transition';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let loading = true;
    let error: string | null = null;
    let selectedAchievement: any = null;
    let showFilters = false;

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

<div class="achievements-container">
    <div class="header">
        <h2>Achievements</h2>
        <div class="controls">
            <button
                class="control-btn"
                class:active={showFilters}
                on:click={() => showFilters = !showFilters}
            >
                Filters
            </button>
        </div>
    </div>

    {#if loading}
        <div class="loading" transition:fade>Loading achievements...</div>
    {:else if error}
        <div class="error" transition:fade>{error}</div>
    {:else}
        <AchievementCategories />
        
        <AchievementFilters
            achievements={$achievementStore.achievements}
            bind:showAdvanced={showFilters}
        />

        <AchievementSuggestions {achievements} />

        <div class="achievements-grid">
            {#each $filteredAchievements as achievement (achievement.id)}
                <button 
                    type="button"
                    class="achievement-card"
                    class:unlocked={$achievementStore.unlockedAchievements.some(
                        ua => ua.achievement_id === achievement.id
                    )}
                    data-achievement-id={achievement.id}
                    on:click={() => selectedAchievement = achievement}
                    on:keydown={handleKeyDown}
                    transition:slide
                >
                    <div class="tier-badge" style="background: {achievement.tier_color}">
                        {achievement.tier.charAt(0).toUpperCase()}
                    </div>
                    <h3>{achievement.name}</h3>
                    <p>{achievement.description}</p>
                    <div class="reward">
                        {achievement.reward_multiplier}x Multiplier
                    </div>
                    {#if achievement.tier_effect}
                        <div class="effect">
                            {achievement.tier_effect} Effect
                        </div>
                    {/if}
                </button>
            {/each}
        </div>
    {/if}

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
                    <div class="rewards-section">
                        <h3>Rewards</h3>
                        <div class="rewards-grid">
                            <div class="reward-item">
                                <span class="icon"></span>
                                <span class="label">Multiplier</span>
                                <span class="value">{selectedAchievement.reward_multiplier}x</span>
                            </div>
                            {#if selectedAchievement.tier_effect}
                                <div class="reward-item">
                                    <span class="icon"></span>
                                    <span class="label">Effect</span>
                                    <span class="value">{selectedAchievement.tier_effect}</span>
                                </div>
                            {/if}
                            {#if selectedAchievement.tier_completion_reward}
                                <div class="reward-item">
                                    <span class="icon"></span>
                                    <span class="label">Tier Bonus</span>
                                    <span class="value">
                                        {selectedAchievement.tier_completion_reward.value}x
                                        {selectedAchievement.tier_completion_reward.type}
                                    </span>
                                </div>
                            {/if}
                        </div>
                    </div>

                    <AchievementSocial achievement={selectedAchievement} />
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .achievements-container {
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
        color: #212529;
    }

    .controls {
        display: flex;
        gap: 0.5rem;
    }

    .control-btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.25rem;
        background: #f8f9fa;
        color: #495057;
        cursor: pointer;
        transition: all 0.2s;
    }

    .control-btn:hover {
        background: #e9ecef;
    }

    .control-btn.active {
        background: #339af0;
        color: white;
    }

    .achievements-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }

    .achievement-card {
        position: relative;
        padding: 1rem;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        transition: all 0.2s;
    }

    .achievement-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .achievement-card.unlocked {
        background: #f8f9fa;
    }

    .tier-badge {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 0.8rem;
    }

    .achievement-card h3 {
        margin: 0 0 0.5rem 0;
        padding-right: 2rem;
        color: #212529;
        font-size: 1rem;
    }

    .achievement-card p {
        margin: 0 0 1rem 0;
        color: #6c757d;
        font-size: 0.9rem;
    }

    .reward, .effect {
        font-size: 0.8rem;
        color: #495057;
        margin-top: 0.5rem;
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
        background: white;
        border-radius: 0.5rem;
        padding: 2rem;
        max-width: 90%;
        width: 500px;
        position: relative;
        max-height: 90vh;
        overflow-y: auto;
    }

    .close-button {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        font-size: 1.5rem;
        line-height: 1;
        padding: 0.5rem;
        background: rgba(0, 0, 0, 0.1);
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
        background: rgba(0, 0, 0, 0.2);
    }

    .modal-title {
        margin-bottom: 1rem;
        color: #212529;
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
        color: #495057;
        line-height: 1.6;
    }

    .progress-bar {
        height: 0.5rem;
        background: #f8f9fa;
        border-radius: 0.25rem;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: #339af0;
        transition: width 0.3s ease;
    }

    .rewards-section {
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
    }

    .rewards-section h3 {
        margin: 0 0 1rem 0;
        color: #495057;
    }

    .rewards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
    }

    .reward-item {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: white;
        border-radius: 0.25rem;
    }

    .reward-item .icon {
        font-size: 1.2rem;
    }

    .reward-item .label {
        color: #6c757d;
        font-size: 0.9rem;
    }

    .reward-item .value {
        color: #212529;
        font-weight: 500;
    }

    @media (max-width: 768px) {
        .achievements-grid {
            grid-template-columns: 1fr;
        }

        .modal-content {
            width: 95%;
        }

        .rewards-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
