import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { User } from "../types";
import { authApi, setAccessToken } from "../api";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const refreshedUser = await authApi.refresh();
      setUser(refreshedUser);
    } catch {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  // При монтировании пробуем восстановить сессию через refresh
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await refreshAuth();
      setIsLoading(false);
    };
    init();
  }, [refreshAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const loggedUser = await authApi.login({ email, password });
    setUser(loggedUser);
  }, []);

  const register = useCallback(async (email: string, username: string, password: string) => {
    const newUser = await authApi.register({ email, username, password });
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    login,
    register,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
