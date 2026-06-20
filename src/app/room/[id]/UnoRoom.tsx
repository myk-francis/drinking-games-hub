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
  pendingWildCardId: string | null;
  roomId: string;
  setPendingWildCardId: React.Dispatch<React.SetStateAction<string | null>>;
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
  emphasized = false,
  disabled = false,
  onClick,
}: {
  card: UnoCard;
  compact?: boolean;
  emphasized?: boolean;
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
        compact ? "h-[5.5rem] w-16 sm:h-28 sm:w-20" : "h-28 w-[4.9rem] min-[430px]:h-[7.5rem] min-[430px]:w-[5.25rem] sm:h-40 sm:w-28"
      } shadow-[0_18px_35px_rgba(15,23,42,0.35)] transition ${
        disabled || !onClick
          ? "cursor-not-allowed opacity-55"
          : emphasized
            ? "cursor-pointer -translate-y-1 ring-2 ring-amber-200/85 shadow-[0_22px_40px_rgba(245,158,11,0.35)] hover:-translate-y-2"
            : "cursor-pointer hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(15,23,42,0.45)]"
      }`}
      aria-label={`Play ${card.label}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.28),_transparent_45%)]" />
      <div className="absolute -left-7 top-4 h-10 w-30 -rotate-35 rounded-full opacity-95 blur-[1px] sm:-left-8 sm:top-7 sm:h-16 sm:w-48">
        <div className={`h-full w-full ${styles.stripe}`} />
      </div>

      <div className="relative flex h-full flex-col justify-between p-2 sm:p-3">
        <span className="text-left text-[10px] font-black tracking-[0.18em] text-white drop-shadow sm:text-xs">
          {glyph}
        </span>
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white/75 bg-black/10 shadow-inner sm:h-16 sm:w-16 sm:border-4">
          {card.kind === "WILD" || card.kind === "WILD_DRAW_FOUR" ? (
            <div className="grid h-7 w-7 grid-cols-2 gap-1 rounded-full bg-zinc-950/70 p-1 sm:h-11 sm:w-11">
              <span className="rounded-full bg-red-400" />
              <span className="rounded-full bg-amber-300" />
              <span className="rounded-full bg-emerald-400" />
              <span className="rounded-full bg-sky-400" />
            </div>
          ) : (
            <span className={`text-sm font-black sm:text-xl ${styles.text}`}>
              {glyph}
            </span>
          )}
        </div>
        <span className="self-end text-[10px] font-black tracking-[0.18em] text-white drop-shadow sm:text-xs">
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
  pendingWildCardId,
  roomId,
  setPendingWildCardId,
  startPending,
  turnActionPending,
  unoState,
}: UnoRoomProps) {
  const myHand = React.useMemo(
    () => (actualPlayer ? (unoState.handsByPlayerId[actualPlayer] ?? []) : []),
    [actualPlayer, unoState.handsByPlayerId],
  );
  const topCard = unoState.discardPile[unoState.discardPile.length - 1] ?? null;
  const isMyTurn = actualPlayer !== "" && unoState.currentPlayerId === actualPlayer;
  const currentPlayerName =
    players.find((player) => player.id === unoState.currentPlayerId)?.name ?? "Player";
  const activeColorStyles = unoState.activeColor
    ? UNO_COLOR_STYLES[unoState.activeColor]
    : UNO_COLOR_STYLES.WILD;
  const canStartRound = actualPlayer !== "" && roomId !== "";
  const pendingWildCard =
    pendingWildCardId ? myHand.find((card) => card.id === pendingWildCardId) ?? null : null;

  React.useEffect(() => {
    if (!pendingWildCardId) return;
    const hasCard = myHand.some((card) => card.id === pendingWildCardId);
    if (!hasCard || !isMyTurn) {
      setPendingWildCardId(null);
    }
  }, [isMyTurn, myHand, pendingWildCardId, setPendingWildCardId]);

  const handlePlayCard = (card: UnoCard) => {
    if (card.kind === "WILD" || card.kind === "WILD_DRAW_FOUR") {
      if (pendingWildCardId === card.id) {
        setPendingWildCardId(null);
        return;
      }
      setPendingWildCardId(card.id);
      return;
    }
    setPendingWildCardId(null);
    onPlayCard(card.id);
  };

  return (
    <div className="w-full">
      <div className="mb-4 rounded-[1.65rem] border border-white/20 bg-[linear-gradient(140deg,rgba(190,24,93,0.18),rgba(15,23,42,0.8),rgba(2,132,199,0.18))] p-4 shadow-[0_25px_70px_rgba(15,23,42,0.28)] backdrop-blur-sm sm:mb-6 sm:rounded-[2rem] sm:p-6">
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
            <h2 className="text-xl font-black tracking-tight text-white sm:text-3xl">
              Match color, number, or symbol
            </h2>
            <p className="mt-2 max-w-2xl text-xs text-white/80 sm:text-base">
              First player out wins the round, scores the point, and everyone
              else drinks. Wild cards let you set the table color.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/15 bg-black/25 px-3 py-3 text-center text-xs text-white/80 sm:block sm:px-4 sm:text-sm sm:text-left">
            <p className="font-semibold text-white">
              {unoState.status === "LOBBY"
                ? "Lobby open"
                : unoState.status === "ENDED"
                  ? "Round finished"
                  : `Turn: ${currentPlayerName}`}
            </p>
            <p className="sm:mt-1">
              Draw pile: {unoState.drawPile.length} cards
            </p>
            <p className="sm:mt-1">
              Direction: {unoState.direction === 1 ? "Clockwise" : "Counter-clockwise"}
            </p>
          </div>
        </div>

        {unoState.lastAction && (
          <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-50 sm:text-sm">
            {unoState.lastAction}
          </div>
        )}
      </div>

      {unoState.status === "LOBBY" && (
        <div className="mb-4 rounded-[1.65rem] border border-white/20 bg-white/10 p-4 backdrop-blur-sm sm:mb-6 sm:rounded-[2rem] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-bold text-white sm:text-xl">Ready to deal?</h3>
              <p className="mt-2 text-xs text-white/75 sm:text-sm">
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

      <div className="grid gap-4 xl:grid-cols-[1.05fr_1.25fr] xl:gap-6">
        <div className="space-y-4 xl:space-y-6">
          <div className="rounded-[1.65rem] border border-white/20 bg-white/10 p-4 backdrop-blur-sm sm:rounded-[2rem] sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">
                  Center pile
                </p>
                <p className="mt-2 text-xs text-white/75 sm:text-sm">
                  Follow the active color or symbol from the discard.
                </p>
              </div>
              {topCard && (
                <Badge className={activeColorStyles.badge}>
                  {topCard.kind === "NUMBER" ? `Top ${topCard.label}` : topCard.label}
                </Badge>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 justify-items-center gap-2 sm:mt-5 sm:flex sm:items-center sm:justify-center sm:gap-4">
              <div className="rounded-[1.2rem] border border-dashed border-white/25 bg-black/20 p-2.5 sm:rounded-[1.65rem] sm:p-3">
                <div className="flex h-28 w-[4.8rem] items-center justify-center rounded-[1.05rem] border border-white/20 bg-[linear-gradient(145deg,#0f172a,#111827,#1f2937)] text-white shadow-[0_18px_35px_rgba(15,23,42,0.35)] sm:h-40 sm:w-28 sm:rounded-[1.45rem]">
                  <div className="text-center">
                    <Hand className="mx-auto h-6 w-6 sm:h-7 sm:w-7" />
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] sm:text-xs">
                      Draw
                    </p>
                    <p className="mt-1 text-base font-black sm:text-lg">{unoState.drawPile.length}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.2rem] border border-white/20 bg-black/20 p-2.5 sm:rounded-[1.65rem] sm:p-3">
                {topCard ? (
                  <UnoPlayingCard card={topCard} />
                ) : (
                  <div className="flex h-28 w-[4.8rem] items-center justify-center rounded-[1.05rem] border border-white/20 bg-white/5 text-[11px] text-white/55 sm:h-40 sm:w-28 sm:rounded-[1.45rem] sm:text-sm">
                    Waiting to deal
                  </div>
                )}
              </div>
            </div>

            {unoState.status === "PLAYING" && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-2">
                <Button
                  onClick={onDrawCard}
                  disabled={!isMyTurn || turnActionPending || !!unoState.drawnCardThisTurnId}
                  className="h-11 bg-sky-500 text-white hover:bg-sky-600 sm:h-10"
                >
                  Draw Card
                </Button>
                <Button
                  onClick={onPassTurn}
                  disabled={!isMyTurn || turnActionPending || !unoState.drawnCardThisTurnId}
                  variant="secondary"
                  className="h-11 sm:h-10"
                >
                  Pass Turn
                </Button>
              </div>
            )}

            {unoState.status === "ENDED" && (
              <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4">
                <p className="text-xs text-emerald-50 sm:text-sm">
                  Winner:{" "}
                  <span className="font-bold">
                    {players.find((player) => player.id === unoState.winnerPlayerId)?.name ??
                      "Unknown"}
                  </span>
                </p>
                <p className="mt-2 text-xs text-emerald-100/85 sm:text-sm">
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

          <div className="rounded-[1.65rem] border border-white/20 bg-white/10 p-4 backdrop-blur-sm sm:rounded-[2rem] sm:p-5">
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-cyan-200" />
              <h3 className="text-lg font-semibold text-white">Table order</h3>
            </div>
            <div className="mt-4 grid gap-3">
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
                        <p className="text-xs text-white/60 sm:text-sm">
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

        <div className="rounded-[1.65rem] border border-white/20 bg-white/10 p-4 backdrop-blur-sm sm:rounded-[2rem] sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-white sm:text-xl">Your hand</h3>
              <p className="mt-1 text-xs text-white/75 sm:text-sm">
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
            <div className="mt-5">
              <div className="flex flex-wrap justify-center gap-2.5 sm:justify-start sm:gap-4">
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
                      emphasized={playable}
                      disabled={!playable || turnActionPending}
                      onClick={playable ? () => handlePlayCard(card) : undefined}
                    />
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {pendingWildCard && (
            <div className="mt-5 rounded-[1.65rem] border border-white/20 bg-black/30 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Choose a color for your wild card
                  </p>
                  <p className="mt-1 text-xs text-white/65">
                    Selected: {pendingWildCard.kind === "WILD_DRAW_FOUR" ? "Wild Draw Four" : "Wild"}
                  </p>
                </div>
                <div className="shrink-0">
                  <UnoPlayingCard card={pendingWildCard} compact />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(["RED", "YELLOW", "GREEN", "BLUE"] as const).map((color) => (
                  <Button
                    key={color}
                    disabled={turnActionPending}
                    onClick={() => {
                      onPlayCard(pendingWildCard.id, color);
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
                disabled={turnActionPending}
                onClick={() => setPendingWildCardId(null)}
                className="mt-3 text-white hover:bg-white/10 hover:text-white"
              >
                Cancel color choice
              </Button>
            </div>
          )}

          <div className="mt-5 rounded-[1.65rem] border border-white/15 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <RotateCcw className="h-4 w-4 text-cyan-200" />
              Turn rules in this build
            </div>
            <ul className="mt-3 space-y-2 text-xs text-white/72 sm:text-sm">
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
