import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

type StoredUser = {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: number;
};

type Session = {
  userId: string;
  email: string;
  name: string;
};

type AuthCtx = {
  user: Session | null;
  loading: boolean;
  signUp: (email: string, name: string, password: string) => string | null;
  signIn: (email: string, password: string) => string | null;
  signOut: () => void;
};

const USERS_KEY = "rbm:users";
const SESSION_KEY = "rbm:session";

function read<T>(k: string, fallback: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(k: string, v: T) {
  localStorage.setItem(k, JSON.stringify(v));
}

function getUsers(): StoredUser[] {
  return read<StoredUser[]>(USERS_KEY, []);
}

function saveUsers(users: StoredUser[]) {
  write(USERS_KEY, users);
}

function getSession(): Session | null {
  return read<Session | null>(SESSION_KEY, null);
}

function saveSession(s: Session | null) {
  if (s) write(SESSION_KEY, s);
  else localStorage.removeItem(SESSION_KEY);
}

export function getUserId(): string | null {
  return getSession()?.userId ?? null;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getSession());
    setLoading(false);
  }, []);

  const signUp = useCallback((email: string, name: string, password: string): string | null => {
    const users = getUsers();
    if (users.some((u) => u.email === email)) return "Email already registered";
    const newUser: StoredUser = {
      id: `u_${Date.now()}`,
      email,
      name,
      password,
      createdAt: Date.now(),
    };
    saveUsers([...users, newUser]);
    const session: Session = { userId: newUser.id, email, name };
    saveSession(session);
    setUser(session);
    return null;
  }, []);

  const signIn = useCallback((email: string, password: string): string | null => {
    const users = getUsers();
    const found = users.find((u) => u.email === email);
    if (!found) return "No account found with this email";
    if (found.password !== password) return "Incorrect password";
    const session: Session = { userId: found.id, email, name: found.name };
    saveSession(session);
    setUser(session);
    return null;
  }, []);

  const signOut = useCallback(() => {
    saveSession(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
