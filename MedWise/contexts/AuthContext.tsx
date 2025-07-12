import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "@/utils/authService";

interface AuthContextType {
  isAuthenticated: boolean | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const loggedIn = await authService.isLoggedIn();
      console.log("AuthContext: Authentication status:", loggedIn);
      setIsAuthenticated(loggedIn);
    } catch (error) {
      console.error("AuthContext: Auth check error:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await authService.login({ user_email: email, password });
      console.log("AuthContext: Login successful, updating state...");
      setIsAuthenticated(true);
    } catch (error) {
      console.error("AuthContext: Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      console.log("AuthContext: Logout successful, updating state...");
      setIsAuthenticated(false);
    } catch (error) {
      console.error("AuthContext: Logout error:", error);
      setIsAuthenticated(false);
    }
  };

  // Initial auth check
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, login, logout, checkAuth }}
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
