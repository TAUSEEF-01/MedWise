import AsyncStorage from "@react-native-async-storage/async-storage";

interface LoginData {
  user_email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    user_id: string;
    user_name: string;
    user_email: string;
    phone_no: string;
    blood_group: string;
    sex: string;
    created_at: string;
  };
}

interface CurrentUser {
  user_id: string;
  user_name: string;
  user_email: string;
  phone_no: string;
  blood_group: string;
  sex: string;
  created_at: string;
}

class AuthService {
  // For Android emulator, use 10.0.2.2 instead of localhost
  // For iOS simulator, localhost should work
  // For physical device, use your computer's IP address
  private baseURL = "https://medwise-9nv0.onrender.com"; // Android emulator
  // private baseURL = "https://medwise-9nv0.onrender.com"; // iOS simulator
  // private baseURL = "http://192.168.1.100:8000"; // Physical device (replace with your IP)

  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem("access_token");
      return token;
    } catch (error) {
      console.error("AuthService: Error getting token:", error);
      return null;
    }
  }

  async login(data: LoginData): Promise<LoginResponse> {
    try {
      console.log("AuthService: Attempting login for:", data.user_email);
      console.log("AuthService: Using baseURL:", this.baseURL);

      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        timeout: 10000, // 10 second timeout
      });

      console.log("AuthService: Login response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AuthService: Login failed:", errorText);
        throw new Error(`Login failed: ${response.status} - ${errorText}`);
      }

      const result: LoginResponse = await response.json();
      console.log("AuthService: Login successful, storing token...");

      // Store the token
      await AsyncStorage.setItem("access_token", result.access_token);
      await AsyncStorage.setItem("user_data", JSON.stringify(result.user));

      console.log("AuthService: Token and user data stored successfully");
      return result;
    } catch (error) {
      console.error("AuthService: Login error:", error);

      // Provide more specific error messages
      if (
        error instanceof TypeError &&
        error.message.includes("Network request failed")
      ) {
        throw new Error(
          "Cannot connect to server. Please check if the backend is running and accessible."
        );
      }

      throw error;
    }
  }

  // Add this method for testing without backend
  async loginMock(data: LoginData): Promise<LoginResponse> {
    console.log("Using mock login for testing");

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockResponse: LoginResponse = {
      access_token: "mock_token_123",
      token_type: "bearer",
      user: {
        user_id: "mock_user_id",
        user_name: "Test User",
        user_email: data.user_email,
        phone_no: "1234567890",
        blood_group: "O+",
        sex: "male",
        created_at: new Date().toISOString(),
      },
    };

    // Store mock data
    await AsyncStorage.setItem("access_token", mockResponse.access_token);
    await AsyncStorage.setItem("user_data", JSON.stringify(mockResponse.user));

    return mockResponse;
  }

  async logout(): Promise<void> {
    try {
      console.log("AuthService: Logging out...");
      await AsyncStorage.removeItem("access_token");
      await AsyncStorage.removeItem("user_data");
      console.log("AuthService: Logout completed");
    } catch (error) {
      console.error("AuthService: Logout error:", error);
      throw error;
    }
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) {
        console.log("AuthService: No token found");
        return false;
      }

      // For JWT tokens, we should verify with the server
      console.log("AuthService: Verifying token with server...");

      const response = await fetch(`${this.baseURL}/auth/check`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 5000, // 5 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        console.log("AuthService: Token verification result:", data);
        return data.authenticated === true;
      } else if (response.status === 404 || response.status === 401) {
        // Token is invalid
        console.log("AuthService: Token invalid during check, clearing...");
        await this.logout();
        return false;
      } else {
        console.log(
          "AuthService: Token check failed with status:",
          response.status
        );
        return false;
      }
    } catch (error) {
      console.error("AuthService: Token check error:", error);
      return false;
    }
  }

  async getCurrentUser(): Promise<CurrentUser | null> {
    try {
      const token = await this.getToken();
      if (!token) {
        console.log("No token found, user not authenticated");
        return null;
      }

      console.log(
        "AuthService: Fetching current user from:",
        `${this.baseURL}/auth/me`
      );

      const response = await fetch(`${this.baseURL}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("Current user data fetched successfully:", userData);
        return userData;
      } else if (response.status === 404 || response.status === 401) {
        // Token is invalid or user not found
        console.log(
          "AuthService: Invalid token (404/401), clearing auth data..."
        );
        await this.logout(); // Clear invalid token
        return null;
      } else {
        console.log("Failed to fetch current user:", response.status);
        const errorText = await response.text();
        console.log("Error details:", errorText);
        return null;
      }
    } catch (error) {
      console.error("Error fetching current user:", error);

      if (
        error instanceof TypeError &&
        error.message.includes("Network request failed")
      ) {
        console.error("Network connectivity issue when fetching user data");
      }

      return null;
    }
  }

  // Method to test server connectivity
  async testConnection(): Promise<boolean> {
    try {
      console.log("Testing connection to:", `${this.baseURL}/health`);

      const response = await fetch(`${this.baseURL}/health`, {
        method: "GET",
        timeout: 5000, // 5 second timeout
      });

      const isConnected = response.ok;
      console.log("Server connection test result:", isConnected);
      return isConnected;
    } catch (error) {
      console.error("Server connection test failed:", error);
      return false;
    }
  }
}

const authService = new AuthService();

export { authService, type LoginData, type LoginResponse, type CurrentUser };
