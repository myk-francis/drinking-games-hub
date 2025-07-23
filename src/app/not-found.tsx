"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4  bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <Card className="w-full max-w-md text-center p-6 shadow-xl">
        <CardContent>
          <h1 className="text-4xl font-bold mb-2 text-red-500">404</h1>
          <p className="text-lg mb-4">Page not found</p>
          <p className="text-sm mb-6 text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
          <Link href="/">
            <Button>Go back home</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
