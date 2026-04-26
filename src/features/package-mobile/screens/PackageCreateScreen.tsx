import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckmarkCircle02Icon, PackageIcon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { goodsReceiptCreateApi } from '@/features/goods-receipt-create/api';
import type { Warehouse } from '@/features/goods-receipt-create/types';
import { PageShell } from '@/components/layout/PageShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { Text } from '@/components/ui/Text';
import { LAYOUT, RADII, SPACING, type AppTheme } from '@/constants/theme';
import { showError, showSuccess } from '@/lib/feedback';
import { normalizeError } from '@/lib/errors';
import { useTheme } from '@/providers/ThemeProvider';
import { packageMobileApi } from '../api';
import type { CreatePHeaderDto, CreatePLineDto, CreatePPackageDto } from '../packaging-types';
import {
  PACKAGING_PACKAGE_TYPES,
  PACKAGING_SOURCE_TYPES,
  type PackagingPackageType,
  type PackagingSourceType,
} from '../packaging-types';

const MAX_PACKING_NO = 50;
const MAX_WAREHOUSE_CODE = 20;
const MAX_PACKAGE_NO = 50;
const MAX_BARCODE_PACKAGE = 100;
const MAX_BARCODE_LINE = 50;
const MAX_STOCK_CODE = 50;
const MAX_CUSTOMER_CODE = 50;
const MAX_SERIAL = 50;

function clip(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

function parsePositiveNumber(raw: string): number | null {
  const n = Number(String(raw).replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return n;
}

function parseOptionalInt(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) {
    return undefined;
  }
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : undefined;
}

function suggestPackingNo(): string {
  return clip(`PK-${Date.now().toString(36).toUpperCase()}`, MAX_PACKING_NO);
}

function inputSurface(theme: AppTheme, multiline?: boolean) {
  return {
    borderWidth: 1,
    borderRadius: RADII.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: multiline ? SPACING.md : SPACING.sm + 2,
    minHeight: multiline ? 88 : LAYOUT.inputHeight - 4,
    fontSize: 15,
    fontWeight: '600' as const,
    color: theme.colors.text,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceStrong,
    textAlignVertical: (multiline ? 'top' : 'center') as 'top' | 'center',
  };
}

export function PackageCreateScreen(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [flow, setFlow] = useState<'manual' | 'auto'>('manual');
  const [manualStep, setManualStep] = useState<1 | 2 | 3>(1);

  const [packingNo, setPackingNo] = useState(suggestPackingNo);
  const [warehouseCode, setWarehouseCode] = useState('');
  const [packingDate, setPackingDate] = useState('');
  const [sourceType, setSourceType] = useState<PackagingSourceType | ''>('');
  const [sourceHeaderIdRaw, setSourceHeaderIdRaw] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [isMatched, setIsMatched] = useState(false);

  const [createdHeaderId, setCreatedHeaderId] = useState<number | null>(null);
  const [createdPackingNo, setCreatedPackingNo] = useState<string | null>(null);

  const [packageNo, setPackageNo] = useState('');
  const [packageType, setPackageType] = useState<PackagingPackageType>('Box');
  const [packageBarcode, setPackageBarcode] = useState('');
  const [packagingMaterialIdRaw, setPackagingMaterialIdRaw] = useState('');
  const [parentPackageId, setParentPackageId] = useState<number | null>(null);
  const [currentWarehouseIdRaw, setCurrentWarehouseIdRaw] = useState('');
  const [currentShelfIdRaw, setCurrentShelfIdRaw] = useState('');

  const [createdPackageId, setCreatedPackageId] = useState<number | null>(null);

  const [lineStockCode, setLineStockCode] = useState('');
  const [lineQuantityRaw, setLineQuantityRaw] = useState('');
  const [lineYapKodIdRaw, setLineYapKodIdRaw] = useState('');
  const [lineSerialRaw, setLineSerialRaw] = useState('');

  const [autoSourceType, setAutoSourceType] = useState<PackagingSourceType>('GR');
  const [autoSourceHeaderIdRaw, setAutoSourceHeaderIdRaw] = useState('');
  const [autoMatch, setAutoMatch] = useState(true);
  const [autoCreatePallets, setAutoCreatePallets] = useState(true);
  const [autoReuse, setAutoReuse] = useState(true);

  const [warehouseModal, setWarehouseModal] = useState(false);

  const warehousesQuery = useQuery({
    queryKey: ['package-create', 'warehouses'],
    queryFn: ({ signal }) => goodsReceiptCreateApi.getWarehouses({ signal }),
  });

  const packagesForParentQuery = useQuery({
    queryKey: ['package-mobile', 'header-flat', createdHeaderId],
    queryFn: ({ signal }) => packageMobileApi.getPackagesByHeader(createdHeaderId!, { signal }),
    enabled: flow === 'manual' && manualStep >= 2 && createdHeaderId != null,
  });

  const linesQuery = useQuery({
    queryKey: ['package-mobile', 'plines-package', createdPackageId],
    queryFn: ({ signal }) => packageMobileApi.getPLinesByPackage(createdPackageId!, { signal }),
    enabled: flow === 'manual' && manualStep === 3 && createdPackageId != null,
  });

  const invalidateLines = useCallback(() => {
    if (createdPackageId != null) {
      void queryClient.invalidateQueries({ queryKey: ['package-mobile', 'plines-package', createdPackageId] });
    }
  }, [createdPackageId, queryClient]);

  const headerMutation = useMutation({
    mutationFn: async () => {
      const trimmedNo = packingNo.trim();
      if (!trimmedNo) {
        throw new Error(t('packageMobile.create.validation.packingNo'));
      }
      const dto: CreatePHeaderDto = {
        packingNo: clip(trimmedNo, MAX_PACKING_NO),
        warehouseCode: warehouseCode.trim() ? clip(warehouseCode.trim(), MAX_WAREHOUSE_CODE) : undefined,
        packingDate: packingDate.trim() || undefined,
        sourceType: sourceType || undefined,
        sourceHeaderId: parseOptionalInt(sourceHeaderIdRaw),
        customerCode: customerCode.trim() ? clip(customerCode.trim(), MAX_CUSTOMER_CODE) : undefined,
        isMatched,
      };
      return packageMobileApi.createPHeader(dto);
    },
    onSuccess: (data) => {
      setCreatedHeaderId(data.id);
      setCreatedPackingNo(data.packingNo);
      setManualStep(2);
      void queryClient.invalidateQueries({ queryKey: ['package-mobile', 'headers'] });
    },
    onError: (e: Error) => showError(e, normalizeError(e, t('packageMobile.create.errors.headerCreate')).message),
  });

  const packageMutation = useMutation({
    mutationFn: async () => {
      if (createdHeaderId == null) {
        throw new Error(t('packageMobile.create.errors.headerCreate'));
      }
      const trimmedNo = packageNo.trim();
      if (!trimmedNo) {
        throw new Error(t('packageMobile.create.validation.packageNo'));
      }
      const dto: CreatePPackageDto = {
        packingHeaderId: createdHeaderId,
        packageNo: clip(trimmedNo, MAX_PACKAGE_NO),
        packageType,
        barcode: packageBarcode.trim() ? clip(packageBarcode.trim(), MAX_BARCODE_PACKAGE) : undefined,
        parentPackageId: parentPackageId ?? undefined,
        packagingMaterialId: parseOptionalInt(packagingMaterialIdRaw),
        currentWarehouseId: parseOptionalInt(currentWarehouseIdRaw),
        currentShelfId: parseOptionalInt(currentShelfIdRaw),
      };
      return packageMobileApi.createPPackage(dto);
    },
    onSuccess: (data) => {
      setCreatedPackageId(data.id);
      setManualStep(3);
      void queryClient.invalidateQueries({ queryKey: ['package-mobile', 'header-flat', createdHeaderId] });
    },
    onError: (e: Error) => showError(e, normalizeError(e, t('packageMobile.create.errors.packageCreate')).message),
  });

  const lineMutation = useMutation({
    mutationFn: async () => {
      if (createdHeaderId == null || createdPackageId == null) {
        throw new Error(t('packageMobile.create.errors.lineCreate'));
      }
      const code = lineStockCode.trim();
      if (!code) {
        throw new Error(t('packageMobile.create.validation.stockCode'));
      }
      const qty = parsePositiveNumber(lineQuantityRaw);
      if (qty == null) {
        throw new Error(t('packageMobile.create.validation.quantityParse'));
      }
      const dto: CreatePLineDto = {
        packingHeaderId: createdHeaderId,
        packageId: createdPackageId,
        stockCode: clip(code, MAX_STOCK_CODE),
        quantity: qty,
        yapKodId: parseOptionalInt(lineYapKodIdRaw),
        serialNo: lineSerialRaw.trim() ? clip(lineSerialRaw.trim(), MAX_SERIAL) : undefined,
      };
      return packageMobileApi.createPLine(dto);
    },
    onSuccess: () => {
      setLineStockCode('');
      setLineQuantityRaw('');
      setLineYapKodIdRaw('');
      setLineSerialRaw('');
      invalidateLines();
      void queryClient.invalidateQueries({ queryKey: ['package-mobile', 'headers'] });
    },
    onError: (e: Error) => {
      invalidateLines();
      showError(e, normalizeError(e, t('packageMobile.create.errors.lineCreate')).message);
    },
  });

  const autoMutation = useMutation({
    mutationFn: async () => {
      const sid = parseOptionalInt(autoSourceHeaderIdRaw);
      if (sid === undefined) {
        throw new Error(t('packageMobile.create.validation.sourceHeaderId'));
      }
      return packageMobileApi.autoPackageFromSource({
        sourceType: autoSourceType,
        sourceHeaderId: sid,
        autoMatch,
        createPallets: autoCreatePallets,
        reuseExistingPackingHeader: autoReuse,
      });
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['package-mobile', 'headers'] });
      showSuccess(
        t('packageMobile.create.autoSuccess', {
          packages: data.createdPackageCount,
          lines: data.createdLineCount,
          packingNo: data.packingNo,
        }),
      );
      router.replace(`/(tabs)/inventory/packages/${data.packingHeaderId}` as never);
    },
    onError: (e: Error) => showError(e, normalizeError(e, t('packageMobile.create.errors.autoPackage')).message),
  });

  const warehouses = warehousesQuery.data ?? [];

  const stepLabel = useMemo(() => {
    if (flow === 'auto') {
      return '';
    }
    if (manualStep === 1) {
      return t('packageMobile.create.stepHeader');
    }
    if (manualStep === 2) {
      return t('packageMobile.create.stepPackage');
    }
    return t('packageMobile.create.stepLines');
  }, [flow, manualStep, t]);

  const parentCandidates = packagesForParentQuery.data ?? [];

  const onSelectWarehouse = (w: Warehouse) => {
    setWarehouseCode(clip(String(w.depoKodu), MAX_WAREHOUSE_CODE));
    setWarehouseModal(false);
  };

  const chipsRow = (types: readonly string[], selected: string, onSelect: (v: string) => void) => (
    <View style={styles.chipRow}>
      {types.map((v) => {
        const active = selected === v;
        return (
          <Pressable
            key={v}
            onPress={() => onSelect(v)}
            style={[
              styles.chip,
              {
                borderColor: active ? theme.colors.primary : theme.colors.border,
                backgroundColor: active ? (theme.mode === 'light' ? 'rgba(2,132,199,0.10)' : 'rgba(56,189,248,0.14)') : theme.colors.surfaceStrong,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: active ? theme.colors.primaryStrong : theme.colors.textSecondary }]}>{v}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <PageShell scroll contentContainerStyle={{ paddingBottom: SPACING.xxl }}>
      <ScreenHeader title={t('packageMobile.create.title')} subtitle={t('packageMobile.create.subtitle')} />

      <View style={[styles.modeBar, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]}>
        <Pressable
          onPress={() => {
            setFlow('manual');
            setManualStep(1);
          }}
          style={[
            styles.modeHalf,
            flow === 'manual' && { backgroundColor: theme.mode === 'light' ? 'rgba(2,132,199,0.12)' : 'rgba(56,189,248,0.16)' },
          ]}
        >
          <Text style={[styles.modeText, { color: flow === 'manual' ? theme.colors.primaryStrong : theme.colors.textMuted }]}>
            {t('packageMobile.create.modeManual')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFlow('auto')}
          style={[
            styles.modeHalf,
            flow === 'auto' && { backgroundColor: theme.mode === 'light' ? 'rgba(2,132,199,0.12)' : 'rgba(56,189,248,0.16)' },
          ]}
        >
          <Text style={[styles.modeText, { color: flow === 'auto' ? theme.colors.primaryStrong : theme.colors.textMuted }]}>
            {t('packageMobile.create.modeAuto')}
          </Text>
        </Pressable>
      </View>

      {flow === 'manual' ? (
        <View style={[styles.stepRail, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <PackageIcon size={20} color={theme.colors.accent} />
          <Text style={[styles.stepRailText, { color: theme.colors.textSecondary }]}>{stepLabel}</Text>
        </View>
      ) : null}

      {flow === 'manual' && manualStep === 1 ? (
        <SectionCard title={t('packageMobile.create.headerCardTitle')} subtitle={t('packageMobile.create.headerCardSubtitle')}>
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>{t('packageMobile.create.packingNo')}</Text>
          <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>{t('packageMobile.create.packingNoHint')}</Text>
          <TextInput
            value={packingNo}
            onChangeText={(v) => setPackingNo(clip(v, MAX_PACKING_NO))}
            placeholder={t('packageMobile.create.packingNo')}
            placeholderTextColor={theme.colors.inputPlaceholder}
            style={inputSurface(theme)}
            autoCapitalize='characters'
          />

          <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: SPACING.md }]}>{t('packageMobile.create.warehouseCode')}</Text>
          <View style={styles.rowGap}>
            <TextInput
              value={warehouseCode}
              onChangeText={(v) => setWarehouseCode(clip(v, MAX_WAREHOUSE_CODE))}
              placeholder={t('packageMobile.create.warehouseCode')}
              placeholderTextColor={theme.colors.inputPlaceholder}
              style={[inputSurface(theme), { flex: 1 }]}
            />
            <Pressable
              onPress={() => setWarehouseModal(true)}
              style={[styles.sideBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]}
            >
              <Text style={[styles.sideBtnText, { color: theme.colors.primary }]}>{t('packageMobile.create.selectWarehouse')}</Text>
            </Pressable>
          </View>

          <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: SPACING.md }]}>{t('packageMobile.create.packingDate')}</Text>
          <View style={styles.rowGap}>
            <TextInput
              value={packingDate}
              onChangeText={setPackingDate}
              placeholder='2026-04-26T12:00:00.000Z'
              placeholderTextColor={theme.colors.inputPlaceholder}
              style={[inputSurface(theme), { flex: 1 }]}
              autoCapitalize='none'
            />
            <Pressable
              onPress={() => setPackingDate(new Date().toISOString())}
              style={[styles.sideBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]}
            >
              <Text style={[styles.sideBtnText, { color: theme.colors.primary }]}>{t('packageMobile.create.packingDateNow')}</Text>
            </Pressable>
          </View>

          <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: SPACING.md }]}>{t('packageMobile.create.sourceType')}</Text>
          <View style={styles.chipRow}>
            <Pressable
              onPress={() => setSourceType('')}
              style={[
                styles.chip,
                {
                  borderColor: !sourceType ? theme.colors.primary : theme.colors.border,
                  backgroundColor: !sourceType ? (theme.mode === 'light' ? 'rgba(2,132,199,0.10)' : 'rgba(56,189,248,0.14)') : theme.colors.surfaceStrong,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: !sourceType ? theme.colors.primaryStrong : theme.colors.textSecondary }]}>
                {t('packageMobile.create.sourceTypeNone')}
              </Text>
            </Pressable>
            {PACKAGING_SOURCE_TYPES.map((v) => (
              <Pressable
                key={v}
                onPress={() => setSourceType(v)}
                style={[
                  styles.chip,
                  {
                    borderColor: sourceType === v ? theme.colors.primary : theme.colors.border,
                    backgroundColor:
                      sourceType === v ? (theme.mode === 'light' ? 'rgba(2,132,199,0.10)' : 'rgba(56,189,248,0.14)') : theme.colors.surfaceStrong,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: sourceType === v ? theme.colors.primaryStrong : theme.colors.textSecondary }]}>{v}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: SPACING.md }]}>{t('packageMobile.create.sourceHeaderId')}</Text>
          <TextInput
            value={sourceHeaderIdRaw}
            onChangeText={(v) => setSourceHeaderIdRaw(v.replace(/[^\d]/g, ''))}
            placeholder='0'
            keyboardType='number-pad'
            placeholderTextColor={theme.colors.inputPlaceholder}
            style={inputSurface(theme)}
          />

          <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: SPACING.md }]}>{t('packageMobile.create.customerCode')}</Text>
          <TextInput
            value={customerCode}
            onChangeText={(v) => setCustomerCode(clip(v, MAX_CUSTOMER_CODE))}
            placeholder={t('packageMobile.create.customerCode')}
            placeholderTextColor={theme.colors.inputPlaceholder}
            style={inputSurface(theme)}
          />

          <View style={[styles.switchRow, { marginTop: SPACING.md }]}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.label, { color: theme.colors.text, marginTop: 0 }]}>{t('packageMobile.create.isMatched')}</Text>
              <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>{t('packageMobile.create.isMatchedHint')}</Text>
            </View>
            <Switch value={isMatched} onValueChange={setIsMatched} trackColor={{ false: theme.colors.border, true: theme.colors.primary }} />
          </View>

          <Button
            title={headerMutation.isPending ? t('packageMobile.create.creatingHeader') : t('packageMobile.create.createHeader')}
            onPress={() => headerMutation.mutate()}
            loading={headerMutation.isPending}
            style={{ marginTop: SPACING.lg }}
          />
        </SectionCard>
      ) : null}

      {flow === 'manual' && manualStep === 2 && createdHeaderId != null ? (
        <SectionCard title={t('packageMobile.create.packageCardTitle')} subtitle={t('packageMobile.create.packageCardSubtitle')}>
          <View style={[styles.banner, { backgroundColor: theme.mode === 'light' ? 'rgba(2,132,199,0.08)' : 'rgba(56,189,248,0.10)', borderColor: theme.colors.border }]}>
            <CheckmarkCircle02Icon size={18} color={theme.colors.primary} />
            <Text style={[styles.bannerText, { color: theme.colors.text }]}>
              {createdPackingNo} · id {createdHeaderId}
            </Text>
          </View>

          <Text style={[styles.label, { color: theme.colors.textMuted }]}>{t('packageMobile.create.packageNo')}</Text>
          <TextInput
            value={packageNo}
            onChangeText={(v) => setPackageNo(clip(v, MAX_PACKAGE_NO))}
            placeholder={t('packageMobile.create.packageNo')}
            placeholderTextColor={theme.colors.inputPlaceholder}
            style={inputSurface(theme)}
          />

          <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: SPACING.md }]}>{t('packageMobile.create.packageType')}</Text>
          {chipsRow(PACKAGING_PACKAGE_TYPES, packageType, (v) => setPackageType(v as PackagingPackageType))}

          <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: SPACING.md }]}>{t('packageMobile.create.barcode')}</Text>
          <TextInput
            value={packageBarcode}
            onChangeText={(v) => setPackageBarcode(clip(v, MAX_BARCODE_PACKAGE))}
            placeholder={t('packageMobile.create.barcode')}
            placeholderTextColor={theme.colors.inputPlaceholder}
            style={inputSurface(theme)}
            autoCapitalize='none'
          />

          <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: SPACING.md }]}>{t('packageMobile.create.packagingMaterialId')}</Text>
          <TextInput
            value={packagingMaterialIdRaw}
            onChangeText={(v) => setPackagingMaterialIdRaw(v.replace(/[^\d]/g, ''))}
            keyboardType='number-pad'
            placeholder='—'
            placeholderTextColor={theme.colors.inputPlaceholder}
            style={inputSurface(theme)}
          />

          <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: SPACING.md }]}>{t('packageMobile.create.parentPackage')}</Text>
          <View style={styles.chipRow}>
            <Pressable
              onPress={() => setParentPackageId(null)}
              style={[
                styles.chip,
                {
                  borderColor: parentPackageId == null ? theme.colors.primary : theme.colors.border,
                  backgroundColor:
                    parentPackageId == null ? (theme.mode === 'light' ? 'rgba(2,132,199,0.10)' : 'rgba(56,189,248,0.14)') : theme.colors.surfaceStrong,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: parentPackageId == null ? theme.colors.primaryStrong : theme.colors.textSecondary }]}>
                {t('packageMobile.create.parentNone')}
              </Text>
            </Pressable>
            {parentCandidates.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => setParentPackageId(p.id)}
                style={[
                  styles.chip,
                  {
                    borderColor: parentPackageId === p.id ? theme.colors.primary : theme.colors.border,
                    backgroundColor:
                      parentPackageId === p.id ? (theme.mode === 'light' ? 'rgba(2,132,199,0.10)' : 'rgba(56,189,248,0.14)') : theme.colors.surfaceStrong,
                  },
                ]}
              >
                <Text
                  style={[styles.chipText, { color: parentPackageId === p.id ? theme.colors.primaryStrong : theme.colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {p.packageNo}
                </Text>
              </Pressable>
            ))}
          </View>
          {packagesForParentQuery.isFetching ? <ActivityIndicator color={theme.colors.primary} style={{ marginTop: SPACING.sm }} /> : null}

          <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: SPACING.md }]}>{t('packageMobile.create.currentWarehouseId')}</Text>
          <TextInput
            value={currentWarehouseIdRaw}
            onChangeText={(v) => setCurrentWarehouseIdRaw(v.replace(/[^\d]/g, ''))}
            keyboardType='number-pad'
            placeholder='—'
            placeholderTextColor={theme.colors.inputPlaceholder}
            style={inputSurface(theme)}
          />

          <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: SPACING.md }]}>{t('packageMobile.create.currentShelfId')}</Text>
          <TextInput
            value={currentShelfIdRaw}
            onChangeText={(v) => setCurrentShelfIdRaw(v.replace(/[^\d]/g, ''))}
            keyboardType='number-pad'
            placeholder='—'
            placeholderTextColor={theme.colors.inputPlaceholder}
            style={inputSurface(theme)}
          />

          <Button
            title={packageMutation.isPending ? t('packageMobile.create.creatingPackage') : t('packageMobile.create.createPackage')}
            onPress={() => packageMutation.mutate()}
            loading={packageMutation.isPending}
            style={{ marginTop: SPACING.lg }}
          />
        </SectionCard>
      ) : null}

      {flow === 'manual' && manualStep === 3 && createdHeaderId != null && createdPackageId != null ? (
        <SectionCard title={t('packageMobile.create.linesCardTitle')} subtitle={t('packageMobile.create.linesCardSubtitle')}>
          {isMatched ? (
            <View style={[styles.warnBox, { borderColor: theme.colors.border, backgroundColor: theme.mode === 'light' ? 'rgba(234,88,12,0.08)' : 'rgba(249,115,22,0.12)' }]}>
              <Text style={[styles.warnTitle, { color: theme.colors.accent }]}>{t('packageMobile.create.matchedWarningTitle')}</Text>
              <Text style={[styles.warnBody, { color: theme.colors.textSecondary }]}>{t('packageMobile.create.matchedWarningBody')}</Text>
            </View>
          ) : null}

          <Text style={[styles.label, { color: theme.colors.textMuted }]}>{t('packageMobile.create.stockCode')}</Text>
          <TextInput
            value={lineStockCode}
            onChangeText={(v) => setLineStockCode(clip(v, MAX_STOCK_CODE))}
            placeholder={t('packageMobile.create.stockCode')}
            placeholderTextColor={theme.colors.inputPlaceholder}
            style={inputSurface(theme)}
            autoCapitalize='characters'
          />

          <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: SPACING.md }]}>{t('packageMobile.create.quantity')}</Text>
          <TextInput
            value={lineQuantityRaw}
            onChangeText={setLineQuantityRaw}
            keyboardType='decimal-pad'
            placeholder='1'
            placeholderTextColor={theme.colors.inputPlaceholder}
            style={inputSurface(theme)}
          />

          <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: SPACING.md }]}>{t('packageMobile.create.yapKodId')}</Text>
          <TextInput
            value={lineYapKodIdRaw}
            onChangeText={(v) => setLineYapKodIdRaw(v.replace(/[^\d]/g, ''))}
            keyboardType='number-pad'
            placeholder='—'
            placeholderTextColor={theme.colors.inputPlaceholder}
            style={inputSurface(theme)}
          />

          <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: SPACING.md }]}>{t('packageMobile.create.serialNo')}</Text>
          <TextInput
            value={lineSerialRaw}
            onChangeText={(v) => setLineSerialRaw(clip(v, MAX_SERIAL))}
            placeholder={t('packageMobile.create.serialNo')}
            placeholderTextColor={theme.colors.inputPlaceholder}
            style={inputSurface(theme)}
          />

          <Button
            title={lineMutation.isPending ? t('packageMobile.create.addingLine') : t('packageMobile.create.addLine')}
            onPress={() => lineMutation.mutate()}
            loading={lineMutation.isPending}
            style={{ marginTop: SPACING.lg }}
          />

          <Text style={[styles.subhead, { color: theme.colors.textSecondary, marginTop: SPACING.lg }]}>
            {t('packageMobile.create.linesForPackage', { count: linesQuery.data?.length ?? 0 })}
          </Text>
          {linesQuery.isLoading ? <ActivityIndicator color={theme.colors.primary} /> : null}
          <View style={{ gap: SPACING.sm, marginTop: SPACING.sm }}>
            {(linesQuery.data ?? []).map((ln) => (
              <View
                key={ln.id}
                style={[styles.lineRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]}
              >
                <Text style={[styles.lineTitle, { color: theme.colors.text }]}>{ln.stockCode ?? '—'}</Text>
                <Text style={[styles.lineMeta, { color: theme.colors.textSecondary }]}>
                  × {ln.quantity}
                  {ln.serialNo ? ` · ${ln.serialNo}` : ''}
                </Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => router.replace(`/(tabs)/inventory/packages/${createdHeaderId}` as never)}
            style={[styles.outlineBtn, { borderColor: theme.colors.primary, marginTop: SPACING.lg }]}
          >
            <Text style={[styles.outlineBtnText, { color: theme.colors.primary }]}>{t('packageMobile.create.doneOpenDetail')}</Text>
          </Pressable>
        </SectionCard>
      ) : null}

      {flow === 'auto' ? (
        <SectionCard title={t('packageMobile.create.autoCardTitle')} subtitle={t('packageMobile.create.autoCardSubtitle')}>
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>{t('packageMobile.create.autoSourceType')}</Text>
          {chipsRow(PACKAGING_SOURCE_TYPES, autoSourceType, (v) => setAutoSourceType(v as PackagingSourceType))}

          <Text style={[styles.label, { color: theme.colors.textMuted, marginTop: SPACING.md }]}>{t('packageMobile.create.autoSourceHeaderId')}</Text>
          <TextInput
            value={autoSourceHeaderIdRaw}
            onChangeText={(v) => setAutoSourceHeaderIdRaw(v.replace(/[^\d]/g, ''))}
            keyboardType='number-pad'
            placeholder='123'
            placeholderTextColor={theme.colors.inputPlaceholder}
            style={inputSurface(theme)}
          />

          <View style={[styles.switchRow, { marginTop: SPACING.md }]}>
            <Text style={[styles.label, { color: theme.colors.text, flex: 1, marginTop: 0 }]}>{t('packageMobile.create.autoMatch')}</Text>
            <Switch value={autoMatch} onValueChange={setAutoMatch} trackColor={{ false: theme.colors.border, true: theme.colors.primary }} />
          </View>
          <View style={styles.switchRow}>
            <Text style={[styles.label, { color: theme.colors.text, flex: 1, marginTop: 0 }]}>{t('packageMobile.create.createPallets')}</Text>
            <Switch value={autoCreatePallets} onValueChange={setAutoCreatePallets} trackColor={{ false: theme.colors.border, true: theme.colors.primary }} />
          </View>
          <View style={styles.switchRow}>
            <Text style={[styles.label, { color: theme.colors.text, flex: 1, marginTop: 0 }]}>{t('packageMobile.create.reuseHeader')}</Text>
            <Switch value={autoReuse} onValueChange={setAutoReuse} trackColor={{ false: theme.colors.border, true: theme.colors.primary }} />
          </View>

          <Button
            title={autoMutation.isPending ? t('packageMobile.create.runningAuto') : t('packageMobile.create.runAuto')}
            onPress={() => autoMutation.mutate()}
            loading={autoMutation.isPending}
            style={{ marginTop: SPACING.lg }}
          />
        </SectionCard>
      ) : null}

      <Modal visible={warehouseModal} animationType='fade' transparent onRequestClose={() => setWarehouseModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setWarehouseModal(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{t('packageMobile.create.selectWarehouse')}</Text>
            {warehousesQuery.isLoading ? <ActivityIndicator color={theme.colors.primary} /> : null}
            <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps='handled'>
              {warehouses.map((w) => (
                <Pressable
                  key={w.id}
                  onPress={() => onSelectWarehouse(w)}
                  style={[styles.whRow, { borderBottomColor: theme.colors.border }]}
                >
                  <Text style={[styles.whCode, { color: theme.colors.text }]}>{String(w.depoKodu)}</Text>
                  <Text style={[styles.whName, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                    {w.depoIsmi}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable onPress={() => setWarehouseModal(false)} style={{ marginTop: SPACING.md, alignItems: 'center' }}>
              <Text style={{ color: theme.colors.primary, fontWeight: '800' }}>{t('common.close')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  modeBar: {
    flexDirection: 'row',
    borderRadius: RADII.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  modeHalf: { flex: 1, paddingVertical: SPACING.sm + 2, alignItems: 'center' },
  modeText: { fontWeight: '900', fontSize: 14 },
  stepRail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADII.xl,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  stepRailText: { flex: 1, fontWeight: '800', fontSize: 14 },
  label: { fontSize: 12, fontWeight: '800', marginBottom: 6 },
  hint: { fontSize: 12, marginBottom: SPACING.xs, lineHeight: 17 },
  rowGap: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  sideBtn: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    minHeight: LAYOUT.inputHeight - 4,
    justifyContent: 'center',
  },
  sideBtnText: { fontWeight: '900', fontSize: 13 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  chip: {
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  chipText: { fontWeight: '800', fontSize: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md },
  banner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderWidth: 1, borderRadius: RADII.lg, padding: SPACING.md, marginBottom: SPACING.md },
  bannerText: { flex: 1, fontWeight: '800', fontSize: 14 },
  warnBox: { borderWidth: 1, borderRadius: RADII.lg, padding: SPACING.md, marginBottom: SPACING.md, gap: 6 },
  warnTitle: { fontWeight: '900', fontSize: 14 },
  warnBody: { fontSize: 13, lineHeight: 18 },
  subhead: { fontWeight: '800', fontSize: 14 },
  lineRow: { borderWidth: 1, borderRadius: RADII.lg, padding: SPACING.md, gap: 4 },
  lineTitle: { fontSize: 15, fontWeight: '900' },
  lineMeta: { fontSize: 13, fontWeight: '600' },
  outlineBtn: {
    borderWidth: 1.5,
    borderRadius: RADII.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  outlineBtnText: { fontWeight: '900', fontSize: 15 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: LAYOUT.screenPadding,
  },
  modalCard: {
    borderRadius: RADII.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 18, fontWeight: '900', marginBottom: SPACING.md },
  whRow: {
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  whCode: { fontSize: 16, fontWeight: '900' },
  whName: { fontSize: 13, fontWeight: '600' },
});
