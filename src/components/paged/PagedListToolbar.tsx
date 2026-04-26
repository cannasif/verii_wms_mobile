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
  /** Varsayılan: paged.searchPlaceholder */
  searchPlaceholder?: string;
  /** Özel kenarlık rengi — varsayılan: theme.colors.border */
  accentBorderColor?: string;
}

export function PagedListToolbar({
  value,
  onChange,
  onSubmit,
  onOpenFilters,
  onReset,
  isBusy,
  activeFilterCount = 0,
  searchPlaceholder,
  accentBorderColor,
}: PagedListToolbarProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const resolvedPlaceholder = searchPlaceholder ?? t('paged.searchPlaceholder');
  const borderColor = accentBorderColor ?? theme.colors.border;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.searchShell, { borderColor, backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.04)' : 'rgba(255,255,255,0.04)' }]}>
        <Search01Icon size={15} color={theme.colors.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChange}
          onSubmitEditing={onSubmit}
          placeholder={resolvedPlaceholder}
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.input, { color: theme.colors.text }]}
          returnKeyType="search"
        />
        <Pressable onPress={onSubmit} style={({ pressed }) => [styles.searchButton, { backgroundColor: theme.mode === 'light' ? 'rgba(2,132,199,0.10)' : 'rgba(56,189,248,0.14)' }, pressed && styles.pressed]}>
          <Text style={[styles.searchButtonText, { color: theme.colors.primary }]}>{t('paged.search')}</Text>
        </Pressable>
      </View>

      <View style={styles.actionsRow}>
        <Pressable onPress={onOpenFilters} style={({ pressed }) => [styles.secondaryAction, { borderColor, backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.03)' }, pressed && styles.pressed]}>
          <FilterHorizontalIcon size={15} color={theme.colors.primary} />
          <Text style={[styles.secondaryActionText, { color: theme.colors.textSecondary }]}>{t('paged.filters')}</Text>
          {activeFilterCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.badgeText, { color: theme.colors.background }]}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>

        <Pressable onPress={onReset} disabled={isBusy} style={({ pressed }) => [styles.secondaryAction, { borderColor, backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.03)' }, pressed && styles.pressed, isBusy && styles.disabled]}>
          <RefreshIcon size={15} color={theme.colors.textSecondary} />
          <Text style={[styles.secondaryActionText, { color: theme.colors.textSecondary }]}>{t('paged.reset')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingLeft: 12,
    paddingRight: 6,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
  },
  searchButton: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  searchButtonText: { fontWeight: '800', fontSize: 13 },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryActionText: { fontWeight: '700', fontSize: 13 },
  badge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  badgeText: { fontWeight: '900', fontSize: 10 },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.5,
  },
});
