import '@/lib/suppressConsoleErrors';
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, LogBox, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppDialog } from '@/components/ui/AppDialog';
import { AppErrorBoundary } from '@/components/system/AppErrorBoundary';
import { initializeApiBaseUrl } from '@/constants/config';
import { showError } from '@/lib/feedback';
import i18n from '@/locales';
import { fetchVersionCheck, openAndroidApkUrl, type VersionCheckResult } from '@/lib/versionCheck';
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
  const [versionState, setVersionState] = useState<VersionCheckResult | null>(null);

  useEffect(() => {
    void hydrate();
    void initializeApiBaseUrl().catch(() => undefined);
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const result = await fetchVersionCheck();
        if (!cancelled && result?.updateAvailable) {
          setVersionState(result);
        }
      } catch {
        // Version check should not block app startup.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isHydrated]);

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
            <>
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }} />
              <AppDialog
                visible={Boolean(versionState)}
                title={versionState?.forceUpdate ? i18n.t('updates.forceTitle') : i18n.t('updates.availableTitle')}
                description={
                  versionState
                    ? i18n.t('updates.description', {
                        version: versionState.latestVersion,
                        notes: versionState.releaseNotes || i18n.t('updates.noNotes'),
                      })
                    : undefined
                }
                onClose={() => {
                  if (!versionState?.forceUpdate) {
                    setVersionState(null);
                  }
                }}
                actions={
                  versionState?.forceUpdate
                    ? [
                        {
                          label: i18n.t('updates.details'),
                          tone: 'secondary',
                          onPress: () => router.push('/release-notes'),
                        },
                        {
                          label: i18n.t('updates.installNow'),
                          onPress: () => {
                            void openAndroidApkUrl(versionState.apkUrl).catch((error) => {
                              showError(error, i18n.t('updates.openFailed'));
                            });
                          },
                        },
                      ]
                    : [
                        {
                          label: i18n.t('updates.details'),
                          tone: 'secondary',
                          onPress: () => router.push('/release-notes'),
                        },
                        {
                          label: i18n.t('updates.installNow'),
                          onPress: () => {
                            void openAndroidApkUrl(versionState?.apkUrl ?? '').catch((error) => {
                              showError(error, i18n.t('updates.openFailed'));
                            });
                          },
                        },
                      ]
                }
              />
            </>
          </I18nextProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}
