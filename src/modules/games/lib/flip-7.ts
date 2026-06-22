import type { Flip7ActionType, Flip7ModifierType } from "./room-state";

export type Flip7ReferenceSection = {
  title: string;
  items: string[];
};

export const FLIP7_OBJECTIVE =
  "Push your luck, avoid duplicate numbers, and be the first player to finish a round with the highest score over 200.";

export const FLIP7_ACTION_LABELS: Record<Flip7ActionType, string> = {
  FREEZE: "Freeze",
  FLIP_THREE: "Flip Three",
  SECOND_CHANCE: "Second Chance",
};

export const FLIP7_MODIFIER_LABELS: Record<Flip7ModifierType, string> = {
  PLUS_TWO: "+2",
  PLUS_FOUR: "+4",
  PLUS_SIX: "+6",
  PLUS_EIGHT: "+8",
  PLUS_TEN: "+10",
  MULTIPLY_TWO: "x2",
};

export const FLIP7_SETUP = [
  "Play with 3 or more players.",
  "Use the app's Flip 7 deck variant with number cards 1 through 12 only.",
  "Each round starts with one face-up card dealt to players in order.",
  "After the initial deal, players choose Hit or Stay on their turns.",
] as const;

export const FLIP7_TURN_FLOW: readonly Flip7ReferenceSection[] = [
  {
    title: "1. Start the round",
    items: [
      "Each player is dealt one face-up card before decisions begin.",
      "Action cards from the initial deal resolve immediately before the deal continues.",
    ],
  },
  {
    title: "2. Choose Hit or Stay",
    items: [
      "Hit to reveal another card.",
      "Stay to bank your current round total and leave the round safely.",
    ],
  },
  {
    title: "3. Resolve cards",
    items: [
      "Duplicate number cards bust you unless a Second Chance saves you.",
      "Freeze knocks a player out of the round but keeps their current score.",
      "Flip Three makes the chosen player reveal up to three extra cards.",
    ],
  },
  {
    title: "4. Score the round",
    items: [
      "Busted players score 0 for the round.",
      "Add numbers first, apply x2 to numbers only, then add plus cards, then add the +15 Flip 7 bonus.",
    ],
  },
];

export const FLIP7_SCORING_NOTES = [
  "Seven unique number cards immediately end the round and award +15 bonus points.",
  "Second Chance only protects against busting from a duplicate number.",
  "If multiple players are tied above 200, keep playing rounds until there is one winner.",
] as const;
