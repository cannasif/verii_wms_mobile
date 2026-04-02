import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { FilterHorizontalIcon, RefreshIcon, Search01Icon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/providers/ThemeProvider';
import { Text } from '@/components/ui/Text';

interface PagedListToolbarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onOpenFilters: () => void;
  onReset: () => void;
  isBusy?: boolean;
  activeFilterCount?: number;
}

export function PagedListToolbar({
  value,
  onChange,
  onSubmit,
  onOpenFilters,
  onReset,
  isBusy,
  activeFilterCount = 0,
}: PagedListToolbarProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.searchShell, { borderColor: theme.colors.border, backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.04)' : 'rgba(255,255,255,0.04)' }]}>
        <Search01Icon size={18} color={theme.colors.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChange}
          onSubmitEditing={onSubmit}
          placeholder={t('paged.searchPlaceholder')}
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.input, { color: theme.colors.text }]}
          returnKeyType="search"
        />
        <Pressable onPress={onSubmit} style={({ pressed }) => [styles.searchButton, { backgroundColor: theme.mode === 'light' ? 'rgba(2,132,199,0.10)' : 'rgba(56,189,248,0.14)' }, pressed && styles.pressed]}>
          <Text style={[styles.searchButtonText, { color: theme.colors.primary }]}>{t('paged.search')}</Text>
        </Pressable>
      </View>

      <View style={styles.actionsRow}>
        <Pressable onPress={onOpenFilters} style={({ pressed }) => [styles.secondaryAction, { borderColor: theme.colors.border, backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.03)' }, pressed && styles.pressed]}>
          <FilterHorizontalIcon size={18} color={theme.colors.primary} />
          <Text style={[styles.secondaryActionText, { color: theme.colors.textSecondary }]}>{t('paged.filters')}</Text>
          {activeFilterCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.badgeText, { color: theme.colors.background }]}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>

        <Pressable onPress={onReset} disabled={isBusy} style={({ pressed }) => [styles.secondaryAction, { borderColor: theme.colors.border, backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.03)' }, pressed && styles.pressed, isBusy && styles.disabled]}>
          <RefreshIcon size={18} color={theme.colors.textSecondary} />
          <Text style={[styles.secondaryActionText, { color: theme.colors.textSecondary }]}>{t('paged.reset')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 18,
    paddingLeft: 14,
    paddingRight: 8,
    minHeight: 56,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },
  searchButton: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  searchButtonText: { fontWeight: '800' },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
  },
  secondaryActionText: { fontWeight: '700' },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  badgeText: { fontWeight: '900', fontSize: 11 },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.5,
  },
});
