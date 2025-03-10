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
    import StoryLog from '$lib/components/StoryLog.svelte';
    import Header from '$lib/components/Header.svelte';
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
    <Header onShowAchievements={() => showAchievements = true} />

    <main class="main-content">
        <div class="game-container">
            <div class="main-section">
                <div class="story-section">
                    <StoryLog />
                </div>
                <div class="clicker-section">
                    <ClickerButton />
                    <Stats />
                </div>
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
        --widget-bg-color: #f3f4f6;
    }

    :global(html.dark) {
        --bg-color: #1f2937;
        --text-color: #f3f4f6;
        --border-color: #374151;
        --primary-color: #60a5fa;
        --primary-hover: #3b82f6;
        --success-color: #34d399;
        --error-color: #f87171;
        --widget-bg-color: #2f3339;
    }

    .container {
        height: 100vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .header {
        background: var(--widget-bg-color);
        border-bottom: 1px solid var(--border-color);
        padding: 1rem;
        position: sticky;
        top: 0;
        z-index: 10;
        transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    .header-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }

    h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-color);
        white-space: nowrap;
    }

    .header-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
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
        display: flex;
        flex-direction: column;
        gap: 2rem;
        padding: 2rem;
        height: 100%;
        overflow-y: auto;
    }

    .main-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        align-items: start;
    }

    .story-section {
        height: 100%;
    }

    .clicker-section {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        align-items: center;
    }

    .shop-section {
        flex: 1;
    }

    @media (max-width: 768px) {
        .main-section {
            grid-template-columns: 1fr;
        }
    }
</style>