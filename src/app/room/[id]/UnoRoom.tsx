"use client";

import React from "react";
import { Circle, Hand, Palette, RotateCcw, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UnoCard, UnoRoomState } from "@/modules/games/lib/room-state";

type UnoRoomProps = {
  actualPlayer: string;
  onDrawCard: () => void;
  onPassTurn: () => void;
  onPlayCard: (
    cardId: string,
    chosenColor?: "RED" | "YELLOW" | "GREEN" | "BLUE",
  ) => void;
  onStartRound: () => void;
  players: {
    id: string;
    name: string;
  }[];
  roomId: string;
  startPending: boolean;
  turnActionPending: boolean;
  unoState: UnoRoomState;
};

const UNO_COLOR_STYLES: Record<
  "RED" | "YELLOW" | "GREEN" | "BLUE" | "WILD",
  {
    badge: string;
    card: string;
    stripe: string;
    text: string;
  }
> = {
  RED: {
    badge: "bg-red-500 text-white",
    card: "from-red-700 via-red-500 to-rose-400",
    stripe: "bg-white/90",
    text: "text-red-950",
  },
  YELLOW: {
    badge: "bg-amber-400 text-amber-950",
    card: "from-amber-500 via-yellow-300 to-orange-200",
    stripe: "bg-white/85",
    text: "text-amber-950",
  },
  GREEN: {
    badge: "bg-emerald-500 text-white",
    card: "from-emerald-700 via-emerald-500 to-lime-300",
    stripe: "bg-white/90",
    text: "text-emerald-950",
  },
  BLUE: {
    badge: "bg-sky-500 text-white",
    card: "from-sky-800 via-blue-500 to-cyan-300",
    stripe: "bg-white/90",
    text: "text-sky-950",
  },
  WILD: {
    badge: "bg-zinc-900 text-white",
    card: "from-zinc-950 via-zinc-800 to-zinc-700",
    stripe: "bg-gradient-to-r from-red-400 via-yellow-300 via-green-400 to-sky-400",
    text: "text-white",
  },
};

function getCardGlyph(card: UnoCard): string {
  if (card.kind === "NUMBER") return String(card.value ?? "");
  if (card.kind === "DRAW_TWO") return "+2";
  if (card.kind === "WILD_DRAW_FOUR") return "+4";
  if (card.kind === "REVERSE") return "REV";
  if (card.kind === "SKIP") return "SKIP";
  return "WILD";
}

function isPlayableCard(card: UnoCard, state: UnoRoomState): boolean {
  if (card.kind === "WILD" || card.kind === "WILD_DRAW_FOUR") {
    return true;
  }

  const topCard = state.discardPile[state.discardPile.length - 1] ?? null;
  if (!topCard) return true;

  if (state.activeColor && card.color === state.activeColor) {
    return true;
  }

  if (card.kind === "NUMBER" && topCard.kind === "NUMBER") {
    return card.value === topCard.value;
  }

  return card.kind === topCard.kind;
}

function UnoPlayingCard({
  card,
  compact = false,
  disabled = false,
  onClick,
}: {
  card: UnoCard;
  compact?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const styles = UNO_COLOR_STYLES[card.color];
  const glyph = getCardGlyph(card);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`group relative overflow-hidden rounded-[1.45rem] border-2 border-white/60 bg-gradient-to-br ${styles.card} ${
        compact ? "h-28 w-20" : "h-40 w-28"
      } shadow-[0_18px_35px_rgba(15,23,42,0.35)] transition ${
        disabled || !onClick
          ? "cursor-not-allowed opacity-55"
          : "cursor-pointer hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(15,23,42,0.45)]"
      }`}
      aria-label={`Play ${card.label}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.28),_transparent_45%)]" />
      <div className="absolute -left-8 top-7 h-14 w-40 -rotate-35 rounded-full opacity-95 blur-[1px] sm:h-16 sm:w-48">
        <div className={`h-full w-full ${styles.stripe}`} />
      </div>

      <div className="relative flex h-full flex-col justify-between p-2.5 sm:p-3">
        <span className="text-left text-xs font-black tracking-[0.2em] text-white drop-shadow">
          {glyph}
        </span>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-4 border-white/75 bg-black/10 shadow-inner sm:h-16 sm:w-16">
          {card.kind === "WILD" || card.kind === "WILD_DRAW_FOUR" ? (
            <div className="grid h-10 w-10 grid-cols-2 gap-1 rounded-full bg-zinc-950/70 p-1 sm:h-11 sm:w-11">
              <span className="rounded-full bg-red-400" />
              <span className="rounded-full bg-amber-300" />
              <span className="rounded-full bg-emerald-400" />
              <span className="rounded-full bg-sky-400" />
            </div>
          ) : (
            <span className={`text-lg font-black sm:text-xl ${styles.text}`}>
              {glyph}
            </span>
          )}
        </div>
        <span className="self-end text-xs font-black tracking-[0.2em] text-white drop-shadow">
          {glyph}
        </span>
      </div>

      {!disabled && onClick && (
        <div className="absolute inset-0 rounded-[1.35rem] ring-0 transition group-hover:ring-2 group-hover:ring-white/70" />
      )}
    </button>
  );
}

export default function UnoRoom({
  actualPlayer,
  onDrawCard,
  onPassTurn,
  onPlayCard,
  onStartRound,
  players,
  roomId,
  startPending,
  turnActionPending,
  unoState,
}: UnoRoomProps) {
  const [pendingWildCardId, setPendingWildCardId] = React.useState<string | null>(
    null,
  );

  const myHand = actualPlayer ? (unoState.handsByPlayerId[actualPlayer] ?? []) : [];
  const topCard = unoState.discardPile[unoState.discardPile.length - 1] ?? null;
  const isMyTurn = actualPlayer !== "" && unoState.currentPlayerId === actualPlayer;
  const currentPlayerName =
    players.find((player) => player.id === unoState.currentPlayerId)?.name ?? "Player";
  const activeColorStyles = unoState.activeColor
    ? UNO_COLOR_STYLES[unoState.activeColor]
    : UNO_COLOR_STYLES.WILD;
  const canStartRound = actualPlayer !== "" && roomId !== "";

  const handlePlayCard = (card: UnoCard) => {
    if (card.kind === "WILD" || card.kind === "WILD_DRAW_FOUR") {
      setPendingWildCardId(card.id);
      return;
    }
    onPlayCard(card.id);
  };

  return (
    <div className="w-full">
      <div className="mb-6 rounded-[2rem] border border-white/20 bg-[linear-gradient(140deg,rgba(190,24,93,0.18),rgba(15,23,42,0.8),rgba(2,132,199,0.18))] p-5 shadow-[0_25px_70px_rgba(15,23,42,0.28)] backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="bg-white/15 text-white">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Uno Table
              </Badge>
              <Badge variant="outline">Round {Math.max(unoState.roundNumber, 1)}</Badge>
              <Badge className={activeColorStyles.badge}>
                <Palette className="mr-1 h-3.5 w-3.5" />
                Active color: {unoState.activeColor ?? "None"}
              </Badge>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Match color, number, or symbol
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/80 sm:text-base">
              First player out wins the round, scores the point, and everyone
              else drinks. Wild cards let you set the table color.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-sm text-white/80">
            <p className="font-semibold text-white">
              {unoState.status === "LOBBY"
                ? "Lobby open"
                : unoState.status === "ENDED"
                  ? "Round finished"
                  : `Turn: ${currentPlayerName}`}
            </p>
            <p className="mt-1">
              Draw pile: {unoState.drawPile.length} cards
            </p>
            <p className="mt-1">
              Direction: {unoState.direction === 1 ? "Clockwise" : "Counter-clockwise"}
            </p>
          </div>
        </div>

        {unoState.lastAction && (
          <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-50">
            {unoState.lastAction}
          </div>
        )}
      </div>

      {unoState.status === "LOBBY" && (
        <div className="mb-6 rounded-[2rem] border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Ready to deal?</h3>
              <p className="mt-2 text-sm text-white/75">
                Start when everyone has joined. Each player will be dealt 7 cards
                and the room will lock for late joins.
              </p>
            </div>
            <Button
              onClick={onStartRound}
              disabled={!canStartRound || startPending}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {startPending ? "Dealing..." : "Deal Opening Hands"}
            </Button>
          </div>
          {!canStartRound && (
            <p className="mt-3 text-sm text-amber-200">
              Pick your player first so we know who is starting the round.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.25fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">
                  Center pile
                </p>
                <p className="mt-2 text-sm text-white/75">
                  Follow the active color or symbol from the discard.
                </p>
              </div>
              {topCard && (
                <Badge className={activeColorStyles.badge}>
                  {topCard.kind === "NUMBER" ? `Top ${topCard.label}` : topCard.label}
                </Badge>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <div className="rounded-[1.65rem] border border-dashed border-white/25 bg-black/20 p-3">
                <div className="flex h-40 w-28 items-center justify-center rounded-[1.45rem] border border-white/20 bg-[linear-gradient(145deg,#0f172a,#111827,#1f2937)] text-white shadow-[0_18px_35px_rgba(15,23,42,0.35)]">
                  <div className="text-center">
                    <Hand className="mx-auto h-7 w-7" />
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em]">
                      Draw
                    </p>
                    <p className="mt-1 text-lg font-black">{unoState.drawPile.length}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.65rem] border border-white/20 bg-black/20 p-3">
                {topCard ? (
                  <UnoPlayingCard card={topCard} />
                ) : (
                  <div className="flex h-40 w-28 items-center justify-center rounded-[1.45rem] border border-white/20 bg-white/5 text-sm text-white/55">
                    Waiting to deal
                  </div>
                )}
              </div>
            </div>

            {unoState.status === "PLAYING" && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Button
                  onClick={onDrawCard}
                  disabled={!isMyTurn || turnActionPending || !!unoState.drawnCardThisTurnId}
                  className="bg-sky-500 text-white hover:bg-sky-600"
                >
                  Draw Card
                </Button>
                <Button
                  onClick={onPassTurn}
                  disabled={!isMyTurn || turnActionPending || !unoState.drawnCardThisTurnId}
                  variant="secondary"
                >
                  Pass Turn
                </Button>
              </div>
            )}

            {unoState.status === "ENDED" && (
              <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4">
                <p className="text-sm text-emerald-50">
                  Winner:{" "}
                  <span className="font-bold">
                    {players.find((player) => player.id === unoState.winnerPlayerId)?.name ??
                      "Unknown"}
                  </span>
                </p>
                <p className="mt-2 text-sm text-emerald-100/85">
                  Deal another round whenever the table is ready.
                </p>
                <Button
                  onClick={onStartRound}
                  disabled={!canStartRound || startPending}
                  className="mt-4 bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                >
                  {startPending ? "Shuffling..." : "Deal Next Round"}
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-cyan-200" />
              <h3 className="text-lg font-semibold text-white">Table order</h3>
            </div>
            <div className="mt-4 space-y-3">
              {unoState.playerOrder.map((playerId) => {
                const player = players.find((entry) => entry.id === playerId);
                const cardCount = unoState.handsByPlayerId[playerId]?.length ?? 0;
                const isCurrent = unoState.currentPlayerId === playerId;
                const isWinner = unoState.winnerPlayerId === playerId;

                return (
                  <div
                    key={playerId}
                    className={`rounded-2xl border px-4 py-3 transition ${
                      isWinner
                        ? "border-emerald-300/30 bg-emerald-500/12"
                        : isCurrent
                          ? "border-cyan-300/30 bg-cyan-500/12"
                          : "border-white/10 bg-black/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">
                          {player?.name ?? "Player"}
                        </p>
                        <p className="text-sm text-white/60">
                          {isWinner
                            ? "Won the round"
                            : isCurrent
                              ? "Current turn"
                              : "Waiting"}
                        </p>
                      </div>
                      <Badge variant="outline">{cardCount} cards</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Your hand</h3>
              <p className="mt-1 text-sm text-white/75">
                {isMyTurn
                  ? "Playable cards glow and can be selected."
                  : unoState.status === "LOBBY"
                    ? "Your hand appears after the round is dealt."
                    : `Waiting for ${currentPlayerName}.`}
              </p>
            </div>
            <Badge className="bg-white/10 text-white">
              {myHand.length} cards
            </Badge>
          </div>

          {myHand.length === 0 ? (
            <div className="mt-8 rounded-[1.65rem] border border-dashed border-white/20 bg-black/20 p-8 text-center text-white/65">
              No cards yet.
            </div>
          ) : (
            <div className="mt-6 flex gap-4 overflow-x-auto pb-3">
              {myHand.map((card) => {
                const playable =
                  isMyTurn &&
                  (!unoState.drawnCardThisTurnId ||
                    unoState.drawnCardThisTurnId === card.id) &&
                  isPlayableCard(card, unoState);

                return (
                  <div key={card.id} className="shrink-0">
                    <UnoPlayingCard
                      card={card}
                      disabled={!playable || turnActionPending}
                      onClick={playable ? () => handlePlayCard(card) : undefined}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {pendingWildCardId && (
            <div className="mt-6 rounded-[1.65rem] border border-white/20 bg-black/30 p-4">
              <p className="text-sm font-semibold text-white">
                Choose a color for your wild card
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(["RED", "YELLOW", "GREEN", "BLUE"] as const).map((color) => (
                  <Button
                    key={color}
                    onClick={() => {
                      onPlayCard(pendingWildCardId, color);
                      setPendingWildCardId(null);
                    }}
                    className={UNO_COLOR_STYLES[color].badge}
                  >
                    {color}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                onClick={() => setPendingWildCardId(null)}
                className="mt-3 text-white hover:bg-white/10 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          )}

          <div className="mt-6 rounded-[1.65rem] border border-white/15 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <RotateCcw className="h-4 w-4 text-cyan-200" />
              Turn rules in this build
            </div>
            <ul className="mt-3 space-y-2 text-sm text-white/72">
              <li>`Reverse` skips in 2-player games and flips direction with 3+.</li>
              <li>`Draw Two` and `Wild Draw Four` force the next player to draw and lose the turn.</li>
              <li>After drawing, you can play only the drawn card or pass.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
