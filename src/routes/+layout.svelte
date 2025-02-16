<!-- src/routes/+layout.svelte -->
<script lang="ts">
    import { authStore } from '$lib/stores/auth';
    import { page } from '$app/stores';
    import { browser } from '$app/environment';
    import '$lib/styles/global.css';
</script>

<slot />
