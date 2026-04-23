import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, authStorage } from "../api/client";

const AuthContext = createContext(null);

const readStoredAuth = () => {
  if (typeof window === "undefined") {
    return { token: "", user: null };
  }

  const rawValue = window.localStorage.getItem(authStorage.key);

  if (!rawValue) {
    return { token: "", user: null };
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    return { token: "", user: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(readStoredAuth);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const syncUser = async () => {
      if (!authState.token) {
        setIsReady(true);
        return;
      }

      try {
        const user = await api.getMe();
        const nextState = { token: authState.token, user };
        setAuthState(nextState);
        window.localStorage.setItem(authStorage.key, JSON.stringify(nextState));
      } catch (error) {
        window.localStorage.removeItem(authStorage.key);
        setAuthState({ token: "", user: null });
      } finally {
        setIsReady(true);
      }
    };

    syncUser();
  }, []);

  const value = useMemo(
    () => ({
      user: authState.user,
      token: authState.token,
      isAuthenticated: Boolean(authState.token && authState.user),
      isReady,
      login: async (credentials) => {
        const result = await api.login(credentials);
        const nextState = {
          token: result.token,
          user: result.user
        };
        setAuthState(nextState);
        window.localStorage.setItem(authStorage.key, JSON.stringify(nextState));
        return result.user;
      },
      logout: () => {
        window.localStorage.removeItem(authStorage.key);
        setAuthState({ token: "", user: null });
      }
    }),
    [authState, isReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
};
