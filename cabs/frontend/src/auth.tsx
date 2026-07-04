import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { TOKEN_KEY, fetchMe, login as apiLogin, register as apiRegister } from "./api";
import { storageDelete, storageGet, storageSet } from "./storage";

const USER_KEY = "auth_user";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  mobile?: string;
  image?: string[];
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (params: {
    email: string;
    password: string;
    name: string;
    mobile: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const persistUser = useCallback(async (nextUser: User | null) => {
    if (!nextUser) {
      await storageDelete(USER_KEY);
      return;
    }
    await storageSet(USER_KEY, JSON.stringify(nextUser));
  }, []);

  const readCachedUser = useCallback(async () => {
    try {
      const raw = await storageGet(USER_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as User;
      if (parsed && parsed.id) return parsed;
    } catch {
      // Ignore malformed cache and continue with a fresh bootstrap.
    }
    return null;
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      const token = await storageGet(TOKEN_KEY);
      const storedUserId = await storageGet("user_id");
      const cachedUser = await readCachedUser();

      if (cachedUser && !token && !storedUserId) {
        setUser(cachedUser);
        return;
      }

      if (token && storedUserId) {
        const res = await fetchMe(storedUserId);
        // getPartnersById returns the user object directly (not wrapped in sessionData.user)
        const userData = res?.sessionData?.user || res?.user || res;
        if (userData && (userData._id || userData.id || userData.loggedUserId)) {
          const role = userData.role || userData.loggedUserRole;
          // Force-logout if session belongs to a non-Rider account
          if (role && role !== "Rider") {
            await storageDelete(TOKEN_KEY);
            await storageDelete("user_id");
            await storageDelete(USER_KEY);
            setUser(null);
            return;
          }
          setUser({
            id: String(userData._id || userData.id || userData.loggedUserId),
            email: userData.email || userData.loggedUserEmail || "",
            name: userData.name || userData.loggedUserName || "",
            role: role || "Rider",
            mobile: userData.mobile || userData.loggedUserMobile,
            image: userData.images || userData.image || userData.loggedUserImage,
          });
          await persistUser({
            id: String(userData._id || userData.id || userData.loggedUserId),
            email: userData.email || userData.loggedUserEmail || "",
            name: userData.name || userData.loggedUserName || "",
            role: role || "Rider",
            mobile: userData.mobile || userData.loggedUserMobile,
            image: userData.images || userData.image || userData.loggedUserImage,
          });
        }
      }
    } catch (error: any) {
      console.error("Auth bootstrap error:", error);
      if (error?.response) {
        await storageDelete(TOKEN_KEY);
        await storageDelete("user_id");
        await storageDelete(USER_KEY);
        setUser(null);
        return;
      }

      const cachedUser = await readCachedUser();
      if (cachedUser) {
        setUser(cachedUser);
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [persistUser, readCachedUser]);

  useEffect(() => {
    void (async () => {
      await bootstrap();
    })();
  }, [bootstrap]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);

    // ── Rider-only gate ──────────────────────────────────
    if (res.loggedUserRole !== "Rider") {
      throw new Error("Access denied. Only Rider accounts can use this app.");
    }

    // Use rsToken as the primary token
    const token = res.rsToken;
    const userId = res.loggedUserId;

    await storageSet(TOKEN_KEY, token);
    await storageSet("user_id", userId);
    const nextUser = {
      id: res.loggedUserId,
      email: res.loggedUserEmail,
      name: res.loggedUserName,
      role: res.loggedUserRole,
      mobile: (res as any).loggedUserMobile,
      image: res.loggedUserImage,
    };
    setUser(nextUser);
    await persistUser(nextUser);
  }, [persistUser]);

  const register = useCallback(
    async (params: {
      email: string;
      password: string;
      name: string;
      mobile: string;
    }) => {
      const res = await apiRegister(params);
      // Fallback if register returns different structure
      const token = res.rsToken || res.token;
      const userId = res.loggedUserId || res.user?.id;

      if (token) await storageSet(TOKEN_KEY, token);
      if (userId) await storageSet("user_id", userId);

      if (res.loggedUserId) {
        const nextUser = {
          id: res.loggedUserId,
          email: res.loggedUserEmail,
          name: res.loggedUserName,
          role: res.loggedUserRole,
          image: res.loggedUserImage,
        };
        setUser(nextUser);
        await persistUser(nextUser);
      }
    },
    [persistUser],
  );

  const logout = useCallback(async () => {
    await storageDelete(TOKEN_KEY);
    await storageDelete("user_id");
    await storageDelete(USER_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function formatApiError(err: any): string {
  const detail = err?.response?.data?.detail ?? err?.response?.data?.message;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((d: any) => (typeof d?.msg === "string" ? d.msg : JSON.stringify(d)))
      .join(" ");
  if (detail && typeof detail?.msg === "string") return detail.msg;
  return err?.message || "Something went wrong";
}
