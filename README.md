# Drinking Games Hub

Drinking Games Hub is a multiplayer party game platform where hosts can create rooms, invite friends, and play a collection of social drinking games in the browser. It combines quick room setup, shareable links/QR codes, and game-specific flows (rounds, teams, voting, timers) into a single Next.js app.

**Highlights**
- Create a room, add players, and launch a game in seconds.
- Share rooms with a link or QR code for easy join.
- Per-game experiences: rounds, editions, timers, teams, and voting.
- Live scoreboards for players or teams (for trivia-style games).
- Post-game comments and ratings.
- Admin tools for user management and room limits.

**Game Modes (UI Supported)**
- Never Have I Ever
- Truth or Drink
- Most Likely
- Rhyme Time
- Higher or Lower
- Verbal Charades
- Would You Rather
- Pick a Card
- Catherine's Special
- Story Building
- Imposter
- TriviYay (teams + scoring)
- Truth or Lie

**Tech Stack**
- Next.js 15 (App Router)
- React 19 + TypeScript
- tRPC + React Query
- Prisma + PostgreSQL
- Tailwind CSS + Radix UI

**Local Development**
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` with required variables:
   ```bash
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```
3. Run Prisma migrations (creates the schema in your database):
   ```bash
   npx prisma migrate dev
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

**Scripts**
- `npm run dev` - start Next.js in dev mode (Turbopack)
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - lint the codebase
- `postinstall` runs `prisma generate`

**Project Structure**
- `src/app` - routes, pages, and layouts
- `src/modules` - server-side game, auth, transaction, and comment logic
- `src/trpc` - tRPC router + client setup
- `prisma/schema.prisma` - database schema
- `public` - static assets

**Admin & Permissions**
- The `/transactions` route is an admin-only dashboard for user and transaction management.
- Room creation limits are enforced based on the user's transaction profile.

**Notes**
- Game content (questions, editions, etc.) is stored in the database. Make sure your DB is seeded or populated before use.

If you want this README to include deployment steps, seed scripts, or screenshots, tell me what you prefer and I will add them.
