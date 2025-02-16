<!-- src/routes/+page.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { gameStore } from '$lib/stores/game';
    import { authStore } from '$lib/stores/auth';
    import { achievementStore } from '$lib/stores/achievements';
    import { prestigeStore } from '$lib/stores/prestige';
    import ClickerButton from '$lib/components/ClickerButton.svelte';
    import Stats from '$lib/components/Stats.svelte';
    import Achievements from '$lib/components/Achievements.svelte';
    import ShopTabs from '$lib/components/ShopTabs.svelte';
    import AuthButton from '$lib/components/AuthButton.svelte';
    import { browser } from '$app/environment';

    let checkInterval: NodeJS.Timeout;

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
        <AuthButton />
    </header>

    <main>
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
            <div class="achievements-section">
                <Achievements />
            </div>
        </div>
    </main>
</div>

<style>
    .game-container {
        min-height: 100vh;
        background: #f8f9fa;
        padding: 2rem;
    }

    header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    h1 {
        margin: 0;
        color: #212529;
        font-size: 2rem;
    }

    .game-layout {
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 2rem;
        max-width: 1400px;
        margin: 0 auto;
    }

    .game-section {
        display: flex;
        flex-direction: column;
        gap: 2rem;
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
        gap: 2rem;
    }

    .achievements-section {
        grid-column: 1 / -1;
    }

    @media (prefers-color-scheme: dark) {
        .game-container {
            background: #1a1a1a;
        }

        h1 {
            color: #f8f9fa;
        }
    }
</style>