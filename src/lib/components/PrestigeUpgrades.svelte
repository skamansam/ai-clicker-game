<!-- src/lib/components/PrestigeUpgrades.svelte -->
<script lang="ts">
    import { prestigeStore } from '$lib/stores/prestige';
    import { prestigeUpgrades } from '$lib/data/prestige-upgrades';
    import { formatNumber } from '$lib/utils/format';

    function buyUpgrade(id: string) {
        prestigeStore.buyUpgrade(id);
    }

    function getUpgradeLevel(id: string): number {
        return $prestigeStore.upgrades[id] || 0;
    }

    function canAfford(cost: number): boolean {
        return $prestigeStore.prestigePoints >= cost;
    }

    function isMaxLevel(id: string): boolean {
        const upgrade = prestigeUpgrades.find(u => u.id === id);
        const currentLevel = getUpgradeLevel(id);
        return upgrade?.maxLevel ? currentLevel >= upgrade.maxLevel : false;
    }
</script>

<div class="prestige-upgrades">
    <div class="upgrades-grid">
        {#each prestigeUpgrades as upgrade}
            {@const level = getUpgradeLevel(upgrade.id)}
            <div class="upgrade-card" class:disabled={!canAfford(upgrade.cost) || isMaxLevel(upgrade.id)}>
                <div class="upgrade-header">
                    <span class="icon">{upgrade.icon}</span>
                    <div class="name-level">
                        <h3>{upgrade.name}</h3>
                        <span class="level">Level {level}{#if upgrade.maxLevel} / {upgrade.maxLevel}{/if}</span>
                    </div>
                </div>
                
                <p class="description">{upgrade.description}</p>
                
                <div class="upgrade-footer">
                    <button 
                        class="buy-button"
                        on:click={() => buyUpgrade(upgrade.id)}
                        disabled={!canAfford(upgrade.cost) || isMaxLevel(upgrade.id)}
                    >
                        {#if isMaxLevel(upgrade.id)}
                            Max Level
                        {:else}
                            {formatNumber(upgrade.cost)} PP
                        {/if}
                    </button>
                </div>
            </div>
        {/each}
    </div>

    {#if $prestigeStore.error}
        <div class="error">
            {$prestigeStore.error}
        </div>
    {/if}
</div>

<style>
    .prestige-upgrades {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .upgrades-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }

    .upgrade-card {
        background: var(--widget-bg-color);
        border: 1px solid var(--border-color);
        border-radius: 0.5rem;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        transition: all 0.2s ease;
    }

    .upgrade-card:hover:not(.disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .upgrade-card.disabled {
        opacity: 0.7;
    }

    .upgrade-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .icon {
        font-size: 1.5rem;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-color);
        border-radius: 0.375rem;
    }

    .name-level {
        flex: 1;
    }

    h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-color);
    }

    .level {
        font-size: 0.75rem;
        color: var(--text-color);
        opacity: 0.7;
    }

    .description {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-color);
        opacity: 0.9;
        line-height: 1.4;
    }

    .upgrade-footer {
        margin-top: auto;
        display: flex;
        justify-content: flex-end;
    }

    .buy-button {
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        border: none;
        background: var(--primary-color);
        color: white;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .buy-button:hover:not(:disabled) {
        background: var(--primary-hover);
        transform: translateY(-1px);
    }

    .buy-button:disabled {
        background: var(--border-color);
        cursor: not-allowed;
    }

    .error {
        color: var(--error-color);
        font-size: 0.875rem;
        text-align: center;
        padding: 0.5rem;
        background: var(--error-bg-color);
        border-radius: 0.375rem;
    }
</style>
