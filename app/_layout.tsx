import '@/lib/suppressConsoleErrors';
import 'react-native-gesture-handler';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, LogBox, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppDialog } from '@/components/ui/AppDialog';
import { AppErrorBoundary } from '@/components/system/AppErrorBoundary';
import { initializeApiBaseUrl } from '@/constants/config';
import { showError } from '@/lib/feedback';
import i18n from '@/locales';
import {
  cleanupCachedApkUpdates,
  downloadAndInstallAndroidApk,
  fetchVersionCheck,
  type VersionCheckResult,
} from '@/lib/versionCheck';
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/store/auth';
import { queryClient } from '@/lib/queryClient';

LogBox.ignoreLogs([
  /key.*spread|spread.*JSX/i,
  /React keys must be passed directly/i,
  /Path|Circle/i,
]);

const VERSION_CHECK_INTERVAL_MS = 1000 * 60 * 30;

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
  const [isInstallingUpdate, setIsInstallingUpdate] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const lastVersionCheckAtRef = useRef<number>(0);

  useEffect(() => {
    void hydrate();
    void initializeApiBaseUrl().catch(() => undefined);
    void cleanupCachedApkUpdates().catch(() => undefined);
  }, [hydrate]);

  const runVersionCheck = useCallback(
    async (force = false) => {
      if (!isHydrated || isInstallingUpdate) {
        return;
      }

      const now = Date.now();
      if (!force && now - lastVersionCheckAtRef.current < VERSION_CHECK_INTERVAL_MS) {
        return;
      }

      lastVersionCheckAtRef.current = now;

      try {
        const result = await fetchVersionCheck();
        if (result?.updateAvailable) {
          setVersionState(result);
        } else if (force) {
          setVersionState(null);
        }
      } catch {
        // Version check should not block app startup.
      }
    },
    [isHydrated, isInstallingUpdate],
  );

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void runVersionCheck(true);
  }, [isHydrated, runVersionCheck]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void runVersionCheck();
      }
    });

    const interval = setInterval(() => {
      void runVersionCheck();
    }, VERSION_CHECK_INTERVAL_MS);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [isHydrated, runVersionCheck]);

  const handleOpenDetails = useCallback(() => {
    setVersionState(null);
    router.push('/release-notes');
  }, []);

  const handleInstallUpdate = useCallback(async () => {
    if (!versionState?.apkUrl) {
      return;
    }

    setIsInstallingUpdate(true);
    setDownloadProgress(0);

    try {
      await downloadAndInstallAndroidApk(versionState.apkUrl, (progress) => {
        setDownloadProgress(progress.progress);
      });
      setVersionState(null);
    } catch (error) {
      showError(error, i18n.t('updates.openFailed'));
    } finally {
      setIsInstallingUpdate(false);
    }
  }, [versionState]);

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
                title={
                  isInstallingUpdate
                    ? i18n.t('updates.downloadingTitle')
                    : versionState?.forceUpdate
                      ? i18n.t('updates.forceTitle')
                      : i18n.t('updates.availableTitle')
                }
                description={
                  isInstallingUpdate
                    ? i18n.t('updates.downloadingDescription', {
                        percent: Math.round(downloadProgress * 100),
                      })
                    : versionState
                    ? i18n.t('updates.description', {
                        version: versionState.latestVersion,
                        notes: versionState.releaseNotes || i18n.t('updates.noNotes'),
                      })
                    : undefined
                }
                onClose={() => {
                  if (!versionState?.forceUpdate && !isInstallingUpdate) {
                    setVersionState(null);
                  }
                }}
                actions={
                  versionState?.forceUpdate
                    ? [
                        {
                          label: i18n.t('updates.details'),
                          tone: 'secondary',
                          disabled: isInstallingUpdate,
                          onPress: handleOpenDetails,
                        },
                        {
                          label: isInstallingUpdate ? i18n.t('updates.installingNow') : i18n.t('updates.installNow'),
                          disabled: isInstallingUpdate,
                          onPress: () => {
                            void handleInstallUpdate();
                          },
                        },
                      ]
                    : [
                        {
                          label: i18n.t('updates.later'),
                          tone: 'secondary',
                          disabled: isInstallingUpdate,
                          onPress: () => setVersionState(null),
                        },
                        {
                          label: i18n.t('updates.details'),
                          tone: 'secondary',
                          disabled: isInstallingUpdate,
                          onPress: handleOpenDetails,
                        },
                        {
                          label: isInstallingUpdate ? i18n.t('updates.installingNow') : i18n.t('updates.installNow'),
                          disabled: isInstallingUpdate,
                          onPress: () => {
                            void handleInstallUpdate();
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
