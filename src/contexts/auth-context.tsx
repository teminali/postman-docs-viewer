"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "firebase/auth";
import {
  getFirebaseAuth,
  isFirebaseConfigured,
} from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  linkWithPopup,
  linkWithCredential,
  GoogleAuthProvider,
  EmailAuthProvider,
  type UserCredential,
} from "firebase/auth";

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  signUpWithEmail: (email: string, password: string) => Promise<UserCredential>;
  signInWithEmail: (email: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  linkGoogle: () => Promise<UserCredential>;
  linkEmail: (email: string, password: string) => Promise<UserCredential>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const isConfigured = isFirebaseConfigured();

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isConfigured]);

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      setAuthError(null);
      const auth = getFirebaseAuth();
      if (!auth) throw new Error("Firebase Auth is not configured");
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        return cred;
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "Sign up failed";
        setAuthError(message);
        throw err;
      }
    },
    []
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setAuthError(null);
      const auth = getFirebaseAuth();
      if (!auth) throw new Error("Firebase Auth is not configured");
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        return cred;
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "Sign in failed";
        setAuthError(message);
        throw err;
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase Auth is not configured");
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      return cred;
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Google sign in failed";
      setAuthError(message);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthError(null);
    const auth = getFirebaseAuth();
    if (!auth) return;
    await firebaseSignOut(auth);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    setAuthError(null);
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase Auth is not configured");
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to send reset email";
      setAuthError(message);
      throw err;
    }
  }, []);

  const updateUserProfile = useCallback(
    async (updates: { displayName?: string; photoURL?: string }) => {
      if (!user) throw new Error("Not signed in");
      setAuthError(null);
      try {
        await updateProfile(user, updates);
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "Failed to update profile";
        setAuthError(message);
        throw err;
      }
    },
    [user]
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!user || !user.email) throw new Error("Not signed in");
      setAuthError(null);
      const auth = getFirebaseAuth();
      if (!auth) throw new Error("Firebase Auth is not configured");
      try {
        const cred = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, cred);
        await updatePassword(user, newPassword);
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "Failed to change password";
        setAuthError(message);
        throw err;
      }
    },
    [user]
  );

  const linkGoogle = useCallback(async () => {
    if (!user) throw new Error("Not signed in");
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await linkWithPopup(user, provider);
      return cred;
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to link Google account";
      setAuthError(message);
      throw err;
    }
  }, [user]);

  const linkEmail = useCallback(
    async (email: string, password: string) => {
      if (!user) throw new Error("Not signed in");
      setAuthError(null);
      try {
        const cred = EmailAuthProvider.credential(email.trim(), password);
        const result = await linkWithCredential(user, cred);
        return result;
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "Failed to link email account";
        setAuthError(message);
        throw err;
      }
    },
    [user]
  );

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isConfigured,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      sendPasswordReset,
      updateUserProfile,
      changePassword,
      linkGoogle,
      linkEmail,
      authError,
      clearAuthError,
    }),
    [
      user,
      loading,
      isConfigured,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      sendPasswordReset,
      updateUserProfile,
      changePassword,
      linkGoogle,
      linkEmail,
      authError,
      clearAuthError,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
