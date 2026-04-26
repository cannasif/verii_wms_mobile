import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ScreenState } from '@/components/ui/ScreenState';
import { SectionCard } from '@/components/ui/SectionCard';
import { Text } from '@/components/ui/Text';
import { RADII, SPACING } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { getStockDetail } from '../api/barcode-stock-api';
import { warehouseBalanceApi } from '@/features/warehouse-balance/api';
import { LabelPrintSheet } from '@/features/label-printing/components/LabelPrintSheet';
import { LabelPrintTriggerIcon } from '@/components/icons/LabelPrintTriggerIcon';

function parseStockId(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ScannedStockDetailScreen(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const params = useLocalSearchParams<{ stockId?: string | string[]; stockCode?: string | string[] }>();
  const stockId = parseStockId(params.stockId);
  const [labelSheetOpen, setLabelSheetOpen] = useState(false);
  const [labelSheetKey, setLabelSheetKey] = useState(0);

  const detailQuery = useQuery({
    queryKey: ['home', 'scanned-stock-detail', stockId],
    enabled: Boolean(stockId),
    queryFn: ({ signal }) => getStockDetail(stockId as number, { signal }),
  });

  const balanceQuery = useQuery({
    queryKey: ['home', 'scanned-stock-balance', stockId],
    enabled: Boolean(stockId),
    queryFn: ({ signal }) =>
      warehouseBalanceApi.getStockBalances(
        {
          pageNumber: 1,
          pageSize: 1,
          sortBy: 'Id',
          sortDirection: 'desc',
          filters: [{ column: 'StockId', operator: 'Equals', value: String(stockId) }],
        },
        { signal },
      ),
  });

  const stockBalance = useMemo(() => balanceQuery.data?.data?.[0], [balanceQuery.data]);
  const detail = detailQuery.data;
  const isLoading = detailQuery.isLoading || balanceQuery.isLoading;
  const isError = detailQuery.isError;

  if (!stockId) {
    return (
      <PageShell>
        <ScreenState tone='error' title={t('welcome.stockDetailTitle')} description={t('welcome.stockInvalidId')} />
      </PageShell>
    );
  }

  return (
    <PageShell scroll>
      <ScreenHeader
        title={t('welcome.stockDetailTitle')}
        subtitle={detail?.erpStockCode ?? String(params.stockCode ?? '')}
        rightSlot={
          detail && !isLoading && !isError ? (
            <Pressable
              onPress={() => {
                setLabelSheetKey((k) => k + 1);
                setLabelSheetOpen(true);
              }}
              accessibilityRole='button'
              accessibilityLabel={t('welcome.printLabels')}
              style={({ pressed }) => [
                styles.headerIconBtn,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.03)' : 'rgba(255,255,255,0.05)',
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <LabelPrintTriggerIcon size={20} color={theme.colors.primary} />
            </Pressable>
          ) : null
        }
      />

      {labelSheetOpen && detail ? (
        <LabelPrintSheet
          key={labelSheetKey}
          visible
          stockId={stockId}
          stockCode={detail.erpStockCode}
          stockName={detail.stockName}
          onClose={() => setLabelSheetOpen(false)}
        />
      ) : null}

      {isLoading ? (
        <ScreenState tone='loading' title={t('common.loading')} compact />
      ) : isError || !detail ? (
        <ScreenState tone='error' title={t('common.error')} description={t('welcome.stockDetailLoadFailed')} compact />
      ) : (
        <>
          <SectionCard style={styles.card}>
            <Text style={styles.title}>{detail.stockName || '-'}</Text>
            <Text style={[styles.code, { color: theme.colors.textSecondary }]}>{detail.erpStockCode || '-'}</Text>
          </SectionCard>

          <View style={styles.statsRow}>
            <SectionCard style={styles.smallCard}>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{t('welcome.stockAvailable')}</Text>
              <Text style={styles.statValue}>{stockBalance ? String(stockBalance.availableQuantity) : '-'}</Text>
            </SectionCard>
            <SectionCard style={styles.smallCard}>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{t('welcome.stockWarehouse')}</Text>
              <Text style={styles.statValue}>{stockBalance?.warehouseName || stockBalance?.warehouseCode || '-'}</Text>
            </SectionCard>
          </View>

          <SectionCard style={styles.card}>
            <Text style={styles.sectionTitle}>{t('welcome.stockDescription')}</Text>
            <Text style={[styles.bodyText, { color: theme.colors.textSecondary }]}>
              {detail.htmlDescription?.replace(/<[^>]*>/g, ' ').trim() || t('welcome.stockDescriptionEmpty')}
            </Text>
          </SectionCard>
        </>
      )}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  card: {
    marginBottom: SPACING.sm,
    borderRadius: RADII.xl,
    gap: SPACING.xs,
  },
  title: { fontSize: 20, fontWeight: '900' },
  code: { fontSize: 13, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  smallCard: { flex: 1, borderRadius: RADII.xl, gap: 6 },
  statLabel: { fontSize: 11, fontWeight: '700' },
  statValue: { fontSize: 20, fontWeight: '900' },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  bodyText: { lineHeight: 20 },
});
