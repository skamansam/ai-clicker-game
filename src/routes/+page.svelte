<!-- src/routes/+page.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { gameStore } from '$lib/stores/game';
    import { authStore } from '$lib/stores/auth';
    import { achievementStore } from '$lib/stores/achievements';
    import { prestigeStore } from '$lib/stores/prestige';
    import ClickerButton from '$lib/components/ClickerButton.svelte';
    import Stats from '$lib/components/Stats.svelte';
    import AchievementNotifications from '$lib/components/AchievementNotifications.svelte';
    import AchievementsModal from '$lib/components/AchievementsModal.svelte';
    import ShopTabs from '$lib/components/ShopTabs.svelte';
    import AuthButton from '$lib/components/AuthButton.svelte';
    import { browser } from '$app/environment';

    let checkInterval: NodeJS.Timeout;
    let showAchievements = false;

    onMount(async () => {
        if ($authStore) {
            await Promise.all([
                gameStore.loadGameState(),
                achievementStore.loadAchievements(),
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
        <div class="header-actions">
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
    <AchievementNotifications />
    <AchievementsModal 
        show={showAchievements} 
        on:close={() => showAchievements = false} 
    />
</div>

<style>
    .game-container {
        min-height: 100vh;
        height: 100vh;
        background: #f8f9fa;
        display: flex;
        flex-direction: column;
    }

    header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
        background: white;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        flex-shrink: 0;
    }

    .header-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
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

    h1 {
        margin: 0;
        color: #212529;
        font-size: 2rem;
    }

    main {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .game-content {
        flex: 1;
        padding: 2rem;
        overflow: auto;
        display: flex;
        min-height: 0;
    }

    .game-layout {
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 2rem;
        max-width: 1400px;
        margin: 0 auto;
        width: 100%;
        min-height: 0;
    }

    .game-section {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        min-height: 0;
    }

    .clicker-section {
        display: flex;
        justify-content: center;
        align-items: center;
        flex: 1;
    }

    .side-section {
        display: flex;
        flex-direction: column;
        min-height: 0;
        flex: 1;
    }

    @media (prefers-color-scheme: dark) {
        .game-container {
            background: #1a1a1a;
        }

        header {
            background: #2d2d2d;
            border-bottom: 1px solid #3d3d3d;
        }

        h1 {
            color: #f8f9fa;
        }

        .trophy-button {
            background: var(--primary-900);
            color: var(--primary-300);
        }

        .trophy-button:hover {
            background: var(--primary-800);
        }
    }
</style>