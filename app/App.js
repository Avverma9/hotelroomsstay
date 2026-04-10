import "./global.css";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  NavigationContainer,
  getFocusedRouteNameFromRoute,
} from "@react-navigation/native";
import { navigationRef } from "./utils/navigation";
import { Provider, useDispatch } from "react-redux";
import { resetAppState, store } from "./store";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import {
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  LogBox,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { AppModalProvider } from "./contexts/AppModalContext";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Toast from "react-native-toast-message";
import ThemedStatusBar from "./components/ThemedStatusBar";
import { requestStartupPermissionsIfNeeded } from "./utils/startupPermissions";
import { baseURL } from "./utils/baseUrl";
import {
  addNotificationResponseListener,
  clearLastNotificationResponseAsync,
  getLastNotificationResponseAsync,
  isPushNotificationsSupported,
  registerForPushNotificationsAsync,
  resolveNotificationRoute,
  syncPushTokenWithServer,
} from "./utils/pushNotifications";

import BootScreen from "./screens/BootScreen";
import LoginPage from "./screens/LoginRN";
import RegisterPage from "./screens/Register";
import Home from "./screens/Home";
import Cabs from "./screens/Cabs";
import Tour from "./screens/Tour";
import TourDetails from "./screens/TourDetails";
import Hotels from "./screens/Hotels";
import HotelDetails from "./screens/HotelDetails";
import PolicyScreen from "./screens/PolicyScreen";
import CabDetails from "./screens/CabDetails.jsx";
import NotificationsScreen from "./screens/Notifications";
import Profile from "./screens/Profile";
import ServerUnavailable from "./screens/ServerUnavailable";
import { fetchLocation } from "./store/slices/locationSlice";
import { searchHotel, frontHotels } from "./store/slices/hotelSlice";
import { getBeds, getRooms } from "./store/slices/additionalSlice";
import { fetchProfileData } from "./store/slices/userSlice";
import { fetchUserCoupons } from "./store/slices/couponSlice";
import { fetchFilteredBooking } from "./store/slices/bookingSlice";
import { fetchUserComplaints } from "./store/slices/complaintSlice";
import { fetchAllCabs } from "./store/slices/cabSlice";
import { fetchTourList, fetchUserTourBookings } from "./store/slices/tourSlice";
import { getUserId } from "./utils/credentials";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const SearchStack = createNativeStackNavigator();
const HotelStack = createNativeStackNavigator();
const HEALTH_POLL_INTERVAL_MS = 15000;
const HEALTH_TIMEOUT_MS = 12000;
const HEALTH_FALLBACK_TIMEOUT_MS = 10000;
const HEALTH_FAILURES_BEFORE_DOWN = 4;
const HEALTH_MIN_DOWN_WINDOW_MS = 120000;
const HEALTH_DEV_STARTUP_GRACE_MS = 30000;
const HEALTH_PROD_STARTUP_GRACE_MS = 2000;
const IS_DEV_BUILD = typeof __DEV__ !== "undefined" && __DEV__;
const HEALTH_FALLBACK_PATHS = [
  "/get-all/travel/location",
  "/get-all-tours",
  "/hotels/filters?page=1&limit=1",
];
const LAST_HANDLED_NOTIFICATION_RESPONSE_KEY =
  "@hrs:last-handled-notification-response-id";

LogBox.ignoreLogs([
  "SafeAreaView has been deprecated and will be removed in a future release.",
  "Couldn't find a navigation context",
  "navigation context",
  "Can't perform a React state update on a component that hasn't mounted yet",
]);

// React 19 concurrent mode can briefly invalidate NavigationStateContext during
// re-renders. Suppress these transient errors globally so they never show a
// red error screen — the NavigationErrorBoundary auto-recovers on the next frame.
const isNavContextError = (msg) =>
  typeof msg === "string" &&
  (msg.includes("navigation context") || msg.includes("NavigationContainer"));

const isKnownNonFatalMountWarning = (msg) =>
  typeof msg === "string" &&
  msg.includes("Can't perform a React state update on a component that hasn't mounted yet");

const originalConsoleError = console.error;
console.error = (...args) => {
  const msg = typeof args[0] === "string" ? args[0] : String(args[0] ?? "");
  if (isNavContextError(msg) || isKnownNonFatalMountWarning(msg)) return;
  originalConsoleError(...args);
};

// Also patch the React Native global error handler so the red screen never appears.
if (global.ErrorUtils) {
  const originalHandler = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    if (isNavContextError(error?.message)) return; // swallow transient nav errors
    originalHandler(error, isFatal);
  });
}

// ErrorBoundary — catches React 19 concurrent render errors (e.g. brief
// NavigationStateContext unavailability) and auto-recovers instead of crashing.
class NavigationErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Suppress only the known React Navigation context error; log others.
    const msg = error?.message || "";
    if (!msg.includes("navigation context")) {
    }
    // Auto-recover after a brief delay so the next render cycle has valid context.
    setTimeout(() => {
      if (this._mounted) this.setState({ hasError: false });
    }, 50);
  }

  componentDidMount() { this._mounted = true; }
  componentWillUnmount() { this._mounted = false; }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
          <ActivityIndicator size="large" color="#0d3b8f" />
        </View>
      );
    }
    return this.props.children;
  }
}

// Professional Tab Bar Component
function TabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  if (!state?.routes || !descriptors) return null;

  const focusedOptions = descriptors[state.routes[state.index].key]?.options;
  if (
    focusedOptions?.tabBarStyle?.display === "none" ||
    focusedOptions?.tabBarVisible === false
  ) {
    return null;
  }

  return (
    <View
      className="bg-white border-t border-gray-200"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <View className="flex-row justify-around items-center h-16 px-2">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          let label = options.tabBarLabel ?? options.title ?? route.name;
          if (route.name === "Search") label = "Home";
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: "tabLongPress", target: route.key });
          };

          const color = isFocused ? "#0d3b8f" : "#64748b";
          const size = 26;
          let iconName = "alert-circle";
          switch (route.name) {
            case "Search":
              iconName = isFocused ? "home" : "home-outline";
              break; // home icon
            case "HotelsTab":
              iconName = isFocused ? "bed" : "bed-outline";
              break;
            case "Cabs":
              iconName = isFocused ? "car" : "car-outline";
              break;
            case "Tour":
              iconName = isFocused ? "map" : "map-outline";
              break;
            case "Profile":
              iconName = isFocused ? "person-circle" : "person-circle-outline";
              break;
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              className="flex-1 items-center justify-center py-2"
              activeOpacity={0.7}
            >
              <View className="items-center">
                <Ionicons name={iconName} size={size} color={color} />
                <Text
                  style={{ color }}
                  className="text-[10px] font-medium mt-1"
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function SearchStackNavigator() {
  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="Home" component={Home} />
      <SearchStack.Screen name="Hotels" component={Hotels} />
      <SearchStack.Screen name="HotelDetails" component={HotelDetails} />
      <SearchStack.Screen name="PolicyScreen" component={PolicyScreen} />
    </SearchStack.Navigator>
  );
}

function HotelStackNavigator() {
  return (
    <HotelStack.Navigator screenOptions={{ headerShown: false }}>
      <HotelStack.Screen
        name="Hotels"
        component={Hotels}
        initialParams={{ showAll: true }}
      />
      <HotelStack.Screen name="HotelDetails" component={HotelDetails} />
      <HotelStack.Screen name="PolicyScreen" component={PolicyScreen} />
    </HotelStack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      detachInactiveScreens={false}
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tab.Screen
        name="Search"
        component={SearchStackNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? "Home";
          return {
            title: "Home",
            tabBarLabel: "Home",
            tabBarStyle: ["HotelDetails", "PolicyScreen"].includes(routeName)
              ? { display: "none" }
              : undefined,
          };
        }}
      />
      <Tab.Screen
        name="HotelsTab"
        component={HotelStackNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? "Hotels";
          return {
            title: "Hotels",
            tabBarLabel: "Hotels",
            tabBarStyle: ["HotelDetails", "PolicyScreen"].includes(routeName)
              ? { display: "none" }
              : undefined,
          };
        }}
      />
      <Tab.Screen name="Cabs" component={Cabs} options={{ title: "Cabs" }} />
      <Tab.Screen name="Tour" component={Tour} options={{ title: "Tours" }} />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
      }}
    >
      <ActivityIndicator size="large" color="#0d3b8f" />
    </View>
  );
}

function RootNavigator() {
  const [showBoot, setShowBoot] = useState(true);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setShowBoot(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showBoot) return undefined;

    (async () => {
      try {
        await requestStartupPermissionsIfNeeded();
      } catch {
        // Keep app startup non-blocking even if permission request fails.
      }
    })();

    return undefined;
  }, [showBoot]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
      {showBoot ? (
        <Stack.Screen name="Boot" component={BootScreen} />
      ) : isSignedIn === null ? (
        <Stack.Screen name="Loading" component={LoadingScreen} />
      ) : isSignedIn ? (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="TourDetails" component={TourDetails} />
          <Stack.Screen name="CabDetails" component={CabDetails} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginPage} />
          <Stack.Screen name="Register" component={RegisterPage} />
        </>
      )}
    </Stack.Navigator>
  );
}

function HealthAwareNavigator() {
  const dispatch = useDispatch();
  const { isSignedIn } = useAuth();

  // Use a ref for the actual status to avoid unnecessary re-renders of the
  // navigation tree. Only promote to state when the OVERLAY visibility must
  // change (checking→up, up→down, down→up). This prevents the 8-second health
  // poll from re-rendering NavigationContainer + all navigators + all screens,
  // which in React 19 concurrent mode can briefly invalidate NavigationStateContext.
  const healthRef = useRef("up");
  const [overlayStatus, setOverlayStatus] = useState("up"); // only "down" | "up"
  const consecutiveFailuresRef = useRef(0);
  const firstFailureAtRef = useRef(0);
  const lastHealthyAtRef = useRef(Date.now());
  const [isRetrying, setIsRetrying] = useState(false);

  const wasServerDownRef = useRef(false);
  const mountedRef = useRef(false);
  const pushTokenSyncedUserRef = useRef("");
  const notificationResponseSubscriptionRef = useRef(null);
  const lastHandledNotificationResponseIdRef = useRef("");

  const refetchGlobalData = useCallback(async () => {
    dispatch(fetchLocation());
    dispatch(frontHotels());
    dispatch(fetchTourList());
    dispatch(fetchAllCabs());
    dispatch(getBeds());
    dispatch(getRooms());
    dispatch(searchHotel({ page: 1, limit: 50, countRooms: 1 }));

    if (isSignedIn) {
      const userId = await getUserId();
      dispatch(fetchProfileData());
      dispatch(fetchUserCoupons());

      if (userId) {
        dispatch(fetchFilteredBooking({ userId, page: 1, limit: 10 }));
        dispatch(fetchUserTourBookings({ userId, page: 1, limit: 10 }));
        dispatch(fetchUserComplaints({ userId }));
      }
    }
  }, [dispatch, isSignedIn]);

  const handleServerRecovered = useCallback(() => {
    dispatch(resetAppState());
    // Do NOT reset navigation state — resetting causes navigators to unmount/remount
    // their screens which invalidates NavigationContext for in-flight renders in React 19.
    // Refetching data is sufficient; the user stays exactly where they were.
    setTimeout(() => {
      if (!mountedRef.current) return;
      void refetchGlobalData();
    }, 60);
  }, [dispatch, refetchGlobalData]);

  const probeServerReachability = useCallback(async () => {
    try {
      const response = await axios.get(`${baseURL}/health`, {
        timeout: HEALTH_TIMEOUT_MS,
      });
      return response?.status >= 200 && response?.status < 300;
    } catch (error) {
      // If server responded with any status code, it's reachable.
      if (error?.response?.status) {
        return true;
      }

      for (const path of HEALTH_FALLBACK_PATHS) {
        try {
          const response = await axios.get(`${baseURL}${path}`, {
            timeout: HEALTH_FALLBACK_TIMEOUT_MS,
          });
          if (response?.status) return true;
        } catch (fallbackError) {
          // Any HTTP response means network + server are reachable.
          if (fallbackError?.response?.status) {
            return true;
          }
        }
      }

      return false;
    }
  }, []);

  const checkHealth = useCallback(
    async ({ isManual = false } = {}) => {
      if (isManual && mountedRef.current) {
        setIsRetrying(true);
      }

      try {
        const isHealthy = await probeServerReachability();
        if (!isHealthy) {
          throw new Error("Health check failed");
        }

        if (!mountedRef.current) return false;

        // Reset failure counter on any success.
        consecutiveFailuresRef.current = 0;
        firstFailureAtRef.current = 0;
        lastHealthyAtRef.current = Date.now();

        // Only trigger state update when transitioning FROM a non-"up" state.
        if (healthRef.current !== "up") {
          healthRef.current = "up";
          setOverlayStatus("up");
        }
        if (wasServerDownRef.current) {
          wasServerDownRef.current = false;
          handleServerRecovered();
        }
        return true;
      } catch {
        if (!mountedRef.current) return false;

        consecutiveFailuresRef.current += 1;
        if (!firstFailureAtRef.current) {
          firstFailureAtRef.current = Date.now();
        }

        const now = Date.now();
        const failureWindowMs = now - firstFailureAtRef.current;
        const healthyStaleMs = now - lastHealthyAtRef.current;

        // Only declare server "down" after HEALTH_FAILURES_BEFORE_DOWN consecutive
        // failures and sustained outage window — prevents false negatives when
        // server is up but one endpoint/network path is flaky.
        if (
          consecutiveFailuresRef.current >= HEALTH_FAILURES_BEFORE_DOWN &&
          failureWindowMs >= HEALTH_MIN_DOWN_WINDOW_MS &&
          healthyStaleMs >= HEALTH_MIN_DOWN_WINDOW_MS
        ) {
          wasServerDownRef.current = true;
          if (healthRef.current !== "down") {
            healthRef.current = "down";
            setOverlayStatus("down");
          }
        }
        return false;
      } finally {
        if (isManual && mountedRef.current) {
          setIsRetrying(false);
        }
      }
    },
    [handleServerRecovered, probeServerReachability],
  );

  useEffect(() => {
    mountedRef.current = true;
    // Delay the first health check slightly so the app renders before any network call.
    const startupDelayMs = IS_DEV_BUILD
      ? HEALTH_DEV_STARTUP_GRACE_MS
      : HEALTH_PROD_STARTUP_GRACE_MS;
    const initialTimer = setTimeout(() => {
      if (mountedRef.current) checkHealth({ isManual: true });
    }, startupDelayMs);

    const intervalId = setInterval(() => {
      checkHealth();
    }, HEALTH_POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      clearTimeout(initialTimer);
      clearInterval(intervalId);
    };
  }, [checkHealth]);

  useEffect(() => {
    if (!isPushNotificationsSupported()) {
      return undefined;
    }

    let cancelled = false;

    const registerPush = async () => {
      if (!isSignedIn) {
        pushTokenSyncedUserRef.current = "";
        return;
      }

      try {
        const userId = await getUserId();
        if (!userId || cancelled) return;
        if (pushTokenSyncedUserRef.current === String(userId)) return;

        const pushToken = await registerForPushNotificationsAsync();
        if (!pushToken || cancelled) return;

        await syncPushTokenWithServer({ userId, pushToken });
        if (!cancelled) {
          pushTokenSyncedUserRef.current = String(userId);
        }
      } catch {
        // Keep app flow unaffected if push setup fails.
      }
    };

    registerPush();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (!isPushNotificationsSupported()) {
      return undefined;
    }

    let cancelled = false;

    const getResponseId = (response) => {
      const requestId = response?.notification?.request?.identifier;
      const notificationDate = response?.notification?.date;
      const actionId = response?.actionIdentifier || "default";
      if (!requestId) {
        return notificationDate
          ? `${actionId}:date:${String(notificationDate)}`
          : "";
      }
      return `${actionId}:${requestId}`;
    };

    const markResponseHandled = async (responseId) => {
      if (!responseId) return;
      lastHandledNotificationResponseIdRef.current = responseId;

      try {
        await AsyncStorage.setItem(
          LAST_HANDLED_NOTIFICATION_RESPONSE_KEY,
          responseId,
        );
      } catch {
        // no-op
      }
    };

    const clearLastResponse = async () => {
      try {
        await clearLastNotificationResponseAsync();
      } catch {
        // no-op
      }
    };

    const handleNotificationResponse = async (response, retryCount = 0) => {
      if (!response || cancelled) return;

      const responseId = getResponseId(response);
      if (
        responseId &&
        lastHandledNotificationResponseIdRef.current &&
        responseId === lastHandledNotificationResponseIdRef.current
      ) {
        await clearLastResponse();
        return;
      }

      const route = resolveNotificationRoute(response);
      if (!route?.name) {
        await clearLastResponse();
        return;
      }

      if (!navigationRef.isReady()) {
        if (retryCount < 20) {
          setTimeout(() => {
            if (!cancelled) {
              void handleNotificationResponse(response, retryCount + 1);
            }
          }, 120);
        }
        return;
      }

      navigationRef.navigate(route.name, route.params);
      await markResponseHandled(responseId);
      await clearLastResponse();
    };

    const wireNotificationHandlers = async () => {
      try {
        const savedResponseId = await AsyncStorage.getItem(
          LAST_HANDLED_NOTIFICATION_RESPONSE_KEY,
        );
        if (!cancelled) {
          lastHandledNotificationResponseIdRef.current = savedResponseId || "";
        }

        const subscription = await addNotificationResponseListener(
          (response) => {
            void handleNotificationResponse(response);
          },
        );
        if (cancelled) {
          subscription?.remove?.();
          return;
        }

        notificationResponseSubscriptionRef.current = subscription;

        const response = await getLastNotificationResponseAsync();
        if (!cancelled && response) {
          await handleNotificationResponse(response);
        }
      } catch {
        // no-op
      }
    };

    wireNotificationHandlers();

    return () => {
      cancelled = true;
      notificationResponseSubscriptionRef.current?.remove?.();
      notificationResponseSubscriptionRef.current = null;
    };
  }, []);

  return (
    <>
      <NavigationErrorBoundary>
        <NavigationContainer ref={navigationRef}>
          {/* NavigationContainer must have ONLY a single Navigator child.
              Placing Modal siblings here broke NavigationStateContext in React 19. */}
          <RootNavigator />
        </NavigationContainer>
      </NavigationErrorBoundary>

      {/* Overlays live OUTSIDE NavigationContainer — their state changes
          never trigger re-renders of the navigation tree. */}
      <Modal
        visible={!IS_DEV_BUILD && overlayStatus === "down"}
        transparent={false}
        animationType="fade"
      >
        <ServerUnavailable
          onRetry={() => checkHealth({ isManual: true })}
          isRetrying={isRetrying}
        />
      </Modal>
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <ThemeProvider>
          <SafeAreaProvider>
            <ThemedStatusBar />
            <AppModalProvider>
              <HealthAwareNavigator />
            </AppModalProvider>
            <Toast />
          </SafeAreaProvider>
        </ThemeProvider>
      </AuthProvider>
    </Provider>
  );
}
