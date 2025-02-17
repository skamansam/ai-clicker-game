export interface PrestigeUpgrade {
    id: string;
    name: string;
    description: string;
    icon: string;
    cost: number;
    maxLevel?: number;
    effect: {
        type: 'multiplier' | 'autoClick' | 'clickPower' | 'passive';
        value: number;
    };
}

export const prestigeUpgrades: PrestigeUpgrade[] = [
    {
        id: 'golden_mouse',
        name: 'Golden Mouse',
        description: 'Your clicks are worth 2x more for each level',
        icon: '🖱️',
        cost: 5,
        effect: {
            type: 'clickPower',
            value: 2
        }
    },
    {
        id: 'time_warp',
        name: 'Time Warp',
        description: 'Auto-clickers run 50% faster per level',
        icon: '⚡',
        cost: 8,
        effect: {
            type: 'autoClick',
            value: 1.5
        }
    },
    {
        id: 'cosmic_power',
        name: 'Cosmic Power',
        description: 'All click sources gain a 2x multiplier per level',
        icon: '✨',
        cost: 15,
        effect: {
            type: 'multiplier',
            value: 2
        }
    },
    {
        id: 'quantum_engine',
        name: 'Quantum Engine',
        description: 'Generates 1 click per second per level, unaffected by other multipliers',
        icon: '🌀',
        cost: 10,
        effect: {
            type: 'passive',
            value: 1
        }
    },
    {
        id: 'infinity_gauntlet',
        name: 'Infinity Gauntlet',
        description: 'Doubles the effectiveness of prestige points',
        icon: '🌟',
        cost: 50,
        maxLevel: 1,
        effect: {
            type: 'multiplier',
            value: 2
        }
    }
];
