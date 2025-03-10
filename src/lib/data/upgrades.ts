// src/lib/data/upgrades.ts
import type { Upgrade, ResourceGenerator } from '$lib/types';

// Basic resource generators (metal/minerals)
export const defaultUpgrades: Upgrade[] = [
    {
        id: 'basic_extractor',
        name: 'Basic Extractor',
        base_cost: 10,
        clicks_per_second: 0.1,
        description: 'A simple salvaged device that extracts 0.1 resources per second',
        created_at: new Date().toISOString(),
        resource_type: 'metal'
    },
    {
        id: 'mining_drone',
        name: 'Mining Drone',
        base_cost: 50,
        clicks_per_second: 0.5,
        description: 'A small drone that collects 0.5 resources per second',
        created_at: new Date().toISOString(),
        resource_type: 'metal'
    },
    {
        id: 'automated_drill',
        name: 'Automated Drill',
        base_cost: 250,
        clicks_per_second: 2,
        description: 'An automated drilling system that extracts 2 resources per second',
        created_at: new Date().toISOString(),
        resource_type: 'metal'
    },
    {
        id: 'mineral_processor',
        name: 'Mineral Processor',
        base_cost: 1000,
        clicks_per_second: 10,
        description: 'Advanced processing unit that refines 10 resources per second',
        created_at: new Date().toISOString(),
        resource_type: 'metal'
    },
    {
        id: 'quantum_excavator',
        name: 'Quantum Excavator',
        base_cost: 5000,
        clicks_per_second: 50,
        description: 'Uses quantum tunneling to extract 50 resources per second',
        created_at: new Date().toISOString(),
        resource_type: 'metal'
    }
];

// Crystal resource generators (unlocked after enough metal)
export const crystalGenerators: ResourceGenerator[] = [
    {
        id: 'crystal_extractor',
        name: 'Crystal Extractor',
        base_cost: 1000,
        base_metal_cost: 5000, // Metal cost to operate
        production_rate: 0.1,
        description: 'Extracts rare crystals at 0.1 per second, requires 5000 metal to operate',
        created_at: new Date().toISOString(),
        resource_type: 'crystal',
        unlocked_at: 10000 // Total metal clicks to unlock
    },
    {
        id: 'crystal_refiner',
        name: 'Crystal Refiner',
        base_cost: 5000,
        base_metal_cost: 10000,
        production_rate: 0.5,
        description: 'Refines crystals at 0.5 per second, requires 10000 metal to operate',
        created_at: new Date().toISOString(),
        resource_type: 'crystal',
        unlocked_at: 15000
    },
    {
        id: 'crystal_synthesizer',
        name: 'Crystal Synthesizer',
        base_cost: 15000,
        base_metal_cost: 25000,
        production_rate: 2,
        description: 'Synthesizes crystals at 2 per second, requires 25000 metal to operate',
        created_at: new Date().toISOString(),
        resource_type: 'crystal',
        unlocked_at: 25000
    }
];

// Energy resource generators (unlocked after enough crystals)
export const energyGenerators: ResourceGenerator[] = [
    {
        id: 'energy_converter',
        name: 'Energy Converter',
        base_cost: 1000,
        base_metal_cost: 10000,
        base_crystal_cost: 2000,
        production_rate: 0.1,
        description: 'Converts crystals to energy at 0.1 per second, requires metal and crystals to operate',
        created_at: new Date().toISOString(),
        resource_type: 'energy',
        unlocked_at: 5000 // Total crystal count to unlock
    },
    {
        id: 'energy_amplifier',
        name: 'Energy Amplifier',
        base_cost: 5000,
        base_metal_cost: 25000,
        base_crystal_cost: 5000,
        production_rate: 0.5,
        description: 'Amplifies energy production at 0.5 per second, requires metal and crystals to operate',
        created_at: new Date().toISOString(),
        resource_type: 'energy',
        unlocked_at: 10000
    },
    {
        id: 'fusion_reactor',
        name: 'Fusion Reactor',
        base_cost: 15000,
        base_metal_cost: 50000,
        base_crystal_cost: 10000,
        production_rate: 2,
        description: 'Generates energy through fusion at 2 per second, requires metal and crystals to operate',
        created_at: new Date().toISOString(),
        resource_type: 'energy',
        unlocked_at: 15000
    }
];

// Quantum particle generators (unlocked on new planets after prestige)
export const quantumGenerators: ResourceGenerator[] = [
    {
        id: 'quantum_collector',
        name: 'Quantum Collector',
        base_cost: 10000,
        base_metal_cost: 50000,
        base_crystal_cost: 10000,
        base_energy_cost: 5000,
        production_rate: 0.05,
        description: 'Collects quantum particles at 0.05 per second, requires all previous resources',
        created_at: new Date().toISOString(),
        resource_type: 'quantum',
        unlocked_at: 1, // Unlocked after 1 prestige
        prestige_required: true
    },
    {
        id: 'quantum_stabilizer',
        name: 'Quantum Stabilizer',
        base_cost: 50000,
        base_metal_cost: 100000,
        base_crystal_cost: 25000,
        base_energy_cost: 10000,
        production_rate: 0.2,
        description: 'Stabilizes quantum particles at 0.2 per second, requires all previous resources',
        created_at: new Date().toISOString(),
        resource_type: 'quantum',
        unlocked_at: 2, // Unlocked after 2 prestiges
        prestige_required: true
    }
];
