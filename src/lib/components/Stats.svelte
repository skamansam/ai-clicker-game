<!-- src/lib/components/Stats.svelte -->
<script lang="ts">
    import { gameStore } from '$lib/stores/game';
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';

    const displayedClicks = tweened(0, {
        duration: 200,
        easing: cubicOut
    });

    $: displayedClicks.set($gameStore.clicks);

    function formatNumber(num: number): string {
        if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return Math.floor(num).toString();
    }
</script>

<div class="stats">
    <div class="stat-item">
        <h3>Clicks</h3>
        <p>{formatNumber($displayedClicks)}</p>
    </div>
    <div class="stat-item">
        <h3>Per Second</h3>
        <p>{formatNumber($gameStore.clicksPerSecond)}</p>
    </div>
    <div class="stat-item">
        <h3>Total Clicks</h3>
        <p>{formatNumber($gameStore.totalClicks)}</p>
    </div>
</div>

<style>
    .stats {
        display: flex;
        gap: 2rem;
        background: var(--widget-bg-color);
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        border: 1px solid var(--border-color);
        transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    .stat-item {
        text-align: center;
    }

    h3 {
        margin: 0;
        font-size: 0.9rem;
        color: var(--text-color);
        opacity: 0.7;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    p {
        margin: 0.5rem 0 0 0;
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--text-color);
    }
</style>
