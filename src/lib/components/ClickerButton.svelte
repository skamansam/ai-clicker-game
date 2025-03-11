<!-- src/lib/components/ClickerButton.svelte -->
<script lang="ts">
    import { gameStore } from '$lib/stores/game';
    import { spring } from 'svelte/motion';
    import { onMount, onDestroy } from 'svelte';
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';
    
    const scale = spring(1, {
        stiffness: 0.2,
        damping: 0.4
    });

    let pulseActive = false;
    let pulseInterval: NodeJS.Timeout | null = null;
    const PULSE_DURATION = 2000; // Duration of one pulse animation in ms
    
    // Generator progress tracking
    let isGenerating = false;
    let progressValue = 0;
    const progress = tweened(0, {
        duration: $gameStore.processingDelay,
        easing: cubicOut
    });
    
    // Resource being generated
    let pendingResources = 0;
    
    function triggerPulse() {
        pulseActive = true;
        setTimeout(() => pulseActive = false, PULSE_DURATION);
    }

    function handleClick() {
        if (isGenerating) return; // Prevent clicking while already generating
        
        // Start the generation process
        isGenerating = true;
        
        // Get click power from the game store
        const clickPower = gameStore.getClickPower();
        pendingResources = clickPower;
        
        // Reset and start progress animation
        progress.set(0);
        progress.set(100, { duration: $gameStore.processingDelay });
        
        // Animate button
        scale.set(0.95);
        setTimeout(() => scale.set(1), 50);
        triggerPulse();
        
        // Schedule resource collection after delay
        setTimeout(() => {
            gameStore.collectMetal();
            isGenerating = false;
            pendingResources = 0;
            progress.set(0, { duration: 0 });
        }, $gameStore.processingDelay);
    }

    // Update progress value when the tweened store changes
    $: progressValue = $progress;
    
    onMount(() => {
        // Set up interval to check auto-click rate and animate accordingly
        pulseInterval = setInterval(() => {
            const autoClicksPerSecond = $gameStore.metalPerSecond - $gameStore.manualMetalPerSecond;
            
            if (autoClicksPerSecond > 0) {
                const timeBetweenClicks = 1000 / autoClicksPerSecond;
                
                // If clicks are happening faster than animation duration, keep pulse always active
                if (timeBetweenClicks < PULSE_DURATION) {
                    pulseActive = true;
                } else {
                    // Otherwise, trigger individual pulses at the auto-click rate
                    triggerPulse();
                }
            } else {
                pulseActive = false;
            }
        }, 100); // Check every 100ms for smooth transitions
    });

    onDestroy(() => {
        if (pulseInterval) {
            clearInterval(pulseInterval);
        }
    });
</script>

<button
    class="clicker-button"
    class:pulse-active={pulseActive}
    class:generating={isGenerating}
    on:click={handleClick}
    style="transform: scale({$scale})"
>
    <div class="pulse-ring"></div>
    
    {#if isGenerating}
        <div class="progress-container">
            <div class="progress-bar" style="width: {progressValue}%"></div>
        </div>
        <div class="pending-resources">+{pendingResources} generating...</div>
    {:else}
        <div class="button-text">Extract Metal</div>
    {/if}
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
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
    
    .generating {
        background: linear-gradient(145deg, #3730a3, #4f46e5);
        border-color: #6366f1;
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

    .pulse-ring {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        pointer-events: none;
    }

    .pulse-active .pulse-ring::before {
        content: '';
        position: absolute;
        top: -10%;
        left: -10%;
        width: 120%;
        height: 120%;
        background: radial-gradient(
            circle,
            transparent 20%,
            rgba(147, 197, 253, 0.8) 20%,
            rgba(147, 197, 253, 0.4) 30%,
            rgba(147, 197, 253, 0.2) 40%,
            transparent 50%
        );
        animation: pulse-inward 2s ease-out infinite;
    }

    @keyframes rotate {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    @keyframes pulse-inward {
        0% {
            transform: scale(1);
            opacity: 1;
        }
        100% {
            transform: scale(0);
            opacity: 0;
        }
    }
    
    .progress-container {
        position: absolute;
        bottom: 40px;
        left: 20%;
        width: 60%;
        height: 8px;
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        overflow: hidden;
    }
    
    .progress-bar {
        height: 100%;
        background-color: rgba(255, 255, 255, 0.8);
        border-radius: 4px;
        transition: width 0.1s linear;
    }
    
    .pending-resources {
        font-size: 16px;
        margin-top: 10px;
        color: rgba(255, 255, 255, 0.9);
    }
    
    .button-text {
        margin: 0;
    }
</style>
