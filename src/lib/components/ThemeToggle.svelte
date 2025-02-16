<!-- src/lib/components/ThemeToggle.svelte -->
<script lang="ts">
    import { themeStore } from '$lib/stores/theme';
</script>

<button 
    class="theme-toggle" 
    on:click={() => themeStore.toggle()}
    aria-label="Toggle theme"
>
    {#if $themeStore === 'light'}
        🌙
    {:else}
        ☀️
    {/if}
</button>

<style>
    .theme-toggle {
        background: none;
        border: none;
        padding: 0.5rem;
        cursor: pointer;
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.5rem;
        transition: all 0.2s ease;
    }

    .theme-toggle:hover {
        background: rgba(0, 0, 0, 0.1);
    }

    :global(.dark) .theme-toggle:hover {
        background: rgba(255, 255, 255, 0.1);
    }
</style>
