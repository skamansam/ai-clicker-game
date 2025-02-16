import { browser } from '$app/environment';
import { auth } from '$lib/firebase';

/**
 * Helper function to check if code is running in browser environment and user is authenticated
 * @returns true if in browser and user is authenticated, false otherwise
 */
export function isBrowserAndAuth(): boolean {
    return browser && !!auth.currentUser;
}

/**
 * Helper function to check if code is running in browser environment
 * @returns true if in browser, false otherwise
 */
export function isBrowser(): boolean {
    return browser;
}

/**
 * Decorator function to wrap store methods with browser check
 * @param fn Function to wrap with browser check
 * @returns Wrapped function that only executes in browser environment
 */
export function withBrowserCheck<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: Parameters<T>): ReturnType<T> | undefined => {
        if (!browser) return undefined;
        return fn(...args);
    }) as T;
}

/**
 * Decorator function to wrap store methods with browser and auth check
 * @param fn Function to wrap with browser and auth check
 * @returns Wrapped function that only executes in browser environment with authenticated user
 */
export function withBrowserAndAuthCheck<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: Parameters<T>): ReturnType<T> | undefined => {
        if (!browser || !auth.currentUser) return undefined;
        return fn(...args);
    }) as T;
}
