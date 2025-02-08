<!-- src/lib/components/AchievementStats.svelte -->
<script lang="ts">
    import { achievementStatsStore, type LeaderboardEntry } from '$lib/stores/achievement-stats';
    import { slide, fade } from 'svelte/transition';
    import type { Achievement } from '$lib/types';

    export let achievement: Achievement;

    let showLeaderboard = false;

    $: rankInfo = $achievementStatsStore.getRankInfo(achievement.id);
    $: leaderboard = $achievementStatsStore.leaderboards[achievement.id] || [];
    $: loading = $achievementStatsStore.loading;

    function loadLeaderboard() {
        if (!showLeaderboard) {
            achievementStatsStore.loadLeaderboard(achievement.id);
        }
        showLeaderboard = !showLeaderboard;
    }

    function formatRank(rank: number) {
        const suffixes = ['th', 'st', 'nd', 'rd'];
        const v = rank % 100;
        return rank + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
    }
</script>

<div class="stats-container">
    {#if rankInfo}
        <div class="stats-summary" transition:slide>
            <div class="stat">
                <span class="label">Global Rank</span>
                <span class="value">{formatRank(rankInfo.rank)}</span>
            </div>
            <div class="stat">
                <span class="label">Top</span>
                <span class="value">{rankInfo.percentile.toFixed(1)}%</span>
            </div>
            <div class="stat">
                <span class="label">Time to Unlock</span>
                <span class="value">{achievementStatsStore.formatDuration(rankInfo.timeToUnlock)}</span>
            </div>
        </div>
    {/if}

    <button
        class="leaderboard-btn"
        class:active={showLeaderboard}
        on:click={loadLeaderboard}
    >
        {showLeaderboard ? 'Hide' : 'Show'} Leaderboard
    </button>

    {#if showLeaderboard}
        <div class="leaderboard" transition:slide>
            {#if loading}
                <div class="loading">Loading leaderboard...</div>
            {:else if leaderboard.length === 0}
                <div class="empty">No entries yet. Be the first!</div>
            {:else}
                <div class="leaderboard-grid">
                    <div class="header">
                        <span>Rank</span>
                        <span>Player</span>
                        <span>Time</span>
                    </div>
                    {#each leaderboard as entry (entry.user_id)}
                        <div
                            class="entry"
                            class:highlight={entry.rank === rankInfo?.rank}
                            in:fade={{ duration: 200 }}
                        >
                            <span class="rank">#{entry.rank}</span>
                            <span class="player">
                                {#if entry.avatar_url}
                                    <img
                                        src={entry.avatar_url}
                                        alt={entry.username}
                                        class="avatar"
                                    />
                                {:else}
                                    <div class="avatar-placeholder">
                                        {entry.username[0].toUpperCase()}
                                    </div>
                                {/if}
                                {entry.username}
                            </span>
                            <span class="time">
                                {achievementStatsStore.formatDuration(entry.time_to_unlock)}
                            </span>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .stats-container {
        margin-top: 1rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 0.5rem;
    }

    .stats-summary {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .stat {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0.75rem;
        background: white;
        border-radius: 0.375rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .label {
        font-size: 0.8rem;
        color: #868e96;
        margin-bottom: 0.25rem;
    }

    .value {
        font-size: 1.1rem;
        font-weight: bold;
        color: #212529;
    }

    .leaderboard-btn {
        width: 100%;
        padding: 0.5rem;
        border: none;
        border-radius: 0.25rem;
        background: #339af0;
        color: white;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
    }

    .leaderboard-btn:hover {
        background: #228be6;
    }

    .leaderboard-btn.active {
        background: #1c7ed6;
    }

    .leaderboard {
        margin-top: 1rem;
        max-height: 300px;
        overflow-y: auto;
    }

    .loading, .empty {
        text-align: center;
        padding: 1rem;
        color: #868e96;
    }

    .leaderboard-grid {
        display: grid;
        gap: 0.5rem;
    }

    .header {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 1rem;
        padding: 0.5rem;
        font-size: 0.8rem;
        color: #868e96;
        font-weight: bold;
        text-transform: uppercase;
    }

    .entry {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 1rem;
        align-items: center;
        padding: 0.5rem;
        background: white;
        border-radius: 0.25rem;
        transition: all 0.2s;
    }

    .entry:hover {
        transform: translateX(2px);
    }

    .entry.highlight {
        background: #e7f5ff;
        border-left: 3px solid #339af0;
    }

    .rank {
        font-weight: bold;
        color: #495057;
        min-width: 2.5rem;
    }

    .player {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .avatar, .avatar-placeholder {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        object-fit: cover;
    }

    .avatar-placeholder {
        background: #dee2e6;
        color: #495057;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: bold;
    }

    .time {
        color: #495057;
        font-family: monospace;
    }

    /* Scrollbar styling */
    .leaderboard::-webkit-scrollbar {
        width: 6px;
    }

    .leaderboard::-webkit-scrollbar-track {
        background: #f1f3f5;
        border-radius: 3px;
    }

    .leaderboard::-webkit-scrollbar-thumb {
        background: #adb5bd;
        border-radius: 3px;
    }

    .leaderboard::-webkit-scrollbar-thumb:hover {
        background: #868e96;
    }

    @media (max-width: 768px) {
        .stats-summary {
            flex-direction: column;
            gap: 0.5rem;
        }

        .stat {
            flex-direction: row;
            justify-content: space-between;
            padding: 0.5rem 1rem;
        }

        .label {
            margin: 0;
        }
    }
</style>
