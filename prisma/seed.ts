import { Prisma, PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

const userData: Prisma.UserCreateInput[] = [
  {
    username: "myk",
    passcode: "myk",
  },
  {
    username: "cate",
    passcode: "cate",
  },
];

export async function main() {
  // for (const u of gameData) {
  //   await prisma.game.create({ data: u });
  // }
  for (const u of userData) {
    await prisma.user.create({ data: u });
  }
}

main();
