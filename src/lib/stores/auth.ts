import { writable } from 'svelte/store';
import type { User } from '@supabase/supabase-js';
import { auth } from '$lib/supabase';

function createAuthStore() {
    const { subscribe, set } = writable<User | null>(null);

    return {
        subscribe,
        signUp: async (email: string, password: string) => {
            const { data, error } = await auth.signUp({
                email,
                password,
            });
            if (error) throw error;
            return data;
        },
        signIn: async (email: string, password: string) => {
            const { data, error } = await auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            set(data.user);
            return data;
        },
        signOut: async () => {
            const { error } = await auth.signOut();
            if (error) throw error;
            set(null);
        },
        // Initialize the store with the current session
        init: async () => {
            const { data: { user } } = await auth.getUser();
            set(user);
            
            // Listen for auth changes
            auth.onAuthStateChange((_event, session) => {
                set(session?.user ?? null);
            });
        }
    };
}

export const authStore = createAuthStore();
