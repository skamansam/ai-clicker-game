<!-- src/lib/components/AchievementSocialHub.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { formatDistance } from 'date-fns';
    import { achievementSocialStore } from '$lib/stores/achievement-social';
    import { achievementStatsStore } from '$lib/stores/achievement-stats';
    import { challengeStore } from '$lib/stores/achievement-challenges';
    import { rewardStore } from '$lib/stores/achievement-rewards';
    import AchievementShare from './AchievementShare.svelte';

    let activeTab: 'feed' | 'friends' | 'guilds' | 'events' = 'feed';
    let selectedGuild = null;
    let selectedEvent = null;
    let showInvite = false;
    let inviteMessage = '';

    interface GuildEvent {
        id: string;
        guild_id: string;
        title: string;
        description: string;
        type: 'challenge' | 'competition' | 'raid';
        start_time: string;
        end_time: string;
        requirements: any;
        rewards: any;
        participants: number;
    }

    interface Guild {
        id: string;
        name: string;
        description: string;
        icon: string;
        banner_url: string;
        level: number;
        members: number;
        achievements: number;
        weekly_points: number;
        events: GuildEvent[];
        requirements: {
            level?: number;
            achievements?: number;
            activity?: number;
        };
    }

    let socialFeed = [];
    let friends = [];
    let guilds: Guild[] = [];
    let guildEvents: GuildEvent[] = [];
    let loading = true;

    onMount(async () => {
        loading = true;
        try {
            const { data: feedData } = await supabase
                .from('social_feed')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            const { data: friendsData } = await supabase
                .from('friends')
                .select('*')
                .order('last_active', { ascending: false });

            const { data: guildsData } = await supabase
                .from('guilds')
                .select('*')
                .order('weekly_points', { ascending: false });

            const { data: eventsData } = await supabase
                .from('guild_events')
                .select('*')
                .gte('end_time', new Date().toISOString());

            socialFeed = feedData;
            friends = friendsData;
            guilds = guildsData;
            guildEvents = eventsData;
        } catch (error) {
            console.error('Error loading social data:', error);
        } finally {
            loading = false;
        }
    });

    function formatTime(timeString: string) {
        return formatDistance(new Date(timeString), new Date(), { addSuffix: true });
    }

    async function joinGuild(guildId: string) {
        try {
            const { error } = await supabase
                .rpc('join_guild', {
                    guild_id: guildId
                });

            if (error) throw error;

            // Refresh guilds
            const { data } = await supabase
                .from('guilds')
                .select('*')
                .order('weekly_points', { ascending: false });

            guilds = data;
        } catch (error) {
            console.error('Error joining guild:', error);
        }
    }

    async function createGuildEvent(guildId: string, event: Partial<GuildEvent>) {
        try {
            const { error } = await supabase
                .from('guild_events')
                .insert([{
                    guild_id: guildId,
                    ...event
                }]);

            if (error) throw error;

            // Refresh events
            const { data } = await supabase
                .from('guild_events')
                .select('*')
                .gte('end_time', new Date().toISOString());

            guildEvents = data;
        } catch (error) {
            console.error('Error creating event:', error);
        }
    }

    async function joinEvent(eventId: string) {
        try {
            const { error } = await supabase
                .rpc('join_guild_event', {
                    event_id: eventId
                });

            if (error) throw error;

            // Refresh events
            const { data } = await supabase
                .from('guild_events')
                .select('*')
                .gte('end_time', new Date().toISOString());

            guildEvents = data;
        } catch (error) {
            console.error('Error joining event:', error);
        }
    }

    async function sendFriendInvite(userId: string) {
        try {
            const { error } = await supabase
                .rpc('send_friend_invite', {
                    target_user_id: userId,
                    message: inviteMessage
                });

            if (error) throw error;

            showInvite = false;
            inviteMessage = '';
        } catch (error) {
            console.error('Error sending invite:', error);
        }
    }
</script>

<div class="social-hub">
    <div class="tabs">
        <button
            class:active={activeTab === 'feed'}
            on:click={() => activeTab = 'feed'}
        >
            📱 Social Feed
        </button>
        <button
            class:active={activeTab === 'friends'}
            on:click={() => activeTab = 'friends'}
        >
            👥 Friends
        </button>
        <button
            class:active={activeTab === 'guilds'}
            on:click={() => activeTab = 'guilds'}
        >
            ⚔️ Guilds
        </button>
        <button
            class:active={activeTab === 'events'}
            on:click={() => activeTab = 'events'}
        >
            🎪 Events
        </button>
    </div>

    <div class="content">
        {#if loading}
            <div class="loading">Loading...</div>
        {:else if activeTab === 'feed'}
            <div class="social-feed" transition:fade>
                <div class="share-box">
                    <AchievementShare />
                </div>

                {#each socialFeed as post}
                    <div class="post-card" transition:slide>
                        <div class="post-header">
                            <img
                                src={post.user.avatar_url}
                                alt={post.user.username}
                                class="avatar"
                            />
                            <div class="post-info">
                                <span class="username">{post.user.username}</span>
                                <span class="time">{formatTime(post.created_at)}</span>
                            </div>
                        </div>

                        {#if post.type === 'achievement'}
                            <div class="achievement-post">
                                <div class="achievement-icon">🏆</div>
                                <div class="achievement-info">
                                    <h4>{post.achievement.name}</h4>
                                    <p>{post.achievement.description}</p>
                                </div>
                            </div>
                        {:else if post.type === 'challenge'}
                            <div class="challenge-post">
                                <div class="challenge-icon">🎯</div>
                                <div class="challenge-info">
                                    <h4>{post.challenge.title}</h4>
                                    <p>{post.challenge.description}</p>
                                </div>
                            </div>
                        {:else if post.type === 'guild'}
                            <div class="guild-post">
                                <div class="guild-icon">⚔️</div>
                                <div class="guild-info">
                                    <h4>{post.guild.name}</h4>
                                    <p>{post.message}</p>
                                </div>
                            </div>
                        {/if}

                        <div class="post-actions">
                            <button
                                class="like-btn"
                                class:liked={post.liked_by_user}
                                on:click={() => achievementSocialStore.toggleLike(post.id)}
                            >
                                {post.liked_by_user ? '❤️' : '🤍'} {post.likes}
                            </button>
                            <button
                                class="comment-btn"
                                on:click={() => post.show_comments = !post.show_comments}
                            >
                                💬 {post.comments}
                            </button>
                            <button class="share-btn">
                                🔗 Share
                            </button>
                        </div>

                        {#if post.show_comments}
                            <div class="comments" transition:slide>
                                {#each post.comment_list as comment}
                                    <div class="comment">
                                        <img
                                            src={comment.user.avatar_url}
                                            alt={comment.user.username}
                                            class="avatar"
                                        />
                                        <div class="comment-content">
                                            <span class="username">{comment.user.username}</span>
                                            <p>{comment.content}</p>
                                            <span class="time">{formatTime(comment.created_at)}</span>
                                        </div>
                                    </div>
                                {/each}
                                <div class="comment-input">
                                    <input
                                        type="text"
                                        placeholder="Write a comment..."
                                        bind:value={post.new_comment}
                                    />
                                    <button
                                        on:click={() => {
                                            if (post.new_comment) {
                                                achievementSocialStore.addComment(post.id, post.new_comment);
                                                post.new_comment = '';
                                            }
                                        }}
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {:else if activeTab === 'friends'}
            <div class="friends-list" transition:fade>
                {#each friends as friend}
                    <div class="friend-card">
                        <img
                            src={friend.avatar_url}
                            alt={friend.username}
                            class="avatar"
                        />
                        <div class="friend-info">
                            <span class="username">{friend.username}</span>
                            <span class="status" class:online={friend.online}>
                                {friend.online ? 'Online' : `Last seen ${formatTime(friend.last_active)}`}
                            </span>
                        </div>
                        <div class="friend-stats">
                            <span>🏆 {friend.total_achievements}</span>
                            <span>⭐ Level {friend.level}</span>
                        </div>
                        <div class="friend-actions">
                            <button class="challenge-btn">🎯 Challenge</button>
                            <button class="message-btn">💬 Message</button>
                        </div>
                    </div>
                {/each}
            </div>
        {:else if activeTab === 'guilds'}
            <div class="guilds-list" transition:fade>
                {#each guilds as guild}
                    <div
                        class="guild-card"
                        style="background-image: url({guild.banner_url})"
                    >
                        <div class="guild-content">
                            <div class="guild-header">
                                <img
                                    src={guild.icon}
                                    alt={guild.name}
                                    class="guild-icon"
                                />
                                <div class="guild-info">
                                    <h3>{guild.name}</h3>
                                    <span class="guild-level">Level {guild.level}</span>
                                </div>
                            </div>
                            <p>{guild.description}</p>
                            <div class="guild-stats">
                                <span>👥 {guild.members} Members</span>
                                <span>🏆 {guild.achievements} Achievements</span>
                                <span>📈 {guild.weekly_points} Points</span>
                            </div>
                            <div class="guild-actions">
                                <button
                                    class="join-btn"
                                    on:click={() => joinGuild(guild.id)}
                                >
                                    Join Guild
                                </button>
                                <button
                                    class="details-btn"
                                    on:click={() => selectedGuild = guild}
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {:else if activeTab === 'events'}
            <div class="events-list" transition:fade>
                {#each guildEvents as event}
                    <div class="event-card">
                        <div class="event-header">
                            <h3>{event.title}</h3>
                            <span class="event-type">
                                {#if event.type === 'challenge'}
                                    🎯 Challenge
                                {:else if event.type === 'competition'}
                                    🏆 Competition
                                {:else if event.type === 'raid'}
                                    ⚔️ Raid
                                {/if}
                            </span>
                        </div>
                        <p>{event.description}</p>
                        <div class="event-info">
                            <span>⏳ {formatTime(event.end_time)}</span>
                            <span>👥 {event.participants} Participants</span>
                        </div>
                        <div class="event-actions">
                            <button
                                class="join-btn"
                                on:click={() => joinEvent(event.id)}
                            >
                                Join Event
                            </button>
                            <button
                                class="details-btn"
                                on:click={() => selectedEvent = event}
                            >
                                View Details
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    .social-hub {
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

    .loading {
        text-align: center;
        padding: 2rem;
        color: #868e96;
    }

    .post-card,
    .friend-card,
    .guild-card,
    .event-card {
        background: white;
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 1rem;
    }

    .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
    }

    .post-header,
    .friend-card {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .username {
        font-weight: 500;
        color: #212529;
    }

    .time {
        font-size: 0.8rem;
        color: #868e96;
    }

    .post-actions,
    .friend-actions,
    .guild-actions,
    .event-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
    }

    button {
        padding: 0.5rem 1rem;
        border: 1px solid #dee2e6;
        border-radius: 0.25rem;
        background: white;
        color: #495057;
        cursor: pointer;
        transition: all 0.2s;
    }

    button:hover {
        background: #f8f9fa;
        border-color: #adb5bd;
    }

    button.primary {
        background: #339af0;
        color: white;
        border: none;
    }

    button.primary:hover {
        background: #228be6;
    }

    .comments {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #dee2e6;
    }

    .comment {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .comment-input {
        display: flex;
        gap: 0.5rem;
    }

    .comment-input input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #dee2e6;
        border-radius: 0.25rem;
    }

    .guild-card {
        background-size: cover;
        background-position: center;
        color: white;
    }

    .guild-content {
        background: rgba(0, 0, 0, 0.7);
        padding: 1rem;
        border-radius: 0.5rem;
    }

    .guild-icon {
        width: 64px;
        height: 64px;
        border-radius: 0.5rem;
    }

    .guild-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .event-type {
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        background: #e9ecef;
        font-size: 0.9rem;
    }

    @media (max-width: 768px) {
        .social-hub {
            padding: 0.5rem;
        }

        .tabs {
            flex-wrap: wrap;
        }

        .tabs button {
            flex: 1;
            padding: 0.5rem;
            font-size: 0.9rem;
        }

        .post-actions,
        .friend-actions,
        .guild-actions,
        .event-actions {
            flex-wrap: wrap;
        }

        button {
            flex: 1;
            font-size: 0.9rem;
        }
    }
</style>
