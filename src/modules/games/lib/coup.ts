import type { CoupRole } from "./room-state";

export type CoupAction = {
  name: string;
  claim: CoupRole | "None";
  effect: string;
  cost?: string;
  block?: string;
};

export type CoupReferenceSection = {
  title: string;
  items: string[];
};

export const COUP_OBJECTIVE =
  "Be the last player with at least one face-down influence card.";

export const COUP_SETUP = [
  "Each player gets 2 face-down character cards and 2 coins.",
  "Keep coins visible and keep your character cards secret.",
  "The remaining character cards stay face down as the court deck.",
  "On your turn, choose 1 action. Other players may challenge or block when allowed.",
] as const;

export const COUP_GENERAL_ACTIONS: readonly CoupAction[] = [
  {
    name: "Income",
    claim: "None",
    effect: "Take 1 coin from the treasury.",
  },
  {
    name: "Foreign Aid",
    claim: "None",
    effect: "Take 2 coins from the treasury.",
    block: "Blocked by Duke",
  },
  {
    name: "Coup",
    claim: "None",
    cost: "7 coins",
    effect: "Choose a player to lose 1 influence. This cannot be blocked.",
  },
] as const;

export const COUP_CHARACTER_ACTIONS: readonly CoupAction[] = [
  {
    name: "Duke",
    claim: "DUKE",
    effect: "Take 3 coins from the treasury.",
    block: "Blocks Foreign Aid",
  },
  {
    name: "Assassin",
    claim: "ASSASSIN",
    cost: "3 coins",
    effect: "Choose a player to lose 1 influence.",
    block: "Blocked by Contessa",
  },
  {
    name: "Captain",
    claim: "CAPTAIN",
    effect: "Steal up to 2 coins from another player.",
    block: "Blocked by Captain or Ambassador",
  },
  {
    name: "Ambassador",
    claim: "AMBASSADOR",
    effect:
      "Draw 2 cards from the court deck, choose which 2 cards to keep total, then return the rest.",
    block: "Blocks Captain stealing",
  },
  {
    name: "Contessa",
    claim: "CONTESSA",
    effect: "No active turn action.",
    block: "Blocks Assassin attacks against you",
  },
] as const;

export const COUP_TURN_FLOW: readonly CoupReferenceSection[] = [
  {
    title: "1. Declare",
    items: [
      "Choose one action and announce it clearly.",
      "You may claim a character you do not really have.",
    ],
  },
  {
    title: "2. Challenge or Block",
    items: [
      "Any player may challenge a claimed character action or block.",
      "If the action can be blocked, the targeted player may announce a legal block.",
    ],
  },
  {
    title: "3. Resolve the claim",
    items: [
      "If challenged and correct, reveal the card, shuffle it back, then draw a replacement.",
      "If challenged and wrong, lose 1 influence and the action or block fails.",
    ],
  },
  {
    title: "4. Apply the result",
    items: [
      "Take coins, steal, exchange, or make a player reveal influence.",
      "If you start a turn with 10 or more coins, you must Coup.",
    ],
  },
] as const;

export const COUP_BLUFFING_NOTES = [
  "Anyone can challenge, even if they are not the target.",
  "When you lose influence, you choose which card to reveal.",
  "A face-up card no longer gives you that power.",
  "There are only 3 copies of each character in the deck, so table memory matters.",
] as const;

export const COUP_HOUSE_RULES = [
  "Use the built-in points and drinks however your table prefers.",
  "Common party rule: drink when you lose influence, bonus drink when you are eliminated.",
  "Common winner rule: last player standing gets +1 point.",
] as const;
