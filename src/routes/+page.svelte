<!-- src/routes/+page.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { gameStore } from '$lib/stores/game';
    import { authStore } from '$lib/stores/auth';
    import { achievementStore } from '$lib/stores/achievements';
    import { prestigeStore } from '$lib/stores/prestige';
    import ClickerButton from '$lib/components/ClickerButton.svelte';
    import UpgradeShop from '$lib/components/UpgradeShop.svelte';
    import Stats from '$lib/components/Stats.svelte';
    import Achievements from '$lib/components/Achievements.svelte';
    import Prestige from '$lib/components/Prestige.svelte';
    import { browser } from '$app/environment';

    let checkInterval: NodeJS.Timeout;

    onMount(async () => {
        if ($authStore) {
            await Promise.all([
                gameStore.loadGameState(),
                achievementStore.loadAchievements(),
                prestigeStore.loadPrestige()
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
        <button class="sign-out" on:click={() => authStore.signOut()}>Sign Out</button>
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
                <div class="prestige-section">
                    <Prestige />
                </div>
                <div class="shop-section">
                    <UpgradeShop />
                </div>
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

    .sign-out {
        padding: 0.5rem 1rem;
        background: #e9ecef;
        border: none;
        border-radius: 0.25rem;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background-color 0.2s;
    }

    .sign-out:hover {
        background: #dee2e6;
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
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .side-section {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        height: 100%;
    }

    @media (max-width: 1024px) {
        .game-layout {
            grid-template-columns: 1fr;
        }

        .game-container {
            padding: 1rem;
        }
    }
</style>