import '@/lib/suppressConsoleErrors';
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { ActivityIndicator, LogBox, View } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary } from '@/components/system/AppErrorBoundary';
import { initializeApiBaseUrl } from '@/constants/config';
import i18n from '@/locales';
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/store/auth';
import { queryClient } from '@/lib/queryClient';

LogBox.ignoreLogs([
  /key.*spread|spread.*JSX/i,
  /React keys must be passed directly/i,
  /Path|Circle/i,
]);

export default function RootLayout(): React.ReactElement {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}

function RootLayoutContent(): React.ReactElement {
  const hydrate = useAuthStore((state) => state.hydrate);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const { theme } = useTheme();

  useEffect(() => {
    void hydrate();
    void initializeApiBaseUrl().catch(() => undefined);
  }, [hydrate]);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }} />
          </I18nextProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}
