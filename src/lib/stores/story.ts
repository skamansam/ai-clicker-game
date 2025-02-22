import { derived } from 'svelte/store';
import { gameStore } from './game';
import { storyChapters } from '$lib/data/story';

// Derive available chapters based on total clicks
export const storyStore = derived(gameStore, ($gameStore) => {
    return storyChapters
        .filter(chapter => chapter.unlocksAt <= $gameStore.totalClicks)
        .sort((a, b) => b.unlocksAt - a.unlocksAt);
});
