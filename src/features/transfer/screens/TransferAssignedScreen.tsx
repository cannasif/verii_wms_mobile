import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowLeft01Icon, ArrowRight01Icon, ShipmentTrackingIcon } from 'hugeicons-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PagedFilterModal } from '@/components/paged/PagedFilterModal';
import { PagedFlatList } from '@/components/paged/PagedFlatList';
import { PagedListToolbar } from '@/components/paged/PagedListToolbar';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/theme';
import { formatLocalizedDate } from '@/lib/formatters';
import { useTheme } from '@/providers/ThemeProvider';
import { useAssignedTransferHeaders } from '../hooks/useAssignedTransferHeaders';
import { transferAssignedFilterColumns, type TransferAssignedHeader } from '../types';

export function TransferAssignedScreen(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const {
    listRef,
    items,
    totalCount,
    searchInput,
    setSearchInput,
    draftFilters,
    filterLogic,
    setFilterLogic,
    appliedFilters,
    latestPage,
    isInitialLoading,
    isRefreshing,
    isFetchingNextPage,
    isError,
    submitSearch,
    refresh,
    loadMore,
    reset,
    addDraftFilter,
    updateDraftFilter,
    removeDraftFilter,
    applyFilters,
  } = useAssignedTransferHeaders();

  const header = useMemo(
    () => (
      <View style={styles.headerContent}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft01Icon size={18} color={theme.colors.text} />
          <Text style={[styles.backText, { color: theme.colors.textSecondary }]}>{t('common.back')}</Text>
        </Pressable>

        <Text style={styles.title}>{t('screens.transfer.title')}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{t('screens.transfer.subtitle')}</Text>

        <View style={[styles.heroCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.heroBadge}>
            <ShipmentTrackingIcon size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{t('screens.transfer.pendingTitle')}</Text>
            <Text style={[styles.heroText, { color: theme.colors.textSecondary }]}>
              {t('screens.transfer.pendingText', { count: totalCount })}
            </Text>
          </View>
        </View>

        <PagedListToolbar
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={() => submitSearch()}
          onOpenFilters={() => setIsFilterOpen(true)}
          onReset={reset}
          isBusy={isRefreshing || isInitialLoading}
          activeFilterCount={appliedFilters.length}
        />
      </View>
    ),
    [appliedFilters.length, isInitialLoading, isRefreshing, reset, searchInput, setSearchInput, submitSearch, t, totalCount],
  );

  const renderItem = ({ item }: { item: TransferAssignedHeader; index: number }) => (
    <Pressable style={({ pressed }) => [styles.rowCard, { backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.03)', borderColor: theme.colors.border }, pressed && styles.rowPressed]}>
      <View style={styles.rowCopy}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowTitle}>{item.documentNo || '-'}</Text>
          <View style={styles.pendingPill}>
            <Text style={[styles.pendingText, { color: theme.colors.primary }]}>{t('screens.transfer.pendingBadge')}</Text>
          </View>
        </View>
        <Text style={[styles.rowCustomer, { color: theme.colors.text }]}>{item.customerName || item.customerCode || '-'}</Text>
        <Text style={[styles.rowMeta, { color: theme.colors.textSecondary }]}>{t('screens.transfer.sourceWarehouse', { value: item.sourceWarehouse || '-' })}</Text>
        <Text style={[styles.rowMeta, { color: theme.colors.textSecondary }]}>{t('screens.transfer.targetWarehouse', { value: item.targetWarehouse || '-' })}</Text>
        <Text style={[styles.rowMeta, { color: theme.colors.textSecondary }]}>{formatLocalizedDate(item.documentDate)}</Text>
      </View>
      <ArrowRight01Icon size={18} color={theme.colors.textMuted} />
    </Pressable>
  );

  return (
    <>
      <PagedFlatList
        listRef={listRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        latestPage={latestPage}
        isInitialLoading={isInitialLoading}
        isRefreshing={isRefreshing}
        isFetchingNextPage={isFetchingNextPage}
        isError={isError}
        onRefresh={refresh}
        onLoadMore={loadMore}
        onRetry={refresh}
        emptyTitle={t('screens.transfer.emptyTitle')}
        emptyDescription={t('screens.transfer.emptyDescription')}
        errorTitle={t('paged.errorTitle')}
        errorDescription={t('paged.errorDescription')}
        ListHeaderComponent={header}
      />

      <PagedFilterModal
        visible={isFilterOpen}
        columns={transferAssignedFilterColumns}
        draftFilters={draftFilters}
        filterLogic={filterLogic}
        onClose={() => setIsFilterOpen(false)}
        onAdd={addDraftFilter}
        onUpdate={updateDraftFilter}
        onRemove={removeDraftFilter}
        onFilterLogicChange={setFilterLogic}
        onApply={() => {
          applyFilters();
          setIsFilterOpen(false);
        }}
        onClear={() => {
          reset();
          setIsFilterOpen(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerContent: { gap: 16, marginBottom: 8 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  backText: { color: COLORS.textSecondary, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { color: COLORS.textSecondary, lineHeight: 22 },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 24,
    padding: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56,189,248,0.12)',
  },
  heroCopy: { flex: 1, gap: 4 },
  heroTitle: { fontSize: 17, fontWeight: '800' },
  heroText: { color: COLORS.textSecondary, lineHeight: 20 },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 22,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowPressed: { opacity: 0.9 },
  rowCopy: { flex: 1, gap: 5 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowTitle: { flex: 1, fontSize: 15, fontWeight: '900' },
  pendingPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(56,189,248,0.16)',
  },
  pendingText: { color: COLORS.primary, fontSize: 11, fontWeight: '900' },
  rowCustomer: { color: COLORS.text, fontWeight: '700' },
  rowMeta: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
});
