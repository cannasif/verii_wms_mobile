import React, { useMemo } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Tick01Icon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { CameraView } from 'expo-camera';
import { Button } from '@/components/ui/Button';
import { ScreenState } from '@/components/ui/ScreenState';
import { Text } from '@/components/ui/Text';
import { styles as grStyles } from '@/features/goods-receipt-create/components/styles';
import { COLORS, RADII, SPACING } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type { WorkflowModuleConfig } from '@/features/operations/types/workflow';
import type {
  SelectedWorkflowItem,
  SelectedWorkflowOrderItem,
  SelectedWorkflowStockItem,
  WorkflowOrder,
  WorkflowOrderItem,
} from '../types';
import { WorkflowSelectedItemCard } from './WorkflowSelectedItemCard';

interface Props {
  module: WorkflowModuleConfig;
  mode: 'order' | 'free';
  stockTab: 'stocks' | 'selected';
  setStockTab: (tab: 'stocks' | 'selected') => void;
  formCustomerId: string;
  searchOrders: string;
  setSearchOrders: (value: string) => void;
  orders: WorkflowOrder[];
  ordersLoading: boolean;
  activeOrderNumber: string | null;
  onSelectOrder: (order: WorkflowOrder) => void;
  orderItems: WorkflowOrderItem[];
  orderItemsLoading: boolean;
  selectedItems: SelectedWorkflowItem[];
  toggleOrderItem: (item: WorkflowOrderItem) => void;
  barcodeInput: string;
  setBarcodeInput: (value: string) => void;
  handleBarcodeSearch: () => void;
  barcodePending: boolean;
  openScanner: () => void;
  scannerOpen: boolean;
  handleBarcodeScanned: ({ data }: { data: string }) => void;
  closeScanner: () => void;
  openStockPicker: () => void;
  quantityInputs: Record<string, string>;
  handleQuantityInputChange: (itemId: string, value: string) => void;
  handleQuantityBlur: (itemId: string, fallbackQuantity: number) => void;
  removeSelectedItem: (itemId: string) => void;
  updateSelectedItem: (itemId: string, updates: Partial<SelectedWorkflowOrderItem & SelectedWorkflowStockItem>) => void;
  setWarehouseTarget: (target: string | 'source' | 'target' | null) => void;
  setWarehouseSheetOpen: (open: boolean) => void;
  openYapKodPicker: (itemId: string) => void;
  isOrderItem: (item: SelectedWorkflowItem) => item is SelectedWorkflowOrderItem;
  isStockItem: (item: SelectedWorkflowItem) => item is SelectedWorkflowStockItem;
}

export function WorkflowCreateStepTwoSection(props: Props): React.ReactElement {
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
      {props.mode === 'order' ? (
        <>
          {props.formCustomerId ? (
            <>
              <View style={grStyles.orderSearchBlock}>
                <View
                  style={[
                    grStyles.orderSearchShell,
                    {
                      backgroundColor: theme.colors.surfaceStrong,
                      borderColor: mode === 'light' ? 'rgba(2, 132, 199, 0.16)' : 'rgba(128, 176, 255, 0.2)',
                    },
                  ]}
                >
                  <TextInput
                    value={props.searchOrders}
                    onChangeText={props.setSearchOrders}
                    style={[grStyles.orderSearchField, { color: theme.colors.text }]}
                    placeholder={t('workflowCreate.placeholders.orderSearch')}
                    placeholderTextColor={theme.colors.inputPlaceholder}
                  />
                </View>
              </View>
              {props.ordersLoading ? (
                <ScreenState tone="loading" title={t('common.loading')} compact />
              ) : filteredOrders.length === 0 ? (
                <ScreenState
                  tone="empty"
                  title={t('workflowCreate.noOrderSelected')}
                  description={props.orders.length === 0 ? t('workflowCreate.noOrders') : t('workflowCreate.emptySearch')}
                  compact
                />
              ) : (
                filteredOrders.map((order) => {
                  const isSel = props.activeOrderNumber === order.siparisNo;
                  return (
                    <Pressable
                      key={order.siparisNo}
                      onPress={() => props.onSelectOrder(order)}
                      style={({ pressed }) => [
                        grStyles.orderListCard,
                        {
                          backgroundColor: theme.colors.card,
                          borderColor: isSel ? theme.colors.primaryStrong : theme.colors.border,
                          borderWidth: isSel ? 1.5 : 1,
                          marginTop: 4,
                          opacity: pressed ? 0.92 : 1,
                          shadowColor: '#0f172a',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isSel ? 0.1 : 0.05,
                          shadowRadius: 6,
                          elevation: 2,
                        },
                      ]}
                    >
                      <View
                        style={[
                          grStyles.orderCheck,
                          {
                            borderColor: isSel ? theme.colors.accent : theme.colors.border,
                            backgroundColor: isSel ? theme.colors.accent : 'transparent',
                          },
                        ]}
                      >
                        {isSel ? <Tick01Icon size={14} color="#fff" /> : null}
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[grStyles.orderListTitle, { color: theme.colors.text }]} numberOfLines={1}>
                          {order.siparisNo}
                        </Text>
                        <Text style={[grStyles.orderListMeta, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                          {[order.customerName || order.customerCode, order.projectCode, order.remainingForImport].filter(Boolean).join(' · ')}
                        </Text>
                      </View>
                      <Text style={{ color: theme.colors.textMuted, fontSize: 16 }}>›</Text>
                    </Pressable>
                  );
                })
              )}

              {props.activeOrderNumber ? (
                props.orderItemsLoading ? (
                  <ScreenState tone="loading" title={t('common.loading')} compact />
                ) : props.orderItems.length === 0 ? (
                  <ScreenState tone="empty" title={t('workflowCreate.noItems')} compact />
                ) : (
                  props.orderItems.map((item) => {
                    const selected = props.selectedItems.some(
                      (selectedItem) => props.isOrderItem(selectedItem) && selectedItem.id === item.id,
                    );
                    return (
                      <Pressable
                        key={item.id}
                        style={[
                          styles.rowCard,
                          {
                            borderColor: theme.colors.border,
                            backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.03)',
                            marginTop: 8,
                          },
                          selected ? [styles.rowCardActive, { borderColor: theme.colors.primary }] : null,
                        ]}
                        onPress={() => props.toggleOrderItem(item)}
                      >
                        <Text style={styles.rowTitle}>{item.stockCode}</Text>
                        <Text style={[styles.rowMeta, { color: theme.colors.textSecondary }]}>{item.stockName}</Text>
                        <Text style={[styles.rowMeta, { color: theme.colors.textSecondary }]}>
                          {t('workflowCreate.remainingQty', { value: item.remainingForImport })}
                        </Text>
                      </Pressable>
                    );
                  })
                )
              ) : null}
            </>
          ) : (
            <ScreenState tone="empty" title={t('workflowCreate.noCustomerSelected')} compact />
          )}
        </>
      ) : (
        <>
          {props.module.key === 'warehouse-outbound' ? (
            <View style={styles.barcodeCard}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>{t('workflowCreate.fields.barcode')}</Text>
              <View style={styles.barcodeRow}>
                <TextInput
                  style={[styles.input, styles.flexInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong, color: theme.colors.text }]}
                  value={props.barcodeInput}
                  onChangeText={props.setBarcodeInput}
                  placeholder={t('workflowCreate.placeholders.barcode')}
                  placeholderTextColor={theme.colors.inputPlaceholder}
                  autoCapitalize='characters'
                />
                <Button title={props.barcodePending ? t('common.loading') : t('workflowCreate.addBarcode')} onPress={props.handleBarcodeSearch} loading={props.barcodePending} style={styles.barcodeButton} />
              </View>
              <Button title={t('workflowCreate.scanBarcode')} onPress={props.openScanner} />
              {props.scannerOpen ? (
                <View style={[styles.scannerCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]}>
                  <CameraView
                    style={styles.scannerView}
                    facing='back'
                    barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'qr', 'code128', 'code39', 'upc_a', 'upc_e'] }}
                    onBarcodeScanned={props.handleBarcodeScanned}
                  />
                  <View style={styles.scannerFooter}>
                    <Text style={[styles.rowMeta, { color: theme.colors.textSecondary }]}>{t('workflowCreate.scanHelp')}</Text>
                    <Button title={t('common.cancel')} onPress={props.closeScanner} />
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}
          <View style={styles.modeRow}>
            <Pressable style={[styles.modeChip, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }, props.stockTab === 'stocks' ? [styles.modeChipActive, { borderColor: theme.colors.primary }] : null]} onPress={() => props.setStockTab('stocks')}>
              <Text style={styles.modeText}>{t('goodsReceiptMobile.stocksTab')}</Text>
            </Pressable>
            <Pressable style={[styles.modeChip, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }, props.stockTab === 'selected' ? [styles.modeChipActive, { borderColor: theme.colors.primary }] : null]} onPress={() => props.setStockTab('selected')}>
              <Text style={styles.modeText}>{t('goodsReceiptMobile.selectedTab')}</Text>
            </Pressable>
          </View>
          {props.stockTab === 'stocks' ? (
            <View style={styles.barcodeCard}>
              <Button title={t('workflowCreate.pickStock')} onPress={props.openStockPicker} />
              <Text style={[styles.rowMeta, { color: theme.colors.textSecondary }]}>{t('workflowCreate.searchPagedHint')}</Text>
            </View>
          ) : (props.selectedItems.filter(props.isStockItem).length === 0 ? <ScreenState tone='empty' title={t('goodsReceiptMobile.emptySelectedText')} compact /> : null)}
        </>
      )}

      {(props.mode === 'order' || props.stockTab === 'selected') && props.selectedItems.length > 0 ? <Text style={styles.sectionTitle}>{t('workflowCreate.selectedSection')}</Text> : null}
      {(props.mode === 'order' ? props.selectedItems : props.stockTab === 'selected' ? props.selectedItems.filter(props.isStockItem) : []).map((item) => (
        <WorkflowSelectedItemCard
          key={item.id}
          item={item}
          mode={props.mode}
          quantityValue={props.quantityInputs[item.id] ?? String(item.transferQuantity || '')}
          onQuantityChange={(value) => props.handleQuantityInputChange(item.id, value)}
          onQuantityBlur={() => props.handleQuantityBlur(item.id, item.transferQuantity || 0)}
          onRemove={() => props.removeSelectedItem(item.id)}
          onUpdate={(updates) => props.updateSelectedItem(item.id, updates)}
          onPickWarehouse={() => {
            props.setWarehouseTarget(item.id);
            props.setWarehouseSheetOpen(true);
          }}
          onPickYapKod={() => props.openYapKodPicker(item.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  modeRow: { flexDirection: 'row', gap: 10 },
  modeChip: { flex: 1, minHeight: 44, borderRadius: RADII.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceStrong },
  modeChipActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(56,189,248,0.12)' },
  modeText: { fontWeight: '800' },
  fieldLabel: { color: COLORS.textSecondary, fontWeight: '800', fontSize: 12 },
  input: { minHeight: 48, borderRadius: RADII.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceStrong, color: COLORS.text, paddingHorizontal: 14 },
  rowCard: { padding: 14, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, backgroundColor: 'rgba(255,255,255,0.03)', gap: 4 },
  rowCardActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(56,189,248,0.12)' },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowTitle: { fontWeight: '900' },
  rowMeta: { color: COLORS.textSecondary, fontSize: 12 },
  barcodeCard: { gap: 10, paddingBottom: 8 },
  barcodeRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  flexInput: { flex: 1 },
  barcodeButton: { minWidth: 120 },
  scannerCard: { borderRadius: RADII.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceStrong },
  scannerView: { width: '100%', aspectRatio: 1.2 },
  scannerFooter: { padding: 12, gap: 10 },
  stockAdjustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  countActionButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card, borderWidth: 1, borderColor: 'rgba(128, 176, 255, 0.24)' },
  countActionButtonDisabled: { opacity: 0.45 },
  countActionText: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  countInput: { width: 56, height: 38, borderRadius: RADII.sm, textAlign: 'center', backgroundColor: COLORS.surfaceStrong, borderWidth: 1, borderColor: 'rgba(128, 176, 255, 0.24)', color: COLORS.text, fontWeight: '800' },
  countBadge: { minWidth: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  countBadgeText: { color: COLORS.background, fontWeight: '900', fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '900', marginTop: 4 },
  flexOne: { flex: 1 },
});
