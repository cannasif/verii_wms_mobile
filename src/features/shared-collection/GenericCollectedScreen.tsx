import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type { CollectionApi } from './types';

interface GenericCollectedScreenProps {
  headerId: number;
  titleKey: string;
  subtitleKey: string;
  noCollectedKey: string;
  barcodeValueKey: string;
  collectedStockCodeKey: string;
  collectedSerialNoKey: string;
  api: CollectionApi;
  queryKeyPrefix: string;
}

export function GenericCollectedScreen({
  headerId,
  titleKey,
  subtitleKey,
  noCollectedKey,
  barcodeValueKey,
  collectedStockCodeKey,
  collectedSerialNoKey,
  api,
  queryKeyPrefix,
}: GenericCollectedScreenProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const collectedQuery = useQuery({
    queryKey: [queryKeyPrefix, 'collected', headerId],
    queryFn: ({ signal }) => api.getCollectedBarcodes(headerId, { signal }),
    enabled: headerId > 0,
  });

  const rows = useMemo(() => {
    return (collectedQuery.data ?? []).flatMap((item) =>
      item.routes.map((route, index) => ({
        key: `${item.importLine.lineId}-${route.id}-${route.scannedBarcode || 'barcode'}-${index}`,
        barcode: route.scannedBarcode || '-',
        stockCode: route.stockCode || '-',
        stockName: route.stockName || '-',
        yapKod: route.yapKod || '-',
        yapAcik: route.yapAcik || '-',
        quantity: route.quantity,
        serialNo: route.serialNo || '-',
      })),
    );
  }, [collectedQuery.data]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={[styles.backText, { color: theme.colors.textSecondary }]}>{t('common.back')}</Text>
      </Pressable>

      <View style={[styles.hero, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={styles.title}>{t(titleKey)}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{t(subtitleKey, { id: headerId })}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border }]}>
        {collectedQuery.isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.centered}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{t(noCollectedKey)}</Text>
          </View>
        ) : (
          rows.map((row) => (
            <View key={row.key} style={[styles.rowCard, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
              <Text style={styles.rowTitle}>{row.stockName}</Text>
              <Text style={[styles.rowMeta, { color: theme.colors.textSecondary }]}>{t(barcodeValueKey, { value: row.barcode })}</Text>
              <Text style={[styles.rowMeta, { color: theme.colors.textSecondary }]}>{t(collectedStockCodeKey, { value: row.stockCode })}</Text>
              {row.yapKod !== '-' ? (
                <Text style={[styles.rowMeta, { color: theme.colors.textSecondary }]}>
                  {t('workflow.yapKodLabel', { value: `${row.yapKod}${row.yapAcik !== '-' ? ` - ${row.yapAcik}` : ''}` })}
                </Text>
              ) : null}
              <Text style={[styles.rowMeta, { color: theme.colors.textSecondary }]}>{row.quantity}</Text>
              <Text style={[styles.rowMeta, { color: theme.colors.textSecondary }]}>{t(collectedSerialNoKey, { value: row.serialNo })}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 132, gap: 16 },
  backButton: { alignSelf: 'flex-start' },
  backText: { color: COLORS.textSecondary, fontWeight: '800' },
  hero: {
    gap: 8,
    padding: 20,
    borderRadius: 28,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { color: COLORS.textSecondary, lineHeight: 21 },
  card: {
    gap: 12,
    padding: 18,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  centered: { minHeight: 140, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center' },
  rowCard: {
    gap: 6,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowTitle: { fontWeight: '800', fontSize: 15 },
  rowMeta: { color: COLORS.textSecondary, fontSize: 13 },
});
