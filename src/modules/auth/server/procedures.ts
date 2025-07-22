import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { prisma } from "@/lib/db";

export const authRouter = createTRPCRouter({
  login: baseProcedure
    .input(
      z.object({
        username: z.string(),
        passcode: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { username: input.username },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Compare passcode — in real apps, use bcrypt for hashed passwords!
      if (user.passcode !== input.passcode) {
        throw new Error("Invalid credentials");
      }

      // Success — optionally return user info (exclude sensitive data!)
      return {
        id: user.id,
        username: user.username,
      };
    }),
});
