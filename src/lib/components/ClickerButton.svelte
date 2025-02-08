<!-- src/lib/components/ClickerButton.svelte -->
<script lang="ts">
    import { gameStore } from '$lib/stores/game';
    import { spring } from 'svelte/motion';
    
    const scale = spring(1, {
        stiffness: 0.2,
        damping: 0.4
    });

    function handleClick() {
        gameStore.click();
        scale.set(0.95);
        setTimeout(() => scale.set(1), 50);
    }
</script>

<button
    class="clicker-button"
    on:click={handleClick}
    style="transform: scale({$scale})"
>
    Click Me!
</button>

<style>
    .clicker-button {
        width: 200px;
        height: 200px;
        border-radius: 50%;
        background: linear-gradient(145deg, #ff6b6b, #f03e3e);
        border: none;
        color: white;
        font-size: 24px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        transition: box-shadow 0.2s;
        user-select: none;
    }

    .clicker-button:hover {
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
    }

    .clicker-button:active {
        box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
    }
</style>
