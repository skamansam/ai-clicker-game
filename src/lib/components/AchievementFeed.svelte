<!-- src/lib/components/AchievementFeed.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { db, auth } from '$lib/firebase';
    import { collection, query, where, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
    import type { Achievement } from '$lib/types';
    import { formatDistanceToNow } from 'date-fns';
    import { fade, slide } from 'svelte/transition';

    export let maxItems = 10;
    export let showFriends = true;

    let feedItems: Array<{
        id: string;
        userId: string;
        username: string;
        achievementId: string;
        achievement: Achievement;
        timestamp: Date;
        type: 'unlock' | 'milestone' | 'collection' | 'prestige';
    }> = [];

    let unsubscribe: () => void;

    onMount(async () => {
        if (!browser) return;
        
        const user = auth.currentUser;
        if (!user) return;

        try {
            // Get user's friends list if showing friends feed
            let userIds = [user.uid];
            if (showFriends) {
                const friendsRef = collection(db, 'user_friends');
                const friendsQuery = query(friendsRef, where('userId', '==', user.uid));
                const friendsSnapshot = await getDocs(friendsQuery);
                const friendIds = friendsSnapshot.docs.map(doc => doc.data().friendId);
                userIds = [...userIds, ...friendIds];
            }

            // Set up real-time listener for feed items
            const feedRef = collection(db, 'achievement_activity');
            const feedQuery = query(
                feedRef,
                where('userId', 'in', userIds),
                orderBy('timestamp', 'desc'),
                limit(maxItems)
            );

            unsubscribe = onSnapshot(feedQuery, async (snapshot) => {
                const items = [];
                
                for (const doc of snapshot.docs) {
                    const data = doc.data();
                    
                    // Get user info
                    const userRef = collection(db, 'users');
                    const userQuery = query(userRef, where('userId', '==', data.userId));
                    const userSnapshot = await getDocs(userQuery);
                    const userData = userSnapshot.docs[0]?.data();

                    // Get achievement info if it's an achievement unlock
                    let achievement = null;
                    if (data.achievementId) {
                        const achievementRef = collection(db, 'achievements');
                        const achievementQuery = query(achievementRef, where('id', '==', data.achievementId));
                        const achievementSnapshot = await getDocs(achievementQuery);
                        achievement = achievementSnapshot.docs[0]?.data();
                    }

                    items.push({
                        id: doc.id,
                        userId: data.userId,
                        username: userData?.username || 'Unknown User',
                        achievementId: data.achievementId,
                        achievement,
                        timestamp: data.timestamp.toDate(),
                        type: data.type
                    });
                }

                feedItems = items;
            });
        } catch (error) {
            console.error('Error setting up achievement feed:', error);
        }
    });

    onDestroy(() => {
        if (unsubscribe) {
            unsubscribe();
        }
    });

    function getActivityMessage(item: typeof feedItems[0]): string {
        switch (item.type) {
            case 'unlock':
                return `unlocked ${item.achievement?.name || 'an achievement'}`;
            case 'milestone':
                return 'reached a new milestone';
            case 'collection':
                return 'completed a collection';
            case 'prestige':
                return 'reached a new prestige level';
            default:
                return 'did something amazing';
        }
    }
</script>

<div class="achievement-feed">
    <h2>Achievement Feed</h2>
    {#if feedItems.length === 0}
        <p class="empty-feed">No recent activity</p>
    {:else}
        <ul class="feed-list">
            {#each feedItems as item (item.id)}
                <li class="feed-item" transition:slide|local>
                    <div class="feed-content" transition:fade|local>
                        <div class="user-info">
                            <span class="username">{item.username}</span>
                            <span class="timestamp">{formatDistanceToNow(item.timestamp, { addSuffix: true })}</span>
                        </div>
                        <p class="activity">
                            {getActivityMessage(item)}
                        </p>
                        {#if item.achievement}
                            <div class="achievement-info">
                                <img src={item.achievement.icon} alt={item.achievement.name} class="achievement-icon" />
                                <div class="achievement-details">
                                    <span class="achievement-name">{item.achievement.name}</span>
                                    <span class="achievement-description">{item.achievement.description}</span>
                                </div>
                            </div>
                        {/if}
                    </div>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .achievement-feed {
        background: var(--background-secondary);
        border-radius: 1rem;
        padding: 1.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    h2 {
        margin: 0 0 1.5rem;
        color: var(--text-primary);
        font-size: 1.5rem;
        font-weight: 600;
    }

    .empty-feed {
        text-align: center;
        color: var(--text-secondary);
        font-style: italic;
    }

    .feed-list {
        list-style: none;
        padding: 0;
        margin: 0;
        max-height: 500px;
        overflow-y: auto;
    }

    .feed-item {
        margin-bottom: 1rem;
        padding: 1rem;
        background: var(--background-primary);
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .feed-content {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .user-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .username {
        font-weight: 600;
        color: var(--text-primary);
    }

    .timestamp {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .activity {
        margin: 0;
        color: var(--text-primary);
    }

    .achievement-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem;
        background: var(--background-tertiary);
        border-radius: 0.25rem;
    }

    .achievement-icon {
        width: 2rem;
        height: 2rem;
        border-radius: 0.25rem;
    }

    .achievement-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .achievement-name {
        font-weight: 500;
        color: var(--text-primary);
    }

    .achievement-description {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
</style>
