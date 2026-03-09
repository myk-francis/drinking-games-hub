# Drinking Games Hub

Drinking Games Hub is a multiplayer browser party-game platform built with Next.js, React, tRPC, Prisma, and PostgreSQL. Hosts can create rooms, add players or teams, share a join link or QR code, and run game-specific flows for prompts, voting, timers, cards, hidden roles, team scoring, and round-based outcomes.

## Features

- Fast room creation for social party games
- Join flow via room link and QR code
- Support for solo, pair, and team-based games
- Per-game state such as rounds, timers, hidden assignments, cards, votes, and scoreboards
- Reactions, comments, and ratings after play
- Admin area for users, transactions, and room limits
- Self-service room creation support

## Supported Games

The current app UI and server logic support these game modes:

- Never Have I Ever
- Truth or Drink
- Most Likely
- Paranoia
- Rhyme Time
- Higher or Lower
- Verbal Charades
- Taboo Lite
- Would You Rather
- Pick a Card
- Kings Cup
- Catherine's Special
- Story Building
- Imposter
- TriviYay
- Truth or Lie
- Codenames
- Memory Chain
- Guess The Number
- Connect the Letters
- Ghost Tears
- Joker Loop
- Who Am I
- Name The Song
- Guess The Movie
- Ride the Bus

## Game Types In The Project

- Prompt deck games: `Never Have I Ever`, `Truth or Drink`, `Most Likely`, `Paranoia`, `Would You Rather`, `Truth or Lie`
- Word and speaking games: `Rhyme Time`, `Verbal Charades`, `Taboo Lite`, `Story Building`, `Connect the Letters`, `Ghost Tears`
- Card and deck games: `Pick a Card`, `Kings Cup`, `Joker Loop`, `Ride the Bus`
- Hidden-role and identity games: `Imposter`, `Codenames`, `Who Am I`
- Score and challenge games: `TriviYay`, `Higher or Lower`, `Guess The Number`, `Memory Chain`, `Name The Song`, `Guess The Movie`
- Custom house-party modes: `Catherine's Special`

## Tech Stack

- Next.js 16 with App Router
- React 19 and TypeScript
- tRPC and React Query
- Prisma ORM
- PostgreSQL
- Tailwind CSS
- Radix UI / shadcn-style UI components

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create `.env` with the required values:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

3. Apply database migrations:

```bash
npx prisma migrate dev
```

4. Start the app:

```bash
npm run dev
```

5. Open `http://localhost:3000`

## Available Scripts

- `npm run dev` starts the Next.js dev server
- `npm run build` builds the production app
- `npm run start` runs the production server
- `npm run lint` runs ESLint
- `postinstall` generates the Prisma client

## Project Structure

- `src/app` routes, pages, layouts, and room UI
- `src/modules` server procedures for games, auth, profiles, comments, and transactions
- `src/trpc` tRPC client and server setup
- `src/components` app and UI components
- `prisma/schema.prisma` database schema
- `prisma/migrations` database migrations, including game additions
- `public` static assets and sound effects

## Data Model Notes

- Games are stored in the `Game` table
- Prompt content, word lists, and card data are stored in the `Question` table
- Active room state is persisted in the `Room` table
- Players, reactions, comments, sessions, and transactions are tracked in their own tables
- Several newer games use structured JSON stored in `Room.currentAnswer` for per-room game state

## Admin And Permissions

- `/transactions` is the admin dashboard for transaction and user management
- Room creation availability depends on the signed-in user's transaction profile
- Expiry dates and assigned room limits are enforced in the app

## Notes

- The README previously listed only part of the game catalog; the list above reflects the current project state
- Game content is database-backed, so local development depends on your migrated database containing the expected records
- Some game modes depend on seeded or migrated `Game` and `Question` data from Prisma migrations
