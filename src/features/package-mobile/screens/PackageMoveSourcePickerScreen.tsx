import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight01Icon, ShipmentTrackingIcon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { FlashPagedList } from '@/components/paged/FlashPagedList';
import { PagedFilterModal } from '@/components/paged/PagedFilterModal';
import { PagedListToolbar } from '@/components/paged/PagedListToolbar';
import { PageShell } from '@/components/layout/PageShell';
import { SectionCard } from '@/components/ui/SectionCard';
import { Text } from '@/components/ui/Text';
import { RADII, SPACING } from '@/constants/theme';
import { formatLocalizedDate, formatLocalizedNumber } from '@/lib/formatters';
import { useTheme } from '@/providers/ThemeProvider';
import { usePagedFlatList } from '@/hooks/usePagedFlatList';
import { packageMobileApi } from '../api';
import { packageHeaderFilters, type MobilePackageHeaderItem } from '../types';

export function PackageMoveSourcePickerScreen({
  targetSourceType,
  targetSourceHeaderId,
  moduleKey,
  targetLabel,
}: {
  targetSourceType: 'WT' | 'SH';
  targetSourceHeaderId: number;
  moduleKey: 'transfer' | 'shipment';
  targetLabel: string;
}): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [filterVisible, setFilterVisible] = useState(false);

  const paged = usePagedFlatList<MobilePackageHeaderItem>({
    queryKey: ['package-mobile', 'move-source', targetSourceType, targetSourceHeaderId],
    pageSize: 20,
    defaultSortBy: 'Id',
    defaultSortDirection: 'desc',
    defaultFilterColumn: 'packingNo',
    columns: packageHeaderFilters,
    fetchPage: async (params, options) => {
      const response = await packageMobileApi.getHeaders(params, options);
      return {
        ...response,
        data: (response.data ?? []).filter((header) => !(
          header.sourceType === targetSourceType && header.sourceHeaderId === targetSourceHeaderId
        )),
      };
    },
  });

  const header = useMemo(
    () => (
      <View style={styles.headerContent}>
        <ScreenHeader
          title={t('packageMoveMobile.title')}
          subtitle={t('packageMoveMobile.subtitle', { target: targetLabel })}
        />

        <SectionCard>
          <View style={styles.heroRow}>
            <ShipmentTrackingIcon size={22} color={theme.colors.primary} />
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>{t('packageMoveMobile.heroTitle')}</Text>
              <Text style={[styles.heroText, { color: theme.colors.textSecondary }]}>
                {t('packageMoveMobile.heroText', { count: paged.totalCount })}
              </Text>
            </View>
          </View>
        </SectionCard>

        <PagedListToolbar
          value={paged.searchInput}
          onChange={paged.setSearchInput}
          onSubmit={() => paged.submitSearch()}
          onOpenFilters={() => setFilterVisible(true)}
          onReset={paged.reset}
          isBusy={paged.isRefreshing || paged.isInitialLoading}
          activeFilterCount={paged.appliedFilters.length}
        />
      </View>
    ),
    [paged, t, theme.colors.primary, theme.colors.textSecondary, targetLabel],
  );

  return (
    <PageShell>
      <FlashPagedList
        listRef={paged.listRef}
        data={paged.items}
        latestPage={paged.latestPage}
        isInitialLoading={paged.isInitialLoading}
        isRefreshing={paged.isRefreshing}
        isFetchingNextPage={paged.isFetchingNextPage}
        isError={paged.isError}
        onRefresh={paged.refresh}
        onLoadMore={paged.loadMore}
        onRetry={paged.refresh}
        emptyTitle={t('packageMoveMobile.emptyTitle')}
        emptyDescription={t('packageMoveMobile.emptyDescription')}
        errorTitle={t('packageMoveMobile.errorTitle')}
        errorDescription={t('packageMoveMobile.loadFailed')}
        ListHeaderComponent={header}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(tabs)/flows/[module]/package-move/[headerId]/source/[packingHeaderId]',
                params: {
                  module: moduleKey,
                  headerId: String(targetSourceHeaderId),
                  packingHeaderId: String(item.id),
                  target: targetLabel,
                },
              } as never)
            }
          >
            {({ pressed }) => (
              <SectionCard style={[styles.rowCard, pressed && styles.rowPressed]}>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{item.packingNo}</Text>
                  <Text style={[styles.rowSubtitle, { color: theme.colors.textSecondary }]}>
                    {item.customerCode || '-'} · {item.customerName || item.sourceType || '-'}
                  </Text>
                  <View style={styles.metaGrid}>
                    <View style={styles.metaItem}>
                      <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>{t('packageMobile.labels.warehouse')}</Text>
                      <Text style={styles.metaValue}>{item.warehouseCode || '-'}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>{t('packageMobile.labels.packageCount')}</Text>
                      <Text style={styles.metaValue}>{formatLocalizedNumber(item.totalPackageCount, { maximumFractionDigits: 0 })}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>{t('packageMobile.labels.totalQuantity')}</Text>
                      <Text style={styles.metaValue}>{formatLocalizedNumber(item.totalQuantity)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>{t('packageMobile.labels.packingDate')}</Text>
                      <Text style={styles.metaValue}>{formatLocalizedDate(item.packingDate)}</Text>
                    </View>
                  </View>
                </View>
                <ArrowRight01Icon size={18} color={theme.colors.primary} />
              </SectionCard>
            )}
          </Pressable>
        )}
      />

      <PagedFilterModal
        visible={filterVisible}
        columns={packageHeaderFilters}
        draftFilters={paged.draftFilters}
        filterLogic={paged.filterLogic}
        onClose={() => setFilterVisible(false)}
        onAdd={paged.addDraftFilter}
        onUpdate={paged.updateDraftFilter}
        onRemove={paged.removeDraftFilter}
        onFilterLogicChange={paged.setFilterLogic}
        onApply={() => {
          paged.applyFilters();
          setFilterVisible(false);
        }}
        onClear={() => {
          paged.reset();
          setFilterVisible(false);
        }}
      />
    </PageShell>
  );
}

const styles = StyleSheet.create({
  headerContent: { gap: SPACING.md, paddingBottom: SPACING.sm },
  heroRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  heroCopy: { flex: 1, gap: 4 },
  heroTitle: { fontSize: 17, fontWeight: '900' },
  heroText: { lineHeight: 19 },
  rowCard: { marginBottom: SPACING.sm, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  rowPressed: { opacity: 0.92 },
  rowCopy: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 16, fontWeight: '900' },
  rowSubtitle: { lineHeight: 18 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.xs },
  metaItem: { width: '47%', gap: 2 },
  metaLabel: { fontSize: 11, fontWeight: '700' },
  metaValue: { fontSize: 13, fontWeight: '700' },
});
