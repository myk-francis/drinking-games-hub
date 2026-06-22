# Spec: Flip 7

## Assumptions

1. `Flip 7` will be added as a new game mode inside the existing room system, similar to `Coup`.
2. We are building the standard core game first, not custom house rules beyond existing app scoring/drinks support.
3. The app should support multiplayer play in a shared room with server-authoritative state.
4. We should preserve the current app pattern: game engine in `src/modules/games/lib`, server mutations in `src/modules/games/server/procedures.ts`, and room UI in `src/app/room/[id]`.
5. We can summarize official rules in-app, but we should not copy long proprietary rule text verbatim.
6. The app will intentionally omit the official `0` card because that was explicitly requested for this branch.

## Objective

Add `Flip 7` to the app as a fully playable multiplayer game with shared round state, per-player decisions to `hit` or `stay`, action card resolution, round scoring, and game-end detection.

The player experience should feel fast and readable:

- Players can clearly see who is still active in the round.
- A player can decide whether to take another card or bank their score.
- Busts, freezes, second chances, and bonus moments are obvious to the whole table.
- The game handles all official edge cases needed for a fair shared-room implementation.

## Official Rules Basis

Primary source used for this spec:

- Official FAQ: `https://theop.games/pages/flip-7-faqs?srsltid=AfmBOord3znVLs6BkM2vUSwGD8ClJyACrr7x0suvjPwxUvBXWUjHtB4h`
- Official product page: `https://theop.games/products/flip-7?srsltid=AfmBOoqutA3vFh-s16XCUph6SF7rOzSQ7OUze5ew6wDGBITshKhS-V9L`

Rules captured from the official FAQ:

- A player busts if they reveal a duplicate number in their own row.
- If a player busts, they score `0` for that round.
- The deck has one `1`, two `2`s`, three `3`s`, and so on.
- Action cards can be assigned by the player who receives them.
- `Second Chance` prevents busting from a number card, but not from `Freeze`.
- If a player reveals `7` different number cards in one round, they earn `+15`.
- Scoring order is: sum number cards, apply `x2` to the number total only, then add modifiers, then add the `+15` Flip 7 bonus.
- If only one active player remains and they reveal `Freeze` or `Flip Three`, they must assign it to themselves.
- If multiple players are tied above the win threshold, more rounds continue until there is one winner.

## Tech Stack

- Next.js `16.1.6`
- React `19.2.4`
- TypeScript `5`
- tRPC `11`
- Prisma `7`
- Zod `4`
- React Query `5`

## Commands

- Dev: `npm run dev`
- Lint: `npm run lint`
- Typecheck: `npm run tsc`
- Build: `npm run build`
- Focused tests for new engine logic: `node --import tsx --test src/modules/games/lib/flip-7-engine.test.ts`

## Project Structure

- `src/modules/games/lib/game-config.ts`
  Add Flip 7 metadata, labels, and player-count constraints.
- `src/modules/games/lib/room-state.ts`
  Define the serialized Flip 7 room state and parser.
- `src/modules/games/lib/flip-7.ts`
  Store reference content for the UI: objective, card types, round flow, scoring notes.
- `src/modules/games/lib/flip-7-engine.ts`
  Core game engine for deck setup, dealing, player decisions, action resolution, scoring, and win detection.
- `src/modules/games/lib/flip-7-engine.test.ts`
  Unit tests for round flow and edge cases.
- `src/modules/games/server/procedures.ts`
  Room creation rules and Flip 7 mutations.
- `src/app/room/[id]/Flip7Room.tsx`
  Main game UI for players in a room.
- `src/app/room/[id]/GameContentRenderer.tsx`
  Render Flip 7 when the room game is selected.
- `src/app/room/[id]/page.tsx`
  Wire Flip 7 room state and mutations into the page.

## Code Style

Follow the same game architecture already used by `Coup`:

```ts
export function createInitialFlip7State(playerIds: string[]): Flip7RoomState {
  return {
    version: 1,
    status: "ROUND_DECISION",
    currentPlayerId: playerIds[0] ?? null,
    roundNumber: 1,
    scoresByPlayerId: Object.fromEntries(playerIds.map((id) => [id, 0])),
    history: [],
    // ...other round fields
  };
}
```

Conventions:

- Use pure engine functions for game rules.
- Keep server mutations thin and delegate rule enforcement to the engine.
- Keep UI copy short and action-oriented.
- Prefer discriminated unions for state transitions and pending effects.
- Record player-visible history entries for important events.

## Game Model

### Supported Player Count

- Enforce `3+` players to match the official game.
- Do not support a `2-player` adaptation in v1.

### Win Condition

- Players accumulate points across rounds.
- The game ends when a player reaches or exceeds the configured target score and is the sole leader after round resolution.
- Default target should be `200`, matching the official FAQ wording.

### Deck Model

The engine should model three card groups:

- Number cards
  Values `1` through `12`, with card multiplicity matching the number shown.
- Modifier cards
  Using one of each:
  - `+2`
  - `+4`
  - `+6`
  - `+8`
  - `x2`
  - `+10`
- Action cards
  Using three of each:
  - `Freeze`
  - `Flip Three`
  - `Second Chance`

Implementation note:

- Public references for the standard physical game describe a `94-card` deck that includes a `0`.
- This app will intentionally implement a `93-card` variant deck without `0`.
- The special-card and modifier distribution above is chosen to stay aligned with the publicly documented non-number card mix while honoring the requested no-`0` variant.

### Per-Player Round State

Each player needs round-tracked state:

- Revealed cards in front of them
- Distinct revealed numbers
- Whether they are still active this round
- Whether they have stayed
- Whether they are frozen
- Whether they have a pending `Second Chance`
- Whether they have busted this round
- Computed round score preview

### Shared Round State

The room state should track:

- Round number
- Current player turn for `hit/stay` decisions
- Draw deck
- Discarded or resolved cards if needed for history/debugging
- Pending action effect, if a card requires target selection or multi-step resolution
- Player scores across rounds
- Winner when the game ends
- History log

## Round Flow

### Round Start

At the start of each round:

- Build and shuffle a fresh Flip 7 deck.
- Reset all round-specific player state.
- Set the first active player.
- Clear pending action effects.

### Turn Loop

On a player's decision turn:

1. The active player chooses:
   - `Hit`
   - `Stay`
2. If they choose `Stay`:
   - Mark them safe for the round.
   - They no longer receive cards this round.
3. If they choose `Hit`:
   - Draw the top card.
   - Resolve it immediately.
4. After resolution:
   - Advance to the next active, unresolved player.
5. The round ends when no players remain active.

### Number Card Resolution

- If the number is new for that player, add it to their row.
- If the number duplicates one already in their row:
  - If the player has a pending `Second Chance`, consume it and ignore the bust.
  - Otherwise the player busts and is out for the round.

### Modifier Resolution

- `x2` doubles the player's number-card subtotal only.
- `+10` adds after number total and after any `x2`.
- Multiple modifiers should stack in a deterministic order defined by the official scoring guidance.

### Action Resolution

#### Freeze

- The receiving player assigns `Freeze` to any active player.
- If only one active player remains, it must target that same player.
- A frozen player is immediately out of the round but keeps their non-busted score contribution.
- `Second Chance` does not stop `Freeze`.

#### Flip Three

- The receiving player chooses any active player to receive the effect.
- That target reveals three cards one by one.
- Number and modifier cards resolve immediately as they are revealed.
- Action cards drawn during `Flip Three` are queued, then resolved after the three-card draw sequence finishes.
- If another action card appears during this sequence, it can also be assigned according to official rules.
- If the chosen player busts before all three cards are revealed, they stop drawing the remaining cards.
- If only one active player remains, the effect must target that player.

#### Second Chance

- The receiving player assigns it to any active player, including themselves.
- That player stores one bust protection charge for a future duplicate number.
- The protection is consumed only when a duplicate number would otherwise bust them.
- After `Second Chance` is used, the player does not draw an immediate replacement card; normal turn order continues.

## Scoring

At round end, compute each player's round score:

1. If busted, score `0`.
2. Sum all revealed number cards.
3. Apply `x2` to the number total only.
4. Add flat modifiers such as `+10`.
5. If the player revealed `7` distinct numbers, add `+15`.

Then:

- Add the round score to the player's cumulative score.
- If one player is uniquely at or above the target score, end the game.
- If two or more players are tied above the target score, continue to another round.
- After the game winner is finalized, award app meta-results:
  - winner gets `+1 point`
  - every other player gets `+1 drink`

## UI Requirements

The Flip 7 room should show:

- Current total score for each player
- Current round row for each player
- Which players are active, stayed, frozen, or busted
- Whose turn it is
- The current player's decision buttons: `Hit` and `Stay`
- Pending targeting UI for `Freeze`, `Flip Three`, and `Second Chance`
- Round history log
- Clear scoring explanation panel

Important UI behavior:

- Only the active player can make the round decision.
- When a special card needs a target, the acting player should see an explicit picker before play continues.
- The room should visibly distinguish:
  - safe stayed players
  - busted players
  - frozen players
  - players still pressing their luck

## Testing Strategy

Use Node test files with `tsx` for engine behavior, following the same pattern already used for `Coup`.

Required engine tests:

- Initial state creation
- Turn rotation across active players
- Stay removes a player from future round decisions
- Duplicate number bust without `Second Chance`
- Duplicate number with `Second Chance` consumes protection and avoids bust
- `Freeze` eliminates a player from the round without zeroing a safe row
- `Flip Three` resolves nested card effects correctly
- `x2` scoring applies only to number subtotal
- `+15` bonus applies for seven distinct numbers
- Tie over target score continues the game
- Single leader over target score wins the game

Required integration checks:

- Flip 7 appears in game creation/configuration UI
- Room creation respects the chosen min/max player constraints
- Room page renders Flip 7 state without hydration issues
- Mutations reject invalid actions from non-active players

## Boundaries

- Always:
  - Keep rules server-authoritative.
  - Add unit tests for every state transition and special-card edge case.
  - Keep serialized room state backward-safe and explicit.
  - Validate player identity and turn ownership in mutations.
- Ask first:
  - Changing the global room schema in a way that affects existing games
  - Adding animations or non-trivial visual redesign beyond the current game-room pattern
  - Supporting non-official `2-player` mode
  - Adding configurable win-score options
- Never:
  - Rely on client-only rule enforcement
  - Hardcode unresolved deck assumptions without verifying them first
  - Store hidden game logic only in UI state
  - Copy large portions of official rule text verbatim into the repo

## Success Criteria

- A room can be created with Flip 7 selected.
- Players can play complete rounds entirely in-app.
- The engine correctly handles busts, stays, freezes, second chances, and flip-three chains.
- Round scoring matches the official FAQ order.
- The game continues across rounds until there is one valid winner.
- Invalid actions are rejected cleanly by the server.
- The UI makes active state, busted state, and targeting decisions easy to understand.
- Tests cover the core engine and the highest-risk rule edge cases.

## Open Questions

1. Do we want a round summary modal, or is the event history panel enough for v1?
