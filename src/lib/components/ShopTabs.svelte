<!-- src/lib/components/ShopTabs.svelte -->
<script lang="ts">
    import { fade } from 'svelte/transition';
    import UpgradeShop from './UpgradeShop.svelte';
    import Prestige from './Prestige.svelte';

    let activeTab: 'upgrades' | 'prestige' = 'upgrades';
</script>

<div class="shop-container">
    <div class="tabs">
        <button
            class="tab"
            class:active={activeTab === 'upgrades'}
            on:click={() => activeTab = 'upgrades'}
        >
            Upgrades
        </button>
        <button
            class="tab"
            class:active={activeTab === 'prestige'}
            on:click={() => activeTab = 'prestige'}
        >
            Prestige
        </button>
    </div>

    <div class="content">
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
    .shop-container {
        background: var(--widget-bg-color);
        border: 1px solid var(--border-color);
        border-radius: 0.5rem;
        overflow: hidden;
        height: 100%;
        display: flex;
        flex-direction: column;
        transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    .tabs {
        display: flex;
        border-bottom: 1px solid var(--border-color);
        background: var(--widget-bg-color);
        transition: border-color 0.3s ease;
    }

    .tab {
        padding: 0.75rem 1rem;
        border: none;
        background: none;
        color: var(--text-color);
        opacity: 0.7;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .tab:hover {
        opacity: 0.9;
        background: rgba(0, 0, 0, 0.05);
    }

    .tab.active {
        opacity: 1;
        color: var(--primary-color);
        border-bottom: 2px solid var(--primary-color);
    }

    :global(.dark) .tab:hover {
        background: rgba(255, 255, 255, 0.05);
    }

    .content {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
    }
</style>
