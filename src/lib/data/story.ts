export interface StoryChapter {
    id: string;
    title: string;
    content: string;
    unlocksAt: number; // total clicks required
}

export const storyChapters: StoryChapter[] = [
    {
        id: 'intro',
        title: 'The Last Hope',
        content: `In the year 2157, Earth's magnetic field began to collapse. Solar radiation threatened to make the planet uninhabitable within months. 
        
You are humanity's last hope - the operator of the Quantum Core, an experimental device capable of generating a planetary shield. But there's a catch: the Core requires constant manual resonance adjustments through its quantum interface (aka "the button").

Each click helps stabilize the Core's quantum field. The more stable the field, the more power we can generate.`,
        unlocksAt: 0
    },
    {
        id: 'first_progress',
        title: 'Signs of Life',
        content: `Your dedication is paying off! The Core's quantum field is beginning to stabilize. Our scientists have detected the first signs of a coherent shield forming in the upper atmosphere.

But we need more power. Much more. Keep clicking - humanity is counting on you!`,
        unlocksAt: 1000
    },
    {
        id: 'automation',
        title: 'Breakthrough',
        content: `Amazing discovery! The quantum resonance patterns you've established are showing signs of self-replication. We can now develop automated systems to amplify your clicks.

The automated systems aren't perfect - they need your guidance to maintain quantum coherence. But they'll help us generate shield power much faster.`,
        unlocksAt: 5000
    },
    {
        id: 'prestige',
        title: 'Quantum Leap',
        content: `Incredible! The Core is exhibiting signs of quantum entanglement. Our scientists believe we can perform a "quantum reset" - temporarily shutting down the Core to reconfigure it at a higher energy state.

This process will reset our progress, but the knowledge gained will make the Core permanently more efficient. We call these efficiency gains "Prestige Points".`,
        unlocksAt: 10000
    },
    {
        id: 'golden_mouse',
        title: 'The Golden Interface',
        content: `The engineering team has developed a breakthrough: a gold-plated quantum interface that resonates perfectly with the Core's frequency.

This "Golden Mouse" upgrade will dramatically amplify the power of each click. Combined with our automated systems, we're making real progress!`,
        unlocksAt: 50000
    },
    {
        id: 'time_warp',
        title: 'Temporal Anomaly',
        content: `Fascinating development! The intense quantum activity is creating localized time distortions around our automated systems.

We can harness these "Time Warps" to make our automated systems run faster relative to normal space-time. The physics team is both excited and slightly terrified.`,
        unlocksAt: 100000
    },
    {
        id: 'cosmic_power',
        title: 'Cosmic Connection',
        content: `The shield is starting to work! As it deflects solar radiation, we're detecting unusual energy patterns. The Core seems to be tapping into some kind of cosmic power source.

By carefully tuning the shield frequency, we can amplify all our power generation methods. The universe itself is helping us!`,
        unlocksAt: 500000
    },
    {
        id: 'quantum_engine',
        title: 'The Quantum Engine',
        content: `This is revolutionary! The Core has started generating its own quantum resonance patterns. We've developed a "Quantum Engine" that can maintain a baseline power level without external input.

It's not much, but it's honest work - and completely self-sustaining. Every little bit helps in our mission to save Earth!`,
        unlocksAt: 1000000
    },
    {
        id: 'infinity_gauntlet',
        title: 'Project Infinity',
        content: `We've done it! By combining all our breakthroughs, we've created something unprecedented - the Infinity Gauntlet. This masterpiece of quantum engineering can double the effectiveness of all our previous achievements.

The shield is growing stronger by the day. Keep pushing, operator. Humanity's future is literally in your hands!`,
        unlocksAt: 5000000
    },
    {
        id: 'victory',
        title: 'A New Dawn',
        content: `Victory! The planetary shield is fully operational! Earth's magnetic field has been stabilized, and humanity is safe.

But our work isn't done. The Core has revealed glimpses of other dimensions facing similar crises. As long as you keep clicking, we can extend our shield technology to help other worlds.

Thank you, operator. You've saved not just our world, but opened the door to saving countless others.`,
        unlocksAt: 10000000
    }
];
