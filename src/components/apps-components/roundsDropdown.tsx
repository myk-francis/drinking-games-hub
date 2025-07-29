"use client";
import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Round = {
  id: number;
  name: string;
  value: number;
};

type RoundDropdownProps = {
  rounds: Round[];
  value: number;
  handleSelect: (round: number) => void;
};

export function Rounds({ rounds, value, handleSelect }: RoundDropdownProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {rounds.find((round) => round.value === value)?.name}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {rounds.map((round) => (
                <CommandItem
                  key={round.id}
                  value={String(round.value)}
                  onSelect={(currentValue) => {
                    handleSelect(Number(currentValue));
                    setOpen(false);
                  }}
                >
                  {round.name}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === round.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
