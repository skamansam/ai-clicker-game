<!-- src/lib/components/Challenges.svelte -->
<script lang="ts">
    import { challengesStore } from '$lib/stores/challenges';
    import { slide, fade } from 'svelte/transition';
    import { onMount, onDestroy } from 'svelte';
    import type { AchievementChallenge, UserChallenge } from '$lib/types';
    import { formatDistance, formatDuration } from 'date-fns';

    let checkInterval: NodeJS.Timer;

    onMount(() => {
        challengesStore.loadChallenges();
        // Check for expired challenges every minute
        checkInterval = setInterval(() => {
            challengesStore.checkExpiredChallenges();
        }, 60000);
    });

    onDestroy(() => {
        if (checkInterval) {
            clearInterval(checkInterval);
        }
    });

    $: activeChallenges = $challengesStore.activeChallenges;
    $: userChallenges = $challengesStore.userChallenges;

    function getUserChallenge(challengeId: string) {
        return userChallenges.find(uc => uc.challenge_id === challengeId);
    }

    function getTimeRemaining(challenge: AchievementChallenge) {
        const endTime = new Date(challenge.end_time);
        const now = new Date();
        if (endTime < now) return '0:00';
        
        const diff = endTime.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }

    function formatProgress(progress: number[], total: number) {
        return `${Math.min(100, (progress / total) * 100).toFixed(1)}%`;
    }

    function getChallengeStatus(challenge: AchievementChallenge) {
        const userChallenge = getUserChallenge(challenge.id);
        if (!userChallenge) return 'Not Started';
        return userChallenge.status.charAt(0).toUpperCase() + userChallenge.status.slice(1);
    }

    function getStatusColor(status: string) {
        switch (status.toLowerCase()) {
            case 'completed': return '#40c057';
            case 'failed': return '#ff6b6b';
            case 'expired': return '#868e96';
            case 'active': return '#339af0';
            default: return '#495057';
        }
    }
</script>

<div class="challenges">
    <div class="header">
        <h2>Daily Challenges</h2>
        {#if $challengesStore.loading}
            <span class="loading">Loading...</span>
        {/if}
    </div>

    {#if activeChallenges.length === 0}
        <p class="empty">No active challenges available.</p>
    {:else}
        <div class="challenge-list">
            {#each activeChallenges as challenge}
                {@const userChallenge = getUserChallenge(challenge.id)}
                {@const status = getChallengeStatus(challenge)}
                <div 
                    class="challenge"
                    class:active={userChallenge?.status === 'active'}
                    transition:slide
                >
                    <div class="challenge-header">
                        <h3>{challenge.name}</h3>
                        <div 
                            class="status"
                            style="--status-color: {getStatusColor(status)}"
                        >
                            {status}
                        </div>
                    </div>
                    
                    <p class="description">{challenge.description}</p>
                    
                    <div class="challenge-info">
                        <div class="time">
                            <span class="label">Time Remaining:</span>
                            <span class="value">{getTimeRemaining(challenge)}</span>
                        </div>
                        <div class="reward">
                            <span class="label">Reward:</span>
                            <span class="value">+{((challenge.reward_multiplier - 1) * 100).toFixed(0)}%</span>
                        </div>
                    </div>

                    {#if userChallenge}
                        <div class="progress-container">
                            {#each userChallenge.progress as progress, i}
                                <div class="requirement">
                                    <div class="progress-bar">
                                        <div 
                                            class="progress"
                                            style="width: {formatProgress(progress, challenge.requirement_values[i])}; background: {getStatusColor(status)}"
                                        ></div>
                                    </div>
                                    <div class="progress-text">
                                        {progress} / {challenge.requirement_values[i]}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <button 
                            class="join-btn"
                            on:click={() => challengesStore.joinChallenge(challenge.id)}
                        >
                            Accept Challenge
                        </button>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .challenges {
        background: white;
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    h2 {
        margin: 0;
        font-size: 1.5rem;
        background: linear-gradient(135deg, #339af0, #22b8cf);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .loading {
        color: #868e96;
        font-style: italic;
    }

    .empty {
        text-align: center;
        color: #868e96;
        font-style: italic;
        margin: 2rem 0;
    }

    .challenge-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .challenge {
        background: #f8f9fa;
        border-radius: 0.5rem;
        padding: 1rem;
        border: 2px solid #e9ecef;
        transition: all 0.3s ease;
    }

    .challenge.active {
        border-color: #339af0;
        background: #f8f9fa;
    }

    .challenge-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .challenge-header h3 {
        margin: 0;
        font-size: 1.2rem;
        color: #212529;
    }

    .status {
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.8rem;
        font-weight: bold;
        color: var(--status-color);
        background: color-mix(in srgb, var(--status-color) 10%, white);
    }

    .description {
        margin: 0.5rem 0;
        color: #495057;
    }

    .challenge-info {
        display: flex;
        justify-content: space-between;
        margin: 1rem 0;
        font-size: 0.9rem;
    }

    .time, .reward {
        display: flex;
        gap: 0.5rem;
    }

    .label {
        color: #6c757d;
    }

    .value {
        font-weight: bold;
        color: #212529;
    }

    .progress-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .requirement {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .progress-bar {
        flex: 1;
        height: 4px;
        background: #e9ecef;
        border-radius: 2px;
        overflow: hidden;
    }

    .progress {
        height: 100%;
        transition: width 0.3s ease;
    }

    .progress-text {
        min-width: 100px;
        text-align: right;
        font-size: 0.8rem;
        color: #495057;
    }

    .join-btn {
        width: 100%;
        padding: 0.75rem;
        border: none;
        border-radius: 0.25rem;
        background: #339af0;
        color: white;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
    }

    .join-btn:hover {
        background: #228be6;
    }
</style>
