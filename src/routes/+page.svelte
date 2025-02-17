<!-- src/routes/+page.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { gameStore } from '$lib/stores/game';
    import { authStore } from '$lib/stores/auth';
    import { achievementStore } from '$lib/stores/achievements';
    import { themeStore } from '$lib/stores/theme';
    import ClickerButton from '$lib/components/ClickerButton.svelte';
    import Stats from '$lib/components/Stats.svelte';
    import AchievementNotifications from '$lib/components/AchievementNotifications.svelte';
    import AchievementsModal from '$lib/components/AchievementsModal.svelte';
    import ShopTabs from '$lib/components/ShopTabs.svelte';
    import AuthButton from '$lib/components/AuthButton.svelte';
    import ThemeToggle from '$lib/components/ThemeToggle.svelte';
    import { browser } from '$app/environment';

    let checkInterval: NodeJS.Timeout;
    let showAchievements = false;

    onMount(async () => {
        // Load achievements regardless of auth state
        await achievementStore.loadAchievements();

        // Load user-specific data if authenticated
        if ($authStore) {
            await Promise.all([
                gameStore.loadGameState(),
                achievementStore.loadUserAchievements()
            ]);
        }

        // Only set up the interval in the browser
        if (browser) {
            checkInterval = setInterval(() => {
                if ($authStore && achievementStore.checkAchievements) {
                    achievementStore.checkAchievements();
                }
            }, 1000);

            // Set initial theme class
            document.documentElement.classList.toggle('dark', $themeStore === 'dark');
        }
    });

    onDestroy(() => {
        if (checkInterval) {
            clearInterval(checkInterval);
        }
    });
</script>

<div class="container">
    <header class="header">
        <div class="header-content">
            <h1>Clicker Game</h1>
            <Stats />
            <div class="header-right">
                <button 
                    class="trophy-button" 
                    on:click={() => showAchievements = true}
                    title="View Achievements"
                >
                    <span class="trophy-icon">🏆</span>
                    <span class="achievement-count">
                        {$achievementStore.unlockedAchievements.length}/{$achievementStore.achievements.length}
                    </span>
                </button>
                <ThemeToggle />
                <AuthButton />
            </div>
        </div>
    </header>

    <main class="main-content">
        <div class="game-container">
            <div class="clicker-section">
                <ClickerButton />
            </div>
            
            <div class="shop-section">
                <ShopTabs />
            </div>
        </div>
    </main>

    <AchievementNotifications />

    {#if showAchievements}
        <AchievementsModal bind:show={showAchievements} on:close={() => showAchievements = false} />
    {/if}
</div>

<style>
    :global(body) {
        margin: 0;
        height: 100vh;
        overflow: hidden;
    }

    :global(html) {
        --bg-color: #f8f9fa;
        --text-color: #1f2937;
        --border-color: #e5e7eb;
        --primary-color: #3b82f6;
        --primary-hover: #2563eb;
        --success-color: #10b981;
        --error-color: #ef4444;
    }

    :global(html.dark) {
        --bg-color: #1f2937;
        --text-color: #f3f4f6;
        --border-color: #374151;
        --primary-color: #60a5fa;
        --primary-hover: #3b82f6;
        --success-color: #34d399;
        --error-color: #f87171;
    }

    .container {
        height: 100vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .header {
        background: var(--bg-color);
        border-bottom: 1px solid var(--border-color);
        padding: 1rem;
        z-index: 10;
        transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    .header-content {
        max-width: 1200px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 2rem;
    }

    h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-color);
        white-space: nowrap;
    }

    .header-right {
        display: flex;
        align-items: center;
        gap: 1rem;
        white-space: nowrap;
    }

    :global(.header-content > .stats) {
        justify-self: center;
    }

    .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 2rem;
        min-height: 0;
        overflow: hidden;
    }

    .game-container {
        flex: 1;
        max-width: 1200px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        width: 100%;
        min-height: 0;
        overflow: hidden;
    }

    .clicker-section {
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
    }

    .shop-section {
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .trophy-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: var(--primary-50);
        border: none;
        border-radius: 0.5rem;
        color: var(--primary-700);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .trophy-button:hover {
        background: var(--primary-100);
    }

    .trophy-icon {
        font-size: 1.25rem;
    }

    .achievement-count {
        font-size: 0.875rem;
    }
</style>