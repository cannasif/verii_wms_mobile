import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { ScreenState } from '@/components/ui/ScreenState';
import { formatLocalizedDate } from '@/lib/formatters';
import { useTheme } from '@/providers/ThemeProvider';
import type { Order, OrderItem, SelectedOrderItem } from '../types';
import { LineEditorCard } from './LineEditorCard';
import { styles } from './styles';

interface Step2OrderSelectionProps {
  orderTab: 'orders' | 'items';
  setOrderTab: (tab: 'orders' | 'items') => void;
  searchItems: string;
  setSearchItems: (value: string) => void;
  selectedOrder?: Order | null;
  activeOrderNumber: string | null;
  onOpenOrderPicker: () => void;
  orderItemsLoading: boolean;
  filteredOrderItems: OrderItem[];
  selectedItems: SelectedOrderItem[];
  onToggleItem: (item: OrderItem) => void;
  onUpdateItem: (itemId: string, updates: Partial<SelectedOrderItem>) => void;
  onRemoveItem: (itemId: string) => void;
  onPickWarehouse: (itemId: string) => void;
  onPickYapKod?: (itemId: string) => void;
  getWarehouseLabel: (warehouseId?: number) => string;
}

export function Step2OrderSelection(props: Step2OrderSelectionProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border }]}>
      <View style={styles.segmentRow}>
        <Pressable
          style={[styles.segmentButton, props.orderTab === 'orders' ? styles.segmentButtonActive : null]}
          onPress={() => props.setOrderTab('orders')}
        >
          <Text style={styles.segmentText}>{t('goodsReceiptMobile.ordersTab')}</Text>
        </Pressable>
        <Pressable
          style={[styles.segmentButton, props.orderTab === 'items' ? styles.segmentButtonActive : null]}
          onPress={() => props.setOrderTab('items')}
        >
          <Text style={styles.segmentText}>{t('goodsReceiptMobile.itemsTab')}</Text>
        </Pressable>
      </View>

      {props.orderTab === 'orders' ? (
        <>
          <Pressable
            style={[styles.selectableCard, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}
            onPress={props.onOpenOrderPicker}
          >
            <Text style={styles.selectableTitle}>{t('goodsReceiptMobile.pickOrder')}</Text>
            <Text style={[styles.selectableMeta, { color: theme.colors.textSecondary }]}>{t('goodsReceiptMobile.searchPagedHint')}</Text>
          </Pressable>
          {!props.selectedOrder ? (
            <ScreenState
              tone='empty'
              title={t('goodsReceiptMobile.noOrderSelectedTitle')}
              description={t('goodsReceiptMobile.noOrderSelectedText')}
              compact
            />
          ) : (
            <View
              style={[
                styles.selectableCard,
                { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.primary },
                props.activeOrderNumber === props.selectedOrder.siparisNo ? styles.selectableCardActive : null,
              ]}
            >
              <Text style={styles.selectableTitle}>{props.selectedOrder.siparisNo}</Text>
              <Text style={[styles.selectableMeta, { color: theme.colors.textSecondary }]}>
                {t('goodsReceiptMobile.orderDate', { value: formatLocalizedDate(props.selectedOrder.orderDate) })}
              </Text>
              <Text style={[styles.selectableMeta, { color: theme.colors.textSecondary }]}>
                {t('goodsReceiptMobile.remainingForImport', { value: props.selectedOrder.remainingForImport })}
              </Text>
            </View>
          )}
        </>
      ) : (
        <>
          {!props.activeOrderNumber ? (
            <EmptyState title={t('goodsReceiptMobile.noOrderSelectedTitle')} text={t('goodsReceiptMobile.noOrderSelectedText')} />
          ) : (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTitle}>{props.activeOrderNumber}</Text>
              <Text style={[styles.summaryMeta, { color: theme.colors.textSecondary }]}>{t('goodsReceiptMobile.selectedCount', { count: props.selectedItems.length })}</Text>
              </View>
              <TextInput
                value={props.searchItems}
                onChangeText={props.setSearchItems}
                style={[styles.input, { backgroundColor: theme.colors.surfaceStrong, color: theme.colors.text }]}
                placeholder={t('goodsReceiptMobile.searchItems')}
                placeholderTextColor={theme.colors.inputPlaceholder}
              />
              {props.orderItemsLoading ? (
                <ScreenState tone='loading' title={t('common.loading')} compact />
              ) : props.filteredOrderItems.length === 0 ? (
                <ScreenState
                  tone='empty'
                  title={t('goodsReceiptMobile.emptySelectedTitle')}
                  description={t('goodsReceiptMobile.searchItems')}
                  compact
                />
              ) : (
                props.filteredOrderItems.map((item) => {
                  const selectedItem = props.selectedItems.find((selected) => selected.id === item.id);

                  return (
                    <LineEditorCard
                      key={item.id}
                      mode='order'
                      title={item.productName || item.stockName}
                      code={item.productCode || item.stockCode}
                      unit={item.unit || ''}
                      baseQuantity={item.quantity || item.remainingForImport}
                      selectedItem={selectedItem}
                      onToggle={() => props.onToggleItem(item)}
                      onChange={(updates) => props.onUpdateItem(item.id || '', updates)}
                      onRemove={() => props.onRemoveItem(item.id || '')}
                      onPickWarehouse={() => props.onPickWarehouse(item.id || '')}
                      onPickYapKod={() => props.onPickYapKod?.(item.id || '')}
                      selectedWarehouseLabel={props.getWarehouseLabel(selectedItem?.warehouseId)}
                    />
                  );
                })
              )}
            </>
          )}
        </>
      )}
    </View>
  );
}

function EmptyState({ title, text }: { title: string; text: string }): React.ReactElement {
  return <ScreenState tone='empty' title={title} description={text} compact />;
}
