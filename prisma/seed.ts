import { PrismaClient, Prisma } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();

const userData: Prisma.UserCreateInput[] = [
  {
    username: "myk",
    passcode: "myk@francis",
  },
  {
    username: "bikers",
    passcode: "bikers",
  },
];

const gameData: Prisma.GameCreateInput[] = [
  {
    code: "never-have-i-ever",
    name: "Never Have I Ever",
    description:
      "Classic confession game. Players drink if they've done the statement.",
    questions: {
      create: [
        {
          text: "Never have I ever skipped class or work to stay in bed",
        },
        {
          text: "Never have I ever lied about my age",
        },
        {
          text: "Never have I ever had a crush on a teacher or boss",
        },
        {
          text: "Never have I ever pretended to be sick to avoid something",
        },
        {
          text: "Never have I ever sung karaoke in public",
        },
        {
          text: "Never have I ever been in a food fight",
        },
        {
          text: "Never have I ever forgotten someone's name right after being introduced",
        },
        {
          text: "Never have I ever stalked an ex on social media",
        },
        {
          text: "Never have I ever laughed so hard I cried",
        },
        {
          text: "Never have I ever had a one-night stand",
        },
        {
          text: "Never have I ever gone skinny dipping",
        },
        {
          text: "Never have I ever broken a bone",
        },
        {
          text: "Never have I ever been arrested or detained",
        },
        {
          text: "Never have I ever cheated on a test or exam",
        },
        {
          text: "Never have I ever eaten something off the floor",
        },
        {
          text: "Never have I ever lied on my resume",
        },
        {
          text: "Never have I ever had a celebrity crush meet-and-greet",
        },
        {
          text: "Never have I ever been kicked out of a bar or club",
        },
        {
          text: "Never have I ever accidentally sent a text to the wrong person",
        },
        {
          text: "Never have I ever pretended to understand something I didn't",
        },
      ],
    },
  },
  {
    code: "truth-or-drink",
    name: "Truth or Drink",
    description:
      "Answer personal questions or take a drink. No dares, just truths!.",
    questions: {
      create: [
        {
          text: "What's the most embarrassing thing you've ever done on a date?",
        },
        {
          text: "Have you ever pretended to like a gift you actually hated?",
        },
        {
          text: "What's your most irrational fear?",
        },
        {
          text: "Have you ever lied to get out of a social event?",
        },
        {
          text: "What's the worst haircut you've ever had?",
        },
        {
          text: "Have you ever had a crush on a friend's partner?",
        },
        {
          text: "What's the most childish thing you still do?",
        },
        {
          text: "Have you ever snooped through someone's phone?",
        },
        {
          text: "What's your most embarrassing childhood memory?",
        },
        {
          text: "Have you ever pretended to know something you didn't?",
        },
        {
          text: "What's the worst advice you've ever given someone?",
        },
        {
          text: "Have you ever laughed at completely the wrong moment?",
        },
        {
          text: "What's your guilty pleasure that you're embarrassed about?",
        },
        {
          text: "What's the most ridiculous thing you believed as a child?",
        },
        {
          text: "Have you ever had an imaginary friend as an adult?",
        },
        {
          text: "What's the weirdest thing you've ever eaten?",
        },
        {
          text: "Have you ever been caught in a really awkward lie?",
        },
        {
          text: "What's your most embarrassing autocorrect fail?",
        },
        {
          text: "Have you ever pretended to be someone else online?",
        },
        {
          text: "What's the strangest dream you remember having?",
        },
      ],
    },
  },
  {
    code: "most-likely",
    name: "Most Likely To",
    description:
      "Vote on who's most likely to do something. Person with most votes drinks!",
    questions: {
      create: [
        {
          text: "Most likely to become famous overnight",
        },
        {
          text: "Most likely to survive a zombie apocalypse",
        },
        {
          text: "Most likely to marry someone they just met in Vegas",
        },
        {
          text: "Most likely to become a millionaire before 30",
        },
        {
          text: "Most likely to get lost in their own neighborhood",
        },
        {
          text: "Most likely to eat something expired and not notice",
        },
        {
          text: "Most likely to become a crazy cat person",
        },
        {
          text: "Most likely to accidentally dye their hair the wrong color",
        },
        {
          text: "Most likely to trip on a completely flat surface",
        },
        {
          text: "Most likely to forget their own birthday",
        },
        {
          text: "Most likely to become a reality TV star",
        },
        {
          text: "Most likely to get kicked out of a library for being too loud",
        },
        {
          text: "Most likely to adopt 10 dogs at once",
        },
        {
          text: "Most likely to win the lottery and immediately lose the ticket",
        },
        {
          text: "Most likely to become a professional sleeper",
        },
        {
          text: "Most likely to start a cult accidentally",
        },
        {
          text: "Most likely to become a hermit and live in the woods",
        },
        {
          text: "Most likely to invent something completely useless but popular",
        },
        {
          text: "Most likely to get arrested for something completely ridiculous",
        },
        {
          text: "Most likely to become a viral meme",
        },
        {
          text: "Most likely to pregnate two women at the same time",
        },
        {
          text: "Most likely to cheat on their partner in a relationship",
        },
        {
          text: "Most likely to travel to another region for sex",
        },
        {
          text: "Most likely to forgive their partner for cheating",
        },
      ],
    },
  },

  {
    code: "higher-lower",
    name: "Higher or Lower",
    description:
      "Guess if the next card is higher or lower. Wrong guess = drink!",
  },
];

export async function main() {
  for (const u of gameData) {
    await prisma.game.create({ data: u });
  }
  for (const u of userData) {
    await prisma.user.create({ data: u });
  }
}

main();
