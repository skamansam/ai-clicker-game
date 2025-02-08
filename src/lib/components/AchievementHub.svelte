<!-- src/lib/components/AchievementHub.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { challengeStore } from '$lib/stores/achievement-challenges';
    import { shopStore } from '$lib/stores/achievement-shop';
    import { collectionStore } from '$lib/stores/achievement-collections';
    import { formatDistance, formatDistanceToNow } from 'date-fns';

    let activeTab: 'challenges' | 'shop' | 'collections' = 'challenges';
    let selectedChallenge = null;
    let selectedCompetition = null;
    let selectedCollection = null;
    let selectedSet = null;
    let showRewards = false;

    onMount(async () => {
        await Promise.all([
            challengeStore.loadChallenges(),
            shopStore.loadShop(),
            collectionStore.loadCollections()
        ]);
    });

    function formatTime(timeString: string) {
        return formatDistanceToNow(new Date(timeString), { addSuffix: true });
    }

    function formatDuration(timeString: string) {
        return formatDistance(new Date(timeString), new Date());
    }

    function getProgressColor(progress: number) {
        if (progress >= 100) return '#40c057';
        if (progress >= 75) return '#fab005';
        if (progress >= 50) return '#ff922b';
        return '#adb5bd';
    }

    function getRarityColor(rarity: string) {
        switch (rarity) {
            case 'legendary': return '#ff6b6b';
            case 'epic': return '#cc5de8';
            case 'rare': return '#339af0';
            default: return '#51cf66';
        }
    }
</script>

<div class="achievement-hub">
    <div class="tabs">
        <button
            class:active={activeTab === 'challenges'}
            on:click={() => activeTab = 'challenges'}
        >
            🏆 Challenges
        </button>
        <button
            class:active={activeTab === 'shop'}
            on:click={() => activeTab = 'shop'}
        >
            🛍️ Shop
        </button>
        <button
            class:active={activeTab === 'collections'}
            on:click={() => activeTab = 'collections'}
        >
            📚 Collections
        </button>
    </div>

    <div class="content">
        {#if activeTab === 'challenges'}
            <div class="challenges" transition:fade>
                <div class="section">
                    <h3>Active Challenges</h3>
                    <div class="challenge-grid">
                        {#each $challengeStore.activeChallenges as challenge}
                            {@const progress = challengeStore.getChallengeProgress(challenge.id)}
                            <div
                                class="challenge-card"
                                class:completed={progress?.completed}
                                on:click={() => selectedChallenge = challenge}
                            >
                                <h4>{challenge.title}</h4>
                                <p>{challenge.description}</p>
                                <div class="progress-bar">
                                    <div
                                        class="progress"
                                        style="width: {progress?.progress || 0}%; background: {getProgressColor(progress?.progress || 0)}"
                                    ></div>
                                </div>
                                <div class="challenge-footer">
                                    <span>🏃 {formatTime(challenge.end_time)}</span>
                                    <span>👥 {challenge.participants}</span>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>

                <div class="section">
                    <h3>Active Competitions</h3>
                    <div class="competition-grid">
                        {#each $challengeStore.activeCompetitions as competition}
                            {@const progress = challengeStore.getCompetitionProgress(competition.id)}
                            <div
                                class="competition-card"
                                on:click={() => selectedCompetition = competition}
                            >
                                <div class="competition-header">
                                    <h4>{competition.title}</h4>
                                    <span class="prize">🏆 {competition.prize_pool}</span>
                                </div>
                                <p>{competition.description}</p>
                                <div class="competition-stats">
                                    <span>👑 {competition.current_leader.username}: {competition.current_leader.score}</span>
                                    <span>👥 {competition.participants}</span>
                                </div>
                                <div class="competition-footer">
                                    <span>⏳ {formatTime(competition.end_time)}</span>
                                    <span>💰 Entry: {competition.entry_fee}</span>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        {:else if activeTab === 'shop'}
            <div class="shop" transition:fade>
                <div class="shop-header">
                    <div class="player-stats">
                        <span>💰 {$shopStore.inventory.points} Points</span>
                        <span>✨ {$shopStore.inventory.multiplier}x Multiplier</span>
                    </div>
                </div>

                <div class="section">
                    <h3>Featured Items</h3>
                    <div class="shop-grid">
                        {#each $shopStore.featured as item}
                            <div
                                class="shop-item"
                                style="border-color: {getRarityColor(item.rarity)}"
                            >
                                {#if item.preview_url}
                                    <img src={item.preview_url} alt={item.name} />
                                {/if}
                                <h4>{item.name}</h4>
                                <p>{item.description}</p>
                                <div class="item-footer">
                                    <span class="cost">💰 {item.cost}</span>
                                    {#if item.limited_time}
                                        <span class="time">⏳ {formatTime(item.end_time)}</span>
                                    {/if}
                                </div>
                                <button
                                    class="buy-btn"
                                    disabled={!shopStore.canPurchase(item)}
                                    on:click={() => shopStore.purchaseItem(item.id)}
                                >
                                    {shopStore.hasItem(item.id) ? 'Owned' : 'Purchase'}
                                </button>
                            </div>
                        {/each}
                    </div>
                </div>

                <div class="section">
                    <h3>All Items</h3>
                    <div class="shop-grid">
                        {#each $shopStore.items as item}
                            <div
                                class="shop-item"
                                style="border-color: {getRarityColor(item.rarity)}"
                            >
                                {#if item.preview_url}
                                    <img src={item.preview_url} alt={item.name} />
                                {/if}
                                <h4>{item.name}</h4>
                                <p>{item.description}</p>
                                <div class="item-footer">
                                    <span class="cost">💰 {item.cost}</span>
                                    {#if item.limited_time}
                                        <span class="time">⏳ {formatTime(item.end_time)}</span>
                                    {/if}
                                </div>
                                <button
                                    class="buy-btn"
                                    disabled={!shopStore.canPurchase(item)}
                                    on:click={() => shopStore.purchaseItem(item.id)}
                                >
                                    {shopStore.hasItem(item.id) ? 'Owned' : 'Purchase'}
                                </button>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        {:else if activeTab === 'collections'}
            <div class="collections" transition:fade>
                {#each $collectionStore.collections as collection}
                    {@const progress = collectionStore.getCollectionProgress(collection.id)}
                    <div
                        class="collection-card"
                        style="background-image: url({collection.theme.background_url || ''})"
                        on:click={() => selectedCollection = collection}
                    >
                        <div class="collection-content">
                            <h3>
                                <i class={collection.theme.icon}></i>
                                {collection.name}
                            </h3>
                            <p>{collection.description}</p>
                            <div class="progress-bar">
                                <div
                                    class="progress"
                                    style="width: {collectionStore.calculateCollectionCompletion(collection.id)}%"
                                ></div>
                            </div>
                            <div class="collection-stats">
                                <span>📚 {progress?.sets_completed || 0}/{progress?.total_sets || 0} Sets</span>
                                <span>🌟 {progress?.perfect_sets || 0} Perfect</span>
                            </div>
                            {#if collection.limited_time}
                                <div class="collection-time">
                                    ⏳ {formatTime(collection.end_time)}
                                </div>
                            {/if}
                        </div>
                    </div>

                    {#if selectedCollection?.id === collection.id}
                        <div class="collection-details" transition:slide>
                            <h4>Achievement Sets</h4>
                            <div class="sets-grid">
                                {#each collectionStore.getCollectionSets(collection.id) as set}
                                    {@const setProgress = collectionStore.getSetProgress(set.id)}
                                    <div
                                        class="set-card"
                                        class:perfect={setProgress?.perfect}
                                        on:click={() => selectedSet = set}
                                    >
                                        <div class="set-header">
                                            <h5>{set.name}</h5>
                                            <span class="difficulty">{set.difficulty}</span>
                                        </div>
                                        <p>{set.description}</p>
                                        <div class="progress-bar">
                                            <div
                                                class="progress"
                                                style="width: {collectionStore.calculateSetCompletion(set.id)}%"
                                            ></div>
                                        </div>
                                        <div class="set-stats">
                                            <span>🎯 {setProgress?.achievements_completed || 0}/{setProgress?.total_achievements || 0}</span>
                                            {#if setProgress?.time_bonus_earned}
                                                <span>⚡ +{setProgress.time_bonus_earned}%</span>
                                            {/if}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                {/each}
            </div>
        {/if}
    </div>

    {#if selectedChallenge}
        <div class="modal" transition:fade>
            <div class="modal-content">
                <h3>{selectedChallenge.title}</h3>
                <p>{selectedChallenge.description}</p>
                
                <div class="requirements">
                    <h4>Requirements</h4>
                    <ul>
                        {#each selectedChallenge.requirements as req}
                            <li>
                                {#if req.type === 'achievements'}
                                    🎯 Unlock {req.value} achievements
                                {:else if req.type === 'time'}
                                    ⏱️ Complete within {formatDuration(req.value)}
                                {:else if req.type === 'combos'}
                                    🔄 Achieve {req.value}x combo
                                {:else if req.type === 'perfect'}
                                    ✨ Perfect completion
                                {/if}
                            </li>
                        {/each}
                    </ul>
                </div>

                <div class="rewards">
                    <h4>Rewards</h4>
                    <ul>
                        {#each selectedChallenge.rewards as reward}
                            <li>
                                {#if reward.type === 'multiplier'}
                                    ✨ {reward.value}x Multiplier
                                {:else if reward.type === 'points'}
                                    💰 {reward.value} Points
                                {:else if reward.type === 'badge'}
                                    🏅 {reward.value}
                                {:else if reward.type === 'title'}
                                    👑 "{reward.value}"
                                {:else if reward.type === 'theme'}
                                    🎨 {reward.value} Theme
                                {:else if reward.type === 'effect'}
                                    💫 {reward.value} Effect
                                {/if}
                            </li>
                        {/each}
                    </ul>
                </div>

                <div class="modal-actions">
                    <button on:click={() => selectedChallenge = null}>Close</button>
                    {#if !challengeStore.getChallengeProgress(selectedChallenge.id)}
                        <button
                            class="primary"
                            on:click={() => challengeStore.joinChallenge(selectedChallenge.id)}
                        >
                            Accept Challenge
                        </button>
                    {/if}
                </div>
            </div>
        </div>
    {/if}

    {#if selectedCompetition}
        <div class="modal" transition:fade>
            <div class="modal-content">
                <h3>{selectedCompetition.title}</h3>
                <p>{selectedCompetition.description}</p>

                <div class="leaderboard">
                    <h4>Current Standings</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Player</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each selectedCompetition.leaderboard as entry}
                                <tr>
                                    <td>{entry.rank}</td>
                                    <td>{entry.username}</td>
                                    <td>{entry.score}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>

                <div class="rewards">
                    <h4>Prizes</h4>
                    <ul>
                        {#each selectedCompetition.rewards as reward}
                            <li>
                                {reward.rank}. {reward.value} {reward.type}
                            </li>
                        {/each}
                    </ul>
                </div>

                <div class="modal-actions">
                    <button on:click={() => selectedCompetition = null}>Close</button>
                    {#if !challengeStore.getCompetitionProgress(selectedCompetition.id)}
                        <button
                            class="primary"
                            on:click={() => challengeStore.joinCompetition(selectedCompetition.id)}
                        >
                            Join Competition ({selectedCompetition.entry_fee} points)
                        </button>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .achievement-hub {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
    }

    .tabs {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .tabs button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 0.5rem;
        background: white;
        color: #495057;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .tabs button:hover {
        background: #f1f3f5;
    }

    .tabs button.active {
        background: #339af0;
        color: white;
    }

    .content {
        background: #f8f9fa;
        border-radius: 0.5rem;
        padding: 1rem;
    }

    .section {
        margin-bottom: 2rem;
    }

    .section h3 {
        margin: 0 0 1rem 0;
        color: #212529;
    }

    .challenge-grid,
    .competition-grid,
    .shop-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
    }

    .challenge-card,
    .competition-card,
    .shop-item {
        background: white;
        border-radius: 0.5rem;
        padding: 1rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .challenge-card:hover,
    .competition-card:hover,
    .shop-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .progress-bar {
        width: 100%;
        height: 6px;
        background: #e9ecef;
        border-radius: 3px;
        margin: 0.5rem 0;
        overflow: hidden;
    }

    .progress {
        height: 100%;
        background: #339af0;
        transition: width 0.3s ease;
    }

    .challenge-footer,
    .competition-footer,
    .item-footer {
        display: flex;
        justify-content: space-between;
        margin-top: 0.5rem;
        font-size: 0.9rem;
        color: #868e96;
    }

    .collection-card {
        background: white;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        overflow: hidden;
        cursor: pointer;
    }

    .collection-content {
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.9);
    }

    .sets-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }

    .set-card {
        background: white;
        border-radius: 0.5rem;
        padding: 1rem;
        cursor: pointer;
    }

    .set-card.perfect {
        background: linear-gradient(135deg, #fff0f6, #f3f0ff);
        border: 1px solid #cc5de8;
    }

    .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-content {
        background: white;
        border-radius: 0.5rem;
        padding: 2rem;
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
    }

    .modal-actions button {
        padding: 0.5rem 1.5rem;
        border: none;
        border-radius: 0.25rem;
        cursor: pointer;
    }

    .modal-actions button.primary {
        background: #339af0;
        color: white;
    }

    @media (max-width: 768px) {
        .achievement-hub {
            padding: 0.5rem;
        }

        .challenge-grid,
        .competition-grid,
        .shop-grid,
        .sets-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
