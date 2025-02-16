<!-- src/routes/+layout.svelte -->
<script lang="ts">
    import { authStore } from '$lib/stores/auth';
    import { page } from '$app/stores';
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';
    import { themeStore } from '$lib/stores/theme';
    import '$lib/styles/global.css';

    onMount(() => {
        if (browser) {
            // Set initial theme class
            document.documentElement.classList.toggle('dark', $themeStore === 'dark');
        }
    });
</script>

<slot />

<style>
    :global(html) {
        --bg-color: #f8f9fa;
        --text-color: #1f2937;
        --border-color: #e5e7eb;
        --primary-color: #3b82f6;
        --primary-hover: #2563eb;
        --success-color: #10b981;
        --error-color: #ef4444;
    }

    :global(html.dark) {
        --bg-color: #1f2937;
        --text-color: #f3f4f6;
        --border-color: #374151;
        --primary-color: #60a5fa;
        --primary-hover: #3b82f6;
        --success-color: #34d399;
        --error-color: #f87171;
    }

    :global(body) {
        margin: 0;
        font-family: system-ui, -apple-system, sans-serif;
        background-color: var(--bg-color);
        color: var(--text-color);
        transition: background-color 0.3s ease, color 0.3s ease;
    }

    :global(button) {
        font-family: inherit;
    }
</style>
