"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { FieldSeparator } from "@/components/ui/field";

export function OAuthButtons({ disabled }: { disabled?: boolean }) {
  const [oauthLoading, setOauthLoading] = useState<"github" | "google" | null>(
    null,
  );

  async function handleOAuth(provider: "github" | "google") {
    setOauthLoading(provider);
    try {
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL: "/dashboard",
      });
      if (error) toast.error(error.message ?? "OAuth sign-in failed");
    } catch {
      toast.error("OAuth sign-in failed. Please try again.");
    } finally {
      setOauthLoading(null);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuth("github")}
          disabled={!!oauthLoading || disabled}
          className="gap-2 border-border/60 hover:bg-accent/80"
        >
          {oauthLoading === "github" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <SiGithub className="size-4" />
          )}
          GitHub
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuth("google")}
          disabled={!!oauthLoading || disabled}
          className="gap-2 border-border/60 hover:bg-accent/80"
        >
          {oauthLoading === "google" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <SiGoogle className="size-4" />
          )}
          Google
        </Button>
      </div>
      <FieldSeparator>Or continue with email</FieldSeparator>
    </>
  );
}
