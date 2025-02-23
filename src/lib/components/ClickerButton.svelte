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
    Stabilize Core
</button>

<style>
    .clicker-button {
        width: 200px;
        height: 200px;
        border-radius: 50%;
        background: linear-gradient(145deg, #4f46e5, #3730a3);
        border: 8px solid #818cf8;
        color: white;
        font-size: 24px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 
            0 10px 20px rgba(0, 0, 0, 0.2),
            0 0 30px rgba(79, 70, 229, 0.4),
            inset 0 0 20px rgba(255, 255, 255, 0.2);
        transition: all 0.2s;
        user-select: none;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        position: relative;
        overflow: hidden;
    }

    .clicker-button:hover {
        box-shadow: 
            0 15px 30px rgba(0, 0, 0, 0.3),
            0 0 50px rgba(79, 70, 229, 0.6),
            inset 0 0 25px rgba(255, 255, 255, 0.3);
        border-color: #93c5fd;
    }

    .clicker-button:active {
        box-shadow: 
            0 5px 10px rgba(0, 0, 0, 0.2),
            0 0 40px rgba(79, 70, 229, 0.5),
            inset 0 0 15px rgba(255, 255, 255, 0.2);
    }

    .clicker-button::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        transform: rotate(0deg);
        animation: rotate 10s linear infinite;
        pointer-events: none;
    }

    @keyframes rotate {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
</style>
