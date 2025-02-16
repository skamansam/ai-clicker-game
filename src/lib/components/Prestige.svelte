<!-- src/lib/components/Prestige.svelte -->
<script lang="ts">
    import { prestigeStore } from '$lib/stores/prestige';
    import { gameStore } from '$lib/stores/game';
    import { fade, scale } from 'svelte/transition';

    $: canPrestige = $prestigeStore.canPrestige;
    $: level = $prestigeStore.level ?? 0;
    $: multiplier = $prestigeStore.multiplier ?? 1;
    $: nextMultiplier = $prestigeStore.nextPrestigeMultiplier ?? 1;
    $: lifetimeClicks = $prestigeStore.lifetimeClicks ?? 0;
    $: progress = Math.min(($gameStore.totalClicks ?? 0) / 1_000_000, 1);

    function formatNumber(num: number): string {
        if (!num) return '0';
        if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return Math.floor(num).toString();
    }

    async function handlePrestige() {
        if (canPrestige) {
            await prestigeStore.prestige();
        }
    }
</script>

<div class="prestige">
    <div class="header">
        <h2>Prestige Level {level}</h2>
        <div class="multiplier">
            Current Multiplier: {multiplier.toFixed(1)}x
        </div>
    </div>

    <div class="stats">
        <div class="stat">
            <span>Lifetime Clicks</span>
            <span>{formatNumber(lifetimeClicks)}</span>
        </div>
        <div class="stat">
            <span>Next Multiplier</span>
            <span>{nextMultiplier.toFixed(1)}x</span>
        </div>
    </div>

    <div class="progress-container">
        <div class="progress-bar">
            <div class="progress" style="width: {progress * 100}%"></div>
        </div>
        <div class="progress-text">
            {formatNumber($gameStore.totalClicks ?? 0)} / 1,000,000
        </div>
    </div>

    <button 
        class="prestige-button"
        class:disabled={!canPrestige}
        on:click={handlePrestige}
        disabled={!canPrestige}
    >
        {#if canPrestige}
            <span in:scale>Prestige Now!</span>
        {:else}
            <span>Need more clicks...</span>
        {/if}
    </button>
</div>

<style>
    .prestige {
        background: var(--bg-secondary);
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
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

    .multiplier {
        font-size: 1.2rem;
        color: var(--text-accent);
    }

    .stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0.5rem;
        background: var(--bg-tertiary);
        border-radius: 4px;
    }

    .stat span:first-child {
        font-size: 0.9rem;
        color: var(--text-secondary);
    }

    .stat span:last-child {
        font-size: 1.2rem;
        color: var(--text-primary);
        font-weight: bold;
    }

    .progress-container {
        margin-bottom: 1rem;
    }

    .progress-bar {
        width: 100%;
        height: 20px;
        background: var(--bg-tertiary);
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }

    .progress {
        height: 100%;
        background: var(--accent);
        transition: width 0.3s ease;
    }

    .progress-text {
        text-align: center;
        font-size: 0.9rem;
        color: var(--text-secondary);
    }

    .prestige-button {
        width: 100%;
        padding: 1rem;
        font-size: 1.2rem;
        border: none;
        border-radius: 4px;
        background: var(--accent);
        color: white;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .prestige-button:hover:not(.disabled) {
        transform: scale(1.02);
        background: var(--accent-hover);
    }

    .prestige-button.disabled {
        background: var(--bg-tertiary);
        cursor: not-allowed;
        color: var(--text-secondary);
    }
</style>
