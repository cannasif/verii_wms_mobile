import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { Search01Icon, BarCode01Icon } from 'hugeicons-react-native';

type SearchBarVariant = 'default' | 'slim';

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit?: () => void;
  onScanPress?: () => void;
  disabled?: boolean;
  onInputFocus?: () => void;
  onInputBlur?: () => void;
  /** Varsayılan: welcome.searchPlaceholder */
  placeholder?: string;
  /** Daha ince çerçeve ve padding (ör. stok sekmesi) */
  variant?: SearchBarVariant;
  /** Varsayılan true; false ise barkod tarama düğmesi gösterilmez */
  showScanButton?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  onScanPress,
  disabled = false,
  onInputFocus,
  onInputBlur,
  placeholder,
  variant = 'default',
  showScanButton = true,
}: SearchBarProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const resolvedPlaceholder = placeholder ?? t('welcome.searchPlaceholder');
  const slim = variant === 'slim';
  const borderColor = slim
    ? isDark
      ? 'rgba(56,189,248,0.16)'
      : 'rgba(2,132,199,0.11)'
    : isDark
      ? 'rgba(56,189,248,0.22)'
      : 'rgba(2,132,199,0.14)';

  return (
    <View
      style={[
        styles.container,
        slim && styles.containerSlim,
        { backgroundColor: theme.colors.card, borderColor },
        slim && { borderWidth: 1 },
      ]}
    >
      <Search01Icon size={slim ? 14 : 16} color={theme.colors.textMuted} />
      <TextInput
        style={[styles.input, slim && styles.inputSlim, { color: theme.colors.text }]}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        onFocus={onInputFocus}
        onBlur={onInputBlur}
        placeholder={resolvedPlaceholder}
        placeholderTextColor={theme.colors.inputPlaceholder}
        autoCapitalize='characters'
        returnKeyType='search'
        editable={!disabled}
      />
      {showScanButton ? (
        <Pressable
          onPress={onScanPress}
          disabled={disabled}
          style={[
            styles.scanBtn,
            slim && styles.scanBtnSlim,
            {
              backgroundColor: isDark ? 'rgba(56,189,248,0.10)' : 'rgba(2,132,199,0.06)',
              borderColor: isDark ? 'rgba(56,189,248,0.22)' : 'rgba(2,132,199,0.14)',
            },
          ]}
        >
          <BarCode01Icon size={slim ? 14 : 16} color={theme.colors.primary} />
          <View style={[styles.corner, styles.cornerTopLeft, slim && styles.cornerSlim, { borderColor: theme.colors.primary }]} />
          <View style={[styles.corner, styles.cornerTopRight, slim && styles.cornerSlim, { borderColor: theme.colors.primary }]} />
          <View style={[styles.corner, styles.cornerBottomLeft, slim && styles.cornerSlim, { borderColor: theme.colors.primary }]} />
          <View style={[styles.corner, styles.cornerBottomRight, slim && styles.cornerSlim, { borderColor: theme.colors.primary }]} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    color: COLORS.inputPlaceholder,
  },
  containerSlim: {
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minHeight: 46,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  inputSlim: {
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 0,
    letterSpacing: 0.1,
  },
  scanBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  scanBtnSlim: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
  },
  corner: { position: 'absolute', width: 8, height: 8, borderColor: COLORS.primary },
  cornerSlim: { width: 6, height: 6 },
  cornerTopLeft: { top: 3, left: 3, borderTopWidth: 1.3, borderLeftWidth: 1.3 },
  cornerTopRight: { top: 3, right: 3, borderTopWidth: 1.3, borderRightWidth: 1.3 },
  cornerBottomLeft: { bottom: 3, left: 3, borderBottomWidth: 1.3, borderLeftWidth: 1.3 },
  cornerBottomRight: { bottom: 3, right: 3, borderBottomWidth: 1.3, borderRightWidth: 1.3 },
});
