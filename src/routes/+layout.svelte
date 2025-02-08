<!-- src/routes/+layout.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { authStore } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    // Initialize the auth store
    onMount(() => {
        authStore.init();
    });

    // Subscribe to auth changes
    $: if ($page.url.pathname !== '/auth' && !$authStore) {
        goto('/auth');
    }
</script>

<slot />

<style>
    :global(html) {
        background-color: #f9fafb;
    }
    
    :global(body) {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
            Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }
</style>
