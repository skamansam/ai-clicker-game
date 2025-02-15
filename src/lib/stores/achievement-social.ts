import { writable } from 'svelte/store';
import type { Achievement } from '$lib/types';
import { db, auth } from '$lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';

interface AchievementShare {
    id: string;
    userId: string;
    achievementId: string;
    message: string;
    likes: number;
    timestamp: any;
    profiles: {
        username: string;
        avatarUrl: string;
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
                const sharesRef = collection(db, 'achievement_shares');
                const sharesQuery = query(sharesRef, orderBy('timestamp', 'desc'), limit(50));
                const sharesSnapshot = await getDocs(sharesQuery);
                const shares = sharesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as AchievementShare[];

                // Load user's likes
                const likesRef = collection(db, 'achievement_share_likes');
                const likesQuery = query(likesRef, where('userId', '==', auth.currentUser?.uid));
                const likesSnapshot = await getDocs(likesQuery);
                const likes = likesSnapshot.docs.map(doc => doc.data().shareId);

                update(store => ({
                    ...store,
                    shares,
                    userLikes: new Set(likes),
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
                const sharesRef = collection(db, 'achievement_shares');
                const share = await addDoc(sharesRef, {
                    userId: auth.currentUser?.uid,
                    achievementId: achievement.id,
                    message,
                    timestamp: serverTimestamp()
                });

                update(store => ({
                    ...store,
                    shares: [{ id: share.id, ...share.data() }, ...store.shares]
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
                    const likesRef = collection(db, 'achievement_share_likes');
                    const likeQuery = query(likesRef, where('shareId', '==', shareId), where('userId', '==', auth.currentUser?.uid));
                    const likeSnapshot = await getDocs(likeQuery);

                    if (!likeSnapshot.empty) {
                        await updateDoc(likeSnapshot.docs[0].ref, {
                            userId: auth.currentUser?.uid,
                            shareId: shareId,
                            timestamp: serverTimestamp()
                        });
                    } else {
                        await addDoc(likesRef, {
                            userId: auth.currentUser?.uid,
                            shareId: shareId,
                            timestamp: serverTimestamp()
                        });
                    }
                } else {
                    const likesRef = collection(db, 'achievement_share_likes');
                    const likeQuery = query(likesRef, where('shareId', '==', shareId), where('userId', '==', auth.currentUser?.uid));
                    const likeSnapshot = await getDocs(likeQuery);

                    if (!likeSnapshot.empty) {
                        await updateDoc(likeSnapshot.docs[0].ref, {
                            userId: auth.currentUser?.uid,
                            shareId: shareId,
                            timestamp: serverTimestamp()
                        });
                    } else {
                        await addDoc(likesRef, {
                            userId: auth.currentUser?.uid,
                            shareId: shareId,
                            timestamp: serverTimestamp()
                        });
                    }
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
                const sharesRef = collection(db, 'achievement_shares');
                await updateDoc(sharesRef.doc(shareId), {
                    deleted: true,
                    timestamp: serverTimestamp()
                });

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
        formatRelativeTime(date: any) {
            const diff = Date.now() - date.toDate().getTime();
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
