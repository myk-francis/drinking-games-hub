"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Wine, Gamepad2 } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import ErrorPage from "@/app/error";
import { Loading } from "@/components/ui/loading";

// Mock data – replace with real data from DB / tRPC

export default function ProfilePage() {
  const router = useRouter();
  const trpc = useTRPC();

  const {
    data: currentUser,
    isLoading: userLoading,
    error: userErrored,
  } = useQuery(trpc.auth.getCurrentUser.queryOptions());

  const { data: summary, isLoading: summaryLoading } = useQuery(
    trpc.profile.summary.queryOptions({ userId: currentUser?.id || "" })
  );

  const { data: rooms, isLoading: roomsLoading } = useQuery(
    trpc.profile.myRooms.queryOptions({ userId: currentUser?.id || "" })
  );

  React.useEffect(() => {
    if (!userLoading) {
      if (
        currentUser === null ||
        currentUser === undefined ||
        currentUser.username !== "myk"
      ) {
        router.push("/login");
      }
    }
  }, [currentUser, userLoading, router]);

  const isPageLoading = userLoading || summaryLoading || roomsLoading;

  if (isPageLoading) return <Loading />;

  if (userErrored) {
    return <ErrorPage reset={() => router.refresh()} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="mx-auto max-w-3xl px-4 py-6 ">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Avatar className="h-14 w-14 dark">
            <AvatarFallback>
              {currentUser?.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold">My Profile</h1>
            <p className="text-sm text-muted-foreground">
              Rooms statistics overview
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Gamepad2 />}
            label="Rooms"
            value={summary?.totalRooms || 0}
          />
          <StatCard
            icon={<Wine />}
            label="Drinks"
            value={summary?.totalDrinks || 0}
          />
          <StatCard
            icon={<Users />}
            label="Players"
            value={summary?.totalPlayers || 0}
          />
        </div>

        {/* Games List */}
        <Card className="mt-6 dark">
          <CardHeader>
            <CardTitle className="text-base">My Games</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[420px] pr-2">
              <div className="space-y-3">
                {rooms?.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{room.game?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {room?.createdAt.toDateString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Badge variant="secondary">
                        {room.players?.length} players
                      </Badge>
                      <Badge variant="outline">
                        {room.players?.reduce(
                          (acc, player) => acc + (player.drinks || 0),
                          0
                        )}{" "}
                        drinks
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card className="flex flex-col items-center justify-center py-4 dark">
      <div className="mb-1 text-muted-foreground">{icon}</div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}
