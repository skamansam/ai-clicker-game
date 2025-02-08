<!-- src/routes/auth/SignIn.svelte -->
<script lang="ts">
    import { authStore } from '$lib/stores/auth';
    
    let email = '';
    let password = '';
    let error = '';
    let loading = false;

    async function handleSubmit() {
        loading = true;
        error = '';
        
        try {
            await authStore.signIn(email, password);
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <div>
        <label for="email" class="block text-sm font-medium">Email</label>
        <input
            type="email"
            id="email"
            bind:value={email}
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            disabled={loading}
        />
    </div>

    <div>
        <label for="password" class="block text-sm font-medium">Password</label>
        <input
            type="password"
            id="password"
            bind:value={password}
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            disabled={loading}
        />
    </div>

    {#if error}
        <div class="text-red-600 text-sm">{error}</div>
    {/if}

    <button
        type="submit"
        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        disabled={loading}
    >
        {loading ? 'Signing in...' : 'Sign in'}
    </button>
</form>
