import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { clearAuthSession, getRefreshToken, getToken, getUserId, saveAuthSession } from '../utils/credentials';
import { baseURL } from '../utils/baseUrl';

const AuthContext = createContext();
const TOKEN_VALIDATE_TIMEOUT_MS = 8000;

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [isSignedIn, setIsSignedIn] = useState(null); // null = loading

  useEffect(() => {
    let mounted = true;

    const validateSession = async () => {
      try {
        const token = await getToken();
        if (!token) {
          if (mounted) setIsSignedIn(false);
          return;
        }

        // Quick local JWT expiry check (best-effort). If we can decode the
        // token and find an `exp` claim that is already passed, expire the
        // session immediately without waiting for server validation.
        try {
          const parts = String(token).split('.');
          if (parts.length >= 2) {
            const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            let payloadJson = null;
            try {
              if (typeof globalThis.atob === 'function') {
                // atob may not be available in all RN environments; try it first
                const text = globalThis.atob(payloadB64);
                payloadJson = decodeURIComponent(escape(text));
              } else if (typeof Buffer !== 'undefined') {
                payloadJson = Buffer.from(payloadB64, 'base64').toString('utf8');
              }
            } catch (e) {
              // fallthrough — cannot decode locally
              payloadJson = null;
            }

            if (payloadJson) {
              const payload = JSON.parse(payloadJson);
              if (payload && typeof payload.exp === 'number') {
                if (payload.exp * 1000 < Date.now()) {
                  // token expired locally — try refresh before clearing
                  const refreshToken = await getRefreshToken().catch(() => null);
                  if (refreshToken) {
                    try {
                      const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken }, { timeout: TOKEN_VALIDATE_TIMEOUT_MS });
                      if (res.data?.rsToken) {
                        await saveAuthSession({ token: res.data.rsToken, refreshToken: res.data.refreshToken });
                        if (mounted) setIsSignedIn(true);
                        return;
                      }
                    } catch {
                      // refresh failed, fall through to clear
                    }
                  }
                  await clearAuthSession();
                  if (mounted) setIsSignedIn(false);
                  return;
                }
              }
            }
          }
        } catch (e) {
          // ignore local parse errors and continue with server validation
        }

        const userId = await getUserId();
        if (!userId) {
          // Token exists but no userId — corrupted session, clear it.
          await clearAuthSession();
          if (mounted) setIsSignedIn(false);
          return;
        }

        // Validate token with the server
        const res = await axios.get(
          `${baseURL}/get/${encodeURIComponent(userId)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: TOKEN_VALIDATE_TIMEOUT_MS,
          },
        );

        if (res?.status >= 200 && res?.status < 300 && res?.data) {
          // Token is valid — allow access
          if (mounted) setIsSignedIn(true);
        } else {
          // Unexpected response — treat as invalid
          await clearAuthSession();
          if (mounted) setIsSignedIn(false);
        }
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          // Token expired or invalid — clear session, go to login
          await clearAuthSession();
          if (mounted) setIsSignedIn(false);
        } else {
          // Network error / server down — let user in if token exists locally.
          // The health-check overlay will handle the server-down state separately.
          const token = await getToken().catch(() => null);
          if (mounted) setIsSignedIn(!!token);
        }
      }
    };

    validateSession();
    return () => { mounted = false; };
  }, []);

  const signIn = async (token, userId, email, refreshToken) => {
    await saveAuthSession({ token, userId, email, refreshToken });
    setIsSignedIn(true);
  };

  const signOut = async () => {
    await clearAuthSession();
    setIsSignedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isSignedIn, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
