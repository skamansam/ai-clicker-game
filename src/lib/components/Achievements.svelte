<!-- src/lib/components/Achievements.svelte -->
<script lang="ts">
    import { achievementStore } from '$lib/stores/achievements';
    import AchievementCategories from './AchievementCategories.svelte';
    import AchievementFilters from './AchievementFilters.svelte';
    import AchievementSuggestions from './AchievementSuggestions.svelte';
    import AchievementSocial from './AchievementSocial.svelte';

    let showFilters = false;
    let selectedAchievement = null;

    $: filteredAchievements = $achievementStore.achievements.filter(a => {
        if ($achievementStore.selectedCategory === 'all') return true;
        return achievementStore.getAchievementsByCategory($achievementStore.selectedCategory).includes(a);
    });
</script>

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

    <AchievementCategories />
    
    <AchievementFilters
        achievements={filteredAchievements}
        bind:showAdvanced={showFilters}
    />

    <AchievementSuggestions {achievements} />

    <div class="achievements-grid">
        {#each filteredAchievements as achievement}
            <div
                class="achievement-card"
                class:unlocked={$achievementStore.unlockedAchievements.some(
                    ua => ua.achievement_id === achievement.id
                )}
                on:click={() => selectedAchievement = achievement}
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
            </div>
        {/each}
    </div>

    {#if selectedAchievement}
        <div class="modal" on:click|self={() => selectedAchievement = null}>
            <div class="modal-content">
                <button class="close-btn" on:click={() => selectedAchievement = null}>
                    ×
                </button>
                <div class="achievement-details">
                    <div
                        class="achievement-header"
                        style="background: {selectedAchievement.tier_color}20"
                    >
                        <div
                            class="tier-badge large"
                            style="background: {selectedAchievement.tier_color}"
                        >
                            {selectedAchievement.tier.charAt(0).toUpperCase()}
                        </div>
                        <div class="title-group">
                            <h2>{selectedAchievement.name}</h2>
                            <p>{selectedAchievement.description}</p>
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

    .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-content {
        position: relative;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        background: white;
        border-radius: 0.5rem;
        overflow-y: auto;
    }

    .close-btn {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        width: 32px;
        height: 32px;
        border: none;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }

    .close-btn:hover {
        background: rgba(0, 0, 0, 0.2);
    }

    .achievement-details {
        padding: 1rem;
    }

    .achievement-header {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
    }

    .tier-badge.large {
        position: static;
        width: 48px;
        height: 48px;
        font-size: 1.2rem;
    }

    .title-group {
        flex: 1;
    }

    .title-group h2 {
        margin: 0 0 0.5rem 0;
    }

    .title-group p {
        margin: 0;
        color: #495057;
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
