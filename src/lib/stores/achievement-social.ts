import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { Achievement } from '$lib/types';

export interface AchievementShare {
    id: string;
    user_id: string;
    achievement_id: string;
    message: string;
    likes: number;
    created_at: string;
    profiles: {
        username: string;
        avatar_url: string;
    };
    achievements: Achievement;
}

interface AchievementSocialStore {
    shares: AchievementShare[];
    userLikes: Set<string>;
    loading: boolean;
    error: string | null;
}

function createAchievementSocialStore() {
    const { subscribe, update } = writable<AchievementSocialStore>({
        shares: [],
        userLikes: new Set(),
        loading: false,
        error: null
    });

    return {
        subscribe,

        // Load recent achievement shares
        async loadRecentShares() {
            update(store => ({ ...store, loading: true }));

            try {
                const { data: shares, error: sharesError } = await supabase
                    .from('achievement_shares')
                    .select(`
                        *,
                        profiles:user_id (
                            username,
                            avatar_url
                        ),
                        achievements:achievement_id (*)
                    `)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (sharesError) throw sharesError;

                // Load user's likes
                const { data: likes, error: likesError } = await supabase
                    .from('achievement_share_likes')
                    .select('share_id');

                if (likesError) throw likesError;

                update(store => ({
                    ...store,
                    shares: shares || [],
                    userLikes: new Set((likes || []).map(l => l.share_id)),
                    loading: false,
                    error: null
                }));
            } catch (error) {
                update(store => ({
                    ...store,
                    loading: false,
                    error: error.message
                }));
            }
        },

        // Share an achievement
        async shareAchievement(achievement: Achievement, message: string) {
            try {
                const { data: share, error } = await supabase
                    .from('achievement_shares')
                    .insert({
                        achievement_id: achievement.id,
                        message
                    })
                    .select(`
                        *,
                        profiles:user_id (
                            username,
                            avatar_url
                        ),
                        achievements:achievement_id (*)
                    `)
                    .single();

                if (error) throw error;

                update(store => ({
                    ...store,
                    shares: [share, ...store.shares]
                }));

                return true;
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
                return false;
            }
        },

        // Like/unlike a share
        async toggleLike(shareId: string) {
            update(store => {
                const newLikes = new Set(store.userLikes);
                const share = store.shares.find(s => s.id === shareId);
                
                if (!share) return store;

                if (newLikes.has(shareId)) {
                    newLikes.delete(shareId);
                    share.likes--;
                } else {
                    newLikes.add(shareId);
                    share.likes++;
                }

                return {
                    ...store,
                    userLikes: newLikes,
                    shares: [...store.shares]
                };
            });

            try {
                if (this.userLikes.has(shareId)) {
                    await supabase
                        .from('achievement_share_likes')
                        .delete()
                        .eq('share_id', shareId);
                } else {
                    await supabase
                        .from('achievement_share_likes')
                        .insert({ share_id: shareId });
                }
            } catch (error) {
                // Revert on error
                update(store => {
                    const newLikes = new Set(store.userLikes);
                    const share = store.shares.find(s => s.id === shareId);
                    
                    if (!share) return store;

                    if (newLikes.has(shareId)) {
                        newLikes.delete(shareId);
                        share.likes--;
                    } else {
                        newLikes.add(shareId);
                        share.likes++;
                    }

                    return {
                        ...store,
                        userLikes: newLikes,
                        shares: [...store.shares],
                        error: error.message
                    };
                });
            }
        },

        // Delete a share
        async deleteShare(shareId: string) {
            try {
                const { error } = await supabase
                    .from('achievement_shares')
                    .delete()
                    .eq('id', shareId);

                if (error) throw error;

                update(store => ({
                    ...store,
                    shares: store.shares.filter(s => s.id !== shareId)
                }));

                return true;
            } catch (error) {
                update(store => ({ ...store, error: error.message }));
                return false;
            }
        },

        // Format relative time
        formatRelativeTime(date: string) {
            const diff = Date.now() - new Date(date).getTime();
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 0) return `${days}d ago`;
            if (hours > 0) return `${hours}h ago`;
            if (minutes > 0) return `${minutes}m ago`;
            return 'just now';
        }
    };
}

export const achievementSocialStore = createAchievementSocialStore();
