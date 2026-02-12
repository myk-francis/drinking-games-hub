import { z } from "zod";

const teamInfoSchema = z.object({
  teamName: z.string(),
  players: z.array(z.string()),
});

const rawSelfServicePayloadSchema = z.object({
  version: z.number().int().optional().default(1),
  selectedGame: z.string().min(1),
  players: z.array(z.string()).optional().default([]),
  selectedRounds: z.number().int().min(0).optional().default(0),
  teamsInfo: z.array(teamInfoSchema).optional().default([]),
});

export type SelfServicePayload = z.infer<typeof rawSelfServicePayloadSchema>;

export const MIN_PLAYERS_BY_GAME: Record<string, number> = {
  paranoia: 3,
  "kings-cup": 2,
  "taboo-lite": 4,
  "most-likely": 3,
  "verbal-charades": 4,
  "higher-lower": 2,
  "never-have-i-ever": 2,
  "truth-or-drink": 2,
  "catherines-special": 2,
  "would-you-rather": 3,
  "pick-a-card": 3,
  imposter: 4,
  "truth-or-lie": 2,
  "memory-chain": 2,
};

const uniqueTrimmed = (items: string[]) =>
  Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

export function normalizeSelfServicePayload(
  payload: SelfServicePayload,
): SelfServicePayload {
  const normalizedTeamsInfo = payload.teamsInfo
    .map((team) => ({
      teamName: team.teamName.trim(),
      players: uniqueTrimmed(team.players),
    }))
    .filter((team) => team.teamName.length > 0 && team.players.length > 0);

  return {
    version: 1,
    selectedGame: payload.selectedGame.trim(),
    players: uniqueTrimmed(payload.players),
    selectedRounds: payload.selectedRounds,
    teamsInfo: normalizedTeamsInfo,
  };
}

export function parseSelfServicePayload(
  rawPayload: string,
): { success: true; data: SelfServicePayload } | { success: false; error: string } {
  try {
    const parsedJson = JSON.parse(rawPayload);
    const parsed = rawSelfServicePayloadSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return { success: false, error: "Invalid payload format." };
    }
    const normalized = normalizeSelfServicePayload(parsed.data);
    return { success: true, data: normalized };
  } catch {
    return { success: false, error: "Invalid JSON." };
  }
}

export function getSelfServiceValidationError(
  payload: SelfServicePayload,
): string | null {
  if (!payload.selectedGame) {
    return "Game is required.";
  }

  if (payload.selectedGame === "triviyay") {
    if (!payload.teamsInfo.length) {
      return "Triviyay requires at least one team with players.";
    }
    return null;
  }

  const requiredPlayers = MIN_PLAYERS_BY_GAME[payload.selectedGame];
  if (requiredPlayers && payload.players.length < requiredPlayers) {
    return `This game needs at least ${requiredPlayers} players.`;
  }

  return null;
}
