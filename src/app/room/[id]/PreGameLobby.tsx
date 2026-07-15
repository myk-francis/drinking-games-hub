"use client";

import * as React from "react";
import { Bell, Clock3, MessageSquare, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LobbyPlayer = {
  id: string;
  name: string;
};

type LobbyMessage = {
  id: string;
  playerId: string;
  playerName: string;
  content: string;
  createdAt: Date | string;
};

function formatCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((segment) => String(segment).padStart(2, "0"))
    .join(":");
}

export default function PreGameLobby({
  roomId,
  gameName,
  scheduledStartAt,
  players,
  actualPlayerId,
  messages,
  onSendMessage,
  isSendingMessage,
}: {
  roomId: string;
  gameName: string;
  scheduledStartAt: string | Date | null | undefined;
  players: LobbyPlayer[];
  actualPlayerId: string;
  messages: LobbyMessage[];
  onSendMessage: (content: string) => void;
  isSendingMessage: boolean;
}) {
  const [draft, setDraft] = React.useState("");
  const [now, setNow] = React.useState(() => Date.now());
  const [notificationPermission, setNotificationPermission] = React.useState<
    NotificationPermission | "unsupported"
  >(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    return window.Notification.permission;
  });
  const reminderKey = React.useMemo(
    () => `scheduled-room-reminder:${roomId}:${actualPlayerId}`,
    [actualPlayerId, roomId],
  );

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const scheduledStartMs = React.useMemo(() => {
    if (!scheduledStartAt) return null;
    const next =
      scheduledStartAt instanceof Date
        ? scheduledStartAt.getTime()
        : new Date(scheduledStartAt).getTime();
    return Number.isFinite(next) ? next : null;
  }, [scheduledStartAt]);

  const secondsUntilStart = React.useMemo(() => {
    if (scheduledStartMs === null) return null;
    return Math.max(0, Math.ceil((scheduledStartMs - now) / 1000));
  }, [now, scheduledStartMs]);

  const startsWithinFiveMinutes =
    secondsUntilStart !== null && secondsUntilStart <= 5 * 60;
  const selectedPlayerName =
    players.find((player) => player.id === actualPlayerId)?.name ?? "";

  React.useEffect(() => {
    if (
      typeof window === "undefined" ||
      scheduledStartMs === null ||
      notificationPermission !== "granted"
    ) {
      return;
    }

    const reminderTime = scheduledStartMs - 5 * 60 * 1000;
    const delayMs = reminderTime - now;

    if (window.localStorage.getItem(reminderKey) === "sent") {
      return;
    }

    const sendReminder = () => {
      if (window.localStorage.getItem(reminderKey) === "sent") {
        return;
      }

      new Notification(`${gameName} starts soon`, {
        body: "Your game begins in about 5 minutes. Head back to the lobby.",
      });
      window.localStorage.setItem(reminderKey, "sent");
      toast.info(`${gameName} starts in about 5 minutes.`);
    };

    if (delayMs <= 0 && now < scheduledStartMs) {
      sendReminder();
      return;
    }

    if (delayMs > 0) {
      const timeoutId = window.setTimeout(sendReminder, delayMs);
      return () => window.clearTimeout(timeoutId);
    }
  }, [
    gameName,
    notificationPermission,
    now,
    reminderKey,
    scheduledStartMs,
  ]);

  const handleEnableReminder = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      toast.error("This browser does not support notifications.");
      return;
    }

    const permission = await window.Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === "granted") {
      window.localStorage.removeItem(reminderKey);
      toast.success("Browser reminder enabled.");
      return;
    }

    toast.error("Browser reminder permission was not granted.");
  };

  const handleSubmitMessage = () => {
    const nextMessage = draft.trim();
    if (!nextMessage) {
      return;
    }

    onSendMessage(nextMessage);
    setDraft("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-950 via-cyan-950 to-slate-950 p-4 text-white sm:p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-cyan-200/15 bg-white/8 p-6 shadow-[0_30px_80px_rgba(34,211,238,0.12)] backdrop-blur-md sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
                <Clock3 className="h-3.5 w-3.5" />
                Pre-Game Lobby
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                {gameName}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-cyan-50/75 sm:text-base">
                Everyone joins here first, picks their player name, watches the
                countdown, and the room unlocks automatically at game time.
              </p>
              <p className="mt-4 text-sm text-cyan-100/80">
                You joined as <span className="font-semibold">{selectedPlayerName}</span>
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 px-5 py-4 text-center">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/65">
                Countdown
              </div>
              <div className="mt-2 text-4xl font-black tabular-nums text-white sm:text-5xl">
                {secondsUntilStart === null ? "--:--:--" : formatCountdown(secondsUntilStart)}
              </div>
              <div className="mt-2 text-sm text-cyan-100/70">
                Starts{" "}
                {scheduledStartMs
                  ? new Date(scheduledStartMs).toLocaleString()
                  : "when the host opens the room"}
              </div>
            </div>
          </div>

          {startsWithinFiveMinutes && (
            <div className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-400/15 px-4 py-3 text-sm text-amber-50">
              The game starts in less than 5 minutes. Keep this tab open so the
              room can unlock automatically.
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={handleEnableReminder}
              className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            >
              <Bell className="mr-2 h-4 w-4" />
              {notificationPermission === "granted"
                ? "Reminder enabled"
                : "Enable 5-minute reminder"}
            </Button>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              {notificationPermission === "unsupported"
                ? "Browser notifications are unavailable here."
                : notificationPermission === "granted"
                  ? "We will remind you in this browser before the game begins."
                  : "Allow notifications if you want a browser reminder before start."}
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[1.75rem] border border-white/10 bg-white/8 p-5 backdrop-blur-md sm:p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-200" />
              <h2 className="text-xl font-bold">Players in the lobby</h2>
            </div>
            <div className="mt-5 grid gap-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`rounded-2xl border px-4 py-3 ${
                    player.id === actualPlayerId
                      ? "border-cyan-300/40 bg-cyan-300/15"
                      : "border-white/10 bg-slate-950/40"
                  }`}
                >
                  <div className="font-semibold">{player.name}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-white/45">
                    {player.id === actualPlayerId ? "You" : "Player"}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-white/10 bg-white/8 p-5 backdrop-blur-md sm:p-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-cyan-200" />
              <h2 className="text-xl font-bold">Lobby chat</h2>
            </div>
            <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {messages.length === 0 ? (
                  <p className="text-sm text-white/55">
                    No messages yet. Say hi while everyone gathers.
                  </p>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="rounded-2xl bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-cyan-100">
                          {message.playerName}
                        </span>
                        <span className="text-xs text-white/40">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-white/80">{message.content}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    if (isSendingMessage) return;
                    handleSubmitMessage();
                  }}
                  maxLength={250}
                  placeholder="Type a message for the lobby"
                  className="border-white/10 bg-slate-950/70 text-white placeholder:text-white/45"
                />
                <Button
                  type="button"
                  onClick={handleSubmitMessage}
                  disabled={isSendingMessage || draft.trim() === ""}
                >
                  Send
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
