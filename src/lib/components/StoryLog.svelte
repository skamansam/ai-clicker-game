<!-- src/lib/components/StoryLog.svelte -->
<script lang="ts">
    import { storyStore } from '$lib/stores/story';
    import { fade, fly } from 'svelte/transition';
</script>

<div class="story-log">
    <h2>Mission Log</h2>
    <div class="chapters">
        {#each $storyStore as chapter (chapter.id)}
            <div class="chapter" in:fly={{y: 20, duration: 500}} out:fade>
                <h3>{chapter.title}</h3>
                <div class="content">
                    {chapter.content}
                </div>
            </div>
        {/each}
    </div>
</div>

<style>
    .story-log {
        background: var(--widget-bg-color);
        border: 1px solid var(--border-color);
        border-radius: 0.5rem;
        padding: 1.5rem;
        max-height: 500px;
        overflow-y: auto;
    }

    h2 {
        margin: 0 0 1rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-color);
    }

    .chapters {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .chapter {
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: 0.375rem;
        padding: 1rem;
    }

    .chapter h3 {
        margin: 0 0 0.75rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--primary-color);
    }

    .content {
        font-size: 0.875rem;
        line-height: 1.5;
        color: var(--text-color);
        white-space: pre-line;
    }
</style>
