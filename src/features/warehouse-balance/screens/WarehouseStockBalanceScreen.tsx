import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  ArrowDown01Icon,
  DeliveryBox01Icon,
  GridViewIcon,
  Layers01Icon,
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
import { formatLocalizedNumber } from '@/lib/formatters';
import { useTheme } from '@/providers/ThemeProvider';
import { usePagedFlatList } from '@/hooks/usePagedFlatList';
import { workflowCreateApi } from '@/features/workflow-create/api';
import type { WarehouseOption } from '@/features/workflow-create/types';
import { warehouseBalanceApi } from '../api';
import { warehouseStockBalanceFilters, type WarehouseStockBalanceItem } from '../types';
import { LabelPrintSheet } from '@/features/label-printing/components/LabelPrintSheet';
import { LabelPrintTriggerIcon } from '@/components/icons/LabelPrintTriggerIcon';
import type { ApiRequestOptions } from '@/lib/request-utils';
import type { PagedFilter, PagedParams } from '@/types/paged';

type ViewMode = 'list' | 'cards';
type BalanceTone = 'critical' | 'low' | 'ok';

/** Fixed card width for 2-column grid: (screenWidth - 2×20px padding - 12px gap) / 2 */
const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = Math.floor((SCREEN_W - 40 - 12) / 2);

function mergeWarehouseFilter(filters: PagedFilter[], depoKodu: number | null): PagedFilter[] {
  const base = filters.filter((f) => f.column !== 'WarehouseId');
  if (depoKodu == null) return base;
  return [...base, { column: 'WarehouseId', operator: 'Equals', value: String(depoKodu) }];
}

function getTone(available: number, quantity: number): BalanceTone {
  if (available <= 0) return 'critical';
  const r = quantity > 0 ? available / quantity : 1;
  if (available < 10 || r < 0.12) return 'low';
  return 'ok';
}

export function WarehouseStockBalanceScreen(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';

  const [filterVisible, setFilterVisible] = useState(false);
  const [warehouseSheetVisible, setWarehouseSheetVisible] = useState(false);
  const [labelOpen, setLabelOpen] = useState(false);
  const [labelKey, setLabelKey] = useState(0);
  const [labelStock, setLabelStock] = useState<{
    stockId: number;
    stockCode: string;
    stockName: string;
  } | null>(null);
  const [selectedDepoKodu, setSelectedDepoKodu] = useState<number | null>(null);
  const [selectedDepoLabel, setSelectedDepoLabel] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  /* ── tone palette ── */
  const toneMap = useMemo(
    () => ({
      critical: {
        bar: theme.colors.danger,
        badgeBg: isDark ? 'rgba(251,113,133,0.18)' : 'rgba(225,29,72,0.10)',
        badgeFg: theme.colors.danger,
        pillBg: isDark ? 'rgba(251,113,133,0.14)' : 'rgba(225,29,72,0.08)',
        pillFg: theme.colors.danger,
      },
      low: {
        bar: theme.colors.accent,
        badgeBg: isDark ? 'rgba(249,115,22,0.20)' : 'rgba(234,88,12,0.10)',
        badgeFg: theme.colors.accent,
        pillBg: isDark ? 'rgba(249,115,22,0.14)' : 'rgba(234,88,12,0.08)',
        pillFg: theme.colors.accent,
      },
      ok: {
        bar: theme.colors.success,
        badgeBg: isDark ? 'rgba(52,211,153,0.18)' : 'rgba(5,150,105,0.09)',
        badgeFg: theme.colors.success,
        pillBg: isDark ? 'rgba(52,211,153,0.12)' : 'rgba(5,150,105,0.07)',
        pillFg: theme.colors.success,
      },
    }),
    [isDark, theme.colors.accent, theme.colors.danger, theme.colors.success],
  );

  /* ── fetch ── */
  const fetchStockPage = useCallback(
    (params: Required<PagedParams>, opts?: ApiRequestOptions) =>
      warehouseBalanceApi.getStockBalances(
        { ...params, filters: mergeWarehouseFilter(params.filters ?? [], selectedDepoKodu) },
        opts,
      ),
    [selectedDepoKodu],
  );

  const paged = usePagedFlatList<WarehouseStockBalanceItem>({
    queryKey: ['warehouse-balance', 'stock', selectedDepoKodu ?? 'all'],
    pageSize: 20,
    defaultSortBy: 'Id',
    defaultSortDirection: 'desc',
    defaultFilterColumn: 'stockCode',
    columns: warehouseStockBalanceFilters,
    fetchPage: fetchStockPage,
  });

  /* ── actions ── */
  const openSerial = useCallback(() => {
    router.push(
      selectedDepoKodu != null
        ? (`/(tabs)/inventory/serial-balance?warehouseId=${selectedDepoKodu}` as never)
        : ('/(tabs)/inventory/serial-balance' as never),
    );
  }, [selectedDepoKodu]);

  const onPickWarehouse = useCallback(
    (w: WarehouseOption) => {
      setSelectedDepoKodu(w.depoKodu);
      setSelectedDepoLabel(w.depoIsmi);
      paged.scrollToTop();
    },
    [paged],
  );

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

  const openLabelSheet = useCallback((item: WarehouseStockBalanceItem) => {
    setLabelKey((k) => k + 1);
    setLabelStock({ stockId: item.stockId, stockCode: item.stockCode ?? '', stockName: item.stockName ?? '' });
    setLabelOpen(true);
  }, []);

  /* ── warehouse sheet all-header ── */
  const sheetAllHeader = useMemo(
    () => (
      <Pressable
        onPress={() => { onPickAll(); setWarehouseSheetVisible(false); }}
        style={({ pressed }) => [
          styles.sheetAllBtn,
          {
            borderColor: selectedDepoKodu == null ? theme.colors.primary : theme.colors.border,
            backgroundColor: selectedDepoKodu == null
              ? isDark ? 'rgba(56,189,248,0.12)' : 'rgba(2,132,199,0.07)'
              : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.02)',
            opacity: pressed ? 0.88 : 1,
          },
        ]}
      >
        <Text style={[styles.sheetAllText, { color: selectedDepoKodu == null ? theme.colors.primary : theme.colors.text }]}>
          {t('inventoryMobile.stock.warehouseAll')}
        </Text>
      </Pressable>
    ),
    [isDark, onPickAll, selectedDepoKodu, t, theme.colors.border, theme.colors.primary, theme.colors.text],
  );

  /* ── badge ── */
  const renderBadge = (bal: BalanceTone) => {
    const { badgeBg, badgeFg } = toneMap[bal];
    const label =
      bal === 'critical' ? t('inventoryMobile.stock.badgeCritical')
      : bal === 'low' ? t('inventoryMobile.stock.badgeLow')
      : t('inventoryMobile.stock.badgeOk');
    return (
      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.badgeText, { color: badgeFg }]}>{label}</Text>
      </View>
    );
  };

  /* ────────────────────────────────────────────────────────────
     LIST ROW  (table-style: icon | name + sku + location | qty + badge)
  ─────────────────────────────────────────────────────────────*/
  const renderListItem = (item: WarehouseStockBalanceItem) => {
    const bal = getTone(item.availableQuantity, item.quantity);
    const { pillFg } = toneMap[bal];

    return (
      <View style={[
        styles.listRow,
        {
          borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.16)',
          backgroundColor: isDark ? 'rgba(13,27,52,0.70)' : theme.colors.card,
        },
      ]}>
        {/* icon box */}
        <View style={[
          styles.listIconBox,
          { backgroundColor: isDark ? 'rgba(56,189,248,0.08)' : 'rgba(2,132,199,0.06)', borderColor: isDark ? 'rgba(56,189,248,0.18)' : 'rgba(2,132,199,0.14)' },
        ]}>
          <DeliveryBox01Icon size={13} color={theme.colors.primary} />
        </View>

        {/* body: name + sku + location */}
        <View style={styles.listBody}>
          <Text style={[styles.listName, { color: theme.colors.text }]}>
            {item.stockName || item.stockCode || '-'}
          </Text>
          {item.stockCode ? (
            <Text style={[styles.listSku, { color: theme.colors.textMuted }]} numberOfLines={1}>
              {item.stockCode}
            </Text>
          ) : null}
          {(item.warehouseName || item.warehouseCode) ? (
            <View style={styles.listLocRow}>
              <Location01Icon size={10} color={theme.colors.textMuted} />
              <Text style={[styles.listLoc, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {item.warehouseName || item.warehouseCode}
                {item.yapKodCode ? `  ·  ${item.yapKodCode}` : ''}
              </Text>
            </View>
          ) : null}
        </View>

        {/* right: qty + avail + badge */}
        <View style={styles.listRight}>
          <View style={styles.listQtyRow}>
            <Text style={[styles.listQtyNum, { color: pillFg }]}>
              {formatLocalizedNumber(item.quantity)}
            </Text>
            <Text style={[styles.listQtyUnit, { color: theme.colors.textMuted }]}>Adet</Text>
          </View>
          <Text style={[styles.listAvail, { color: theme.colors.primary }]}>
            {`≥ ${formatLocalizedNumber(item.availableQuantity)}`}
          </Text>
          {renderBadge(bal)}
        </View>
      </View>
    );
  };

  /* ────────────────────────────────────────────────────────────
     CARD (2-column compact: icon+badge | name | sku | qty | loc | mini-metrics)
  ─────────────────────────────────────────────────────────────*/
  const renderCardItem = (item: WarehouseStockBalanceItem) => {
    const bal = getTone(item.availableQuantity, item.quantity);
    const { pillFg } = toneMap[bal];

    return (
      <View style={[
        styles.card,
        { borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.18)', backgroundColor: isDark ? 'rgba(13,27,52,0.85)' : theme.colors.card },
      ]}>
        {/* Top: icon + badge */}
        <View style={styles.cardHead}>
          <View style={[styles.cardIconBox, { backgroundColor: isDark ? 'rgba(56,189,248,0.10)' : 'rgba(2,132,199,0.07)' }]}>
            <DeliveryBox01Icon size={13} color={theme.colors.primary} />
          </View>
          <View style={styles.cardHeadRight}>
            {renderBadge(bal)}
            <Pressable
              onPress={() => openLabelSheet(item)}
              hitSlop={8}
              accessibilityRole='button'
              style={({ pressed }) => [
                styles.cardPrintBtn,
                { borderColor: theme.colors.border, backgroundColor: isDark ? 'rgba(56,189,248,0.08)' : 'rgba(2,132,199,0.05)', opacity: pressed ? 0.75 : 1 },
              ]}
            >
                <LabelPrintTriggerIcon size={11} color={theme.colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* Name */}
        <Text style={[styles.cardName, { color: theme.colors.text }]}>
          {item.stockName || item.stockCode || '-'}
        </Text>

        {/* SKU */}
        <Text style={[styles.cardSku, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {item.stockCode || '-'}
        </Text>

        {/* Quantity */}
        <View style={styles.cardQtyRow}>
          <Text style={[styles.cardQtyNum, { color: pillFg }]}>
            {formatLocalizedNumber(item.quantity)}
          </Text>
          <Text style={[styles.cardQtyUnit, { color: theme.colors.textMuted }]}>Adet</Text>
        </View>

        {/* Warehouse / location */}
        <View style={styles.cardLocRow}>
          <Location01Icon size={8} color={theme.colors.textMuted} />
          <Text style={[styles.cardLoc, { color: theme.colors.textMuted }]} numberOfLines={1}>
            {item.warehouseName || item.warehouseCode || '-'}
          </Text>
        </View>

        {/* Mini metrics row */}
        <View style={[styles.cardDivider, { borderTopColor: theme.colors.border }]} />
        <View style={styles.cardMiniGrid}>
          <View style={styles.cardMiniCell}>
            <Text style={[styles.cardMiniLabel, { color: theme.colors.textMuted }]}>{t('inventoryMobile.labels.available')}</Text>
            <Text style={[styles.cardMiniValue, { color: theme.colors.primary }]} numberOfLines={1}>
              {formatLocalizedNumber(item.availableQuantity)}
            </Text>
          </View>
          <View style={[styles.cardMiniSep, { backgroundColor: theme.colors.border }]} />
          <View style={styles.cardMiniCell}>
            <Text style={[styles.cardMiniLabel, { color: theme.colors.textMuted }]}>{t('inventoryMobile.labels.yapKod')}</Text>
            <Text style={[styles.cardMiniValue, { color: theme.colors.text }]} numberOfLines={1}>
              {item.yapKodCode || '-'}
            </Text>
          </View>
          <View style={[styles.cardMiniSep, { backgroundColor: theme.colors.border }]} />
          <View style={styles.cardMiniCell}>
            <Text style={[styles.cardMiniLabel, { color: theme.colors.textMuted }]}>{t('inventoryMobile.labels.serialCount')}</Text>
            <Text style={[styles.cardMiniValue, { color: theme.colors.text }]} numberOfLines={1}>
              {formatLocalizedNumber(item.distinctSerialCount, { maximumFractionDigits: 0 })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  /* ── page header ── */
  const warehouseSummary =
    selectedDepoKodu == null
      ? t('inventoryMobile.stock.warehouseAll')
      : selectedDepoLabel ?? `#${selectedDepoKodu}`;

  const header = (
    <View style={styles.headerWrap}>
      <ScreenHeader
        title={t('inventoryMobile.stock.title')}
        subtitle={t('inventoryMobile.stock.subtitle')}
        rightSlot={
          <Pressable onPress={openSerial} hitSlop={12} accessibilityRole='button'>
            <Layers01Icon size={22} color={theme.colors.primary} />
          </Pressable>
        }
      />

      {/* info card */}
      <View style={[
        styles.infoCard,
        { backgroundColor: isDark ? 'rgba(99,102,241,0.16)' : 'rgba(99,102,241,0.07)', borderColor: isDark ? 'rgba(99,102,241,0.30)' : 'rgba(99,102,241,0.18)' },
      ]}>
        <View style={[styles.infoIconBox, { backgroundColor: isDark ? 'rgba(99,102,241,0.22)' : 'rgba(99,102,241,0.12)' }]}>
          <PackageSearchIcon size={16} color={isDark ? '#a5b4fc' : '#6366f1'} />
        </View>
        <View style={styles.infoText}>
          <Text style={[styles.infoTitle, { color: isDark ? '#c7d2fe' : '#4338ca' }]}>{t('inventoryMobile.stock.heroTitle')}</Text>
          <Text style={[styles.infoSub, { color: isDark ? '#a5b4fc' : '#6366f1' }]}>
            {t('inventoryMobile.stock.heroText', { count: paged.totalCount ?? 0 })}
          </Text>
        </View>
      </View>

      {/* warehouse selector */}
      <Pressable
        onPress={() => setWarehouseSheetVisible(true)}
        style={({ pressed }) => [
          styles.warehouseSelector,
          {
            borderColor: selectedDepoKodu != null ? theme.colors.primary : theme.colors.border,
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.02)',
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <View style={[styles.warehouseIconBox, { backgroundColor: isDark ? 'rgba(56,189,248,0.10)' : 'rgba(2,132,199,0.07)', borderColor: isDark ? 'rgba(56,189,248,0.20)' : 'rgba(2,132,199,0.14)' }]}>
          <WarehouseIcon size={15} color={theme.colors.primary} />
        </View>
        <View style={styles.warehouseCopy}>
          <Text style={[styles.warehouseLabel, { color: theme.colors.textMuted }]}>{t('inventoryMobile.stock.warehousePick')}</Text>
          <Text style={[styles.warehouseValue, { color: selectedDepoKodu != null ? theme.colors.primary : theme.colors.text }]} numberOfLines={1}>
            {warehouseSummary}
          </Text>
        </View>
        <ArrowDown01Icon size={15} color={selectedDepoKodu != null ? theme.colors.primary : theme.colors.textMuted} />
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
        searchPlaceholder={t('inventoryMobile.stock.searchPlaceholderExtended')}
      />

      {/* view toggle */}
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
                viewMode === mode && { backgroundColor: isDark ? 'rgba(56,189,248,0.18)' : 'rgba(2,132,199,0.12)', borderRadius: RADII.sm },
              ]}
            >
              <Icon size={16} color={viewMode === mode ? theme.colors.primary : theme.colors.textMuted} />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.screenRoot}>
      <FlashPagedList
        listKey={`stock-${viewMode}`}
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
        selectedValue={selectedDepoKodu != null ? String(selectedDepoKodu) : undefined}
        queryKey={['warehouse-balance', 'warehouse-picker']}
        fetchPage={({ pageNumber, pageSize, search, signal }) =>
          workflowCreateApi.getWarehousesPaged(pageNumber, pageSize, search, { signal })
        }
        getValue={(w) => String(w.depoKodu)}
        getLabel={(w) => `${w.depoIsmi}  ·  #${w.depoKodu}`}
        onSelect={(w) => { onPickWarehouse(w); setWarehouseSheetVisible(false); }}
        onClose={() => setWarehouseSheetVisible(false)}
        autoSearchMinLength={2}
      />

      {labelOpen && labelStock ? (
        <LabelPrintSheet
          key={labelKey}
          visible
          stockId={labelStock.stockId}
          stockCode={labelStock.stockCode}
          stockName={labelStock.stockName}
          onClose={() => { setLabelOpen(false); setLabelStock(null); }}
        />
      ) : null}

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
        onApply={() => { paged.applyFilters(); setFilterVisible(false); }}
        onClear={() => { doReset(); setFilterVisible(false); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  /* ── screen root ── */
  screenRoot: { flex: 1 },

  /* ── header ── */
  headerWrap: { gap: SPACING.md, paddingBottom: SPACING.xs },

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

  /* ── sheet ── */
  sheetAllBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, borderRadius: RADII.md, borderWidth: 1.5, marginBottom: SPACING.sm },
  sheetAllText: { fontSize: 16, fontWeight: '800' },

  /* ── shared badge ── */
  badge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: RADII.pill },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.3 },

  /* ── LIST ROW ── */
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADII.lg,
    borderWidth: 1.5,
  },
  listIconBox: { width: 28, height: 28, borderRadius: RADII.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  listBody: { flex: 1, minWidth: 0, gap: 1 },
  listName: { fontSize: 11, fontWeight: '700', lineHeight: 15 },
  listSku: { fontSize: 9, fontWeight: '500' },
  listLocRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  listLoc: { fontSize: 9, fontWeight: '400', flex: 1 },
  listRight: { alignItems: 'flex-end', gap: 2, flexShrink: 0 },
  listQtyRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  listQtyNum: { fontSize: 13, fontWeight: '900' },
  listQtyUnit: { fontSize: 8, fontWeight: '600' },
  listAvail: { fontSize: 9, fontWeight: '600' },

  /* ── CARD (2-column compact) ── */
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
  cardHeadRight: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardPrintBtn: { width: 22, height: 22, borderRadius: RADII.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  cardName: { fontSize: 11, fontWeight: '800', lineHeight: 15 },
  cardSku: { fontSize: 9, fontWeight: '600' },
  cardQtyRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 1 },
  cardQtyNum: { fontSize: 17, fontWeight: '900' },
  cardQtyUnit: { fontSize: 9, fontWeight: '700' },
  cardLocRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cardLoc: { fontSize: 9, fontWeight: '500', flex: 1 },
  cardDivider: { borderTopWidth: 0.75, marginTop: 2 },
  cardMiniGrid: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  cardMiniCell: { flex: 1, gap: 1 },
  cardMiniSep: { width: 0.75, height: 20, marginHorizontal: 3 },
  cardMiniLabel: { fontSize: 7, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  cardMiniValue: { fontSize: 11, fontWeight: '900' },
});
