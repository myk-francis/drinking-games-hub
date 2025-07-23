// app/error.tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <Card className="w-full max-w-md text-center p-6 shadow-xl">
        <CardContent>
          <h1 className="text-3xl font-bold mb-2 text-red-500">
            Something went wrong
          </h1>
          <p className="text-sm mb-4 text-muted-foreground">
            An unexpected error occurred. Please try again.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={reset}>
              Try Again
            </Button>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
