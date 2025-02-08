<!-- src/lib/components/AchievementShare.svelte -->
<script lang="ts">
    import { slide, fade } from 'svelte/transition';
    import { achievementSocialStore } from '$lib/stores/achievement-social';
    import { achievementStatsStore } from '$lib/stores/achievement-stats';
    import type { Achievement } from '$lib/types';
    import { formatDistance } from 'date-fns';

    export let achievement: Achievement;

    let message = '';
    let showEmojis = false;
    let selectedTemplate = '';

    const shareTemplates = [
        "Just unlocked {achievement}! 🎉",
        "Finally got {achievement} after {time}! 💪",
        "Check out my new achievement: {achievement} ⭐",
        "Can't believe I just got {achievement}! 🔥",
        "Another one for the collection: {achievement} 🏆",
        "Challenge completed: {achievement} ✨"
    ];

    const emojiCategories = [
        {
            name: "Celebration",
            emojis: ["🎉", "🎊", "🎈", "🎆", "🎇", "✨", "⭐", "🌟", "💫", "🏆"]
        },
        {
            name: "Gaming",
            emojis: ["🎮", "🎲", "🎯", "🎪", "🎨", "🎭", "🎪", "🎰", "🎳", "🎤"]
        },
        {
            name: "Emotions",
            emojis: ["😄", "😎", "🤩", "😊", "🥳", "😌", "😤", "💪", "👊", "🙌"]
        },
        {
            name: "Objects",
            emojis: ["💎", "🔥", "⚡", "💫", "🌈", "🎵", "🎶", "💝", "💖", "💯"]
        }
    ];

    function useTemplate(template: string) {
        const timeToUnlock = achievementStatsStore.playerStats.averageTimeToUnlock;
        message = template
            .replace('{achievement}', achievement.name)
            .replace('{time}', timeToUnlock);
    }

    function addEmoji(emoji: string) {
        message += emoji;
    }

    async function shareAchievement() {
        if (!message.trim()) return;
        
        await achievementSocialStore.shareAchievement(achievement.id, message);
        message = '';
        showEmojis = false;
    }

    function formatTime(timeString: string) {
        return formatDistance(new Date(timeString), new Date(), { addSuffix: true });
    }
</script>

<div class="share-container">
    <div class="share-form">
        <div class="templates">
            <h4>Quick Share</h4>
            <div class="template-buttons">
                {#each shareTemplates as template}
                    <button
                        class="template-btn"
                        class:selected={selectedTemplate === template}
                        on:click={() => {
                            selectedTemplate = template;
                            useTemplate(template);
                        }}
                    >
                        {template}
                    </button>
                {/each}
            </div>
        </div>

        <div class="message-input">
            <textarea
                bind:value={message}
                placeholder="Share your achievement message..."
                rows="3"
            ></textarea>
            
            <div class="input-actions">
                <button
                    class="emoji-btn"
                    class:active={showEmojis}
                    on:click={() => showEmojis = !showEmojis}
                >
                    😊 Add Emoji
                </button>
                <button
                    class="share-btn"
                    disabled={!message.trim()}
                    on:click={shareAchievement}
                >
                    Share Achievement
                </button>
            </div>
        </div>

        {#if showEmojis}
            <div class="emoji-picker" transition:slide>
                {#each emojiCategories as category}
                    <div class="emoji-category">
                        <h5>{category.name}</h5>
                        <div class="emoji-grid">
                            {#each category.emojis as emoji}
                                <button
                                    class="emoji"
                                    on:click={() => addEmoji(emoji)}
                                >
                                    {emoji}
                                </button>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <div class="recent-shares">
        <h4>Recent Shares</h4>
        {#each $achievementSocialStore.shares as share (share.id)}
            <div class="share-card" transition:fade>
                <div class="share-header">
                    <img
                        src={share.user.avatar_url}
                        alt={share.user.username}
                        class="avatar"
                    />
                    <div class="share-info">
                        <span class="username">{share.user.username}</span>
                        <span class="time">{formatTime(share.created_at)}</span>
                    </div>
                </div>
                
                <p class="message">{share.message}</p>
                
                <div class="share-actions">
                    <button
                        class="like-btn"
                        class:liked={share.liked_by_user}
                        on:click={() => achievementSocialStore.toggleLike(share.id)}
                    >
                        {share.liked_by_user ? '❤️' : '🤍'} {share.likes}
                    </button>
                    <button
                        class="reply-btn"
                        on:click={() => {
                            message = `@${share.user.username} `;
                        }}
                    >
                        💬 Reply
                    </button>
                </div>
            </div>
        {/each}
    </div>
</div>

<style>
    .share-container {
        margin-top: 1rem;
    }

    .share-form {
        background: white;
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 1rem;
    }

    h4 {
        margin: 0 0 0.75rem 0;
        color: #495057;
    }

    .templates {
        margin-bottom: 1rem;
    }

    .template-buttons {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.5rem;
    }

    .template-btn {
        padding: 0.5rem;
        border: 1px solid #dee2e6;
        border-radius: 0.25rem;
        background: white;
        color: #495057;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
        font-size: 0.9rem;
    }

    .template-btn:hover {
        background: #f8f9fa;
        border-color: #adb5bd;
    }

    .template-btn.selected {
        background: #e7f5ff;
        border-color: #339af0;
        color: #1971c2;
    }

    .message-input {
        margin-bottom: 1rem;
    }

    textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #dee2e6;
        border-radius: 0.25rem;
        resize: vertical;
        font-size: 0.95rem;
        margin-bottom: 0.5rem;
    }

    textarea:focus {
        outline: none;
        border-color: #339af0;
        box-shadow: 0 0 0 2px rgba(51, 154, 240, 0.2);
    }

    .input-actions {
        display: flex;
        gap: 0.5rem;
    }

    .emoji-btn {
        padding: 0.5rem 1rem;
        border: 1px solid #dee2e6;
        border-radius: 0.25rem;
        background: white;
        color: #495057;
        cursor: pointer;
        transition: all 0.2s;
    }

    .emoji-btn:hover {
        background: #f8f9fa;
        border-color: #adb5bd;
    }

    .emoji-btn.active {
        background: #e7f5ff;
        border-color: #339af0;
        color: #1971c2;
    }

    .share-btn {
        padding: 0.5rem 1.5rem;
        border: none;
        border-radius: 0.25rem;
        background: #339af0;
        color: white;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
    }

    .share-btn:hover {
        background: #228be6;
    }

    .share-btn:disabled {
        background: #adb5bd;
        cursor: not-allowed;
    }

    .emoji-picker {
        background: #f8f9fa;
        border-radius: 0.25rem;
        padding: 1rem;
        margin-top: 0.5rem;
    }

    .emoji-category {
        margin-bottom: 1rem;
    }

    .emoji-category:last-child {
        margin-bottom: 0;
    }

    .emoji-category h5 {
        margin: 0 0 0.5rem 0;
        color: #495057;
        font-size: 0.9rem;
    }

    .emoji-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
        gap: 0.25rem;
    }

    .emoji {
        width: 36px;
        height: 36px;
        border: none;
        background: white;
        border-radius: 0.25rem;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 1.2rem;
    }

    .emoji:hover {
        background: #e7f5ff;
        transform: scale(1.1);
    }

    .recent-shares {
        margin-top: 1.5rem;
    }

    .share-card {
        background: white;
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 0.75rem;
    }

    .share-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
    }

    .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
    }

    .share-info {
        display: flex;
        flex-direction: column;
    }

    .username {
        font-weight: 500;
        color: #212529;
    }

    .time {
        font-size: 0.8rem;
        color: #868e96;
    }

    .message {
        margin: 0 0 0.75rem 0;
        color: #495057;
        line-height: 1.5;
    }

    .share-actions {
        display: flex;
        gap: 1rem;
    }

    .like-btn, .reply-btn {
        padding: 0.25rem 0.75rem;
        border: 1px solid #dee2e6;
        border-radius: 1rem;
        background: white;
        color: #495057;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .like-btn:hover, .reply-btn:hover {
        background: #f8f9fa;
        border-color: #adb5bd;
    }

    .like-btn.liked {
        background: #fff0f6;
        border-color: #f06595;
        color: #d6336c;
    }

    @media (max-width: 768px) {
        .template-buttons {
            grid-template-columns: 1fr;
        }

        .input-actions {
            flex-direction: column;
        }

        .emoji-grid {
            grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
        }

        .emoji {
            width: 32px;
            height: 32px;
            font-size: 1rem;
        }
    }
</style>
