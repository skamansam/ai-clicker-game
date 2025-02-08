<!-- src/lib/components/UpgradeShop.svelte -->
<script lang="ts">
    import { gameStore } from '$lib/stores/game';
    import type { Upgrade } from '$lib/types';
    
    $: upgrades = $gameStore.availableUpgrades;
    $: clicks = Math.floor($gameStore.clicks);

    function calculateCost(upgrade: Upgrade) {
        const owned = $gameStore.upgrades.find(u => u.upgrade_id === upgrade.id)?.quantity ?? 0;
        return Math.floor(upgrade.base_cost * Math.pow(1.15, owned));
    }

    function canAfford(upgrade: Upgrade) {
        return clicks >= calculateCost(upgrade);
    }

    async function purchaseUpgrade(upgrade: Upgrade) {
        const cost = calculateCost(upgrade);
        if (clicks >= cost) {
            try {
                await gameStore.purchaseUpgrade(upgrade);
                // Deduct the cost from clicks
                gameStore.update(state => ({
                    ...state,
                    clicks: state.clicks - cost
                }));
            } catch (error) {
                console.error('Failed to purchase upgrade:', error);
            }
        }
    }
</script>

<div class="upgrade-shop">
    <h2>Upgrades</h2>
    <div class="upgrades-list">
        {#each upgrades as upgrade}
            {@const cost = calculateCost(upgrade)}
            {@const owned = $gameStore.upgrades.find(u => u.upgrade_id === upgrade.id)?.quantity ?? 0}
            <div class="upgrade-item" class:disabled={!canAfford(upgrade)}>
                <div class="upgrade-info">
                    <h3>{upgrade.name}</h3>
                    <p>{upgrade.description}</p>
                    <p class="stats">
                        Owned: {owned} | CPS: +{upgrade.clicks_per_second}
                    </p>
                </div>
                <button
                    on:click={() => purchaseUpgrade(upgrade)}
                    disabled={!canAfford(upgrade)}
                >
                    Buy ({cost} clicks)
                </button>
            </div>
        {/each}
    </div>
</div>

<style>
    .upgrade-shop {
        background: white;
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    h2 {
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
    }

    .upgrades-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-height: 400px;
        overflow-y: auto;
    }

    .upgrade-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 0.375rem;
        transition: all 0.2s;
    }

    .upgrade-item:hover {
        background: #f1f3f5;
    }

    .upgrade-item.disabled {
        opacity: 0.7;
    }

    .upgrade-info h3 {
        margin: 0;
        font-size: 1.1rem;
    }

    .upgrade-info p {
        margin: 0.5rem 0;
        color: #495057;
        font-size: 0.9rem;
    }

    .stats {
        font-size: 0.8rem;
        color: #868e96;
    }

    button {
        padding: 0.5rem 1rem;
        background: #4c6ef5;
        color: white;
        border: none;
        border-radius: 0.25rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    button:hover:not(:disabled) {
        background: #364fc7;
    }

    button:disabled {
        background: #adb5bd;
        cursor: not-allowed;
    }
</style>
