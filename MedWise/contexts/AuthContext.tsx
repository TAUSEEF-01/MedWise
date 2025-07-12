import React, { createContext, useContext, useState, useEffect } from "react";
import { authService, CurrentUser } from "@/utils/authService";

interface AuthContextType {
  isAuthenticated: boolean | null;
  isLoading: boolean;
  currentUser: CurrentUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  getCurrentUser: () => Promise<CurrentUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const getCurrentUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      return user;
    } catch (error) {
      console.error("AuthContext: Get current user error:", error);
      return null;
    }
  };

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const loggedIn = await authService.isLoggedIn();
      console.log("AuthContext: Authentication status:", loggedIn);

      if (loggedIn) {
        // If token exists, verify it's valid by trying to get user data
        const userData = await authService.getCurrentUser();
        if (!userData) {
          // Token exists but is invalid (404, expired, etc.)
          console.log("AuthContext: Token invalid, logging out...");
          await authService.logout();
          setIsAuthenticated(false);
          return;
        }
      }

      setIsAuthenticated(loggedIn);
    } catch (error) {
      console.error("AuthContext: Auth check error:", error);
      // On any auth error, clear auth state and logout
      await authService.logout();
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userData = await authService.login({ user_email: email, password });
      console.log("AuthContext: Login successful, updating state...");

      // Set authenticated immediately after successful login
      setIsAuthenticated(true);

      // Fetch current user data
      await getCurrentUser();

      return userData;
    } catch (error) {
      console.error("AuthContext: Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log("AuthContext: Starting logout...");

      // Set to false immediately to prevent UI delays
      setIsAuthenticated(false);
      setCurrentUser(null);

      // Then clear the token in background
      await authService.logout();
      console.log("AuthContext: Logout completed");
    } catch (error) {
      console.error("AuthContext: Logout error:", error);
      // Still set to false even if logout API fails
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  };

  // Initial auth check
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        currentUser,
        login,
        logout,
        checkAuth,
        getCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
