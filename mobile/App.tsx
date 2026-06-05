import React, { useState, useEffect } from 'react';
import { AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { sendHeartbeat } from './src/services/heartbeat';
import { registerBackgroundHeartbeat, unregisterBackgroundHeartbeat } from './src/services/backgroundHeartbeat';
import { AttendanceProvider } from './src/context/AttendanceContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { usePreventScreenCapture } from 'expo-screen-capture';
import AppNavigator from './src/navigation';
import SplashScreen from './src/screens/SplashScreen';

// Pings the backend with the current Wi-Fi every 60s while an employee is signed
// in and the app is foregrounded (live presence + auto-end break when back).
function useHeartbeat() {
  const { isAuthenticated, user } = useAuth();
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'EMPLOYEE') return;
    // Foreground ping (every 60s while app is open)
    const ping = () => { if (AppState.currentState === 'active') sendHeartbeat(); };
    ping();
    const id = setInterval(ping, 60_000);
    // Background ping (OS-paced, ~15 min, best-effort)
    registerBackgroundHeartbeat();
    return () => { clearInterval(id); unregisterBackgroundHeartbeat(); };
  }, [isAuthenticated, user?.role]);
}

function ThemedApp() {
  const { isDark } = useTheme();
  // Block screenshots / screen recording app-wide (Android blocks, iOS best-effort).
  usePreventScreenCapture();
  useHeartbeat();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2800);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return <SplashScreen />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AttendanceProvider>
              <ThemedApp />
            </AttendanceProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
