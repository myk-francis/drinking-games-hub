"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import React from "react";
import { toast } from "sonner";

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
  const [open, setOpen] = React.useState(false);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const normalizeAppUrl = (rawUrl?: string) => {
    let value = (rawUrl ?? "").trim();
    if (!value) {
      return typeof window !== "undefined" ? window.location.origin : "";
    }
    if (!/^https?:\/\//i.test(value)) {
      value = `https://${value}`;
    }
    return value.replace(/\/+$/, "");
  };

  const closeMenu = () => setOpen(false);

  const handleCopySelfServiceLink = async () => {
    const baseUrl = normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL);
    const selfServiceUrl = `${baseUrl}/self-service`;
    try {
      await navigator.clipboard.writeText(selfServiceUrl);
      toast.success("Self-service link copied.");
    } catch {
      toast.error("Could not copy self-service link.");
    } finally {
      closeMenu();
    }
  };

  const onLogoutClick = () => {
    closeMenu();
    handleLogout?.();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
              onClick={closeMenu}
            >
              Profile
            </Button>
          </Link>

          {isAdmin && (
            <Link href="/transactions" className="">
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-white/10"
                onClick={closeMenu}
              >
                Admin
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-white/10"
            onClick={handleCopySelfServiceLink}
          >
            Self Service
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:bg-red-500/10"
            onClick={onLogoutClick}
          >
            Logout
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
