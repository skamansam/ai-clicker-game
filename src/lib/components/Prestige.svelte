<!-- src/lib/components/Prestige.svelte -->
<script lang="ts">
    import { gameStore } from '$lib/stores/game';
    import { prestigeStore } from '$lib/stores/prestige';
    import { formatNumber } from '$lib/utils/format';

    function handlePrestige() {
        prestigeStore.prestige();
    }
</script>

<div class="prestige-container">
    <div class="info-section">
        <h2>Prestige</h2>
        <p class="description">
            Reset your progress to gain prestige points. Each prestige point gives a permanent 10% boost to clicks per second.
        </p>
        
        <div class="stats">
            <div class="stat">
                <span class="label">Current Prestige Points</span>
                <span class="value">{$prestigeStore.prestigePoints}</span>
            </div>
            <div class="stat">
                <span class="label">Current Multiplier</span>
                <span class="value">x{($prestigeStore.prestigePoints * 0.1 + 1).toFixed(1)}</span>
            </div>
            <div class="stat">
                <span class="label">Next Prestige Points</span>
                <span class="value">{formatNumber(Math.floor(Math.log10($gameStore.totalClicks)))}</span>
            </div>
        </div>
    </div>

    <button 
        class="prestige-button"
        on:click={handlePrestige}
        disabled={$gameStore.totalClicks < 1000}
    >
        Prestige
    </button>
</div>

<style>
    .prestige-container {
        background: var(--widget-bg-color);
        border: 1px solid var(--border-color);
        border-radius: 0.5rem;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    .info-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-color);
    }

    .description {
        font-size: 0.875rem;
        color: var(--text-color);
        opacity: 0.8;
        margin: 0;
        line-height: 1.5;
    }

    .stats {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1rem;
        background: var(--bg-color);
        border-radius: 0.5rem;
        border: 1px solid var(--border-color);
    }

    .stat {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .label {
        font-size: 0.875rem;
        color: var(--text-color);
        opacity: 0.8;
    }

    .value {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-color);
    }

    .prestige-button {
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        border: none;
        background: var(--primary-color);
        color: white;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
        width: 100%;
    }

    .prestige-button:hover:not(:disabled) {
        background: var(--primary-hover);
        transform: translateY(-1px);
    }

    .prestige-button:disabled {
        background: var(--border-color);
        cursor: not-allowed;
        opacity: 0.7;
    }
</style>
