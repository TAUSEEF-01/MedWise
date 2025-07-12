// import FontAwesome from "@expo/vector-icons/FontAwesome";
// import {
//   DarkTheme,
//   DefaultTheme,
//   ThemeProvider,
// } from "@react-navigation/native";
// import { useFonts } from "expo-font";
// import { Stack } from "expo-router";
// import * as SplashScreen from "expo-splash-screen";
// import { StatusBar } from "expo-status-bar";
// import { useColorScheme } from "@/components/useColorScheme";
// import CustomSplashScreen from "@/components/SplashScreen";
// import React, { useEffect, useState } from "react";
// import { authService } from "@/utils/authService";
// import { View, Text } from "react-native";

// export {
//   // Catch any errors thrown by the Layout component.
//   ErrorBoundary,
// } from "expo-router";

// export const unstable_settings = {
//   // Ensure that reloading on `/modal` keeps a back button present.
//   initialRouteName: "(tabs)",
// };

// // Prevent the splash screen from auto-hiding before asset loading is complete.
// SplashScreen.preventAutoHideAsync();

// export default function RootLayout() {
//   const [loaded, error] = useFonts({
//     SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
//     ...FontAwesome.font,
//   });
//   const [showSplash, setShowSplash] = useState(true);

//   // Expo Router uses Error Boundaries to catch errors in the navigation tree.
//   useEffect(() => {
//     if (error) throw error;
//   }, [error]);

//   useEffect(() => {
//     if (loaded) {
//       SplashScreen.hideAsync();
//     }
//   }, [loaded]);

//   const handleSplashFinish = () => {
//     setShowSplash(false);
//   };

//   if (!loaded) {
//     return null;
//   }

//   if (showSplash) {
//     return <CustomSplashScreen onFinish={handleSplashFinish} />;
//   }

//   return <RootLayoutNav />;
// }

// function RootLayoutNav() {
//   const colorScheme = useColorScheme();

//   return (
//     <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
//       <StatusBar style="light" backgroundColor="#2563eb" />
//       <Stack>
//         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//         <Stack.Screen
//           name="manual-entry"
//           options={{
//             headerShown: false,
//             presentation: "modal",
//           }}
//         />
//       </Stack>
//     </ThemeProvider>
//   );
// }

import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/components/useColorScheme";
import { ManualEntryProvider } from "./manual-entry/ManualEntryContext";
import React, { useEffect, useState } from "react";
import { useRouter, useSegments } from "expo-router";
import { authService } from "@/utils/authService";
import { View, Text } from "react-native";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  if (!loaded) {
    return null;
  }

  if (error) throw error;

  return <RootLayoutNav />;
}

// Create a global reference to force auth check
let globalForceAuthCheck: (() => void) | null = null;

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authCheckTrigger, setAuthCheckTrigger] = useState(0);

  // Create a function to force auth recheck
  const forceAuthCheck = () => {
    console.log("Force auth check triggered");
    setAuthCheckTrigger((prev) => prev + 1);
  };

  // Set the global reference
  globalForceAuthCheck = forceAuthCheck;

  // Initial auth check on app start and when triggered
  useEffect(() => {
    const initialAuthCheck = async () => {
      try {
        setIsLoading(true);
        console.log("Performing auth check...");

        // Small delay to ensure any recent token storage operations are complete
        await new Promise((resolve) => setTimeout(resolve, 100));

        const loggedIn = await authService.isLoggedIn();
        console.log("Authentication status:", loggedIn);
        setIsAuthenticated(loggedIn);
      } catch (e) {
        console.error("Auth check error:", e);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initialAuthCheck();
  }, [authCheckTrigger]);

  // Handle navigation based on auth status - but only after initial load
  useEffect(() => {
    if (isAuthenticated === null || isLoading) {
      return; // Still checking auth, don't navigate yet
    }

    const inAuthGroup = segments[0] === "(tabs)";
    const isAuthPage = segments[0] === "login" || segments[0] === "signup";

    console.log(
      "Navigation check - Auth:",
      isAuthenticated,
      "In auth group:",
      inAuthGroup,
      "Is auth page:",
      isAuthPage
    );

    // Only redirect if we have a definitive auth state
    if (isAuthenticated && isAuthPage) {
      // User is logged in but on login/signup page, redirect to main app
      console.log(
        "Authenticated user on auth page, redirecting to main app..."
      );
      router.replace("/(tabs)");
    } else if (!isAuthenticated && inAuthGroup) {
      // User is not logged in but trying to access authenticated section
      console.log(
        "Unauthenticated user in protected area, redirecting to login..."
      );
      router.replace("/login");
    }
  }, [isAuthenticated, segments, isLoading]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f0f3fa",
        }}
      >
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ManualEntryProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
            initialParams={{ forceAuthCheck }}
          />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen
            name="manual-entry"
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="edit-profile"
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="analysis-result"
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="image-uploads"
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
        </Stack>
      </ThemeProvider>
    </ManualEntryProvider>
  );
}

// Export the global force auth check function
export const forceGlobalAuthCheck = () => {
  if (globalForceAuthCheck) {
    globalForceAuthCheck();
  }
};
