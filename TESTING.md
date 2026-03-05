# GongZhu Testing Guide

## Overview

This project includes **2 unit tests** (Vitest) and **2 E2E tests** (Playwright) designed to be **deterministic and non-flaky** through seeded RNG and TEST MODE.

---

## Quick Start

### Run Unit Tests
```bash
npm test
```

### Run Unit Tests (Watch Mode)
```bash
npm run test:watch
```

### Run E2E Tests
```bash
npm run test:e2e
```

---

## TEST MODE

TEST MODE ensures deterministic, repeatable test outcomes by controlling all sources of randomness.

### How to Enable

| Method | Usage |
|--------|-------|
| **Query string** | `http://localhost:3000/?test=1` |
| **Environment variable** | `VITE_TEST_MODE=1 npm run dev` |

### What TEST MODE Does

- **RNG seed is fixed** to `42` — deck shuffle produces the same card order every time
- **AI names are fixed** to `AI_1`, `AI_2`, `AI_3` (no random selection from name pool)
- **Initial hand/deck is deterministic** — seeded shuffle via mulberry32 PRNG
- **Animation/AI delays are minimized** — 10ms instead of 400-1200ms

---

## Unit Tests

Located in `tests/unit/`. Uses **Vitest** + **jsdom**.

### Test #1 — Deterministic Shuffle / Deal (`shuffle.test.js`)

**Purpose**: Prove the game's shuffle/deal is deterministic under a seed.

| Assertion | Description |
|-----------|-------------|
| Same seed → same order | Two shuffles with seed=42 produce identical card sequences |
| Different seed → different order | seed=42 vs seed=99 produce different shuffles |
| GongzhuGame deals deterministic hands | Full game dealing with seeded RNG is reproducible |
| 52 unique cards | Shuffled deck maintains all 52 cards without duplicates |

### Test #2 — Scoring Rules (`scoring.test.js`)

**Purpose**: Validate scoring sub-rules using pure functions (no UI).

| Assertion | Description |
|-----------|-------------|
| Heart values | Each heart rank returns correct penalty (A=-50, K=-40, etc.) |
| ♠Q (Pig) | Scores -100 points |
| ♦J (Goat) | Scores +100 points |
| ♣10 (Transformer) | +50 alone, ×2 multiplier with other scoring cards |
| Shoot the Moon | All 13 hearts = +200, with ♠Q = +300 |
| Exposed card doubling | Exposed ♠Q = -200, exposed ♦J = +200 |
| No scoring cards | Returns 0 |

---

## E2E Tests

Located in `tests/e2e/`. Uses **Playwright Test** with Chromium.

### Test #1 — Smoke: Launch → Start Game (`smoke.spec.js`)

**Purpose**: Ensure the app is usable from a player's perspective.

Steps:
1. Navigate to `/?test=1`
2. Verify lobby renders with title
3. Enter player name "TestPlayer"
4. Click "Play →"
5. Click "Start AI Game"
6. Assert game table appears
7. Verify "Round 1" text
8. Verify hand has 13 cards
9. Verify deterministic AI names (AI_1, AI_2, AI_3)

### Test #2 — Play One Card → State Updates (`playCard.spec.js`)

**Purpose**: Verify the core interaction loop is functional and deterministic.

**Test A — Play a card:**
1. Start game in TEST MODE
2. Wait for player's turn
3. Count cards in hand
4. Click first playable card
5. Assert hand count decreased by 1
6. Assert trick area shows played card(s)

**Test B — Deterministic hands across runs:**
1. Start game in TEST MODE, record card IDs
2. Reload and start game again, record card IDs
3. Assert both runs produced identical hands

---

## Determinism Implementation

### RNG Abstraction (`src/game/rng.js`)

| Export | Description |
|--------|-------------|
| `createSeededRng(seed)` | Returns `{ next(), nextInt(min,max) }` using mulberry32 PRNG |
| `createDefaultRng()` | Uses `Math.random()` for production |
| `isTestMode()` | Checks `VITE_TEST_MODE=1` env or `?test=1` query string |
| `getRng(seed?)` | Auto-selects seeded (test) or default (production) RNG |
| `TEST_SEED` | `42` |
| `TEST_AI_NAMES` | `['AI_1', 'AI_2', 'AI_3']` |

### Integration Points

- `shuffleDeck(deck, rng?)` in `gameEngine.js` accepts optional RNG
- `GongzhuGame` constructor accepts optional RNG: `new GongzhuGame(id, rng)`
- `useLocalGame` hook auto-detects TEST MODE and injects seeded RNG
- `App.jsx` auto-switches to local game mode when `?test=1` is present

---

## Folder Structure

```
Gongzhu/
├── tests/
│   ├── unit/
│   │   ├── setup.js              # Vitest setup (jest-dom matchers)
│   │   ├── shuffle.test.js       # Unit Test #1 — Deterministic Shuffle
│   │   └── scoring.test.js       # Unit Test #2 — Scoring Rules
│   └── e2e/
│       ├── smoke.spec.js          # E2E Test #1 — Smoke Launch
│       └── playCard.spec.js       # E2E Test #2 — Play Card
├── src/game/rng.js                # RNG abstraction + TEST MODE
├── vitest.config.js               # Vitest configuration
├── playwright.config.js           # Playwright configuration
└── TESTING.md                     # This file
```

---

## Configuration Files

### `vitest.config.js`
- Environment: jsdom
- Setup: `tests/unit/setup.js`
- Includes: `tests/unit/**/*.test.{js,jsx}`

### `playwright.config.js`
- Browser: Chromium (headless)
- Auto-starts dev server on port 3000
- Timeout: 30s per test
- Screenshots on failure

---

## CI Notes

- E2E tests auto-start Vite dev server via Playwright `webServer` config
- No external server/WebSocket needed — TEST MODE uses local game engine
- For Azure Pipelines: use Playwright Workspaces (MPT Preview is being retired)
