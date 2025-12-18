import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers"; // Or use your cookie lib
import { nanoid } from "nanoid";

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

      // Create session
      const sessionId = nanoid();
      const expires = new Date(Date.now() + 1000 * 60 * 60 * 72); // 1 day

      await prisma.session.create({
        data: {
          id: sessionId,
          userId: user.id,
          expiresAt: expires,
        },
      });

      // Set cookie (you might need to do this via a helper if not SSR)
      (await cookies()).set("sessionId", sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        expires,
      });

      // Success — optionally return user info (exclude sensitive data!)
      return {
        id: user.id,
        username: user.username,
      };
    }),

  logout: baseProcedure.mutation(async () => {
    const sessionId = (await cookies()).get("sessionId")?.value;
    if (sessionId) {
      await prisma.session.delete({ where: { id: sessionId } });
      (await cookies()).delete("sessionId");
    }
    return { success: true };
  }),

  getCurrentUser: baseProcedure.query(async () => {
    const sessionId = (await cookies()).get("sessionId")?.value;
    if (!sessionId) {
      return null; // No session found
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true }, // Include user data
    });

    if (!session || !session.user) {
      return null; // Session or user not found
    }

    return {
      id: session.user.id,
      username: session.user.username,
      isAdmin: session.user.isAdmin,
    };
  }),

  getUsers: baseProcedure.query(async () => {
    const sessionId = (await cookies()).get("sessionId")?.value;
    if (!sessionId) {
      return null; // No session found
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true }, // Include user data
    });

    if (!session || !session.user || !session.user.isAdmin) {
      return null; // Session or user not found
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
      },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.username,
      value: user.id,
    }));
  }),
});
