"use client";

import { signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User } from "lucide-react";

interface LoginButtonProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function LoginButton({ user }: LoginButtonProps) {
  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || "User"}
              className="w-7 h-7 rounded-full"
            />
          ) : (
            <User className="w-5 h-5" />
          )}
          <span className="hidden sm:inline text-muted-foreground">
            {user.name || user.email}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Logout</span>
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => signIn("google")}
      className="gap-2"
    >
      <LogIn className="w-4 h-4" />
      Google Login
    </Button>
  );
}
