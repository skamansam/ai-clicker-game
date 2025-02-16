<!-- src/lib/components/AchievementEffects.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';
    import { browser } from '$app/environment';
    import { achievementComboStore } from '$lib/stores/achievement-combo';
    import { shopStore } from '$lib/stores/achievement-shop';
    import confetti from 'canvas-confetti';

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let particles: Particle[] = [];
    let animationFrame: number;
    let lastTime = 0;
    let windowWidth = browser ? window.innerWidth : 0;
    let windowHeight = browser ? window.innerHeight : 0;

    interface Particle {
        x: number;
        y: number;
        vx: number;
        vy: number;
        size: number;
        color: string;
        alpha: number;
        life: number;
        maxLife: number;
        type: 'sparkle' | 'star' | 'trail' | 'glow';
    }

    const colors = {
        sparkle: ['#ffd700', '#ff6b6b', '#4dabf7', '#51cf66', '#cc5de8'],
        trail: ['#ff9f43', '#ee5253', '#0abde3', '#10ac84', '#5f27cd'],
        star: ['#ffffff', '#ffd700', '#4dabf7', '#51cf66', '#cc5de8'],
        glow: ['#ff9f43', '#ee5253', '#0abde3', '#10ac84', '#5f27cd']
    };

    onMount(() => {
        if (!browser) return;
        
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        
        // Set canvas size
        const resize = () => {
            if (!browser || !canvas) return;
            windowWidth = window.innerWidth;
            windowHeight = window.innerHeight;
            canvas.width = windowWidth;
            canvas.height = windowHeight;
        };
        
        resize();
        if (browser) {
            window.addEventListener('resize', resize);
        }

        // Start animation loop
        lastTime = performance.now();
        animate();

        return () => {
            if (browser) {
                window.removeEventListener('resize', resize);
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                }
            }
        };
    });

    // Particle effects
    function createParticle(x: number, y: number, type: Particle['type']) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        const size = Math.random() * 3 + 2;
        const color = colors[type][Math.floor(Math.random() * colors[type].length)];
        const life = Math.random() * 1000 + 500;

        return {
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size,
            color,
            alpha: 1,
            life,
            maxLife: life,
            type
        };
    }

    function updateParticles(delta: number) {
        particles = particles.filter(p => {
            p.life -= delta;
            if (p.life <= 0) return false;

            p.x += p.vx;
            p.y += p.vy;
            p.alpha = p.life / p.maxLife;

            if (p.type === 'sparkle') {
                p.size *= 0.99;
            } else if (p.type === 'trail') {
                p.vy += 0.1; // Gravity
            } else if (p.type === 'star') {
                p.size = p.size * Math.sin(p.life / 100) + 2;
            }

            return true;
        });
    }

    function drawParticles() {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.alpha;

            if (p.type === 'sparkle') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            } else if (p.type === 'star') {
                drawStar(p.x, p.y, 5, p.size * 2, p.size, p.color);
            } else if (p.type === 'trail') {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.size;
                ctx.stroke();
            } else if (p.type === 'glow') {
                const gradient = ctx.createRadialGradient(
                    p.x, p.y, 0,
                    p.x, p.y, p.size * 3
                );
                gradient.addColorStop(0, `${p.color}cc`);
                gradient.addColorStop(1, `${p.color}00`);
                ctx.fillStyle = gradient;
                ctx.fillRect(
                    p.x - p.size * 3,
                    p.y - p.size * 3,
                    p.size * 6,
                    p.size * 6
                );
            }

            ctx.restore();
        });
    }

    function drawStar(x: number, y: number, spikes: number, outerRadius: number, innerRadius: number, color: string) {
        if (!ctx) return;
        
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(x, y - outerRadius);

        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(
                x + Math.cos(rot) * outerRadius,
                y + Math.sin(rot) * outerRadius
            );
            rot += step;

            ctx.lineTo(
                x + Math.cos(rot) * innerRadius,
                y + Math.sin(rot) * innerRadius
            );
            rot += step;
        }

        ctx.lineTo(x, y - outerRadius);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    function animate(time: number) {
        if (!browser) return;
        if (!lastTime) lastTime = time;
        const delta = time - lastTime;
        lastTime = time;

        updateParticles(delta);
        drawParticles();

        animationFrame = requestAnimationFrame(animate);
    }

    // Effect triggers
    function triggerAchievementUnlock(x: number, y: number) {
        if (!browser) return;
        
        // Burst of sparkles
        for (let i = 0; i < 30; i++) {
            particles.push(createParticle(x, y, 'sparkle'));
        }

        // Stars
        for (let i = 0; i < 5; i++) {
            particles.push(createParticle(x, y, 'star'));
        }

        // Confetti burst
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { x: x / windowWidth, y: y / windowHeight }
        });
    }

    function triggerComboEffect(x: number, y: number, multiplier: number) {
        if (!browser) return;
        
        const count = Math.floor(multiplier * 10);
        
        // Trails
        for (let i = 0; i < count; i++) {
            particles.push(createParticle(x, y, 'trail'));
        }

        // Glow
        for (let i = 0; i < Math.floor(multiplier); i++) {
            particles.push(createParticle(x, y, 'glow'));
        }

        if (multiplier >= 5) {
            // Fire confetti
            const duration = multiplier * 200;
            const end = Date.now() + duration;

            (function frame() {
                if (!browser) return;
                
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: x / windowWidth, y: y / windowHeight },
                    colors: ['#ffd700', '#ff6b6b', '#4dabf7']
                });

                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: x / windowWidth, y: y / windowHeight },
                    colors: ['#51cf66', '#cc5de8', '#ff9f43']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            })();
        }
    }

    function triggerPerfectCompletion(x: number, y: number) {
        if (!browser) return;
        
        // Rainbow spiral
        const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#8f00ff'];
        const end = Date.now() + 3000;

        (function frame() {
            const timeLeft = end - Date.now();

            confetti({
                particleCount: 7,
                angle: 135,
                spread: 80,
                origin: { x: x / windowWidth, y: y / windowHeight },
                colors: colors,
                ticks: 300,
                gravity: 0.8,
                scalar: 2,
                drift: -0.5,
            });

            if (timeLeft > 0) {
                requestAnimationFrame(frame);
            }
        }());

        // Starburst
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                particles.push(createParticle(x, y, 'star'));
                particles.push(createParticle(x, y, 'sparkle'));
            }, i * 50);
        }
    }

    export function playEffect(type: string, x: number, y: number, data?: any) {
        switch (type) {
            case 'unlock':
                triggerAchievementUnlock(x, y);
                break;
            case 'combo':
                triggerComboEffect(x, y, data?.multiplier || 1);
                break;
            case 'perfect':
                triggerPerfectCompletion(x, y);
                break;
        }
    }
</script>

<canvas
    bind:this={canvas}
    class="effects-canvas"
/>

<style>
    .effects-canvas {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
    }
</style>
