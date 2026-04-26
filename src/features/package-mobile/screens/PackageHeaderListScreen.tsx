import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Add01Icon,
  ArrowRight01Icon,
  GridViewIcon,
  LeftToRightListBulletIcon,
  PackageIcon,
} from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { FlashPagedList } from '@/components/paged/FlashPagedList';
import { PagedFilterModal } from '@/components/paged/PagedFilterModal';
import { PagedListToolbar } from '@/components/paged/PagedListToolbar';
import { Text } from '@/components/ui/Text';
import { LAYOUT, RADII, SPACING } from '@/constants/theme';
import { formatLocalizedDate, formatLocalizedNumber } from '@/lib/formatters';
import { useTheme } from '@/providers/ThemeProvider';
import { usePagedFlatList } from '@/hooks/usePagedFlatList';
import { packageMobileApi } from '../api';
import { packageHeaderFilters, type MobilePackageHeaderItem } from '../types';

type ViewMode = 'list' | 'cards';
type StatusTone = 'packed' | 'shipped' | 'cancelled' | 'default';

/* kraft/cardboard palette */
const K_BG_L  = '#fdf3e3';   // krem kraft zemin
const K_BG_D  = '#1e1208';   // koyu karton zemin
const K_BD_L  = '#c4956a';   // kenarlık kahve
const K_BD_D  = '#5c3d1e';   // kenarlık koyu
const K_LID_L = '#d4a574';   // kapak orta kahve
const K_LID_D = '#3d2510';   // kapak koyu
const K_FG_L  = '#7a4a1e';   // ön plan metin
const K_FG_D  = '#f5c896';   // ön plan metin koyu
const K_SUB_L = '#9a6030';   // ikincil metin
const K_SUB_D = '#a07040';   // ikincil metin koyu

function getStatusTone(status: string | null | undefined): StatusTone {
  switch (status) {
    case 'Packed':    return 'packed';
    case 'Shipped':   return 'shipped';
    case 'Cancelled': return 'cancelled';
    case 'Draft':     return 'default';
    default:          return 'default';
  }
}

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = Math.floor((SCREEN_W - 40 - 12) / 2);

export function PackageHeaderListScreen(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const [filterVisible, setFilterVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const paged = usePagedFlatList<MobilePackageHeaderItem>({
    queryKey: ['package-mobile', 'headers'],
    pageSize: 20,
    defaultSortBy: 'Id',
    defaultSortDirection: 'desc',
    defaultFilterColumn: 'packingNo',
    columns: packageHeaderFilters,
    fetchPage: (params, options) => packageMobileApi.getHeaders(params, options),
  });

  /* ── status palette ── */
  const statusMap = useMemo(() => ({
    packed:    { bg: isDark ? 'rgba(52,211,153,0.18)' : 'rgba(5,150,105,0.10)', fg: theme.colors.success },
    shipped:   { bg: isDark ? 'rgba(56,189,248,0.18)' : 'rgba(2,132,199,0.10)', fg: theme.colors.primary },
    cancelled: { bg: isDark ? 'rgba(251,113,133,0.18)' : 'rgba(225,29,72,0.10)', fg: theme.colors.danger },
    default:   { bg: isDark ? 'rgba(212,165,116,0.22)' : 'rgba(196,149,106,0.18)', fg: isDark ? K_FG_D : K_FG_L },
  }), [isDark, theme.colors.danger, theme.colors.primary, theme.colors.success]);

  const renderBadge = useCallback((status: string | null | undefined) => {
    const tone = getStatusTone(status);
    const { bg, fg } = statusMap[tone];
    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color: fg }]}>{status || '-'}</Text>
      </View>
    );
  }, [statusMap]);

  /* ── LIST ROW ── */
  const renderListItem = useCallback((item: MobilePackageHeaderItem) => {
    return (
      <Pressable onPress={() => router.push(`/(tabs)/inventory/packages/${item.id}` as never)}>
        {({ pressed }) => (
            <View style={[
              styles.row,
              {
                borderColor: isDark ? K_BD_D : K_BD_L,
                backgroundColor: isDark ? K_BG_D : K_BG_L,
                opacity: pressed ? 0.88 : 1,
              },
            ]}>
              {/* icon */}
              <View style={[styles.rowIcon, { backgroundColor: isDark ? 'rgba(212,165,116,0.14)' : 'rgba(196,149,106,0.14)', borderColor: isDark ? K_BD_D : K_BD_L }]}>
                <PackageIcon size={12} color={isDark ? K_FG_D : K_FG_L} />
              </View>

            {/* body */}
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: isDark ? K_FG_D : K_FG_L }]}>
                {item.packingNo || '-'}
              </Text>
              <Text style={[styles.rowCustomer, { color: isDark ? K_SUB_D : K_SUB_L }]} numberOfLines={1}>
                {[item.customerCode, item.customerName].filter(Boolean).join(' · ') || (item.sourceType ?? '-')}
              </Text>
              <View style={styles.rowMetaRow}>
                <Text style={[styles.rowMeta, { color: isDark ? K_SUB_D : K_SUB_L }]}>
                  {item.warehouseCode || '-'}
                  {item.sourceType ? `  ·  ${item.sourceType}` : ''}
                </Text>
              </View>
            </View>

            {/* right */}
            <View style={styles.rowRight}>
              {renderBadge(item.status)}
              <View style={styles.rowCountRow}>
                <Text style={[styles.rowCountNum, { color: isDark ? K_FG_D : K_FG_L }]}>
                  {formatLocalizedNumber(item.totalPackageCount ?? 0, { maximumFractionDigits: 0 })}
                </Text>
                <Text style={[styles.rowCountUnit, { color: isDark ? K_SUB_D : K_SUB_L }]}>pkt</Text>
              </View>
              <Text style={[styles.rowDate, { color: isDark ? K_SUB_D : K_SUB_L }]}>
                {formatLocalizedDate(item.packingDate)}
              </Text>
              <ArrowRight01Icon size={12} color={isDark ? K_SUB_D : K_SUB_L} />
            </View>
          </View>
        )}
      </Pressable>
    );
  }, [isDark, renderBadge, statusMap]);

  /* ── CARD ── */
  const renderCardItem = useCallback((item: MobilePackageHeaderItem) => {
    const tone = getStatusTone(item.status);
    const { fg } = statusMap[tone];

    return (
      <Pressable
        style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
        onPress={() => router.push(`/(tabs)/inventory/packages/${item.id}` as never)}
      >
      <View style={[
        styles.card,
        {
          borderColor: isDark ? '#5c3d1e' : '#c4956a',
          backgroundColor: isDark ? '#1e1208' : '#fdf3e3',
        },
      ]}>
          {/* koli kapağı — üst şerit */}
          <View style={[styles.cardLid, { backgroundColor: isDark ? '#3d2510' : '#d4a574' }]}>
            <PackageIcon size={11} color={isDark ? '#f5c896' : '#7a4a1e'} />
            <Text style={[styles.cardLidText, { color: isDark ? '#f5c896' : '#7a4a1e' }]}>
              {item.packingNo || '-'}
            </Text>
            {renderBadge(item.status)}
          </View>

          {/* katlama köşesi (sağ üst) */}
          <View style={[styles.cardFold, { backgroundColor: isDark ? '#5c3d1e' : '#c4956a' }]} />

          <View style={styles.cardBody}>
            {/* customer */}
            <Text style={[styles.cardCustomer, { color: isDark ? '#d4a574' : '#6b3e1a' }]} numberOfLines={1}>
              {item.customerCode || item.customerName || '-'}
            </Text>

            {/* warehouse + source */}
            <Text style={[styles.cardMeta, { color: isDark ? '#a07040' : '#9a6030' }]} numberOfLines={1}>
              {[item.warehouseCode, item.sourceType].filter(Boolean).join(' · ') || '-'}
            </Text>

            {/* divider (bant çizgisi gibi) */}
            <View style={[styles.cardDivider, { borderTopColor: isDark ? '#5c3d1e' : '#d4a574', borderStyle: 'dashed' }]} />

            {/* mini metrics */}
            <View style={styles.cardMiniGrid}>
              <View style={styles.cardMiniCell}>
                <Text style={[styles.cardMiniLabel, { color: isDark ? '#a07040' : '#9a6030' }]}>{t('packageMobile.labels.packageCount')}</Text>
                <Text style={[styles.cardMiniValue, { color: fg }]} numberOfLines={1}>
                  {formatLocalizedNumber(item.totalPackageCount ?? 0, { maximumFractionDigits: 0 })}
                </Text>
              </View>
              <View style={[styles.cardMiniSep, { backgroundColor: isDark ? '#5c3d1e' : '#c4956a' }]} />
              <View style={styles.cardMiniCell}>
                <Text style={[styles.cardMiniLabel, { color: isDark ? '#a07040' : '#9a6030' }]}>{t('packageMobile.labels.totalQuantity')}</Text>
                <Text style={[styles.cardMiniValue, { color: isDark ? '#e8c99a' : '#4a2a0a' }]} numberOfLines={1}>
                  {formatLocalizedNumber(item.totalQuantity ?? 0)}
                </Text>
              </View>
              <View style={[styles.cardMiniSep, { backgroundColor: isDark ? '#5c3d1e' : '#c4956a' }]} />
              <View style={styles.cardMiniCell}>
                <Text style={[styles.cardMiniLabel, { color: isDark ? '#a07040' : '#9a6030' }]}>{t('packageMobile.labels.packingDate')}</Text>
                <Text style={[styles.cardDateValue, { color: isDark ? '#e8c99a' : '#4a2a0a' }]}>
                  {formatLocalizedDate(item.packingDate)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }, [isDark, renderBadge, statusMap, t, theme.colors.card, theme.colors.text, theme.colors.textMuted]);

  /* ── page header ── */
  const header = (
    <View style={styles.headerWrap}>
      <ScreenHeader
        title={t('packageMobile.list.title')}
        subtitle={t('packageMobile.list.subtitle')}
      />

      {/* info card + create CTA */}
      <View style={[
        styles.infoCard,
        { backgroundColor: isDark ? K_BG_D : K_BG_L, borderColor: isDark ? K_BD_D : K_BD_L },
      ]}>
        <View style={[styles.infoIconBox, { backgroundColor: isDark ? 'rgba(212,165,116,0.18)' : 'rgba(196,149,106,0.14)' }]}>
          <PackageIcon size={16} color={isDark ? K_FG_D : K_FG_L} />
        </View>
        <View style={styles.infoText}>
          <Text style={[styles.infoTitle, { color: isDark ? K_FG_D : K_FG_L }]}>
            {t('packageMobile.list.heroTitle')}
          </Text>
          <Text style={[styles.infoSub, { color: isDark ? K_SUB_D : K_SUB_L }]}>
            {t('packageMobile.list.heroText', { count: paged.totalCount ?? 0 })}
          </Text>
        </View>
        {/* create button */}
        <Pressable
          onPress={() => router.push('/(tabs)/inventory/packages/create' as never)}
          style={({ pressed }) => [
            styles.createBtn,
            {
              borderColor: isDark ? K_BD_D : K_BD_L,
              backgroundColor: pressed
                ? isDark ? 'rgba(212,165,116,0.20)' : 'rgba(196,149,106,0.18)'
                : isDark ? 'rgba(212,165,116,0.12)' : 'rgba(196,149,106,0.10)',
            },
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('packageMobile.create.listCta')}
        >
          <Add01Icon size={16} color={isDark ? K_FG_D : K_FG_L} />
          <Text style={[styles.createBtnText, { color: isDark ? K_FG_D : K_FG_L }]}>
            {t('packageMobile.create.listCta')}
          </Text>
        </Pressable>
      </View>

      {/* toolbar */}
      <PagedListToolbar
        value={paged.searchInput}
        onChange={paged.setSearchInput}
        onSubmit={() => paged.submitSearch()}
        onOpenFilters={() => setFilterVisible(true)}
        onReset={paged.reset}
        isBusy={paged.isRefreshing || paged.isInitialLoading}
        activeFilterCount={paged.appliedFilters.length}
        accentBorderColor={isDark ? K_BD_D : K_BD_L}
      />

      {/* count + view toggle */}
      <View style={styles.viewToggleRow}>
        <Text style={[styles.viewToggleCount, { color: isDark ? K_SUB_D : K_SUB_L }]}>
          {`${paged.totalCount ?? 0} kayıt`}
        </Text>
        <View style={[styles.viewToggle, { borderColor: isDark ? K_BD_D : K_BD_L, backgroundColor: isDark ? 'rgba(212,165,116,0.05)' : 'rgba(196,149,106,0.05)' }]}>
          {([
            { mode: 'list' as ViewMode, Icon: LeftToRightListBulletIcon },
            { mode: 'cards' as ViewMode, Icon: GridViewIcon },
          ] as const).map(({ mode, Icon }) => (
            <Pressable
              key={mode}
              onPress={() => setViewMode(mode)}
              style={[
                styles.viewToggleBtn,
                viewMode === mode && { backgroundColor: isDark ? 'rgba(212,165,116,0.20)' : 'rgba(196,149,106,0.18)', borderRadius: RADII.sm },
              ]}
            >
              <Icon size={16} color={viewMode === mode ? (isDark ? K_FG_D : K_FG_L) : (isDark ? K_SUB_D : K_SUB_L)} />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlashPagedList
        listKey={`packages-${viewMode}`}
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
        emptyTitle={t('packageMobile.list.emptyTitle')}
        emptyDescription={t('packageMobile.list.emptyDescription')}
        errorTitle={t('packageMobile.list.errorTitle')}
        errorDescription={t('packageMobile.list.loadFailed')}
        ListHeaderComponent={header}
        numColumns={viewMode === 'cards' ? 2 : 1}
        columnWrapperStyle={viewMode === 'cards' ? styles.columnWrapper : undefined}
        contentContainerStyle={{ gap: SPACING.sm, paddingTop: SPACING.md, paddingBottom: LAYOUT.screenBottomPadding }}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => viewMode === 'list' ? renderListItem(item) : renderCardItem(item)}
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
        onApply={() => { paged.applyFilters(); setFilterVisible(false); }}
        onClear={() => { paged.reset(); setFilterVisible(false); }}
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
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.xs + 2, paddingVertical: SPACING.xs, borderRadius: RADII.lg, borderWidth: 1.5 },
  createBtnText: { fontSize: 11, fontWeight: '800' },

  viewToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewToggleCount: { fontSize: 11, fontWeight: '600' },
  viewToggle: { flexDirection: 'row', borderRadius: RADII.sm, borderWidth: 1, padding: 2, gap: 1 },
  viewToggleBtn: { paddingHorizontal: SPACING.xs, paddingVertical: 5 },

  /* ── shared badge ── */
  badge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: RADII.pill },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.3 },

  /* ── LIST ROW ── */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: 7,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADII.lg,
    borderWidth: 1.5,
  },
  rowIcon: { width: 26, height: 26, borderRadius: RADII.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  rowBody: { flex: 1, minWidth: 0, gap: 1 },
  rowTitle: { fontSize: 11, fontWeight: '800', lineHeight: 15 },
  rowCustomer: { fontSize: 9, fontWeight: '500' },
  rowMetaRow: { flexDirection: 'row', alignItems: 'center' },
  rowMeta: { fontSize: 8, fontWeight: '400' },
  rowRight: { alignItems: 'flex-end', gap: 2, flexShrink: 0 },
  rowCountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  rowCountNum: { fontSize: 12, fontWeight: '900' },
  rowCountUnit: { fontSize: 8, fontWeight: '600' },
  rowDate: { fontSize: 8, fontWeight: '500' },

  /* ── CARD (koli/kutu tasarımı) ── */
  columnWrapper: { gap: SPACING.sm, justifyContent: 'flex-start' },
  card: {
    width: CARD_W,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    overflow: 'hidden',
    gap: 0,
  },
  /* üst kapak şeridi */
  cardLid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 5,
  },
  cardLidText: { flex: 1, fontSize: 10, fontWeight: '900', letterSpacing: 0.2 },
  /* köşe katlama efekti */
  cardFold: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderBottomLeftRadius: 10,
    opacity: 0.6,
  },
  cardBody: { padding: SPACING.xs + 2, gap: 3 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 1 },
  cardIconBox: { width: 26, height: 26, borderRadius: RADII.sm, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 12, fontWeight: '800', lineHeight: 16 },
  cardCustomer: { fontSize: 10, fontWeight: '600' },
  cardMeta: { fontSize: 9, fontWeight: '400' },
  cardDivider: { borderTopWidth: 1, marginVertical: 3 },
  cardMiniGrid: { flexDirection: 'row', alignItems: 'center' },
  cardMiniCell: { flex: 1, gap: 1 },
  cardMiniSep: { width: 0.75, height: 20, marginHorizontal: 3 },
  cardMiniLabel: { fontSize: 7, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  cardMiniValue: { fontSize: 10, fontWeight: '800' },
  cardDateValue: { fontSize: 8, fontWeight: '600', lineHeight: 12 },
});
