import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft01Icon } from 'hugeicons-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button } from '@/components/ui/Button';
import { AppDialog } from '@/components/ui/AppDialog';
import { ScreenState } from '@/components/ui/ScreenState';
import { Text } from '@/components/ui/Text';
import { PagedSelectionSheet } from '@/components/ui/PagedSelectionSheet';
import { COLORS, LAYOUT, RADII, SPACING } from '@/constants/theme';
import { normalizeError } from '@/lib/errors';
import { showError, showWarning } from '@/lib/feedback';
import { useTheme } from '@/providers/ThemeProvider';
import { SelectionSheet } from '@/features/goods-receipt-create/components/SelectionSheet';
import type { WorkflowModuleConfig } from '@/features/operations/types/workflow';
import { WorkflowCreateStepOneSection } from './components/WorkflowCreateStepOneSection';
import { WorkflowCreateStepTwoSection } from './components/WorkflowCreateStepTwoSection';
import { workflowCreateApi } from './api';
import type {
  ActiveUserOption,
  CreateWorkflowMode,
  CustomerOption,
  ProductBarcodeOption,
  ProductOption,
  ProjectOption,
  SelectedWorkflowItem,
  SelectedWorkflowOrderItem,
  SelectedWorkflowStockItem,
  YapKodOption,
  WarehouseOption,
  WorkflowCreateFormValues,
  WorkflowCreateModuleMeta,
  WorkflowOrder,
  WorkflowOrderItem,
} from './types';

function todayIsoDate(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

function parseDecimalInput(value: string): number {
  const normalized = value.replace(',', '.').trim();
  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildOrderItemId(item: WorkflowOrderItem, index: number): string {
  return item.id || String(item.orderID) + '-' + item.stockCode + '-' + String(index);
}

function isOrderItem(item: SelectedWorkflowItem): item is SelectedWorkflowOrderItem {
  return 'siparisNo' in item;
}

function isStockItem(item: SelectedWorkflowItem): item is SelectedWorkflowStockItem {
  return !('siparisNo' in item);
}

function getModuleMeta(module: WorkflowModuleConfig): WorkflowCreateModuleMeta {
  switch (module.key) {
    case 'transfer':
      return { key: module.key, supportsFreeMode: true, requiresCustomer: true, requiresSourceWarehouse: false, requiresTargetWarehouse: true, requiresOperationType: false, orderOnlyCustomerFlow: true };
    case 'warehouse-inbound':
      return { key: module.key, supportsFreeMode: true, requiresCustomer: true, requiresSourceWarehouse: false, requiresTargetWarehouse: true, requiresOperationType: true, orderOnlyCustomerFlow: true };
    case 'warehouse-outbound':
      return { key: module.key, supportsFreeMode: true, requiresCustomer: true, requiresSourceWarehouse: true, requiresTargetWarehouse: false, requiresOperationType: true, orderOnlyCustomerFlow: true };
    case 'shipment':
      return { key: module.key, supportsFreeMode: true, requiresCustomer: true, requiresSourceWarehouse: true, requiresTargetWarehouse: false, requiresOperationType: false, orderOnlyCustomerFlow: true };
    case 'subcontracting-issue':
    case 'subcontracting-receipt':
      return { key: module.key, supportsFreeMode: true, requiresCustomer: true, requiresSourceWarehouse: true, requiresTargetWarehouse: true, requiresOperationType: false, orderOnlyCustomerFlow: true };
    default:
      throw new Error('Unsupported module');
  }
}

export function WorkflowOrderCreateScreen({
  module,
  forcedMode,
  lockMode = false,
  titleKey,
  subtitleKey,
}: {
  module: WorkflowModuleConfig;
  forcedMode?: CreateWorkflowMode;
  lockMode?: boolean;
  titleKey?: string;
  subtitleKey?: string;
}): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const meta = useMemo(() => getModuleMeta(module), [module]);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [stockTab, setStockTab] = useState<'stocks' | 'selected'>('stocks');
  const [mode, setMode] = useState<CreateWorkflowMode>(forcedMode ?? (module.key === 'warehouse-outbound' ? 'free' : 'order'));
  const [activeOrderNumber, setActiveOrderNumber] = useState<string | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerLocked, setScannerLocked] = useState(false);
  const [customerSheetOpen, setCustomerSheetOpen] = useState(false);
  const [projectSheetOpen, setProjectSheetOpen] = useState(false);
  const [orderSheetOpen, setOrderSheetOpen] = useState(false);
  const [warehouseSheetOpen, setWarehouseSheetOpen] = useState(false);
  const [userSheetOpen, setUserSheetOpen] = useState(false);
  const [stockSheetOpen, setStockSheetOpen] = useState(false);
  const [yapKodSheetOpen, setYapKodSheetOpen] = useState(false);
  const [warehouseTarget, setWarehouseTarget] = useState<'source' | 'target' | string | null>(null);
  const [yapKodTargetItemId, setYapKodTargetItemId] = useState<string | null>(null);
  const [stepOneErrors, setStepOneErrors] = useState<{
    transferDate?: string;
    documentNo?: string;
    customerId?: string;
    sourceWarehouse?: string;
    targetWarehouse?: string;
    operationType?: string;
  }>({});
  const [form, setForm] = useState<WorkflowCreateFormValues>({
    transferDate: todayIsoDate(),
    documentNo: '',
    projectCode: '',
    customerId: '',
    sourceWarehouse: '',
    targetWarehouse: '',
    notes: '',
    userIds: [],
    operationType: '',
  });
  const [selectedItems, setSelectedItems] = useState<SelectedWorkflowItem[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<WorkflowOrder | null>(null);
  const [selectedSourceWarehouse, setSelectedSourceWarehouse] = useState<WarehouseOption | null>(null);
  const [selectedTargetWarehouse, setSelectedTargetWarehouse] = useState<WarehouseOption | null>(null);
  const yapKodTargetItem = selectedItems.find((item) => item.id === yapKodTargetItemId);

  const projectsQuery = useQuery({ queryKey: ['workflow-create', 'projects'], queryFn: ({ signal }) => workflowCreateApi.getProjects({ signal }) });
  const itemsQuery = useQuery({
    queryKey: ['workflow-create', module.key, 'items', activeOrderNumber],
    queryFn: ({ signal }) => workflowCreateApi.getOrderItems(module.key, activeOrderNumber || '', { signal }),
    enabled: mode === 'order' && Boolean(activeOrderNumber),
  });
  const barcodeMutation = useMutation({
    mutationFn: async (barcode: string) => workflowCreateApi.getStokBarcode(barcode),
    onSuccess: (rows) => {
      const barcodeRow = rows[0];
      if (!barcodeRow) {
        showWarning(t('workflowCreate.validation.barcodeNotFound'));
        return;
      }
      toggleBarcodeStockItem(barcodeRow);
      setBarcodeInput('');
    },
    onError: (error: Error) => showError(error, normalizeError(error, t('common.error')).message),
  });

  const createMutation = useMutation({
    mutationFn: () => workflowCreateApi.create(meta, form, selectedItems, mode),
    onSuccess: () => {
      setShowSuccessModal(true);
    },
    onError: (error: Error) => showError(error, normalizeError(error, t('common.error')).message),
  });

  const projects = projectsQuery.data ?? [];
  const orderItems = useMemo(() => (itemsQuery.data ?? []).map((item, index) => ({ ...item, id: buildOrderItemId(item, index) })), [itemsQuery.data]);
  const selectedProject = projects.find((item) => item.projeKod === form.projectCode);

  const setFormValue = <K extends keyof WorkflowCreateFormValues>(key: K, value: WorkflowCreateFormValues[K]) => {
    if (key in stepOneErrors) {
      setStepOneErrors((prev) => ({ ...prev, [key]: undefined }));
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateStepOne = (): boolean => {
    const nextErrors: typeof stepOneErrors = {};

    if (!form.transferDate) {
      nextErrors.transferDate = t('workflowCreate.validation.transferDate');
    }
    if (!form.documentNo.trim()) {
      nextErrors.documentNo = t('workflowCreate.validation.documentNo');
    }
    if ((mode === 'order' || module.key === 'warehouse-outbound') && meta.requiresCustomer && !form.customerId) {
      nextErrors.customerId = t('workflowCreate.validation.customer');
    }
    if ((meta.requiresSourceWarehouse || mode === 'free') && !form.sourceWarehouse) {
      nextErrors.sourceWarehouse = t('workflowCreate.validation.sourceWarehouse');
    }
    if (meta.requiresTargetWarehouse && !form.targetWarehouse) {
      nextErrors.targetWarehouse = t('workflowCreate.validation.targetWarehouse');
    }
    if (meta.requiresOperationType && !form.operationType.trim()) {
      nextErrors.operationType = t('workflowCreate.validation.operationType');
    }

    setStepOneErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      showWarning(t('workflowCreate.validation.baseFields'));
      return false;
    }
    return true;
  };

  const toggleMode = (nextMode: CreateWorkflowMode) => {
    setMode(nextMode);
    setSelectedItems([]);
    setQuantityInputs({});
    setStockTab('stocks');
    setActiveOrderNumber(null);
    setSelectedOrder(null);
    if (nextMode === 'free') {
      setForm((prev) => ({ ...prev, customerId: '', customerRefId: undefined }));
      setSelectedCustomer(null);
    }
  };

  const toggleUser = (user: ActiveUserOption) => {
    setForm((prev) => {
      const exists = prev.userIds.includes(user.id);
      return { ...prev, userIds: exists ? prev.userIds.filter((id) => id !== user.id) : [...prev.userIds, user.id] };
    });
  };

  const toggleOrderItem = (item: WorkflowOrderItem) => {
    const itemId = item.id || '';
    setSelectedItems((prev) => {
      const exists = prev.some((selected) => isOrderItem(selected) && selected.id === itemId);
      if (exists) {
        return prev.filter((selected) => !(isOrderItem(selected) && selected.id === itemId));
      }
      return [...prev, { ...item, id: itemId, transferQuantity: item.remainingForImport || 0, isSelected: true } as SelectedWorkflowOrderItem];
    });
  };

  const toggleStockItem = (item: ProductOption) => {
    addStockItems(item, 1);
  };

  const addStockItems = (item: ProductOption, count: number) => {
    const safeCount = Math.max(1, Math.floor(count));
    const nextItems = Array.from({ length: safeCount }, () => ({
      id: 'stock-' + item.stokKodu + '-' + randomId(),
      stockId: item.id,
      stockCode: item.stokKodu,
      stockName: item.stokAdi,
      unit: item.olcuBr1,
      transferQuantity: 0,
      isSelected: true,
    } as SelectedWorkflowStockItem));

    setSelectedItems((prev) => [...prev, ...nextItems]);
  };

  const removeStockItemsByCode = (stockCode: string, count: number) => {
    const safeCount = Math.max(1, Math.floor(count));
    let remaining = safeCount;

    setSelectedItems((prev) =>
      [...prev].reverse().filter((item) => {
        if (remaining > 0 && isStockItem(item) && item.stockCode === stockCode) {
          remaining -= 1;
          return false;
        }

        return true;
      }).reverse(),
    );
  };

  const toggleBarcodeStockItem = (item: ProductBarcodeOption) => {
    setSelectedItems((prev) => [
      ...prev,
      {
        id: 'barcode-' + item.stokKodu + '-' + randomId(),
        stockCode: item.stokKodu,
        stockName: item.stokAdi,
        unit: item.olcuAdi || '',
        yapKod: item.yapKod || '',
        yapAcik: item.yapAcik || '',
        scannedBarcode: item.barkod,
        transferQuantity: 1,
        isSelected: true,
      } as SelectedWorkflowStockItem,
    ]);
  };

  const updateSelectedItem = (itemId: string, updates: Partial<SelectedWorkflowOrderItem & SelectedWorkflowStockItem>) => {
    setSelectedItems((prev) => prev.map((item) => ('id' in item && item.id === itemId ? { ...item, ...updates } : item)));
  };

  const removeSelectedItem = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((item) => !(('id' in item) && item.id === itemId)));
    setQuantityInputs((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const handleQuantityInputChange = (itemId: string, value: string) => {
    if (!/^\d*([.,]\d*)?$/.test(value)) {
      return;
    }

    setQuantityInputs((prev) => ({ ...prev, [itemId]: value }));

    const normalized = value.replace(',', '.').trim();
    if (!normalized || normalized.endsWith('.') || normalized.endsWith(',')) {
      return;
    }

    const quantity = Number(normalized);
    if (!Number.isFinite(quantity)) {
      return;
    }

    updateSelectedItem(itemId, { transferQuantity: quantity });
  };

  const handleQuantityBlur = (itemId: string, fallbackQuantity: number) => {
    const rawValue = quantityInputs[itemId];
    const normalized = (rawValue ?? String(fallbackQuantity)).replace(',', '.').trim();

    if (!normalized) {
      removeSelectedItem(itemId);
      return;
    }

    const quantity = Number(normalized);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      removeSelectedItem(itemId);
      return;
    }

    updateSelectedItem(itemId, { transferQuantity: quantity });
    setQuantityInputs((prev) => ({ ...prev, [itemId]: String(quantity) }));
  };

  const handleWarehouseSelect = (warehouse: WarehouseOption) => {
    if (warehouseTarget === 'source') {
      setFormValue('sourceWarehouse', String(warehouse.depoKodu));
      setFormValue('sourceWarehouseRefId', warehouse.id);
      setSelectedSourceWarehouse(warehouse);
    } else if (warehouseTarget === 'target') {
      setFormValue('targetWarehouse', String(warehouse.depoKodu));
      setFormValue('targetWarehouseRefId', warehouse.id);
      setSelectedTargetWarehouse(warehouse);
    } else if (warehouseTarget) {
      updateSelectedItem(warehouseTarget, { sourceWarehouse: warehouse.depoKodu });
    }
  };

  const handleSave = () => {
    if (selectedItems.length === 0) {
      showWarning(t('workflowCreate.validation.selectAtLeastOne'));
      return;
    }
    if (selectedItems.some((item) => !item.transferQuantity || item.transferQuantity <= 0)) {
      showWarning(t('workflowCreate.validation.quantity'));
      return;
    }
    createMutation.mutate();
  };

  const loadingBase = projectsQuery.isLoading;
  const freeModeLabel = module.key === 'warehouse-outbound' ? t('workflowCreate.modeProcess') : t('workflowCreate.modeFree');

  React.useEffect(() => {
    if (forcedMode) {
      setMode(forcedMode);
    }
  }, [forcedMode]);

  const handleBarcodeSearch = () => {
    if (!barcodeInput.trim()) {
      showWarning(t('workflowCreate.validation.enterBarcode'));
      return;
    }
    barcodeMutation.mutate(barcodeInput.trim());
  };

  const openScanner = async () => {
    const result = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!result?.granted) {
      showWarning(t('workflowCreate.validation.cameraPermission'));
      return;
    }
    setScannerLocked(false);
    setScannerOpen(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scannerLocked || !data) return;
    setScannerLocked(true);
    setBarcodeInput(data);
    setScannerOpen(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeft01Icon size={18} color={theme.colors.text} />
        <Text style={[styles.backText, { color: theme.colors.textSecondary }]}>{t('common.back')}</Text>
      </Pressable>

      <View style={[styles.hero, { backgroundColor: theme.colors.card, borderColor: module.accent + '44' }]}>
        <Text style={styles.heroTitle}>{t(titleKey || module.createTitleKey)}</Text>
        <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>{t(subtitleKey || 'workflowCreate.subtitle')}</Text>
      </View>

      {meta.supportsFreeMode && !lockMode ? (
        <View style={styles.modeRow}>
          <Pressable style={[styles.modeChip, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }, mode === 'order' ? [styles.modeChipActive, { borderColor: theme.colors.primary }] : null]} onPress={() => toggleMode('order')}>
            <Text style={styles.modeText}>{t('workflowCreate.modeOrder')}</Text>
          </Pressable>
          <Pressable style={[styles.modeChip, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }, mode === 'free' ? [styles.modeChipActive, { borderColor: theme.colors.primary }] : null]} onPress={() => toggleMode('free')}>
            <Text style={styles.modeText}>{freeModeLabel}</Text>
          </Pressable>
        </View>
      ) : null}

      {loadingBase ? <ScreenState tone='loading' title={t('common.loading')} compact /> : null}

      {currentStep === 1 ? (
        <WorkflowCreateStepOneSection
          form={form}
          meta={meta}
          mode={mode}
          moduleKey={module.key}
          stepOneErrors={stepOneErrors}
          selectedCustomer={selectedCustomer ?? undefined}
          selectedProject={selectedProject}
          selectedSourceWarehouse={selectedSourceWarehouse ?? undefined}
          selectedTargetWarehouse={selectedTargetWarehouse ?? undefined}
          onChange={setFormValue}
          onOpenCustomer={() => setCustomerSheetOpen(true)}
          onOpenProject={() => setProjectSheetOpen(true)}
          onOpenSourceWarehouse={() => { setWarehouseTarget('source'); setWarehouseSheetOpen(true); }}
          onOpenTargetWarehouse={() => { setWarehouseTarget('target'); setWarehouseSheetOpen(true); }}
          onOpenUsers={() => setUserSheetOpen(true)}
        />
      ) : (
        <WorkflowCreateStepTwoSection
          module={module}
          mode={mode}
          stockTab={stockTab}
          setStockTab={setStockTab}
          formCustomerId={form.customerId}
          selectedOrder={selectedOrder}
          activeOrderNumber={activeOrderNumber}
          onOpenOrderPicker={() => setOrderSheetOpen(true)}
          orderItems={orderItems}
          selectedItems={selectedItems}
          toggleOrderItem={toggleOrderItem}
          barcodeInput={barcodeInput}
          setBarcodeInput={setBarcodeInput}
          handleBarcodeSearch={handleBarcodeSearch}
          barcodePending={barcodeMutation.isPending}
          openScanner={openScanner}
          scannerOpen={scannerOpen}
          handleBarcodeScanned={handleBarcodeScanned}
          closeScanner={() => {
            setScannerOpen(false);
            setScannerLocked(false);
          }}
          openStockPicker={() => setStockSheetOpen(true)}
          quantityInputs={quantityInputs}
          handleQuantityInputChange={handleQuantityInputChange}
          handleQuantityBlur={handleQuantityBlur}
          removeSelectedItem={removeSelectedItem}
          updateSelectedItem={updateSelectedItem}
          setWarehouseTarget={setWarehouseTarget}
          setWarehouseSheetOpen={setWarehouseSheetOpen}
          openYapKodPicker={(itemId) => {
            setYapKodTargetItemId(itemId);
            setYapKodSheetOpen(true);
          }}
          isOrderItem={isOrderItem}
          isStockItem={isStockItem}
        />
      )}

      <View style={styles.footerRow}>
        {currentStep === 1 ? (
          <Button title={t('common.next')} onPress={() => { if (validateStepOne()) setCurrentStep(2); }} />
        ) : (
          <>
            <Button title={t('common.previous')} onPress={() => setCurrentStep(1)} style={styles.footerButton} />
            <Button title={t('common.save')} onPress={handleSave} loading={createMutation.isPending} style={styles.footerButton} />
          </>
        )}
      </View>

      <PagedSelectionSheet<CustomerOption>
        visible={customerSheetOpen}
        title={t('workflowCreate.fields.customer')}
        placeholder={t('workflowCreate.placeholders.customerSearch')}
        emptyText={t('workflowCreate.emptySearch')}
        selectedValue={form.customerId}
        queryKey={['workflow-create', 'customers-paged']}
        fetchPage={({ pageNumber, pageSize, search, signal }) => workflowCreateApi.getCustomersPaged(pageNumber, pageSize, search, { signal })}
        getValue={(item) => item.cariKod}
        getLabel={(item) => item.cariIsim + ' (' + item.cariKod + ')'}
        onSelect={(item) => {
          setSelectedCustomer(item);
          setFormValue('customerId', item.cariKod);
          setFormValue('customerRefId', item.id);
          setSelectedItems([]);
          setActiveOrderNumber(null);
          setSelectedOrder(null);
        }}
        onClose={() => setCustomerSheetOpen(false)}
      />

      <SelectionSheet<ProjectOption>
        visible={projectSheetOpen}
        title={t('workflowCreate.fields.project')}
        placeholder={t('workflowCreate.placeholders.projectSearch')}
        emptyText={t('workflowCreate.emptySearch')}
        items={projects}
        selectedValue={form.projectCode}
        getValue={(item) => item.projeKod}
        getLabel={(item) => item.projeAciklama + ' (' + item.projeKod + ')'}
        onSelect={(item) => setFormValue('projectCode', item.projeKod)}
        onClose={() => setProjectSheetOpen(false)}
      />

      <PagedSelectionSheet<WorkflowOrder>
        visible={orderSheetOpen}
        title={t('workflowCreate.pickOrder')}
        placeholder={t('workflowCreate.placeholders.orderSearch')}
        emptyText={t('workflowCreate.noOrderSelected')}
        selectedValue={activeOrderNumber ?? undefined}
        queryKey={['workflow-create', module.key, 'order-picker', form.customerId]}
        fetchPage={({ pageNumber, pageSize, search, signal }) =>
          workflowCreateApi.getOrdersByCustomerClientSliced(module.key, form.customerId, pageNumber, pageSize, search, { signal })
        }
        getValue={(item) => item.siparisNo}
        getLabel={(item) => `${item.siparisNo} · ${item.customerName || item.customerCode || '-'}${item.projectCode ? ` · ${item.projectCode}` : ''}`}
        onSelect={(item) => {
          setSelectedOrder(item);
          setActiveOrderNumber(item.siparisNo);
        }}
        onClose={() => setOrderSheetOpen(false)}
      />

      <PagedSelectionSheet<WarehouseOption>
        visible={warehouseSheetOpen}
        title={t('workflowCreate.fields.warehouse')}
        placeholder={t('workflowCreate.placeholders.warehouseSearch')}
        emptyText={t('workflowCreate.emptySearch')}
        selectedValue={
          warehouseTarget === 'source'
            ? form.sourceWarehouse
            : warehouseTarget === 'target'
              ? form.targetWarehouse
              : undefined
        }
        queryKey={['workflow-create', 'warehouses-paged', warehouseTarget]}
        fetchPage={({ pageNumber, pageSize, search, signal }) => workflowCreateApi.getWarehousesPaged(pageNumber, pageSize, search, { signal })}
        getValue={(item) => String(item.depoKodu)}
        getLabel={(item) => item.depoIsmi + ' (' + String(item.depoKodu) + ')'}
        onSelect={handleWarehouseSelect}
        onClose={() => { setWarehouseTarget(null); setWarehouseSheetOpen(false); }}
      />

      <PagedSelectionSheet<ProductOption>
        visible={stockSheetOpen}
        title={t('workflowCreate.pickStock')}
        placeholder={t('workflowCreate.placeholders.stockSearch')}
        emptyText={t('workflowCreate.emptySearch')}
        queryKey={['workflow-create', 'products-paged']}
        fetchPage={({ pageNumber, pageSize, search, signal }) => workflowCreateApi.getProductsPaged(pageNumber, pageSize, search, { signal })}
        getValue={(item) => item.stokKodu}
        getLabel={(item) => item.stokAdi + ' (' + item.stokKodu + ')'}
        onSelect={toggleStockItem}
        onClose={() => setStockSheetOpen(false)}
      />

      <PagedSelectionSheet<YapKodOption>
        visible={yapKodSheetOpen}
        title={t('workflowCreate.fields.configCode')}
        placeholder={t('workflowCreate.fields.configCode')}
        emptyText={t('workflowCreate.emptySearch')}
        queryKey={['workflow-create', 'yapkod-paged', yapKodTargetItem?.stockId ?? yapKodTargetItem?.stockCode ?? 'none']}
        fetchPage={({ pageNumber, pageSize, search, signal }) =>
          workflowCreateApi.getYapKodlarPaged(
            pageNumber,
            pageSize,
            search,
            { stockId: yapKodTargetItem?.stockId, stockCode: yapKodTargetItem?.stockCode },
            { signal },
          )
        }
        getValue={(item) => item.yapKod}
        getLabel={(item) => item.yapAcik ? item.yapAcik + ' (' + item.yapKod + ')' : item.yapKod}
        onSelect={(item) => {
          if (!yapKodTargetItemId) return;
          updateSelectedItem(yapKodTargetItemId, {
            configCode: item.yapKod,
            yapKod: item.yapKod,
            yapKodId: item.id,
          });
        }}
        onClose={() => {
          setYapKodTargetItemId(null);
          setYapKodSheetOpen(false);
        }}
      />

      <PagedSelectionSheet<ActiveUserOption>
        visible={userSheetOpen}
        title={t('workflowCreate.fields.users')}
        placeholder={t('workflowCreate.placeholders.userSearch')}
        emptyText={t('workflowCreate.emptySearch')}
        selectedValue={undefined}
        queryKey={['workflow-create', 'users-paged']}
        fetchPage={({ pageNumber, pageSize, search, signal }) => workflowCreateApi.getActiveUsersPaged(pageNumber, pageSize, search, { signal })}
        getValue={(item) => String(item.id)}
        getLabel={(item) => item.fullName || item.username}
        onSelect={toggleUser}
        onClose={() => setUserSheetOpen(false)}
      />

      <AppDialog
        visible={showSuccessModal}
        title={t('workflowCreate.successTitle')}
        description={t('workflowCreate.successMessage')}
        onClose={() => setShowSuccessModal(false)}
        actions={[
          {
            label: t('common.continue'),
            onPress: () => {
              setShowSuccessModal(false);
              router.replace((`/(tabs)/flows/${module.key}`) as never);
            },
          },
        ]}
      />
    </ScrollView>
  );
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const styles = StyleSheet.create({
  content: { padding: LAYOUT.screenPadding, paddingBottom: 140, gap: SPACING.md },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  backText: { color: COLORS.textSecondary, fontWeight: '700' },
  hero: { padding: SPACING.lg, borderRadius: RADII.xl, backgroundColor: COLORS.card, borderWidth: 1, gap: SPACING.xs },
  heroTitle: { fontSize: 24, fontWeight: '900' },
  heroSubtitle: { color: COLORS.textSecondary, lineHeight: 20 },
  modeRow: { flexDirection: 'row', gap: 10 },
  modeChip: { flex: 1, minHeight: 44, borderRadius: RADII.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceStrong },
  modeChipActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(56,189,248,0.12)' },
  modeText: { fontWeight: '800' },
  footerRow: { flexDirection: 'row', gap: 12 },
  footerButton: { flex: 1 },
});
