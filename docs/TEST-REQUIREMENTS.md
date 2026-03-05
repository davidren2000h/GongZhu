# GongZhu Testing Requirements (Unit + E2E) — Deterministic & Non-Flaky

## 1) Objective

Implement an automated testing baseline for the GongZhu web game that includes:

- 2 unit tests (logic-level)
- 2 end-to-end tests using Playwright (user-journey level)
- Tests must be deterministic: repeatable outcomes across runs, machines, and time zones.

## 2) Scope

### In scope

- Core game UI initialization and state transitions
- Deterministic handling of randomness (deck shuffle, AI names, any random selection)
- Basic user flows (launch → start game → play minimal turn(s) → reset)

### Out of scope

- Real multiplayer correctness on GitHub Pages (Pages is static; server/WS is not guaranteed there)
- Performance/load testing
- Full rules coverage for every edge case (this baseline focuses on stability + scaffolding)

## 3) Tooling Requirements

### Unit tests

- Use **Vitest + React Testing Library** as the preferred test stack for Vite/React projects.
- (If your project is not React, still prefer Vitest as the runner; adapt component library accordingly.)

### E2E tests

- Use **Playwright Test**.
- Tests should mimic real user behavior (click/type/assert visible outcomes), avoid "weird DOM inspection."

### CI note (optional)

- If you later run Playwright at scale in Azure, note Microsoft Playwright Testing (Preview) is being retired; use Playwright Workspaces instead.

## 4) Determinism Requirements (Non-Flaky by Design)

Tests must not depend on uncontrolled:

- Randomness (e.g., `Math.random()`, shuffle, AI name randomization)
- System time / time zones (date-based UI, DST issues)
- Timers (`setTimeout`, animation delays)
- Network timing (WS latency, race conditions)

### 4.1 Controlled Randomness (Required)

Introduce a testable randomness mechanism:

- Create an RNG abstraction (e.g., `rng.next()`), or pass a seeded RNG instance into logic.
- In tests, use a fixed seed so the sequence is repeatable. The core idea is to inject controlled randomness rather than using `new Random()`/`Math.random()` directly.

**Acceptance criteria:**

- Given a seed, initial deck order and any random decisions must be reproducible.
- Unit tests can force specific outcomes by setting seed / stubbed RNG.

### 4.2 Time & Timers (Required if used)

- If the game uses timers, unit tests should use fake timers and advance time deterministically (avoid sleep in tests). This is standard practice to reduce test flakiness.
- Freeze the "current time" for tests if any date/time is used.

### 4.3 E2E Stability (Required)

- Use Playwright's auto-waiting and resilient assertions; avoid fixed delays.
- Prefer stable selectors: `data-testid`, roles, labels.
- For scenarios involving persistent/mutated state, precondition/postcondition strategies are recommended to keep tests repeatable.

## 5) Test Mode Switch (Required)

Add a "TEST MODE" that can be activated via one of:

- environment var: `VITE_TEST_MODE=1`
- query string: `?test=1`

In TEST MODE:

- RNG seed is fixed (e.g., `seed=42`)
- AI names are fixed (e.g., `AI_1`, `AI_2`)
- Initial hand/deck is deterministic (either seeded shuffle or predefined fixture)
- Optional: disable animations / long delays

**Acceptance criteria:**

- Running the same tests twice yields identical outcomes.
- E2E tests can rely on predictable first move(s) and UI state.

## 6) Unit Tests (2) — Requirements

### Unit Test #1 — Deterministic Shuffle / Deal

**Purpose:** Prove the game's shuffle/deal is deterministic under a seed.

**Preconditions:**

- Game logic exposes a `shuffle(deck, rng)` or `deal(deck, rng)` (or similar).
- TEST MODE can supply seeded RNG.

**Test steps:**

1. Create a known ordered deck fixture (e.g., `[C2, C3, ...]`).
2. Use `seed = 42`; run shuffle/deal.
3. Assert resulting order (or dealt hands) equals a known expected snapshot (explicit list).
4. Repeat the same call with the same seed; assert identical output.

**Pass criteria:**

- Output is identical across repeated runs with the same seed.
- Changing seed changes output (optional additional assertion).

**Determinism rationale:**

- Randomness must be injected and controlled.

### Unit Test #2 — Scoring Rule (Pure Function)

**Purpose:** Validate a scoring sub-rule using pure logic (no UI).

Pick one concrete scoring rule from GongZhu implemented in your project (examples):

- points calculation for hearts / pigs / etc.
- penalty/bonus card scoring
- end-of-round aggregation

**Preconditions:**

- Scoring is a pure function: `scoreTrick(cards)` or `scoreRound(tricks)`.

**Test steps:**

1. Build a minimal fixture input (cards/tricks).
2. Call scoring function.
3. Assert returned score object matches expected.

**Pass criteria:**

- Score result is stable and correct for fixture input.
- No reliance on current time or randomness.

## 7) E2E Tests (2) — Playwright Requirements

### E2E Test #1 — Smoke: Launch → Start Game → Visible Game State

**Purpose:** Ensure the app is usable from a player's perspective.

**Preconditions:**

- App can run locally (`npm run dev`) and be visited by Playwright.
- TEST MODE enabled (env or query string) for deterministic UI.

**Test steps:**

1. Navigate to `http://localhost:<port>/?test=1`.
2. Confirm homepage renders (title/logo).
3. Enter a player name (if required).
4. Click "Start / Play".
5. Assert game table appears and initial state is visible:
   - Current player indicator
   - Hand rendered with N cards
   - "Round 1" or equivalent status text

**Pass criteria:**

- No blank screen, no console errors.
- Stable number of cards and deterministic labels in TEST MODE.

**Best practice note:**

- Assertions should mimic user-visible behavior; avoid excessive DOM probing.

### E2E Test #2 — Deterministic Turn: Play One Card → State Updates

**Purpose:** Verify the core interaction loop works and is deterministic.

**Preconditions:**

- TEST MODE makes the first hand deterministic.
- Each card element has a stable selector (`data-testid="card-<id>"`).

**Test steps:**

1. Navigate to `/?test=1`.
2. Start game.
3. Click a known card (e.g., first card in deterministic hand).
4. Click "Play/Confirm" if applicable.
5. Assert:
   - Card appears in "table/trick" area
   - Hand count decreases by 1
   - Turn indicator advances or updates deterministically

**Pass criteria:**

- The exact card played matches expectation in TEST MODE.
- No timing-dependent waits (no sleep); rely on Playwright auto-wait.

**Stability strategies:**

- If UI depends on timers, disable animations or use deterministic waits/assertions.

## 8) Deliverables (What the implementer must produce)

- `package.json` scripts:
  - `test` (unit)
  - `test:e2e` (playwright)
- vitest config + setup file (if needed)
- 2 unit test files
- Playwright config + 2 spec files
- Determinism implementation:
  - RNG injection
  - TEST MODE toggle
  - fixed seed + fixed AI names
- Short `TESTING.md` documenting:
  - how to run unit tests
  - how to run e2e tests
  - how to enable TEST MODE

## 9) Suggested Folder Layout (Recommended)

```
src/             (app)
src/game/        (pure logic: shuffle, deal, scoring)
tests/unit/      (vitest)
tests/e2e/       (playwright)
TESTING.md
```
