import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/theme';
import { normalizeError } from '@/lib/errors';
import { showError, showMessage, showWarning } from '@/lib/feedback';
import { useTheme } from '@/providers/ThemeProvider';
import { goodsReceiptCollectionApi } from './api';
import { CollectionHeaderInfoCard } from '@/features/shared-collection/CollectionHeaderInfoCard';
import type { AssignedGrLine, StokBarcodeDto } from './types';
import type { BarcodeMatchCandidate } from '@/services/barcode-types';
import { BarcodeCandidatePicker } from '@/features/shared-collection/components/BarcodeCandidatePicker';
import { extractBarcodeFeedback } from '@/features/shared-collection/barcode-feedback';
import type { CollectionHeaderInfo } from '@/features/shared-collection/types';

function parseDecimalInput(value: string): number {
  const normalized = value.replace(',', '.').trim();
  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function GoodsReceiptCollectionScreen({
  headerId,
  headerInfo,
}: {
  headerId: number;
  headerInfo?: CollectionHeaderInfo | null;
}): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchedBarcode, setSearchedBarcode] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [selectedStock, setSelectedStock] = useState<StokBarcodeDto | null>(null);
  const [ambiguousCandidates, setAmbiguousCandidates] = useState<BarcodeMatchCandidate[]>([]);
  const [barcodeErrorMessage, setBarcodeErrorMessage] = useState<string | null>(null);

  const orderLinesQuery = useQuery({
    queryKey: ['goods-receipt-collection', 'lines', headerId],
    queryFn: () => goodsReceiptCollectionApi.getAssignedOrderLines(headerId),
    enabled: headerId > 0,
  });

  const collectedQuery = useQuery({
    queryKey: ['goods-receipt-collection', 'collected', headerId],
    queryFn: () => goodsReceiptCollectionApi.getCollectedBarcodes(headerId),
    enabled: headerId > 0,
  });

  const barcodeQuery = useQuery({
    queryKey: ['goods-receipt-collection', 'barcode', searchedBarcode],
    queryFn: () => goodsReceiptCollectionApi.getStokBarcode(searchedBarcode),
    enabled: searchedBarcode.trim().length > 0,
  });

  const barcodeDefinitionQuery = useQuery({
    queryKey: ['goods-receipt-collection', 'barcode-definition'],
    queryFn: () => goodsReceiptCollectionApi.getBarcodeDefinition?.(),
    enabled: Boolean(goodsReceiptCollectionApi.getBarcodeDefinition),
  });

  const addBarcodeMutation = useMutation({
    mutationFn: (payload: {
      stock: StokBarcodeDto;
      quantity: number;
    }) =>
      goodsReceiptCollectionApi.addBarcodeToOrder({
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
        queryClient.invalidateQueries({ queryKey: ['goods-receipt-collection', 'collected', headerId] }),
        queryClient.invalidateQueries({ queryKey: ['goods-receipt-collection', 'lines', headerId] }),
      ]);
      setBarcodeInput('');
      setSearchedBarcode('');
      setSelectedStock(null);
      setQuantity('1');
      showMessage(t('goodsReceiptCollection.collectSuccessTitle'), t('goodsReceiptCollection.collectSuccessText'));
    },
    onError: (error: Error) => {
      const normalized = normalizeError(error, t('common.error'));
      const feedback = extractBarcodeFeedback(normalized);
      showError(error, feedback.message);
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => goodsReceiptCollectionApi.completeGoodsReceipt(headerId),
    onSuccess: () => {
      showMessage(t('goodsReceiptCollection.completeSuccessTitle'), t('goodsReceiptCollection.completeSuccessText'), [
        {
          text: t('common.continue'),
          onPress: () => router.replace('/(tabs)/flows/goods-receipt/assigned'),
        },
      ]);
    },
    onError: (error: Error) => {
      const normalized = normalizeError(error, t('common.error'));
      const feedback = extractBarcodeFeedback(normalized);
      showError(error, feedback.message);
    },
  });

  const selectedBarcode = useMemo(() => {
    return selectedStock ?? barcodeQuery.data?.[0] ?? null;
  }, [barcodeQuery.data, selectedStock]);

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
  }, [barcodeQuery.error, barcodeQuery.isError, t]);

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

  const totalCollectedCount = useMemo(() => {
    return (collectedQuery.data ?? []).reduce((sum, item) => sum + item.routes.length, 0);
  }, [collectedQuery.data]);

  const handleSearch = (): void => {
    if (!barcodeInput.trim()) {
      showWarning(t('goodsReceiptCollection.enterBarcode'));
      return;
    }
    setSearchedBarcode(barcodeInput.trim());
    setSelectedStock(null);
    setAmbiguousCandidates([]);
    setBarcodeErrorMessage(null);
  };

  const handleCollect = (): void => {
    const stock = selectedStock || selectedBarcode;
    const collectQuantity = parseDecimalInput(quantity);

    if (!stock) {
      showWarning(t('goodsReceiptCollection.selectStock'));
      return;
    }

    if (!collectQuantity || collectQuantity <= 0) {
      showWarning(t('goodsReceiptCollection.invalidQuantity'));
      return;
    }

    const stockExistsInOrder = orderLinesWithCollected.some(
      (line) => line.stockCode === stock.stokKodu && ((line.yapKod ?? '') === (stock.yapKod ?? '')),
    );
    if (!stockExistsInOrder) {
      showWarning(t('goodsReceiptCollection.stockNotInOrder'));
      return;
    }

    setSelectedStock(stock);
    addBarcodeMutation.mutate({
      stock,
      quantity: collectQuantity,
    });
  };

  const isBusy = orderLinesQuery.isLoading || collectedQuery.isLoading;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={[styles.backText, { color: theme.colors.textSecondary }]}>{t('common.back')}</Text>
      </Pressable>

      <View style={[styles.hero, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.heroEyebrow, { color: theme.colors.accent }]}>{t('workflow.goodsReceipt.title')}</Text>
        <Text style={styles.title}>{t('goodsReceiptCollection.title')}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{t('goodsReceiptCollection.subtitle', { id: headerId })}</Text>
      </View>

      <CollectionHeaderInfoCard info={headerInfo} />

      <Pressable style={[styles.linkButton, { borderColor: theme.colors.primary }]} onPress={() => router.push(`/(tabs)/flows/goods-receipt/collected/${headerId}` as never)}>
        <Text style={[styles.linkButtonText, { color: theme.colors.primary }]}>{t('goodsReceiptCollection.viewCollected')}</Text>
      </Pressable>

      <View style={[styles.card, { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border }]}>
        <View style={styles.inlineHeader}>
          <Text style={styles.sectionTitle}>{t('goodsReceiptCollection.barcodeTitle')}</Text>
          <Text style={styles.sectionMeta}>{t('goodsReceiptCollection.collectedCount', { count: totalCollectedCount })}</Text>
        </View>

        <TextInput
          value={barcodeInput}
          onChangeText={setBarcodeInput}
          style={[styles.input, { backgroundColor: theme.colors.surfaceStrong, color: theme.colors.text }]}
          placeholder={t('goodsReceiptCollection.barcodePlaceholder')}
          placeholderTextColor={theme.colors.inputPlaceholder}
          autoCapitalize='characters'
        />

        {ambiguousCandidates.length > 0 ? (
          <BarcodeCandidatePicker
            candidates={ambiguousCandidates}
            message={barcodeErrorMessage || t('common.warning')}
            onSelect={(candidate) => {
              setSelectedStock({
                barkod: barcodeInput.trim() || searchedBarcode.trim(),
                stokKodu: candidate.stockCode ?? '',
                stokAdi: candidate.stockName ?? '',
                depoKodu: null,
                depoAdi: null,
                rafKodu: null,
                yapilandir: '',
                olcuBr: 0,
                olcuAdi: '',
                yapKod: candidate.yapKod ?? null,
                yapAcik: candidate.yapAcik ?? null,
                cevrim: 0,
                seriBarkodMu: Boolean(candidate.serialNumber),
                sktVarmi: null,
                isemriNo: null,
              });
              setAmbiguousCandidates([]);
              setBarcodeErrorMessage(null);
            }}
          />
        ) : null}

        {barcodeDefinitionQuery.data?.hintText ? (
          <Text style={[styles.stockMeta, { color: theme.colors.textSecondary }]}>
            {t('common.barcodeFormat', { format: barcodeDefinitionQuery.data.hintText })}
          </Text>
        ) : null}

        <Button title={barcodeQuery.isFetching ? t('common.loading') : t('paged.search')} onPress={handleSearch} loading={barcodeQuery.isFetching} />

        {selectedBarcode ? (
          <View style={[styles.stockCard, { borderColor: theme.colors.primary }]}>
            <Text style={[styles.stockCode, { color: theme.colors.primary }]}>{selectedBarcode.stokKodu}</Text>
            <Text style={styles.stockName}>{selectedBarcode.stokAdi}</Text>
            <Text style={[styles.stockMeta, { color: theme.colors.textSecondary }]}>{t('goodsReceiptCollection.barcodeValue', { value: selectedBarcode.barkod })}</Text>
            <Text style={[styles.stockMeta, { color: theme.colors.textSecondary }]}>{t('goodsReceiptCollection.unitValue', { value: selectedBarcode.olcuAdi })}</Text>

            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              style={[styles.input, { backgroundColor: theme.colors.surfaceStrong, color: theme.colors.text }]}
              keyboardType='decimal-pad'
              placeholder={t('goodsReceiptCollection.quantityPlaceholder')}
              placeholderTextColor={theme.colors.inputPlaceholder}
            />

            <Button
              title={addBarcodeMutation.isPending ? t('common.loading') : t('goodsReceiptCollection.collectButton')}
              onPress={handleCollect}
              loading={addBarcodeMutation.isPending}
            />
          </View>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border }]}>
        <View style={styles.inlineHeader}>
          <Text style={styles.sectionTitle}>{t('goodsReceiptCollection.linesTitle')}</Text>
          <Text style={styles.sectionMeta}>{t('goodsReceiptCollection.linesCount', { count: orderLinesWithCollected.length })}</Text>
        </View>

        {isBusy ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : orderLinesWithCollected.length === 0 ? (
          <View style={styles.centered}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{t('goodsReceiptCollection.emptyLines')}</Text>
          </View>
        ) : (
          orderLinesWithCollected.map((line) => (
            <LineStatusCard key={line.id} line={line} />
          ))
        )}
      </View>

      <Button
        title={completeMutation.isPending ? t('common.loading') : t('goodsReceiptCollection.completeButton')}
        onPress={() => completeMutation.mutate()}
        loading={completeMutation.isPending}
      />
    </ScrollView>
  );
}

function LineStatusCard({
  line,
}: {
  line: AssignedGrLine & { collectedQuantity: number; remainingQuantity: number };
}): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const progress = line.quantity > 0 ? Math.min((line.collectedQuantity / line.quantity) * 100, 100) : 0;

  return (
    <View style={[styles.lineCard, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
      <View style={styles.inlineHeader}>
        <Text style={styles.lineTitle}>{line.stockName}</Text>
        <Text style={[styles.lineBadge, { color: theme.colors.primary }]}>{line.stockCode}</Text>
      </View>
      <Text style={[styles.lineMeta, { color: theme.colors.textSecondary }]}>{t('goodsReceiptCollection.lineTotal', { value: line.quantity, unit: line.unit })}</Text>
      <Text style={[styles.lineMeta, { color: theme.colors.textSecondary }]}>{t('goodsReceiptCollection.lineCollected', { value: line.collectedQuantity, unit: line.unit })}</Text>
      <Text style={[styles.lineMeta, { color: theme.colors.textSecondary }]}>{t('goodsReceiptCollection.lineRemaining', { value: line.remainingQuantity, unit: line.unit })}</Text>
      <View style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 132,
    gap: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backText: {
    color: COLORS.textSecondary,
    fontWeight: '800',
  },
  hero: {
    gap: 8,
    padding: 20,
    borderRadius: 28,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroEyebrow: {
    color: COLORS.accent,
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: COLORS.textSecondary,
    lineHeight: 21,
  },
  card: {
    gap: 12,
    padding: 18,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  linkButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(56,189,248,0.12)',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  linkButtonText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  inlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    fontWeight: '900',
    fontSize: 16,
  },
  sectionMeta: {
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  input: {
    minHeight: 48,
    borderRadius: 16,
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
  stockCode: {
    fontWeight: '900',
    fontSize: 13,
    color: COLORS.primary,
  },
  stockName: {
    fontWeight: '900',
    fontSize: 18,
  },
  stockMeta: {
    color: COLORS.textSecondary,
  },
  centered: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  lineCard: {
    gap: 8,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lineTitle: {
    flex: 1,
    fontWeight: '800',
    fontSize: 15,
  },
  lineBadge: {
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 12,
  },
  lineMeta: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
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
