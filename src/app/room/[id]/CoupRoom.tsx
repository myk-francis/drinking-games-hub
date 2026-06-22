"use client";

import React from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Coins,
  Crown,
  EyeOff,
  Shield,
  Sparkles,
  Swords,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  CoupActionType,
  CoupCard,
  CoupResponseType,
  CoupRoomState,
} from "@/modules/games/lib/room-state";

import {
  COUP_BLUFFING_NOTES,
  COUP_CHARACTER_ACTIONS,
  COUP_GENERAL_ACTIONS,
  COUP_HOUSE_RULES,
  COUP_OBJECTIVE,
} from "@/modules/games/lib/coup";

type RoomPlayer = {
  id: string;
  name: string;
  points?: number | null;
  drinks?: number | null;
};

type CoupRoomProps = {
  actualPlayer: string;
  coupState: CoupRoomState;
  onChooseExchange: (keptCardIds: string[]) => void;
  onDeclareAction: (
    actionType: CoupActionType,
    targetPlayerId?: string | null,
  ) => void;
  onRevealInfluence: (cardId: string) => void;
  onRespondDecision: (response: CoupResponseType) => void;
  pending: boolean;
  players: RoomPlayer[];
};

function ReferenceCard({
  title,
  subtitle,
  children,
  tone = "default",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  tone?: "default" | "danger" | "accent";
}) {
  const toneClass =
    tone === "danger"
      ? "border-rose-300/25 bg-rose-500/10"
      : tone === "accent"
        ? "border-cyan-300/25 bg-cyan-500/10"
        : "border-white/15 bg-black/20";

  return (
    <div className={`rounded-[1.6rem] border p-4 backdrop-blur-sm ${toneClass}`}>
      <div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-white/65">{subtitle}</p> : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function FaceDownCard({ label = "Hidden" }: { label?: string }) {
  return (
    <div className="flex h-24 w-16 flex-col items-center justify-center rounded-2xl border border-white/20 bg-[linear-gradient(140deg,rgba(245,158,11,0.15),rgba(15,23,42,0.9),rgba(190,24,93,0.2))] px-1 text-center shadow-[0_16px_30px_rgba(15,23,42,0.35)] sm:h-28 sm:w-[4.5rem]">
      <span className="text-[9px] font-semibold uppercase leading-tight tracking-[0.16em] text-white/70 sm:text-[10px]">
        {label}
      </span>
    </div>
  );
}

function InfluenceCard({
  card,
  isInteractive = false,
  onClick,
}: {
  card: CoupCard;
  isInteractive?: boolean;
  onClick?: () => void;
}) {
  const revealedClass = card.revealed
    ? "border-rose-300/30 bg-rose-500/12 text-rose-100"
    : "border-amber-300/25 bg-amber-400/12 text-amber-50";
  const sharedClassName = `flex h-24 w-16 flex-col items-center justify-center rounded-2xl border px-1.5 text-center shadow-[0_16px_30px_rgba(15,23,42,0.35)] transition sm:h-28 sm:w-[4.5rem] ${
    revealedClass
  } ${
    isInteractive
      ? "cursor-pointer hover:-translate-y-1 hover:border-cyan-300/40"
      : "cursor-default"
  }`;

  if (!isInteractive) {
    return (
      <div className={sharedClassName}>
        <span className="text-[10px] uppercase tracking-[0.18em] opacity-70">
          {card.revealed ? "Revealed" : "Influence"}
        </span>
        <span className="mt-2 text-[11px] font-black leading-tight">
          {card.role}
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={sharedClassName}
    >
      <span className="text-[8px] uppercase leading-none tracking-[0.14em] opacity-70 sm:text-[9px]">
        {card.revealed ? "Revealed" : "Influence"}
      </span>
      <span className="mt-2 break-words text-[10px] font-black uppercase leading-[1.05] sm:text-[11px]">
        {card.role}
      </span>
    </button>
  );
}

function getActionTargetLabel(actionType: CoupActionType): string {
  if (actionType === "COUP") return "Pick a target for your Coup.";
  if (actionType === "ASSASSINATE") return "Pick a target to assassinate.";
  return "Pick a player to steal from.";
}

function getResponseLabel(response: CoupResponseType): string {
  switch (response) {
    case "ALLOW":
      return "Allow";
    case "CHALLENGE":
      return "Challenge";
    case "BLOCK_DUKE":
      return "Block with Duke";
    case "BLOCK_CONTESSA":
      return "Block with Contessa";
    case "BLOCK_CAPTAIN":
      return "Block with Captain";
    case "BLOCK_AMBASSADOR":
      return "Block with Ambassador";
  }
}

function getActionResolutionPreview(args: {
  actionType: CoupActionType;
  actorName: string;
  targetName: string | null;
}): string {
  const { actionType, actorName, targetName } = args;

  switch (actionType) {
    case "INCOME":
      return `If allowed, ${actorName} takes 1 coin.`;
    case "FOREIGN_AID":
      return `If allowed, ${actorName} takes 2 coins.`;
    case "COUP":
      return `If allowed, ${targetName ?? "the target"} loses 1 influence and it cannot be blocked.`;
    case "TAX":
      return `If allowed, ${actorName} takes 3 coins by claiming Duke.`;
    case "ASSASSINATE":
      return `If allowed, ${targetName ?? "the target"} loses 1 influence and ${actorName} spends 3 coins.`;
    case "STEAL":
      return `If allowed, ${actorName} steals up to 2 coins from ${targetName ?? "the target"}.`;
    case "EXCHANGE":
      return `If allowed, ${actorName} draws 2 court cards, then chooses which hidden influences to keep.`;
  }
}

function renderHistoryMessage(
  message: string,
  players: RoomPlayer[],
): string {
  return players.reduce((currentMessage, player) => {
    return currentMessage.replaceAll(player.id, player.name);
  }, message);
}

export default function CoupRoom({
  actualPlayer,
  coupState,
  onChooseExchange,
  onDeclareAction,
  onRevealInfluence,
  onRespondDecision,
  pending,
  players,
}: CoupRoomProps) {
  const [selectedTargetId, setSelectedTargetId] = React.useState<string>("");
  const [selectedExchangeIds, setSelectedExchangeIds] = React.useState<string[]>([]);
  const [showPrivateCards, setShowPrivateCards] = React.useState(false);
  const [pendingTargetAction, setPendingTargetAction] =
    React.useState<CoupActionType | null>(null);

  const me = players.find((player) => player.id === actualPlayer) ?? null;
  const myHand = actualPlayer ? coupState.handsByPlayerId[actualPlayer] ?? [] : [];
  const myHiddenCards = myHand.filter((card) => !card.revealed);
  const myLiveRoles = React.useMemo(
    () => new Set(myHiddenCards.map((card) => card.role)),
    [myHiddenCards],
  );
  const activePlayers = players.filter((player) =>
    (coupState.handsByPlayerId[player.id] ?? []).some((card) => !card.revealed),
  );
  const currentPlayerName =
    players.find((player) => player.id === coupState.currentPlayerId)?.name ??
    "No active player";
  const isMyTurn =
    Boolean(actualPlayer) &&
    coupState.status === "ACTION" &&
    coupState.currentPlayerId === actualPlayer;
  const myPendingResponses =
    coupState.status === "ACTION_RESPONSE"
      ? coupState.pendingAction?.respondersPendingIds.includes(actualPlayer)
      : coupState.status === "BLOCK_RESPONSE"
        ? coupState.pendingBlock?.respondersPendingIds.includes(actualPlayer)
        : false;
  const revealChoiceOpen =
    coupState.status === "REVEAL_INFLUENCE" &&
    coupState.pendingReveal?.playerId === actualPlayer;
  const exchangeOpen =
    coupState.status === "EXCHANGE" &&
    coupState.pendingExchange?.playerId === actualPlayer;

  const exchangeOptions = React.useMemo(() => {
    if (!exchangeOpen || !coupState.pendingExchange) return [];
    return [
      ...myHiddenCards,
      ...coupState.pendingExchange.drawnCards.map((card) => ({
        ...card,
        revealed: false,
      })),
    ];
  }, [coupState.pendingExchange, exchangeOpen, myHiddenCards]);

  React.useEffect(() => {
    if (!exchangeOpen || !coupState.pendingExchange) {
      setSelectedExchangeIds((current) => (current.length === 0 ? current : []));
      return;
    }

    setSelectedExchangeIds((current) => {
      const next = current.filter((cardId) =>
        exchangeOptions.some((card) => card.id === cardId),
      );

      if (
        next.length === current.length &&
        next.every((cardId, index) => cardId === current[index])
      ) {
        return current;
      }

      return next;
    });
  }, [coupState.pendingExchange, exchangeOpen, exchangeOptions]);

  React.useEffect(() => {
    if (selectedTargetId && !activePlayers.some((player) => player.id === selectedTargetId)) {
      setSelectedTargetId("");
    }
  }, [activePlayers, selectedTargetId]);

  React.useEffect(() => {
    if (
      coupState.status !== "ACTION" ||
      coupState.currentPlayerId !== actualPlayer ||
      pending
    ) {
      setPendingTargetAction(null);
      setSelectedTargetId("");
    }
  }, [actualPlayer, coupState.currentPlayerId, coupState.status, pending]);

  React.useEffect(() => {
    if (revealChoiceOpen || exchangeOpen) {
      setShowPrivateCards(true);
    }
  }, [exchangeOpen, revealChoiceOpen]);

  const allowedResponses = React.useMemo(() => {
    if (!myPendingResponses || !actualPlayer) return [];

    if (coupState.status === "BLOCK_RESPONSE") {
      return ["ALLOW", "CHALLENGE"] as CoupResponseType[];
    }

    const pendingAction = coupState.pendingAction;
    if (!pendingAction) return [];

    const responses: CoupResponseType[] = ["ALLOW"];
    if (pendingAction.type !== "FOREIGN_AID" && pendingAction.claimedRole) {
      responses.push("CHALLENGE");
    }
    if (pendingAction.type === "FOREIGN_AID") {
      responses.push("BLOCK_DUKE");
    }
    if (
      pendingAction.type === "ASSASSINATE" &&
      pendingAction.targetPlayerId === actualPlayer
    ) {
      responses.push("BLOCK_CONTESSA");
    }
    if (pendingAction.type === "STEAL" && pendingAction.targetPlayerId === actualPlayer) {
      responses.push("BLOCK_CAPTAIN", "BLOCK_AMBASSADOR");
    }
    return responses;
  }, [actualPlayer, coupState.pendingAction, coupState.status, myPendingResponses]);

  const actionPrompt =
    coupState.status === "ENDED"
      ? coupState.winnerPlayerId
        ? `${players.find((player) => player.id === coupState.winnerPlayerId)?.name ?? "Winner"} is the last player standing.`
        : "Coup ended."
      : coupState.status === "ACTION"
        ? `${currentPlayerName} is up. Build coins, bluff, or strike now.`
        : coupState.status === "ACTION_RESPONSE"
          ? "The table is deciding whether to allow, challenge, or block the declared action."
          : coupState.status === "BLOCK_RESPONSE"
            ? "A block was declared. The table can allow it or challenge it."
            : coupState.status === "REVEAL_INFLUENCE"
              ? "A player must reveal influence before the turn can continue."
              : "Choose which influence cards to keep after the exchange.";
  const pendingActionActorName = coupState.pendingAction
    ? players.find((player) => player.id === coupState.pendingAction?.actorId)?.name ??
      "Player"
    : "Player";
  const pendingActionTargetName =
    coupState.pendingAction?.targetPlayerId
      ? players.find((player) => player.id === coupState.pendingAction?.targetPlayerId)?.name ??
        "target"
      : null;
  const pendingActionPreview = coupState.pendingAction
    ? getActionResolutionPreview({
        actionType: coupState.pendingAction.type,
        actorName: pendingActionActorName,
        targetName: pendingActionTargetName,
      })
    : "";
  const myCoins = actualPlayer ? coupState.coinsByPlayerId[actualPlayer] ?? 0 : 0;
  const targetActionLabel = pendingTargetAction
    ? pendingTargetAction === "COUP"
      ? "Coup"
      : pendingTargetAction === "ASSASSINATE"
        ? "Assassin"
        : "Steal"
    : null;

  const submitAction = (
    actionType: CoupActionType,
    options?: {
      needsTarget?: boolean;
    },
  ) => {
    const needsTarget = options?.needsTarget ?? false;

    if (needsTarget) {
      setPendingTargetAction(actionType);
      setSelectedTargetId("");
      return;
    }

    onDeclareAction(actionType);
  };

  return (
    <div className="w-full">
      <div className="mb-6 rounded-[2rem] border border-white/20 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.22),_rgba(22,24,39,0.92)_55%,_rgba(8,10,18,0.98)_100%)] p-5 shadow-[0_26px_70px_rgba(15,23,42,0.34)] backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="bg-amber-400 text-amber-950">
                <Crown className="mr-1 h-3.5 w-3.5" />
                Coup Table
              </Badge>
              <Badge variant="outline">{activePlayers.length} players alive</Badge>
              <Badge className="bg-white/15 text-white">
                {coupState.status.replaceAll("_", " ")}
              </Badge>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {COUP_OBJECTIVE}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/82 sm:text-base">
              {actionPrompt}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-[1.4rem] border border-white/15 bg-black/25 p-3 text-left text-sm text-white/80 sm:min-w-72">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                Spotlight
              </p>
              <p className="mt-2 font-semibold text-white">{currentPlayerName}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                You
              </p>
              <p className="mt-2 font-semibold text-white">{me?.name ?? "Spectator"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                Your coins
              </p>
              <div className="mt-2 flex items-center gap-2 text-white">
                <div className="rounded-full bg-amber-400/20 p-2">
                  <Coins className="h-4 w-4 text-amber-300" />
                </div>
                <p className="text-2xl font-black leading-none text-amber-200 sm:text-3xl">
                  {myCoins}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                Last event
              </p>
              <p className="mt-2 font-semibold text-white">
                {coupState.lastAction ?? "Waiting for the first move"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <ReferenceCard
            title="Live Table"
            subtitle="Coins are public. Hidden influence stays private unless revealed."
            tone="accent"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {players.map((player) => {
                const hand = coupState.handsByPlayerId[player.id] ?? [];
                const hiddenCount = hand.filter((card) => !card.revealed).length;
                const isCurrent = coupState.currentPlayerId === player.id;
                const isMe = actualPlayer === player.id;

                return (
                  <div
                    key={player.id}
                    className={`rounded-2xl border p-4 ${
                      isCurrent
                        ? "border-cyan-300/25 bg-cyan-500/10"
                        : hiddenCount === 0
                          ? "border-rose-300/20 bg-rose-500/10"
                          : "border-white/10 bg-black/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{player.name}</p>
                        <p className="mt-1 text-sm text-white/60">
                          {hiddenCount === 0
                            ? "Eliminated"
                            : isCurrent
                              ? "Current turn"
                              : isMe
                                ? "Your seat"
                                : "Still alive"}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {isMe ? (
                          <Badge className="bg-amber-400 text-amber-950">You</Badge>
                        ) : null}
                        <Badge variant="outline">
                          <Coins className="mr-1 h-3 w-3" />
                          {coupState.coinsByPlayerId[player.id] ?? 0}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {hand.map((card) =>
                        card.revealed || (isMe && showPrivateCards) ? (
                          <InfluenceCard key={card.id} card={card} />
                        ) : (
                          <FaceDownCard key={card.id} />
                        ),
                      )}
                    </div>
                    {isMe && hiddenCount > 0 ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="mt-3 w-full"
                        onClick={() => setShowPrivateCards((current) => !current)}
                      >
                        {showPrivateCards ? "Hide my cards" : "Peek my cards"}
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </ReferenceCard>

          <ReferenceCard
            title="Action Console"
            subtitle="Only the active player can declare an action."
          >
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-white">
                  <Coins className="h-4 w-4 text-amber-300" />
                  <h4 className="font-semibold">Safe Economy</h4>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {COUP_GENERAL_ACTIONS.filter(
                    (action) => action.name === "Income" || action.name === "Foreign Aid",
                  ).map((action) => {
                    const actionType =
                      action.name === "Income" ? "INCOME" : "FOREIGN_AID";
                    const canSubmit = isMyTurn && !pending;

                    return (
                      <div
                        key={action.name}
                        className="rounded-xl border border-white/10 bg-black/20 p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">{action.name}</p>
                        </div>
                        <p className="mt-2 text-sm text-white/70">{action.effect}</p>
                        <Button
                          className="mt-3 w-full"
                          disabled={!canSubmit}
                          onClick={() => submitAction(actionType)}
                        >
                          Use {action.name}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-center gap-2 text-white">
                    <Shield className="h-4 w-4 text-emerald-300" />
                    <h4 className="font-semibold">Claim and Bluff Actions</h4>
                  </div>
                  <div className="space-y-3">
                    {COUP_CHARACTER_ACTIONS.filter(
                      (action) =>
                        action.name === "Duke" ||
                        action.name === "Captain" ||
                        action.name === "Ambassador",
                    ).map((action) => {
                      const actionType =
                        action.name === "Duke"
                          ? "TAX"
                          : action.name === "Captain"
                            ? "STEAL"
                            : "EXCHANGE";
                      const needsTarget = actionType === "STEAL";
                      const canSubmit = isMyTurn && !pending;
                      const ownsClaimedRole =
                        action.claim !== "None" && myLiveRoles.has(action.claim);

                      return (
                        <div
                          key={action.name}
                          className={`rounded-xl border p-3 ${
                            ownsClaimedRole
                              ? "border-emerald-300/25 bg-emerald-500/10"
                              : "border-white/10 bg-black/20"
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-white">{action.name}</p>
                            {ownsClaimedRole ? (
                              <Badge className="bg-emerald-400 text-emerald-950">
                                Owned
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-400 text-amber-950">
                                Bluff
                              </Badge>
                            )}
                          </div>
                          <p className="mt-2 text-sm text-white/70">{action.effect}</p>
                          <p className="mt-2 text-xs text-white/60">
                            {ownsClaimedRole
                              ? "This claim is backed by one of your hidden influences."
                              : "This will be treated as a bluff claim if another player challenges."}
                          </p>
                          <Button
                            className={`mt-3 w-full ${
                              ownsClaimedRole
                                ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                                : "bg-amber-500 text-amber-950 hover:bg-amber-400"
                            }`}
                            disabled={!canSubmit}
                            onClick={() =>
                              submitAction(actionType as CoupActionType, {
                                needsTarget,
                              })
                            }
                          >
                            {needsTarget
                              ? `Declare ${action.name} Then Pick Target`
                              : `Declare ${action.name}`}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-center gap-2 text-white">
                    <Swords className="h-4 w-4 text-rose-300" />
                    <h4 className="font-semibold">Attack Actions</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-xl border border-rose-300/25 bg-rose-500/10 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">Coup</p>
                        <Badge className="bg-rose-400 text-rose-950">7 coins</Badge>
                      </div>
                      <p className="mt-2 text-sm text-white/70">
                        Choose a player to lose 1 influence. This cannot be blocked.
                      </p>
                      <Button
                        className="mt-3 w-full bg-rose-500 text-white hover:bg-rose-400"
                        disabled={!isMyTurn || pending || myCoins < 7}
                        onClick={() =>
                          submitAction("COUP", {
                            needsTarget: true,
                          })
                        }
                      >
                        Declare Coup Then Pick Target
                      </Button>
                      {myCoins < 7 ? (
                        <p className="mt-2 text-xs text-rose-200">
                          You need 7 coins to Coup.
                        </p>
                      ) : null}
                    </div>

                    {COUP_CHARACTER_ACTIONS.filter(
                      (action) => action.name === "Assassin",
                    ).map((action) => {
                      const ownsClaimedRole = myLiveRoles.has("ASSASSIN");
                      const canSubmit = isMyTurn && !pending && myCoins >= 3;

                      return (
                        <div
                          key={action.name}
                          className={`rounded-xl border p-3 ${
                            ownsClaimedRole
                              ? "border-emerald-300/25 bg-emerald-500/10"
                              : "border-white/10 bg-black/20"
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-white">{action.name}</p>
                            {ownsClaimedRole ? (
                              <Badge className="bg-emerald-400 text-emerald-950">
                                Owned
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-400 text-amber-950">
                                Bluff
                              </Badge>
                            )}
                            <Badge className="bg-rose-400 text-rose-950">
                              {action.cost}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-white/70">{action.effect}</p>
                          <p className="mt-2 text-xs text-white/60">
                            {ownsClaimedRole
                              ? "You can truthfully claim Assassin if you want to spend 3 coins."
                              : "You can still declare Assassin as a bluff, but a successful challenge will stop it."}
                          </p>
                          <Button
                            className={`mt-3 w-full ${
                              ownsClaimedRole
                                ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                                : "bg-amber-500 text-amber-950 hover:bg-amber-400"
                            }`}
                            disabled={!canSubmit}
                            onClick={() =>
                              submitAction("ASSASSINATE", {
                                needsTarget: true,
                              })
                            }
                          >
                            Declare Assassin Then Pick Target
                          </Button>
                          {myCoins < 3 ? (
                            <p className="mt-2 text-xs text-rose-200">
                              You need 3 coins to use Assassin.
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {pendingTargetAction ? (
              <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Pick a target for {targetActionLabel}
                    </p>
                    <p className="mt-1 text-sm text-white/70">
                      {getActionTargetLabel(pendingTargetAction)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setPendingTargetAction(null);
                      setSelectedTargetId("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {activePlayers
                    .filter((player) => player.id !== actualPlayer)
                    .map((player) => (
                      <Button
                        key={player.id}
                        type="button"
                        variant={selectedTargetId === player.id ? "default" : "secondary"}
                        className={
                          selectedTargetId === player.id
                            ? "bg-rose-500 text-white hover:bg-rose-400"
                            : ""
                        }
                        onClick={() => setSelectedTargetId(player.id)}
                      >
                        {player.name}
                      </Button>
                    ))}
                </div>

                <Button
                  className="mt-4 w-full bg-cyan-400 text-cyan-950 hover:bg-cyan-300"
                  disabled={!selectedTargetId || pending}
                  onClick={() => {
                    if (!pendingTargetAction || !selectedTargetId) {
                      toast.error("Pick a target first.");
                      return;
                    }

                    onDeclareAction(pendingTargetAction, selectedTargetId);
                  }}
                >
                  Confirm target for {targetActionLabel}
                </Button>
              </div>
            ) : null}
          </ReferenceCard>

          {myPendingResponses && (
            <ReferenceCard
              title="Response Window"
              subtitle="This action is waiting on you."
              tone="danger"
            >
              {coupState.pendingAction ? (
                <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-semibold text-white">
                    {pendingActionActorName} declared{" "}
                    {coupState.pendingAction.type.replaceAll("_", " ")}.
                  </p>
                  <p className="mt-2 text-sm text-white/72">{pendingActionPreview}</p>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3">
                {allowedResponses.map((response) => (
                  <Button
                    key={response}
                    disabled={pending}
                    onClick={() => onRespondDecision(response)}
                  >
                    {getResponseLabel(response)}
                  </Button>
                ))}
              </div>
            </ReferenceCard>
          )}

          {revealChoiceOpen && (
            <ReferenceCard
              title="Reveal Influence"
              subtitle="Choose which hidden influence card you want to lose."
              tone="danger"
            >
              <div className="flex flex-wrap gap-3">
                {myHiddenCards.map((card) => (
                  <InfluenceCard
                    key={card.id}
                    card={card}
                    isInteractive={!pending}
                    onClick={() => onRevealInfluence(card.id)}
                  />
                ))}
              </div>
            </ReferenceCard>
          )}

          {exchangeOpen && coupState.pendingExchange && (
            <ReferenceCard
              title="Ambassador Exchange"
              subtitle={`Keep exactly ${coupState.pendingExchange.keepCount} hidden influence card${
                coupState.pendingExchange.keepCount === 1 ? "" : "s"
              }.`}
              tone="accent"
            >
              <div className="flex flex-wrap gap-3">
                {exchangeOptions.map((card) => {
                  const selected = selectedExchangeIds.includes(card.id);
                  return (
                    <button
                      key={card.id}
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        setSelectedExchangeIds((current) => {
                          if (current.includes(card.id)) {
                            return current.filter((id) => id !== card.id);
                          }
                          if (current.length >= coupState.pendingExchange!.keepCount) {
                            return current;
                          }
                          return [...current, card.id];
                        });
                      }}
                      className={`rounded-2xl border p-2 ${
                        selected
                          ? "border-cyan-300/40 bg-cyan-500/15"
                          : "border-white/10 bg-black/20"
                      }`}
                    >
                      <InfluenceCard card={card} />
                    </button>
                  );
                })}
              </div>
              <Button
                className="mt-4"
                disabled={
                  pending ||
                  selectedExchangeIds.length !== coupState.pendingExchange.keepCount
                }
                onClick={() => onChooseExchange(selectedExchangeIds)}
              >
                Confirm exchange
              </Button>
            </ReferenceCard>
          )}
        </div>

        <div className="space-y-4">
          <ReferenceCard
            title="Fast Reminders"
            subtitle="These are the rules most likely to be forgotten mid-round."
          >
            <div className="space-y-3 text-sm text-white/80">
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <p>If you start your turn with 10 or more coins, you must Coup.</p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                <p>Only legal blocks can be declared, and every block can be challenged.</p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                <p>Once a card is revealed, that influence is permanently gone.</p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <p>Anyone still alive can challenge a claimed action, not only the target.</p>
              </div>
            </div>
          </ReferenceCard>

          <ReferenceCard
            title="Bluff Notes"
            subtitle="Use the table memory. There are only three copies of each role."
            tone="danger"
          >
            <div className="space-y-3">
              {COUP_BLUFFING_NOTES.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-rose-300/18 bg-rose-500/10 p-4 text-sm leading-6 text-rose-50/92"
                >
                  {item}
                </div>
              ))}
            </div>
          </ReferenceCard>

          <ReferenceCard
            title="Party Overlay"
            subtitle="Optional scoreboard meaning if you want the app to track the winner."
            tone="accent"
          >
            <div className="space-y-3">
              {COUP_HOUSE_RULES.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/75"
                >
                  {item}
                </div>
              ))}
            </div>
          </ReferenceCard>

          <ReferenceCard
            title="Action History"
            subtitle="Recent claims, responses, reveals, and resolutions."
          >
            {coupState.history.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
                No Coup actions have been logged yet.
              </div>
            ) : (
              <div className="space-y-2">
                {[...coupState.history].reverse().map((entry, index) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-3"
                  >
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                      {index === 0 ? "Latest" : `Earlier ${index}`}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/78">
                      {renderHistoryMessage(entry.message, players)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ReferenceCard>

          <ReferenceCard
            title="Reference"
            subtitle="Quick role and action memory jog."
          >
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-white">
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <p className="font-semibold">General actions</p>
                </div>
                <div className="mt-3 space-y-2 text-sm text-white/72">
                  {COUP_GENERAL_ACTIONS.map((action) => (
                    <p key={action.name}>
                      <span className="font-semibold text-white">{action.name}:</span>{" "}
                      {action.effect}
                    </p>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-white">
                  <Swords className="h-4 w-4 text-rose-300" />
                  <p className="font-semibold">Character claims</p>
                </div>
                <div className="mt-3 space-y-2 text-sm text-white/72">
                  {COUP_CHARACTER_ACTIONS.map((action) => (
                    <p key={action.name}>
                      <span className="font-semibold text-white">{action.name}:</span>{" "}
                      {action.effect}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </ReferenceCard>
        </div>
      </div>
    </div>
  );
}
