"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

import Link from "next/link";

type UserAvatarPopoverProps = {
  name: string;
  imageUrl?: string;
  isAdmin?: boolean;
  handleLogout?: () => void;
};

export function UserAvatarPopover({
  name,
  imageUrl,
  handleLogout,
  isAdmin,
}: UserAvatarPopoverProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="outline-none">
          <Avatar className="cursor-pointer ring-2 ring-white/10 hover:ring-white/30 transition">
            <AvatarImage src={imageUrl} alt={name} />
            <AvatarFallback className="bg-zinc-800 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="end"
        className="
          w-48
          bg-zinc-950
          border border-white/10
          text-white
          shadow-xl
        "
      >
        <div className="space-y-2">
          {/* <p className="font-medium capitalize">{name}</p> */}

          <Link href="/profile" className="">
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/10"
            >
              Profile
            </Button>
          </Link>

          {isAdmin && (
            <Link href="/transactions" className="">
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-white/10"
              >
                Admin
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:bg-red-500/10"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
