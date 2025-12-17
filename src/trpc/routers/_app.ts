import { gamesRouter } from "@/modules/games/server/procedures";
import { createTRPCRouter } from "../init";
import { authRouter } from "@/modules/auth/server/procedures";
import { profileRouter } from "@/modules/profile/server/procedures";
import { transactionRouter } from "@/modules/transaction/server/procedure";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  games: gamesRouter,
  profile: profileRouter,
  transaction: transactionRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
