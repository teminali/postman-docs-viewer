"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FileJson, Loader2, Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const { sendPasswordReset, authError, clearAuthError, isConfigured, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    if (!email.trim()) return;
    setBusy(true);
    setSent(false);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
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
              Add NEXT_PUBLIC_FIREBASE_* variables to .env.local. See .env.example.
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
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sent ? (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">Check your email</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  If an account exists for {email}, you&apos;ll receive a link to reset your password.
                </p>
              </div>
            </div>
          ) : (
            <>
              {authError && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                  {authError}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="forgot-email"
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
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
                </Button>
              </form>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row justify-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary font-medium hover:underline">
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
