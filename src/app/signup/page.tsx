"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileJson, Loader2, Mail, Lock } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle, authError, clearAuthError, isConfigured, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    if (!email.trim() || !password || !confirmPassword) return;
    if (password !== confirmPassword) {
      clearAuthError();
      return;
    }
    if (password.length < 6) {
      clearAuthError();
      return;
    }
    setBusy(true);
    try {
      await signUpWithEmail(email.trim(), password);
      router.push("/app");
      router.refresh();
    } catch {
      // error in authError
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    clearAuthError();
    setBusy(true);
    try {
      await signInWithGoogle();
      router.push("/app");
      router.refresh();
    } catch {
      // error in authError
    } finally {
      setBusy(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Firebase not configured</CardTitle>
            <CardDescription>
              Add NEXT_PUBLIC_FIREBASE_* variables to .env.local to enable sign up. See .env.example.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href="/app">Back to app</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Link href="/app" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <FileJson className="h-5 w-5" />
        <span className="font-semibold">Postman Docs Viewer</span>
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Sign up with email or Google to get started.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {authError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {authError}
            </div>
          )}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="signup-email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  autoComplete="email"
                  disabled={busy}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="signup-password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  autoComplete="new-password"
                  disabled={busy}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="signup-confirm" className="text-sm font-medium">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9"
                  autoComplete="new-password"
                  disabled={busy}
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match.</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={busy || password !== confirmPassword || password.length < 6}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign up"}
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase text-muted-foreground">
              <span className="bg-card px-2">Or continue with</span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogle}
            disabled={busy}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row justify-center text-sm text-muted-foreground">
          <span>Already have an account?</span>
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
