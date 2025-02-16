<!-- src/lib/components/AchievementFilters.svelte -->
<script lang="ts">
    import { achievementStore } from '$lib/stores/achievements';
    import type { Achievement } from '$lib/types';
    import { fade, slide } from 'svelte/transition';

    export let showAdvanced = false;
    export let achievements: Achievement[] = [];

    let searchTerm = '';
    let selectedTier = 'all';
    let sortBy = 'default';
    let showUnlocked = true;
    let showLocked = true;

    $: filteredAchievements = achievements.filter(achievement => {
        // Filter by search term
        if (searchTerm && !achievement.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }

        // Filter by tier
        if (selectedTier !== 'all' && achievement.tier !== selectedTier) {
            return false;
        }

        // Filter by unlock status
        const isUnlocked = $achievementStore.unlockedAchievements.some(
            ua => ua.achievementId === achievement.id
        );
        if (!showUnlocked && isUnlocked) return false;
        if (!showLocked && !isUnlocked) return false;

        return true;
    }).sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'tier':
                return a.tier.localeCompare(b.tier);
            case 'progress':
                const aUnlocked = $achievementStore.unlockedAchievements.some(
                    ua => ua.achievementId === a.id
                );
                const bUnlocked = $achievementStore.unlockedAchievements.some(
                    ua => ua.achievementId === b.id
                );
                return (bUnlocked ? 1 : 0) - (aUnlocked ? 1 : 0);
            default:
                return 0;
        }
    });
</script>

<div class="filters" transition:slide>
    <div class="basic-filters">
        <div class="search">
            <label for="search">Search</label>
            <input
                id="search"
                type="text"
                bind:value={searchTerm}
                placeholder="Search achievements..."
            />
        </div>

        <div class="tier-filter">
            <label for="tier">Tier</label>
            <select id="tier" bind:value={selectedTier}>
                <option value="all">All Tiers</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
            </select>
        </div>

        <button
            class="toggle-advanced"
            on:click={() => (showAdvanced = !showAdvanced)}
        >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
        </button>
    </div>

    {#if showAdvanced}
        <div class="advanced-filters" transition:fade>
            <div class="sort">
                <label for="sort">Sort By</label>
                <select id="sort" bind:value={sortBy}>
                    <option value="default">Default</option>
                    <option value="name">Name</option>
                    <option value="tier">Tier</option>
                    <option value="progress">Progress</option>
                </select>
            </div>

            <div class="visibility">
                <div class="checkbox-group">
                    <label for="show-unlocked" class="sr-only">Show Unlocked</label>
                    <input
                        id="show-unlocked"
                        type="checkbox"
                        bind:checked={showUnlocked}
                    />
                    <span>Show Unlocked</span>
                </div>
                <div class="checkbox-group">
                    <label for="show-locked" class="sr-only">Show Locked</label>
                    <input
                        id="show-locked"
                        type="checkbox"
                        bind:checked={showLocked}
                    />
                    <span>Show Locked</span>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .filters {
        background: var(--bg-secondary);
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
    }

    .basic-filters {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .search {
        flex: 1;
    }

    label {
        display: block;
        margin-bottom: 0.25rem;
        color: var(--text-secondary);
        font-size: 0.9rem;
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }

    input[type="text"],
    select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: var(--bg-input);
        color: var(--text-primary);
    }

    .toggle-advanced {
        padding: 0.5rem 1rem;
        background: var(--bg-button);
        border: none;
        border-radius: 4px;
        color: var(--text-button);
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .toggle-advanced:hover {
        background: var(--bg-button-hover);
    }

    .advanced-filters {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border);
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }

    .visibility {
        display: flex;
        gap: 1rem;
    }

    .checkbox-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .checkbox-group input[type="checkbox"] {
        margin-right: 0.5rem;
    }

    @media (max-width: 768px) {
        .basic-filters {
            flex-direction: column;
            align-items: stretch;
        }

        .advanced-filters {
            grid-template-columns: 1fr;
        }

        .visibility {
            flex-direction: column;
        }
    }
</style>
