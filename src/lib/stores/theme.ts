import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const THEME_KEY = 'theme';

function createThemeStore() {
    // Get initial theme from localStorage or system preference
    const getInitialTheme = () => {
        if (!browser) return 'light';
        
        const stored = localStorage.getItem(THEME_KEY);
        if (stored) return stored;
        
        // Check system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        
        return 'light';
    };

    const { subscribe, set, update } = writable<'light' | 'dark'>(getInitialTheme());

    return {
        subscribe,
        toggle: () => {
            update(theme => {
                const newTheme = theme === 'light' ? 'dark' : 'light';
                if (browser) {
                    localStorage.setItem(THEME_KEY, newTheme);
                    document.documentElement.classList.toggle('dark', newTheme === 'dark');
                }
                return newTheme;
            });
        },
        set: (theme: 'light' | 'dark') => {
            set(theme);
            if (browser) {
                localStorage.setItem(THEME_KEY, theme);
                document.documentElement.classList.toggle('dark', theme === 'dark');
            }
        }
    };
}

export const themeStore = createThemeStore();
