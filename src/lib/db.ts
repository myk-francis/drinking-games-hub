import { PrismaClient } from "../../prisma/generated/prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
export const prisma = new PrismaClient({ adapter });

// const globalForPrisma = global as unknown as {
//   prisma: PrismaClient | undefined;
// };

// export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
