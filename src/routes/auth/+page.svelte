<!-- src/routes/auth/+page.svelte -->
<script lang="ts">
    import SignIn from './SignIn.svelte';
    import SignUp from './SignUp.svelte';
    import { authStore } from '$lib/stores/auth';

    let showSignUp = false;
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
        <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                {showSignUp ? 'Create your account' : 'Sign in to your account'}
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600">
                {#if showSignUp}
                    Already have an account?
                    <button
                        on:click={() => showSignUp = false}
                        class="font-medium text-blue-600 hover:text-blue-500"
                    >
                        Sign in
                    </button>
                {:else}
                    Don't have an account?
                    <button
                        on:click={() => showSignUp = true}
                        class="font-medium text-blue-600 hover:text-blue-500"
                    >
                        Sign up
                    </button>
                {/if}
            </p>
        </div>

        <div class="mt-8">
            {#if showSignUp}
                <SignUp />
            {:else}
                <SignIn />
            {/if}
        </div>
    </div>
</div>
