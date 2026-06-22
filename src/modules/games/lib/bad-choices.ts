import type { BadChoicesRoomState } from "@/modules/games/lib/room-state";

function shuffleArray<T>(array: T[]) {
  const next = [...array];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

export function refillBadChoicesDrawPile(state: BadChoicesRoomState) {
  if (state.drawPile.length > 0 || state.discardPile.length === 0) {
    return;
  }

  state.drawPile = shuffleArray(state.discardPile);
  state.discardPile = [];
}

export function drawBadChoicesCards(
  state: BadChoicesRoomState,
  count: number,
) {
  const drawnCards: number[] = [];

  for (let index = 0; index < count; index += 1) {
    refillBadChoicesDrawPile(state);
    const nextCardId = state.drawPile.shift() ?? null;
    if (nextCardId === null) {
      break;
    }
    drawnCards.push(nextCardId);
  }

  return drawnCards;
}

export function redrawBadChoicesCards(args: {
  state: BadChoicesRoomState;
  playerId: string;
  cardIds: number[];
}) {
  const { state, playerId, cardIds } = args;

  if (cardIds.length === 0) {
    throw new Error("Pick at least one card to discard.");
  }

  const uniqueCardIds = [...new Set(cardIds)];
  const currentHand = state.handsByPlayerId[playerId] ?? [];
  if (uniqueCardIds.some((cardId) => !currentHand.includes(cardId))) {
    throw new Error("You can only discard cards from your hand.");
  }

  state.handsByPlayerId[playerId] = currentHand.filter(
    (cardId) => !uniqueCardIds.includes(cardId),
  );
  state.discardPile.push(...uniqueCardIds);

  const replacementCards = drawBadChoicesCards(state, uniqueCardIds.length);
  state.handsByPlayerId[playerId] = [
    ...(state.handsByPlayerId[playerId] ?? []),
    ...replacementCards,
  ];

  return replacementCards;
}
