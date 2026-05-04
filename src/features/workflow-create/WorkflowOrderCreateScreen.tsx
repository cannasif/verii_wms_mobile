import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { ArrowLeft01Icon, ArrowRight01Icon } from 'hugeicons-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { styles as grStyles } from '@/features/goods-receipt-create/components/styles';
import { Button } from '@/components/ui/Button';
import { AppDialog } from '@/components/ui/AppDialog';
import { ScreenState } from '@/components/ui/ScreenState';
import { Text } from '@/components/ui/Text';
import { PagedSelectionSheet } from '@/components/ui/PagedSelectionSheet';
import { hasPermission } from '@/features/auth/utils/permissions';
import { normalizeError } from '@/lib/errors';
import { showError, showWarning } from '@/lib/feedback';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/store/auth';
import { SelectionSheet } from '@/features/goods-receipt-create/components/SelectionSheet';
import type { WorkflowModuleConfig } from '@/features/operations/types/workflow';
import { WorkflowIcon } from '@/features/operations/screens/WorkflowIcon';
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
  const permissions = useAuthStore((state) => state.permissions);
  const meta = useMemo(() => getModuleMeta(module), [module]);
  const canCreate = hasPermission(permissions, module.createPermissionCode);
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
  const [searchOrders, setSearchOrders] = useState('');
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
  const ordersQuery = useQuery({
    queryKey: ['workflow-create', module.key, 'orders', form.customerId, mode],
    queryFn: ({ signal }) => workflowCreateApi.getOrdersByCustomer(module.key, form.customerId, { signal }),
    enabled: mode === 'order' && Boolean(form.customerId),
  });
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
  const orders = ordersQuery.data ?? [];
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
    setSearchOrders('');
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
    if (!canCreate) {
      showWarning(t('workflowCreate.permissionDeniedDescription', { title: t(titleKey || module.createTitleKey) }));
      return;
    }
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

  const handleSelectOrder = (order: WorkflowOrder) => {
    setSelectedOrder(order);
    setActiveOrderNumber(order.siparisNo);
  };

  return (
    <ScrollView contentContainerStyle={[grStyles.content, { backgroundColor: theme.colors.background }]}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [
          grStyles.backButton,
          currentStep === 2 ? [grStyles.backPill, grStyles.backPillStep2] : null,
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
        style={[grStyles.hero, { borderColor: theme.colors.navBorder }]}
      >
        <View style={grStyles.heroInfoRow}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[grStyles.infoTitle, { color: theme.colors.text }]}>{t(titleKey || module.createTitleKey)}</Text>
            <Text style={[grStyles.infoShort, { color: theme.colors.textSecondary }]}>{t(module.createDescriptionKey)}</Text>
            <Text style={[grStyles.infoLine2, { color: theme.colors.textSecondary }]}>{t(module.createInfoLine2Key)}</Text>
          </View>
          <View
            style={[
              grStyles.heroIconBtn,
              {
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                borderWidth: 1.5,
                borderColor: 'rgba(14, 165, 233, 0.35)',
              },
            ]}
          >
            <WorkflowIcon module={module} color={module.accent} size={22} />
          </View>
        </View>
      </LinearGradient>

      {!canCreate ? (
        <ScreenState
          tone="error"
          title={t('workflowCreate.permissionDeniedTitle')}
          description={t('workflowCreate.permissionDeniedDescription', {
            title: t(titleKey || module.createTitleKey),
          })}
        />
      ) : null}

      {meta.supportsFreeMode && !lockMode ? (
        <View style={grStyles.modeRow}>
          <Pressable
            style={[
              grStyles.modeChip,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong },
              mode === 'order' ? [grStyles.modeChipActive, { borderColor: theme.colors.primary }] : null,
            ]}
            onPress={() => toggleMode('order')}
          >
            <Text style={[grStyles.modeChipText, { color: theme.colors.text }]}>{t('workflowCreate.modeOrder')}</Text>
          </Pressable>
          <Pressable
            style={[
              grStyles.modeChip,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong },
              mode === 'free' ? [grStyles.modeChipActive, { borderColor: theme.colors.primary }] : null,
            ]}
            onPress={() => toggleMode('free')}
          >
            <Text style={[grStyles.modeChipText, { color: theme.colors.text }]}>{freeModeLabel}</Text>
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
          searchOrders={searchOrders}
          setSearchOrders={setSearchOrders}
          orders={orders}
          ordersLoading={ordersQuery.isLoading}
          activeOrderNumber={activeOrderNumber}
          onSelectOrder={handleSelectOrder}
          orderItems={orderItems}
          orderItemsLoading={itemsQuery.isLoading}
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

      {currentStep === 1 ? (
        <Pressable
            onPress={() => {
              if (validateStepOne()) {
                setCurrentStep(2);
              }
            }}
            disabled={!canCreate}
            style={({ pressed }) => [{ width: '100%', opacity: pressed ? 0.92 : 1 }]}
            accessibilityLabel={t('common.continue')}
          >
          <LinearGradient
            colors={Array.from(theme.gradients.primary) as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={grStyles.continueBtn}
          >
            <Text style={grStyles.continueText}>{t('common.continue')}</Text>
            <ArrowRight01Icon size={20} color="#fff" />
          </LinearGradient>
        </Pressable>
      ) : (
        <View style={grStyles.footerRow}>
          <Pressable
            onPress={() => setCurrentStep(1)}
            style={({ pressed }) => [
              grStyles.footerBackBtn,
              {
                borderColor: 'rgba(239, 68, 68, 0.3)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            accessibilityLabel={t('common.back')}
          >
            <Text style={[styles.backFooterLabel, { color: 'rgba(220, 38, 38, 0.95)' }]}>{t('common.back')}</Text>
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Button
              title={createMutation.isPending ? t('common.loading') : t('common.save')}
              onPress={handleSave}
              disabled={!canCreate}
              loading={createMutation.isPending}
            />
          </View>
        </View>
      )}

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
          setSearchOrders('');
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
  backFooterLabel: { fontWeight: '800' },
});
