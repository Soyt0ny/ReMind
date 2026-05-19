import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setApiToken, setUnauthorizedHandler } from '../components/services/api';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (!loaded) return;

    async function initAuth() {
      try {
        console.log("[Auth] Iniciando carga de token...");
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          console.log("[Auth] Token encontrado.");
          setApiToken(token);
        } else {
          console.log("[Auth] No hay token almacenado.");
        }
      } catch (e) {
        console.error("[Auth] Error en initAuth:", e);
      } finally {
        setAuthReady(true);
        console.log("[Auth] Listo, ocultando Splash Screen.");
        SplashScreen.hideAsync();
      }
    }

    // Cuando el token expira o es invalido, volver al login.
    setUnauthorizedHandler(() => {
      AsyncStorage.removeItem('auth_token');
      AsyncStorage.removeItem('user_display_name');
      router.replace('/login');
    });

    initAuth();
  }, [loaded]);

  if (!loaded || !authReady) return null;

  return (
    <Stack>
      <Stack.Screen name="(tabs)"   options={{ headerShown: false }} />
      <Stack.Screen name="login"    options={{ headerShown: false }} />
      <Stack.Screen name="identify" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <Stack.Screen name="modal"    options={{ presentation: 'modal' }} />
    </Stack>
  );
}
