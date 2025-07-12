import AsyncStorage from "@react-native-async-storage/async-storage";

const BACKEND_URL = "http://192.168.50.242:8000/auth";

interface SignupData {
  user_name: string;
  user_email: string;
  password: string;
  phone_no: string;
  blood_group: string;
  sex: string;
}

interface LoginData {
  user_email: string;
  password: string;
}

interface UserResponse {
  user_id: string;
  user_name: string;
  user_email: string;
  phone_no: string;
  blood_group: string;
  sex: string;
  created_at: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

const API_BASE_URL = "http://192.168.50.242:8000";
const TOKEN_KEY = "auth_token";

class AuthService {
  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async login(data: LoginData): Promise<UserResponse> {
    try {
      console.log("Attempting login with:", data.user_email);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("Login response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }

      const loginData: LoginResponse = await response.json();
      console.log("Login successful for user:", loginData.user.user_email);

      // Store the token
      await AsyncStorage.setItem(TOKEN_KEY, loginData.access_token);
      console.log("Token stored successfully");

      return loginData.user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async signup(data: SignupData): Promise<UserResponse> {
    try {
      console.log("Attempting signup with:", data.user_email);

      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("Signup response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Signup failed");
      }

      const signupData: LoginResponse = await response.json();
      console.log("Signup successful for user:", signupData.user.user_email);

      // Store the token
      await AsyncStorage.setItem(TOKEN_KEY, signupData.access_token);
      console.log("Token stored successfully");

      return signupData.user;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      console.log("Checking authentication status...");

      const authHeaders = await this.getAuthHeaders();
      console.log("Auth headers:", authHeaders);

      if (!authHeaders.Authorization) {
        console.log("No token found");
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/auth/check`, {
        method: "GET",
        headers: authHeaders,
      });

      console.log("Auth check response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Auth check result:", data);
        return data.authenticated;
      }

      const errorText = await response.text();
      console.log("Auth check failed with status:", response.status);
      console.log("Auth check error response:", errorText);
      return false;
    } catch (error) {
      console.error("Auth check error:", error);
      return false;
    }
  }

  async getCurrentUser(): Promise<UserResponse | null> {
    try {
      console.log("Getting current user...");

      const authHeaders = await this.getAuthHeaders();

      if (!authHeaders.Authorization) {
        console.log("No token found");
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: authHeaders,
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("Current user retrieved:", userData.user_email);
        return userData;
      }

      console.log("Failed to get current user, status:", response.status);
      return null;
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      console.log("Attempting logout...");

      // Remove token from storage
      await AsyncStorage.removeItem(TOKEN_KEY);

      // Optional: call logout endpoint
      const authHeaders = await this.getAuthHeaders();
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: authHeaders,
      });

      console.log("Logout completed");
    } catch (error) {
      console.error("Logout error:", error);
      // Still remove token even if API call fails
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  }
}

export const authService = new AuthService();
