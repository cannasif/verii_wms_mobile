import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight01Icon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { PagedFilterModal } from '@/components/paged/PagedFilterModal';
import { FlashPagedList } from '@/components/paged/FlashPagedList';
import { PagedListToolbar } from '@/components/paged/PagedListToolbar';
import { Text } from '@/components/ui/Text';
import { COLORS, RADII, SPACING } from '@/constants/theme';
import { formatLocalizedDate } from '@/lib/formatters';
import { useTheme } from '@/providers/ThemeProvider';
import { useWorkflowHeaders } from '../hooks/useWorkflowHeaders';
import type { WorkflowAssignedItem, WorkflowModuleConfig } from '../types/workflow';
import { WorkflowIcon } from './WorkflowIcon';

type WorkflowHeaderMode = 'assigned' | 'list';

function getTitle(item: WorkflowAssignedItem): string {
  return item.documentNo || item.orderId || `#${item.id}`;
}

function getSubtitle(item: WorkflowAssignedItem): string {
  return item.customerName || item.customerCode || item.projectCode || '-';
}

function buildHeaderInfoParams(item: WorkflowAssignedItem): Record<string, string> {
  const documentDate = item.documentDate || item.plannedDate || item.createdDate || '';

  return {
    title: getTitle(item),
    subtitle: getSubtitle(item),
    customerCode: item.customerCode || '',
    customerName: item.customerName || '',
    projectCode: item.projectCode || '',
    sourceWarehouse: item.sourceWarehouse || '',
    targetWarehouse: item.targetWarehouse || '',
    documentType: item.documentType || '',
    documentDate,
  };
}

function supportsCollection(moduleKey: WorkflowModuleConfig['key']) {
  return (
    moduleKey === 'goods-receipt' ||
    moduleKey === 'transfer' ||
    moduleKey === 'shipment' ||
    moduleKey === 'subcontracting-issue' ||
    moduleKey === 'subcontracting-receipt'
  );
}

export function WorkflowHeaderListScreen({
  module,
  mode,
}: {
  module: WorkflowModuleConfig;
  mode: WorkflowHeaderMode;
}): React.ReactElement {
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
  } = useWorkflowHeaders(module.key, mode);

  const titleKey = mode === 'assigned' ? module.pendingTitleKey : 'workflow.listHeroTitle';
  const titleText =
    mode === 'assigned' ? t(titleKey) : t(titleKey, { title: t(module.titleKey) });
  const descriptionText =
    mode === 'assigned'
      ? t(module.pendingTextKey, { count: totalCount })
      : t('workflow.listHeroText', { count: totalCount, title: t(module.titleKey) });
  const emptyTitle =
    mode === 'assigned' ? t(module.emptyTitleKey) : t('workflow.listEmptyTitle', { title: t(module.titleKey) });
  const emptyDescription =
    mode === 'assigned'
      ? t(module.emptyDescriptionKey)
      : t('workflow.listEmptyDescription', { title: t(module.titleKey) });
  const badgeText = mode === 'assigned' ? t('workflow.actions.assigned') : t('workflow.actions.list');

  const header = useMemo(
    () => (
      <View style={styles.headerContent}>
        <ScreenHeader title={titleText} subtitle={descriptionText} />

        <View style={[styles.heroCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.heroBadge, { backgroundColor: `${module.accent}20` }]}>
            <WorkflowIcon module={module} color={module.accent} size={20} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{badgeText}</Text>
            <Text style={[styles.heroText, { color: theme.colors.textSecondary }]}>{t(module.titleKey)}</Text>
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
    [
      appliedFilters.length,
      descriptionText,
      isInitialLoading,
      isRefreshing,
      module,
      reset,
      searchInput,
      setSearchInput,
      submitSearch,
      t,
      titleText,
    ],
  );

  const renderItem = ({ item }: { item: WorkflowAssignedItem }) => (
    <Pressable
      style={({ pressed }) => [
        styles.rowCard,
        {
          backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.03)',
          borderColor: theme.colors.border,
        },
        pressed && styles.rowPressed,
      ]}
      onPress={() => {
        if (mode === 'assigned' && supportsCollection(module.key)) {
          router.push({
            pathname: '/(tabs)/flows/[module]/collection/[headerId]',
            params: {
              module: module.key,
              headerId: String(item.id),
              ...buildHeaderInfoParams(item),
            },
          } as never);
          return;
        }

        if (mode === 'list') {
          router.push({
            pathname: '/(tabs)/flows/[module]/detail/[headerId]',
            params: {
              module: module.key,
              headerId: String(item.id),
              ...buildHeaderInfoParams(item),
            },
          } as never);
        }
      }}
    >
      <View style={styles.rowCopy}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowTitle}>{getTitle(item)}</Text>
          <View style={[styles.pendingPill, { backgroundColor: `${module.accent}20` }]}>
            <Text style={[styles.pendingText, { color: module.accent }]}>{badgeText}</Text>
          </View>
        </View>
        <Text style={[styles.rowCustomer, { color: theme.colors.text }]}>{getSubtitle(item)}</Text>
        {item.sourceWarehouse ? <Text style={[styles.rowMeta, { color: theme.colors.textSecondary }]}>{t('workflow.labels.sourceWarehouse', { value: item.sourceWarehouse })}</Text> : null}
        {item.targetWarehouse ? <Text style={[styles.rowMeta, { color: theme.colors.textSecondary }]}>{t('workflow.labels.targetWarehouse', { value: item.targetWarehouse })}</Text> : null}
        {item.documentType ? <Text style={[styles.rowMeta, { color: theme.colors.textSecondary }]}>{t('workflow.labels.documentType', { value: item.documentType })}</Text> : null}
        <Text style={[styles.rowMeta, { color: theme.colors.textSecondary }]}>{t('workflow.labels.date', { value: formatLocalizedDate(item.documentDate || item.plannedDate || item.createdDate) })}</Text>
      </View>
      <ArrowRight01Icon size={18} color={theme.colors.textMuted} />
    </Pressable>
  );

  return (
    <>
      <FlashPagedList
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
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        errorTitle={t('paged.errorTitle')}
        errorDescription={t('paged.errorDescription')}
        ListHeaderComponent={header}
      />

      <PagedFilterModal
        visible={isFilterOpen}
        columns={module.filterColumns}
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
  headerContent: { gap: SPACING.md, marginBottom: SPACING.xs },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: RADII.xl,
    padding: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroBadge: {
    width: 48,
    height: 48,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1, gap: 4 },
  heroTitle: { fontSize: 17, fontWeight: '800' },
  heroText: { color: COLORS.textSecondary, lineHeight: 20 },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: RADII.xl,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowPressed: { opacity: 0.9 },
  rowCopy: { flex: 1, gap: 5 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowTitle: { flex: 1, fontSize: 15, fontWeight: '900' },
  pendingPill: { borderRadius: RADII.pill, paddingHorizontal: 10, paddingVertical: 5 },
  pendingText: { fontSize: 11, fontWeight: '900' },
  rowCustomer: { color: COLORS.text, fontWeight: '700' },
  rowMeta: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
});
