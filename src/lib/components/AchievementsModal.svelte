<!-- src/lib/components/AchievementsModal.svelte -->
<script lang="ts">
    import { achievementStore, type AchievementCategory } from '$lib/stores/achievements';
    import { authStore } from '$lib/stores/auth';
    import { fade, scale } from 'svelte/transition';
    import { createEventDispatcher, onMount } from 'svelte';

    const dispatch = createEventDispatcher();

    export let show = false;
    let selectedCategory: AchievementCategory | 'all' = 'all';
    let showResetConfirm = false;

    // Load base achievements on mount
    onMount(() => {
        achievementStore.loadAchievements();
    });

    // Load user achievements when auth state changes
    $: if ($authStore) {
        achievementStore.loadUserAchievements();
    }

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

    $: categories = ['all', ...$achievementStore.categories];
    $: filteredAchievements = selectedCategory === 'all' 
        ? $achievementStore.achievements
        : $achievementStore.achievements.filter(a => a.category === selectedCategory);
    
    $: unlockedMap = new Map($achievementStore.unlockedAchievements.map(a => [a.id, a]));

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

    function formatCategory(category: string): string {
        return categoryNames[category as AchievementCategory] || category;
    }

    function getCategoryIcon(category: string): string {
        return categoryIcons[category as AchievementCategory] || '🏆';
    }

    function isUnlocked(achievement: any): boolean {
        return unlockedMap.has(achievement.id);
    }

    function getUnlockDate(achievement: any): Date | null {
        const unlocked = unlockedMap.get(achievement.id);
        return unlocked ? new Date(unlocked.unlockedAt) : null;
    }

    function handleReset() {
        showResetConfirm = true;
    }

    function confirmReset() {
        achievementStore.resetProgress();
        showResetConfirm = false;
    }

    function cancelReset() {
        showResetConfirm = false;
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
            <div class="filters">
                <select 
                    class="category-select"
                    bind:value={selectedCategory}
                    aria-label="Filter by category"
                >
                    {#each categories as category}
                        <option value={category}>
                            {getCategoryIcon(category)} {formatCategory(category)}
                        </option>
                    {/each}
                </select>
            </div>
            <div class="progress">
                <span class="count">{$achievementStore.unlockedAchievements.length}</span>
                <span class="separator">/</span>
                <span class="total">{$achievementStore.achievements.length}</span>
            </div>
            {#if $authStore}
                <button 
                    class="reset-button" 
                    on:click={handleReset}
                    title="Reset all achievement progress"
                >
                    Reset
                </button>
            {/if}
            <button class="close-button" on:click={() => dispatch('close')}>×</button>
        </div>

        <div class="modal-body">
            {#if showResetConfirm}
                <div class="reset-confirm" transition:scale>
                    <div class="reset-confirm-content">
                        <h3>⚠️ Reset Progress?</h3>
                        <p>This will permanently delete all your achievement progress. This action cannot be undone.</p>
                        <div class="reset-confirm-actions">
                            <button class="reset-confirm-button" on:click={confirmReset}>
                                Yes, Reset Everything
                            </button>
                            <button class="reset-cancel-button" on:click={cancelReset}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            {/if}

            {#if $achievementStore.loading}
                <div class="loading">Loading achievements...</div>
            {:else if $achievementStore.error}
                <div class="error">{$achievementStore.error}</div>
            {:else if filteredAchievements.length === 0}
                <div class="empty">
                    <div class="empty-icon">{getCategoryIcon(selectedCategory)}</div>
                    <p>No achievements found in {formatCategory(selectedCategory).toLowerCase()}.</p>
                </div>
            {:else}
                <div class="achievements-grid">
                    {#each filteredAchievements as achievement (achievement.id)}
                        <div 
                            class="achievement"
                            class:unlocked={isUnlocked(achievement)}
                            transition:scale|local
                        >
                            <div class="achievement-content">
                                <div class="icon-wrapper">
                                    <div class="icon">{achievement.icon || getCategoryIcon(achievement.category)}</div>
                                    {#if isUnlocked(achievement)}
                                        <div class="check-mark">✓</div>
                                    {/if}
                                </div>
                                <div class="info">
                                    <h3>{achievement.name}</h3>
                                    <div class="category-tag">
                                        <span class="tag-icon">{getCategoryIcon(achievement.category)}</span>
                                        <span>{formatCategory(achievement.category)}</span>
                                    </div>
                                    <p>{achievement.description}</p>
                                </div>
                            </div>
                            {#if isUnlocked(achievement)}
                                <div class="unlock-date">
                                    Unlocked {getUnlockDate(achievement)?.toLocaleDateString()}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}
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
        border-radius: 0.75rem;
        width: 100%;
        max-width: 900px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .modal-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.25rem;
        border-bottom: 1px solid var(--border-color, #e9ecef);
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .filters {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .category-select {
        padding: 0.375rem 2rem 0.375rem 0.75rem;
        border: 1px solid var(--border-color, #e9ecef);
        border-radius: 0.5rem;
        background: white;
        color: var(--text-primary);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M8 10.5l-4-4h8l-4 4z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.75rem center;
        min-width: 200px;
    }

    .category-select:hover {
        border-color: var(--primary-400);
    }

    .category-select:focus {
        outline: none;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 2px var(--primary-100);
    }

    .progress {
        margin-left: auto;
        padding: 0.375rem 1rem;
        background: var(--primary-100);
        color: var(--primary-700);
        border-radius: 1rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .progress .separator {
        opacity: 0.5;
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
        padding: 1.25rem;
        overflow-y: auto;
    }

    .loading, .error, .empty {
        text-align: center;
        padding: 2rem;
        color: var(--text-secondary);
        font-size: 0.875rem;
    }

    .empty-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        opacity: 0.5;
    }

    .error {
        color: var(--error-600);
    }

    .achievements-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
    }

    .achievement {
        background: var(--gray-50);
        border-radius: 0.75rem;
        border: 2px solid transparent;
        transition: all 0.2s ease;
    }

    .achievement-content {
        padding: 1rem;
        display: flex;
        gap: 1rem;
    }

    .icon-wrapper {
        position: relative;
        width: 3rem;
        height: 3rem;
        flex-shrink: 0;
    }

    .icon {
        width: 100%;
        height: 100%;
        display: grid;
        place-items: center;
        background: white;
        border-radius: 0.5rem;
        font-size: 1.5rem;
        border: 2px solid var(--gray-200);
        transition: all 0.2s ease;
    }

    .check-mark {
        position: absolute;
        bottom: -0.375rem;
        right: -0.375rem;
        background: var(--success-500);
        color: white;
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-size: 0.75rem;
        font-weight: bold;
        border: 2px solid white;
    }

    .info {
        flex: 1;
        min-width: 0;
    }

    .info h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .category-tag {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
        color: var(--primary-600);
        background: var(--primary-50);
        padding: 0.25rem 0.5rem;
        border-radius: 1rem;
        margin: 0.25rem 0;
    }

    .tag-icon {
        font-size: 1em;
    }

    .info p {
        margin: 0.25rem 0 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
        line-height: 1.4;
    }

    .unlock-date {
        font-size: 0.75rem;
        color: var(--success-600);
        padding: 0.5rem 1rem;
        border-top: 1px solid var(--gray-200);
        background: var(--success-50);
        border-bottom-left-radius: 0.75rem;
        border-bottom-right-radius: 0.75rem;
    }

    .achievement.unlocked {
        background: white;
        border-color: var(--success-200);
    }

    .achievement.unlocked .icon {
        border-color: var(--success-200);
        background: var(--success-50);
    }

    .reset-button {
        background: #ef4444;
        border: none;
        font-size: 0.875rem;
        font-weight: 500;
        line-height: 1;
        padding: 0.5rem 1rem;
        cursor: pointer;
        color: white;
        transition: all 0.2s;
        border-radius: 0.375rem;
        margin-left: 0.5rem;
    }

    .reset-button:hover {
        background: #dc2626;
    }

    .reset-button:active {
        background: #b91c1c;
    }

    .reset-confirm {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.75);
        display: grid;
        place-items: center;
        padding: 2rem;
        z-index: 10;
    }

    .reset-confirm-content {
        background: white;
        padding: 2rem;
        border-radius: 1rem;
        max-width: 400px;
        text-align: center;
    }

    .reset-confirm-content h3 {
        margin: 0 0 1rem;
        font-size: 1.5rem;
        color: var(--error-600);
    }

    .reset-confirm-content p {
        margin: 0 0 1.5rem;
        color: var(--text-secondary);
        line-height: 1.5;
    }

    .reset-confirm-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }

    .reset-confirm-button {
        background: #ef4444;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .reset-confirm-button:hover {
        background: #dc2626;
    }

    .reset-cancel-button {
        background: var(--gray-100);
        color: var(--text-primary);
        border: 1px solid var(--gray-200);
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .reset-cancel-button:hover {
        background: var(--gray-200);
    }

    /* Dark mode */
    :global(.dark) .modal-content {
        background: var(--gray-800);
    }

    :global(.dark) .modal-header {
        border-color: var(--gray-700);
    }

    :global(.dark) .category-select {
        background-color: var(--gray-700);
        border-color: var(--gray-600);
        color: var(--gray-100);
    }

    :global(.dark) .category-select:hover {
        border-color: var(--primary-500);
    }

    :global(.dark) .category-select:focus {
        border-color: var(--primary-400);
        box-shadow: 0 0 0 2px var(--primary-900);
    }

    :global(.dark) .category-tag {
        background: var(--primary-900);
        color: var(--primary-300);
    }

    :global(.dark) .progress {
        background: var(--primary-900);
        color: var(--primary-300);
    }

    :global(.dark) .achievement {
        background: var(--gray-900);
    }

    :global(.dark) .achievement.unlocked {
        background: var(--gray-800);
        border-color: var(--success-900);
    }

    :global(.dark) .icon {
        background: var(--gray-800);
        border-color: var(--gray-700);
    }

    :global(.dark) .achievement.unlocked .icon {
        border-color: var(--success-700);
        background: var(--success-900);
    }

    :global(.dark) .unlock-date {
        color: var(--success-400);
        background: var(--success-900);
        border-color: var(--gray-700);
    }

    :global(.dark) .loading,
    :global(.dark) .empty {
        color: var(--gray-400);
    }

    :global(.dark) .reset-button {
        background: #dc2626;
    }

    :global(.dark) .reset-button:hover {
        background: #ef4444;
    }

    :global(.dark) .reset-button:active {
        background: #f87171;
    }

    :global(.dark) .reset-confirm-content {
        background: var(--gray-800);
    }

    :global(.dark) .reset-confirm-button {
        background: #ef4444;
    }

    :global(.dark) .reset-confirm-button:hover {
        background: #dc2626;
    }

    :global(.dark) .reset-cancel-button {
        background: var(--gray-700);
        border-color: var(--gray-600);
        color: var(--gray-100);
    }

    :global(.dark) .reset-cancel-button:hover {
        background: var(--gray-600);
    }
</style>
