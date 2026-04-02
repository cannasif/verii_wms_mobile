import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { ScreenState } from '@/components/ui/ScreenState';
import { useTheme } from '@/providers/ThemeProvider';
import type { Product, SelectedStockItem } from '../types';
import { LineEditorCard } from './LineEditorCard';
import { styles } from './styles';

interface Step2StockSelectionProps {
  stockTab: 'stocks' | 'selected';
  setStockTab: (tab: 'stocks' | 'selected') => void;
  searchStocks: string;
  setSearchStocks: (value: string) => void;
  searchSelectedStocks: string;
  setSearchSelectedStocks: (value: string) => void;
  productsLoading: boolean;
  filteredProducts: Product[];
  selectedItems: SelectedStockItem[];
  filteredSelectedStocks: SelectedStockItem[];
  selectedCountByStockCode: Map<string, number>;
  onToggleItem: (item: Product) => void;
  onAddItems: (item: Product, count: number) => void;
  onRemoveItems: (stockCode: string, count: number) => void;
  onUpdateItem: (itemId: string, updates: Partial<SelectedStockItem>) => void;
  onRemoveItem: (itemId: string) => void;
  onPickWarehouse: (itemId: string) => void;
  getWarehouseLabel: (warehouseId?: number) => string;
  getOrderedQuantity: (stockCode: string) => number;
}

export function Step2StockSelection(props: Step2StockSelectionProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [batchCounts, setBatchCounts] = useState<Record<string, string>>({});

  const getBatchCount = (stockCode: string): string => batchCounts[stockCode] ?? '1';
  const setBatchCount = (stockCode: string, value: string): void => {
    setBatchCounts((prev) => ({ ...prev, [stockCode]: value.replace(/[^0-9]/g, '') || '' }));
  };
  const parseBatchCount = (stockCode: string): number => {
    const parsed = Number(getBatchCount(stockCode));
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border }]}>
      <View style={styles.segmentRow}>
        <Pressable
          style={[styles.segmentButton, props.stockTab === 'stocks' ? styles.segmentButtonActive : null]}
          onPress={() => props.setStockTab('stocks')}
        >
          <Text style={styles.segmentText}>{t('goodsReceiptMobile.stocksTab')}</Text>
        </Pressable>
        <Pressable
          style={[styles.segmentButton, props.stockTab === 'selected' ? styles.segmentButtonActive : null]}
          onPress={() => props.setStockTab('selected')}
        >
          <Text style={styles.segmentText}>{t('goodsReceiptMobile.selectedTab')}</Text>
        </Pressable>
      </View>

      {props.stockTab === 'stocks' ? (
        <>
          <TextInput
            value={props.searchStocks}
            onChangeText={props.setSearchStocks}
            style={[styles.input, { backgroundColor: theme.colors.surfaceStrong, color: theme.colors.text }]}
            placeholder={t('goodsReceiptMobile.searchStocks')}
            placeholderTextColor={theme.colors.inputPlaceholder}
          />
          {props.productsLoading ? (
            <ScreenState tone='loading' title={t('common.loading')} compact />
          ) : props.filteredProducts.length === 0 ? (
            <ScreenState
              tone='empty'
              title={t('goodsReceiptMobile.emptySelectedTitle')}
              description={t('goodsReceiptMobile.searchStocks')}
              compact
            />
          ) : (
            props.filteredProducts.map((product) => {
              const selectedCount = props.selectedCountByStockCode.get(product.stokKodu) || 0;
              const orderedQuantity = props.getOrderedQuantity(product.stokKodu);

              return (
                <View
                  key={product.stokKodu}
                  style={[
                    styles.selectableCard,
                    { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border },
                    selectedCount > 0 ? [styles.selectableCardActive, { borderColor: theme.colors.primary }] : null,
                  ]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectableTitle}>{product.stokAdi}</Text>
                      <Text style={[styles.selectableMeta, { color: theme.colors.textSecondary }]}>{product.stokKodu}</Text>
                      <Text style={[styles.selectableMeta, { color: theme.colors.textSecondary }]}>{product.olcuBr1}</Text>
                    </View>
                    {selectedCount > 0 ? (
                      <View style={styles.selectedPill}>
                        <Text style={[styles.selectedPillText, { color: theme.colors.background }]}>{String(selectedCount)}</Text>
                      </View>
                    ) : null}
                  </View>
                  {orderedQuantity > 0 ? (
                    <Text style={[styles.selectableMeta, { color: theme.colors.textSecondary }]}>
                      {t('goodsReceiptMobile.remainingForImport', { value: orderedQuantity })}
                    </Text>
                  ) : null}
                  <View style={styles.stockAdjustRow}>
                    <Pressable
                      style={[styles.countActionButton, { backgroundColor: theme.colors.card }, selectedCount === 0 ? styles.countActionButtonDisabled : null]}
                      onPress={() => props.onRemoveItems(product.stokKodu, parseBatchCount(product.stokKodu))}
                      disabled={selectedCount === 0}
                    >
                      <Text style={[styles.countActionText, { color: theme.colors.text }]}>-</Text>
                    </Pressable>
                    <TextInput
                      value={getBatchCount(product.stokKodu)}
                      onChangeText={(value) => setBatchCount(product.stokKodu, value)}
                      style={[styles.countInput, { backgroundColor: theme.colors.surfaceStrong, color: theme.colors.text }]}
                      keyboardType='number-pad'
                      placeholder='1'
                      placeholderTextColor={theme.colors.inputPlaceholder}
                    />
                    <Pressable
                      style={[styles.countActionButton, { backgroundColor: theme.colors.card }]}
                      onPress={() => props.onAddItems(product, parseBatchCount(product.stokKodu))}
                    >
                      <Text style={[styles.countActionText, { color: theme.colors.text }]}>+</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </>
      ) : (
        <>
          <TextInput
            value={props.searchSelectedStocks}
            onChangeText={props.setSearchSelectedStocks}
            style={[styles.input, { backgroundColor: theme.colors.surfaceStrong, color: theme.colors.text }]}
            placeholder={t('goodsReceiptMobile.searchSelected')}
            placeholderTextColor={theme.colors.inputPlaceholder}
          />
          {props.filteredSelectedStocks.length === 0 ? (
            <EmptyState title={t('goodsReceiptMobile.emptySelectedTitle')} text={t('goodsReceiptMobile.emptySelectedText')} />
          ) : (
            props.filteredSelectedStocks.map((item) => (
              <LineEditorCard
                key={item.id}
                mode='stock'
                title={item.stockName}
                code={item.stockCode}
                unit={item.unit}
                baseQuantity={props.getOrderedQuantity(item.stockCode)}
                selectedItem={item}
                onToggle={() => undefined}
                onChange={(updates) => props.onUpdateItem(item.id, updates)}
                onRemove={() => props.onRemoveItem(item.id)}
                onPickWarehouse={() => props.onPickWarehouse(item.id)}
                selectedWarehouseLabel={props.getWarehouseLabel(item.warehouseId)}
              />
            ))
          )}
        </>
      )}
    </View>
  );
}

function EmptyState({ title, text }: { title: string; text: string }): React.ReactElement {
  return <ScreenState tone='empty' title={title} description={text} compact />;
}
