"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const trpc = useTRPC();
  const loginUser = useMutation(
    trpc.auth.login.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const handleLogin = () => {
    setIsLoading(true);
    // handle login logic here
    loginUser.mutate(
      { username, passcode },
      {
        onSuccess: () => {
          setIsLoading(false);
          toast.success("Login successful!");
          router.push("/"); // Redirect to home
        },

        onError: () => {
          setIsLoading(false);
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-sm shadow-md">
        <CardHeader>
          <h2 className="text-xl font-semibold text-center">Welcome</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passcode">Passcode</Label>
              <Input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter your passcode"
              />
            </div>
            <Button className="w-full mt-4" onClick={handleLogin}>
              {isLoading ? (
                <span
                  role="status"
                  aria-label="Loading"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
                />
              ) : (
                "Sign In"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
