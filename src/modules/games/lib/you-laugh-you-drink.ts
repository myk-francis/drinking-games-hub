export const YOU_LAUGH_YOU_DRINK_RESULTS = [
  "LAUGHED",
  "STRAIGHT_FACE",
] as const;

export type YouLaughYouDrinkResult =
  (typeof YOU_LAUGH_YOU_DRINK_RESULTS)[number];

export function buildDirectedPairs(playerIds: string[]): string[] {
  const pairs: string[] = [];

  for (let i = 0; i < playerIds.length; i += 1) {
    for (let j = 0; j < playerIds.length; j += 1) {
      if (i === j) {
        continue;
      }

      pairs.push([playerIds[i], playerIds[j]].join("&"));
    }
  }

  return pairs;
}

export function getYouLaughYouDrinkOutcome(result: YouLaughYouDrinkResult) {
  if (result === "LAUGHED") {
    return {
      attacker: { points: 1, drinks: 0 },
      target: { points: 0, drinks: 1 },
    };
  }

  return {
    attacker: { points: 0, drinks: 1 },
    target: { points: 1, drinks: 0 },
  };
}
