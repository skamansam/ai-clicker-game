import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { Achievement } from '$lib/types';
import { achievementStore } from './achievements';
import { achievementStatsStore } from './achievement-stats';

interface ShopItem {
    id: string;
    name: string;
    description: string;
    type: 'multiplier' | 'points' | 'badge' | 'title' | 'theme' | 'effect';
    value: number | string;
    cost: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    requirements: {
        achievements?: string[];
        level?: number;
        stats?: {
            type: string;
            value: number;
        }[];
    };
    preview_url?: string;
    limited_time?: boolean;
    end_time?: string;
    stock?: number;
}

interface PlayerInventory {
    points: number;
    multiplier: number;
    badges: string[];
    titles: string[];
    themes: string[];
    effects: string[];
    equipped: {
        badge?: string;
        title?: string;
        theme?: string;
        effect?: string;
    };
}

interface ShopStore {
    items: ShopItem[];
    featured: ShopItem[];
    inventory: PlayerInventory;
    purchaseHistory: {
        item_id: string;
        purchase_time: string;
        cost: number;
    }[];
    loading: boolean;
    error: string | null;
}

function createShopStore() {
    const { subscribe, set, update } = writable<ShopStore>({
        items: [],
        featured: [],
        inventory: {
            points: 0,
            multiplier: 1,
            badges: [],
            titles: [],
            themes: [],
            effects: [],
            equipped: {}
        },
        purchaseHistory: [],
        loading: false,
        error: null
    });

    return {
        subscribe,
        set,
        update,

        async loadShop() {
            update(store => ({ ...store, loading: true, error: null }));

            try {
                // Load shop items
                const { data: items, error: itemsError } = await supabase
                    .from('achievement_shop')
                    .select('*')
                    .or('limited_time.is.null,end_time.gt.now()');

                if (itemsError) throw itemsError;

                // Load featured items
                const { data: featured, error: featuredError } = await supabase
                    .from('achievement_shop')
                    .select('*')
                    .eq('featured', true)
                    .or('limited_time.is.null,end_time.gt.now()');

                if (featuredError) throw featuredError;

                // Load player inventory
                const { data: inventory, error: inventoryError } = await supabase
                    .from('player_inventory')
                    .select('*')
                    .single();

                if (inventoryError) throw inventoryError;

                // Load purchase history
                const { data: history, error: historyError } = await supabase
                    .from('purchase_history')
                    .select('*')
                    .order('purchase_time', { ascending: false });

                if (historyError) throw historyError;

                update(store => ({
                    ...store,
                    items,
                    featured,
                    inventory,
                    purchaseHistory: history,
                    loading: false
                }));
            } catch (error) {
                console.error('Error loading shop:', error);
                update(store => ({
                    ...store,
                    loading: false,
                    error: error.message
                }));
            }
        },

        async purchaseItem(itemId: string) {
            try {
                const { error } = await supabase
                    .rpc('purchase_shop_item', {
                        item_id: itemId
                    });

                if (error) throw error;

                await this.loadShop();
            } catch (error) {
                console.error('Error purchasing item:', error);
                throw error;
            }
        },

        async equipItem(type: 'badge' | 'title' | 'theme' | 'effect', itemId: string) {
            try {
                const { error } = await supabase
                    .from('player_inventory')
                    .update({
                        [`equipped_${type}`]: itemId
                    });

                if (error) throw error;

                update(store => ({
                    ...store,
                    inventory: {
                        ...store.inventory,
                        equipped: {
                            ...store.inventory.equipped,
                            [type]: itemId
                        }
                    }
                }));
            } catch (error) {
                console.error('Error equipping item:', error);
            }
        },

        async unequipItem(type: 'badge' | 'title' | 'theme' | 'effect') {
            try {
                const { error } = await supabase
                    .from('player_inventory')
                    .update({
                        [`equipped_${type}`]: null
                    });

                if (error) throw error;

                update(store => ({
                    ...store,
                    inventory: {
                        ...store.inventory,
                        equipped: {
                            ...store.inventory.equipped,
                            [type]: undefined
                        }
                    }
                }));
            } catch (error) {
                console.error('Error unequipping item:', error);
            }
        },

        async addPoints(points: number) {
            try {
                const { error } = await supabase
                    .rpc('add_achievement_points', {
                        points_to_add: points
                    });

                if (error) throw error;

                update(store => ({
                    ...store,
                    inventory: {
                        ...store.inventory,
                        points: store.inventory.points + points
                    }
                }));
            } catch (error) {
                console.error('Error adding points:', error);
            }
        },

        getItem(itemId: string) {
            return this.items.find(item => item.id === itemId);
        },

        canPurchase(item: ShopItem) {
            if (this.inventory.points < item.cost) return false;
            if (item.stock !== undefined && item.stock <= 0) return false;
            if (item.limited_time && new Date(item.end_time) < new Date()) return false;

            // Check requirements
            if (item.requirements) {
                if (item.requirements.level && achievementStore.getLevel() < item.requirements.level) {
                    return false;
                }

                if (item.requirements.achievements) {
                    const unlockedAchievements = achievementStore.getUnlockedAchievements();
                    if (!item.requirements.achievements.every(id => 
                        unlockedAchievements.some(ua => ua.id === id)
                    )) {
                        return false;
                    }
                }

                if (item.requirements.stats) {
                    const playerStats = achievementStatsStore.playerStats;
                    if (!item.requirements.stats.every(stat => {
                        // Check various stat requirements
                        switch (stat.type) {
                            case 'total_unlocked':
                                return playerStats.totalUnlocked >= stat.value;
                            case 'completion_rate':
                                return playerStats.completionRate >= stat.value;
                            case 'best_streak':
                                return playerStats.bestStreak >= stat.value;
                            default:
                                return true;
                        }
                    })) {
                        return false;
                    }
                }
            }

            return true;
        },

        hasItem(itemId: string) {
            const item = this.getItem(itemId);
            if (!item) return false;

            switch (item.type) {
                case 'badge':
                    return this.inventory.badges.includes(itemId);
                case 'title':
                    return this.inventory.titles.includes(itemId);
                case 'theme':
                    return this.inventory.themes.includes(itemId);
                case 'effect':
                    return this.inventory.effects.includes(itemId);
                default:
                    return false;
            }
        },

        isEquipped(itemId: string) {
            const item = this.getItem(itemId);
            if (!item) return false;
            return this.inventory.equipped[item.type] === itemId;
        }
    };
}

export const shopStore = createShopStore();
