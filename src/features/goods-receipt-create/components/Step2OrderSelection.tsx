import React, { useMemo } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Tick01Icon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { ScreenState } from '@/components/ui/ScreenState';
import { useTheme } from '@/providers/ThemeProvider';
import type { Order, OrderItem, SelectedOrderItem } from '../types';
import { LineEditorCard } from './LineEditorCard';
import { styles } from './styles';

interface Step2OrderSelectionProps {
  orderTab: 'orders' | 'items';
  setOrderTab: (tab: 'orders' | 'items') => void;
  searchItems: string;
  setSearchItems: (value: string) => void;
  searchOrders: string;
  setSearchOrders: (value: string) => void;
  orders: Order[];
  ordersLoading: boolean;
  activeOrderNumber: string | null;
  onSelectOrder: (order: Order) => void;
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
  const { theme, mode } = useTheme();

  const filteredOrders = useMemo(() => {
    if (!props.searchOrders.trim()) {
      return props.orders;
    }
    const q = props.searchOrders.toLocaleLowerCase('tr-TR');
    return props.orders.filter((order) =>
      `${order.siparisNo} ${order.customerName || ''} ${order.customerCode || ''} ${order.projectCode || ''} ${String(order.remainingForImport ?? '')}`
        .toLocaleLowerCase('tr-TR')
        .includes(q),
    );
  }, [props.orders, props.searchOrders]);

  return (
    <View style={{ gap: 12 }}>
      <View>
        <View style={[styles.subTabRow, { borderBottomColor: theme.colors.border }]}>
          <Pressable
            onPress={() => props.setOrderTab('orders')}
            style={[
              styles.subTab,
              { borderBottomColor: props.orderTab === 'orders' ? theme.colors.primary : 'transparent' },
            ]}
          >
            <Text
              style={[
                styles.subTabText,
                {
                  color: props.orderTab === 'orders' ? theme.colors.primary : theme.colors.textMuted,
                  fontWeight: props.orderTab === 'orders' ? '900' : '600',
                },
              ]}
            >
              {t('goodsReceiptMobile.subTabOpenOrders')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => props.setOrderTab('items')}
            style={[
              styles.subTab,
              { borderBottomColor: props.orderTab === 'items' ? theme.colors.primary : 'transparent' },
            ]}
          >
            <Text
              style={[
                styles.subTabText,
                {
                  color: props.orderTab === 'items' ? theme.colors.primary : theme.colors.textMuted,
                  fontWeight: props.orderTab === 'items' ? '900' : '600',
                },
              ]}
            >
              {t('goodsReceiptMobile.subTabOrderContent')}
            </Text>
          </Pressable>
        </View>

        {props.orderTab === 'orders' ? (
          <>
            <View style={styles.orderSearchBlock}>
              <View
                style={[
                  styles.orderSearchShell,
                  {
                    backgroundColor: theme.colors.surfaceStrong,
                    borderColor: mode === 'light' ? 'rgba(2, 132, 199, 0.16)' : 'rgba(128, 176, 255, 0.2)',
                  },
                ]}
              >
                <TextInput
                  value={props.searchOrders}
                  onChangeText={props.setSearchOrders}
                  style={[styles.orderSearchField, { color: theme.colors.text }]}
                  placeholder={t('goodsReceiptMobile.searchOrders')}
                  placeholderTextColor={theme.colors.inputPlaceholder}
                />
              </View>
            </View>
            {props.ordersLoading ? (
              <ScreenState tone="loading" title={t('common.loading')} compact />
            ) : filteredOrders.length === 0 ? (
              <ScreenState
                tone="empty"
                title={t('goodsReceiptMobile.noOrderSelectedTitle')}
                description={props.orders.length === 0 ? t('goodsReceiptMobile.noOrderSelectedText') : t('goodsReceiptMobile.emptySearch')}
                compact
              />
            ) : (
              filteredOrders.map((order) => {
                const selected = props.activeOrderNumber === order.siparisNo;
                return (
                  <Pressable
                    key={order.siparisNo}
                    onPress={() => props.onSelectOrder(order)}
                    style={({ pressed }) => [
                      styles.orderListCard,
                      {
                        backgroundColor: theme.colors.card,
                        borderColor: selected ? theme.colors.primaryStrong : theme.colors.border,
                        borderWidth: selected ? 1.5 : 1,
                        marginTop: 8,
                        opacity: pressed ? 0.92 : 1,
                        shadowColor: '#0f172a',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: selected ? 0.1 : 0.05,
                        shadowRadius: 6,
                        elevation: 2,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.orderCheck,
                        {
                          borderColor: selected ? theme.colors.accent : theme.colors.border,
                          backgroundColor: selected ? theme.colors.accent : 'transparent',
                        },
                      ]}
                    >
                      {selected ? <Tick01Icon size={14} color="#fff" /> : null}
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.orderListTitle, { color: theme.colors.text }]} numberOfLines={1}>
                        {order.siparisNo}
                      </Text>
                      <Text style={[styles.orderListMeta, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                        {[order.customerName || order.customerCode, order.projectCode, order.remainingForImport].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 16 }}>›</Text>
                  </Pressable>
                );
              })
            )}
          </>
        ) : (
          <>
            {!props.activeOrderNumber ? (
              <EmptyState title={t('goodsReceiptMobile.noOrderSelectedTitle')} text={t('goodsReceiptMobile.noOrderSelectedText')} />
            ) : (
              <>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>{props.activeOrderNumber}</Text>
                  <Text style={[styles.summaryMeta, { color: theme.colors.textSecondary }]}>
                    {t('goodsReceiptMobile.selectedCount', { count: props.selectedItems.length })}
                  </Text>
                </View>
                <TextInput
                  value={props.searchItems}
                  onChangeText={props.setSearchItems}
                  style={[
                    styles.infieldCard,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    },
                    { minHeight: 48, marginTop: 4 },
                  ]}
                  placeholder={t('goodsReceiptMobile.searchItems')}
                  placeholderTextColor={theme.colors.inputPlaceholder}
                />
                {props.orderItemsLoading ? (
                  <ScreenState tone="loading" title={t('common.loading')} compact />
                ) : props.filteredOrderItems.length === 0 ? (
                  <ScreenState
                    tone="empty"
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
                        mode="order"
                        orderNo={props.activeOrderNumber ?? undefined}
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
    </View>
  );
}

function EmptyState({ title, text }: { title: string; text: string }): React.ReactElement {
  return <ScreenState tone="empty" title={title} description={text} compact />;
}
