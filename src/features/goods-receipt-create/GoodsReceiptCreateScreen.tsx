import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppDialog } from '@/components/ui/AppDialog';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { normalizeError } from '@/lib/errors';
import { showError, showWarning } from '@/lib/feedback';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/store/auth';
import { goodsReceiptCreateApi } from './api';
import { SelectionSheet } from './components/SelectionSheet';
import { Step1BasicInfo } from './components/Step1BasicInfo';
import { Step2OrderSelection } from './components/Step2OrderSelection';
import { Step2StockSelection } from './components/Step2StockSelection';
import { styles } from './components/styles';
import type {
  Customer,
  GoodsReceiptFormValues,
  OrderItem,
  Product,
  Project,
  ReceiptMode,
  SelectedOrderItem,
  SelectedReceiptItem,
  SelectedStockItem,
  Warehouse,
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

export function GoodsReceiptCreateScreen(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const branch = useAuthStore((state) => state.branch);

  const [currentStep, setCurrentStep] = useState<StepKey>(1);
  const [receiptMode, setReceiptMode] = useState<ReceiptMode>('order');
  const [orderTab, setOrderTab] = useState<OrderMobileTab>('orders');
  const [stockTab, setStockTab] = useState<StockMobileTab>('stocks');
  const [activeOrderNumber, setActiveOrderNumber] = useState<string | null>(null);
  const [warehouseTarget, setWarehouseTarget] = useState<WarehouseTarget>(null);
  const [showCustomerSheet, setShowCustomerSheet] = useState(false);
  const [showProjectSheet, setShowProjectSheet] = useState(false);
  const [stepOneErrors, setStepOneErrors] = useState<{
    receiptDate?: string;
    documentNo?: string;
    customerId?: string;
  }>({});
  const [searchOrders, setSearchOrders] = useState('');
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

  const customersQuery = useQuery({
    queryKey: ['goods-receipt-create', 'customers'],
    queryFn: ({ signal }) => goodsReceiptCreateApi.getCustomers({ signal }),
  });

  const projectsQuery = useQuery({
    queryKey: ['goods-receipt-create', 'projects'],
    queryFn: ({ signal }) => goodsReceiptCreateApi.getProjects({ signal }),
  });

  const warehousesQuery = useQuery({
    queryKey: ['goods-receipt-create', 'warehouses'],
    queryFn: ({ signal }) => goodsReceiptCreateApi.getWarehouses({ signal }),
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

  const productsQuery = useQuery({
    queryKey: ['goods-receipt-create', 'products'],
    queryFn: ({ signal }) => goodsReceiptCreateApi.getProducts({ signal }),
    enabled: receiptMode === 'stock' && Boolean(form.customerId),
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

  const customers = customersQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];
  const orders = ordersQuery.data ?? [];
  const products = productsQuery.data ?? [];

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

  const selectedCustomer = customers.find((item) => item.cariKod === form.customerId) ?? null;
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

  const filteredOrders = useMemo(() => {
    if (!searchOrders.trim()) {
      return orders;
    }

    const query = searchOrders.toLocaleLowerCase('tr-TR');
    return orders.filter((item) => item.siparisNo.toLocaleLowerCase('tr-TR').includes(query));
  }, [orders, searchOrders]);

  const filteredOrderItems = useMemo(() => {
    if (!searchItems.trim()) {
      return mappedOrderItems;
    }

    const query = searchItems.toLocaleLowerCase('tr-TR');
    return mappedOrderItems.filter((item) =>
      `${item.productCode} ${item.productName}`.toLocaleLowerCase('tr-TR').includes(query),
    );
  }, [mappedOrderItems, searchItems]);

  const filteredProducts = useMemo(() => {
    if (!searchStocks.trim()) {
      return products;
    }

    const query = searchStocks.toLocaleLowerCase('tr-TR');
    return products.filter((item) =>
      `${item.stokKodu} ${item.stokAdi}`.toLocaleLowerCase('tr-TR').includes(query),
    );
  }, [products, searchStocks]);

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

  const selectedStockCounts = useMemo(() => {
    const counts = new Map<string, number>();

    selectedItems.filter(isSelectedStockItem).forEach((item) => {
      counts.set(item.stockCode, (counts.get(item.stockCode) || 0) + 1);
    });

    return counts;
  }, [selectedItems]);

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

  const resetStepTwoState = (): void => {
    setSelectedItems([]);
    setActiveOrderNumber(null);
    setOrderTab('orders');
    setStockTab('stocks');
    setWarehouseTarget(null);
    setSearchOrders('');
    setSearchItems('');
    setSearchStocks('');
    setSearchSelectedStocks('');
  };

  const selectMode = (mode: ReceiptMode): void => {
    setReceiptMode(mode);
    resetStepTwoState();
    setCurrentStep(1);
  };

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
      showWarning(t('goodsReceiptMobile.stepOneValidation'));
      return false;
    }

    return true;
  };

  const handleNext = (): void => {
    if (currentStep === 1 && !validateStepOne()) {
      return;
    }

    if (currentStep === 1) {
      setCurrentStep(2);
    }
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
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={[styles.backText, { color: theme.colors.textSecondary }]}>{t('common.back')}</Text>
      </Pressable>

      <View style={[styles.hero, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.heroEyebrow, { color: theme.colors.accent }]}>{t('workflow.goodsReceipt.title')}</Text>
        <Text style={styles.title}>{t('goodsReceiptMobile.title')}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{t('goodsReceiptMobile.subtitle')}</Text>
      </View>

      <View style={styles.modeRow}>
        <Pressable style={[styles.modeChip, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }, receiptMode === 'order' ? [styles.modeChipActive, { borderColor: theme.colors.primary }] : null]} onPress={() => selectMode('order')}>
          <Text style={styles.modeChipText}>{t('goodsReceiptMobile.modeOrder')}</Text>
        </Pressable>
        <Pressable style={[styles.modeChip, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }, receiptMode === 'stock' ? [styles.modeChipActive, { borderColor: theme.colors.primary }] : null]} onPress={() => selectMode('stock')}>
          <Text style={styles.modeChipText}>{t('goodsReceiptMobile.modeStock')}</Text>
        </Pressable>
      </View>

      <View style={styles.stepIndicatorRow}>
        {[1, 2].map((step) => (
          <View key={step} style={[styles.stepIndicator, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }, currentStep === step ? [styles.stepIndicatorActive, { borderColor: theme.colors.accent }] : null]}>
            <Text style={styles.stepIndicatorText}>
              {step === 1 ? t('goodsReceiptMobile.stepOneTitle') : t('goodsReceiptMobile.stepTwoTitle')}
            </Text>
          </View>
        ))}
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
          searchOrders={searchOrders}
          setSearchOrders={setSearchOrders}
          searchItems={searchItems}
          setSearchItems={setSearchItems}
          ordersLoading={ordersQuery.isLoading}
          filteredOrders={filteredOrders}
          activeOrderNumber={activeOrderNumber}
          onSelectOrder={(orderNumber) => {
            setActiveOrderNumber(orderNumber);
            setOrderTab('items');
          }}
          orderItemsLoading={orderItemsQuery.isLoading}
          filteredOrderItems={filteredOrderItems}
          selectedItems={selectedItems.filter(isSelectedOrderItem)}
          onToggleItem={toggleOrderItem}
          onUpdateItem={updateOrderItem}
          onRemoveItem={removeOrderItem}
          warehouses={warehouses}
          onPickWarehouse={(itemId) => setWarehouseTarget({ kind: 'order', itemId })}
          getWarehouseLabel={(warehouseId) => getWarehouseLabel(warehouses, warehouseId, t('goodsReceiptMobile.warehousePlaceholder'))}
        />
      ) : (
        <Step2StockSelection
          stockTab={stockTab}
          setStockTab={setStockTab}
          searchStocks={searchStocks}
          setSearchStocks={setSearchStocks}
          searchSelectedStocks={searchSelectedStocks}
          setSearchSelectedStocks={setSearchSelectedStocks}
          productsLoading={productsQuery.isLoading}
          filteredProducts={filteredProducts}
          selectedItems={selectedItems.filter(isSelectedStockItem)}
          filteredSelectedStocks={filteredSelectedStocks}
          selectedCountByStockCode={selectedStockCounts}
          onToggleItem={toggleStockItem}
          onAddItems={addStockItems}
          onRemoveItems={removeStockItemsByCode}
          onUpdateItem={updateStockItem}
          onRemoveItem={removeStockItem}
          onPickWarehouse={(itemId) => setWarehouseTarget({ kind: 'stock', itemId })}
          getWarehouseLabel={(warehouseId) => getWarehouseLabel(warehouses, warehouseId, t('goodsReceiptMobile.warehousePlaceholder'))}
          getOrderedQuantity={(stockCode) => stockOrderQuantities.get(stockCode) || 0}
        />
      )}

      <View style={styles.footerRow}>
        {currentStep === 2 ? (
          <Pressable style={styles.secondaryButton} onPress={() => setCurrentStep(1)}>
            <Text style={styles.secondaryButtonText}>{t('common.back')}</Text>
          </Pressable>
        ) : (
          <View />
        )}
        {currentStep === 1 ? (
          <Button title={t('common.continue')} onPress={handleNext} />
        ) : (
          <Button
            title={createMutation.isPending ? t('common.loading') : t('goodsReceiptMobile.save')}
            onPress={handleSave}
            loading={createMutation.isPending}
          />
        )}
      </View>

      <SelectionSheet<Customer>
        visible={showCustomerSheet}
        title={t('goodsReceiptMobile.customerSelectTitle')}
        placeholder={t('goodsReceiptMobile.searchCustomers')}
        emptyText={t('goodsReceiptMobile.emptySearch')}
        items={customers}
        selectedValue={form.customerId}
        getValue={(item) => item.cariKod}
        getLabel={(item) => `${item.cariIsim} (${item.cariKod})`}
        onSelect={(item) => {
          setFormValue('customerId', item.cariKod);
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

      <SelectionSheet<Warehouse>
        visible={warehouseTarget !== null}
        title={t('goodsReceiptMobile.warehouseSelectTitle')}
        placeholder={t('goodsReceiptMobile.searchWarehouses')}
        emptyText={t('goodsReceiptMobile.emptySearch')}
        items={warehouses}
        selectedValue={selectedWarehouseValue}
        getValue={(item) => item.depoKodu.toString()}
        getLabel={(item) => `${item.depoIsmi} (${item.depoKodu})`}
        onSelect={handleWarehouseSelect}
        onClose={() => setWarehouseTarget(null)}
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

function getWarehouseLabel(warehouses: Warehouse[], warehouseId: number | undefined, placeholder: string): string {
  if (!warehouseId) {
    return placeholder;
  }

  const warehouse = warehouses.find((item) => item.depoKodu === warehouseId);
  if (!warehouse) {
    return placeholder;
  }

  return `${warehouse.depoIsmi} (${warehouse.depoKodu})`;
}
