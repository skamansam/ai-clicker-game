<!-- src/lib/components/Stats.svelte -->
<script lang="ts">
    import { gameStore } from '$lib/stores/game';
    import { formatNumber } from '$lib/utils/format';
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';

    // Tweened values for smooth animation
    const displayedMetal = tweened(0, {
        duration: 200,
        easing: cubicOut
    });
    
    const displayedCrystal = tweened(0, {
        duration: 200,
        easing: cubicOut
    });
    
    const displayedEnergy = tweened(0, {
        duration: 200,
        easing: cubicOut
    });
    
    const displayedQuantum = tweened(0, {
        duration: 200,
        easing: cubicOut
    });

    // Update tweened values when store changes
    $: displayedMetal.set($gameStore.metal || 0);
    $: if ($gameStore.crystalUnlocked) displayedCrystal.set($gameStore.crystal || 0);
    $: if ($gameStore.energyUnlocked) displayedEnergy.set($gameStore.energy || 0);
    $: if ($gameStore.quantumUnlocked) displayedQuantum.set($gameStore.quantum || 0);
</script>

<div class="stats">
    <div class="stat-item">
        <h3>Metal</h3>
        <p>{formatNumber($displayedMetal)}</p>
        <small>{formatNumber($gameStore.metalPerSecond || 0)}/s</small>
    </div>
    
    {#if $gameStore.crystalUnlocked}
    <div class="stat-item crystal">
        <h3>Crystals</h3>
        <p>{formatNumber($displayedCrystal)}</p>
        <small>{formatNumber($gameStore.crystalPerSecond || 0)}/s</small>
    </div>
    {/if}
    
    {#if $gameStore.energyUnlocked}
    <div class="stat-item energy">
        <h3>Energy</h3>
        <p>{formatNumber($displayedEnergy)}</p>
        <small>{formatNumber($gameStore.energyPerSecond || 0)}/s</small>
    </div>
    {/if}
    
    {#if $gameStore.quantumUnlocked}
    <div class="stat-item quantum">
        <h3>Quantum</h3>
        <p>{formatNumber($displayedQuantum)}</p>
        <small>{formatNumber($gameStore.quantumPerSecond || 0)}/s</small>
    </div>
    {/if}
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
