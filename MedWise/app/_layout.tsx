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
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import React, { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
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

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAuth();

  // Handle navigation based on auth status
  useEffect(() => {
    if (isLoading) {
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

    if (isAuthenticated === false && inAuthGroup) {
      // User is not authenticated but trying to access protected area
      console.log(
        "Unauthenticated user in protected area, redirecting to login..."
      );
      router.replace("/login");
    } else if (isAuthenticated === true && isAuthPage) {
      // User is authenticated but on login/signup page, redirect to main app
      console.log(
        "Authenticated user on auth page, redirecting to main app..."
      );
      router.replace("/(tabs)");
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
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
