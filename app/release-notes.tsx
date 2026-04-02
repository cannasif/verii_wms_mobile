import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ScreenState } from '@/components/ui/ScreenState';
import { SectionCard } from '@/components/ui/SectionCard';
import { Text } from '@/components/ui/Text';
import { getAppInfo } from '@/lib/appInfo';
import { formatLocalizedDateTime } from '@/lib/formatters';
import { fetchLatestReleaseInfo } from '@/lib/versionCheck';

export default function ReleaseNotesScreen(): React.ReactElement {
  const { t } = useTranslation();
  const appInfo = getAppInfo();
  const releaseQuery = useQuery({
    queryKey: ['mobile-release-notes'],
    queryFn: fetchLatestReleaseInfo,
  });

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
        </SectionCard>
      )}
    </PageShell>
  );
}
