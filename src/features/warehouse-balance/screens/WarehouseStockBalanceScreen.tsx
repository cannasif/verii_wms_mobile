import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Layers01Icon, PackageSearchIcon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { FlashPagedList } from '@/components/paged/FlashPagedList';
import { PagedFilterModal } from '@/components/paged/PagedFilterModal';
import { PagedListToolbar } from '@/components/paged/PagedListToolbar';
import { PageShell } from '@/components/layout/PageShell';
import { SectionCard } from '@/components/ui/SectionCard';
import { Text } from '@/components/ui/Text';
import { RADII, SPACING } from '@/constants/theme';
import { formatLocalizedDateTime, formatLocalizedNumber } from '@/lib/formatters';
import { useTheme } from '@/providers/ThemeProvider';
import { usePagedFlatList } from '@/hooks/usePagedFlatList';
import { warehouseBalanceApi } from '../api';
import { warehouseStockBalanceFilters, type WarehouseStockBalanceItem } from '../types';

export function WarehouseStockBalanceScreen(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [filterVisible, setFilterVisible] = useState(false);

  const paged = usePagedFlatList<WarehouseStockBalanceItem>({
    queryKey: ['warehouse-balance', 'stock'],
    pageSize: 20,
    defaultSortBy: 'Id',
    defaultSortDirection: 'desc',
    defaultFilterColumn: 'stockCode',
    columns: warehouseStockBalanceFilters,
    fetchPage: (params, options) => warehouseBalanceApi.getStockBalances(params, options),
  });

  const header = useMemo(
    () => (
      <View style={styles.headerContent}>
        <ScreenHeader
          title={t('inventoryMobile.stock.title')}
          subtitle={t('inventoryMobile.stock.subtitle')}
          rightSlot={
            <Pressable onPress={() => router.push('/(tabs)/inventory/serial-balance' as never)}>
              <Layers01Icon size={20} color={theme.colors.primary} />
            </Pressable>
          }
        />

        <SectionCard>
          <View style={styles.heroRow}>
            <PackageSearchIcon size={22} color={theme.colors.primary} />
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>{t('inventoryMobile.stock.heroTitle')}</Text>
              <Text style={[styles.heroText, { color: theme.colors.textSecondary }]}>
                {t('inventoryMobile.stock.heroText', { count: paged.totalCount })}
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
    [paged, t, theme.colors.primary, theme.colors.textSecondary],
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
        emptyTitle={t('inventoryMobile.stock.emptyTitle')}
        emptyDescription={t('inventoryMobile.stock.emptyDescription')}
        errorTitle={t('inventoryMobile.stock.errorTitle')}
        errorDescription={t('inventoryMobile.stock.loadFailed')}
        ListHeaderComponent={header}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <SectionCard style={styles.rowCard}>
            <View style={styles.rowHeader}>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{item.stockCode || '-'}</Text>
                <Text style={[styles.rowSubtitle, { color: theme.colors.textSecondary }]}>{item.stockName || '-'}</Text>
              </View>
              <View style={[styles.qtyPill, { backgroundColor: theme.mode === 'light' ? 'rgba(2,132,199,0.08)' : 'rgba(56,189,248,0.14)' }]}>
                <Text style={[styles.qtyText, { color: theme.colors.primary }]}>{formatLocalizedNumber(item.quantity)}</Text>
              </View>
            </View>

            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>{t('inventoryMobile.labels.warehouse')}</Text>
                <Text style={styles.metaValue}>{item.warehouseName || item.warehouseCode || '-'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>{t('inventoryMobile.labels.yapKod')}</Text>
                <Text style={styles.metaValue}>{item.yapKodCode || '-'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>{t('inventoryMobile.labels.available')}</Text>
                <Text style={styles.metaValue}>{formatLocalizedNumber(item.availableQuantity)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>{t('inventoryMobile.labels.serialCount')}</Text>
                <Text style={styles.metaValue}>{formatLocalizedNumber(item.distinctSerialCount, { maximumFractionDigits: 0 })}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>{t('inventoryMobile.labels.shelfCount')}</Text>
                <Text style={styles.metaValue}>{formatLocalizedNumber(item.distinctShelfCount, { maximumFractionDigits: 0 })}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>{t('inventoryMobile.labels.lastTxn')}</Text>
                <Text style={styles.metaValue}>{formatLocalizedDateTime(item.lastTransactionDate)}</Text>
              </View>
            </View>
          </SectionCard>
        )}
      />

      <PagedFilterModal
        visible={filterVisible}
        columns={warehouseStockBalanceFilters}
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
  rowCard: { marginBottom: SPACING.sm },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
  rowCopy: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 16, fontWeight: '900' },
  rowSubtitle: { lineHeight: 18 },
  qtyPill: { minWidth: 86, borderRadius: RADII.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs },
  qtyText: { fontSize: 15, fontWeight: '900' },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  metaItem: { width: '47%', gap: 2 },
  metaLabel: { fontSize: 11, fontWeight: '700' },
  metaValue: { fontSize: 13, fontWeight: '700' },
});
