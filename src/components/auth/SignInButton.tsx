"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    console.log("Signing in...");
    try {
      setIsLoading(true);
      const result = await signIn("github", {
        callbackUrl: "/dashboard",
        redirect: false,
      });
      
      if (result?.error) {
        console.error("Sign in error:", result.error);
        router.push("/auth/error");
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      router.push("/auth/error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      className="w-full"
      disabled={isLoading}
      variant="default"
    >
      {isLoading ? "Signing in..." : "Sign in with GitHub"}
    </Button>
  );
} 