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
</script>

<div class="categories" transition:slide>
    {#each ['all', ...achievementStore.categories] as category}
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
        gap: 0.5rem;
        overflow-x: auto;
        padding: 0.5rem;
        background: #f8f9fa;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
    }

    .category-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.25rem;
        background: white;
        color: #495057;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .category-btn:hover {
        background: #e9ecef;
        transform: translateY(-1px);
    }

    .category-btn.active {
        background: #339af0;
        color: white;
    }

    .icon {
        font-size: 1.1rem;
    }

    /* Scrollbar styling */
    .categories::-webkit-scrollbar {
        height: 6px;
    }

    .categories::-webkit-scrollbar-track {
        background: #f1f3f5;
        border-radius: 3px;
    }

    .categories::-webkit-scrollbar-thumb {
        background: #adb5bd;
        border-radius: 3px;
    }

    .categories::-webkit-scrollbar-thumb:hover {
        background: #868e96;
    }

    @media (max-width: 768px) {
        .categories {
            padding: 0.5rem;
        }

        .category-btn {
            padding: 0.5rem;
        }

        .name {
            display: none;
        }

        .icon {
            font-size: 1.2rem;
        }
    }
</style>
