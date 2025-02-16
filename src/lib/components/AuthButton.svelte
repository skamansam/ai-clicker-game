<!-- src/lib/components/AuthButton.svelte -->
<script lang="ts">
    import { authStore } from '$lib/stores/auth';
    import AuthDialog from './AuthDialog.svelte';

    let showDialog = false;

    async function handleSignOut() {
        await authStore.signOut();
    }
</script>

{#if $authStore.user}
    <button
        on:click={handleSignOut}
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
    >
        Sign Out
    </button>
{:else}
    <button
        on:click={() => showDialog = true}
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
    >
        Sign In
    </button>
{/if}

<AuthDialog
    isOpen={showDialog}
    on:close={() => showDialog = false}
/>
