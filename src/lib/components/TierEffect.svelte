<!-- src/lib/components/TierEffect.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import type { TierEffect } from '$lib/types';

    export let effect: TierEffect;
    export let active = true;

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let animationFrame: number;
    let particles: Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        size: number;
        color: string;
        alpha: number;
    }> = [];

    onMount(() => {
        if (!browser || !canvas) return;
        
        ctx = canvas.getContext('2d')!;
        
        // Set canvas size
        const resize = () => {
            if (!browser || !canvas) return;
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        
        resize();
        if (browser) {
            window.addEventListener('resize', resize);
        }

        if (effect.type === 'particles') {
            startParticleAnimation();
        }

        return () => {
            if (browser) {
                window.removeEventListener('resize', resize);
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                }
            }
        };
    });

    function startParticleAnimation() {
        const maxParticles = Math.floor(50 * effect.intensity);
        
        function createParticle() {
            const size = Math.random() * 3 + 1;
            return {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size,
                color: effect.rainbow ? getRandomColor() : effect.color,
                alpha: Math.random() * 0.5 + 0.5
            };
        }

        function animate() {
            if (!ctx || !active) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Add particles if we need more
            while (particles.length < maxParticles) {
                particles.push(createParticle());
            }

            // Update and draw particles
            particles.forEach((particle, i) => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.alpha -= 0.005;

                if (effect.rainbow) {
                    particle.color = shiftHue(particle.color, 1);
                }

                // Remove particles that are too faint or out of bounds
                if (particle.alpha <= 0 ||
                    particle.x < -particle.size ||
                    particle.x > canvas.width + particle.size ||
                    particle.y < -particle.size ||
                    particle.y > canvas.height + particle.size
                ) {
                    particles[i] = createParticle();
                    return;
                }

                // Draw particle
                ctx.save();
                ctx.globalAlpha = particle.alpha;
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            animationFrame = requestAnimationFrame(animate);
        }

        animate();
    }

    function getRandomColor(): string {
        const hue = Math.random() * 360;
        return `hsl(${hue}, 100%, 70%)`;
    }

    function shiftHue(color: string, amount: number): string {
        const hsl = /hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/.exec(color);
        if (!hsl) return color;
        
        let [, h, s, l] = hsl.map(Number);
        h = (h + amount) % 360;
        return `hsl(${h}, ${s}%, ${l}%)`;
    }

    onDestroy(() => {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
    });
</script>

<div class="effect-container" class:glow={effect.type === 'glow'} style="--effect-color: {effect.color}; --effect-intensity: {effect.intensity}">
    {#if effect.type === 'particles'}
        <canvas
            bind:this={canvas}
            class="particle-canvas"
        ></canvas>
    {/if}
    <slot></slot>
</div>

<style>
    .effect-container {
        position: relative;
        width: 100%;
        height: 100%;
    }

    .glow {
        box-shadow: 0 0 calc(20px * var(--effect-intensity)) var(--effect-color);
        transition: box-shadow 0.3s ease;
    }

    .particle-canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
    }
</style>
