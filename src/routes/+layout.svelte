<!-- src/routes/+layout.svelte -->
<script lang="ts">
    import { authStore } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { browser } from '$app/environment';
    import '$lib/styles/global.css';

    // Subscribe to auth changes and only redirect in browser
    $: if (browser && $page?.url?.pathname !== '/auth' && !$authStore.user) {
        goto('/auth');
    }
</script>

<slot />
