# Product Requirements Document (PRD)

**Product:** GongZhu Online (拱猪 / Chinese Hearts)  
**Version:** v1.0 (Web)  
**Owner:** Product / Game Team  
**Date:**

---

## 1. Product Overview

GongZhu Online is a web based implementation of the traditional Chinese card game GongZhu (拱猪 / Chinese Hearts). The game focuses on high variance trick taking gameplay with unique scoring cards, exposure (declaration) mechanics, and strong risk reward dynamics. The product supports casual play, ranked matchmaking, and AI practice.

---

## 2. Goals & Success Metrics

### Goals

- Deliver a rules accurate GongZhu experience on the web
- Enable fast, intuitive multiplayer gameplay
- Support solo practice with competent AI

### Success Metrics

- Match completion rate
- Average session length
- D7 retention
- Turn latency < 200 ms

---

## 3. Target Users

- Players familiar with Hearts / Chinese card games
- Casual competitive players
- Solo players practicing against AI

---

## 4. Core Game Rules (v1 Fixed Ruleset)

**Players:** 4 (no teams)  
**Deck:** Standard 52 cards, no jokers  
**Cards per Player:** 13  
**Play Direction:** Counter clockwise  
**No card passing**  
**Card Ranking:** A K Q J 10 9 8 7 6 5 4 3 2 (no trump)

### Scoring Cards

- ♠Q (Pig): −100
- ♦J (Goat): +100
- ♣10 (Transformer): multiplier
- ♥ All Hearts: −200 total
  - A −50, K −40, Q −30, J −20, 10–5 −10, 4–2 = 0

### Transformer (♣10)

- If captured alone: +50
- Otherwise: doubles total round score (positive or negative)

### Shooting the Moon

- All 13 hearts: +200
- Hearts + ♠Q: +300

### Exposure (Critical Mechanic)

- Optional pre play exposure of: ♠Q, ♦J, ♣10, ♥A
- Exposed card effect is doubled
- Exposed card cannot be played the first time its suit is led (unless singleton)

---

## 5. Gameplay Flow

1. Shuffle and deal
2. Exposure phase (simultaneous)
3. Trick play (follow suit enforced)
4. Trick winner leads next trick
5. After 13 tricks, calculate round score
6. Scores accumulate across rounds

---

## 6. Win / Lose Conditions

- Cumulative score system
- First player reaching −1000 loses
- Game ends immediately and ranks players by score

---

## 7. Game Modes

- **Casual:** Unranked, public/private rooms
- **Ranked:** Matchmaking, fixed ruleset, rating tracked
- **AI Practice:** 1 human + 3 AI (Easy / Normal / Hard)

### AI Considerations

- Suit enforcement
- Risk evaluation for ♠Q and ♣10
- Exposure timing logic

---

## 8. UX / UI Requirements

- Fan style hand layout
- Center trick display with clear winner animation
- Explicit exposure indicators
- Visible captured scoring cards
- Illegal moves disabled (rule driven UI)

---

## 9. Technical Overview (Web)

- **Frontend:** SPA (React / Vue equivalent)
- **Backend:** Authoritative game engine
- **Realtime:** WebSocket
- Server side rule validation and scoring

---

## 10. Out of Scope (v1)

- Voice chat
- Spectator mode
- Tournaments
- Two deck variants
- Replay system
