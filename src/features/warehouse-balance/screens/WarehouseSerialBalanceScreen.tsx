import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  ArrowDown01Icon,
  BarCode01Icon,
  GridViewIcon,
  LeftToRightListBulletIcon,
  Location01Icon,
  PackageSearchIcon,
  WarehouseIcon,
} from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { FlashPagedList } from '@/components/paged/FlashPagedList';
import { PagedFilterModal } from '@/components/paged/PagedFilterModal';
import { PagedListToolbar } from '@/components/paged/PagedListToolbar';
import { Text } from '@/components/ui/Text';
import { PagedSelectionSheet } from '@/components/ui/PagedSelectionSheet';
import { LAYOUT, RADII, SPACING } from '@/constants/theme';
import { formatLocalizedDateTime, formatLocalizedNumber } from '@/lib/formatters';
import { useTheme } from '@/providers/ThemeProvider';
import { usePagedFlatList } from '@/hooks/usePagedFlatList';
import { workflowCreateApi } from '@/features/workflow-create/api';
import type { WarehouseOption } from '@/features/workflow-create/types';
import { warehouseBalanceApi } from '../api';
import { warehouseSerialBalanceFilters, type WarehouseStockSerialBalanceItem } from '../types';
import type { ApiRequestOptions } from '@/lib/request-utils';
import type { PagedFilter, PagedParams } from '@/types/paged';

type ViewMode = 'list' | 'cards';

function mergeWarehouseFilter(filters: PagedFilter[], depoKodu: number | null): PagedFilter[] {
  const base = filters.filter((f) => f.column !== 'WarehouseId');
  if (depoKodu == null) return base;
  return [...base, { column: 'WarehouseId', operator: 'Equals', value: String(depoKodu) }];
}

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = Math.floor((SCREEN_W - 40 - 12) / 2);

export function WarehouseSerialBalanceScreen(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';

  const [filterVisible, setFilterVisible] = useState(false);
  const [warehouseSheetVisible, setWarehouseSheetVisible] = useState(false);
  const [selectedDepoKodu, setSelectedDepoKodu] = useState<number | null>(null);
  const [selectedDepoLabel, setSelectedDepoLabel] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const { warehouseId: warehouseIdParam } = useLocalSearchParams<{ warehouseId?: string }>();

  /* pre-fill warehouse from URL param */
  const urlWarehouseDepoKodu = useMemo(() => {
    const n = Number(warehouseIdParam);
    return Number.isFinite(n) && !Number.isNaN(n) ? n : null;
  }, [warehouseIdParam]);

  const effectiveDepoKodu = selectedDepoKodu ?? urlWarehouseDepoKodu;

  const fetchSerialPage = useCallback(
    (params: Required<PagedParams>, options?: ApiRequestOptions) => {
      const filters = mergeWarehouseFilter(params.filters ?? [], effectiveDepoKodu);
      return warehouseBalanceApi.getSerialBalances({ ...params, filters }, options);
    },
    [effectiveDepoKodu],
  );

  const paged = usePagedFlatList<WarehouseStockSerialBalanceItem>({
    queryKey: ['warehouse-balance', 'serial', effectiveDepoKodu ?? 'all'],
    pageSize: 20,
    defaultSortBy: 'Id',
    defaultSortDirection: 'desc',
    defaultFilterColumn: 'serialNo',
    columns: warehouseSerialBalanceFilters,
    fetchPage: fetchSerialPage,
  });

  /* ── actions ── */
  const onPickWarehouse = useCallback((w: WarehouseOption) => {
    setSelectedDepoKodu(w.depoKodu);
    setSelectedDepoLabel(w.depoIsmi);
    paged.scrollToTop();
  }, [paged]);

  const onPickAll = useCallback(() => {
    setSelectedDepoKodu(null);
    setSelectedDepoLabel(null);
    paged.scrollToTop();
  }, [paged]);

  const doReset = useCallback(() => {
    paged.reset();
    setSelectedDepoKodu(null);
    setSelectedDepoLabel(null);
  }, [paged]);

  /* ── warehouse sheet all header ── */
  const sheetAllHeader = useMemo(
    () => (
      <Pressable
        onPress={() => { onPickAll(); setWarehouseSheetVisible(false); }}
        style={({ pressed }) => [
          styles.sheetAllBtn,
          {
            borderColor: effectiveDepoKodu == null ? theme.colors.accent : theme.colors.border,
            backgroundColor: effectiveDepoKodu == null
              ? isDark ? 'rgba(251,146,60,0.12)' : 'rgba(234,88,12,0.07)'
              : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.02)',
            opacity: pressed ? 0.88 : 1,
          },
        ]}
      >
        <Text style={[styles.sheetAllText, { color: effectiveDepoKodu == null ? theme.colors.accent : theme.colors.text }]}>
          {t('inventoryMobile.stock.warehouseAll')}
        </Text>
      </Pressable>
    ),
    [effectiveDepoKodu, isDark, onPickAll, t, theme.colors.accent, theme.colors.border, theme.colors.text],
  );

  /* ── LIST ROW ── */
  const renderListItem = (item: WarehouseStockSerialBalanceItem) => {
    const location = [item.warehouseName || item.warehouseCode, item.shelfCode || item.shelfName].filter(Boolean).join(' · ');

    return (
      <View style={[
        styles.row,
        {
          borderColor: isDark ? 'rgba(251,146,60,0.22)' : 'rgba(234,88,12,0.18)',
          backgroundColor: isDark ? 'rgba(28,15,5,0.70)' : theme.colors.card,
        },
      ]}>
        <View style={[styles.rowIcon, { backgroundColor: isDark ? 'rgba(251,146,60,0.10)' : 'rgba(234,88,12,0.07)', borderColor: isDark ? 'rgba(251,146,60,0.22)' : 'rgba(234,88,12,0.16)' }]}>
          <BarCode01Icon size={13} color={theme.colors.accent} />
        </View>

        <View style={styles.rowBody}>
          <Text style={[styles.rowSerial, { color: theme.colors.text }]}>
            {item.serialNo || '-'}
          </Text>
          <Text style={[styles.rowStock, { color: theme.colors.textMuted }]} numberOfLines={1}>
            {[item.stockCode, item.stockName].filter(Boolean).join(' · ') || '-'}
          </Text>
          {location ? (
            <View style={styles.rowLocRow}>
              <Location01Icon size={8} color={theme.colors.textMuted} />
              <Text style={[styles.rowLoc, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {location}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.rowRight}>
          <View style={styles.rowQtyRow}>
            <Text style={[styles.rowQtyNum, { color: theme.colors.accent }]}>
              {formatLocalizedNumber(item.quantity)}
            </Text>
            <Text style={[styles.rowQtyUnit, { color: theme.colors.textMuted }]}>Adet</Text>
          </View>
          <Text style={[styles.rowAvail, { color: theme.colors.primary }]}>
            {`≥ ${formatLocalizedNumber(item.availableQuantity)}`}
          </Text>
          <Text style={[styles.rowDate, { color: theme.colors.textMuted }]} numberOfLines={1}>
            {formatLocalizedDateTime(item.lastTransactionDate)}
          </Text>
        </View>
      </View>
    );
  };

  /* ── CARD ── */
  const renderCardItem = (item: WarehouseStockSerialBalanceItem) => {
    const location = [item.warehouseName || item.warehouseCode, item.shelfCode || item.shelfName].filter(Boolean).join(' · ');

    return (
      <View style={[
        styles.card,
        {
          borderColor: isDark ? 'rgba(251,146,60,0.28)' : 'rgba(234,88,12,0.22)',
          backgroundColor: isDark ? 'rgba(28,15,5,0.80)' : theme.colors.card,
        },
      ]}>
        {/* top: icon + qty */}
        <View style={styles.cardHead}>
          <View style={[styles.cardIconBox, { backgroundColor: isDark ? 'rgba(251,146,60,0.10)' : 'rgba(234,88,12,0.07)' }]}>
            <BarCode01Icon size={13} color={theme.colors.accent} />
          </View>
          <View style={[styles.cardQtyPill, { backgroundColor: isDark ? 'rgba(251,146,60,0.14)' : 'rgba(234,88,12,0.08)' }]}>
            <Text style={[styles.cardQtyNum, { color: theme.colors.accent }]}>
              {formatLocalizedNumber(item.quantity)}
            </Text>
            <Text style={[styles.cardQtyUnit, { color: theme.colors.accent }]}>Adet</Text>
          </View>
        </View>

        {/* serial no */}
        <Text style={[styles.cardSerial, { color: theme.colors.text }]}>
          {item.serialNo || '-'}
        </Text>

        {/* stock */}
        <Text style={[styles.cardStock, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {item.stockCode || '-'}
        </Text>
        <Text style={[styles.cardStockName, { color: theme.colors.textMuted }]} numberOfLines={2}>
          {item.stockName || '-'}
        </Text>

        {/* location */}
        {location ? (
          <View style={styles.cardLocRow}>
            <Location01Icon size={8} color={theme.colors.textMuted} />
            <Text style={[styles.cardLoc, { color: theme.colors.textMuted }]} numberOfLines={1}>{location}</Text>
          </View>
        ) : null}

        {/* divider + mini metrics */}
        <View style={[styles.cardDivider, { borderTopColor: isDark ? 'rgba(251,146,60,0.18)' : 'rgba(234,88,12,0.14)' }]} />
        <View style={styles.cardMiniGrid}>
          <View style={styles.cardMiniCell}>
            <Text style={[styles.cardMiniLabel, { color: theme.colors.textMuted }]}>{t('inventoryMobile.labels.available')}</Text>
            <Text style={[styles.cardMiniValue, { color: theme.colors.primary }]} numberOfLines={1}>
              {formatLocalizedNumber(item.availableQuantity)}
            </Text>
          </View>
          <View style={[styles.cardMiniSep, { backgroundColor: isDark ? 'rgba(251,146,60,0.18)' : 'rgba(234,88,12,0.14)' }]} />
          <View style={styles.cardMiniCell}>
            <Text style={[styles.cardMiniLabel, { color: theme.colors.textMuted }]}>{t('inventoryMobile.labels.serialNo2') ?? 'Seri 2'}</Text>
            <Text style={[styles.cardMiniValue, { color: theme.colors.text }]} numberOfLines={1}>
              {item.serialNo2 || '-'}
            </Text>
          </View>
          <View style={[styles.cardMiniSep, { backgroundColor: isDark ? 'rgba(251,146,60,0.18)' : 'rgba(234,88,12,0.14)' }]} />
          <View style={styles.cardMiniCell}>
            <Text style={[styles.cardMiniLabel, { color: theme.colors.textMuted }]}>{t('inventoryMobile.labels.lastTxn')}</Text>
            <Text style={[styles.cardMiniValue, { color: theme.colors.text }]} numberOfLines={1}>
              {formatLocalizedDateTime(item.lastTransactionDate)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  /* ── page header ── */
  const warehouseSummary = effectiveDepoKodu == null
    ? t('inventoryMobile.stock.warehouseAll')
    : selectedDepoLabel ?? `#${effectiveDepoKodu}`;

  const header = (
    <View style={styles.headerWrap}>
      <ScreenHeader
        title={t('inventoryMobile.serial.title')}
        subtitle={t('inventoryMobile.serial.subtitle')}
      />

      {/* info card */}
      <View style={[
        styles.infoCard,
        { backgroundColor: isDark ? 'rgba(251,146,60,0.14)' : 'rgba(234,88,12,0.07)', borderColor: isDark ? 'rgba(251,146,60,0.28)' : 'rgba(234,88,12,0.18)' },
      ]}>
        <View style={[styles.infoIconBox, { backgroundColor: isDark ? 'rgba(251,146,60,0.20)' : 'rgba(234,88,12,0.10)' }]}>
          <PackageSearchIcon size={16} color={isDark ? '#fbbf24' : '#ea580c'} />
        </View>
        <View style={styles.infoText}>
          <Text style={[styles.infoTitle, { color: isDark ? '#fde68a' : '#c2410c' }]}>
            {t('inventoryMobile.serial.heroTitle')}
          </Text>
          <Text style={[styles.infoSub, { color: isDark ? '#fbbf24' : '#ea580c' }]}>
            {t('inventoryMobile.serial.heroText', { count: paged.totalCount ?? 0 })}
          </Text>
        </View>
      </View>

      {/* warehouse selector */}
      <Pressable
        onPress={() => setWarehouseSheetVisible(true)}
        style={({ pressed }) => [
          styles.warehouseSelector,
          {
            borderColor: effectiveDepoKodu != null ? theme.colors.accent : theme.colors.border,
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.02)',
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <View style={[styles.warehouseIconBox, { backgroundColor: isDark ? 'rgba(251,146,60,0.10)' : 'rgba(234,88,12,0.07)', borderColor: isDark ? 'rgba(251,146,60,0.20)' : 'rgba(234,88,12,0.14)' }]}>
          <WarehouseIcon size={15} color={theme.colors.accent} />
        </View>
        <View style={styles.warehouseCopy}>
          <Text style={[styles.warehouseLabel, { color: theme.colors.textMuted }]}>{t('inventoryMobile.stock.warehousePick')}</Text>
          <Text style={[styles.warehouseValue, { color: effectiveDepoKodu != null ? theme.colors.accent : theme.colors.text }]} numberOfLines={1}>
            {warehouseSummary}
          </Text>
        </View>
        <ArrowDown01Icon size={15} color={effectiveDepoKodu != null ? theme.colors.accent : theme.colors.textMuted} />
      </Pressable>

      {/* toolbar */}
      <PagedListToolbar
        value={paged.searchInput}
        onChange={paged.setSearchInput}
        onSubmit={() => paged.submitSearch()}
        onOpenFilters={() => setFilterVisible(true)}
        onReset={doReset}
        isBusy={paged.isRefreshing || paged.isInitialLoading}
        activeFilterCount={paged.appliedFilters.length}
      />

      {/* count + view toggle */}
      <View style={styles.viewToggleRow}>
        <Text style={[styles.viewToggleCount, { color: theme.colors.textMuted }]}>
          {`${paged.totalCount ?? 0} kayıt`}
        </Text>
        <View style={[styles.viewToggle, { borderColor: theme.colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)' }]}>
          {([
            { mode: 'list' as ViewMode, Icon: LeftToRightListBulletIcon },
            { mode: 'cards' as ViewMode, Icon: GridViewIcon },
          ] as const).map(({ mode, Icon }) => (
            <Pressable
              key={mode}
              onPress={() => setViewMode(mode)}
              style={[
                styles.viewToggleBtn,
                viewMode === mode && { backgroundColor: isDark ? 'rgba(251,146,60,0.18)' : 'rgba(234,88,12,0.12)', borderRadius: RADII.sm },
              ]}
            >
              <Icon size={16} color={viewMode === mode ? theme.colors.accent : theme.colors.textMuted} />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlashPagedList
        listKey={`serial-${viewMode}`}
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
        emptyTitle={t('inventoryMobile.serial.emptyTitle')}
        emptyDescription={t('inventoryMobile.serial.emptyDescription')}
        errorTitle={t('inventoryMobile.serial.errorTitle')}
        errorDescription={t('inventoryMobile.serial.loadFailed')}
        ListHeaderComponent={header}
        numColumns={viewMode === 'cards' ? 2 : 1}
        columnWrapperStyle={viewMode === 'cards' ? styles.columnWrapper : undefined}
        contentContainerStyle={{ gap: SPACING.sm, paddingTop: SPACING.md, paddingBottom: LAYOUT.screenBottomPadding }}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => viewMode === 'list' ? renderListItem(item) : renderCardItem(item)}
      />

      <PagedSelectionSheet<WarehouseOption>
        visible={warehouseSheetVisible}
        title={t('inventoryMobile.stock.warehousePick')}
        placeholder={t('workflowCreate.placeholders.warehouseSearch')}
        emptyText={t('workflowCreate.emptySearch')}
        listHeader={sheetAllHeader}
        selectedValue={effectiveDepoKodu != null ? String(effectiveDepoKodu) : undefined}
        queryKey={['warehouse-balance', 'serial-warehouse-picker']}
        fetchPage={({ pageNumber, pageSize, search, signal }) =>
          workflowCreateApi.getWarehousesPaged(pageNumber, pageSize, search, { signal })
        }
        getValue={(w) => String(w.depoKodu)}
        getLabel={(w) => `${w.depoIsmi}  ·  #${w.depoKodu}`}
        onSelect={(w) => { onPickWarehouse(w); setWarehouseSheetVisible(false); }}
        onClose={() => setWarehouseSheetVisible(false)}
        autoSearchMinLength={2}
      />

      <PagedFilterModal
        visible={filterVisible}
        columns={warehouseSerialBalanceFilters}
        draftFilters={paged.draftFilters}
        filterLogic={paged.filterLogic}
        onClose={() => setFilterVisible(false)}
        onAdd={paged.addDraftFilter}
        onUpdate={paged.updateDraftFilter}
        onRemove={paged.removeDraftFilter}
        onFilterLogicChange={paged.setFilterLogic}
        onApply={() => { paged.applyFilters(); setFilterVisible(false); }}
        onClear={() => { doReset(); setFilterVisible(false); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  /* ── header ── */
  headerWrap: { gap: SPACING.sm, paddingBottom: SPACING.xs },

  infoCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingVertical: SPACING.xs + 2, paddingHorizontal: SPACING.sm, borderRadius: RADII.xl, borderWidth: 1 },
  infoIconBox: { width: 34, height: 34, borderRadius: RADII.md, alignItems: 'center', justifyContent: 'center' },
  infoText: { flex: 1, gap: 2 },
  infoTitle: { fontSize: 12, fontWeight: '900' },
  infoSub: { fontSize: 10, fontWeight: '500', lineHeight: 14 },

  warehouseSelector: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingVertical: SPACING.xs + 2, paddingHorizontal: SPACING.sm, borderRadius: RADII.xl, borderWidth: 1.5 },
  warehouseIconBox: { width: 32, height: 32, borderRadius: RADII.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  warehouseCopy: { flex: 1, minWidth: 0, gap: 1 },
  warehouseLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  warehouseValue: { fontSize: 13, fontWeight: '800' },

  viewToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewToggleCount: { fontSize: 11, fontWeight: '600' },
  viewToggle: { flexDirection: 'row', borderRadius: RADII.sm, borderWidth: 1, padding: 2, gap: 1 },
  viewToggleBtn: { paddingHorizontal: SPACING.xs, paddingVertical: 5 },

  sheetAllBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADII.md, borderWidth: 1.5, marginBottom: SPACING.sm },
  sheetAllText: { fontSize: 15, fontWeight: '800' },

  /* ── LIST ROW ── */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADII.lg,
    borderWidth: 1.5,
  },
  rowIcon: { width: 28, height: 28, borderRadius: RADII.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  rowBody: { flex: 1, minWidth: 0, gap: 1 },
  rowSerial: { fontSize: 12, fontWeight: '800', lineHeight: 16 },
  rowStock: { fontSize: 10, fontWeight: '500' },
  rowLocRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rowLoc: { fontSize: 9, fontWeight: '400', flex: 1 },
  rowRight: { alignItems: 'flex-end', gap: 2, flexShrink: 0 },
  rowQtyRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  rowQtyNum: { fontSize: 13, fontWeight: '900' },
  rowQtyUnit: { fontSize: 8, fontWeight: '600' },
  rowAvail: { fontSize: 9, fontWeight: '600' },
  rowDate: { fontSize: 8, fontWeight: '500', maxWidth: 80 },

  /* ── CARD ── */
  columnWrapper: { gap: SPACING.sm, justifyContent: 'flex-start' },
  card: {
    width: CARD_W,
    borderRadius: RADII.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
    padding: SPACING.xs + 2,
    gap: 3,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 1 },
  cardIconBox: { width: 26, height: 26, borderRadius: RADII.sm, alignItems: 'center', justifyContent: 'center' },
  cardQtyPill: { flexDirection: 'row', alignItems: 'baseline', gap: 2, paddingHorizontal: 6, paddingVertical: 3, borderRadius: RADII.pill },
  cardQtyNum: { fontSize: 13, fontWeight: '900' },
  cardQtyUnit: { fontSize: 8, fontWeight: '700' },
  cardSerial: { fontSize: 12, fontWeight: '800', lineHeight: 16 },
  cardStock: { fontSize: 9, fontWeight: '700' },
  cardStockName: { fontSize: 10, fontWeight: '500', lineHeight: 14 },
  cardLocRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cardLoc: { fontSize: 9, fontWeight: '400', flex: 1 },
  cardDivider: { borderTopWidth: 0.75, marginTop: 2 },
  cardMiniGrid: { flexDirection: 'row', alignItems: 'center' },
  cardMiniCell: { flex: 1, gap: 1 },
  cardMiniSep: { width: 0.75, height: 20, marginHorizontal: 3 },
  cardMiniLabel: { fontSize: 7, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  cardMiniValue: { fontSize: 10, fontWeight: '800' },
});
