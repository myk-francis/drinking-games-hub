import { Loader2 } from "lucide-react";
export function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin  text-white" />
        <p className="text-4xl text-white">Loading, please wait...</p>
      </div>
    </div>
  );
}
