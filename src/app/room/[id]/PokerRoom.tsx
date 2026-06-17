import React from "react";
import { Club } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  PokerCard,
  PokerRoomState,
} from "@/modules/games/lib/room-state";

import {
  getPokerActionLabel,
  getPokerActionSummary,
  getPokerMinimumAggressiveBetTotal,
  getPokerPhaseLabel,
  POKER_HAND_RANKINGS,
} from "./poker-helpers";

type RoomPlayer = {
  id: string;
  name: string;
};

type PokerRoomProps = {
  actualPlayer: string;
  getBlackjackCardClasses: (card: PokerCard | null) => string;
  getBlackjackCardLabel: (card: PokerCard) => string;
  onPokerBet: (amount: number) => void;
  onPokerCall: () => void;
  onPokerFold: () => void;
  onPokerNextRound: () => void;
  onToggleHandRankings: () => void;
  onTogglePokerBetPicker: () => void;
  players: RoomPlayer[];
  pokerBetDraft: number;
  pokerBetPickerOpen: boolean;
  pokerBetPending: boolean;
  pokerCallPending: boolean;
  pokerFoldPending: boolean;
  pokerNextRoundPending: boolean;
  pokerState: PokerRoomState;
  setPokerBetDraft: React.Dispatch<React.SetStateAction<number>>;
  setPokerBetPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showPokerHandRankings: boolean;
};

const PokerRoom = React.memo(function PokerRoom({
  actualPlayer,
  getBlackjackCardClasses,
  getBlackjackCardLabel,
  onPokerBet,
  onPokerCall,
  onPokerFold,
  onPokerNextRound,
  onToggleHandRankings,
  onTogglePokerBetPicker,
  players,
  pokerBetDraft,
  pokerBetPickerOpen,
  pokerBetPending,
  pokerCallPending,
  pokerFoldPending,
  pokerNextRoundPending,
  pokerState,
  setPokerBetDraft,
  setPokerBetPickerOpen,
  showPokerHandRankings,
}: PokerRoomProps) {
  const isPokerShowdown = pokerState.phase === "SHOWDOWN";
  const isMyTurn = actualPlayer === pokerState.currentPlayerId;
  const myPokerHand = actualPlayer
    ? pokerState.holeCardsByPlayerId[actualPlayer] ?? []
    : [];
  const currentTurnName = pokerState.currentPlayerId
    ? players.find((player) => player.id === pokerState.currentPlayerId)?.name ||
      "Player"
    : "Dealer";
  const dealerButtonName = pokerState.dealerPlayerId
    ? players.find((player) => player.id === pokerState.dealerPlayerId)?.name ||
      "Player"
    : "Player";
  const toCall = actualPlayer
    ? Math.max(0, pokerState.currentBet - (pokerState.playerBets[actualPlayer] ?? 0))
    : 0;
  const myCurrentStreetBet = actualPlayer
    ? pokerState.playerBets[actualPlayer] ?? 0
    : 0;
  const myStack = actualPlayer ? pokerState.stackByPlayerId[actualPlayer] ?? 0 : 0;
  const isPokerSpectator = myStack <= 0 && myPokerHand.length === 0;
  const maxMyTotalBet = myStack + myCurrentStreetBet;
  const minimumAggressiveBet =
    myStack <= 0 || maxMyTotalBet <= pokerState.currentBet
      ? 0
      : getPokerMinimumAggressiveBetTotal({
          currentBet: pokerState.currentBet,
          currentStreetBet: myCurrentStreetBet,
          stack: myStack,
          betStep: pokerState.betStep,
          bigBlindAmount: pokerState.bigBlindAmount,
        });
  const canAggressivelyBet = minimumAggressiveBet > pokerState.currentBet;
  const pokerCommunitySlots = Array.from({ length: 5 }, (_, index) =>
    pokerState.communityCards[index] ?? null,
  );
  const winnersLabel =
    pokerState.winnerPlayerIds.length > 0
      ? pokerState.winnerPlayerIds
          .map(
            (playerId) =>
              players.find((player) => player.id === playerId)?.name || "Player",
          )
          .join(", ")
      : "Waiting for showdown";
  const lastActionPlayerName = pokerState.lastActionPlayerId
    ? players.find((player) => player.id === pokerState.lastActionPlayerId)?.name ||
      "Player"
    : null;
  const lastActionType = pokerState.lastActionPlayerId
    ? pokerState.lastActionByPlayerId[pokerState.lastActionPlayerId] ?? "NONE"
    : "NONE";
  const lastActionSummary =
    lastActionPlayerName && lastActionType !== "NONE"
      ? `${lastActionPlayerName} ${getPokerActionSummary(
          lastActionType,
          pokerState.lastActionAmount,
        ).toLowerCase()}`
      : "Waiting for the first real move.";

  return (
    <div className="w-full">
      <div className="mb-6 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Club className="h-3.5 w-3.5" />
            Poker
          </Badge>
          <Badge variant="outline">Hand {pokerState.roundNumber}</Badge>
          <Badge className="bg-rose-800">{getPokerPhaseLabel(pokerState.phase)}</Badge>
          <Badge className="bg-cyan-700">
            Blinds {pokerState.smallBlindAmount} / {pokerState.bigBlindAmount}
          </Badge>
          <Badge variant="outline">
            Stack {pokerState.startingStack} | Bet Step {pokerState.betStep}
          </Badge>
          {pokerState.currentPlayerId && !isPokerShowdown && (
            <Badge className="bg-emerald-700">Turn: {currentTurnName}</Badge>
          )}
        </div>
        <p className="mt-3 text-sm text-white/90 sm:text-base">
          The app deals a simplified Texas Hold&apos;em hand. Everyone starts with
          10000 chips, blinds go up every five hands, winners get +1 point, and
          everyone else in the hand gets +1 drink.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/65">
                Your Stack
              </p>
              <p className="mt-3 text-3xl font-black text-cyan-50">{myStack}</p>
              <p className="mt-2 text-sm text-cyan-100/75">
                {isPokerSpectator
                  ? "You are watching the rest of the action."
                  : "Chips you can still play this game."}
              </p>
            </div>
            <div className="rounded-xl border border-amber-300/20 bg-amber-500/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-100/65">
                To Call
              </p>
              <p className="mt-3 text-3xl font-black text-amber-50">
                {Math.min(toCall, myStack)}
              </p>
              <p className="mt-2 text-sm text-amber-100/75">
                {toCall === 0
                  ? "You can check if it gets to you."
                  : `Current street bet: ${pokerState.currentBet}`}
              </p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                Last Action
              </p>
              <p className="mt-3 text-lg font-bold text-white">{lastActionSummary}</p>
              <p className="mt-2 text-sm text-white/70">
                Latest decision made at the table.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                    Table
                  </p>
                  <Badge className="bg-rose-800">
                    {getPokerPhaseLabel(pokerState.phase)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-white/80">
                  App dealer active. Button: {dealerButtonName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Pot
                </p>
                <p className="mt-2 text-xl font-semibold text-amber-200">
                  {pokerState.pot}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                Community Cards
              </p>
              <div className="mt-3 grid grid-cols-5 gap-2 sm:gap-3">
                {pokerCommunitySlots.map((card, index) => (
                  <div
                    key={`community-${index}`}
                    className={`flex h-20 items-center justify-center rounded-xl border text-sm font-semibold shadow-lg ${getBlackjackCardClasses(
                      card,
                    )}`}
                  >
                    {card ? getBlackjackCardLabel(card) : "?"}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/15 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                Your Hand
              </p>
              {myPokerHand.length === 0 ? (
                <p className="mt-3 text-sm text-white/70">
                  {isPokerSpectator
                    ? "You are out of chips and can spectate the rest of the table."
                    : "You are sitting out this hand or waiting for the next deal."}
                </p>
              ) : (
                <>
                  <div className="mt-3 flex gap-3">
                    {myPokerHand.map((card, index) => (
                      <div
                        key={`poker-my-${index}-${card.rank}-${card.suit}`}
                        className={`flex h-20 w-16 items-center justify-center rounded-xl border text-sm font-semibold shadow-lg ${getBlackjackCardClasses(
                          card,
                        )}`}
                      >
                        {getBlackjackCardLabel(card)}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-cyan-100">Stack: {myStack} chips</p>
                </>
              )}

              {!isPokerShowdown && (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Button
                    onClick={onPokerCall}
                    disabled={
                      !isMyTurn ||
                      pokerCallPending ||
                      pokerBetPending ||
                      pokerFoldPending ||
                      myPokerHand.length === 0
                    }
                    className="w-full bg-emerald-600 py-6 text-base hover:bg-emerald-700"
                  >
                    {toCall === 0 ? "Check" : `Call ${Math.min(toCall, myStack)}`}
                  </Button>
                  <Button
                    onClick={onTogglePokerBetPicker}
                    disabled={
                      !isMyTurn ||
                      pokerCallPending ||
                      pokerBetPending ||
                      pokerFoldPending ||
                      myPokerHand.length === 0 ||
                      !canAggressivelyBet
                    }
                    className="w-full bg-amber-600 py-6 text-base hover:bg-amber-700"
                  >
                    {pokerBetPickerOpen
                      ? "Hide Bet"
                      : `${pokerState.currentBet > 0 ? "Raise" : "Bet"} ${minimumAggressiveBet}`}
                  </Button>
                  <Button
                    onClick={onPokerFold}
                    disabled={
                      !isMyTurn ||
                      pokerCallPending ||
                      pokerBetPending ||
                      pokerFoldPending ||
                      myPokerHand.length === 0
                    }
                    className="w-full bg-slate-700 py-6 text-base hover:bg-slate-800"
                  >
                    Fold
                  </Button>
                </div>
              )}

              {!isPokerShowdown && pokerBetPickerOpen && canAggressivelyBet && (
                <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-500/10 p-4">
                  <p className="text-sm text-amber-50">
                    {pokerState.currentBet > 0
                      ? `Choose your raise total. Minimum is ${minimumAggressiveBet} and step size is ${pokerState.betStep}.`
                      : `Choose your opening bet. Minimum is ${minimumAggressiveBet} and step size is ${pokerState.betStep}.`}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <Button
                      type="button"
                      onClick={() =>
                        setPokerBetDraft((value) =>
                          Math.max(minimumAggressiveBet, value - pokerState.betStep),
                        )
                      }
                      disabled={pokerBetDraft <= minimumAggressiveBet}
                      className="min-w-12 bg-slate-700 px-4 hover:bg-slate-800"
                    >
                      -
                    </Button>
                    <div className="flex-1 rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-center text-lg font-semibold text-white">
                      {pokerBetDraft}
                    </div>
                    <Button
                      type="button"
                      onClick={() =>
                        setPokerBetDraft((value) =>
                          Math.min(maxMyTotalBet, value + pokerState.betStep),
                        )
                      }
                      disabled={pokerBetDraft >= maxMyTotalBet}
                      className="min-w-12 bg-slate-700 px-4 hover:bg-slate-800"
                    >
                      +
                    </Button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      onClick={() => onPokerBet(pokerBetDraft)}
                      disabled={
                        pokerBetPending ||
                        pokerBetDraft < minimumAggressiveBet ||
                        pokerBetDraft > maxMyTotalBet
                      }
                      className="w-full bg-amber-600 hover:bg-amber-700"
                    >
                      Confirm {pokerState.currentBet > 0 ? "Raise" : "Bet"}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setPokerBetPickerOpen(false);
                        setPokerBetDraft(minimumAggressiveBet);
                      }}
                      className="w-full bg-slate-700 hover:bg-slate-800"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {!isMyTurn && !isPokerShowdown && (
                <p className="mt-4 text-sm text-amber-300">Waiting for {currentTurnName}.</p>
              )}

              {isPokerSpectator && (
                <p className="mt-4 text-sm text-cyan-100/85">
                  You can keep watching the hand, but your controls are disabled
                  until a new game with chips starts.
                </p>
              )}

              {isPokerShowdown && (
                <div className="mt-4 rounded-xl border border-emerald-300/25 bg-emerald-500/10 p-4">
                  <p className="text-sm text-emerald-100">Winners: {winnersLabel}</p>
                  <Button
                    onClick={onPokerNextRound}
                    disabled={pokerNextRoundPending || !actualPlayer}
                    className="mt-4 bg-cyan-600 hover:bg-cyan-700"
                  >
                    Deal Next Hand
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white">Players</h3>
            <div className="mt-4 space-y-3">
              {pokerState.playerOrder.map((playerId) => {
                const player = players.find((item) => item.id === playerId);
                const stack = pokerState.stackByPlayerId[playerId] ?? 0;
                const currentBet = pokerState.playerBets[playerId] ?? 0;
                const totalContribution =
                  pokerState.totalContributionsByPlayerId[playerId] ?? 0;
                const isCurrent = pokerState.currentPlayerId === playerId;
                const isFolded = pokerState.foldedPlayerIds.includes(playerId);
                const isAllIn = pokerState.allInPlayerIds.includes(playerId);
                const isWinner = pokerState.winnerPlayerIds.includes(playerId);
                const canRevealHand = isPokerShowdown || playerId === actualPlayer;
                const hand = pokerState.holeCardsByPlayerId[playerId] ?? [];

                return (
                  <div
                    key={playerId}
                    className={`rounded-xl border p-3 ${
                      isWinner
                        ? "border-emerald-300/30 bg-emerald-500/10"
                        : isCurrent
                          ? "border-cyan-300/30 bg-cyan-500/10"
                          : isFolded
                            ? "border-rose-300/25 bg-rose-500/10"
                            : "border-white/10 bg-black/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-white">{player?.name || "Player"}</p>
                      <Badge variant="outline">
                        {isWinner
                          ? "Winner"
                          : isFolded
                            ? "Folded"
                            : isAllIn
                              ? "All-In"
                              : getPokerActionLabel(
                                  pokerState.lastActionByPlayerId[playerId] ?? "NONE",
                                )}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-white/80">
                      Stack: {stack} | Street Bet: {currentBet} | Total In:{" "}
                      {totalContribution}
                    </p>
                    <p className="mt-1 text-sm text-white/70">
                      Cards:{" "}
                      {hand.length === 0
                        ? "Not in this hand"
                        : canRevealHand
                          ? hand.map(getBlackjackCardLabel).join(", ")
                          : `${hand.length} hidden cards`}
                    </p>
                    {isPokerShowdown && pokerState.handLabelByPlayerId[playerId] && (
                      <p className="mt-1 text-sm text-cyan-100">
                        Best Hand: {pokerState.handLabelByPlayerId[playerId]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={onToggleHandRankings}
              >
                {showPokerHandRankings ? "Hide Hand Rankings" : "Show Hand Rankings"}
              </Button>
              {showPokerHandRankings && (
                <div className="mt-3 rounded-lg border border-white/10 bg-black/25 p-3">
                  <p className="text-sm font-semibold text-white">
                    Hand strength from highest to lowest
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {POKER_HAND_RANKINGS.map((handName, index) => (
                      <div
                        key={handName}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85"
                      >
                        {index + 1}. {handName}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PokerRoom;
