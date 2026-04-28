"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { auth } from "../lib/firebase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  hasResearchAccess: boolean;
  isElite: boolean;
  sessionConflict: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  hasResearchAccess: false,
  isElite: false,
  sessionConflict: false,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [accessReady, setAccessReady] = useState(false);
  const [hasResearchAccess, setHasResearchAccess] = useState(false);
  const [isElite, setIsElite] = useState(false);
  const [sessionConflict, setSessionConflict] = useState(false);

  // loading is true until BOTH firebase auth and backend access check complete
  const loading = !authReady || (user !== null && !accessReady);

  // Generate or retrieve session ID for this browser
  const getSessionId = () => {
    let sid = sessionStorage.getItem("mezan_session_id");
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem("mezan_session_id", sid);
    }
    return sid;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);

      if (firebaseUser) {
        setAccessReady(false);
        const sessionId = getSessionId();

        // Register this session
        try {
          await fetch("/api/auth/me", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid: firebaseUser.uid, sessionId }),
          });
        } catch {}

        // Check access via backend
        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch(`/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Session-Id": sessionId,
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.sessionConflict) {
              setSessionConflict(true);
              setHasResearchAccess(false);
              setIsElite(false);
            } else {
              setSessionConflict(false);
              setHasResearchAccess(data.hasResearchAccess || false);
              setIsElite(data.isElite || false);
            }
          } else {
            setHasResearchAccess(false);
            setIsElite(false);
          }
        } catch (err) {
          console.warn("Access check failed:", err);
          setHasResearchAccess(false);
          setIsElite(false);
        } finally {
          setAccessReady(true);
        }
      } else {
        setHasResearchAccess(false);
        setIsElite(false);
        setSessionConflict(false);
        setAccessReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (user) {
      try {
        await fetch("/api/auth/me", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: user.uid }),
        });
      } catch {}
    }
    sessionStorage.removeItem("mezan_session_id");
    await signOut(auth);
    setHasResearchAccess(false);
    setIsElite(false);
    setSessionConflict(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, hasResearchAccess, isElite, sessionConflict, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
