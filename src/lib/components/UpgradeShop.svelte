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
    
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {#each upgrades as upgrade (upgrade.id)}
            {@const userUpgrade = $gameStore.upgrades[upgrade.id] || { 
                count: 0, 
                cost: upgrade.base_cost,
                clicksPerSecond: upgrade.clicks_per_second
            }}
            {@const canAfford = $gameStore.clicks >= userUpgrade.cost}
            <button 
                class="upgrade-card"
                class:can-afford={canAfford}
                disabled={!canAfford}
                on:click={() => handleUpgradeClick(upgrade.id, canAfford)}
                in:fade={{ duration: 200 }}
            >
                <div class="card-content">
                    <div class="header">
                        <div class="title-area">
                            <h3>{upgrade.name}</h3>
                            <p class="description">{upgrade.description}</p>
                        </div>
                        <div class="owned">
                            <span class="count">{userUpgrade.count}</span>
                        </div>
                    </div>

                    <div class="stats">
                        <div class="stat">
                            <span class="value">+{userUpgrade.clicksPerSecond}</span>
                            <span class="label">CPS</span>
                        </div>
                        <div class="stat cost" class:affordable={canAfford}>
                            <span class="value">{formatNumber(userUpgrade.cost)}</span>
                        </div>
                    </div>

                    {#if userUpgrade.count > 0}
                        <div class="total-output" transition:scale>
                            Total: {formatNumber(userUpgrade.count * userUpgrade.clicksPerSecond)} CPS
                        </div>
                    {/if}
                </div>
            </button>
        {/each}
    </div>
</div>

<style>
    .upgrades-container {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 0.5rem;
    }

    .upgrade-card {
        position: relative;
        width: 100%;
        text-align: left;
        background: white;
        border: 1px solid transparent;
        border-radius: 0.5rem;
        overflow: hidden;
        transition: all 0.15s ease;
        cursor: pointer;
        padding: 0;
    }

    .upgrade-card:disabled {
        cursor: not-allowed;
        opacity: 0.7;
    }

    .upgrade-card.can-afford:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        border-color: var(--primary-500);
    }

    .upgrade-card.can-afford:active {
        transform: translateY(0);
    }

    .card-content {
        padding: 0.5rem;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
    }

    .title-area {
        flex: 1;
        min-width: 0;
    }

    h3 {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .owned {
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--primary-100);
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
        min-width: 1.5rem;
    }

    .owned .count {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--primary-700);
        line-height: 1;
    }

    .description {
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin: 0.125rem 0;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
    }

    .stats {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
    }

    .stat {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        background: var(--gray-100);
        border-radius: 0.25rem;
        font-size: 0.75rem;
    }

    .stat.cost {
        background: var(--gray-200);
    }

    .stat.cost.affordable {
        background: var(--primary-100);
    }

    .stat .value {
        font-weight: 600;
        color: var(--text-primary);
    }

    .stat .label {
        color: var(--text-secondary);
    }

    .total-output {
        font-size: 0.75rem;
        color: var(--success-600);
        padding: 0.25rem;
        background: var(--success-50);
        border-radius: 0.25rem;
        margin-top: 0.25rem;
        text-align: center;
    }

    /* Dark mode */
    :global(.dark) .upgrade-card {
        background: var(--gray-800);
    }

    :global(.dark) .owned {
        background: var(--primary-900);
    }

    :global(.dark) .owned .count {
        color: var(--primary-300);
    }

    :global(.dark) .stat {
        background: var(--gray-700);
    }

    :global(.dark) .stat.cost {
        background: var(--gray-600);
    }

    :global(.dark) .stat.cost.affordable {
        background: var(--primary-900);
    }

    :global(.dark) .total-output {
        background: var(--success-900);
        color: var(--success-400);
    }
</style>
