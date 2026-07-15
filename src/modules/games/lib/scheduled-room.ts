export type ScheduledRoomStatus = "LOBBY" | "LIVE" | "ENDED";

export type ScheduledRoomStateInput = {
  status: string | null | undefined;
  scheduledStartAt: Date | null | undefined;
  gameEnded: boolean;
  now?: Date;
};

export type ScheduledRoomState = {
  status: ScheduledRoomStatus;
  isScheduled: boolean;
  isPlayable: boolean;
  shouldAutoActivate: boolean;
  secondsUntilStart: number | null;
};

export function getScheduledRoomState(
  input: ScheduledRoomStateInput,
): ScheduledRoomState {
  const now = input.now ?? new Date();
  const scheduledStartAt = input.scheduledStartAt ?? null;
  const isScheduled = scheduledStartAt !== null;

  if (input.gameEnded || input.status === "ENDED") {
    return {
      status: "ENDED",
      isScheduled,
      isPlayable: false,
      shouldAutoActivate: false,
      secondsUntilStart: null,
    };
  }

  if (!isScheduled) {
    return {
      status: "LIVE",
      isScheduled: false,
      isPlayable: true,
      shouldAutoActivate: false,
      secondsUntilStart: null,
    };
  }

  const msUntilStart = scheduledStartAt.getTime() - now.getTime();
  const hasStarted = msUntilStart <= 0;

  if (hasStarted) {
    return {
      status: "LIVE",
      isScheduled: true,
      isPlayable: true,
      shouldAutoActivate: input.status !== "LIVE",
      secondsUntilStart: 0,
    };
  }

  return {
    status: "LOBBY",
    isScheduled: true,
    isPlayable: false,
    shouldAutoActivate: false,
    secondsUntilStart: Math.ceil(msUntilStart / 1000),
  };
}
