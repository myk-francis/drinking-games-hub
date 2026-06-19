import { Loader2 } from "lucide-react";
export function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 px-4 text-white">
      <div className="w-full max-w-sm rounded-[1.75rem] border border-white/15 bg-white/10 px-6 py-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.28)] backdrop-blur-sm">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-white sm:h-10 sm:w-10" />
        <p className="mt-4 text-lg font-semibold text-white sm:text-2xl">
          Loading room
        </p>
        <p className="mt-2 text-sm text-white/75">
          Pulling the latest game state for everyone at the table.
        </p>
      </div>
    </div>
  );
}
