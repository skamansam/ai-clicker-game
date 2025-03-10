export interface StoryChapter {
    id: string;
    title: string;
    content: string;
    unlocksAt: number; // total metal required to unlock
}

export const storyChapters: StoryChapter[] = [
    {
        id: 'intro',
        title: 'Crash Landing',
        content: `EMERGENCY LOG - STARDATE 78189.00
        
Your ship has crash-landed on an uncharted planet after being caught in a gravitational anomaly. Life support systems are failing, and the ship's power core is critically damaged.

The emergency metal extractor is still functional, but requires manual operation. Each time you stabilize the core, it extracts metal from the planet's crust - the essential resource needed to repair your ship.

Survival protocol activated. Begin metal extraction immediately.`,
        unlocksAt: 0
    },
    {
        id: 'first_progress',
        title: 'First Assessment',
        content: `CAPTAIN'S LOG - STARDATE 78189.82

The metal extractor is working, but progress is slow. Initial scans show this planet has rich mineral deposits that could be used to enhance our extraction capabilities.

Engineering reports that with enough metal, we can build automated extraction units for faster collection and higher output. We need to keep stabilizing the core - our survival depends on it.`,
        unlocksAt: 1000
    },
    {
        id: 'automation',
        title: 'Engineering Breakthrough',
        content: `CHIEF ENGINEER'S LOG - STARDATE 78190.91

Breakthrough! We've managed to create rudimentary automation for the metal extractor using salvaged parts from the damaged sections of the ship.

These automated extractors aren't perfect - they're slow and inefficient - but they'll help us gather metal even when we're not actively stabilizing the core. With more metal, we can build better automation systems and eventually unlock new resource types.`,
        unlocksAt: 5000
    },
    {
        id: 'second_resource',
        title: 'Advanced Materials',
        content: `SCIENCE OFFICER'S LOG - STARDATE 78191.29

We've discovered a second type of resource on this planet - a rare crystalline material with extraordinary properties. These crystals could be the key to repairing our warp drive.

I've modified our extraction systems to collect these crystals, but the process is complex. It requires a significant amount of metal to power each crystal extraction cycle. The good news is that these crystals will allow us to develop even more advanced technologies.`,
        unlocksAt: 10000
    },
    {
        id: 'third_resource',
        title: 'Exotic Energy',
        content: `SCIENCE OFFICER'S LOG - STARDATE 78192.47

Incredible discovery! The crystalline materials interact with the planet's magnetic field to produce an exotic form of energy. This energy could power a distress beacon strong enough to reach Federation space.

We've reconfigured our systems to harness this energy, but the process requires a significant amount of crystals. Each energy unit we collect brings us closer to establishing communication with the Federation.`,
        unlocksAt: 25000
    },
    {
        id: 'prestige',
        title: 'Escape Velocity',
        content: `CAPTAIN'S LOG - STARDATE 78194.93

We've gathered enough resources to make the ship spaceworthy again! We can now leave this planet and continue our journey.

The knowledge and experience we've gained will be invaluable. I'm designating these insights as "Stellar Wisdom" - they'll allow us to work more efficiently when we reach the next planet.

Prepare for liftoff!`,
        unlocksAt: 50000
    },
    {
        id: 'new_planet',
        title: 'New Horizons',
        content: `CAPTAIN'S LOG - STARDATE 78195.30

We've landed on a new planet with even stranger properties than the last. Our previous experience (Stellar Wisdom) has allowed us to quickly set up improved resource collection systems.

Scans show this planet has additional resource types we can utilize. The journey home will be long, but with each planet we visit, our ship grows stronger and our technology more advanced.`,
        unlocksAt: 75000
    },
    {
        id: 'advanced_upgrades',
        title: 'Advanced Technology',
        content: `CHIEF ENGINEER'S LOG - STARDATE 78196.67

The Stellar Wisdom we accumulated has unlocked new technological possibilities. We've developed enhanced resource collectors and more efficient processing methods.

With each planet we visit, we're able to implement more advanced systems. At this rate, we might return to Federation space with technology more advanced than when we left!`,
        unlocksAt: 100000
    },
    {
        id: 'fourth_resource',
        title: 'Quantum Particles',
        content: `SCIENCE OFFICER'S LOG - STARDATE 78198.29

This planet's unusual radiation has led to the discovery of stable quantum particles - something theoretical until now. These particles could revolutionize our propulsion systems.

The resource generator has been modified once again to collect these particles, but the process requires significant amounts of all our previous resources.`,
        unlocksAt: 250000
    },
    {
        id: 'next_journey',
        title: 'Onward',
        content: `CAPTAIN'S LOG - STARDATE 78201.70

With our ship repaired and upgraded with the resources from this planet, we're ready to continue our journey home. Each planet we visit brings us closer to Federation space and adds to our Stellar Wisdom.

The universe is vast and full of wonders. Our misfortune in crash-landing has become an opportunity for discovery. Let's see what the next world has to offer.

Preparing for liftoff once again!`,
        unlocksAt: 500000
    }
];
