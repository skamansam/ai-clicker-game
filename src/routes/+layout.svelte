<!-- src/routes/+layout.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { authStore } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import '$lib/styles/global.css';

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
