<!-- src/lib/components/SkillTreeView.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { progressionStore } from '$lib/stores/achievement-progression';
    import type { SkillNode } from '$lib/types';

    export let treeId: string;
    
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let width: number;
    let height: number;
    let scale = browser ? window.devicePixelRatio || 1 : 1;
    let hoveredNode: SkillNode | null = null;
    let selectedNode: SkillNode | null = null;
    let dragging = false;
    let dragStart = { x: 0, y: 0 };
    let offset = { x: 0, y: 0 };
    let zoom = 1;

    $: tree = $progressionStore.skillTrees[treeId];
    $: nodes = tree?.nodes || [];
    $: unlockedNodes = new Set(tree?.unlockedNodes || []);

    onMount(() => {
        if (!browser) return;

        initCanvas();
        window.addEventListener('resize', initCanvas);
        return () => {
            if (browser) {
                window.removeEventListener('resize', initCanvas);
            }
        };
    });

    function initCanvas() {
        if (!browser || !canvas) return;

        const container = canvas.parentElement;
        if (!container) return;

        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width * scale;
        canvas.height = height * scale;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        draw();
    }

    function draw() {
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw connections
        ctx.lineWidth = 2;
        for (const node of nodes) {
            if (!node.requirements.nodes) continue;

            for (const reqId of node.requirements.nodes) {
                const reqNode = nodes.find(n => n.id === reqId);
                if (!reqNode) continue;

                const startPos = transformPoint(reqNode.position);
                const endPos = transformPoint(node.position);

                ctx.beginPath();
                ctx.moveTo(startPos.x, startPos.y);
                ctx.lineTo(endPos.x, endPos.y);

                if (unlockedNodes.has(node.id) && unlockedNodes.has(reqId)) {
                    ctx.strokeStyle = '#4CAF50';
                } else if (unlockedNodes.has(reqId)) {
                    ctx.strokeStyle = '#FFC107';
                } else {
                    ctx.strokeStyle = '#757575';
                }

                ctx.stroke();
            }
        }

        // Draw nodes
        for (const node of nodes) {
            const pos = transformPoint(node.position);
            const radius = 25;

            // Node background
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            
            if (node === hoveredNode) {
                ctx.fillStyle = '#E3F2FD';
            } else if (unlockedNodes.has(node.id)) {
                ctx.fillStyle = '#81C784';
            } else if (progressionStore.canUnlockNode(treeId, node.id)) {
                ctx.fillStyle = '#FFE082';
            } else {
                ctx.fillStyle = '#BDBDBD';
            }
            
            ctx.fill();

            // Node border
            ctx.strokeStyle = node === selectedNode ? '#1976D2' : '#424242';
            ctx.lineWidth = node === selectedNode ? 3 : 2;
            ctx.stroke();

            // Node icon
            const icon = new Image();
            icon.src = node.icon;
            icon.onload = () => {
                ctx.drawImage(
                    icon,
                    pos.x - 15,
                    pos.y - 15,
                    30,
                    30
                );
            };

            // Rank indicator
            if (node.currentRank > 0) {
                ctx.fillStyle = '#424242';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(
                    `${node.currentRank}/${node.maxRank}`,
                    pos.x,
                    pos.y + radius + 15
                );
            }
        }
    }

    function transformPoint(point: { x: number; y: number }) {
        return {
            x: (point.x * zoom + offset.x) * width,
            y: (point.y * zoom + offset.y) * height
        };
    }

    function inverseTransformPoint(point: { x: number; y: number }) {
        return {
            x: (point.x / width - offset.x) / zoom,
            y: (point.y / height - offset.y) / zoom
        };
    }

    function handleMouseMove(event: MouseEvent) {
        if (!browser) return;

        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) / width;
        const y = (event.clientY - rect.top) / height;
        const pos = inverseTransformPoint({ x, y });

        if (dragging) {
            offset.x += (x - dragStart.x) / zoom;
            offset.y += (y - dragStart.y) / zoom;
            dragStart = { x, y };
            draw();
            return;
        }

        // Find hovered node
        hoveredNode = nodes.find(node => {
            const nodePos = transformPoint(node.position);
            const dx = nodePos.x - event.clientX + rect.left;
            const dy = nodePos.y - event.clientY + rect.top;
            return Math.sqrt(dx * dx + dy * dy) < 25;
        }) || null;

        draw();
    }

    function handleMouseDown(event: MouseEvent) {
        if (!browser) return;

        const rect = canvas.getBoundingClientRect();
        dragStart = {
            x: (event.clientX - rect.left) / width,
            y: (event.clientY - rect.top) / height
        };

        if (hoveredNode) {
            selectedNode = hoveredNode;
            draw();
        } else {
            dragging = true;
        }
    }

    function handleMouseUp() {
        if (!browser) return;

        dragging = false;
    }

    function handleWheel(event: WheelEvent) {
        if (!browser) return;

        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) / width;
        const y = (event.clientY - rect.top) / height;
        const pos = inverseTransformPoint({ x, y });

        const delta = event.deltaY > 0 ? 0.9 : 1.1;
        zoom *= delta;
        zoom = Math.max(0.5, Math.min(2, zoom));

        // Adjust offset to zoom toward cursor
        offset.x = x - pos.x * zoom;
        offset.y = y - pos.y * zoom;

        draw();
    }

    async function unlockNode() {
        if (!selectedNode) return;
        if (!progressionStore.canUnlockNode(treeId, selectedNode.id)) return;

        await progressionStore.unlockSkillNode(treeId, selectedNode.id);
        draw();
    }

    async function upgradeNode() {
        if (!selectedNode) return;
        if (!unlockedNodes.has(selectedNode.id)) return;
        if (selectedNode.currentRank >= selectedNode.maxRank) return;

        await progressionStore.upgradeSkillNode(treeId, selectedNode.id);
        draw();
    }
</script>

<div class="skill-tree">
    <div class="canvas-container">
        <canvas
            bind:this={canvas}
            on:mousemove={handleMouseMove}
            on:mousedown={handleMouseDown}
            on:mouseup={handleMouseUp}
            on:mouseleave={handleMouseUp}
            on:wheel={handleWheel}
        ></canvas>
    </div>

    {#if selectedNode}
        <div class="node-details" transition:slide>
            <h3>{selectedNode.name}</h3>
            <p>{selectedNode.description}</p>

            {#if selectedNode.currentRank > 0}
                <div class="effects">
                    <h4>Current Effects:</h4>
                    {#each selectedNode.effects as effect}
                        <div class="effect">
                            <span class="effect-type">
                                {effect.type.replace('_', ' ')}:
                            </span>
                            <span class="effect-value">
                                {progressionStore.getNodeEffectValue(selectedNode, effect)}
                                {effect.scaling ? '%' : ''}
                            </span>
                        </div>
                    {/each}
                </div>

                {#if selectedNode.currentRank < selectedNode.maxRank}
                    <div class="next-rank">
                        <h4>Next Rank:</h4>
                        {#each selectedNode.effects as effect}
                            <div class="effect">
                                <span class="effect-type">
                                    {effect.type.replace('_', ' ')}:
                                </span>
                                <span class="effect-value">
                                    {progressionStore.getNodeEffectValue(selectedNode, effect, selectedNode.currentRank + 1)}
                                    {effect.scaling ? '%' : ''}
                                </span>
                            </div>
                        {/each}
                    </div>
                {/if}
            {/if}

            <div class="requirements">
                <h4>Requirements:</h4>
                {#if selectedNode.requirements.level}
                    <div class="requirement" class:met={$progressionStore.level >= selectedNode.requirements.level}>
                        Level {selectedNode.requirements.level}
                    </div>
                {/if}
                {#if selectedNode.requirements.points}
                    <div class="requirement" class:met={$progressionStore.skillPoints >= selectedNode.requirements.points}>
                        {selectedNode.requirements.points} Skill Points
                    </div>
                {/if}
                {#if selectedNode.requirements.prestige}
                    <div class="requirement" class:met={$progressionStore.prestige.level >= selectedNode.requirements.prestige}>
                        Prestige Level {selectedNode.requirements.prestige}
                    </div>
                {/if}
            </div>

            <div class="actions">
                {#if !unlockedNodes.has(selectedNode.id)}
                    <button
                        class="unlock-btn"
                        disabled={!progressionStore.canUnlockNode(treeId, selectedNode.id)}
                        on:click={unlockNode}
                    >
                        Unlock ({selectedNode.cost.base} SP)
                    </button>
                {:else if selectedNode.currentRank < selectedNode.maxRank}
                    <button
                        class="upgrade-btn"
                        disabled={$progressionStore.skillPoints < Math.floor(
                            selectedNode.cost.base * Math.pow(selectedNode.cost.scaling, selectedNode.currentRank)
                        )}
                        on:click={upgradeNode}
                    >
                        Upgrade ({Math.floor(
                            selectedNode.cost.base * Math.pow(selectedNode.cost.scaling, selectedNode.currentRank)
                        )} SP)
                    </button>
                {:else}
                    <button class="maxed-btn" disabled>
                        Maxed
                    </button>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .skill-tree {
        display: flex;
        gap: 1rem;
        height: 100%;
    }

    .canvas-container {
        flex: 1;
        position: relative;
        background: #F5F5F5;
        border-radius: 0.5rem;
        overflow: hidden;
    }

    canvas {
        position: absolute;
        top: 0;
        left: 0;
        cursor: grab;
    }

    canvas:active {
        cursor: grabbing;
    }

    .node-details {
        width: 300px;
        padding: 1rem;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    h3 {
        margin: 0 0 0.5rem;
        color: #212121;
    }

    p {
        margin: 0 0 1rem;
        color: #616161;
        font-size: 0.9rem;
        line-height: 1.4;
    }

    h4 {
        margin: 1rem 0 0.5rem;
        color: #424242;
        font-size: 0.9rem;
    }

    .effects, .next-rank {
        margin-bottom: 1rem;
    }

    .effect {
        display: flex;
        justify-content: space-between;
        font-size: 0.9rem;
        padding: 0.25rem 0;
    }

    .effect-type {
        color: #616161;
        text-transform: capitalize;
    }

    .effect-value {
        color: #2196F3;
        font-weight: 500;
    }

    .requirements {
        margin-bottom: 1rem;
    }

    .requirement {
        font-size: 0.9rem;
        color: #F44336;
        padding: 0.25rem 0;
    }

    .requirement.met {
        color: #4CAF50;
    }

    .actions {
        display: flex;
        gap: 0.5rem;
    }

    button {
        flex: 1;
        padding: 0.5rem;
        border: none;
        border-radius: 0.25rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .unlock-btn {
        background: #2196F3;
        color: white;
    }

    .unlock-btn:hover:not(:disabled) {
        background: #1976D2;
    }

    .upgrade-btn {
        background: #4CAF50;
        color: white;
    }

    .upgrade-btn:hover:not(:disabled) {
        background: #388E3C;
    }

    .maxed-btn {
        background: #9E9E9E;
        color: white;
    }
</style>
