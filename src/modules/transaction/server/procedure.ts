import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

export const transactionRouter = createTRPCRouter({
  createTransaction: baseProcedure
    .input(
      z.object({
        userId: z.string(),
        profileType: z.string(),
        profileName: z.string(),
        amount: z.number().int(),
        assignedRooms: z.number().int(),
        expiryDate: z.string().or(z.date()),
      })
    )
    .mutation(async ({ input }) => {
      const transaction = await prisma.transaction.create({
        data: {
          userId: input.userId,
          profileType: input.profileType,
          profileName: input.profileName,
          amount: input.amount,
          assignedRooms: input.assignedRooms,
          usedRooms: 0,
          expiryDate: new Date(input.expiryDate),
        },
      });
      return transaction;
    }),

  editTransaction: baseProcedure
    .input(
      z.object({
        id: z.string(),
        userId: z.string().optional(),
        profileType: z.string().optional(),
        profileName: z.string().optional(),
        amount: z.number().int().optional(),
        assignedRooms: z.number().int().optional(),
        expiryDate: z.string().or(z.date()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      const transaction = await prisma.transaction.update({
        where: { id },
        data: {
          ...updateData,
          ...(updateData.expiryDate && {
            expiryDate: new Date(updateData.expiryDate),
          }),
        },
      });
      return transaction;
    }),

  deleteTransaction: baseProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const transaction = await prisma.transaction.delete({
        where: { id: input.id },
      });
      return transaction;
    }),

  getManyTransactions: baseProcedure
    .input(
      z
        .object({
          userId: z.string().optional(),
          limit: z.number().int().min(1).max(100).optional(),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const limit = input?.limit ?? 50;
      const { cursor, userId } = input ?? {};

      const transactions = await prisma.transaction.findMany({
        take: limit + 1,
        where: userId ? { userId } : undefined,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined = undefined;
      if (transactions.length > limit) {
        const nextItem = transactions.pop();
        nextCursor = nextItem!.id;
      }

      return {
        transactions,
        nextCursor,
      };
    }),

  getCurrentTransaction: baseProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const transaction = await prisma.transaction.findUnique({
        where: { id: input.id },
      });
      return transaction;
    }),

  getUserTransaction: baseProcedure.query(async () => {
    const sessionId = (await cookies()).get("sessionId")?.value;
    if (!sessionId) return null;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session?.user) return null;

    // Use findFirst with orderBy to get the single most recent record
    const transaction = await prisma.transaction.findFirst({
      where: {
        userId: session.user.id,
        closed: false,
      },
      orderBy: {
        createdAt: "desc", // Sorts by newest first
      },
    });

    return transaction;
  }),

  getUserTransactionAdmin: baseProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const sessionId = (await cookies()).get("sessionId")?.value;
      if (!sessionId) return null;

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
      });

      if (!session?.user || !session.user.isAdmin) return null;

      // Use findFirst with orderBy to get the single most recent record
      const transaction = await prisma.transaction.findFirst({
        where: {
          userId: input.userId,
        },
        orderBy: {
          createdAt: "desc", // Sorts by newest first
        },
      });

      return transaction;
    }),

  transactionsThatExpireThisMonth: baseProcedure.query(async () => {
    const transactions = await prisma.transaction.findMany({
      where: {
        expiryDate: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        },
        OR: [{ profileType: "GUEST" }, { profileType: "PREMIUM" }],
        closed: false,
      },
    });
    return transactions;
  }),

  generateNewTransactionsForThisMonth: baseProcedure.mutation(async () => {
    try {
      const sessionId = (await cookies()).get("sessionId")?.value;
      if (!sessionId) return null;

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
      });

      if (!session?.user || !session.user.isAdmin) return null;

      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const transactions = await prisma.transaction.findMany({
        where: {
          expiryDate: {
            gte: startDate,
            lte: endDate,
          },
          OR: [{ profileType: "GUEST" }, { profileType: "PREMIUM" }],
          closed: false,
        },
      });

      const generatedTransactions = await prisma.transaction.createMany({
        data: transactions.map((t) => ({
          userId: t.userId,
          profileType: t.profileType,
          profileName: t.profileName,
          amount: t.amount,
          assignedRooms: t.assignedRooms,
          usedRooms: 0,
          closed: false,
          expiryDate: endDate,
          createdAt: new Date(),
        })),
      });

      await prisma.transaction.updateMany({
        where: {
          expiryDate: {
            gte: startDate,
            lte: lastDayOfMonth,
          },
          OR: [{ profileType: "GUEST" }, { profileType: "PREMIUM" }],
          closed: false,
        },
        data: {
          closed: true,
        },
      });

      return generatedTransactions.count;
    } catch (error) {
      console.error("Error generating new transactions:", error);
      throw error;
    }
  }),
});
