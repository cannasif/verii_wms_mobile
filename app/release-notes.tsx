import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { ScreenState } from '@/components/ui/ScreenState';
import { SectionCard } from '@/components/ui/SectionCard';
import { Text } from '@/components/ui/Text';
import { getAppInfo } from '@/lib/appInfo';
import { showError } from '@/lib/feedback';
import { formatLocalizedDateTime } from '@/lib/formatters';
import { downloadAndInstallAndroidApk, fetchLatestReleaseInfo } from '@/lib/versionCheck';

export default function ReleaseNotesScreen(): React.ReactElement {
  const { t } = useTranslation();
  const appInfo = getAppInfo();
  const [isInstallingUpdate, setIsInstallingUpdate] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const releaseQuery = useQuery({
    queryKey: ['mobile-release-notes'],
    queryFn: fetchLatestReleaseInfo,
  });

  useEffect(() => {
    if (releaseQuery.data?.forceUpdate) {
      router.setParams({ forceUpdate: 'true' });
    }
  }, [releaseQuery.data?.forceUpdate]);

  const handleInstall = async (): Promise<void> => {
    const apkUrl = releaseQuery.data?.apkUrl;
    if (!apkUrl) {
      return;
    }

    setIsInstallingUpdate(true);
    setDownloadProgress(0);

    try {
      await downloadAndInstallAndroidApk(apkUrl, (progress) => {
        setDownloadProgress(progress.progress);
      });
    } catch (error) {
      showError(error, t('updates.openFailed'));
    } finally {
      setIsInstallingUpdate(false);
    }
  };

  return (
    <PageShell scroll>
      <ScreenHeader title={t('updates.notesTitle')} subtitle={t('updates.notesSubtitle')} />

      <SectionCard title={t('updates.installedVersion')}>
        <Text>{appInfo.version}</Text>
      </SectionCard>

      {releaseQuery.isLoading ? (
        <ScreenState
          tone="loading"
          title={t('updates.loadingTitle')}
          description={t('updates.loadingDescription')}
        />
      ) : releaseQuery.isError ? (
        <ScreenState
          tone="error"
          title={t('updates.errorTitle')}
          description={t('updates.errorDescription')}
          actionLabel={t('common.retry')}
          onAction={() => void releaseQuery.refetch()}
        />
      ) : (
        <SectionCard
          title={t('updates.latestVersionLabel', { version: releaseQuery.data?.latestVersion ?? '-' })}
          subtitle={
            releaseQuery.data?.publishedAtUtc
              ? t('updates.publishedAt', { value: formatLocalizedDateTime(releaseQuery.data.publishedAtUtc) })
              : undefined
          }
        >
          <Text>{releaseQuery.data?.releaseNotes || t('updates.noNotes')}</Text>
          {!releaseQuery.data?.forceUpdate ? (
            <Button
              title={t('updates.checkNow')}
              tone="secondary"
              onPress={() => void releaseQuery.refetch()}
              style={{ marginTop: 12 }}
            />
          ) : null}
          {releaseQuery.data?.updateAvailable ? (
            <Button
              title={
                isInstallingUpdate
                  ? t('updates.installingDescription', { percent: Math.round(downloadProgress * 100) })
                  : t('updates.installNow')
              }
              loading={isInstallingUpdate}
              onPress={() => {
                void handleInstall();
              }}
              style={{ marginTop: 12 }}
            />
          ) : (
            <Text style={{ marginTop: 12 }}>{t('updates.upToDate')}</Text>
          )}
          {releaseQuery.data?.forceUpdate ? (
            <Text style={{ marginTop: 12 }}>
              {t('updates.forceDescription')}
            </Text>
          ) : null}
        </SectionCard>
      )}
    </PageShell>
  );
}
