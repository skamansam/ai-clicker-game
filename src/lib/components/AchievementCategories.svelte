<!-- src/lib/components/AchievementCategories.svelte -->
<script lang="ts">
    import { achievementStore, type AchievementCategory } from '$lib/stores/achievements';
    import { slide } from 'svelte/transition';

    const categoryIcons: Record<AchievementCategory | 'all', string> = {
        all: '🏆',
        clicks: '🖱️',
        speed: '⚡',
        upgrades: '⬆️',
        streaks: '🔥',
        time: '⏰',
        prestige: '✨',
        combos: '🎯',
        social: '💬',
        dedication: '📅',
        challenges: '⚔️'
    };

    const categoryNames: Record<AchievementCategory | 'all', string> = {
        all: 'All Achievements',
        clicks: 'Click Milestones',
        speed: 'Speed Records',
        upgrades: 'Upgrade Collection',
        streaks: 'Click Streaks',
        time: 'Time Played',
        prestige: 'Prestige Ranks',
        combos: 'Achievement Combos',
        social: 'Social Status',
        dedication: 'Daily Dedication',
        challenges: 'Challenge Master'
    };

    $: selectedCategory = $achievementStore.selectedCategory;
    $: categories = $achievementStore.categories || [];
</script>

<div class="categories" transition:slide>
    {#each ['all', ...categories] as category}
        <button
            class="category-btn"
            class:active={selectedCategory === category}
            on:click={() => achievementStore.setCategory(category)}
        >
            <span class="icon">{categoryIcons[category]}</span>
            <span class="name">{categoryNames[category]}</span>
        </button>
    {/each}
</div>

<style>
    .categories {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .category-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        background: var(--bg-tertiary);
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .category-btn:hover {
        background: var(--bg-quaternary);
    }

    .category-btn.active {
        background: var(--accent);
        color: white;
    }

    .icon {
        font-size: 1.2rem;
    }

    .name {
        font-size: 0.9rem;
    }

    @media (max-width: 768px) {
        .categories {
            flex-wrap: nowrap;
            overflow-x: auto;
            padding-bottom: 0.5rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
        }

        .categories::-webkit-scrollbar {
            display: none;
        }

        .category-btn {
            white-space: nowrap;
        }
    }
</style>
