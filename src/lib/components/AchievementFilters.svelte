<!-- src/lib/components/AchievementFilters.svelte -->
<script lang="ts">
    import { slide, fade } from 'svelte/transition';
    import { achievementStore } from '$lib/stores/achievements';
    import type { Achievement } from '$lib/types';

    export let achievements: Achievement[];
    export let showAdvanced = false;

    let searchQuery = '';
    let statusFilter: 'all' | 'locked' | 'unlocked' = 'all';
    let tierFilter: 'all' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' = 'all';
    let sortBy: 'default' | 'progress' | 'newest' | 'oldest' = 'default';

    $: filteredAchievements = filterAchievements(achievements);

    function filterAchievements(achievements: Achievement[]) {
        let filtered = [...achievements];

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(a =>
                a.name.toLowerCase().includes(query) ||
                a.description.toLowerCase().includes(query)
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(a => {
                const isUnlocked = $achievementStore.unlockedAchievements.some(
                    ua => ua.achievement_id === a.id
                );
                return statusFilter === 'unlocked' ? isUnlocked : !isUnlocked;
            });
        }

        // Apply tier filter
        if (tierFilter !== 'all') {
            filtered = filtered.filter(a => a.tier === tierFilter);
        }

        // Apply sorting
        switch (sortBy) {
            case 'progress':
                filtered.sort((a, b) => {
                    const progressA = getProgress(a);
                    const progressB = getProgress(b);
                    return progressB - progressA;
                });
                break;
            case 'newest':
                filtered.sort((a, b) => {
                    const unlockedA = $achievementStore.unlockedAchievements.find(
                        ua => ua.achievement_id === a.id
                    );
                    const unlockedB = $achievementStore.unlockedAchievements.find(
                        ua => ua.achievement_id === b.id
                    );
                    if (!unlockedA && !unlockedB) return 0;
                    if (!unlockedA) return 1;
                    if (!unlockedB) return -1;
                    return new Date(unlockedB.unlocked_at).getTime() - new Date(unlockedA.unlocked_at).getTime();
                });
                break;
            case 'oldest':
                filtered.sort((a, b) => {
                    const unlockedA = $achievementStore.unlockedAchievements.find(
                        ua => ua.achievement_id === a.id
                    );
                    const unlockedB = $achievementStore.unlockedAchievements.find(
                        ua => ua.achievement_id === b.id
                    );
                    if (!unlockedA && !unlockedB) return 0;
                    if (!unlockedA) return 1;
                    if (!unlockedB) return -1;
                    return new Date(unlockedA.unlocked_at).getTime() - new Date(unlockedB.unlocked_at).getTime();
                });
                break;
        }

        return filtered;
    }

    function getProgress(achievement: Achievement) {
        const userAchievement = $achievementStore.unlockedAchievements.find(
            ua => ua.achievement_id === achievement.id
        );
        if (!userAchievement) return 0;

        const progressPercentages = achievement.requirement_values.map((value, index) => {
            const progress = userAchievement.progress[index] || 0;
            return Math.min((progress / value) * 100, 100);
        });

        return Math.min(
            progressPercentages.reduce((sum, p) => sum + p, 0) / progressPercentages.length,
            100
        );
    }

    function clearFilters() {
        searchQuery = '';
        statusFilter = 'all';
        tierFilter = 'all';
        sortBy = 'default';
    }
</script>

<div class="filters-container">
    <div class="search-bar">
        <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search achievements..."
            transition:fade
        />
        <button
            class="advanced-btn"
            class:active={showAdvanced}
            on:click={() => showAdvanced = !showAdvanced}
        >
            {showAdvanced ? 'Hide' : 'Show'} Filters
        </button>
    </div>

    {#if showAdvanced}
        <div class="advanced-filters" transition:slide>
            <div class="filter-group">
                <label>Status</label>
                <select bind:value={statusFilter}>
                    <option value="all">All</option>
                    <option value="locked">Locked</option>
                    <option value="unlocked">Unlocked</option>
                </select>
            </div>

            <div class="filter-group">
                <label>Tier</label>
                <select bind:value={tierFilter}>
                    <option value="all">All Tiers</option>
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="platinum">Platinum</option>
                    <option value="diamond">Diamond</option>
                </select>
            </div>

            <div class="filter-group">
                <label>Sort By</label>
                <select bind:value={sortBy}>
                    <option value="default">Default</option>
                    <option value="progress">Progress</option>
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                </select>
            </div>

            <button class="clear-btn" on:click={clearFilters}>
                Clear Filters
            </button>
        </div>

        <div class="filter-summary" transition:slide>
            <span class="count">
                Showing {filteredAchievements.length} of {achievements.length} achievements
            </span>
            {#if searchQuery || statusFilter !== 'all' || tierFilter !== 'all' || sortBy !== 'default'}
                <div class="active-filters">
                    {#if searchQuery}
                        <span class="filter-tag">
                            Search: {searchQuery}
                            <button on:click={() => searchQuery = ''}>×</button>
                        </span>
                    {/if}
                    {#if statusFilter !== 'all'}
                        <span class="filter-tag">
                            Status: {statusFilter}
                            <button on:click={() => statusFilter = 'all'}>×</button>
                        </span>
                    {/if}
                    {#if tierFilter !== 'all'}
                        <span class="filter-tag">
                            Tier: {tierFilter}
                            <button on:click={() => tierFilter = 'all'}>×</button>
                        </span>
                    {/if}
                    {#if sortBy !== 'default'}
                        <span class="filter-tag">
                            Sort: {sortBy}
                            <button on:click={() => sortBy = 'default'}>×</button>
                        </span>
                    {/if}
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .filters-container {
        margin-bottom: 1rem;
    }

    .search-bar {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #dee2e6;
        border-radius: 0.25rem;
        font-size: 0.9rem;
    }

    input:focus {
        outline: none;
        border-color: #339af0;
        box-shadow: 0 0 0 2px rgba(51, 154, 240, 0.2);
    }

    .advanced-btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.25rem;
        background: #339af0;
        color: white;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
    }

    .advanced-btn:hover {
        background: #228be6;
    }

    .advanced-btn.active {
        background: #1c7ed6;
    }

    .advanced-filters {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    label {
        font-size: 0.8rem;
        color: #495057;
        font-weight: 500;
    }

    select {
        padding: 0.5rem;
        border: 1px solid #dee2e6;
        border-radius: 0.25rem;
        background: white;
        font-size: 0.9rem;
    }

    select:focus {
        outline: none;
        border-color: #339af0;
        box-shadow: 0 0 0 2px rgba(51, 154, 240, 0.2);
    }

    .clear-btn {
        padding: 0.5rem;
        border: none;
        border-radius: 0.25rem;
        background: #ff6b6b;
        color: white;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
    }

    .clear-btn:hover {
        background: #fa5252;
    }

    .filter-summary {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
        padding: 0.5rem;
        background: #f8f9fa;
        border-radius: 0.25rem;
        font-size: 0.9rem;
    }

    .count {
        color: #495057;
    }

    .active-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .filter-tag {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        background: white;
        border-radius: 1rem;
        font-size: 0.8rem;
        color: #495057;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .filter-tag button {
        border: none;
        background: none;
        color: #868e96;
        cursor: pointer;
        padding: 0 0.25rem;
        font-size: 1rem;
        line-height: 1;
    }

    .filter-tag button:hover {
        color: #ff6b6b;
    }

    @media (max-width: 768px) {
        .advanced-filters {
            grid-template-columns: 1fr;
        }

        .filter-summary {
            flex-direction: column;
            align-items: flex-start;
        }
    }
</style>
