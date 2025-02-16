<!-- src/lib/components/AchievementSocialHub.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { formatDistance } from 'date-fns';
    import { browser } from '$app/environment';
    import { db, auth } from '$lib/firebase';
    import { collection, query, where, orderBy, limit, getDocs, addDoc, updateDoc, serverTimestamp, doc, increment } from 'firebase/firestore';
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
        guildId: string;
        title: string;
        description: string;
        type: 'challenge' | 'competition' | 'raid';
        startTime: Date;
        endTime: Date;
        requirements: any;
        rewards: any;
        participants: number;
    }

    interface Guild {
        id: string;
        name: string;
        description: string;
        icon: string;
        bannerUrl: string;
        level: number;
        members: number;
        achievements: number;
        weeklyPoints: number;
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
        if (!browser) return;
        
        const user = auth.currentUser;
        if (!user) return;

        loading = true;
        try {
            // Load social feed
            const feedRef = collection(db, 'social_feed');
            const feedQuery = query(
                feedRef,
                orderBy('createdAt', 'desc'),
                limit(50)
            );
            const feedSnapshot = await getDocs(feedQuery);
            socialFeed = feedSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Load friends
            const friendsRef = collection(db, 'friends');
            const friendsQuery = query(
                friendsRef,
                where('userId', '==', user.uid),
                orderBy('lastActive', 'desc')
            );
            const friendsSnapshot = await getDocs(friendsQuery);
            friends = friendsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Load guilds
            const guildsRef = collection(db, 'guilds');
            const guildsQuery = query(
                guildsRef,
                orderBy('weeklyPoints', 'desc')
            );
            const guildsSnapshot = await getDocs(guildsQuery);
            guilds = guildsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Load guild events
            const now = new Date();
            const eventsRef = collection(db, 'guild_events');
            const eventsQuery = query(
                eventsRef,
                where('endTime', '>=', now)
            );
            const eventsSnapshot = await getDocs(eventsQuery);
            guildEvents = eventsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
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
        if (!browser) return;
        
        const user = auth.currentUser;
        if (!user) return;

        try {
            // Check guild requirements
            const guildRef = doc(db, 'guilds', guildId);
            const guildDoc = await getDocs(guildRef);
            const guild = guildDoc.data() as Guild;

            // Get user stats
            const userStatsRef = doc(db, 'user_stats', user.uid);
            const userStatsDoc = await getDocs(userStatsRef);
            const userStats = userStatsDoc.data();

            // Check requirements
            if (
                (guild.requirements.level && userStats.level < guild.requirements.level) ||
                (guild.requirements.achievements && userStats.achievements < guild.requirements.achievements) ||
                (guild.requirements.activity && userStats.activity < guild.requirements.activity)
            ) {
                throw new Error('You do not meet the requirements to join this guild');
            }

            // Add user to guild
            const guildMemberRef = collection(db, 'guild_members');
            await addDoc(guildMemberRef, {
                userId: user.uid,
                guildId,
                joinedAt: serverTimestamp(),
                role: 'member'
            });

            // Update guild member count
            await updateDoc(guildRef, {
                members: increment(1)
            });

            // Refresh guilds
            const guildsRef = collection(db, 'guilds');
            const guildsQuery = query(guildsRef, orderBy('weeklyPoints', 'desc'));
            const guildsSnapshot = await getDocs(guildsQuery);
            guilds = guildsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error joining guild:', error);
            throw error;
        }
    }

    async function joinEvent(eventId: string) {
        if (!browser) return;
        
        const user = auth.currentUser;
        if (!user) return;

        try {
            const eventRef = doc(db, 'guild_events', eventId);
            const participantRef = collection(db, 'event_participants');

            await addDoc(participantRef, {
                userId: user.uid,
                eventId,
                joinedAt: serverTimestamp()
            });

            await updateDoc(eventRef, {
                participants: increment(1)
            });

            // Refresh events
            const now = new Date();
            const eventsRef = collection(db, 'guild_events');
            const eventsQuery = query(eventsRef, where('endTime', '>=', now));
            const eventsSnapshot = await getDocs(eventsQuery);
            guildEvents = eventsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error joining event:', error);
            throw error;
        }
    }

    async function sendFriendInvite(userId: string) {
        if (!browser) return;
        
        const user = auth.currentUser;
        if (!user) return;

        try {
            const friendInviteRef = collection(db, 'friend_invites');
            await addDoc(friendInviteRef, {
                senderId: user.uid,
                receiverId: userId,
                message: inviteMessage,
                status: 'pending',
                createdAt: serverTimestamp()
            });

            showInvite = false;
            inviteMessage = '';
        } catch (error) {
            console.error('Error sending friend invite:', error);
            throw error;
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
                                src={post.user.avatarUrl}
                                alt={post.user.username}
                                class="avatar"
                            />
                            <div class="post-info">
                                <span class="username">{post.user.username}</span>
                                <span class="time">{formatTime(post.createdAt)}</span>
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
                                class:liked={post.likedByUser}
                                on:click={() => achievementSocialStore.toggleLike(post.id)}
                            >
                                {post.likedByUser ? '❤️' : '🤍'} {post.likes}
                            </button>
                            <button
                                class="comment-btn"
                                on:click={() => post.showComments = !post.showComments}
                            >
                                💬 {post.comments}
                            </button>
                            <button class="share-btn">
                                🔗 Share
                            </button>
                        </div>

                        {#if post.showComments}
                            <div class="comments" transition:slide>
                                {#each post.commentList as comment}
                                    <div class="comment">
                                        <img
                                            src={comment.user.avatarUrl}
                                            alt={comment.user.username}
                                            class="avatar"
                                        />
                                        <div class="comment-content">
                                            <span class="username">{comment.user.username}</span>
                                            <p>{comment.content}</p>
                                            <span class="time">{formatTime(comment.createdAt)}</span>
                                        </div>
                                    </div>
                                {/each}
                                <div class="comment-input">
                                    <input
                                        type="text"
                                        placeholder="Write a comment..."
                                        bind:value={post.newComment}
                                    />
                                    <button
                                        on:click={() => {
                                            if (post.newComment) {
                                                achievementSocialStore.addComment(post.id, post.newComment);
                                                post.newComment = '';
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
                            src={friend.avatarUrl}
                            alt={friend.username}
                            class="avatar"
                        />
                        <div class="friend-info">
                            <span class="username">{friend.username}</span>
                            <span class="status" class:online={friend.online}>
                                {friend.online ? 'Online' : `Last seen ${formatTime(friend.lastActive)}`}
                            </span>
                        </div>
                        <div class="friend-stats">
                            <span>🏆 {friend.totalAchievements}</span>
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
                        style="background-image: url({guild.bannerUrl})"
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
                                <span>📈 {guild.weeklyPoints} Points</span>
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
                            <span>⏳ {formatTime(event.endTime)}</span>
                            <span>👥 {event.participants} Participants</span>
                        </div>
                        <div class="event-actions">
                            <button
                                class="join-btn"
                                on:click={() => joinEvent(event.id)}
                            >
                                Join Event
                            </button>
                            {#if event.type === 'challenge'}
                                <button
                                    class="details-btn"
                                    on:click={() => {
                                        selectedEvent = event;
                                        challengeStore.loadEventChallenges(event.id);
                                    }}
                                >
                                    View Challenges
                                </button>
                            {:else if event.type === 'competition'}
                                <button
                                    class="details-btn"
                                    on:click={() => {
                                        selectedEvent = event;
                                        achievementStatsStore.loadLeaderboard(event.id);
                                    }}
                                >
                                    View Leaderboard
                                </button>
                            {/if}
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
