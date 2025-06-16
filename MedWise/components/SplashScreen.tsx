import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start all animations
    Animated.parallel([
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Scale up animation for icon
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      // Slide up animation for text
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation for icon
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      delay: 200,
      useNativeDriver: false,
    }).start(() => {
      // Call onFinish when animation completes
      setTimeout(() => {
        onFinish();
      }, 500);
    });

    // Pulse animation for loading text
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.7],
  });

  return (
    <LinearGradient
      colors={["#2563eb", "#3b82f6", "#1d4ed8"]}
      style={styles.container}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Animated Medical Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: scaleAnim }, { rotate: rotation }],
            },
          ]}
        >
          <View style={styles.iconBackground}>
            <MaterialIcons name="medical-services" size={80} color="#FFFFFF" />
          </View>
        </Animated.View>

        {/* Animated Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>MedWise</Text>
        </Animated.View>

        {/* Health Icons */}
        <Animated.View
          style={[
            styles.healthIconsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.healthIcon}>
            <MaterialIcons name="favorite" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.healthIcon}>
            <MaterialIcons name="healing" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.healthIcon}>
            <MaterialIcons name="local-hospital" size={20} color="#FFFFFF" />
          </View>
        </Animated.View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressWidth,
                },
              ]}
            />
          </View>
        </View>

        {/* Loading Text */}
        <Animated.View
          style={[
            styles.loadingContainer,
            {
              opacity: pulseAnim,
            },
          ]}
        >
          <Text style={styles.loadingText}>
            Initializing your health companion...
          </Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View
          style={[
            styles.subtitleContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.subtitle}>
            Your Complete Healthcare Assistant
          </Text>
          <Text style={styles.features}>
            AI-Powered • Secure • Comprehensive
          </Text>
        </Animated.View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  iconBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  titleContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 3,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  healthIconsContainer: {
    flexDirection: "row",
    marginBottom: 40,
    gap: 15,
  },
  healthIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  progressContainer: {
    marginVertical: 30,
    alignItems: "center",
  },
  progressTrack: {
    width: width * 0.7,
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
    shadowColor: "#FFFFFF",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
  },
  loadingContainer: {
    marginBottom: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: "center",
    fontWeight: "400",
    letterSpacing: 0.5,
  },
  subtitleContainer: {
    position: "absolute",
    bottom: 80,
    alignItems: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#FFFFFF",
    opacity: 0.95,
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 1,
    marginBottom: 8,
  },
  features: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
    textAlign: "center",
    fontWeight: "300",
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
