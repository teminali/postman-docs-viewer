"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { FileJson, Loader2, User, Shield, Mail, Lock, Link2, LogOut } from "lucide-react";

function getProviderLabel(providerId: string): string {
  switch (providerId) {
    case "google.com":
      return "Google";
    case "password":
      return "Email";
    default:
      return providerId;
  }
}

export default function SettingsPage() {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    isConfigured,
    signOut,
    updateUserProfile,
    changePassword,
    linkGoogle,
    linkEmail,
    authError,
    clearAuthError,
  } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [linkEmailValue, setLinkEmailValue] = useState("");
  const [linkPasswordValue, setLinkPasswordValue] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? "");
      setPhotoURL(user.photoURL ?? "");
    }
  }, [user]);

  useEffect(() => {
    clearAuthError();
  }, [clearAuthError]);

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Firebase not configured</CardTitle>
            <CardDescription>Add NEXT_PUBLIC_FIREBASE_* to .env.local to use settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/app">Back to app</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  const hasGoogle = user.providerData.some((p) => p.providerId === "google.com");
  const hasPassword = user.providerData.some((p) => p.providerId === "password");

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileBusy(true);
    clearAuthError();
    try {
      await updateUserProfile({
        displayName: displayName.trim() || undefined,
        photoURL: photoURL.trim() || undefined,
      });
    } catch {
      // error in authError
    } finally {
      setProfileBusy(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword || newPassword.length < 6) return;
    setPasswordBusy(true);
    clearAuthError();
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      // error in authError
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleLinkGoogle = async () => {
    setLinkBusy(true);
    clearAuthError();
    try {
      await linkGoogle();
    } catch {
      // error in authError
    } finally {
      setLinkBusy(false);
    }
  };

  const handleLinkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkEmailValue.trim() || !linkPasswordValue) return;
    setLinkBusy(true);
    clearAuthError();
    try {
      await linkEmail(linkEmailValue.trim(), linkPasswordValue);
      setLinkEmailValue("");
      setLinkPasswordValue("");
    } catch {
      // error in authError
    } finally {
      setLinkBusy(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-14 items-center gap-4 px-4">
          <Link href="/app" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <FileJson className="h-5 w-5" />
            <span className="font-semibold">Postman Docs Viewer</span>
          </Link>
          <nav className="flex-1" />
          <Button variant="ghost" size="sm" className="gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="container max-w-2xl py-8 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your profile and account security.
          </p>
        </div>

        {authError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-6">
            {authError}
          </div>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Update your display name and profile photo. Changes are saved to your Firebase account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={(photoURL || user.photoURL) ?? undefined} alt={user.displayName ?? undefined} />
                    <AvatarFallback className="text-lg">
                      {(user.displayName || user.email || "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{user.displayName || "No name set"}</p>
                    <p>{user.email || "—"}</p>
                  </div>
                </div>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      disabled={profileBusy}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="photoURL">Photo URL</Label>
                    <Input
                      id="photoURL"
                      type="url"
                      value={photoURL}
                      onChange={(e) => setPhotoURL(e.target.value)}
                      placeholder="https://..."
                      disabled={profileBusy}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {user.email || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Primary email is managed by your sign-in provider. Link another account in Security.
                    </p>
                  </div>
                  <Button type="submit" disabled={profileBusy}>
                    {profileBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Change password</CardTitle>
                <CardDescription>
                  Update your password. You need your current password. Only available if you signed up with email.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasPassword ? (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="currentPassword"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="pl-9"
                          placeholder="••••••••"
                          disabled={passwordBusy}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pl-9"
                          placeholder="At least 6 characters"
                          disabled={passwordBusy}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm new password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={passwordBusy}
                      />
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-xs text-destructive">Passwords do not match.</p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={
                        passwordBusy ||
                        !currentPassword ||
                        newPassword.length < 6 ||
                        newPassword !== confirmPassword
                      }
                    >
                      {passwordBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change password"}
                    </Button>
                  </form>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    You signed in with Google only. Link an email account below to set a password, or use &quot;Link
                    email&quot; to add email/password sign-in.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Linked accounts
                </CardTitle>
                <CardDescription>
                  Connect Google or email so you can sign in with either. Your data stays in one account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm font-medium mb-2">Current sign-in methods</p>
                  <div className="flex flex-wrap gap-2">
                    {user.providerData.map((p) => (
                      <span
                        key={p.providerId}
                        className="inline-flex items-center rounded-md border bg-muted/50 px-3 py-1 text-sm"
                      >
                        {getProviderLabel(p.providerId)}
                      </span>
                    ))}
                  </div>
                </div>
                <Separator />
                {!hasGoogle && (
                  <div className="space-y-2">
                    <Label>Link Google account</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Sign in with Google and attach it to this account.
                    </p>
                    <Button variant="outline" onClick={handleLinkGoogle} disabled={linkBusy}>
                      {linkBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Link Google"}
                    </Button>
                  </div>
                )}
                {!hasPassword && (
                  <div className="space-y-2">
                    <Label>Link email account</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Add email/password sign-in to this account. Use an email that isn’t already registered.
                    </p>
                    <form onSubmit={handleLinkEmail} className="space-y-2">
                      <Input
                        type="email"
                        placeholder="Email"
                        value={linkEmailValue}
                        onChange={(e) => setLinkEmailValue(e.target.value)}
                        disabled={linkBusy}
                      />
                      <Input
                        type="password"
                        placeholder="Password"
                        value={linkPasswordValue}
                        onChange={(e) => setLinkPasswordValue(e.target.value)}
                        disabled={linkBusy}
                      />
                      <Button type="submit" disabled={linkBusy || !linkEmailValue.trim() || !linkPasswordValue}>
                        {linkBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Link email"}
                      </Button>
                    </form>
                  </div>
                )}
                {hasGoogle && hasPassword && (
                  <p className="text-sm text-muted-foreground">
                    You have both Google and email linked. You can sign in with either.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
