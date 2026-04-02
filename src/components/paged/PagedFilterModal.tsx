import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Add01Icon, Cancel01Icon, Delete02Icon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, LAYOUT, RADII, SPACING } from '@/constants/theme';
import { Text } from '@/components/ui/Text';
import { getOperatorsForColumn } from '@/lib/paged';
import type { DraftFilterRow, FilterColumnConfig, FilterLogic } from '@/types/paged';

interface PagedFilterModalProps {
  visible: boolean;
  columns: readonly FilterColumnConfig[];
  draftFilters: DraftFilterRow[];
  filterLogic: FilterLogic;
  onClose: () => void;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<Omit<DraftFilterRow, 'id'>>) => void;
  onRemove: (id: string) => void;
  onFilterLogicChange: (value: FilterLogic) => void;
  onApply: () => void;
  onClear: () => void;
}

export function PagedFilterModal({
  visible,
  columns,
  draftFilters,
  filterLogic,
  onClose,
  onAdd,
  onUpdate,
  onRemove,
  onFilterLogicChange,
  onApply,
  onClear,
}: PagedFilterModalProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t('paged.advancedTitle')}</Text>
              <Text style={styles.subtitle}>{t('paged.advancedDescription')}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Cancel01Icon size={20} color={COLORS.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.logicRow}>
            {(['and', 'or'] as const).map((value) => (
              <Pressable
                key={value}
                onPress={() => onFilterLogicChange(value)}
                style={[styles.logicChip, filterLogic === value && styles.logicChipActive]}
              >
                <Text style={[styles.logicText, filterLogic === value && styles.logicTextActive]}>{t(`paged.logic.${value}`)}</Text>
              </Pressable>
            ))}
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {draftFilters.map((row) => {
              const columnIndex = Math.max(columns.findIndex((item) => item.value === row.column), 0);
              const operators = getOperatorsForColumn(row.column, columns);
              const operatorIndex = Math.max(operators.indexOf(row.operator), 0);

              return (
                <View key={row.id} style={styles.filterCard}>
                  <View style={styles.filterHeader}>
                    <Text style={styles.filterTitle}>{t('paged.filterRule')}</Text>
                    <Pressable onPress={() => onRemove(row.id)} style={styles.iconButton}>
                      <Delete02Icon size={18} color={COLORS.danger} />
                    </Pressable>
                  </View>

                  <View style={styles.choiceRow}>
                    <Pressable
                      onPress={() => onUpdate(row.id, { column: columns[(columnIndex + 1) % columns.length]?.value ?? row.column })}
                      style={styles.choiceButton}
                    >
                      <Text style={styles.choiceLabel}>{t('paged.column')}</Text>
                      <Text style={styles.choiceValue}>{t(columns[columnIndex]?.labelKey ?? 'paged.column')}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onUpdate(row.id, { operator: operators[(operatorIndex + 1) % operators.length] ?? row.operator })}
                      style={styles.choiceButton}
                    >
                      <Text style={styles.choiceLabel}>{t('paged.operator')}</Text>
                      <Text style={styles.choiceValue}>{t(`paged.operators.${operators[operatorIndex] ?? row.operator}`)}</Text>
                    </Pressable>
                  </View>

                  <TextInput
                    value={row.value}
                    onChangeText={(value) => onUpdate(row.id, { value })}
                    placeholder={t('paged.valuePlaceholder')}
                    placeholderTextColor={COLORS.textMuted}
                    style={styles.input}
                  />
                </View>
              );
            })}

            <Pressable onPress={onAdd} style={styles.addButton}>
              <Add01Icon size={18} color={COLORS.primary} />
              <Text style={styles.addButtonText}>{t('paged.addFilter')}</Text>
            </Pressable>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable onPress={onClear} style={styles.footerSecondary}>
              <Text style={styles.footerSecondaryText}>{t('paged.clearFilters')}</Text>
            </Pressable>
            <Pressable onPress={onApply} style={styles.footerPrimary}>
              <Text style={styles.footerPrimaryText}>{t('paged.applyFilters')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(2, 8, 23, 0.6)',
  },
  sheet: {
    maxHeight: '84%',
    borderTopLeftRadius: RADII.xxl,
    borderTopRightRadius: RADII.xxl,
    backgroundColor: COLORS.backgroundSecondary,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: { fontSize: 20, fontWeight: '900' },
  subtitle: { marginTop: 4, color: COLORS.textSecondary, lineHeight: 20 },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  logicRow: { flexDirection: 'row', gap: SPACING.xs },
  logicChip: {
    flex: 1,
    minHeight: 42,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  logicChipActive: { backgroundColor: 'rgba(56,189,248,0.18)', borderColor: 'rgba(56,189,248,0.35)' },
  logicText: { color: COLORS.textSecondary, fontWeight: '700' },
  logicTextActive: { color: COLORS.primary },
  body: { maxHeight: 420 },
  bodyContent: { gap: SPACING.sm, paddingBottom: SPACING.xs },
  filterCard: {
    borderRadius: RADII.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: SPACING.sm,
  },
  filterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterTitle: { fontWeight: '800', fontSize: 15 },
  iconButton: { padding: 6 },
  choiceRow: { flexDirection: 'row', gap: SPACING.xs },
  choiceButton: {
    flex: 1,
    borderRadius: RADII.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(7,18,36,0.7)',
    gap: 4,
  },
  choiceLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  choiceValue: { fontWeight: '800', fontSize: 14 },
  input: {
    minHeight: LAYOUT.inputHeight,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(7,18,36,0.7)',
    paddingHorizontal: SPACING.sm,
    color: COLORS.text,
  },
  addButton: {
    minHeight: 50,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(56,189,248,0.4)',
    backgroundColor: 'rgba(56,189,248,0.06)',
  },
  addButtonText: { color: COLORS.primary, fontWeight: '800' },
  footer: { flexDirection: 'row', gap: SPACING.xs },
  footerSecondary: {
    flex: 1,
    minHeight: 52,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  footerSecondaryText: { color: COLORS.textSecondary, fontWeight: '800' },
  footerPrimary: {
    flex: 1,
    minHeight: 52,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  footerPrimaryText: { color: COLORS.background, fontWeight: '900' },
});
