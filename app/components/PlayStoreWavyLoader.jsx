import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View, Image } from "react-native";
import Svg, { Path } from "react-native-svg";

const SIZES = {
  small: { width: 24, height: 16, barWidth: 3, gap: 3 },
  medium: { width: 36, height: 24, barWidth: 4, gap: 4 },
  large: { width: 52, height: 34, barWidth: 5, gap: 5 },
};

const LOADING_MESSAGES = [
  "Something nice is happening",
  "Please wait for the magic",
  "Finding your perfect escape",
  "Book awesome tours",
  "Your next adventure is loading",
];

// A custom wavy path mimicking the 10-petal flower/gear shape.
// This is an approximation mapped to a viewBox of 0 0 120 120
const WAVY_PATH = `
  M 60,10
  C 68,10 72,16 77,20
  C 84,24 92,23 96,29
  C 100,35 97,42 101,48
  C 105,54 112,58 110,65
  C 108,72 101,73 97,79
  C 93,85 94,93 88,97
  C 82,101 75,98 69,101
  C 63,104 60,110 53,109
  C 46,108 43,101 37,98
  C 31,95 24,96 20,91
  C 16,86 19,79 16,73
  C 13,67 7,63 8,56
  C 9,49 16,48 19,42
  C 22,36 21,28 26,24
  C 31,20 38,23 44,20
  C 50,17 53,10 60,10 Z
`;

// Calculate approx total length for dash animation
const PATH_LENGTH = 450;

/** A compact inline loader, with a Play Store-style wavy loader for full-screen states. */
export default function PlayStoreWavyLoader({
  size = "medium",
  color = "#1d4ed8", // Match the deep blue from the reference
  style,
  bars = 4,
  showMessage = size === "large",
}) {
  const config = SIZES[size] || SIZES.medium;
  const values = useRef(
    Array.from({ length: bars }, () => new Animated.Value(0.28)),
  ).current;
  
  const rotation = useRef(new Animated.Value(0)).current;
  const dashOffset = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(1)).current;
  const [messageIndex, setMessageIndex] = useState(0);

  // Animation for the compact bar loader
  useEffect(() => {
    if (showMessage) return; // Only run if not showing full screen loader

    const animations = values.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 100),
          Animated.timing(value, {
            toValue: 1,
            duration: 420,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.28,
            duration: 420,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay((values.length - index - 1) * 100),
        ]),
      ),
    );

    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [values, showMessage]);

  // Animation for the full screen wavy loader
  useEffect(() => {
    if (!showMessage) return undefined;

    // Slow rotation of the entire SVG
    const rotateAnimation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 10000, // 10 seconds for a slow, smooth spin
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    // Drawing the progress path
    const dashAnimation = Animated.loop(
       Animated.sequence([
           Animated.timing(dashOffset, {
               toValue: 1, // Will map to offset PATH_LENGTH to -PATH_LENGTH
               duration: 3000, // 3 seconds per cycle
               easing: Easing.linear,
               useNativeDriver: false, // strokeDashoffset doesn't support native driver well in some RN SVG versions
           })
       ])
    );

    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(messageOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(messageOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 1800);

    rotateAnimation.start();
    dashAnimation.start();
    return () => {
      clearInterval(interval);
      rotateAnimation.stop();
      dashAnimation.stop();
    };
  }, [messageOpacity, rotation, dashOffset, showMessage]);

  const containerStyle = useMemo(
    () => ({ width: config.width, height: config.height, gap: config.gap }),
    [config],
  );

  if (showMessage) {
    const rotate = rotation.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
    });
    
    // Interpolate dash offset for the drawing effect
    const animatedDashOffset = dashOffset.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [PATH_LENGTH, PATH_LENGTH * 0.1, -PATH_LENGTH]
    });

    // In React Native SVG, we need to pass a string for strokeDasharray if we want it constant
    const dashArray = `${PATH_LENGTH}`;

    return (
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={LOADING_MESSAGES[messageIndex]}
        style={[styles.fullScreen, style]}
      >
        <View style={styles.loaderContainer}>
            {/* The Rotating Wavy SVG */}
            <Animated.View style={[styles.svgWrapper, { transform: [{ rotate }] }]}>
            <Svg width={150} height={150} viewBox="0 0 120 120" style={styles.svg}>
                {/* Background Path (Light Blue) */}
                <Path
                    d={WAVY_PATH}
                    fill="none"
                    stroke="#e0f2fe" // Light blue background
                    strokeWidth="6"
                    strokeLinecap="round"
                />
                {/* Progress Path (Deep Blue) */}
                <AnimatedPath
                    d={WAVY_PATH}
                    fill="none"
                    stroke={color}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={dashArray}
                    strokeDashoffset={animatedDashOffset}
                />
            </Svg>
            </Animated.View>
        </View>

        <Animated.Text style={[styles.message, { opacity: messageOpacity }]}>
          {LOADING_MESSAGES[messageIndex]}
        </Animated.Text>
      </View>
    );
  }

  return (
    <View
      accessibilityRole="progressbar"
      style={[styles.container, containerStyle, style]}
    >
      {values.map((value, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              width: config.barWidth,
              height: config.height,
              backgroundColor: color,
              opacity: value,
              transform: [
                {
                  scaleY: value.interpolate({
                    inputRange: [0.28, 1],
                    outputRange: [0.42, 1],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

// Need to create an animated version of Path to use animated values for strokeDashoffset
const AnimatedPath = Animated.createAnimatedComponent(Path);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  fullScreen: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 220,
    minHeight: 170,
    backgroundColor: '#f8f9fa', // Added background color similar to HTML version
    padding: 20,
    borderRadius: 20, // Optional: add some rounding if this sits in a card
  },
  loaderContainer: {
    position: 'relative',
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    // Start rotated slightly to match the image orientation
    transform: [{ rotate: '-90deg' }],
  },
  message: {
    color: "#6b7280", // Changed to a greyish tone like "Installing..."
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.15,
    marginTop: 20,
    textAlign: "center",
  },
  bar: { borderRadius: 99 },
});