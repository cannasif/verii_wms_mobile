import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SelectorField } from '@/components/ui/SelectorField';
import { Text } from '@/components/ui/Text';
import { RADII, SPACING } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type { SelectedWorkflowOrderItem, SelectedWorkflowStockItem } from '../types';

export function WorkflowSelectedItemCard({
  item,
  mode,
  quantityValue,
  onQuantityChange,
  onQuantityBlur,
  onRemove,
  onUpdate,
  onPickWarehouse,
}: {
  item: SelectedWorkflowOrderItem | SelectedWorkflowStockItem;
  mode: 'order' | 'free';
  quantityValue: string;
  onQuantityChange: (value: string) => void;
  onQuantityBlur: () => void;
  onRemove: () => void;
  onUpdate: (updates: Partial<SelectedWorkflowOrderItem & SelectedWorkflowStockItem>) => void;
  onPickWarehouse: () => void;
}): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.selectedCard,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.03)',
        },
      ]}
    >
      <View style={styles.selectedHeader}>
        <View style={styles.flexOne}>
          <Text style={styles.rowTitle}>{item.stockCode}</Text>
          <Text style={[styles.rowMeta, { color: theme.colors.textSecondary }]}>{item.stockName}</Text>
        </View>
        <Pressable onPress={onRemove}>
          <Text style={[styles.removeText, { color: theme.colors.danger }]}>{t('common.remove')}</Text>
        </Pressable>
      </View>

      <TextInput
        style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong, color: theme.colors.text }]}
        value={quantityValue}
        onChangeText={onQuantityChange}
        onBlur={onQuantityBlur}
        keyboardType='decimal-pad'
        placeholder={t('workflowCreate.placeholders.quantity')}
        placeholderTextColor={theme.colors.inputPlaceholder}
      />

      {'scannedBarcode' in item && item.scannedBarcode ? (
        <Text style={[styles.rowMeta, { color: theme.colors.textSecondary }]}>{t('workflowCreate.barcodeValue', { value: item.scannedBarcode })}</Text>
      ) : null}

      {mode === 'free' ? (
        <SelectorField
          value={'sourceWarehouse' in item && item.sourceWarehouse ? String(item.sourceWarehouse) : t('workflowCreate.placeholders.itemSourceWarehouse')}
          onPress={onPickWarehouse}
        />
      ) : null}

      <View style={styles.inlineRow}>
        <TextInput style={[styles.input, styles.inlineInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong, color: theme.colors.text }]} value={item.serialNo || ''} onChangeText={(value) => onUpdate({ serialNo: value })} placeholder={t('workflowCreate.fields.serialNo')} placeholderTextColor={theme.colors.inputPlaceholder} />
        <TextInput style={[styles.input, styles.inlineInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong, color: theme.colors.text }]} value={item.serialNo2 || ''} onChangeText={(value) => onUpdate({ serialNo2: value })} placeholder={t('workflowCreate.fields.serialNo2')} placeholderTextColor={theme.colors.inputPlaceholder} />
      </View>
      <View style={styles.inlineRow}>
        <TextInput style={[styles.input, styles.inlineInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong, color: theme.colors.text }]} value={item.lotNo || ''} onChangeText={(value) => onUpdate({ lotNo: value })} placeholder={t('workflowCreate.fields.lotNo')} placeholderTextColor={theme.colors.inputPlaceholder} />
        <TextInput style={[styles.input, styles.inlineInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong, color: theme.colors.text }]} value={item.batchNo || ''} onChangeText={(value) => onUpdate({ batchNo: value })} placeholder={t('workflowCreate.fields.batchNo')} placeholderTextColor={theme.colors.inputPlaceholder} />
      </View>
      <TextInput style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong, color: theme.colors.text }]} value={item.configCode || ''} onChangeText={(value) => onUpdate({ configCode: value })} placeholder={t('workflowCreate.fields.configCode')} placeholderTextColor={theme.colors.inputPlaceholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  selectedCard: { padding: 14, borderRadius: 18, borderWidth: 1, gap: 10 },
  selectedHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flexOne: { flex: 1 },
  rowTitle: { fontWeight: '900' },
  rowMeta: { fontSize: 12 },
  removeText: { fontWeight: '800' },
  input: { minHeight: 48, borderRadius: RADII.md, borderWidth: 1, paddingHorizontal: 14 },
  inlineRow: { flexDirection: 'row', gap: SPACING.xs },
  inlineInput: { flex: 1 },
});
