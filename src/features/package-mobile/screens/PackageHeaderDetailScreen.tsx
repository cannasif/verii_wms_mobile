import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { PackageIcon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ScreenState } from '@/components/ui/ScreenState';
import { SectionCard } from '@/components/ui/SectionCard';
import { Text } from '@/components/ui/Text';
import { hasPermission } from '@/features/auth/utils/permissions';
import { RADII, SPACING } from '@/constants/theme';
import { formatLocalizedDate, formatLocalizedNumber } from '@/lib/formatters';
import { normalizeError } from '@/lib/errors';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/store/auth';
import { packageMobileApi } from '../api';
import type { MobilePackageTreeNode } from '../types';

function getStatusTone(status: string): string {
  switch (status) {
    case 'Packed':
      return '#059669';
    case 'Sealed':
      return '#0891b2';
    case 'Loaded':
      return '#2563eb';
    case 'Transferred':
      return '#d97706';
    case 'Shipped':
      return '#7c3aed';
    case 'Cancelled':
      return '#e11d48';
    default:
      return '#64748b';
  }
}

function PackageTreeNodeCard({ node, depth = 0 }: { node: MobilePackageTreeNode; depth?: number }): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <View style={{ marginLeft: depth * 14, gap: SPACING.xs }}>
      <View style={[styles.treeNode, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]}>
        <View style={styles.treeHeader}>
          <View style={styles.treeCopy}>
            <Text style={styles.treeTitle}>{node.package.packageNo}</Text>
            <Text style={[styles.treeSubtitle, { color: theme.colors.textSecondary }]}>
              {node.package.packageType} · {node.package.barcode || '-'}
            </Text>
          </View>
          <View style={[styles.treeBadge, { backgroundColor: `${getStatusTone(node.package.status)}20` }]}>
            <Text style={[styles.treeBadgeText, { color: getStatusTone(node.package.status) }]}>{node.package.status}</Text>
          </View>
        </View>

        <View style={styles.treeMetaGrid}>
          <View style={styles.treeMetaItem}>
            <Text style={[styles.treeMetaLabel, { color: theme.colors.textMuted }]}>{t('packageMobile.labels.childCount')}</Text>
            <Text style={styles.treeMetaValue}>{formatLocalizedNumber(node.package.totalChildPackageCount, { maximumFractionDigits: 0 })}</Text>
          </View>
          <View style={styles.treeMetaItem}>
            <Text style={[styles.treeMetaLabel, { color: theme.colors.textMuted }]}>{t('packageMobile.labels.totalQuantity')}</Text>
            <Text style={styles.treeMetaValue}>{formatLocalizedNumber(node.package.totalProductQuantity)}</Text>
          </View>
          <View style={styles.treeMetaItem}>
            <Text style={[styles.treeMetaLabel, { color: theme.colors.textMuted }]}>{t('packageMobile.labels.totalGrossWeight')}</Text>
            <Text style={styles.treeMetaValue}>{formatLocalizedNumber(node.package.totalGrossWeight)}</Text>
          </View>
          <View style={styles.treeMetaItem}>
            <Text style={[styles.treeMetaLabel, { color: theme.colors.textMuted }]}>{t('packageMobile.labels.shelf')}</Text>
            <Text style={styles.treeMetaValue}>{node.package.currentShelfCode || node.package.currentShelfName || '-'}</Text>
          </View>
        </View>
      </View>

      {node.children.map((child) => (
        <PackageTreeNodeCard key={child.package.id} node={child} depth={depth + 1} />
      ))}
    </View>
  );
}

export function PackageHeaderDetailScreen({ headerId }: { headerId: number }): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const permissions = useAuthStore((state) => state.permissions);
  const canView = hasPermission(permissions, 'wms.package.view');

  if (!canView) {
    return (
      <PageShell>
        <ScreenHeader title={t('packageMobile.detail.title')} subtitle={t('packageMobile.detail.subtitle')} />
        <ScreenState
          tone="error"
          title={t('workflow.detail.permissionDeniedTitle')}
          description={t('workflow.detail.permissionDeniedDescription', { title: t('packageMobile.detail.title') })}
        />
      </PageShell>
    );
  }

  const headerQuery = useQuery({
    queryKey: ['package-mobile', 'header', headerId],
    queryFn: ({ signal }) => packageMobileApi.getHeaderById(headerId, { signal }),
  });

  const treeQuery = useQuery({
    queryKey: ['package-mobile', 'tree', headerId],
    queryFn: ({ signal }) => packageMobileApi.getPackageTree(headerId, { signal }),
  });

  const isLoading = headerQuery.isLoading || treeQuery.isLoading;
  const isError = headerQuery.isError || treeQuery.isError;
  const errorMessage = headerQuery.isError
    ? normalizeError(headerQuery.error, t('packageMobile.detail.loadFailed')).message
    : treeQuery.isError
      ? normalizeError(treeQuery.error, t('packageMobile.detail.loadFailed')).message
      : t('packageMobile.detail.loadFailed');

  if (isLoading) {
    return (
      <PageShell>
        <ScreenHeader title={t('packageMobile.detail.title')} subtitle={t('packageMobile.detail.subtitle')} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </PageShell>
    );
  }

  if (isError || !headerQuery.data) {
    return (
      <PageShell>
        <ScreenHeader title={t('packageMobile.detail.title')} subtitle={t('packageMobile.detail.subtitle')} />
        <ScreenState tone="error" title={t('packageMobile.detail.errorTitle')} description={errorMessage} />
      </PageShell>
    );
  }

  const header = headerQuery.data;
  const tree = treeQuery.data ?? [];

  return (
    <PageShell scroll>
      <ScreenHeader title={header.packingNo} subtitle={t('packageMobile.detail.subtitle')} />

      <SectionCard>
        <View style={styles.heroRow}>
          <PackageIcon size={22} color={theme.colors.primary} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{t('packageMobile.detail.heroTitle')}</Text>
            <Text style={[styles.heroText, { color: theme.colors.textSecondary }]}>
              {t('packageMobile.detail.heroText')}
            </Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title={t('packageMobile.detail.summaryTitle')}>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>{t('packageMobile.labels.customer')}</Text>
            <Text style={styles.summaryValue}>{header.customerCode || '-'} {header.customerName ? `· ${header.customerName}` : ''}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>{t('packageMobile.labels.warehouse')}</Text>
            <Text style={styles.summaryValue}>{header.warehouseCode || '-'}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>{t('packageMobile.labels.sourceType')}</Text>
            <Text style={styles.summaryValue}>{header.sourceType || '-'}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>{t('packageMobile.labels.packingDate')}</Text>
            <Text style={styles.summaryValue}>{formatLocalizedDate(header.packingDate)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>{t('packageMobile.labels.packageCount')}</Text>
            <Text style={styles.summaryValue}>{formatLocalizedNumber(header.totalPackageCount, { maximumFractionDigits: 0 })}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>{t('packageMobile.labels.totalQuantity')}</Text>
            <Text style={styles.summaryValue}>{formatLocalizedNumber(header.totalQuantity)}</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title={t('packageMobile.detail.treeTitle')} subtitle={t('packageMobile.detail.treeSubtitle')}>
        {tree.length === 0 ? (
          <ScreenState tone="empty" title={t('packageMobile.detail.emptyTitle')} description={t('packageMobile.detail.emptyDescription')} compact />
        ) : (
          <ScrollView horizontal={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.treeList}>
            {tree.map((node) => (
              <PackageTreeNodeCard key={node.package.id} node={node} />
            ))}
          </ScrollView>
        )}
      </SectionCard>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 48 },
  heroRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  heroCopy: { flex: 1, gap: 4 },
  heroTitle: { fontSize: 17, fontWeight: '900' },
  heroText: { lineHeight: 19 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  summaryItem: { width: '47%', gap: 2 },
  summaryLabel: { fontSize: 11, fontWeight: '700' },
  summaryValue: { fontSize: 13, fontWeight: '700' },
  treeList: { gap: SPACING.sm },
  treeNode: { borderWidth: 1, borderRadius: RADII.xl, padding: SPACING.md, gap: SPACING.sm },
  treeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
  treeCopy: { flex: 1, gap: 4 },
  treeTitle: { fontSize: 15, fontWeight: '900' },
  treeSubtitle: { lineHeight: 18 },
  treeBadge: { borderRadius: RADII.pill, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs },
  treeBadgeText: { fontSize: 11, fontWeight: '900' },
  treeMetaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  treeMetaItem: { width: '47%', gap: 2 },
  treeMetaLabel: { fontSize: 11, fontWeight: '700' },
  treeMetaValue: { fontSize: 13, fontWeight: '700' },
});
