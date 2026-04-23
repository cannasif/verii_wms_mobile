import React, { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SelectorField } from '@/components/ui/SelectorField';
import { Text } from '@/components/ui/Text';
import { SPACING } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type {
  GoodsReceiptFormValues,
  ReceiptMode,
  SelectedOrderItem,
  SelectedStockItem,
} from '../types';
import { styles } from './styles';

interface LineEditorCardProps {
  mode: ReceiptMode;
  title: string;
  code: string;
  unit: string;
  baseQuantity: number;
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
          backgroundColor: theme.colors.backgroundSecondary,
          borderColor: selectedItem ? theme.colors.accent : theme.colors.border,
        },
        selectedItem ? styles.lineCardActive : null,
      ]}
    >
      <View style={styles.lineHeader}>
        <View style={{ flex: 1, gap: SPACING.xs - 2 }}>
          <Text style={styles.lineTitle}>{title}</Text>
          <Text style={[styles.lineMeta, { color: theme.colors.textSecondary }]}>{code}</Text>
          {baseQuantity > 0 ? (
            <Text style={[styles.lineMeta, { color: theme.colors.textSecondary }]}>{t('goodsReceiptMobile.baseQuantity', { value: baseQuantity, unit })}</Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => setIsExpanded((prev) => !prev)}
          style={[styles.expandButton, { backgroundColor: theme.colors.card }]}
        >
          <Text style={styles.expandButtonText}>{isExpanded ? '-' : '+'}</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.warehousePicker, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        onPress={onPickWarehouse}
      >
        <Text style={styles.warehousePickerText}>{selectedWarehouseLabel}</Text>
      </Pressable>

      <TextInput
        value={quantityInput}
        onChangeText={updateQuantity}
        onBlur={handleQuantityBlur}
        style={[styles.input, { backgroundColor: theme.colors.surfaceStrong, color: theme.colors.text }]}
        keyboardType='decimal-pad'
        placeholder={t('goodsReceiptMobile.quantityPlaceholder')}
        placeholderTextColor={theme.colors.inputPlaceholder}
      />

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
