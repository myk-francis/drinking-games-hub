import {
  ArrowUpRight,
  Brain,
  Bus,
  ClipboardPaste,
  Compass,
  Crown,
  Eye,
  Film,
  FlaskConical,
  Gamepad2,
  Ghost,
  Hash,
  Heart,
  Layers,
  Mic,
  Rainbow,
  Scale,
  ScrollText,
  ShieldQuestion,
  Shuffle,
  Sparkles,
  Theater,
  Type,
  Users,
  VenetianMask,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type GameConfig = {
  color: string;
  icon: LucideIcon;
  minPlayers?: number;
};

const DEFAULT_GAME_CONFIG: GameConfig = {
  color: "from-teal-500 to-cyan-500",
  icon: Gamepad2,
};

export const GAME_CONFIG: Record<string, GameConfig> = {
  "never-have-i-ever": {
    color: "from-pink-500 to-rose-600",
    icon: Heart,
    minPlayers: 2,
  },
  "truth-or-drink": {
    color: "from-cyan-500 to-blue-700",
    icon: FlaskConical,
    minPlayers: 2,
  },
  "most-likely": {
    color: "from-emerald-500 to-lime-600",
    icon: Users,
    minPlayers: 3,
  },
  paranoia: {
    color: "from-slate-600 to-rose-700",
    icon: Eye,
  },
  "rhyme-time": {
    color: "from-violet-500 to-fuchsia-600",
    icon: Mic,
  },
  "higher-lower": {
    color: "from-indigo-600 to-sky-500",
    icon: ArrowUpRight,
    minPlayers: 2,
  },
  "verbal-charades": {
    color: "from-amber-500 to-orange-600",
    icon: Theater,
    minPlayers: 4,
  },
  "taboo-lite": {
    color: "from-teal-500 to-cyan-700",
    icon: ShieldQuestion,
  },
  "would-you-rather": {
    color: "from-blue-500 to-indigo-700",
    icon: Compass,
    minPlayers: 3,
  },
  "pick-a-card": {
    color: "from-red-500 to-pink-600",
    icon: Shuffle,
    minPlayers: 3,
  },
  "kings-cup": {
    color: "from-yellow-500 to-red-700",
    icon: Crown,
  },
  "catherines-special": {
    color: "from-green-500 to-emerald-700",
    icon: Sparkles,
    minPlayers: 2,
  },
  "story-building": {
    color: "from-orange-500 to-amber-700",
    icon: ScrollText,
  },
  imposter: {
    color: "from-zinc-700 to-rose-600",
    icon: VenetianMask,
    minPlayers: 4,
  },
  triviyay: {
    color: "from-purple-600 to-pink-600",
    icon: Rainbow,
  },
  "truth-or-lie": {
    color: "from-fuchsia-600 to-indigo-600",
    icon: Scale,
    minPlayers: 2,
  },
  codenames: {
    color: "from-red-600 to-blue-700",
    icon: Layers,
  },
  "memory-chain": {
    color: "from-cyan-600 to-slate-700",
    icon: Brain,
    minPlayers: 2,
  },
  "guess-the-number": {
    color: "from-emerald-600 to-cyan-700",
    icon: Hash,
    minPlayers: 2,
  },
  "connect-the-letters": {
    color: "from-fuchsia-600 to-cyan-700",
    icon: Type,
    minPlayers: 2,
  },
  "ghost-tears": {
    color: "from-indigo-700 to-cyan-700",
    icon: Ghost,
    minPlayers: 2,
  },
  "joker-loop": {
    color: "from-amber-600 to-rose-700",
    icon: Shuffle,
    minPlayers: 2,
  },
  "who-am-i": {
    color: "from-sky-600 to-cyan-700",
    icon: ClipboardPaste,
    minPlayers: 2,
  },
  "name-the-song": {
    color: "from-fuchsia-600 to-pink-700",
    icon: Mic,
    minPlayers: 2,
  },
  "guess-the-movie": {
    color: "from-amber-500 to-red-700",
    icon: Film,
    minPlayers: 2,
  },
  "ride-the-bus": {
    color: "from-cyan-600 to-blue-800",
    icon: Bus,
    minPlayers: 2,
  },
};

export function getGameConfig(gameCode: string): GameConfig {
  return GAME_CONFIG[gameCode] ?? DEFAULT_GAME_CONFIG;
}

export function getGameMinPlayers(gameCode: string): number {
  return GAME_CONFIG[gameCode]?.minPlayers ?? 0;
}

export function isCreateRoomDisabled({
  isCreatingRoom,
  selectedGame,
  playersCount,
  teamsCount,
}: {
  isCreatingRoom: boolean;
  selectedGame: string | null;
  playersCount: number;
  teamsCount: number;
}): boolean {
  if (isCreatingRoom || !selectedGame) {
    return true;
  }

  if (selectedGame === "triviyay") {
    return teamsCount > 2;
  }

  return playersCount < getGameMinPlayers(selectedGame);
}
