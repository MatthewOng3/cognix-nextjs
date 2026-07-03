"use client";

import { useAuth } from "../hooks/use-auth";
import { createSupabaseClient } from "../lib/util/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

export function UserProfile() {
  const { user, userId, loading, isAuthenticated } = useAuth();
  const supabase = createSupabaseClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button variant="outline" size="sm">
        Sign In
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar className="w-8 h-8">
        <AvatarImage src={user?.user_metadata?.avatar_url} />
        <AvatarFallback>
          {user?.email?.charAt(0).toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="hidden sm:block">
        <p className="text-sm font-medium">{user?.email}</p>
        <p className="text-xs text-muted-foreground">User ID: {userId}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  );
}
