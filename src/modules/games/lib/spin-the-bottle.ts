export type SpinBottleMode =
  | "CLASSIC"
  | "PARTY"
  | "FLIRTY"
  | "SAFE"
  | "CHAOTIC";

export type SpinBottleModeOption = {
  id: number;
  value: number;
  code: SpinBottleMode;
  shortName: string;
  name: string;
  actions: string[];
};

export const SPIN_BOTTLE_MODE_OPTIONS: SpinBottleModeOption[] = [
  {
    id: 1,
    value: 1,
    code: "CLASSIC",
    shortName: "Classic",
    name: "Classic: kiss / truth / dare",
    actions: ["Kiss", "Truth", "Dare"],
  },
  {
    id: 2,
    value: 2,
    code: "PARTY",
    shortName: "Party",
    name: "Party: truth / dare / drink / group challenge",
    actions: ["Truth", "Dare", "Drink", "Group Challenge"],
  },
  {
    id: 3,
    value: 3,
    code: "FLIRTY",
    shortName: "Flirty",
    name: "Flirty: compliment / kiss / confession / pick a person",
    actions: ["Compliment", "Kiss", "Confession", "Pick a Person"],
  },
  {
    id: 4,
    value: 4,
    code: "SAFE",
    shortName: "Safe",
    name: "Safe: fun question / silly dare / trivia / mini challenge",
    actions: ["Fun Question", "Silly Dare", "Trivia", "Mini Challenge"],
  },
  {
    id: 5,
    value: 5,
    code: "CHAOTIC",
    shortName: "Chaotic",
    name: "Chaotic: wildcard / steal turn / reverse / everyone drinks",
    actions: ["Wildcard", "Steal Turn", "Reverse", "Everyone Drinks"],
  },
];

export function getSpinBottleModeByValue(value: number): SpinBottleModeOption {
  return (
    SPIN_BOTTLE_MODE_OPTIONS.find((option) => option.value === value) ??
    SPIN_BOTTLE_MODE_OPTIONS[0]
  );
}

export function getSpinBottleModeByCode(code: SpinBottleMode): SpinBottleModeOption {
  return (
    SPIN_BOTTLE_MODE_OPTIONS.find((option) => option.code === code) ??
    SPIN_BOTTLE_MODE_OPTIONS[0]
  );
}
