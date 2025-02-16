<!-- src/routes/+page.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { gameStore } from '$lib/stores/game';
    import { authStore } from '$lib/stores/auth';
    import { achievementStore } from '$lib/stores/achievements';
    import { prestigeStore } from '$lib/stores/prestige';
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
                achievementStore.loadUserAchievements(),
                prestigeStore.loadPrestigeData()
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

<div class="game-container">
    <header>
        <h1>Clicker Game</h1>
        <div class="header-right">
            <ThemeToggle />
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
            <AuthButton />
        </div>
    </header>

    <AchievementNotifications />

    <main>
        <div class="game-content">
            <div class="game-layout">
                <div class="game-section">
                    <Stats />
                    <div class="clicker-section">
                        <ClickerButton />
                    </div>
                </div>
                <div class="side-section">
                    <ShopTabs />
                </div>
            </div>
        </div>
    </main>

    {#if showAchievements}
        <AchievementsModal bind:show={showAchievements} on:close={() => showAchievements = false} />
    {/if}
</div>

<style>
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

    .game-container {
        min-height: 100vh;
        height: 100vh;
        display: flex;
        flex-direction: column;
    }

    header {
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--bg-color);
        transition: border-color 0.3s ease;
    }

    h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-color);
    }

    .header-right {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    button {
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        border: none;
        background: var(--primary-color);
        color: white;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    button:hover {
        background: var(--primary-hover);
    }

    main {
        flex: 1;
        padding: 2rem;
        display: flex;
        justify-content: center;
        background: var(--bg-color);
        transition: background-color 0.3s ease;
        min-height: 0;
    }

    .game-content {
        max-width: 1200px;
        width: 100%;
        height: 100%;
    }

    .game-layout {
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 2rem;
        height: 100%;
    }

    .game-section {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .clicker-section {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .side-section {
        height: 100%;
        overflow-y: auto;
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