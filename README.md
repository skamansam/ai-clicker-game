# 🎮 AI Clicker Game

A modern, engaging clicker game built with SvelteKit and Firebase. Click your way through achievements, unlock upgrades, and compete with friends in this addictive incremental game!

## 🌟 Features

- 🔄 Real-time click tracking and state management
- 🏆 Achievement system with multiple categories
- ⚡ Upgrades to boost your clicking power
- 📈 Prestige system for long-term progression
- 🔥 Combo system for chain achievements
- 🎨 Modern, responsive UI
- 🔐 Firebase authentication and data persistence

## 🚀 Getting Started

### Prerequisites

- Node.js 22.14.0 or higher
- pnpm package manager
- Firebase account (for authentication and data storage)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/skamansam/clicker-game.git
cd clicker-game
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up Firebase:
   - Create a Firebase project
   - Enable Authentication and Firestore
   - Copy your Firebase config to `.env.local`

4. Start the development server:
```bash
# Start Firebase emulators
pnpm firebase:emulators:start

# In another terminal, start the dev server
pnpm dev
```

## 🏆 Achievements

<details>
<summary>🖱️ Click Achievements</summary>

| Achievement | Description | Requirements |
|------------|-------------|--------------|
| First Click | Take your first step | 1 click |
| Click Novice | Getting the hang of it | 100 clicks |
| Click Apprentice | You're getting better | 1,000 clicks |
| Click Master | A true clicking expert | 10,000 clicks |
| Click Legend | Your clicks are legendary | 100,000 clicks |
| Click God | Ascend to clicking divinity | 1,000,000 clicks |

</details>

<details>
<summary>⚡ Speed Achievements</summary>

| Achievement | Description | Requirements |
|------------|-------------|--------------|
| Quick Fingers | Click 5 times in 1 second | 5 CPS |
| Lightning Hands | Click 10 times in 1 second | 10 CPS |
| Speed Demon | Click 20 times in 1 second | 20 CPS |
| Time Bender | Click 50 times in 1 second | 50 CPS |

</details>

<details>
<summary>🔄 Combo Achievements</summary>

| Achievement | Description | Requirements |
|------------|-------------|--------------|
| Combo Starter | Chain 2 achievements | 2x combo |
| Combo Master | Chain 3 achievements | 3x combo |
| Combo Legend | Chain 4 achievements | 4x combo |
| Combo God | Chain 5 achievements | 5x combo |

</details>

<details>
<summary>⏰ Time Achievements</summary>

| Achievement | Description | Requirements |
|------------|-------------|--------------|
| Dedicated | Play for 1 hour | 1 hour playtime |
| Committed | Play for 24 hours | 24 hours playtime |
| Obsessed | Play for 1 week | 168 hours playtime |
| Lifer | Play for 1 month | 720 hours playtime |

</details>

<details>
<summary>🌟 Prestige Achievements</summary>

| Achievement | Description | Requirements |
|------------|-------------|--------------|
| New Beginning | Prestige for the first time | 1st prestige |
| Fresh Start | Prestige 5 times | 5 prestiges |
| Reborn | Prestige 10 times | 10 prestiges |
| Transcendent | Prestige 25 times | 25 prestiges |

</details>

<details>
<summary>🛠️ Upgrade Achievements</summary>

| Achievement | Description | Requirements |
|------------|-------------|--------------|
| Upgrader | Buy your first upgrade | 1 upgrade |
| Collector | Own 5 different upgrades | 5 upgrades |
| Hoarder | Own 10 different upgrades | 10 upgrades |
| Completionist | Own all upgrades | All upgrades |

</details>

## 💎 Upgrades

<details>
<summary>🖱️ Click Power Upgrades</summary>

| Upgrade | Description | Effect | Base Cost |
|---------|-------------|---------|-----------|
| Better Mouse | Enhance your clicking power | +1 click per click | 100 |
| Gaming Mouse | Professional clicking device | +5 clicks per click | 500 |
| Quantum Mouse | Clicks in multiple dimensions | +25 clicks per click | 2,500 |
| AI Mouse | Self-clicking intelligence | +100 clicks per click | 10,000 |

</details>

<details>
<summary>⚡ Auto-Clicker Upgrades</summary>

| Upgrade | Description | Effect | Base Cost |
|---------|-------------|---------|-----------|
| Auto Clicker | Basic automatic clicking | +1 click per second | 200 |
| Click Bot | Automated clicking assistant | +5 clicks per second | 1,000 |
| Click Farm | Network of automated clickers | +25 clicks per second | 5,000 |
| Click Factory | Industrial-scale clicking | +100 clicks per second | 20,000 |

</details>

<details>
<summary>🌟 Prestige Upgrades</summary>

| Upgrade | Description | Effect | Prestige Level Required |
|---------|-------------|---------|------------------------|
| Prestige Boost | Enhance all click gains | +50% click multiplier | 1 |
| Super Boost | Major click enhancement | +100% click multiplier | 5 |
| Ultra Boost | Massive click boost | +200% click multiplier | 10 |
| Omega Boost | Ultimate clicking power | +500% click multiplier | 25 |

</details>

<details>
<summary>🎯 Special Upgrades</summary>

| Upgrade | Description | Effect | Requirements |
|---------|-------------|---------|--------------|
| Combo Master | Extend combo duration | +1s combo time | 10 achievements |
| Lucky Clicks | Chance for double clicks | 10% double click chance | 25 achievements |
| Achievement Hunter | Easier achievements | -10% achievement requirements | 50 achievements |
| Time Warper | Faster auto-clicks | +25% auto-click speed | 100 achievements |

</details>

## 🎮 Game Mechanics

### Clicking
- Each click generates points
- Click power can be increased through upgrades
- Chain clicks quickly for combo bonuses

### Upgrades
- Spend points on various upgrades
- Each upgrade increases your clicking power
- Some upgrades provide passive point generation
- Special upgrades unlock new features

### Prestige
- Reset your progress for powerful bonuses
- Each prestige level provides a multiplier
- Unlock special prestige-only upgrades
- Complete prestige challenges for rewards

### Combos
- Chain achievements within 2 seconds
- Each achievement in the chain increases the multiplier
- Maximum combo multiplier: 5x
- Combo timer shown on screen

## 🛠️ Development

### Commands
```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Start Firebase emulators
pnpm firebase:emulators:start

# Export emulator data
pnpm firebase:emulators:export

# Import emulator data
pnpm firebase:emulators:import
```

### Project Structure
```
src/
├── lib/
│   ├── components/    # Svelte components
│   ├── stores/        # State management
│   ├── styles/        # Global styles
│   └── types/         # TypeScript types
├── routes/            # SvelteKit routes
└── app.html          # HTML template
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [SvelteKit](https://kit.svelte.dev/)
- Powered by [Firebase](https://firebase.google.com/)
- Icons from [Heroicons](https://heroicons.com/)
