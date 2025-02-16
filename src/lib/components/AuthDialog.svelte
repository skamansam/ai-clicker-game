<!-- src/lib/components/AuthDialog.svelte -->
<script lang="ts">
    import { fade, scale, fly } from 'svelte/transition';
    import { authStore } from '$lib/stores/auth';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
    
    export let isOpen = false;
    let isSignUp = false;
    let email = '';
    let password = '';
    let confirmPassword = '';
    let error = '';
    let loading = false;
    let dialog: HTMLDialogElement;

    $: if (dialog && isOpen) {
        dialog.showModal();
    }

    function close() {
        if (dialog) {
            dialog.close();
        }
        dispatch('close');
        error = '';
        email = '';
        password = '';
        confirmPassword = '';
        isSignUp = false;
    }

    function handleBackdropClick(event: MouseEvent) {
        // Close if clicking outside the dialog content
        if (event.target === dialog) {
            close();
        }
    }

    async function handleSubmit() {
        loading = true;
        error = '';
        
        try {
            if (isSignUp) {
                if (password !== confirmPassword) {
                    error = 'Passwords do not match';
                    return;
                }
                await authStore.signUp(email, password);
            } else {
                await authStore.signIn(email, password);
            }
            close();
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }
</script>

{#if isOpen}
    <dialog
        bind:this={dialog}
        class="bg-transparent p-4 max-w-md w-full backdrop:bg-black/50 backdrop:backdrop-blur-sm rounded-none open:animate-fade-in"
        on:click={handleBackdropClick}
    >
        <div
            class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full overflow-hidden animate-scale-in"
            on:click|stopPropagation
        >
            <!-- Header with decorative gradient -->
            <div class="relative">
                <div class="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-400 opacity-90" />
                <div class="relative px-6 py-8 text-center">
                    <h2 class="text-3xl font-bold text-white mb-2">
                        {isSignUp ? 'Create Account' : 'Welcome Back'}
                    </h2>
                    <p class="text-white/80">
                        {isSignUp ? 'Join us and start clicking!' : 'Sign in to sync your progress'}
                    </p>
                </div>
            </div>

            <!-- Form Section -->
            <div class="p-6">
                <form on:submit|preventDefault={handleSubmit} class="space-y-5">
                    <div class="space-y-4">
                        <div class="relative">
                            <input
                                type="email"
                                id="email"
                                bind:value={email}
                                required
                                class="peer w-full px-4 py-3 rounded-lg border-2 border-gray-200 outline-none focus:border-primary-500 transition-colors bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-transparent"
                                placeholder="Email"
                                disabled={loading}
                            />
                            <label
                                for="email"
                                class="absolute left-4 -top-2.5 px-1 text-sm text-gray-600 dark:text-gray-300 transition-all bg-white dark:bg-gray-800 peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-primary-500"
                            >
                                Email address
                            </label>
                        </div>

                        <div class="relative">
                            <input
                                type="password"
                                id="password"
                                bind:value={password}
                                required
                                minlength="6"
                                class="peer w-full px-4 py-3 rounded-lg border-2 border-gray-200 outline-none focus:border-primary-500 transition-colors bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-transparent"
                                placeholder="Password"
                                disabled={loading}
                            />
                            <label
                                for="password"
                                class="absolute left-4 -top-2.5 px-1 text-sm text-gray-600 dark:text-gray-300 transition-all bg-white dark:bg-gray-800 peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-primary-500"
                            >
                                Password
                            </label>
                        </div>

                        {#if isSignUp}
                            <div class="relative">
                                <input
                                    type="password"
                                    id="confirm-password"
                                    bind:value={confirmPassword}
                                    required
                                    minlength="6"
                                    class="peer w-full px-4 py-3 rounded-lg border-2 border-gray-200 outline-none focus:border-primary-500 transition-colors bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-transparent"
                                    placeholder="Confirm Password"
                                    disabled={loading}
                                />
                                <label
                                    for="confirm-password"
                                    class="absolute left-4 -top-2.5 px-1 text-sm text-gray-600 dark:text-gray-300 transition-all bg-white dark:bg-gray-800 peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-primary-500"
                                >
                                    Confirm Password
                                </label>
                            </div>
                        {/if}
                    </div>

                    {#if error}
                        <div 
                            class="p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm dark:bg-red-900/50 dark:border-red-800 dark:text-red-400"
                            transition:fly={{ y: -10, duration: 200 }}
                        >
                            {error}
                        </div>
                    {/if}

                    <div class="space-y-4 pt-2">
                        <button
                            type="submit"
                            class="w-full flex justify-center items-center gap-2 py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-lg shadow-lg shadow-primary-500/25 hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            disabled={loading}
                        >
                            {#if loading}
                                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Processing...</span>
                            {:else}
                                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                            {/if}
                        </button>

                        <button
                            type="button"
                            class="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white focus:outline-none focus:underline disabled:opacity-50 disabled:cursor-not-allowed"
                            on:click={() => isSignUp = !isSignUp}
                            disabled={loading}
                        >
                            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </dialog>
{/if}

<style>
    /* Add a subtle animation to the gradient background */
    @keyframes gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }

    .bg-gradient-to-r {
        background-size: 200% 200%;
        animation: gradient 6s ease infinite;
    }

    /* Dialog animations */
    @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes scale-in {
        from { transform: scale(0.95); }
        to { transform: scale(1); }
    }

    .animate-fade-in {
        animation: fade-in 0.2s ease-out;
    }

    .animate-scale-in {
        animation: scale-in 0.2s ease-out;
    }

    /* Dialog styles */
    dialog {
        margin: auto;
        border: none;
    }

    dialog::backdrop {
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
    }

    /* Fix for Firefox backdrop */
    @-moz-document url-prefix() {
        dialog::backdrop {
            background: rgba(0, 0, 0, 0.5);
        }
    }
</style>
