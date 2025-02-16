// src/lib/data/upgrades.ts
import type { Upgrade } from '$lib/types';

export const defaultUpgrades: Upgrade[] = [
    {
        id: 'cursor',
        name: 'Cursor',
        base_cost: 10,
        clicks_per_second: 0.1,
        description: 'Automatically clicks once every 10 seconds',
        created_at: new Date().toISOString()
    },
    {
        id: 'autoclicker',
        name: 'Auto Clicker',
        base_cost: 50,
        clicks_per_second: 1,
        description: 'Clicks once per second',
        created_at: new Date().toISOString()
    },
    {
        id: 'robot',
        name: 'Click Robot',
        base_cost: 250,
        clicks_per_second: 5,
        description: 'A robot that clicks 5 times per second',
        created_at: new Date().toISOString()
    },
    {
        id: 'quantum_clicker',
        name: 'Quantum Clicker',
        base_cost: 1000,
        clicks_per_second: 25,
        description: 'Uses quantum superposition to click 25 times per second',
        created_at: new Date().toISOString()
    },
    {
        id: 'time_bender',
        name: 'Time Bender',
        base_cost: 5000,
        clicks_per_second: 100,
        description: 'Bends time to click 100 times per second',
        created_at: new Date().toISOString()
    }
];
