import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppDialog } from '@/components/ui/AppDialog';
import { Button } from '@/components/ui/Button';
import { ScreenState } from '@/components/ui/ScreenState';
import { Text } from '@/components/ui/Text';
import { COLORS, LAYOUT, RADII, SPACING } from '@/constants/theme';
import { normalizeError } from '@/lib/errors';
import { showError, showMessage, showWarning } from '@/lib/feedback';
import { useTheme } from '@/providers/ThemeProvider';
import { CollectionHeaderInfoCard } from './CollectionHeaderInfoCard';
import type { CollectionApi, CollectionHeaderInfo, CollectionLine, CollectionStockBarcode } from './types';
import type { BarcodeMatchCandidate } from '@/services/barcode-types';
import { BarcodeCandidatePicker } from '@/features/shared-collection/components/BarcodeCandidatePicker';
import { extractBarcodeFeedback } from '@/features/shared-collection/barcode-feedback';

function parseDecimalInput(value: string): number {
  const normalized = value.replace(',', '.').trim();
  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

interface GenericCollectionScreenProps {
  headerId: number;
  modulePath: string;
  titleKey: string;
  subtitleKey: string;
  barcodeTitleKey: string;
  barcodePlaceholderKey: string;
  barcodeValueKey: string;
  quantityPlaceholderKey: string;
  collectButtonKey: string;
  collectSuccessTitleKey: string;
  collectSuccessTextKey: string;
  enterBarcodeKey: string;
  selectStockKey: string;
  invalidQuantityKey: string;
  stockNotInOrderKey: string;
  linesTitleKey: string;
  lineTotalKey: string;
  lineCollectedKey: string;
  lineRemainingKey: string;
  completeButtonKey: string;
  completeSuccessTitleKey: string;
  completeSuccessTextKey: string;
  api: CollectionApi;
  heroEyebrow: string;
  viewCollectedKey?: string;
  headerInfo?: CollectionHeaderInfo | null;
}

export function GenericCollectionScreen({
  headerId,
  modulePath,
  titleKey,
  subtitleKey,
  barcodeTitleKey,
  barcodePlaceholderKey,
  barcodeValueKey,
  quantityPlaceholderKey,
  collectButtonKey,
  collectSuccessTitleKey,
  collectSuccessTextKey,
  enterBarcodeKey,
  selectStockKey,
  invalidQuantityKey,
  stockNotInOrderKey,
  linesTitleKey,
  lineTotalKey,
  lineCollectedKey,
  lineRemainingKey,
  completeButtonKey,
  completeSuccessTitleKey,
  completeSuccessTextKey,
  api,
  heroEyebrow,
  viewCollectedKey,
  headerInfo,
}: GenericCollectionScreenProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchedBarcode, setSearchedBarcode] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedBarcodeOverride, setSelectedBarcodeOverride] = useState<CollectionStockBarcode | null>(null);
  const [ambiguousCandidates, setAmbiguousCandidates] = useState<BarcodeMatchCandidate[]>([]);
  const [barcodeErrorMessage, setBarcodeErrorMessage] = useState<string | null>(null);

  const orderLinesQuery = useQuery({
    queryKey: [modulePath, 'collection', 'lines', headerId],
    queryFn: ({ signal }) => api.getAssignedOrderLines(headerId, { signal }),
    enabled: headerId > 0,
  });

  const collectedQuery = useQuery({
    queryKey: [modulePath, 'collection', 'collected', headerId],
    queryFn: ({ signal }) => api.getCollectedBarcodes(headerId, { signal }),
    enabled: headerId > 0,
  });

  const barcodeQuery = useQuery({
    queryKey: [modulePath, 'collection', 'barcode', searchedBarcode],
    queryFn: ({ signal }) => api.getStokBarcode(searchedBarcode, { signal }),
    enabled: searchedBarcode.trim().length > 0,
  });


  const barcodeDefinitionQuery = useQuery({
    queryKey: [modulePath, 'collection', 'barcode-definition'],
    queryFn: ({ signal }) => api.getBarcodeDefinition ? api.getBarcodeDefinition({ signal }) : Promise.resolve(null),
    enabled: Boolean(api.getBarcodeDefinition),
  });

  const addBarcodeMutation = useMutation({
    mutationFn: (payload: { stock: CollectionStockBarcode; quantity: number }) =>
      api.addBarcodeToOrder({
        headerId,
        barcode: payload.stock.barkod,
        stockCode: payload.stock.stokKodu,
        stockName: payload.stock.stokAdi,
        yapKod: payload.stock.yapKod ?? undefined,
        yapAcik: payload.stock.yapAcik ?? undefined,
        quantity: payload.quantity,
        serialNo: '',
        serialNo2: '',
        serialNo3: '',
        serialNo4: '',
        sourceCellCode: '',
        targetCellCode: '',
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [modulePath, 'collection', 'collected', headerId] }),
        queryClient.invalidateQueries({ queryKey: [modulePath, 'collection', 'lines', headerId] }),
      ]);
      setBarcodeInput('');
      setSearchedBarcode('');
      setQuantity('1');
      showMessage(t(collectSuccessTitleKey), t(collectSuccessTextKey));
    },
    onError: (error: Error) => {
      const normalized = normalizeError(error, t('common.error'));
      const feedback = extractBarcodeFeedback(normalized);
      showError(error, feedback.message);
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => api.complete(headerId),
    onSuccess: () => {
      setShowCompleteDialog(true);
    },
    onError: (error: Error) => {
      const normalized = normalizeError(error, t('common.error'));
      const feedback = extractBarcodeFeedback(normalized);
      showError(error, feedback.message);
    },
  });

  const selectedBarcode = selectedBarcodeOverride ?? barcodeQuery.data?.[0] ?? null;

  useEffect(() => {
    if (!barcodeQuery.isError) {
      return;
    }

    const normalized = normalizeError(barcodeQuery.error, t('common.error'));
    const feedback = extractBarcodeFeedback(normalized);

    setBarcodeErrorMessage(feedback.message);
    if (feedback.candidates.length > 0) {
      setAmbiguousCandidates(feedback.candidates);
      return;
    }

    showError(barcodeQuery.error, feedback.message);
  }, [barcodeQuery.error, barcodeQuery.isError, showError, t]);

  const orderLinesWithCollected = useMemo(() => {
    const lines = orderLinesQuery.data?.lines ?? [];
    const collected = collectedQuery.data ?? [];
    const collectedMap = new Map<number, number>();

    for (const item of collected) {
      const lineId = item.importLine.lineId;
      const totalCollected = item.routes.reduce((sum, route) => sum + route.quantity, 0);
      collectedMap.set(lineId, (collectedMap.get(lineId) ?? 0) + totalCollected);
    }

    return lines.map((line) => {
      const collectedQuantity = collectedMap.get(line.id) ?? 0;
      return {
        ...line,
        collectedQuantity,
        remainingQuantity: line.quantity - collectedQuantity,
      };
    });
  }, [collectedQuery.data, orderLinesQuery.data?.lines]);

  const handleSearch = (): void => {
    if (!barcodeInput.trim()) {
      showWarning(t(enterBarcodeKey));
      return;
    }
    setSearchedBarcode(barcodeInput.trim());
    setSelectedBarcodeOverride(null);
    setAmbiguousCandidates([]);
    setBarcodeErrorMessage(null);
  };

  const handleCollect = (): void => {
    if (!selectedBarcode) {
      showWarning(t(selectStockKey));
      return;
    }

    const collectQuantity = parseDecimalInput(quantity);
    if (!collectQuantity || collectQuantity <= 0) {
      showWarning(t(invalidQuantityKey));
      return;
    }

    const stockExistsInOrder = orderLinesWithCollected.some(
      (line) => line.stockCode === selectedBarcode.stokKodu && ((line as { yapKod?: string | null }).yapKod ?? '') === (selectedBarcode.yapKod ?? ''),
    );
    if (!stockExistsInOrder) {
      showWarning(t(stockNotInOrderKey));
      return;
    }

    addBarcodeMutation.mutate({
      stock: selectedBarcode,
      quantity: collectQuantity,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={[styles.backText, { color: theme.colors.textSecondary }]}>{t('common.back')}</Text>
      </Pressable>

      <View style={[styles.hero, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.heroEyebrow, { color: theme.colors.accent }]}>{heroEyebrow}</Text>
        <Text style={styles.title}>{t(titleKey)}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{t(subtitleKey, { id: headerId })}</Text>
      </View>

      <CollectionHeaderInfoCard info={headerInfo} />

      {viewCollectedKey ? (
        <Pressable style={[styles.linkButton, { borderColor: theme.colors.primary }]} onPress={() => router.push(`/(tabs)/flows/${modulePath}/collected/${headerId}` as never)}>
          <Text style={[styles.linkButtonText, { color: theme.colors.primary }]}>{t(viewCollectedKey)}</Text>
        </Pressable>
      ) : null}

      <View style={[styles.card, { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border }]}>
        <Text style={styles.sectionTitle}>{t(barcodeTitleKey)}</Text>
        <TextInput
          value={barcodeInput}
          onChangeText={setBarcodeInput}
          style={[styles.input, { backgroundColor: theme.colors.surfaceStrong, color: theme.colors.text }]}
          placeholder={t(barcodePlaceholderKey)}
          placeholderTextColor={theme.colors.inputPlaceholder}
        />
        {barcodeDefinitionQuery.data?.hintText ? (
          <Text style={[styles.stockMeta, { color: theme.colors.textSecondary }]}>
            {t('common.barcodeFormat', { format: barcodeDefinitionQuery.data.hintText })}
          </Text>
        ) : null}

        <Button title={barcodeQuery.isFetching ? t('common.loading') : t('paged.search')} onPress={handleSearch} loading={barcodeQuery.isFetching} />

        {ambiguousCandidates.length > 0 ? (
          <BarcodeCandidatePicker
            candidates={ambiguousCandidates}
            message={barcodeErrorMessage || t('common.warning')}
            onSelect={(candidate) => {
              setSelectedBarcodeOverride({
                barkod: barcodeInput.trim() || searchedBarcode.trim(),
                stokKodu: candidate.stockCode ?? '',
                stokAdi: candidate.stockName ?? '',
                olcuAdi: '',
                yapKod: candidate.yapKod ?? null,
                yapAcik: candidate.yapAcik ?? null,
              });
              setAmbiguousCandidates([]);
              setBarcodeErrorMessage(null);
            }}
          />
        ) : null}

        {selectedBarcode ? (
          <View style={[styles.stockCard, { borderColor: theme.colors.primary }]}>
            <Text style={[styles.stockCode, { color: theme.colors.primary }]}>{selectedBarcode.stokKodu}</Text>
            <Text style={styles.stockName}>{selectedBarcode.stokAdi}</Text>
            {(selectedBarcode.yapKod || selectedBarcode.yapAcik) ? (
              <Text style={[styles.stockMeta, { color: theme.colors.textSecondary }]}>
                {t('workflow.yapKodLabel', {
                  value: `${selectedBarcode.yapKod || '-'}${selectedBarcode.yapAcik ? ` - ${selectedBarcode.yapAcik}` : ''}`,
                })}
              </Text>
            ) : null}
            <Text style={[styles.stockMeta, { color: theme.colors.textSecondary }]}>{t(barcodeValueKey, { value: selectedBarcode.barkod })}</Text>
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              style={[styles.input, { backgroundColor: theme.colors.surfaceStrong, color: theme.colors.text }]}
              keyboardType='decimal-pad'
              placeholder={t(quantityPlaceholderKey)}
              placeholderTextColor={theme.colors.inputPlaceholder}
            />
            <Button
              title={addBarcodeMutation.isPending ? t('common.loading') : t(collectButtonKey)}
              onPress={handleCollect}
              loading={addBarcodeMutation.isPending}
            />
          </View>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border }]}>
        <Text style={styles.sectionTitle}>{t(linesTitleKey)}</Text>
        {orderLinesQuery.isLoading ? (
          <ScreenState
            tone="loading"
            title={t('paged.loadingTitle')}
            description={t('paged.loadingDescription')}
            compact
          />
        ) : orderLinesQuery.isError ? (
          <ScreenState
            tone="error"
            title={t('paged.errorTitle')}
            description={normalizeError(orderLinesQuery.error, t('paged.errorDescription')).message}
            actionLabel={t('common.retry')}
            onAction={() => void orderLinesQuery.refetch()}
            compact
          />
        ) : orderLinesWithCollected.length === 0 ? (
          <ScreenState
            tone="empty"
            title={t('paged.emptyTitle')}
            description={t('paged.emptyDescription')}
            compact
          />
        ) : (
          orderLinesWithCollected.map((line) => (
            <LineStatusCard
              key={line.id}
              line={line}
              totalKey={lineTotalKey}
              collectedKey={lineCollectedKey}
              remainingKey={lineRemainingKey}
            />
          ))
        )}
      </View>

      <Button
        title={completeMutation.isPending ? t('common.loading') : t(completeButtonKey)}
        onPress={() => completeMutation.mutate()}
        loading={completeMutation.isPending}
      />

      <AppDialog
        visible={showCompleteDialog}
        title={t(completeSuccessTitleKey)}
        description={t(completeSuccessTextKey)}
        onClose={() => setShowCompleteDialog(false)}
        actions={[
          {
            label: t('common.continue'),
            onPress: () => {
              setShowCompleteDialog(false);
              router.replace(`/(tabs)/flows/${modulePath}/assigned` as never);
            },
          },
        ]}
      />
    </ScrollView>
  );
}

function LineStatusCard({
  line,
  totalKey,
  collectedKey,
  remainingKey,
}: {
  line: CollectionLine & { collectedQuantity: number; remainingQuantity: number };
  totalKey: string;
  collectedKey: string;
  remainingKey: string;
}): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const progress = line.quantity > 0 ? Math.min((line.collectedQuantity / line.quantity) * 100, 100) : 0;

  return (
    <View style={[styles.lineCard, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
      <Text style={styles.lineTitle}>{line.stockName}</Text>
      <Text style={[styles.lineMeta, { color: theme.colors.textSecondary }]}>{line.stockCode}</Text>
      {line.yapKod ? (
        <Text style={[styles.lineMeta, { color: theme.colors.textSecondary }]}>
          {t('workflow.yapKodLabel', { value: `${line.yapKod}${line.yapAcik ? ` - ${line.yapAcik}` : ''}` })}
        </Text>
      ) : null}
      <Text style={[styles.lineMeta, { color: theme.colors.textSecondary }]}>{t(totalKey, { value: line.quantity, unit: line.unit })}</Text>
      <Text style={[styles.lineMeta, { color: theme.colors.textSecondary }]}>{t(collectedKey, { value: line.collectedQuantity, unit: line.unit })}</Text>
      <Text style={[styles.lineMeta, { color: theme.colors.textSecondary }]}>{t(remainingKey, { value: line.remainingQuantity, unit: line.unit })}</Text>
      <View style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: LAYOUT.screenPadding, paddingBottom: 132, gap: SPACING.md },
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
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { color: COLORS.textSecondary, lineHeight: 21 },
  linkButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(56,189,248,0.12)',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  linkButtonText: { color: COLORS.primary, fontWeight: '800' },
  card: {
    gap: SPACING.sm,
    padding: 18,
    borderRadius: RADII.xl,
    backgroundColor: COLORS.surfaceStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: { fontWeight: '900', fontSize: 16 },
  input: {
    minHeight: LAYOUT.inputHeight,
    borderRadius: RADII.md,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surfaceStrong,
    borderWidth: 1,
    borderColor: 'rgba(128, 176, 255, 0.24)',
    color: COLORS.text,
  },
  stockCard: {
    gap: 8,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(56,189,248,0.08)',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  stockCode: { fontWeight: '900', fontSize: 13, color: COLORS.primary },
  stockName: { fontWeight: '900', fontSize: 18 },
  stockMeta: { color: COLORS.textSecondary },
  centered: { minHeight: 120, alignItems: 'center', justifyContent: 'center' },
  lineCard: {
    gap: 8,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lineTitle: { fontWeight: '800', fontSize: 15 },
  lineMeta: { color: COLORS.textSecondary, fontSize: 13 },
  progressTrack: {
    marginTop: 4,
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.success,
  },
});
