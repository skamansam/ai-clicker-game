<!-- src/lib/components/UpgradeShop.svelte -->
<script lang="ts">
    import { gameStore } from '$lib/stores/game';
    import { fade, scale } from 'svelte/transition';

    let upgrades = gameStore.getUpgrades();
    
    function formatNumber(num: number): string {
        if (num >= 1e6) {
            return (num / 1e6).toFixed(1) + 'M';
        } else if (num >= 1e3) {
            return (num / 1e3).toFixed(1) + 'K';
        }
        return num.toString();
    }

    function handleUpgradeClick(upgradeId: string, canAfford: boolean) {
        if (canAfford) {
            gameStore.purchaseUpgrade(upgradeId);
        }
    }
</script>

<div class="upgrades-container">
    <h2 class="text-xl font-bold mb-2 text-center text-gray-900 dark:text-white">Upgrade Shop</h2>
    
    <div class="upgrades-grid">
        <div class="upgrade-list">
            {#each upgrades as upgrade (upgrade.id)}
                {@const userUpgrade = $gameStore.upgrades[upgrade.id] || { 
                    count: 0, 
                    cost: upgrade.base_cost,
                    clicksPerSecond: upgrade.clicks_per_second
                }}
                {@const canAfford = $gameStore.clicks >= userUpgrade.cost}
                <div 
                    class="upgrade"
                    class:can-afford={canAfford}
                >
                    <div class="icon">
                        {upgrade.icon || '🔧'}
                    </div>
                    <div class="info">
                        <div class="name">{upgrade.name}</div>
                        <div class="description">{upgrade.description}</div>
                        <div class="cost">{formatNumber(userUpgrade.cost)} clicks</div>
                        {#if userUpgrade.count > 0}
                            <div class="owned">Owned: {userUpgrade.count}</div>
                        {/if}
                    </div>
                    <button 
                        class="buy-button"
                        disabled={!canAfford}
                        on:click={() => handleUpgradeClick(upgrade.id, canAfford)}
                    >
                        Buy
                    </button>
                </div>
            {/each}
        </div>
    </div>
</div>

<style>
    .upgrades-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .upgrades-grid {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 0.5rem;
        padding: 0.5rem;
        overflow-y: auto;
        min-height: 0;
    }

    .upgrade-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .upgrade {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        border-radius: 0.5rem;
        background: var(--widget-bg-color);
        border: 1px solid var(--border-color);
        transition: all 0.2s ease;
    }

    .upgrade:hover {
        border-color: var(--primary-color);
    }

    .icon {
        font-size: 2rem;
        min-width: 2.5rem;
        text-align: center;
    }

    .info {
        flex: 1;
        min-width: 0;
    }

    .name {
        font-weight: 600;
        color: var(--text-color);
        margin-bottom: 0.25rem;
    }

    .description {
        font-size: 0.875rem;
        color: var(--text-color);
        opacity: 0.8;
        margin-bottom: 0.5rem;
    }

    .cost {
        font-size: 0.875rem;
        color: var(--primary-color);
        font-weight: 500;
    }

    .buy-button {
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        border: none;
        background: var(--primary-color);
        color: white;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s ease;
        align-self: center;
    }

    .buy-button:hover {
        background: var(--primary-hover);
    }

    .buy-button:disabled {
        background: var(--border-color);
        cursor: not-allowed;
        opacity: 0.7;
    }

    .owned {
        font-size: 0.875rem;
        color: var(--success-color);
        margin-top: 0.25rem;
    }

    /* Dark mode */
    :global(.dark) .upgrade {
        background: var(--gray-800);
    }

    :global(.dark) .name {
        color: var(--text-primary);
    }

    :global(.dark) .description {
        color: var(--text-secondary);
    }

    :global(.dark) .cost {
        color: var(--primary-500);
    }

    :global(.dark) .buy-button {
        background: var(--primary-500);
    }

    :global(.dark) .buy-button:hover {
        background: var(--primary-600);
    }

    :global(.dark) .buy-button:disabled {
        background: var(--gray-600);
    }

    :global(.dark) .owned {
        color: var(--success-400);
    }
</style>
