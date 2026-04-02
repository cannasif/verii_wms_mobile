import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Add01Icon, Cancel01Icon, Delete02Icon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { LAYOUT, RADII, SPACING } from '@/constants/theme';
import { Text } from '@/components/ui/Text';
import { getOperatorsForColumn } from '@/lib/paged';
import { useTheme } from '@/providers/ThemeProvider';
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
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.mode === 'light' ? 'rgba(148,163,184,0.32)' : 'rgba(2, 8, 23, 0.6)' }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t('paged.advancedTitle')}</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{t('paged.advancedDescription')}</Text>
            </View>
            <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.04)' : 'rgba(255,255,255,0.04)' }]}>
              <Cancel01Icon size={20} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.logicRow}>
            {(['and', 'or'] as const).map((value) => (
              <Pressable
                key={value}
                onPress={() => onFilterLogicChange(value)}
                style={[
                  styles.logicChip,
                  { borderColor: theme.colors.border, backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.03)' : 'rgba(255,255,255,0.03)' },
                  filterLogic === value && { backgroundColor: theme.mode === 'light' ? 'rgba(2,132,199,0.12)' : 'rgba(56,189,248,0.18)', borderColor: theme.mode === 'light' ? 'rgba(2,132,199,0.3)' : 'rgba(56,189,248,0.35)' },
                ]}
              >
                <Text style={[styles.logicText, { color: theme.colors.textSecondary }, filterLogic === value && { color: theme.colors.primary }]}>{t(`paged.logic.${value}`)}</Text>
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
                      <Delete02Icon size={18} color={theme.colors.danger} />
                    </Pressable>
                  </View>

                  <View style={styles.choiceRow}>
                    <Pressable
                      onPress={() => onUpdate(row.id, { column: columns[(columnIndex + 1) % columns.length]?.value ?? row.column })}
                      style={[styles.choiceButton, { borderColor: theme.colors.border, backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.03)' : 'rgba(7,18,36,0.7)' }]}
                    >
                      <Text style={[styles.choiceLabel, { color: theme.colors.textMuted }]}>{t('paged.column')}</Text>
                      <Text style={styles.choiceValue}>{t(columns[columnIndex]?.labelKey ?? 'paged.column')}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onUpdate(row.id, { operator: operators[(operatorIndex + 1) % operators.length] ?? row.operator })}
                      style={[styles.choiceButton, { borderColor: theme.colors.border, backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.03)' : 'rgba(7,18,36,0.7)' }]}
                    >
                      <Text style={[styles.choiceLabel, { color: theme.colors.textMuted }]}>{t('paged.operator')}</Text>
                      <Text style={styles.choiceValue}>{t(`paged.operators.${operators[operatorIndex] ?? row.operator}`)}</Text>
                    </Pressable>
                  </View>

                  <TextInput
                    value={row.value}
                    onChangeText={(value) => onUpdate(row.id, { value })}
                    placeholder={t('paged.valuePlaceholder')}
                    placeholderTextColor={theme.colors.textMuted}
                    style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.03)' : 'rgba(7,18,36,0.7)', color: theme.colors.text }]}
                  />
                </View>
              );
            })}

            <Pressable onPress={onAdd} style={[styles.addButton, { borderColor: theme.mode === 'light' ? 'rgba(2,132,199,0.35)' : 'rgba(56,189,248,0.4)', backgroundColor: theme.mode === 'light' ? 'rgba(2,132,199,0.05)' : 'rgba(56,189,248,0.06)' }]}>
              <Add01Icon size={18} color={theme.colors.primary} />
              <Text style={[styles.addButtonText, { color: theme.colors.primary }]}>{t('paged.addFilter')}</Text>
            </Pressable>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable onPress={onClear} style={[styles.footerSecondary, { borderColor: theme.colors.border }]}>
              <Text style={[styles.footerSecondaryText, { color: theme.colors.textSecondary }]}>{t('paged.clearFilters')}</Text>
            </Pressable>
            <Pressable onPress={onApply} style={[styles.footerPrimary, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.footerPrimaryText, { color: theme.colors.background }]}>{t('paged.applyFilters')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '84%',
    borderTopLeftRadius: RADII.xxl,
    borderTopRightRadius: RADII.xxl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: { fontSize: 20, fontWeight: '900' },
  subtitle: { marginTop: 4, lineHeight: 20 },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.pill,
  },
  logicRow: { flexDirection: 'row', gap: SPACING.xs },
  logicChip: {
    flex: 1,
    minHeight: 42,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  logicText: { fontWeight: '700' },
  body: { maxHeight: 420 },
  bodyContent: { gap: SPACING.sm, paddingBottom: SPACING.xs },
  filterCard: {
    borderRadius: RADII.lg,
    padding: SPACING.md,
    borderWidth: 1,
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
    gap: 4,
  },
  choiceLabel: { fontSize: 12, fontWeight: '700' },
  choiceValue: { fontWeight: '800', fontSize: 14 },
  input: {
    minHeight: LAYOUT.inputHeight,
    borderRadius: RADII.sm,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
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
  },
  addButtonText: { fontWeight: '800' },
  footer: { flexDirection: 'row', gap: SPACING.xs },
  footerSecondary: {
    flex: 1,
    minHeight: 52,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  footerSecondaryText: { fontWeight: '800' },
  footerPrimary: {
    flex: 1,
    minHeight: 52,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerPrimaryText: { fontWeight: '900' },
});
