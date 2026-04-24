import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, setUnauthorizedHandler, tokenStore, type AuthUser, type Role } from "@/lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
   hasRole: (...roles: Role[]) => boolean;
   hasFeature: (feature: string) => boolean;
   hasPermission: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    const token = tokenStore.get();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((u) => setUser(u))
      .catch(() => {
        tokenStore.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: u } = await authApi.login(email, password);
    tokenStore.set(token);
    setUser(u);
    return u;
  }, []);

   const hasRole = useCallback(
     (...roles: Role[]) => !!user && roles.includes(user.role),
     [user]
   );
 
   const hasFeature = useCallback(
     (feature: string) => {
       if (user?.role === "super_admin") return true;
       return !!user?.features?.[feature];
     },
     [user]
   );
 
   const hasPermission = useCallback(
     (path: string) => {
       if (user?.role === "super_admin") return true;
       const parts = path.split(".");
       let allowed: any = user?.permissions;
       for (const p of parts) {
         allowed = allowed?.[p];
       }
       return allowed === true;
     },
     [user]
   );

  return (
     <AuthContext.Provider value={{ user, loading, login, logout, hasRole, hasFeature, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
