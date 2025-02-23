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
    let resetDialog: HTMLDialogElement;

    function showResetConfirmation() {
        showResetConfirm = true;
        // Wait for next tick to ensure dialog element exists
        setTimeout(() => {
            resetDialog?.showModal();
        }, 0);
    }

    function confirmReset() {
        achievementStore.resetProgress();
        resetDialog?.close();
        showResetConfirm = false;
    }

    function cancelReset() {
        resetDialog?.close();
        showResetConfirm = false;
    }

    function handleDialogClick(event: MouseEvent) {
        const rect = resetDialog.getBoundingClientRect();
        const isInDialog = (rect.top <= event.clientY && event.clientY <= rect.top + rect.height
            && rect.left <= event.clientX && event.clientX <= rect.left + rect.width);
        if (!isInDialog) {
            cancelReset();
        }
    }

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

    $: unlockedCount = $achievementStore.unlockedAchievements.length;
    $: totalCount = $achievementStore.achievements.length;

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

    function isUnlocked(achievementId: string): boolean {
        return unlockedMap.has(achievementId);
    }

    function getUnlockDate(achievement: any): Date | null {
        const unlocked = unlockedMap.get(achievement.id);
        return unlocked ? new Date(unlocked.unlockedAt) : null;
    }

    function handleReset() {
        showResetConfirmation();
    }

    function handleClose() {
        dispatch('close');
    }
</script>

{#if show}
<div 
    class="modal-overlay"
    on:click={handleBackdropClick}
    on:keydown={handleKeyDown}
    transition:fade={{ duration: 200 }}
>
    <div 
        class="modal"
        transition:scale={{ duration: 200, start: 0.95 }}
    >
        <div class="modal-header">
            <h2>Achievements</h2>
            <div class="header-controls">
                <select 
                    class="category-select"
                    bind:value={selectedCategory}
                    disabled={$achievementStore.loading}
                >
                    <option value="all">All Categories</option>
                    {#each categories as category}
                        <option value={category}>{formatCategory(category)}</option>
                    {/each}
                </select>
                
                <div class="progress">
                    <span>{unlockedCount}</span>
                    <span class="separator">/</span>
                    <span>{totalCount}</span>
                </div>

                <button 
                    class="reset-button" 
                    on:click={handleReset}
                    disabled={$achievementStore.loading || unlockedCount === 0}
                >
                    Reset
                </button>
            </div>
            <button class="close-button" on:click={handleClose}>×</button>
        </div>

        <div class="modal-body">
            {#if showResetConfirm}
                <dialog
                    bind:this={resetDialog}
                    class="reset-confirm-dialog"
                    on:click={handleDialogClick}
                >
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
                </dialog>
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
                <div class="achievement-list">
                    {#each filteredAchievements as achievement (achievement.id)}
                        <div 
                            class={`achievement ${isUnlocked(achievement.id) ? 'unlocked' : 'locked'}`}
                            transition:scale|local
                        >
                            <div class="achievement-icon">{achievement.icon || getCategoryIcon(achievement.category)}</div>
                            <div class="achievement-info">
                                <h3 class="achievement-name">{achievement.name}</h3>
                                <p class="achievement-description">{achievement.description}</p>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</div>
{/if}

<style>
    :root {
        --danger-color: #dc2626;
    }

    :global(.dark) {
        --danger-color: #ef4444;
    }

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100;
        backdrop-filter: blur(4px);
    }

    .modal {
        background: var(--widget-bg-color);
        border: 1px solid var(--border-color);
        border-radius: 1rem;
        padding: 2rem;
        width: 90%;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    h2 {
        margin: 0 0 1.5rem 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-color);
    }

    .achievement-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
    }

    .achievement {
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: 0.5rem;
        padding: 1rem;
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 1rem;
        transition: all 0.2s ease;
    }

    .achievement.unlocked {
        border-color: var(--success-color);
    }

    .achievement-icon {
        font-size: 2rem;
        width: 2.5rem;
        height: 2.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .achievement-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .achievement-name {
        font-weight: 600;
        color: var(--text-color);
    }

    .achievement-description {
        font-size: 0.875rem;
        color: var(--text-color);
        opacity: 0.8;
    }

    .achievement-progress {
        font-size: 0.875rem;
        color: var(--primary-color);
        font-weight: 500;
        margin-top: 0.25rem;
    }

    .achievement.locked {
        opacity: 0.7;
    }

    .achievement.locked .achievement-icon {
        filter: grayscale(1);
    }

    .close-button {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-color);
        opacity: 0.7;
        transition: opacity 0.2s ease;
        padding: 0.5rem;
        line-height: 1;
        border-radius: 0.5rem;
    }

    .close-button:hover {
        opacity: 1;
        background: var(--bg-color);
    }

    .modal-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border-color);
    }

    .header-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-left: auto;
    }

    .category-select {
        padding: 0.5rem 2rem 0.5rem 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 0.5rem;
        background: var(--widget-bg-color);
        color: var(--text-color);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 150px;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.5rem center;
        background-size: 1rem;
    }

    .category-select:hover:not(:disabled) {
        border-color: var(--primary-color);
    }

    .category-select:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .progress {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.5rem 1rem;
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: 0.5rem;
        color: var(--text-color);
        font-weight: 500;
        font-size: 0.875rem;
    }

    .separator {
        opacity: 0.5;
    }

    .reset-button {
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        border: none;
        background: var(--error-color);
        color: white;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.875rem;
    }

    .reset-button:hover:not(:disabled) {
        filter: brightness(1.1);
        transform: translateY(-1px);
    }

    .reset-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    /* Scrollbar styling */
    .modal::-webkit-scrollbar {
        width: 8px;
    }

    .modal::-webkit-scrollbar-track {
        background: var(--bg-color);
        border-radius: 4px;
    }

    .modal::-webkit-scrollbar-thumb {
        background: var(--border-color);
        border-radius: 4px;
    }

    .modal::-webkit-scrollbar-thumb:hover {
        background: var(--primary-color);
    }

    :global(.dark) .modal {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }

    :global(.dark) .achievement {
        background: var(--widget-bg-color);
    }

    .reset-confirm-dialog {
        border: none;
        border-radius: 1rem;
        padding: 0;
        background: transparent;
        max-width: 400px;
        width: 90%;
    }

    .reset-confirm-dialog::backdrop {
        background: rgba(0, 0, 0, 0.85);
    }

    .reset-confirm-content {
        background: var(--widget-bg-color);
        border: 2px solid var(--border-color);
        border-radius: 1rem;
        padding: 2rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }

    :global(.dark) .reset-confirm-content {
        background: var(--widget-bg-color);
        border-color: var(--border-color);
    }

    .reset-confirm-content h3 {
        color: var(--danger-color);
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
    }

    .reset-confirm-content p {
        margin: 0 0 1.5rem 0;
        color: var(--text-color);
        line-height: 1.5;
    }

    .reset-confirm-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
    }

    .reset-confirm-button {
        background: var(--danger-color);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .reset-confirm-button:hover {
        filter: brightness(0.9);
    }

    .reset-cancel-button {
        background: var(--widget-bg-color);
        color: var(--text-color);
        border: 1px solid var(--border-color);
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .reset-cancel-button:hover {
        background: var(--hover-color);
    }

    :global(.dark) .reset-cancel-button {
        background: var(--widget-bg-color);
        border-color: var(--border-color);
        color: var(--text-color);
    }

    :global(.dark) .reset-cancel-button:hover {
        background: var(--hover-color);
    }
</style>
