import { gamesRouter } from "@/modules/games/server/procedures";
import { createTRPCRouter } from "../init";
import { authRouter } from "@/modules/auth/server/procedures";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  games: gamesRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
