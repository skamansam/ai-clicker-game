<!-- src/lib/components/Header.svelte -->
<script lang="ts">
    import { currentStardate } from '$lib/utils/stardate';
    import AchievementsButton from './AchievementsButton.svelte';
    import ThemeToggle from './ThemeToggle.svelte';
    import AuthButton from './AuthButton.svelte';
    
    export let onShowAchievements: () => void;
</script>

<header class="header">
    <div class="header-content">
        <div class="title-section">
            <h1>Quantum Shield</h1>
            <div class="stardate">
                <span class="stardate-label">STARDATE</span>
                <span class="stardate-value">{$currentStardate}</span>
            </div>
        </div>
        <div class="header-controls">
            <AchievementsButton on:click={onShowAchievements} />
            <ThemeToggle />
            <AuthButton />
        </div>
    </div>
</header>

<style>
    .header {
        background-color: var(--widget-bg-color);
        border-bottom: 1px solid var(--border-color);
        padding: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 1200px;
        margin: 0 auto;
    }

    .title-section {
        display: flex;
        flex-direction: column;
    }

    h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary-color);
    }

    .stardate {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-family: 'Courier New', monospace;
        margin-top: 0.25rem;
    }

    .stardate-label {
        font-size: 0.75rem;
        color: var(--text-color);
        opacity: 0.7;
        font-weight: bold;
    }

    .stardate-value {
        font-size: 0.9rem;
        color: var(--primary-color);
        font-weight: bold;
    }

    .header-controls {
        display: flex;
        gap: 0.75rem;
        align-items: center;
    }

    @media (max-width: 640px) {
        .header-content {
            flex-direction: column;
            gap: 1rem;
        }

        .header-controls {
            width: 100%;
            justify-content: center;
        }
    }
</style>
