import type { PokerPlayerAction } from "@/modules/games/lib/room-state";

export const POKER_HAND_RANKINGS = [
  "Royal Flush",
  "Straight Flush",
  "Four of a Kind",
  "Full House",
  "Flush",
  "Straight",
  "Three of a Kind",
  "Two Pair",
  "Pair",
  "High Card",
];

export function getPokerPhaseLabel(phase: string): string {
  if (phase === "PRE_FLOP") return "Pre-Flop";
  if (phase === "FLOP") return "Flop";
  if (phase === "TURN") return "Turn";
  if (phase === "RIVER") return "River";
  return "Showdown";
}

export function getPokerActionLabel(action: PokerPlayerAction): string {
  if (action === "CHECK") return "Checked";
  if (action === "CALL") return "Called";
  if (action === "BET") return "Bet";
  if (action === "FOLD") return "Folded";
  return "Waiting";
}

export function getPokerMinimumAggressiveBetTotal({
  currentBet,
  currentStreetBet,
  stack,
  betStep,
  bigBlindAmount,
}: {
  currentBet: number;
  currentStreetBet: number;
  stack: number;
  betStep: number;
  bigBlindAmount: number;
}): number {
  const minimumTarget =
    currentBet > 0
      ? currentBet + betStep
      : Math.max(betStep, Math.ceil(bigBlindAmount / betStep) * betStep);

  return Math.min(stack + currentStreetBet, minimumTarget);
}

export function getPokerActionSummary(
  action: PokerPlayerAction,
  amount: number | null,
): string {
  if (action === "BET") {
    return amount && amount > 0 ? `Bet ${amount}` : "Bet";
  }
  if (action === "CALL") {
    return amount && amount > 0 ? `Called ${amount}` : "Called";
  }
  if (action === "CHECK") return "Checked";
  if (action === "FOLD") return "Folded";
  return "Waiting for the first action";
}
