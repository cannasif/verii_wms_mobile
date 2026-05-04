import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useQueries, useQuery } from '@tanstack/react-query';
import { PackageIcon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { ScreenState } from '@/components/ui/ScreenState';
import { SectionCard } from '@/components/ui/SectionCard';
import { hasPermission } from '@/features/auth/utils/permissions';
import { COLORS, LAYOUT, RADII, SPACING } from '@/constants/theme';
import { CollectionHeaderInfoCard } from '@/features/shared-collection/CollectionHeaderInfoCard';
import { formatLocalizedDateTime, formatLocalizedNumber } from '@/lib/formatters';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/store/auth';
import { workflowApi } from '../api/workflow-api';
import type {
  WorkflowHeaderDetail,
  WorkflowImportLineDetail,
  WorkflowLineDetail,
  WorkflowLineSerialDetail,
  WorkflowModuleConfig,
  WorkflowRouteDetail,
  WorkflowTerminalLineDetail,
} from '../types/workflow';

function getImportLineTitle(line: WorkflowImportLineDetail): string {
  return line.stockName || line.description1 || line.description || line.stockCode;
}

function getOrderLineTitle(line: WorkflowLineDetail): string {
  return line.stockName || line.description || line.stockCode;
}

function formatQuantity(value?: number | null): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return formatLocalizedNumber(value, { maximumFractionDigits: 3 });
}

function firstFilled(...values: Array<string | null | undefined>): string | undefined {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim();
}

function buildInfo(
  fallbackInfo: {
    title?: string;
    subtitle?: string;
    customerCode?: string;
    customerName?: string;
    projectCode?: string;
    sourceWarehouse?: string;
    targetWarehouse?: string;
    documentType?: string;
    documentDate?: string;
  },
  detail?: WorkflowHeaderDetail | null,
) {
  return {
    title: detail?.documentNo || detail?.description1 || fallbackInfo.title,
    subtitle: fallbackInfo.subtitle || detail?.customerName || detail?.customerCode || detail?.projectCode || '',
    customerCode: detail?.customerCode || fallbackInfo.customerCode || '',
    customerName: detail?.customerName || fallbackInfo.customerName || '',
    projectCode: detail?.projectCode || fallbackInfo.projectCode || '',
    sourceWarehouse: detail?.sourceWarehouse || fallbackInfo.sourceWarehouse || '',
    targetWarehouse: detail?.targetWarehouse || fallbackInfo.targetWarehouse || '',
    documentType: detail?.documentType || fallbackInfo.documentType || '',
    documentDate: detail?.documentDate || detail?.plannedDate || detail?.createdDate || fallbackInfo.documentDate || '',
  };
}

function DetailMeta({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return <Text style={styles.rowMeta}>{label}: {value}</Text>;
}

function supportsPackageMove(moduleKey: WorkflowModuleConfig['key']): moduleKey is 'transfer' | 'shipment' {
  return moduleKey === 'transfer' || moduleKey === 'shipment';
}

export function WorkflowDetailScreen({
  module,
  headerId,
  fallbackInfo,
}: {
  module: WorkflowModuleConfig;
  headerId: number;
  fallbackInfo: {
    title?: string;
    subtitle?: string;
    customerCode?: string;
    customerName?: string;
    projectCode?: string;
    sourceWarehouse?: string;
    targetWarehouse?: string;
    documentType?: string;
    documentDate?: string;
  };
}): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const permissions = useAuthStore((state) => state.permissions);
  const [expandedOrderLines, setExpandedOrderLines] = useState<Record<number, boolean>>({});
  const [expandedImportLines, setExpandedImportLines] = useState<Record<number, boolean>>({});
  const canView = hasPermission(permissions, module.viewPermissionCode);
  const canUpdate = hasPermission(permissions, module.updatePermissionCode);

  const headerQuery = useQuery({
    queryKey: ['workflow-detail', module.key, 'header', headerId],
    queryFn: ({ signal }) => workflowApi.getHeaderDetail(module.key, headerId, { signal }),
    enabled: canView && headerId > 0,
  });

  const linesQuery = useQuery({
    queryKey: ['workflow-detail', module.key, 'order-lines', headerId],
    queryFn: ({ signal }) => workflowApi.getHeaderLines(module.key, headerId, { signal }),
    enabled: canView && headerId > 0,
  });

  const importLinesQuery = useQuery({
    queryKey: ['workflow-detail', module.key, 'import-lines', headerId],
    queryFn: ({ signal }) => workflowApi.getHeaderImportLines(module.key, headerId, { signal }),
    enabled: canView && headerId > 0,
  });

  const terminalLinesQuery = useQuery({
    queryKey: ['workflow-detail', module.key, 'terminal-lines', headerId],
    queryFn: ({ signal }) => workflowApi.getTerminalLines(module.key, headerId, { signal }),
    enabled: canView && headerId > 0,
  });

  const lineSerialQueries = useQueries({
    queries: (linesQuery.data ?? []).map((line) => ({
      queryKey: ['workflow-detail', module.key, 'line-serials', line.id],
      queryFn: ({ signal }: { signal?: AbortSignal }) => workflowApi.getLineSerials(module.key, line.id, { signal }),
      enabled: canView && linesQuery.isSuccess,
    })),
  });

  const routeQueries = useQueries({
    queries: (importLinesQuery.data ?? [])
      .filter((line) => typeof line.routeId === 'number' && line.routeId > 0)
      .map((line) => ({
        queryKey: ['workflow-detail', module.key, 'route', line.routeId],
        queryFn: ({ signal }: { signal?: AbortSignal }) => workflowApi.getRouteById(module.key, line.routeId!, { signal }),
        enabled: canView && importLinesQuery.isSuccess,
      })),
  });

  const info = useMemo(() => buildInfo(fallbackInfo, headerQuery.data), [fallbackInfo, headerQuery.data]);

  const orderLines = linesQuery.data ?? [];
  const importLines = importLinesQuery.data ?? [];
  const orderLineSerialMap = useMemo(() => {
    const map = new Map<number, WorkflowLineSerialDetail[]>();
    lineSerialQueries.forEach((query, index) => {
      const lineId = orderLines[index]?.id;
      if (!lineId) return;
      map.set(lineId, query.data ?? []);
    });
    return map;
  }, [lineSerialQueries, orderLines]);

  const routeMap = useMemo(() => {
    const map = new Map<number, WorkflowRouteDetail>();
    let routeIndex = 0;
    importLines.forEach((line) => {
      if (!line.routeId) return;
      const query = routeQueries[routeIndex];
      routeIndex += 1;
      if (query?.data) {
        map.set(line.id, query.data);
      }
    });
    return map;
  }, [importLines, routeQueries]);

  const isLoading =
    headerQuery.isLoading ||
    linesQuery.isLoading ||
    importLinesQuery.isLoading ||
    terminalLinesQuery.isLoading ||
    lineSerialQueries.some((query) => query.isLoading) ||
    routeQueries.some((query) => query.isLoading);

  const isError =
    headerQuery.isError ||
    linesQuery.isError ||
    importLinesQuery.isError ||
    terminalLinesQuery.isError ||
    lineSerialQueries.some((query) => query.isError) ||
    routeQueries.some((query) => query.isError);

  const errorMessage =
    (headerQuery.error as Error | null)?.message ||
    (linesQuery.error as Error | null)?.message ||
    (importLinesQuery.error as Error | null)?.message ||
    (terminalLinesQuery.error as Error | null)?.message ||
    (lineSerialQueries.find((query) => query.error)?.error as Error | null)?.message ||
    (routeQueries.find((query) => query.error)?.error as Error | null)?.message ||
    t('paged.errorDescription');

  const terminalLines = terminalLinesQuery.data ?? [];
  const creatorLabel = firstFilled(
    headerQuery.data?.createdByFullUser,
    headerQuery.data?.createdBy?.toString() ? `#${headerQuery.data.createdBy}` : undefined,
  );
  const assignedUsers = useMemo(
    () =>
      terminalLines
        .map((line: WorkflowTerminalLineDetail) =>
          firstFilled(line.createdByFullUser, line.terminalUserId ? `#${line.terminalUserId}` : undefined),
        )
        .filter((value): value is string => !!value),
    [terminalLines],
  );

  const toggleOrderLine = (id: number) => setExpandedOrderLines((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleImportLine = (id: number) => setExpandedImportLines((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={[styles.backText, { color: theme.colors.textSecondary }]}>{t('common.back')}</Text>
      </Pressable>

      <View style={[styles.hero, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.heroEyebrow, { color: theme.colors.accent }]}>{t('workflow.actions.list')}</Text>
        <Text style={styles.title}>{t('workflow.detailTitle', { title: t(module.titleKey) })}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{t('workflow.detailText')}</Text>
      </View>

      {!canView ? (
        <SectionCard>
          <ScreenState
            tone="error"
            title={t('workflow.permissionDeniedTitle')}
            description={t('workflow.permissionDeniedDescription', { title: t(module.titleKey) })}
            compact
          />
        </SectionCard>
      ) : null}

      {supportsPackageMove(module.key) && canUpdate ? (
        <SectionCard title={t('packageMoveMobile.cardTitle')} subtitle={t('packageMoveMobile.cardSubtitle')}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(tabs)/flows/[module]/package-move/[headerId]',
                params: {
                  module: module.key,
                  headerId: String(headerId),
                  target: info.title || `#${headerId}`,
                },
              } as never)
            }
            style={[styles.packageMoveButton, { backgroundColor: theme.colors.primaryStrong }]}
          >
            <PackageIcon size={18} color="#fff" />
            <Text style={styles.packageMoveButtonText}>{t('packageMoveMobile.openAction')}</Text>
          </Pressable>
        </SectionCard>
      ) : null}

      {canView ? <CollectionHeaderInfoCard info={info} /> : null}

      {canView ? (
        <SectionCard
          title={t('workflow.detailPeopleTitle')}
          subtitle={t('workflow.detailPeopleText')}
        >
          <View style={styles.childCard}>
            <DetailMeta label={t('workflow.detailCreatedBy')} value={creatorLabel} />
            <DetailMeta
              label={t('workflow.detailCreatedAt')}
              value={headerQuery.data?.createdDate ? formatLocalizedDateTime(headerQuery.data.createdDate) : undefined}
            />
            <DetailMeta label={t('workflow.detailBranchCode')} value={headerQuery.data?.branchCode} />
          </View>
          <View style={styles.childList}>
            {assignedUsers.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{t('workflow.detailAssignedUsersEmpty')}</Text>
            ) : (
              assignedUsers.map((user, index) => (
                <View key={`${user}-${index}`} style={styles.childCard}>
                  <DetailMeta label={t('workflow.detailAssignedUser')} value={user} />
                </View>
              ))
            )}
          </View>
        </SectionCard>
      ) : null}

      {canView ? (
        isLoading ? (
          <SectionCard>
            <ScreenState tone='loading' title={t('common.loading')} compact />
          </SectionCard>
        ) : isError ? (
          <SectionCard>
            <ScreenState tone='error' title={t('common.error')} description={errorMessage} compact />
          </SectionCard>
        ) : (
          <>
          <SectionCard
            title={t('workflow.detailOrderLinesTitle')}
            subtitle={t('workflow.detailOrderLinesCount', { count: orderLines.length })}
          >
            {orderLines.length === 0 ? (
              <ScreenState tone='empty' title={t('workflow.detailOrderLinesEmpty')} compact />
            ) : (
              orderLines.map((line) => {
                const serials = orderLineSerialMap.get(line.id) ?? [];
                const expanded = !!expandedOrderLines[line.id];
                return (
                  <View key={line.id} style={[styles.rowCard, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
                    <Pressable onPress={() => toggleOrderLine(line.id)} style={styles.rowHeader}>
                      <View style={styles.rowHeaderText}>
                        <Text style={styles.rowTitle}>{getOrderLineTitle(line)}</Text>
                        <Text style={[styles.rowMeta, { color: theme.colors.textSecondary }]}>{t('workflow.detailStockCode', { value: line.stockCode })}</Text>
                        <DetailMeta label={t('workflow.detailQuantity')} value={formatQuantity(line.quantity)} />
                        <DetailMeta label={t('workflow.orderQuantity')} value={formatQuantity(line.siparisMiktar ?? line.quantity)} />
                        <DetailMeta label={t('workflow.detailUnit')} value={line.unit} />
                        <DetailMeta label={t('workflow.detailOrderReference')} value={firstFilled(line.erpOrderNo, line.erpOrderId)} />
                      </View>
                      <Text style={[styles.expandText, { color: theme.colors.primary }]}>{expanded ? t('workflow.detailHide') : t('workflow.detailShow')}</Text>
                    </Pressable>
                    {expanded ? (
                      <View style={styles.childList}>
                        {serials.length === 0 ? (
                          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{t('workflow.detailLineSerialsEmpty')}</Text>
                        ) : (
                          serials.map((serial) => (
                            <View key={serial.id} style={[styles.childCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                              <DetailMeta label={t('workflow.detailQuantity')} value={formatQuantity(serial.quantity)} />
                              <DetailMeta label={t('workflow.detailSerialNo')} value={serial.serialNo} />
                              <DetailMeta label={t('workflow.detailSerialNo2')} value={serial.serialNo2} />
                              <DetailMeta label={t('workflow.detailSerialNo3')} value={serial.serialNo3} />
                              <DetailMeta label={t('workflow.detailSerialNo4')} value={serial.serialNo4} />
                              <DetailMeta label={t('workflow.detailSourceWarehouse')} value={serial.sourceWarehouseName || serial.sourceWarehouseId?.toString()} />
                              <DetailMeta label={t('workflow.detailTargetWarehouse')} value={serial.targetWarehouseName || serial.targetWarehouseId?.toString()} />
                              <DetailMeta label={t('workflow.detailSourceCell')} value={serial.sourceCellCode} />
                              <DetailMeta label={t('workflow.detailTargetCell')} value={serial.targetCellCode} />
                            </View>
                          ))
                        )}
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </SectionCard>

          <SectionCard
            title={t('workflow.detailCollectedLinesTitle')}
            subtitle={t('workflow.detailCollectedLinesCount', { count: importLines.length })}
          >
            {importLines.length === 0 ? (
              <ScreenState tone='empty' title={t('workflow.detailCollectedLinesEmpty')} compact />
            ) : (
              importLines.map((line) => {
                const route = routeMap.get(line.id);
                const expanded = !!expandedImportLines[line.id];
                return (
                  <View key={line.id} style={[styles.rowCard, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
                    <Pressable onPress={() => toggleImportLine(line.id)} style={styles.rowHeader}>
                      <View style={styles.rowHeaderText}>
                        <Text style={styles.rowTitle}>{getImportLineTitle(line)}</Text>
                        <Text style={[styles.rowMeta, { color: theme.colors.textSecondary }]}>{t('workflow.detailStockCode', { value: line.stockCode })}</Text>
                        <DetailMeta label={t('workflow.detailDescription1')} value={line.description1} />
                        <DetailMeta label={t('workflow.detailDescription2')} value={line.description2} />
                        <DetailMeta label={t('workflow.detailConfigCode')} value={line.yapKod} />
                        <DetailMeta label={t('workflow.detailConfigText')} value={line.yapAcik} />
                      </View>
                      <Text style={[styles.expandText, { color: theme.colors.primary }]}>{expanded ? t('workflow.detailHide') : t('workflow.detailShow')}</Text>
                    </Pressable>
                    {expanded ? (
                      <View style={styles.childList}>
                        {!route ? (
                          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{t('workflow.detailRoutesEmpty')}</Text>
                        ) : (
                          <View style={[styles.childCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                            <DetailMeta label={t('workflow.detailQuantity')} value={formatQuantity(route.quantity)} />
                            <DetailMeta label={t('workflow.detailBarcode')} value={route.scannedBarcode} />
                            <DetailMeta label={t('workflow.detailSerialNo')} value={route.serialNo} />
                            <DetailMeta label={t('workflow.detailSerialNo2')} value={route.serialNo2} />
                            <DetailMeta label={t('workflow.detailSerialNo3')} value={route.serialNo3} />
                            <DetailMeta label={t('workflow.detailSerialNo4')} value={route.serialNo4} />
                            <DetailMeta label={t('workflow.detailSourceCell')} value={route.sourceCellCode} />
                            <DetailMeta label={t('workflow.detailTargetCell')} value={route.targetCellCode} />
                            <DetailMeta label={t('workflow.detailSourceWarehouse')} value={route.sourceWarehouseName || route.sourceWarehouse?.toString()} />
                            <DetailMeta label={t('workflow.detailTargetWarehouse')} value={route.targetWarehouseName || route.targetWarehouse?.toString()} />
                          </View>
                        )}
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </SectionCard>
          </>
        )
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, paddingBottom: LAYOUT.screenBottomPadding, gap: SPACING.md },
  backButton: { alignSelf: 'flex-start' },
  backText: { color: COLORS.textSecondary, fontWeight: '800' },
  hero: {
    gap: SPACING.xs,
    padding: SPACING.lg,
    borderRadius: RADII.xxl,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroEyebrow: { color: COLORS.accent, fontWeight: '900', fontSize: 12, textTransform: 'uppercase' },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { color: COLORS.textSecondary, lineHeight: 21 },
  packageMoveButton: {
    borderRadius: RADII.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  packageMoveButtonText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  centered: { minHeight: 140, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center' },
  rowCard: {
    gap: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowHeader: { flexDirection: 'row', gap: SPACING.sm, justifyContent: 'space-between' },
  rowHeaderText: { flex: 1, gap: SPACING.xs - 2 },
  rowTitle: { fontWeight: '800', fontSize: 15 },
  rowMeta: { color: COLORS.textSecondary, fontSize: 13 },
  expandText: { color: COLORS.primary, fontWeight: '800', alignSelf: 'flex-start' },
  childList: { gap: SPACING.xs, marginTop: SPACING.xxs },
  childCard: {
    gap: SPACING.xs - 2,
    padding: SPACING.sm,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
