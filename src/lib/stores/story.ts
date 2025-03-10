import { derived } from 'svelte/store';
import { gameStore } from './game';
import { storyChapters } from '$lib/data/story';

// Derive available chapters based on total metal collected
export const storyStore = derived(gameStore, ($gameStore) => {
    return storyChapters
        .filter(chapter => chapter.unlocksAt <= $gameStore.totalMetal)
        .sort((a, b) => b.unlocksAt - a.unlocksAt);
});
