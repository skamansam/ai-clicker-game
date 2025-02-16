<!-- src/routes/auth/SignUp.svelte -->
<script lang="ts">
    import { authStore } from '$lib/stores/auth';
    import { fade } from 'svelte/transition';
    
    let email = '';
    let password = '';
    let confirmPassword = '';
    let error = '';
    let loading = false;

    async function handleSubmit() {
        loading = true;
        error = '';
        
        if (password !== confirmPassword) {
            error = 'Passwords do not match';
            loading = false;
            return;
        }

        try {
            await authStore.signUp(email, password);
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
        }
    }
</script>

<form on:submit|preventDefault={handleSubmit} class="auth-form" transition:fade>
    <div class="form-group">
        <label for="email">
            <span class="label-text">Email address</span>
            <div class="input-wrapper">
                <input
                    type="email"
                    id="email"
                    bind:value={email}
                    required
                    placeholder="you@example.com"
                    disabled={loading}
                />
                <div class="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                </div>
            </div>
        </label>
    </div>

    <div class="form-group">
        <label for="password">
            <span class="label-text">Password</span>
            <div class="input-wrapper">
                <input
                    type="password"
                    id="password"
                    bind:value={password}
                    required
                    minlength="6"
                    placeholder="At least 6 characters"
                    disabled={loading}
                />
                <div class="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                    </svg>
                </div>
            </div>
        </label>
    </div>

    <div class="form-group">
        <label for="confirm-password">
            <span class="label-text">Confirm password</span>
            <div class="input-wrapper">
                <input
                    type="password"
                    id="confirm-password"
                    bind:value={confirmPassword}
                    required
                    minlength="6"
                    placeholder="Confirm your password"
                    disabled={loading}
                />
                <div class="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                </div>
            </div>
        </label>
    </div>

    {#if error}
        <div class="error-message" transition:fade>{error}</div>
    {/if}

    <button
        type="submit"
        class="submit-button"
        class:loading
        disabled={loading}
    >
        <span class="button-text">{loading ? 'Creating account...' : 'Create account'}</span>
        {#if loading}
            <div class="loading-spinner"></div>
        {/if}
    </button>
</form>

<style>
    .auth-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        background: var(--bg-input);
        padding: 2rem;
        border-radius: 1rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
                    0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .label-text {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
    }

    .input-wrapper {
        position: relative;
    }

    input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.5rem;
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        font-size: 1rem;
        color: var(--text-primary);
        background: var(--bg-input);
        transition: all 0.2s;
    }

    input:focus {
        outline: none;
        border-color: var(--text-accent);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    input:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .input-icon {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-secondary);
        pointer-events: none;
    }

    .icon {
        width: 1.25rem;
        height: 1.25rem;
    }

    .error-message {
        padding: 0.75rem;
        background: var(--error);
        color: white;
        border-radius: 0.5rem;
        font-size: 0.875rem;
    }

    .submit-button {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.875rem;
        background: var(--bg-button);
        color: var(--text-button);
        border: none;
        border-radius: 0.5rem;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .submit-button:hover:not(:disabled) {
        background: var(--bg-button-hover);
    }

    .submit-button:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4);
    }

    .submit-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .button-text {
        transition: opacity 0.2s;
    }

    .loading .button-text {
        opacity: 0.7;
    }

    .loading-spinner {
        position: absolute;
        right: 1rem;
        width: 1rem;
        height: 1rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    @media (max-width: 640px) {
        .auth-form {
            padding: 1.5rem;
        }
    }
</style>
