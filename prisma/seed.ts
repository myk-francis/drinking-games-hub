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
      ],
    },
  },
  {
    code: "rhyme-time",
    name: "Rhyme Time",
    description: "Keep the rhyme going! Break the chain and drink.",
    questions: {
      create: [
        {
          text: "cat",
        },
        {
          text: "dog",
        },
        {
          text: "fun",
        },
        {
          text: "sun",
        },
        {
          text: "tree",
        },
        {
          text: "bee",
        },
        {
          text: "car",
        },
        {
          text: "star",
        },
        {
          text: "book",
        },
        {
          text: "look",
        },
        {
          text: "play",
        },
        {
          text: "day",
        },
        {
          text: "night",
        },
        {
          text: "light",
        },
        {
          text: "run",
        },
        {
          text: "gun",
        },
        {
          text: "love",
        },
        {
          text: "dove",
        },
        {
          text: "time",
        },
        {
          text: "rhyme",
        },
        {
          text: "game",
        },
        {
          text: "name",
        },
        {
          text: "song",
        },
        {
          text: "long",
        },
        {
          text: "dance",
        },
        {
          text: "chance",
        },
        {
          text: "dream",
        },
        {
          text: "cream",
        },
        {
          text: "fire",
        },
        {
          text: "wire",
        },
        {
          text: "blue",
        },
        {
          text: "true",
        },
      ],
    },
  },
  {
    code: "higher-lower",
    name: "Higher or Lower",
    description:
      "Guess if the next card is higher or lower. Wrong guess = drink!",
    questions: {
      create: [
        {
          text: "1",
        },
        {
          text: "2",
        },
        {
          text: "3",
        },
        {
          text: "100",
        },
        {
          text: "50",
        },
        {
          text: "4",
        },
        {
          text: "5",
        },
        {
          text: "6",
        },
        {
          text: "7",
        },
        {
          text: "8",
        },
        {
          text: "9",
        },
        {
          text: "10",
        },
        {
          text: "1000",
        },
        {
          text: "900",
        },
        {
          text: "800",
        },
        {
          text: "700",
        },
        {
          text: "600",
        },
        {
          text: "500",
        },
        {
          text: "400",
        },
        {
          text: "300",
        },
        {
          text: "200",
        },
        {
          text: "100",
        },
      ],
    },
  },
  {
    code: "charades-drink",
    name: "Charades & Drink",
    description: "Act out prompts. Team that guesses wrong drinks!",
    questions: {
      create: [
        {
          text: "Drunk giraffe trying to dance",
        },
        {
          text: "Robot having an existential crisis",
        },
        {
          text: "Penguin at a job interview",
        },
        {
          text: "Zombie trying to order coffee",
        },
        {
          text: "Superhero afraid of heights",
        },
        {
          text: "Cat stuck in a washing machine",
        },
        {
          text: "Alien learning to drive",
        },
        {
          text: "Vampire at the dentist",
        },
        {
          text: "Ninja in a library",
        },
        {
          text: "Pirate at a yoga class",
        },
        {
          text: "Ghost trying to use a smartphone",
        },
        {
          text: "Dinosaur on a first date",
        },
        {
          text: "Wizard stuck in traffic",
        },
        {
          text: "Mermaid at a desert",
        },
        {
          text: "Dragon with allergies",
        },
      ],
    },
  },
  {
    code: "word-association",
    name: "Word Association",
    description: "Say related words quickly. Hesitate too long = drink!",
    questions: {
      create: [
        {
          text: "Ocean",
        },
        {
          text: "Fire",
        },
        {
          text: "Music",
        },
        {
          text: "Food",
        },
        {
          text: "Travel",
        },
        {
          text: "Love",
        },
        {
          text: "Time",
        },
        {
          text: "Dream",
        },
        {
          text: "Winter",
        },
        {
          text: "Summer",
        },
        {
          text: "Night",
        },
        {
          text: "Morning",
        },
        {
          text: "Adventure",
        },
        {
          text: "Mystery",
        },
        {
          text: "Magic",
        },
      ],
    },
  },
  {
    code: "Countdown Game",
    name: "Countdown Game",
    description: "Count down from 21. Say multiple numbers and drink!",
    questions: {
      create: [
        {
          text: "Players take turns counting down from 21. You can say 1, 2, or 3 consecutive numbers. Whoever says '1' drinks!",
        },
      ],
    },
  },
  {
    code: "story-building",
    name: "Story Building",
    description: "Build a story together. Break the flow = drink!",
    questions: {
      create: [
        {
          text: "Once upon a time in a magical forest...",
        },
        {
          text: "It was a dark and stormy night when...",
        },
        {
          text: "The spaceship landed in the middle of the city and...",
        },
        {
          text: "Sarah opened the mysterious box and discovered...",
        },
        {
          text: "The last person on Earth heard a knock at the door...",
        },
        {
          text: "The time machine malfunctioned and suddenly...",
        },
      ],
    },
  },
  {
    code: "two-truths-lie",
    name: "Two Truths & A Lie",
    description: "Guess the lie. Wrong guesses drink!",
    questions: {
      create: [
        {
          text: "Tell about your most embarrassing moments",
        },
        {
          text: "Share your childhood fears and adventures",
        },
        {
          text: "Describe your weirdest food experiences",
        },
        {
          text: "Talk about your dating disasters",
        },
        {
          text: "Share your travel mishaps",
        },
        {
          text: "Describe your workplace awkwardness",
        },
      ],
    },
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
