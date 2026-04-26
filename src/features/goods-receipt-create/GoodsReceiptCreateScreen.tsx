import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft01Icon, ArrowRight01Icon, Camera01Icon, PackageIcon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { AppDialog } from '@/components/ui/AppDialog';
import { Button } from '@/components/ui/Button';
import { PagedSelectionSheet } from '@/components/ui/PagedSelectionSheet';
import { Text } from '@/components/ui/Text';
import { normalizeError } from '@/lib/errors';
import { showError, showWarning } from '@/lib/feedback';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/store/auth';
import { goodsReceiptCreateApi } from './api';
import { GoodsReceiptDocumentScanModal } from './components/GoodsReceiptDocumentScanModal';
import { SelectionSheet } from './components/SelectionSheet';
import { Step1BasicInfo } from './components/Step1BasicInfo';
import { Step2OrderSelection } from './components/Step2OrderSelection';
import { Step2StockSelection } from './components/Step2StockSelection';
import { styles } from './components/styles';
import type { GoodsReceiptScanDraft } from './services/document-scan';
import type {
  Customer,
  GoodsReceiptFormValues,
  Order,
  OrderItem,
  Product,
  Project,
  ReceiptMode,
  SelectedOrderItem,
  SelectedReceiptItem,
  SelectedStockItem,
  Warehouse,
  YapKodOption,
} from './types';

type StepKey = 1 | 2;
type OrderMobileTab = 'orders' | 'items';
type StockMobileTab = 'stocks' | 'selected';

type WarehouseTarget =
  | { kind: 'order'; itemId: string }
  | { kind: 'stock'; itemId: string }
  | null;

function todayIsoDate(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

function buildOrderItemId(item: OrderItem, index: number): string {
  return item.id || `${item.orderID}-${item.stockCode}-${index}`;
}

function isSelectedOrderItem(item: SelectedReceiptItem): item is SelectedOrderItem {
  return 'siparisNo' in item;
}

function isSelectedStockItem(item: SelectedReceiptItem): item is SelectedStockItem {
  return !('siparisNo' in item);
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function sanitizeDocumentNo(value: string): string {
  return value.replace(/\D/g, '');
}

export function GoodsReceiptCreateScreen({
  forcedMode,
  lockMode = false,
}: {
  forcedMode?: ReceiptMode;
  lockMode?: boolean;
} = {}): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const branch = useAuthStore((state) => state.branch);

  const [currentStep, setCurrentStep] = useState<StepKey>(1);
  const [receiptMode, setReceiptMode] = useState<ReceiptMode>(forcedMode ?? 'order');
  const [orderTab, setOrderTab] = useState<OrderMobileTab>('orders');
  const [stockTab, setStockTab] = useState<StockMobileTab>('stocks');
  const [activeOrderNumber, setActiveOrderNumber] = useState<string | null>(null);
  const [warehouseTarget, setWarehouseTarget] = useState<WarehouseTarget>(null);
  const [showStockSheet, setShowStockSheet] = useState(false);
  const [yapKodTargetItemId, setYapKodTargetItemId] = useState<string | null>(null);
  const [showYapKodSheet, setShowYapKodSheet] = useState(false);
  const [showCustomerSheet, setShowCustomerSheet] = useState(false);
  const [showProjectSheet, setShowProjectSheet] = useState(false);
  const [searchOrders, setSearchOrders] = useState('');
  const [stepOneErrors, setStepOneErrors] = useState<{
    receiptDate?: string;
    documentNo?: string;
    customerId?: string;
  }>({});
  const [searchItems, setSearchItems] = useState('');
  const [searchStocks, setSearchStocks] = useState('');
  const [searchSelectedStocks, setSearchSelectedStocks] = useState('');
  const [form, setForm] = useState<GoodsReceiptFormValues>({
    receiptDate: todayIsoDate(),
    documentNo: '',
    projectCode: '',
    isInvoice: false,
    customerId: '',
    notes: '',
  });
  const [selectedItems, setSelectedItems] = useState<SelectedReceiptItem[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDocumentScanModal, setShowDocumentScanModal] = useState(false);
  const yapKodTargetItem = selectedItems.find((item) => item.id === yapKodTargetItemId);

  const projectsQuery = useQuery({
    queryKey: ['goods-receipt-create', 'projects'],
    queryFn: ({ signal }) => goodsReceiptCreateApi.getProjects({ signal }),
  });

  const ordersQuery = useQuery({
    queryKey: ['goods-receipt-create', 'orders', form.customerId],
    queryFn: ({ signal }) => goodsReceiptCreateApi.getOrdersByCustomer(form.customerId, { signal }),
    enabled: Boolean(form.customerId),
  });

  const orderItemsQuery = useQuery({
    queryKey: ['goods-receipt-create', 'order-items', form.customerId, activeOrderNumber],
    queryFn: ({ signal }) => goodsReceiptCreateApi.getOrderItems(form.customerId, activeOrderNumber || '', { signal }),
    enabled: receiptMode === 'order' && Boolean(form.customerId) && Boolean(activeOrderNumber),
  });

  const createMutation = useMutation({
    mutationFn: () => goodsReceiptCreateApi.createGoodsReceipt(form, selectedItems, receiptMode, branch?.code),
    onSuccess: () => {
      setShowSuccessModal(true);
    },
    onError: (error: Error) => {
      showError(error, normalizeError(error, t('common.error')).message);
    },
  });

  const projects = projectsQuery.data ?? [];
  const orders = ordersQuery.data ?? [];

  const allOrderNumbers = useMemo(() => {
    if (receiptMode !== 'stock' || orders.length === 0) {
      return '';
    }

    return orders.map((item) => item.siparisNo).join(',');
  }, [orders, receiptMode]);

  const allOrderItemsQuery = useQuery({
    queryKey: ['goods-receipt-create', 'all-order-items', form.customerId, allOrderNumbers],
    queryFn: ({ signal }) => goodsReceiptCreateApi.getOrderItems(form.customerId, allOrderNumbers, { signal }),
    enabled: receiptMode === 'stock' && Boolean(form.customerId) && Boolean(allOrderNumbers),
  });

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const selectedProject = projects.find((item) => item.projeKod === form.projectCode) ?? null;

  const mappedOrderItems = useMemo(() => {
    return (orderItemsQuery.data ?? []).map((item, index) => ({
      ...item,
      id: buildOrderItemId(item, index),
      productCode: item.stockCode,
      productName: item.stockName,
      quantity: item.remainingForImport,
      unit: item.unit,
    }));
  }, [orderItemsQuery.data]);

  const filteredOrderItems = useMemo(() => {
    if (!searchItems.trim()) {
      return mappedOrderItems;
    }

    const query = searchItems.toLocaleLowerCase('tr-TR');
    return mappedOrderItems.filter((item) =>
      `${item.productCode} ${item.productName}`.toLocaleLowerCase('tr-TR').includes(query),
    );
  }, [mappedOrderItems, searchItems]);

  const filteredSelectedStocks = useMemo(() => {
    const stockItems = selectedItems.filter(isSelectedStockItem);
    if (!searchSelectedStocks.trim()) {
      return stockItems;
    }

    const query = searchSelectedStocks.toLocaleLowerCase('tr-TR');
    return stockItems.filter((item) =>
      `${item.stockCode} ${item.stockName}`.toLocaleLowerCase('tr-TR').includes(query),
    );
  }, [searchSelectedStocks, selectedItems]);

  const stockOrderQuantities = useMemo(() => {
    const quantities = new Map<string, number>();

    for (const item of allOrderItemsQuery.data ?? []) {
      const current = quantities.get(item.stockCode) || 0;
      quantities.set(item.stockCode, current + (item.remainingForImport || 0));
    }

    return quantities;
  }, [allOrderItemsQuery.data]);

  const setFormValue = <K extends keyof GoodsReceiptFormValues>(key: K, value: GoodsReceiptFormValues[K]): void => {
    if (key === 'receiptDate' || key === 'documentNo' || key === 'customerId') {
      setStepOneErrors((prev) => ({ ...prev, [key]: undefined }));
    }

    if (key === 'documentNo') {
      const maxLength = form.isInvoice ? 16 : 15;
      setForm((prev) => ({ ...prev, [key]: sanitizeDocumentNo(String(value)).slice(0, maxLength) as GoodsReceiptFormValues[K] }));
      return;
    }

    if (key === 'isInvoice') {
      const nextIsInvoice = Boolean(value);
      const maxLength = nextIsInvoice ? 16 : 15;
      setForm((prev) => ({
        ...prev,
        isInvoice: nextIsInvoice,
        documentNo: sanitizeDocumentNo(prev.documentNo).slice(0, maxLength),
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const applyGoodsReceiptScanDraft = (draft: GoodsReceiptScanDraft): void => {
    if (draft.isInvoice !== undefined) {
      setFormValue('isInvoice', draft.isInvoice);
    }
    if (draft.receiptDate) {
      setFormValue('receiptDate', draft.receiptDate);
    }
    if (draft.documentNo != null && draft.documentNo !== '') {
      setFormValue('documentNo', draft.documentNo);
    }
    if (draft.notes != null) {
      setFormValue('notes', draft.notes);
    }
    if (draft.projectCode != null) {
      setFormValue('projectCode', draft.projectCode);
    }
    // Müşteri: API cari kodu döndüğünde burada setFormValue + müşteri sheet ile eşleştirme eklenebilir.
  };

  const resetStepTwoState = (): void => {
    setSelectedItems([]);
    setActiveOrderNumber(null);
    setOrderTab('orders');
    setStockTab('stocks');
    setWarehouseTarget(null);
    setSearchItems('');
    setSearchOrders('');
    setSearchStocks('');
    setSearchSelectedStocks('');
  };

  const selectMode = (mode: ReceiptMode): void => {
    if (lockMode && forcedMode) {
      return;
    }
    setReceiptMode(mode);
    resetStepTwoState();
    setCurrentStep(1);
  };

  React.useEffect(() => {
    if (forcedMode) {
      setReceiptMode(forcedMode);
    }
  }, [forcedMode]);

  const toggleOrderItem = (item: OrderItem): void => {
    const itemId = item.id || '';

    setSelectedItems((prev) => {
      const exists = prev.some((selected) => isSelectedOrderItem(selected) && selected.id === itemId);
      if (exists) {
        return prev.filter((selected) => !(isSelectedOrderItem(selected) && selected.id === itemId));
      }

      return [
        ...prev,
        {
          ...item,
          id: itemId,
          receiptQuantity: item.quantity || item.remainingForImport || 0,
          isSelected: true,
        } as SelectedOrderItem,
      ];
    });
  };

  const updateOrderItem = (itemId: string, updates: Partial<SelectedOrderItem>): void => {
    setSelectedItems((prev) =>
      prev.map((item) => (isSelectedOrderItem(item) && item.id === itemId ? { ...item, ...updates } : item)),
    );
  };

  const removeOrderItem = (itemId: string): void => {
    setSelectedItems((prev) => prev.filter((item) => !(isSelectedOrderItem(item) && item.id === itemId)));
  };

  const toggleStockItem = (item: Product): void => {
    addStockItems(item, 1);
  };

  const addStockItems = (item: Product, count: number): void => {
    const safeCount = Math.max(1, Math.floor(count));
    const nextItems = Array.from({ length: safeCount }, () => ({
      id: `stock-${item.stokKodu}-${randomId()}`,
      stockId: item.id,
      stockCode: item.stokKodu,
      stockName: item.stokAdi,
      unit: item.olcuBr1,
      receiptQuantity: 0,
      isSelected: true,
    } as SelectedStockItem));

    setSelectedItems((prev) => [...prev, ...nextItems]);
  };

  const removeStockItemsByCode = (stockCode: string, count: number): void => {
    const safeCount = Math.max(1, Math.floor(count));
    let remaining = safeCount;

    setSelectedItems((prev) =>
      [...prev].reverse().filter((item) => {
        if (remaining > 0 && isSelectedStockItem(item) && item.stockCode === stockCode) {
          remaining -= 1;
          return false;
        }

        return true;
      }).reverse(),
    );
  };

  const updateStockItem = (itemId: string, updates: Partial<SelectedStockItem>): void => {
    setSelectedItems((prev) =>
      prev.map((item) => (isSelectedStockItem(item) && item.id === itemId ? { ...item, ...updates } : item)),
    );
  };

  const removeStockItem = (itemId: string): void => {
    setSelectedItems((prev) => prev.filter((item) => !(isSelectedStockItem(item) && item.id === itemId)));
  };

  const handleWarehouseSelect = (warehouse: Warehouse): void => {
    if (!warehouseTarget) {
      return;
    }

    if (warehouseTarget.kind === 'order') {
      updateOrderItem(warehouseTarget.itemId, { warehouseId: warehouse.depoKodu });
    } else {
      updateStockItem(warehouseTarget.itemId, { warehouseId: warehouse.depoKodu });
    }

    setWarehouseTarget(null);
  };

  const validateStepOne = (): boolean => {
    const nextErrors: {
      receiptDate?: string;
      documentNo?: string;
      customerId?: string;
    } = {};

    if (!form.receiptDate) {
      nextErrors.receiptDate = t('goodsReceiptMobile.validation.receiptDate');
    }
    if (!form.documentNo.trim()) {
      nextErrors.documentNo = t('goodsReceiptMobile.validation.documentNo');
    } else {
      const expectedLength = form.isInvoice ? 16 : 15;
      if (sanitizeDocumentNo(form.documentNo).length !== expectedLength) {
        nextErrors.documentNo = form.isInvoice
          ? t('goodsReceiptMobile.validation.documentNoInvoiceLength')
          : t('goodsReceiptMobile.validation.documentNoLength');
      }
    }
    if (!form.customerId) {
      nextErrors.customerId = t('goodsReceiptMobile.validation.customerId');
    }

    setStepOneErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return false;
    }

    return true;
  };

  const goToStep = (next: StepKey): void => {
    if (next === 2) {
      if (!validateStepOne()) {
        return;
      }
    }
    setCurrentStep(next);
  };

  const handleNext = (): void => {
    if (currentStep === 1) {
      goToStep(2);
    }
  };

  const handleSelectOrder = (order: Order): void => {
    setActiveOrderNumber(order.siparisNo);
    setOrderTab('items');
  };

  const handleSave = (): void => {
    if (selectedItems.length === 0) {
      showWarning(t('goodsReceiptMobile.selectAtLeastOne'));
      return;
    }

    const hasMissingWarehouse = selectedItems.some((item) => !item.warehouseId);
    const hasMissingQuantity = selectedItems.some((item) => !item.receiptQuantity || item.receiptQuantity <= 0);

    if (hasMissingWarehouse || hasMissingQuantity) {
      showWarning(t('goodsReceiptMobile.completeLineRequired'));
      return;
    }

    createMutation.mutate();
  };

  const selectedWarehouseValue = useMemo(() => {
    if (!warehouseTarget) {
      return undefined;
    }

    const currentItem = selectedItems.find((item) => item.id === warehouseTarget.itemId);
    return currentItem?.warehouseId?.toString();
  }, [selectedItems, warehouseTarget]);

  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: theme.colors.background }]}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.backButton,
          currentStep === 2 ? [styles.backPill, styles.backPillStep2] : null,
          { opacity: pressed ? 0.86 : 1 },
        ]}
        hitSlop={12}
        accessibilityLabel={t('common.back')}
      >
        <ArrowLeft01Icon
          size={24}
          color={currentStep === 2 ? 'rgba(220, 38, 38, 0.88)' : theme.colors.danger}
        />
      </Pressable>

      <LinearGradient
        colors={Array.from(theme.gradients.hero) as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { borderColor: theme.colors.navBorder }]}
      >
        <View style={styles.heroInfoRow}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.infoTitle, { color: theme.colors.text }]}>{t('goodsReceiptMobile.infoTitle')}</Text>
            <Text style={[styles.infoShort, { color: theme.colors.textSecondary }]}>{t('goodsReceiptMobile.infoShort')}</Text>
            <Text style={[styles.infoLine2, { color: theme.colors.textSecondary }]}>{t('goodsReceiptMobile.infoShortLine2')}</Text>
          </View>
          <View
            style={[
              styles.heroIconBtn,
              {
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                borderWidth: 1.5,
                borderColor: 'rgba(14, 165, 233, 0.35)',
              },
            ]}
          >
            <PackageIcon size={22} color={theme.colors.primaryStrong} />
          </View>
        </View>
      </LinearGradient>

      {currentStep === 1 ? (
        <Pressable
          onPress={() => setShowDocumentScanModal(true)}
          style={({ pressed }) => [
            styles.documentScanRow,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surfaceStrong,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('goodsReceiptMobile.documentScanRowLabel')}
        >
          <View
            style={[
              styles.documentScanIconWrap,
              {
                borderColor: 'rgba(14, 165, 233, 0.35)',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
              },
            ]}
          >
            <Camera01Icon size={22} color={theme.colors.primaryStrong} />
          </View>
          <View style={styles.documentScanRowText}>
            <Text style={[styles.documentScanRowTitle, { color: theme.colors.text }]}>{t('goodsReceiptMobile.documentScanRowLabel')}</Text>
            <Text style={[styles.documentScanRowMeta, { color: theme.colors.textMuted }]} numberOfLines={2}>
              {t('goodsReceiptMobile.documentScanRowHint')}
            </Text>
          </View>
          <Text style={{ color: theme.colors.textMuted, fontSize: 18 }}>›</Text>
        </Pressable>
      ) : null}

      {!lockMode ? (
        <View style={styles.modeRow}>
          <Pressable
            style={[
              styles.modeChip,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong },
              receiptMode === 'order' ? [styles.modeChipActive, { borderColor: theme.colors.primary }] : null,
            ]}
            onPress={() => selectMode('order')}
          >
            <Text style={styles.modeChipText}>{t('goodsReceiptMobile.modeOrder')}</Text>
          </Pressable>
          <Pressable
            style={[
              styles.modeChip,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong },
              receiptMode === 'stock' ? [styles.modeChipActive, { borderColor: theme.colors.primary }] : null,
            ]}
            onPress={() => selectMode('stock')}
          >
            <Text style={styles.modeChipText}>{t('goodsReceiptMobile.modeStock')}</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.mainTabBar, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Pressable
          style={[
            styles.mainTab,
            currentStep === 1
              ? { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }
              : null,
          ]}
          onPress={() => goToStep(1)}
        >
          <Text
            style={[
              styles.mainTabText,
              { color: currentStep === 1 ? theme.colors.primaryStrong : theme.colors.textMuted },
            ]}
          >
            {t('goodsReceiptMobile.mainTabBasic')}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.mainTab,
            currentStep === 2
              ? { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }
              : null,
          ]}
          onPress={() => goToStep(2)}
        >
          <Text
            style={[
              styles.mainTabText,
              { color: currentStep === 2 ? theme.colors.primaryStrong : theme.colors.textMuted },
            ]}
          >
            {t('goodsReceiptMobile.mainTabLines')}
          </Text>
        </Pressable>
      </View>

      {currentStep === 1 ? (
        <Step1BasicInfo
          form={form}
          stepOneErrors={stepOneErrors}
          selectedCustomer={selectedCustomer}
          selectedProject={selectedProject}
          onChange={setFormValue}
          onOpenCustomerSheet={() => setShowCustomerSheet(true)}
          onOpenProjectSheet={() => setShowProjectSheet(true)}
        />
      ) : receiptMode === 'order' ? (
        <Step2OrderSelection
          orderTab={orderTab}
          setOrderTab={setOrderTab}
          searchItems={searchItems}
          setSearchItems={setSearchItems}
          searchOrders={searchOrders}
          setSearchOrders={setSearchOrders}
          orders={orders}
          ordersLoading={ordersQuery.isLoading}
          activeOrderNumber={activeOrderNumber}
          onSelectOrder={handleSelectOrder}
          orderItemsLoading={orderItemsQuery.isLoading}
          filteredOrderItems={filteredOrderItems}
          selectedItems={selectedItems.filter(isSelectedOrderItem)}
          onToggleItem={toggleOrderItem}
          onUpdateItem={updateOrderItem}
          onRemoveItem={removeOrderItem}
          onPickWarehouse={(itemId) => setWarehouseTarget({ kind: 'order', itemId })}
          onPickYapKod={(itemId) => {
            setYapKodTargetItemId(itemId);
            setShowYapKodSheet(true);
          }}
          getWarehouseLabel={(warehouseId) => getWarehouseLabel(undefined, warehouseId, t('goodsReceiptMobile.warehousePlaceholder'))}
        />
      ) : (
        <Step2StockSelection
          stockTab={stockTab}
          setStockTab={setStockTab}
          searchStocks={searchStocks}
          setSearchStocks={setSearchStocks}
          searchSelectedStocks={searchSelectedStocks}
          setSearchSelectedStocks={setSearchSelectedStocks}
          selectedItems={selectedItems.filter(isSelectedStockItem)}
          filteredSelectedStocks={filteredSelectedStocks}
          onOpenStockPicker={() => setShowStockSheet(true)}
          onUpdateItem={updateStockItem}
          onRemoveItem={removeStockItem}
          onPickWarehouse={(itemId) => setWarehouseTarget({ kind: 'stock', itemId })}
          onPickYapKod={(itemId) => {
            setYapKodTargetItemId(itemId);
            setShowYapKodSheet(true);
          }}
          getWarehouseLabel={(warehouseId) => getWarehouseLabel(undefined, warehouseId, t('goodsReceiptMobile.warehousePlaceholder'))}
          getOrderedQuantity={(stockCode) => stockOrderQuantities.get(stockCode) || 0}
        />
      )}

      {currentStep === 1 ? (
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [{ width: '100%', opacity: pressed ? 0.92 : 1 }]}
          accessibilityLabel={t('common.continue')}
        >
          <LinearGradient
            colors={Array.from(theme.gradients.primary) as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueBtn}
          >
            <Text style={styles.continueText}>{t('common.continue')}</Text>
            <ArrowRight01Icon size={20} color="#fff" />
          </LinearGradient>
        </Pressable>
      ) : (
        <View style={styles.footerRow}>
          <Pressable
            onPress={() => goToStep(1)}
            style={({ pressed }) => [
              styles.footerBackBtn,
              {
                borderColor: 'rgba(239, 68, 68, 0.3)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            accessibilityLabel={t('common.back')}
          >
            <Text style={[styles.secondaryButtonText, { color: 'rgba(220, 38, 38, 0.95)' }]}>{t('common.back')}</Text>
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Button
              title={createMutation.isPending ? t('common.loading') : t('goodsReceiptMobile.save')}
              onPress={handleSave}
              loading={createMutation.isPending}
            />
          </View>
        </View>
      )}

      <PagedSelectionSheet<Customer>
        visible={showCustomerSheet}
        title={t('goodsReceiptMobile.customerSelectTitle')}
        placeholder={t('goodsReceiptMobile.searchCustomers')}
        emptyText={t('goodsReceiptMobile.emptySearch')}
        selectedValue={form.customerId}
        queryKey={['goods-receipt-create', 'customer-picker']}
        fetchPage={({ pageNumber, pageSize, search, signal }) =>
          goodsReceiptCreateApi.getCustomersPaged(pageNumber, pageSize, search, { signal })
        }
        getValue={(item) => item.cariKod}
        getLabel={(item) => `${item.cariIsim} (${item.cariKod})`}
        onSelect={(item) => {
          setSelectedCustomer(item);
          setFormValue('customerId', item.cariKod);
          setFormValue('customerRefId', item.id);
          resetStepTwoState();
          setCurrentStep(1);
        }}
        onClose={() => setShowCustomerSheet(false)}
      />

      <SelectionSheet<Project>
        visible={showProjectSheet}
        title={t('goodsReceiptMobile.projectSelectTitle')}
        placeholder={t('goodsReceiptMobile.searchProjects')}
        emptyText={t('goodsReceiptMobile.emptySearch')}
        items={projects}
        selectedValue={form.projectCode}
        getValue={(item) => item.projeKod}
        getLabel={(item) => `${item.projeAciklama} (${item.projeKod})`}
        onSelect={(item) => setFormValue('projectCode', item.projeKod)}
        onClose={() => setShowProjectSheet(false)}
      />

      <PagedSelectionSheet<Warehouse>
        visible={warehouseTarget !== null}
        title={t('goodsReceiptMobile.warehouseSelectTitle')}
        placeholder={t('goodsReceiptMobile.searchWarehouses')}
        emptyText={t('goodsReceiptMobile.emptySearch')}
        selectedValue={selectedWarehouseValue}
        queryKey={['goods-receipt-create', 'warehouse-picker', warehouseTarget?.kind]}
        fetchPage={({ pageNumber, pageSize, search, signal }) =>
          goodsReceiptCreateApi.getWarehousesPaged(pageNumber, pageSize, search, { signal })
        }
        getValue={(item) => item.depoKodu.toString()}
        getLabel={(item) => `${item.depoIsmi} (${item.depoKodu})`}
        onSelect={handleWarehouseSelect}
        onClose={() => setWarehouseTarget(null)}
      />

      <PagedSelectionSheet<Product>
        visible={showStockSheet}
        title={t('goodsReceiptMobile.pickStock')}
        placeholder={t('goodsReceiptMobile.searchStocks')}
        emptyText={t('goodsReceiptMobile.emptySearch')}
        queryKey={['goods-receipt-create', 'stock-picker']}
        fetchPage={({ pageNumber, pageSize, search, signal }) =>
          goodsReceiptCreateApi.getProductsPaged(pageNumber, pageSize, search, { signal })
        }
        getValue={(item) => item.stokKodu}
        getLabel={(item) => `${item.stokAdi} (${item.stokKodu})`}
        onSelect={toggleStockItem}
        onClose={() => setShowStockSheet(false)}
      />

      <PagedSelectionSheet<YapKodOption>
        visible={showYapKodSheet}
        title={t('goodsReceiptMobile.configCode')}
        placeholder={t('goodsReceiptMobile.searchYapKod')}
        emptyText={t('goodsReceiptMobile.emptySearch')}
        queryKey={['goods-receipt-create', 'yapkod-picker', yapKodTargetItem?.stockId ?? yapKodTargetItem?.stockCode ?? 'none']}
        fetchPage={({ pageNumber, pageSize, search, signal }) =>
          goodsReceiptCreateApi.getYapKodlarPaged(
            pageNumber,
            pageSize,
            search,
            { stockId: yapKodTargetItem?.stockId, stockCode: yapKodTargetItem?.stockCode },
            { signal },
          )
        }
        getValue={(item) => item.yapKod}
        getLabel={(item) => `${item.yapAcik} (${item.yapKod})`}
        onSelect={(item) => {
          if (!yapKodTargetItemId) return;
          updateStockItem(yapKodTargetItemId, { configCode: item.yapKod, yapKodId: item.id });
          updateOrderItem(yapKodTargetItemId, { configCode: item.yapKod, yapKodId: item.id });
        }}
        onClose={() => {
          setYapKodTargetItemId(null);
          setShowYapKodSheet(false);
        }}
      />

      <GoodsReceiptDocumentScanModal
        visible={showDocumentScanModal}
        onClose={() => setShowDocumentScanModal(false)}
        onApplyDraft={applyGoodsReceiptScanDraft}
      />

      <AppDialog
        visible={showSuccessModal}
        title={t('goodsReceiptMobile.createSuccessTitle')}
        description={t('goodsReceiptMobile.createSuccessMessage')}
        onClose={() => setShowSuccessModal(false)}
        actions={[
          {
            label: t('common.continue'),
            onPress: () => {
              setShowSuccessModal(false);
              router.replace('/(tabs)/flows/goods-receipt');
            },
          },
        ]}
      />
    </ScrollView>
  );
}

function getWarehouseLabel(warehouses: Warehouse[] | undefined, warehouseId: number | undefined, placeholder: string): string {
  if (!warehouseId) {
    return placeholder;
  }

  const warehouse = warehouses?.find((item) => item.depoKodu === warehouseId);
  if (!warehouse) {
    return String(warehouseId);
  }

  return `${warehouse.depoIsmi} (${warehouse.depoKodu})`;
}
