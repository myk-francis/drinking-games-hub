"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  Wine,
  Gamepad2,
  Star,
  Gamepad2Icon,
  MessageSquare,
} from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import ErrorPage from "@/app/error";
import { Loading } from "@/components/ui/loading";
import { UserComboBox } from "@/components/apps-components/userComboBox";
import Link from "next/link";

const getLastSixMonths = () => {
  const result = [];
  const today = new Date();

  for (let i = 0; i < 6; i++) {
    // Create a new date for each month
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);

    // Format to "MMM-YYYY" (e.g., "Jan-2025")
    const formatted = d
      .toLocaleString("en-US", { month: "short", year: "numeric" })
      .replace(" ", "-");

    result.push({
      id: String(i),
      name: formatted,
      value: formatted,
    });
  }

  return result;
};

export default function ProfilePage() {
  const router = useRouter();
  const trpc = useTRPC();
  const monthOptions = getLastSixMonths();
  const [selectedMonths, setSelectedMonths] = React.useState(
    monthOptions[0].value
  );

  const {
    data: currentUser,
    isLoading: userLoading,
    error: userErrored,
  } = useQuery(trpc.auth.getCurrentUser.queryOptions());

  const { data: transactionProfile } = useQuery(
    trpc.transaction.getUserTransaction.queryOptions()
  );

  const { data: summary, isLoading: summaryLoading } = useQuery(
    trpc.profile.summaryPerMonth.queryOptions({
      userId: currentUser?.id || "",
      month: selectedMonths,
    })
  );

  const { data: rooms, isLoading: roomsLoading } = useQuery(
    trpc.profile.myRoomsPerMonth.queryOptions({
      userId: currentUser?.id || "",
      month: selectedMonths,
    })
  );

  React.useEffect(() => {
    if (!userLoading) {
      if (currentUser === null || currentUser === undefined) {
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

        {/* Profile  */}
        <Card className="mt-6 dark">
          <CardHeader>
            <CardTitle className="text-base">Profile Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="">
              <p className="font-medium">User: {currentUser?.username}</p>
              <p className="font-medium mt-2">
                Profile:{" "}
                <span className="p-0.5 bg-green-400 rounded ">
                  {transactionProfile?.profileType}
                </span>
              </p>
              {(transactionProfile?.profileType === "GUEST" ||
                transactionProfile?.profileType === "ADMIN" ||
                transactionProfile?.profileType === "PREMIUM") && (
                <p className="font-medium mt-2">
                  User:{" "}
                  {transactionProfile?.expiryDate
                    ? transactionProfile?.expiryDate.toDateString()
                    : ""}
                </p>
              )}
              {(transactionProfile?.profileType === "GUEST" ||
                transactionProfile?.profileType === "ADMIN" ||
                transactionProfile?.profileType === "PREMIUM") && (
                <p className="font-medium mt-2">
                  Rooms: {transactionProfile?.usedRooms} /{" "}
                  {transactionProfile?.assignedRooms}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
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
          <StatCard
            icon={<Gamepad2Icon />}
            label="Games"
            value={summary?.totalGames || 0}
          />
          <StatCard
            icon={<Star />}
            label="Stars"
            value={Number(summary?.totalRatings.toFixed(1)) || 0}
          />
          <StatCard
            icon={<MessageSquare />}
            label="Comments"
            value={summary?.totalComments || 0}
          />
        </div>

        {/* Games List */}
        <Card className="mt-6 dark">
          <CardHeader>
            <div className="flex flex-row items-center justify-between ">
              <p className="text-lg font-bold">My Games</p>
              <div className="">
                <UserComboBox
                  options={monthOptions}
                  handleSelect={setSelectedMonths}
                  value={selectedMonths}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="flex-1 pr-2">
              <div className="space-y-3">
                {rooms?.map((room) => (
                  <Link
                    href={`/room/${room.id}`}
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
                  </Link>
                ))}
                {rooms?.length === 0 && (
                  <p className="text-center text-muted-foreground">
                    No rooms found for the selected month.
                  </p>
                )}
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
