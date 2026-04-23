import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { ScreenState } from '@/components/ui/ScreenState';
import { useTheme } from '@/providers/ThemeProvider';
import type { SelectedStockItem } from '../types';
import { LineEditorCard } from './LineEditorCard';
import { styles } from './styles';

interface Step2StockSelectionProps {
  stockTab: 'stocks' | 'selected';
  setStockTab: (tab: 'stocks' | 'selected') => void;
  searchStocks: string;
  setSearchStocks: (value: string) => void;
  searchSelectedStocks: string;
  setSearchSelectedStocks: (value: string) => void;
  selectedItems: SelectedStockItem[];
  filteredSelectedStocks: SelectedStockItem[];
  onOpenStockPicker: () => void;
  onUpdateItem: (itemId: string, updates: Partial<SelectedStockItem>) => void;
  onRemoveItem: (itemId: string) => void;
  onPickWarehouse: (itemId: string) => void;
  onPickYapKod: (itemId: string) => void;
  getWarehouseLabel: (warehouseId?: number) => string;
  getOrderedQuantity: (stockCode: string) => number;
}

export function Step2StockSelection(props: Step2StockSelectionProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();

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
          <Button title={t('goodsReceiptMobile.pickStock')} onPress={props.onOpenStockPicker} />
          <Text style={[styles.selectableMeta, { color: theme.colors.textSecondary }]}>{t('goodsReceiptMobile.searchPagedHint')}</Text>
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
                onPickYapKod={() => props.onPickYapKod(item.id)}
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
