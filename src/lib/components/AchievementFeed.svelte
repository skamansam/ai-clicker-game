<!-- src/lib/components/AchievementFeed.svelte -->
<script lang="ts">
    import { achievementSocialStore, type AchievementShare } from '$lib/stores/achievement-social';
    import { slide, fade } from 'svelte/transition';
    import { flip } from 'svelte/animate';

    let message = '';
    export let achievement = null;

    $: shares = $achievementSocialStore.shares;
    $: loading = $achievementSocialStore.loading;
    $: userLikes = $achievementSocialStore.userLikes;

    async function shareAchievement() {
        if (!message.trim() || !achievement) return;

        const success = await achievementSocialStore.shareAchievement(achievement, message.trim());
        if (success) {
            message = '';
        }
    }

    function toggleLike(shareId: string) {
        achievementSocialStore.toggleLike(shareId);
    }

    function deleteShare(shareId: string) {
        if (confirm('Are you sure you want to delete this share?')) {
            achievementSocialStore.deleteShare(shareId);
        }
    }
</script>

<div class="feed-container">
    {#if achievement}
        <div class="share-form" transition:slide>
            <textarea
                bind:value={message}
                placeholder="Share your thoughts about this achievement..."
                rows="2"
            ></textarea>
            <button
                class="share-btn"
                disabled={!message.trim()}
                on:click={shareAchievement}
            >
                Share
            </button>
        </div>
    {/if}

    <div class="feed">
        {#if loading}
            <div class="loading">Loading shares...</div>
        {:else if shares.length === 0}
            <div class="empty">No shares yet. Be the first to share!</div>
        {:else}
            {#each shares as share (share.id)}
                <div
                    class="share-card"
                    animate:flip={{ duration: 300 }}
                    in:fade={{ duration: 200 }}
                >
                    <div class="share-header">
                        <div class="user-info">
                            {#if share.profiles.avatar_url}
                                <img
                                    src={share.profiles.avatar_url}
                                    alt={share.profiles.username}
                                    class="avatar"
                                />
                            {:else}
                                <div class="avatar-placeholder">
                                    {share.profiles.username[0].toUpperCase()}
                                </div>
                            {/if}
                            <span class="username">{share.profiles.username}</span>
                        </div>
                        <div class="share-meta">
                            <span class="time">
                                {achievementSocialStore.formatRelativeTime(share.created_at)}
                            </span>
                            {#if share.user_id === $supabase.auth.user()?.id}
                                <button
                                    class="delete-btn"
                                    on:click={() => deleteShare(share.id)}
                                >
                                    ×
                                </button>
                            {/if}
                        </div>
                    </div>

                    <div class="achievement-info">
                        <div
                            class="achievement-badge"
                            style="--badge-color: {share.achievements.tier_color}"
                        >
                            {share.achievements.tier}
                        </div>
                        <span class="achievement-name">
                            {share.achievements.name}
                        </span>
                    </div>

                    <p class="message">{share.message}</p>

                    <div class="share-footer">
                        <button
                            class="like-btn"
                            class:liked={userLikes.has(share.id)}
                            on:click={() => toggleLike(share.id)}
                        >
                            {userLikes.has(share.id) ? '❤️' : '🤍'}
                            <span class="like-count">{share.likes}</span>
                        </button>
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>

<style>
    .feed-container {
        margin-top: 1rem;
    }

    .share-form {
        margin-bottom: 1rem;
    }

    textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #dee2e6;
        border-radius: 0.375rem;
        resize: vertical;
        font-family: inherit;
        margin-bottom: 0.5rem;
    }

    textarea:focus {
        outline: none;
        border-color: #339af0;
        box-shadow: 0 0 0 2px rgba(51, 154, 240, 0.2);
    }

    .share-btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.25rem;
        background: #339af0;
        color: white;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
    }

    .share-btn:hover:not(:disabled) {
        background: #228be6;
    }

    .share-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .feed {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .loading, .empty {
        text-align: center;
        padding: 2rem;
        color: #868e96;
    }

    .share-card {
        background: white;
        border-radius: 0.5rem;
        padding: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .share-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .avatar, .avatar-placeholder {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
    }

    .avatar-placeholder {
        background: #dee2e6;
        color: #495057;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
    }

    .username {
        font-weight: bold;
        color: #495057;
    }

    .share-meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .time {
        color: #868e96;
        font-size: 0.9rem;
    }

    .delete-btn {
        border: none;
        background: none;
        color: #868e96;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0.25rem;
        line-height: 1;
        border-radius: 50%;
        transition: all 0.2s;
    }

    .delete-btn:hover {
        background: #f1f3f5;
        color: #ff6b6b;
    }

    .achievement-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
    }

    .achievement-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        background: var(--badge-color);
        color: white;
        font-size: 0.8rem;
        font-weight: bold;
        text-transform: uppercase;
    }

    .achievement-name {
        color: #495057;
        font-weight: 500;
    }

    .message {
        margin: 0 0 0.75rem 0;
        color: #495057;
        line-height: 1.5;
        white-space: pre-wrap;
    }

    .share-footer {
        display: flex;
        justify-content: flex-end;
    }

    .like-btn {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.5rem;
        border: none;
        background: none;
        cursor: pointer;
        transition: all 0.2s;
        border-radius: 0.25rem;
    }

    .like-btn:hover {
        background: #f1f3f5;
    }

    .like-count {
        color: #495057;
        font-weight: 500;
    }

    @media (max-width: 768px) {
        .share-card {
            padding: 0.75rem;
        }

        .avatar, .avatar-placeholder {
            width: 28px;
            height: 28px;
        }

        .username {
            font-size: 0.9rem;
        }

        .message {
            font-size: 0.9rem;
        }
    }
</style>
