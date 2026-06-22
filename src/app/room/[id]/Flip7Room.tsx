"use client";

import React from "react";
import {
  ArrowRight,
  Clock3,
  History,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FLIP7_ACTION_LABELS,
  FLIP7_MODIFIER_LABELS,
  FLIP7_OBJECTIVE,
  FLIP7_SCORING_NOTES,
  FLIP7_SETUP,
  FLIP7_TURN_FLOW,
} from "@/modules/games/lib/flip-7";
import { getFlip7RoundScore } from "@/modules/games/lib/flip-7-engine";
import type {
  Flip7Card,
  Flip7PlayerState,
  Flip7RoomState,
} from "@/modules/games/lib/room-state";

type RoomPlayer = {
  id: string;
  name: string;
  points?: number | null;
  drinks?: number | null;
};

type Flip7RoomProps = {
  actualPlayer: string;
  flip7State: Flip7RoomState;
  onAdvanceRound: () => void;
  onChooseTarget: (targetPlayerId: string) => void;
  onHit: () => void;
  onStay: () => void;
  pending: boolean;
  players: RoomPlayer[];
};

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/12 bg-black/20 p-4 backdrop-blur-sm">
      <div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-white/65">{subtitle}</p> : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function renderCard(card: Flip7Card) {
  if (card.kind === "NUMBER") {
    return (
      <div
        key={card.id}
        className="flex h-20 w-14 items-center justify-center rounded-2xl border border-emerald-300/25 bg-emerald-500/10 text-2xl font-black text-emerald-50 shadow-[0_14px_24px_rgba(15,23,42,0.24)] sm:h-24 sm:w-16"
      >
        {card.value}
      </div>
    );
  }

  if (card.kind === "MODIFIER") {
    return (
      <div
        key={card.id}
        className="flex h-20 w-16 items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-500/10 px-2 text-center text-sm font-black uppercase text-amber-50 shadow-[0_14px_24px_rgba(15,23,42,0.24)] sm:h-24 sm:w-20"
      >
        {FLIP7_MODIFIER_LABELS[card.modifier]}
      </div>
    );
  }

  return (
    <div
      key={card.id}
      className="flex h-20 w-16 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-500/10 px-2 text-center text-[11px] font-black uppercase leading-tight text-cyan-50 shadow-[0_14px_24px_rgba(15,23,42,0.24)] sm:h-24 sm:w-20"
    >
      {FLIP7_ACTION_LABELS[card.action]}
    </div>
  );
}

function getPlayerStatusLabel(playerState: Flip7PlayerState): {
  label: string;
  className: string;
} {
  if (playerState.busted) {
    return {
      label: "Busted",
      className: "bg-rose-500 text-white",
    };
  }

  if (playerState.frozen) {
    return {
      label: "Frozen",
      className: "bg-cyan-400 text-cyan-950",
    };
  }

  if (playerState.hasFlippedSeven) {
    return {
      label: "Flip 7",
      className: "bg-amber-400 text-amber-950",
    };
  }

  if (playerState.stayed) {
    return {
      label: "Stayed",
      className: "bg-emerald-400 text-emerald-950",
    };
  }

  if (playerState.active) {
    return {
      label: "Active",
      className: "bg-white/15 text-white",
    };
  }

  return {
    label: "Waiting",
    className: "bg-white/10 text-white/75",
  };
}

function getActionPreview(actionType: Flip7RoomState["pendingAction"] extends infer T
  ? T extends { actionType: infer A }
    ? A
    : never
  : never): string {
  switch (actionType) {
    case "FREEZE":
      return "Force one active player out of the round, but they still keep their current round score.";
    case "FLIP_THREE":
      return "Force one active player to reveal up to three more cards right away.";
    case "SECOND_CHANCE":
      return "Give one active player protection against their next duplicate number bust.";
    default:
      return "";
  }
}

export default function Flip7Room({
  actualPlayer,
  flip7State,
  onAdvanceRound,
  onChooseTarget,
  onHit,
  onStay,
  pending,
  players,
}: Flip7RoomProps) {
  const [selectedTargetId, setSelectedTargetId] = React.useState("");

  const playerMap = React.useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );
  const isMyTurn =
    flip7State.status === "ROUND_DECISION" &&
    flip7State.currentPlayerId === actualPlayer;
  const canChooseTarget =
    flip7State.status === "AWAITING_ACTION_TARGET" &&
    flip7State.pendingAction?.sourcePlayerId === actualPlayer;

  React.useEffect(() => {
    if (
      !flip7State.pendingAction ||
      !flip7State.pendingAction.allowedTargetPlayerIds.includes(selectedTargetId)
    ) {
      setSelectedTargetId("");
    }
  }, [flip7State.pendingAction, selectedTargetId]);

  const currentPlayerName =
    playerMap.get(flip7State.currentPlayerId ?? "")?.name ?? "Table";
  const pendingActionPlayerName =
    playerMap.get(flip7State.pendingAction?.sourcePlayerId ?? "")?.name ?? "Player";

  return (
    <div className="space-y-4">
      <SectionCard
        title="Flip 7 Table"
        subtitle={FLIP7_OBJECTIVE}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-white">
              <Clock3 className="h-4 w-4 text-cyan-300" />
              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                Status
              </span>
            </div>
            <p className="mt-3 text-2xl font-black text-white">
              {flip7State.status.replaceAll("_", " ")}
            </p>
            <p className="mt-2 text-sm text-white/70">
              {flip7State.status === "ROUND_DECISION"
                ? `${currentPlayerName} is choosing Hit or Stay.`
                : flip7State.status === "AWAITING_ACTION_TARGET"
                  ? `${pendingActionPlayerName} is assigning ${FLIP7_ACTION_LABELS[flip7State.pendingAction!.actionType]}.`
                  : flip7State.status === "ROUND_OVER"
                    ? "Round finished. Review scores and start the next round."
                    : flip7State.status === "ENDED"
                      ? `${playerMap.get(flip7State.winnerPlayerId ?? "")?.name ?? "Winner"} won the game.`
                      : "Dealing the opening cards."}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-white">
              <Target className="h-4 w-4 text-emerald-300" />
              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                Round
              </span>
            </div>
            <p className="mt-3 text-2xl font-black text-white">
              {flip7State.roundNumber}
            </p>
            <p className="mt-2 text-sm text-white/70">
              First to a clean lead over {flip7State.targetScore} wins.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                Last Action
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-white">
              {flip7State.lastAction ?? "Waiting for the first reveal."}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Players"
        subtitle="Cards, live round status, and running totals."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {players.map((player) => {
            const playerState = flip7State.playerStatesById[player.id];
            if (!playerState) return null;

            const status = getPlayerStatusLabel(playerState);
            const isCurrentPlayer = flip7State.currentPlayerId === player.id;
            const roundScore = getFlip7RoundScore(playerState);
            const totalScore = flip7State.scoresByPlayerId[player.id] ?? 0;

            return (
              <div
                key={player.id}
                className={`rounded-[1.5rem] border p-4 ${
                  isCurrentPlayer
                    ? "border-cyan-300/30 bg-cyan-500/10"
                    : "border-white/10 bg-black/20"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-bold text-white">{player.name}</p>
                  {player.id === actualPlayer ? (
                    <Badge className="bg-amber-400 text-amber-950">You</Badge>
                  ) : null}
                  <Badge className={status.className}>{status.label}</Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-white/60">Total score</p>
                    <p className="mt-1 text-2xl font-black text-white">{totalScore}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-white/60">Round score</p>
                    <p className="mt-1 text-2xl font-black text-white">{roundScore}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {playerState.cards.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm text-white/55">
                      No revealed cards yet
                    </div>
                  ) : (
                    playerState.cards.map((card) => renderCard(card))
                  )}
                </div>

                {flip7State.status === "ROUND_OVER" || flip7State.status === "ENDED" ? (
                  <p className="mt-3 text-sm text-white/70">
                    Last round banked:{" "}
                    <span className="font-bold text-white">
                      {flip7State.lastRoundScoresByPlayerId[player.id] ?? 0}
                    </span>
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </SectionCard>

      {isMyTurn ? (
        <SectionCard
          title="Your Turn"
          subtitle="Choose whether to push your luck or bank what you already have."
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="flex-1 bg-cyan-400 text-cyan-950 hover:bg-cyan-300"
              disabled={pending}
              onClick={onHit}
            >
              Hit
            </Button>
            <Button
              className="flex-1 bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
              disabled={pending}
              onClick={onStay}
            >
              Stay
            </Button>
          </div>
        </SectionCard>
      ) : null}

      {canChooseTarget && flip7State.pendingAction ? (
        <SectionCard
          title={`Assign ${FLIP7_ACTION_LABELS[flip7State.pendingAction.actionType]}`}
          subtitle={getActionPreview(flip7State.pendingAction.actionType)}
        >
          <div className="flex flex-wrap gap-2">
            {flip7State.pendingAction.allowedTargetPlayerIds.map((playerId) => (
              <Button
                key={playerId}
                type="button"
                variant={selectedTargetId === playerId ? "default" : "secondary"}
                className={
                  selectedTargetId === playerId
                    ? "bg-rose-500 text-white hover:bg-rose-400"
                    : ""
                }
                onClick={() => setSelectedTargetId(playerId)}
              >
                {playerMap.get(playerId)?.name ?? "Player"}
              </Button>
            ))}
          </div>

          <Button
            className="mt-4 w-full bg-cyan-400 text-cyan-950 hover:bg-cyan-300"
            disabled={!selectedTargetId || pending}
            onClick={() => onChooseTarget(selectedTargetId)}
          >
            Confirm target
          </Button>
        </SectionCard>
      ) : null}

      {flip7State.status === "ROUND_OVER" ? (
        <SectionCard
          title="Round Over"
          subtitle="Scores are locked. Start the next round when the table is ready."
        >
          <Button
            className="w-full bg-amber-400 text-amber-950 hover:bg-amber-300"
            disabled={pending}
            onClick={onAdvanceRound}
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Start Next Round
          </Button>
        </SectionCard>
      ) : null}

      {flip7State.status === "ENDED" ? (
        <SectionCard
          title="Winner"
          subtitle="The room result is settled and the app awards are ready."
        >
          <div className="rounded-2xl border border-amber-300/25 bg-amber-500/10 p-4">
            <div className="flex items-center gap-2 text-white">
              <Trophy className="h-5 w-5 text-amber-300" />
              <p className="text-lg font-bold text-white">
                {playerMap.get(flip7State.winnerPlayerId ?? "")?.name ?? "Winner"}
              </p>
            </div>
            <p className="mt-2 text-sm text-white/75">
              Winner gets +1 point. Everyone else drinks +1.
            </p>
          </div>
        </SectionCard>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <SectionCard
          title="Round Notes"
          subtitle="Quick reminders for table flow and scoring."
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/60">
                Setup
              </p>
              <ul className="mt-2 space-y-2 text-sm text-white/75">
                {FLIP7_SETUP.map((item) => (
                  <li key={item} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/60">
                Turn Flow
              </p>
              <div className="mt-2 space-y-3">
                {FLIP7_TURN_FLOW.map((section) => (
                  <div
                    key={section.title}
                    className="rounded-xl border border-white/10 bg-white/5 p-3"
                  >
                    <p className="font-semibold text-white">{section.title}</p>
                    <ul className="mt-2 space-y-1 text-sm text-white/75">
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/60">
                Scoring Notes
              </p>
              <ul className="mt-2 space-y-2 text-sm text-white/75">
                {FLIP7_SCORING_NOTES.map((item) => (
                  <li key={item} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="History"
          subtitle="Latest table events."
        >
          <div className="space-y-2">
            {flip7State.history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-white/55">
                No actions recorded yet.
              </div>
            ) : (
              [...flip7State.history].reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/75"
                >
                  <div className="flex items-start gap-2">
                    <History className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <span>{entry.message}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
