<!-- src/lib/components/UpgradeShop.svelte -->
<script lang="ts">
    import { gameStore } from '$lib/stores/game';
    import { formatNumber } from '$lib/utils/format';
    import type { Upgrade } from '$lib/types';

    let upgrades = gameStore.getUpgrades();

    function handleUpgradeClick(id: string, canAfford: boolean) {
        if (canAfford) {
            gameStore.purchaseUpgrade(id);
        }
    }
</script>

<div class="upgrade-shop">
    <h2 class="text-xl font-bold mb-2 text-center text-gray-900 dark:text-white">Upgrade Shop</h2>
    
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
                    <div class="stats">
                        <div class="cost">{formatNumber(userUpgrade.cost)} clicks</div>
                        <div class="upgrade-effect">+{upgrade.clicks_per_second.toFixed(1)} CPS</div>
                        {#if userUpgrade.count > 0}
                            <div class="owned">Owned: {userUpgrade.count}</div>
                            <div class="total-cps">Total: {(userUpgrade.count * upgrade.clicks_per_second).toFixed(1)} CPS</div>
                        {/if}
                    </div>
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

<style>
    .upgrade-shop {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    h2 {
        margin: 0 0 1rem 0;
        color: var(--text-color);
    }

    .upgrade-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        width: 100%;
        box-sizing: border-box;
        overflow-y: auto;
        min-height: 0;
    }

    .upgrade {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 1rem;
        padding: 1rem;
        border-radius: 0.5rem;
        background: var(--widget-bg-color);
        border: 1px solid var(--border-color);
        transition: all 0.2s ease;
        width: 100%;
        box-sizing: border-box;
    }

    .upgrade:hover {
        border-color: var(--primary-color);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    :global(.dark) .upgrade:hover {
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .icon {
        font-size: 2rem;
        width: 2.5rem;
        text-align: center;
    }

    .info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 0;
    }

    .name {
        font-weight: 600;
        color: var(--text-color);
    }

    .description {
        font-size: 0.875rem;
        color: var(--text-color);
        opacity: 0.8;
    }

    .stats {
        display: grid;
        grid-template-columns: auto auto;
        gap: 0.25rem 1rem;
        margin-top: 0.25rem;
        font-size: 0.875rem;
    }

    .cost {
        color: var(--primary-color);
        font-weight: 500;
        grid-column: 1;
    }

    .upgrade-effect {
        color: var(--success-color);
        font-weight: 500;
        grid-column: 2;
    }

    .owned {
        color: var(--text-color);
        opacity: 0.8;
        grid-column: 1;
    }

    .total-cps {
        color: var(--success-color);
        font-weight: 500;
        grid-column: 2;
    }

    .buy-button {
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        border: none;
        background: var(--primary-color);
        color: white;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        align-self: center;
        white-space: nowrap;
    }

    .buy-button:hover:not(:disabled) {
        background: var(--primary-hover);
        transform: translateY(-1px);
    }

    .buy-button:disabled {
        background: var(--border-color);
        cursor: not-allowed;
        opacity: 0.7;
    }

    /* Scrollbar styling */
    .upgrade-list::-webkit-scrollbar {
        width: 8px;
    }

    .upgrade-list::-webkit-scrollbar-track {
        background: var(--bg-color);
        border-radius: 4px;
    }

    .upgrade-list::-webkit-scrollbar-thumb {
        background: var(--border-color);
        border-radius: 4px;
    }

    .upgrade-list::-webkit-scrollbar-thumb:hover {
        background: var(--primary-color);
    }

    :global(.dark) .upgrade-list::-webkit-scrollbar-track {
        background: var(--widget-bg-color);
    }

    :global(.dark) .upgrade-list::-webkit-scrollbar-thumb {
        background: var(--border-color);
    }
</style>
