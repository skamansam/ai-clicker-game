import { writable } from 'svelte/store';
import type { User } from 'firebase/auth';
import { browser } from '$app/environment';
import { auth } from '$lib/firebase';
import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';

interface AuthStore {
    user: User | null;
    loading: boolean;
    error: string | null;
}

function createAuthStore() {
    const { subscribe, set, update } = writable<AuthStore>({
        user: null,
        loading: true,
        error: null
    });

    if (browser) {
        // Listen for auth state changes
        onAuthStateChanged(auth, (user) => {
            set({
                user,
                loading: false,
                error: null
            });
        });
    }

    return {
        subscribe,
        signIn: async (email: string, password: string) => {
            if (!browser) return;
            
            try {
                update(state => ({ ...state, loading: true, error: null }));
                await signInWithEmailAndPassword(auth, email, password);
            } catch (error) {
                update(state => ({ ...state, error: error.message }));
                throw error;
            } finally {
                update(state => ({ ...state, loading: false }));
            }
        },
        signUp: async (email: string, password: string) => {
            if (!browser) return;
            
            try {
                update(state => ({ ...state, loading: true, error: null }));
                await createUserWithEmailAndPassword(auth, email, password);
            } catch (error) {
                update(state => ({ ...state, error: error.message }));
                throw error;
            } finally {
                update(state => ({ ...state, loading: false }));
            }
        },
        signOut: async () => {
            if (!browser) return;
            
            try {
                update(state => ({ ...state, loading: true, error: null }));
                await firebaseSignOut(auth);
            } catch (error) {
                update(state => ({ ...state, error: error.message }));
                throw error;
            } finally {
                update(state => ({ ...state, loading: false }));
            }
        }
    };
}

export const authStore = createAuthStore();
