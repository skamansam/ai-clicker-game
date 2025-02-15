import { writable } from 'svelte/store';
import type { Achievement, AchievementCollection } from '$lib/types';
import { db, auth } from '$lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';

interface AchievementSet {
    id: string;
    name: string;
    description: string;
    achievements: string[];
    rewards: {
        type: 'multiplier' | 'points' | 'badge' | 'title' | 'theme' | 'effect';
        value: number | string;
    }[];
    theme?: {
        color: string;
        icon: string;
        background_url?: string;
    };
    difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'master';
    completion_bonus: number;
    perfect_bonus: number;
    time_bonus?: {
        time: number; // in milliseconds
        bonus: number;
    };
}

interface Collection {
    id: string;
    name: string;
    description: string;
    sets: string[];
    theme: {
        color: string;
        icon: string;
        background_url?: string;
    };
    rewards: {
        type: 'multiplier' | 'points' | 'badge' | 'title' | 'theme' | 'effect';
        value: number | string;
    }[];
    completion_bonus: number;
    perfect_bonus: number;
    limited_time?: boolean;
    end_time?: string;
}

interface CollectionProgress {
    collection_id: string;
    sets_completed: number;
    total_sets: number;
    achievements_completed: number;
    total_achievements: number;
    perfect_sets: number;
    rewards_claimed: boolean;
    completion_time?: string;
}

interface SetProgress {
    set_id: string;
    achievements_completed: number;
    total_achievements: number;
    perfect: boolean;
    rewards_claimed: boolean;
    completion_time?: string;
    time_bonus_earned?: number;
}

interface CollectionStore {
    collections: AchievementCollection[];
    sets: AchievementSet[];
    collectionProgress: CollectionProgress[];
    setProgress: SetProgress[];
    userCollections: {
        [collectionId: string]: {
            progress: number;
            completed: boolean;
            completedAt: Date | null;
        };
    };
    activeCollection?: string;
    loading: boolean;
    error: string | null;
}

function createCollectionStore() {
    const { subscribe, set, update } = writable<CollectionStore>({
        collections: [],
        sets: [],
        collectionProgress: [],
        setProgress: [],
        userCollections: {},
        loading: false,
        error: null
    });

    return {
        subscribe,
        set,
        update,

        async loadCollections() {
            const user = auth.currentUser;
            if (!user) return;

            try {
                update(store => ({ ...store, loading: true, error: null }));

                // Load all collections
                const collectionsRef = collection(db, 'achievement_collections');
                const collectionsQuery = query(collectionsRef, orderBy('order'));
                const collectionsSnapshot = await getDocs(collectionsQuery);
                const collections = collectionsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as AchievementCollection[];

                // Load sets
                const setsRef = collection(db, 'achievement_sets');
                const setsQuery = query(setsRef);
                const setsSnapshot = await getDocs(setsQuery);
                const sets = setsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as AchievementSet[];

                // Load user's collection progress
                const userCollectionsRef = collection(db, 'user_collections');
                const userCollectionsQuery = query(userCollectionsRef, where('userId', '==', user.uid));
                const userCollectionsSnapshot = await getDocs(userCollectionsQuery);
                const userCollections = userCollectionsSnapshot.docs.reduce((acc, doc) => {
                    const data = doc.data();
                    acc[data.collectionId] = {
                        progress: data.progress,
                        completed: data.completed,
                        completedAt: data.completedAt?.toDate() || null
                    };
                    return acc;
                }, {});

                // Load progress
                const collectionProgressRef = collection(db, 'collection_progress');
                const collectionProgressQuery = query(collectionProgressRef);
                const collectionProgressSnapshot = await getDocs(collectionProgressQuery);
                const collectionProgress = collectionProgressSnapshot.docs.map(doc => ({
                    collection_id: doc.id,
                    ...doc.data()
                })) as CollectionProgress[];

                const setProgressRef = collection(db, 'set_progress');
                const setProgressQuery = query(setProgressRef);
                const setProgressSnapshot = await getDocs(setProgressQuery);
                const setProgress = setProgressSnapshot.docs.map(doc => ({
                    set_id: doc.id,
                    ...doc.data()
                })) as SetProgress[];

                update(state => ({
                    ...state,
                    collections,
                    sets,
                    collectionProgress,
                    setProgress,
                    userCollections,
                    loading: false
                }));
            } catch (error) {
                console.error('Error loading collections:', error);
                update(state => ({
                    ...state,
                    loading: false,
                    error: error.message
                }));
            }
        },

        async setActiveCollection(collectionId: string) {
            update(store => ({
                ...store,
                activeCollection: collectionId
            }));
        },

        async checkSetCompletion(setId: string) {
            const set = this.sets.find(s => s.id === setId);
            if (!set) return;

            const unlockedAchievements = achievementStore.getUnlockedAchievements();
            const completedAchievements = set.achievements.filter(id =>
                unlockedAchievements.some(ua => ua.id === id)
            );

            const perfect = completedAchievements.length === set.achievements.length;
            const progress = this.setProgress.find(sp => sp.set_id === setId);

            if (perfect && (!progress || !progress.rewards_claimed)) {
                await this.claimSetRewards(setId);
            }

            // Check if this completes any collections
            const collections = this.collections.filter(c =>
                c.sets.includes(setId)
            );

            for (const collection of collections) {
                await this.checkCollectionCompletion(collection.id);
            }
        },

        async checkCollectionCompletion(collectionId: string) {
            const collection = this.collections.find(c => c.id === collectionId);
            if (!collection) return;

            const progress = this.collectionProgress.find(cp =>
                cp.collection_id === collectionId
            );

            const setProgresses = this.setProgress.filter(sp =>
                collection.sets.includes(sp.set_id)
            );

            const perfect = setProgresses.every(sp => sp.perfect);
            const complete = setProgresses.every(sp =>
                sp.achievements_completed === sp.total_achievements
            );

            if (complete && (!progress || !progress.rewards_claimed)) {
                await this.claimCollectionRewards(collectionId, perfect);
            }
        },

        async claimSetRewards(setId: string) {
            try {
                const { error } = await db.runTransaction(async transaction => {
                    const setRef = doc(db, 'achievement_sets', setId);
                    const setDoc = await transaction.get(setRef);
                    if (!setDoc.exists()) throw new Error('Set not found');

                    const rewards = setDoc.data().rewards;
                    for (const reward of rewards) {
                        if (reward.type === 'points') {
                            await transaction.update(doc(db, 'users', auth.currentUser.uid), {
                                points: increment(reward.value)
                            });
                        } else if (reward.type === 'badge') {
                            await transaction.set(doc(db, 'user_badges', auth.currentUser.uid, reward.value), {
                                timestamp: serverTimestamp()
                            });
                        }
                    }
                });

                if (error) throw error;

                // Record the achievement
                achievementStatsStore.recordActivity(
                    'challenge',
                    undefined,
                    `Completed achievement set!`
                );

                await this.loadCollections();
            } catch (error) {
                console.error('Error claiming set rewards:', error);
            }
        },

        async claimCollectionRewards(collectionId: string, perfect: boolean) {
            try {
                const { error } = await db.runTransaction(async transaction => {
                    const collectionRef = doc(db, 'achievement_collections', collectionId);
                    const collectionDoc = await transaction.get(collectionRef);
                    if (!collectionDoc.exists()) throw new Error('Collection not found');

                    const rewards = collectionDoc.data().rewards;
                    for (const reward of rewards) {
                        if (reward.type === 'points') {
                            await transaction.update(doc(db, 'users', auth.currentUser.uid), {
                                points: increment(reward.value)
                            });
                        } else if (reward.type === 'badge') {
                            await transaction.set(doc(db, 'user_badges', auth.currentUser.uid, reward.value), {
                                timestamp: serverTimestamp()
                            });
                        }
                    }
                });

                if (error) throw error;

                // Record the achievement
                achievementStatsStore.recordActivity(
                    'challenge',
                    undefined,
                    `Completed achievement collection${perfect ? ' perfectly' : ''}!`
                );

                await this.loadCollections();
            } catch (error) {
                console.error('Error claiming collection rewards:', error);
            }
        },

        async updateProgress(collectionId: string, achievements: Achievement[]) {
            const user = auth.currentUser;
            if (!user) return;

            try {
                update(state => ({ ...state, loading: true, error: null }));

                // Get collection details
                const collectionsRef = collection(db, 'achievement_collections');
                const collectionSnapshot = await getDocs(query(collectionsRef, where('id', '==', collectionId)));
                const collectionData = collectionSnapshot.docs[0].data() as AchievementCollection;

                // Calculate progress
                const requiredAchievements = collectionData.achievements;
                const completedAchievements = achievements.filter(a => 
                    requiredAchievements.includes(a.id)
                );
                const progress = (completedAchievements.length / requiredAchievements.length) * 100;
                const completed = progress === 100;

                // Update user collection progress
                const userCollectionsRef = collection(db, 'user_collections');
                const userCollectionQuery = query(userCollectionsRef,
                    where('userId', '==', user.uid),
                    where('collectionId', '==', collectionId)
                );
                const userCollectionSnapshot = await getDocs(userCollectionQuery);

                if (userCollectionSnapshot.empty) {
                    await addDoc(userCollectionsRef, {
                        userId: user.uid,
                        collectionId,
                        progress,
                        completed,
                        completedAt: completed ? serverTimestamp() : null,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                } else {
                    const userCollection = userCollectionSnapshot.docs[0];
                    await updateDoc(userCollection.ref, {
                        progress,
                        completed,
                        completedAt: completed ? serverTimestamp() : null,
                        updatedAt: serverTimestamp()
                    });
                }

                // If completed, record achievement
                if (completed && !userCollectionSnapshot.docs[0]?.data()?.completed) {
                    const activityRef = collection(db, 'achievement_activity');
                    await addDoc(activityRef, {
                        userId: user.uid,
                        type: 'collection',
                        collectionId,
                        timestamp: serverTimestamp()
                    });
                }

                await collectionStore.loadCollections();
            } catch (error) {
                console.error('Error updating collection progress:', error);
                update(state => ({
                    ...state,
                    loading: false,
                    error: 'Failed to update collection progress'
                }));
            }
        },

        getCollection(collectionId: string) {
            return this.collections.find(c => c.id === collectionId);
        },

        getSet(setId: string) {
            return this.sets.find(s => s.id === setId);
        },

        getCollectionProgress(collectionId: string) {
            return this.collectionProgress.find(cp => cp.collection_id === collectionId);
        },

        getSetProgress(setId: string) {
            return this.setProgress.find(sp => sp.set_id === setId);
        },

        getCollectionSets(collectionId: string) {
            const collection = this.getCollection(collectionId);
            if (!collection) return [];
            return this.sets.filter(s => collection.sets.includes(s.id));
        },

        getSetAchievements(setId: string) {
            const set = this.getSet(setId);
            if (!set) return [];
            return achievementStore.achievements.filter(a => set.achievements.includes(a.id));
        },

        calculateSetCompletion(setId: string) {
            const progress = this.getSetProgress(setId);
            if (!progress) return 0;
            return (progress.achievements_completed / progress.total_achievements) * 100;
        },

        calculateCollectionCompletion(collectionId: string) {
            const progress = this.getCollectionProgress(collectionId);
            if (!progress) return 0;
            return (progress.achievements_completed / progress.total_achievements) * 100;
        },

        getTimeBonus(setId: string) {
            const progress = this.getSetProgress(setId);
            if (!progress || !progress.time_bonus_earned) return 0;
            return progress.time_bonus_earned;
        },

        getTotalRewards(collectionId: string) {
            const collection = this.getCollection(collectionId);
            if (!collection) return [];

            const sets = this.getCollectionSets(collectionId);
            const setRewards = sets.flatMap(s => s.rewards);
            
            return [...collection.rewards, ...setRewards].reduce((acc, reward) => {
                const existing = acc.find(r => r.type === reward.type);
                if (existing) {
                    if (typeof existing.value === 'number' && typeof reward.value === 'number') {
                        existing.value += reward.value;
                    }
                } else {
                    acc.push({ ...reward });
                }
                return acc;
            }, [] as typeof collection.rewards);
        },

        getProgress: (collectionId: string) => {
            const store = get(collectionStore);
            return store.userCollections[collectionId] || {
                progress: 0,
                completed: false,
                completedAt: null
            };
        },

        isCompleted: (collectionId: string) => {
            const store = get(collectionStore);
            return store.userCollections[collectionId]?.completed || false;
        }
    };
}

export const collectionStore = createCollectionStore();
