<!-- src/lib/components/AchievementSuggestions.svelte -->
<script lang="ts">
    import { slide } from 'svelte/transition';
    import { achievementStore } from '$lib/stores/achievements';
    import type { Achievement } from '$lib/types';

    export let achievements: Achievement[];
    let showSuggestions = true;

    $: nearestAchievements = findNearestAchievements(achievements);
    $: recommendedAchievements = findRecommendedAchievements(achievements);

    function findNearestAchievements(achievements: Achievement[]) {
        const unlockedIds = new Set($achievementStore.unlockedAchievements.map(ua => ua.achievement_id));
        return achievements
            .filter(a => !unlockedIds.has(a.id))
            .map(a => ({
                achievement: a,
                progress: getProgress(a)
            }))
            .filter(a => a.progress > 0)
            .sort((a, b) => b.progress - a.progress)
            .slice(0, 3);
    }

    function findRecommendedAchievements(achievements: Achievement[]) {
        const unlockedIds = new Set($achievementStore.unlockedAchievements.map(ua => ua.achievement_id));
        const unlockedCategories = new Map<string, number>();
        
        // Count unlocked achievements per category
        $achievementStore.unlockedAchievements.forEach(ua => {
            const achievement = achievements.find(a => a.id === ua.achievement_id);
            if (achievement) {
                achievement.requirement_type.forEach(type => {
                    unlockedCategories.set(type, (unlockedCategories.get(type) || 0) + 1);
                });
            }
        });

        // Find categories with fewer unlocks
        const underrepresentedCategories = Array.from(unlockedCategories.entries())
            .sort((a, b) => a[1] - b[1])
            .slice(0, 3)
            .map(([type]) => type);

        // Find locked achievements in those categories
        return achievements
            .filter(a => !unlockedIds.has(a.id))
            .filter(a => a.requirement_type.some(type => underrepresentedCategories.includes(type)))
            .sort((a, b) => {
                const progressA = getProgress(a);
                const progressB = getProgress(b);
                return progressB - progressA;
            })
            .slice(0, 3);
    }

    function getProgress(achievement: Achievement) {
        const userAchievement = $achievementStore.unlockedAchievements.find(
            ua => ua.achievement_id === achievement.id
        );
        if (!userAchievement) return 0;

        const progressPercentages = achievement.requirement_values.map((value, index) => {
            const progress = userAchievement.progress[index] || 0;
            return Math.min((progress / value) * 100, 100);
        });

        return Math.min(
            progressPercentages.reduce((sum, p) => sum + p, 0) / progressPercentages.length,
            100
        );
    }

    function formatProgress(progress: number) {
        return `${Math.round(progress)}%`;
    }
</script>

<div class="suggestions-container">
    <button
        class="toggle-btn"
        on:click={() => showSuggestions = !showSuggestions}
    >
        {showSuggestions ? 'Hide' : 'Show'} Suggestions
        <span class="icon">{showSuggestions ? '▼' : '▶'}</span>
    </button>

    {#if showSuggestions}
        <div class="suggestions" transition:slide>
            {#if nearestAchievements.length > 0}
                <div class="section">
                    <h3>Almost There!</h3>
                    <div class="achievements-grid">
                        {#each nearestAchievements as { achievement, progress }}
                            <div class="achievement-card">
                                <div class="achievement-info">
                                    <h4>{achievement.name}</h4>
                                    <p>{achievement.description}</p>
                                </div>
                                <div class="progress-bar">
                                    <div
                                        class="progress-fill"
                                        style="width: {progress}%"
                                    />
                                    <span class="progress-text">
                                        {formatProgress(progress)}
                                    </span>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}

            {#if recommendedAchievements.length > 0}
                <div class="section">
                    <h3>Try These Next</h3>
                    <div class="achievements-grid">
                        {#each recommendedAchievements as achievement}
                            <div class="achievement-card">
                                <div class="achievement-info">
                                    <h4>{achievement.name}</h4>
                                    <p>{achievement.description}</p>
                                </div>
                                <div class="requirement-tags">
                                    {#each achievement.requirement_type as type}
                                        <span class="tag">{type}</span>
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}

            {#if nearestAchievements.length === 0 && recommendedAchievements.length === 0}
                <p class="empty-message">
                    Keep playing to unlock more achievements!
                </p>
            {/if}
        </div>
    {/if}
</div>

<style>
    .suggestions-container {
        margin: 1rem 0;
        border: 1px solid #dee2e6;
        border-radius: 0.5rem;
        overflow: hidden;
    }

    .toggle-btn {
        width: 100%;
        padding: 0.75rem;
        border: none;
        background: #f8f9fa;
        color: #495057;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.2s;
    }

    .toggle-btn:hover {
        background: #e9ecef;
    }

    .icon {
        font-size: 0.8rem;
    }

    .suggestions {
        padding: 1rem;
    }

    .section {
        margin-bottom: 1.5rem;
    }

    .section:last-child {
        margin-bottom: 0;
    }

    h3 {
        margin: 0 0 1rem 0;
        color: #495057;
        font-size: 1.1rem;
    }

    .achievements-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }

    .achievement-card {
        background: white;
        border-radius: 0.5rem;
        padding: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .achievement-info h4 {
        margin: 0 0 0.5rem 0;
        color: #212529;
    }

    .achievement-info p {
        margin: 0;
        color: #6c757d;
        font-size: 0.9rem;
    }

    .progress-bar {
        margin-top: 0.75rem;
        height: 0.5rem;
        background: #e9ecef;
        border-radius: 0.25rem;
        position: relative;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: #339af0;
        transition: width 0.3s ease;
    }

    .progress-text {
        position: absolute;
        right: 0.5rem;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.8rem;
        color: #495057;
    }

    .requirement-tags {
        margin-top: 0.75rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .tag {
        padding: 0.25rem 0.5rem;
        background: #e9ecef;
        border-radius: 1rem;
        font-size: 0.8rem;
        color: #495057;
    }

    .empty-message {
        text-align: center;
        color: #6c757d;
        font-style: italic;
        margin: 2rem 0;
    }

    @media (max-width: 768px) {
        .achievements-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
