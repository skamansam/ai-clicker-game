<!-- src/lib/components/AuthDialog.svelte -->
<script lang="ts">
    import { auth } from '$lib/firebase';
    import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
    import { createEventDispatcher } from 'svelte';

    export let isOpen = false;
    const dispatch = createEventDispatcher();

    let loading = false;

    async function handleGoogleSignIn() {
        try {
            loading = true;
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            dispatch('close');
        } catch (error) {
            console.error('Error signing in with Google:', error);
        } finally {
            loading = false;
        }
    }

    function handleClose() {
        if (!loading) {
            dispatch('close');
        }
    }
</script>

{#if isOpen}
    <div class="modal-overlay" on:click={handleClose}>
        <div class="modal" on:click|stopPropagation>
            <button class="close-button" on:click={handleClose} disabled={loading}>
                ×
            </button>
            <h2>Sign In</h2>
            <p>Sign in to save your progress and compete on the leaderboard!</p>
            <div class="buttons">
                <button 
                    class="google-button" 
                    on:click={handleGoogleSignIn}
                    disabled={loading}
                >
                    {#if loading}
                        Signing in...
                    {:else}
                        Sign in with Google
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(4px);
    }

    .modal {
        background: var(--widget-bg-color);
        border: 1px solid var(--border-color);
        border-radius: 1rem;
        padding: 2rem;
        width: 90%;
        max-width: 400px;
        position: relative;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        color: var(--text-color);
    }

    h2 {
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-color);
    }

    p {
        margin: 0 0 1.5rem 0;
        color: var(--text-color);
        opacity: 0.8;
    }

    .close-button {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-color);
        opacity: 0.7;
        transition: opacity 0.2s ease;
        padding: 0.5rem;
        line-height: 1;
        border-radius: 0.5rem;
    }

    .close-button:hover:not(:disabled) {
        opacity: 1;
        background: var(--bg-color);
    }

    .close-button:disabled {
        cursor: not-allowed;
    }

    .buttons {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .google-button {
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        border: none;
        background: var(--primary-color);
        color: white;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        position: relative;
        overflow: hidden;
    }

    .google-button:hover:not(:disabled) {
        background: var(--primary-hover);
        transform: translateY(-1px);
    }

    .google-button:disabled {
        cursor: wait;
        opacity: 0.7;
    }

    .google-button:disabled::after {
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
    }

    @keyframes loading {
        0% {
            transform: translateX(-100%);
        }
        100% {
            transform: translateX(100%);
        }
    }

    :global(.dark) .modal {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }
</style>
