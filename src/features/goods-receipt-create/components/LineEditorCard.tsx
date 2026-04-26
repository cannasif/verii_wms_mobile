import React, { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { PackageIcon, Tick01Icon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { SelectorField } from '@/components/ui/SelectorField';
import { Text } from '@/components/ui/Text';
import { SPACING } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type { ReceiptMode, SelectedOrderItem, SelectedStockItem } from '../types';
import { styles } from './styles';

interface LineEditorCardProps {
  mode: ReceiptMode;
  title: string;
  code: string;
  unit: string;
  baseQuantity: number;
  orderNo?: string;
  selectedItem?: SelectedOrderItem | SelectedStockItem;
  onToggle: () => void;
  onChange: (updates: Partial<SelectedOrderItem> & Partial<SelectedStockItem>) => void;
  onRemove: () => void;
  onPickWarehouse: () => void;
  onPickYapKod?: () => void;
  selectedWarehouseLabel: string;
}

export function LineEditorCard({
  mode,
  title,
  code,
  unit,
  baseQuantity,
  orderNo,
  selectedItem,
  onToggle,
  onChange,
  onRemove,
  onPickWarehouse,
  onPickYapKod,
  selectedWarehouseLabel,
}: LineEditorCardProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [quantityInput, setQuantityInput] = useState(selectedItem?.receiptQuantity ? String(selectedItem.receiptQuantity) : '');

  useEffect(() => {
    setQuantityInput(selectedItem?.receiptQuantity ? String(selectedItem.receiptQuantity) : '');
  }, [selectedItem?.id, selectedItem?.receiptQuantity]);

  const updateQuantity = (value: string): void => {
    if (!/^\d*([.,]\d*)?$/.test(value)) {
      return;
    }

    setQuantityInput(value);

    const normalized = value.replace(',', '.').trim();
    if (!normalized || normalized.endsWith('.') || normalized.endsWith(',')) {
      return;
    }

    const quantity = Number(normalized);
    if (!Number.isFinite(quantity)) {
      return;
    }

    if (!selectedItem && quantity > 0) {
      onToggle();
      setTimeout(() => onChange({ receiptQuantity: quantity }), 0);
      return;
    }

    if (!selectedItem) {
      return;
    }

    onChange({ receiptQuantity: quantity });
  };

  const handleQuantityBlur = (): void => {
    const normalized = quantityInput.replace(',', '.').trim();

    if (!normalized) {
      onRemove();
      return;
    }

    const quantity = Number(normalized);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      onRemove();
      return;
    }

    onChange({ receiptQuantity: quantity });
    setQuantityInput(String(quantity));
  };

  return (
    <View
      style={[
        styles.lineCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: selectedItem ? theme.colors.accent : theme.colors.border,
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 1,
        },
        selectedItem ? styles.lineCardActive : null,
      ]}
    >
      <View style={styles.lineTopRow}>
        <Pressable
          onPress={onToggle}
          style={[
            styles.orderCheck,
            { borderColor: selectedItem ? theme.colors.accent : theme.colors.border },
            selectedItem ? { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent } : { backgroundColor: 'transparent' },
          ]}
          accessibilityLabel={t('goodsReceiptMobile.toggleLine')}
        >
          {selectedItem ? <Tick01Icon size={14} color="#fff" /> : null}
        </Pressable>
        <View style={[styles.lineIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.14)', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
          <PackageIcon size={20} color={theme.colors.primaryStrong} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text style={styles.lineTitle} numberOfLines={2}>
            {title}
          </Text>
          {mode === 'order' && orderNo ? (
            <Text style={[styles.lineMeta, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {t('goodsReceiptMobile.lineOrderRef', { value: orderNo })}
            </Text>
          ) : null}
          <Text style={[styles.lineMeta, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {code}
            {baseQuantity > 0 ? ` · ${t('goodsReceiptMobile.baseQuantity', { value: baseQuantity, unit })}` : null}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 0 }}>
          <TextInput
            value={quantityInput}
            onChangeText={updateQuantity}
            onBlur={handleQuantityBlur}
            style={[styles.lineQtyInput, { color: theme.colors.primaryStrong, borderBottomWidth: 1, borderBottomColor: 'rgba(56, 189, 248, 0.35)' }]}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={theme.colors.inputPlaceholder}
          />
          <Text style={[styles.lineAdet, { color: theme.colors.textSecondary }]}>{t('goodsReceiptMobile.unitAdet')}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <Pressable
          style={[{ flex: 1, minWidth: 0 }, styles.warehousePicker, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={onPickWarehouse}
        >
          <Text style={styles.warehousePickerText} numberOfLines={1}>
            {selectedWarehouseLabel}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setIsExpanded((prev) => !prev)}
          style={[styles.expandButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1 }]}
        >
          <Text style={styles.expandButtonText}>{isExpanded ? '−' : '+'}</Text>
        </Pressable>
      </View>

      {isExpanded ? (
        <View style={styles.detailGrid}>
          <DetailInput
            label={t('goodsReceiptMobile.serialNo')}
            value={selectedItem?.serialNo || ''}
            onChangeText={(value) => onChange({ serialNo: value })}
            placeholderTextColor={theme.colors.inputPlaceholder}
            textColor={theme.colors.text}
          />
          <DetailInput
            label={t('goodsReceiptMobile.lotNo')}
            value={selectedItem?.lotNo || ''}
            onChangeText={(value) => onChange({ lotNo: value })}
            placeholderTextColor={theme.colors.inputPlaceholder}
            textColor={theme.colors.text}
          />
          <DetailInput
            label={t('goodsReceiptMobile.batchNo')}
            value={selectedItem?.batchNo || ''}
            onChangeText={(value) => onChange({ batchNo: value })}
            placeholderTextColor={theme.colors.inputPlaceholder}
            textColor={theme.colors.text}
          />
          <DetailSelector
            label={t('goodsReceiptMobile.configCode')}
            value={selectedItem?.configCode || t('goodsReceiptMobile.configCode')}
            onPress={onPickYapKod}
          />
        </View>
      ) : null}
    </View>
  );
}

function DetailInput({
  label,
  value,
  onChangeText,
  placeholderTextColor,
  textColor,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholderTextColor: string;
  textColor: string;
}): React.ReactElement {
  const { theme } = useTheme();
  return (
    <View style={{ gap: SPACING.xs - 2 }}>
      <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.detailInput, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: textColor }]}
        placeholderTextColor={placeholderTextColor}
      />
    </View>
  );
}

function DetailSelector({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
}): React.ReactElement {
  const { theme } = useTheme();
  return (
    <View style={{ gap: SPACING.xs - 2 }}>
      <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <SelectorField value={value} onPress={onPress || (() => undefined)} />
    </View>
  );
}
