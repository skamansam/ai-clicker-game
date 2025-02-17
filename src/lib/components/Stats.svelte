<!-- src/lib/components/Stats.svelte -->
<script lang="ts">
    import { gameStore } from '$lib/stores/game';
    import { formatNumber } from '$lib/utils/format';
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';

    const displayedClicks = tweened(0, {
        duration: 200,
        easing: cubicOut
    });

    $: displayedClicks.set($gameStore.clicks);
</script>

<div class="stats">
    <div class="stat-item">
        <h3>Total Clicks</h3>
        <p>{formatNumber($gameStore.totalClicks)}</p>
    </div>
    <div class="stat-item">
        <h3>Clicks Per Second</h3>
        <p>{formatNumber($gameStore.clicksPerSecond)}</p>
    </div>
    <div class="stat-item">
        <h3>Current Clicks</h3>
        <p>{formatNumber($displayedClicks)}</p>
    </div>
</div>

<style>
    .stats {
        display: flex;
        gap: 1.5rem;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    .stat-item {
        text-align: center;
        min-width: 100px;
    }

    h3 {
        margin: 0;
        font-size: 0.75rem;
        color: var(--text-color);
        opacity: 0.7;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    p {
        margin: 0.25rem 0 0 0;
        font-size: 1.125rem;
        font-weight: bold;
        color: var(--text-color);
    }
</style>
