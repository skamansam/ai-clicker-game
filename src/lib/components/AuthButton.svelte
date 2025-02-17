<!-- src/lib/components/AuthButton.svelte -->
<script lang="ts">
    import { auth } from '$lib/firebase';
    import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
    import { authStore } from '$lib/stores/auth';

    let loading = false;

    async function handleAuth() {
        if ($authStore.user) {
            try {
                loading = true;
                await signOut(auth);
            } catch (error) {
                console.error('Error signing out:', error);
            } finally {
                loading = false;
            }
        } else {
            try {
                loading = true;
                const provider = new GoogleAuthProvider();
                await signInWithPopup(auth, provider);
            } catch (error) {
                console.error('Error signing in:', error);
            } finally {
                loading = false;
            }
        }
    }
</script>

<button 
    class="auth-button" 
    class:loading 
    class:signed-in={$authStore.user}
    on:click={handleAuth}
    disabled={loading}
>
    {#if loading}
        Loading...
    {:else if $authStore.user}
        Sign Out
    {:else}
        Sign In
    {/if}
</button>

<style>
    .auth-button {
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        border: 1px solid var(--border-color);
        background: var(--primary-color);
        color: white;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 100px;
        justify-content: center;
    }

    .auth-button:hover:not(:disabled) {
        background: var(--primary-hover);
        transform: translateY(-1px);
    }

    .auth-button.signed-in {
        background: var(--widget-bg-color);
        color: var(--text-color);
        border: 1px solid var(--border-color);
    }

    .auth-button.signed-in:hover:not(:disabled) {
        border-color: var(--primary-color);
        color: var(--primary-color);
        background: var(--bg-color);
    }

    .auth-button:disabled {
        cursor: not-allowed;
        opacity: 0.7;
    }

    .loading {
        position: relative;
        cursor: wait;
    }

    .loading::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
        );
        animation: loading 1.5s infinite;
        border-radius: 0.5rem;
    }

    .signed-in.loading::after {
        background: linear-gradient(
            90deg,
            transparent,
            rgba(var(--primary-color-rgb), 0.2),
            transparent
        );
    }

    @keyframes loading {
        0% {
            transform: translateX(-100%);
        }
        100% {
            transform: translateX(100%);
        }
    }
</style>
