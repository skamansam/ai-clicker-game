<!-- src/lib/components/Prestige.svelte -->
<script lang="ts">
    import { prestigeStore } from '$lib/stores/prestige';
    import { gameStore } from '$lib/stores/game';
    import { fade, scale } from 'svelte/transition';

    $: canPrestige = $prestigeStore.canPrestige;
    $: level = $prestigeStore.level;
    $: multiplier = $prestigeStore.multiplier;
    $: nextMultiplier = $prestigeStore.nextPrestigeMultiplier;
    $: lifetimeClicks = $prestigeStore.lifetimeClicks;
    $: progress = Math.min($gameStore.totalClicks / 1_000_000, 1);

    function formatNumber(num: number): string {
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
            {formatNumber($gameStore.totalClicks)} / 1M clicks
        </div>
    </div>

    <button
        class="prestige-button"
        disabled={!canPrestige}
        on:click={handlePrestige}
    >
        {#if canPrestige}
            <span in:scale>Prestige Now!</span>
        {:else}
            <span>Need 1M clicks to prestige</span>
        {/if}
    </button>
</div>

<style>
    .prestige {
        background: white;
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
        background: linear-gradient(135deg, #845ec2, #d65db1);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .multiplier {
        font-weight: bold;
        color: #845ec2;
    }

    .stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .stat {
        background: #f8f9fa;
        padding: 0.75rem;
        border-radius: 0.375rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .stat span:first-child {
        font-size: 0.8rem;
        color: #868e96;
    }

    .stat span:last-child {
        font-size: 1.1rem;
        font-weight: bold;
        color: #495057;
    }

    .progress-container {
        margin-bottom: 1rem;
    }

    .progress-bar {
        width: 100%;
        height: 8px;
        background: #e9ecef;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }

    .progress {
        height: 100%;
        background: linear-gradient(90deg, #845ec2, #d65db1);
        transition: width 0.3s ease;
    }

    .progress-text {
        text-align: center;
        font-size: 0.9rem;
        color: #868e96;
    }

    .prestige-button {
        width: 100%;
        padding: 1rem;
        border: none;
        border-radius: 0.5rem;
        font-size: 1.1rem;
        font-weight: bold;
        color: white;
        background: linear-gradient(135deg, #845ec2, #d65db1);
        cursor: pointer;
        transition: all 0.2s;
    }

    .prestige-button:disabled {
        background: #dee2e6;
        cursor: not-allowed;
    }

    .prestige-button:not(:disabled):hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
</style>
