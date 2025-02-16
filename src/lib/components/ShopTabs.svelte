<!-- src/lib/components/ShopTabs.svelte -->
<script lang="ts">
    import { fade } from 'svelte/transition';
    import UpgradeShop from './UpgradeShop.svelte';
    import Prestige from './Prestige.svelte';

    let activeTab: 'upgrades' | 'prestige' = 'upgrades';
</script>

<div class="shop-tabs">
    <div class="tab-buttons">
        <button
            class="tab-button"
            class:active={activeTab === 'upgrades'}
            on:click={() => activeTab = 'upgrades'}
        >
            Upgrades
        </button>
        <button
            class="tab-button"
            class:active={activeTab === 'prestige'}
            on:click={() => activeTab = 'prestige'}
        >
            Prestige
        </button>
    </div>

    <div class="tab-content">
        {#if activeTab === 'upgrades'}
            <div class="tab-panel" transition:fade>
                <UpgradeShop />
            </div>
        {:else}
            <div class="tab-panel" transition:fade>
                <Prestige />
            </div>
        {/if}
    </div>
</div>

<style>
    .shop-tabs {
        background: white;
        border-radius: 0.5rem;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .tab-buttons {
        display: flex;
        border-bottom: 1px solid var(--border-color, #e9ecef);
        background: var(--gray-50);
    }

    .tab-button {
        flex: 1;
        padding: 0.5rem;
        border: none;
        background: none;
        color: var(--text-secondary);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .tab-button:hover {
        background: var(--gray-100);
        color: var(--text-primary);
    }

    .tab-button.active {
        background: white;
        color: var(--primary-600);
        border-bottom: 2px solid var(--primary-600);
    }

    .tab-content {
        flex: 1;
        overflow: hidden;
        position: relative;
    }

    .tab-panel {
        position: absolute;
        inset: 0;
        overflow-y: auto;
    }

    /* Dark mode */
    :global(.dark) .shop-tabs {
        background: var(--gray-800);
    }

    :global(.dark) .tab-buttons {
        background: var(--gray-900);
        border-color: var(--gray-700);
    }

    :global(.dark) .tab-button {
        color: var(--gray-400);
    }

    :global(.dark) .tab-button:hover {
        background: var(--gray-800);
        color: var(--gray-200);
    }

    :global(.dark) .tab-button.active {
        background: var(--gray-800);
        color: var(--primary-400);
        border-color: var(--primary-400);
    }
</style>
