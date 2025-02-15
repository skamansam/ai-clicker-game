import { writable } from 'svelte/store';
import type { ShopItem, UserInventory } from '$lib/types';
import { db, auth } from '$lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, doc, getDoc, increment } from 'firebase/firestore';

interface ShopItem {
    id: string;
    name: string;
    description: string;
    type: 'multiplier' | 'points' | 'badge' | 'title' | 'theme' | 'effect';
    value: number | string;
    price: number;
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

interface UserInventory {
    currency: number;
    items: { [key: string]: number };
}

interface ShopStore {
    items: ShopItem[];
    inventory: UserInventory;
    loading: boolean;
    error: string | null;
}

function createShopStore() {
    const { subscribe, set, update } = writable<ShopStore>({
        items: [],
        inventory: {
            currency: 0,
            items: {}
        },
        loading: false,
        error: null
    });

    return {
        subscribe,

        // Load shop data
        loadShopData: async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                update(state => ({ ...state, loading: true, error: null }));

                // Load shop items
                const shopItemsRef = collection(db, 'shop_items');
                const shopItemsSnapshot = await getDocs(shopItemsRef);
                const items = shopItemsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as ShopItem[];

                // Load user inventory
                const userInventoryRef = doc(db, 'user_inventory', user.uid);
                const userInventorySnapshot = await getDoc(userInventoryRef);
                let inventory: UserInventory;

                if (userInventorySnapshot.exists()) {
                    inventory = {
                        id: userInventorySnapshot.id,
                        ...userInventorySnapshot.data()
                    } as UserInventory;
                } else {
                    // Initialize inventory if it doesn't exist
                    await setDoc(userInventoryRef, {
                        userId: user.uid,
                        currency: 0,
                        items: {},
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                    inventory = {
                        currency: 0,
                        items: {}
                    };
                }

                update(state => ({
                    ...state,
                    items,
                    inventory,
                    loading: false
                }));
            } catch (error) {
                console.error('Error loading shop data:', error);
                update(state => ({
                    ...state,
                    loading: false,
                    error: 'Failed to load shop data'
                }));
            }
        },

        // Purchase item
        purchaseItem: async (itemId: string, quantity: number = 1) => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                update(state => ({ ...state, loading: true, error: null }));

                // Get item details
                const itemRef = doc(db, 'shop_items', itemId);
                const itemSnapshot = await getDoc(itemRef);
                
                if (!itemSnapshot.exists()) {
                    throw new Error('Item not found');
                }

                const item = {
                    id: itemSnapshot.id,
                    ...itemSnapshot.data()
                } as ShopItem;

                // Check if user has enough currency
                const totalCost = item.price * quantity;
                const userInventoryRef = doc(db, 'user_inventory', user.uid);
                const userInventorySnapshot = await getDoc(userInventoryRef);

                if (!userInventorySnapshot.exists() || userInventorySnapshot.data().currency < totalCost) {
                    throw new Error('Insufficient funds');
                }

                // Update inventory
                await updateDoc(userInventoryRef, {
                    currency: increment(-totalCost),
                    [`items.${itemId}`]: increment(quantity),
                    updatedAt: serverTimestamp()
                });

                // Record transaction
                const transactionRef = collection(db, 'shop_transactions');
                await addDoc(transactionRef, {
                    userId: user.uid,
                    itemId,
                    quantity,
                    totalCost,
                    timestamp: serverTimestamp()
                });

                await shopStore.loadShopData();
            } catch (error) {
                console.error('Error purchasing item:', error);
                update(state => ({
                    ...state,
                    loading: false,
                    error: error.message || 'Failed to purchase item'
                }));
            }
        },

        // Add currency
        addCurrency: async (amount: number) => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                update(state => ({ ...state, loading: true, error: null }));

                const userInventoryRef = doc(db, 'user_inventory', user.uid);
                await updateDoc(userInventoryRef, {
                    currency: increment(amount),
                    updatedAt: serverTimestamp()
                });

                // Record currency addition
                const currencyLogRef = collection(db, 'currency_log');
                await addDoc(currencyLogRef, {
                    userId: user.uid,
                    amount,
                    type: 'add',
                    timestamp: serverTimestamp()
                });

                await shopStore.loadShopData();
            } catch (error) {
                console.error('Error adding currency:', error);
                update(state => ({
                    ...state,
                    loading: false,
                    error: 'Failed to add currency'
                }));
            }
        },

        // Use item
        useItem: async (itemId: string) => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                update(state => ({ ...state, loading: true, error: null }));

                const userInventoryRef = doc(db, 'user_inventory', user.uid);
                const userInventorySnapshot = await getDoc(userInventoryRef);

                if (!userInventorySnapshot.exists() || 
                    !userInventorySnapshot.data().items[itemId] ||
                    userInventorySnapshot.data().items[itemId] <= 0) {
                    throw new Error('Item not available in inventory');
                }

                // Update inventory
                await updateDoc(userInventoryRef, {
                    [`items.${itemId}`]: increment(-1),
                    updatedAt: serverTimestamp()
                });

                // Record item usage
                const itemUsageRef = collection(db, 'item_usage');
                await addDoc(itemUsageRef, {
                    userId: user.uid,
                    itemId,
                    timestamp: serverTimestamp()
                });

                await shopStore.loadShopData();
            } catch (error) {
                console.error('Error using item:', error);
                update(state => ({
                    ...state,
                    loading: false,
                    error: error.message || 'Failed to use item'
                }));
            }
        }
    };
}

export const shopStore = createShopStore();
