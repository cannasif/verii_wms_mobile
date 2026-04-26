import React from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { LAYOUT, RADII, SPACING } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { Text } from './Text';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  /** Daha alçak satırlar, küçük etiket; uzun formlar için. */
  compact?: boolean;
}

interface FormPickerFieldProps {
  label: string;
  value: string;
  onPress: () => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  compact?: boolean;
}

const COMPACT_H = 40;
const DEFAULT_H = LAYOUT.inputHeight;

export function FormField({
  label,
  error,
  helperText,
  required = false,
  style,
  leading,
  trailing,
  compact = false,
  ...inputProps
}: FormFieldProps): React.ReactElement {
  const { theme } = useTheme();
  const multiline = Boolean(inputProps.multiline);
  const h = multiline && compact ? 64 : compact ? COMPACT_H : DEFAULT_H;
  return (
    <View style={[styles.wrapper, compact ? styles.wrapperCompact : null]}>
      <Text
        style={[
          styles.label,
          compact ? styles.labelCompact : null,
          { color: theme.colors.textSecondary },
        ]}
      >
        {label}
        {required ? ' *' : ''}
      </Text>
      <View
        style={[
          styles.inputShell,
          compact ? styles.inputShellCompact : null,
          multiline && styles.inputShellMultiline,
          {
            backgroundColor: theme.colors.surfaceStrong,
            borderColor: error ? theme.colors.danger : 'rgba(128, 176, 255, 0.24)',
            borderWidth: error ? 1.5 : 1,
            minHeight: h,
          },
        ]}
      >
        {leading ? <View style={[styles.leading, multiline && styles.leadingMultiline]}>{leading}</View> : null}
        <TextInput
          {...inputProps}
          style={[styles.input, { color: theme.colors.text, minHeight: h }, multiline && styles.inputMultiline, style]}
          placeholderTextColor={inputProps.placeholderTextColor ?? theme.colors.inputPlaceholder}
        />
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      {error ? (
        <Text style={[styles.error, compact ? styles.errorCompact : null, { color: theme.colors.danger }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helper, { color: theme.colors.textMuted }]}>{helperText}</Text>
      ) : null}
    </View>
  );
}

export function FormPickerField({
  label,
  value,
  onPress,
  error,
  helperText,
  required = false,
  leading,
  trailing,
  compact = false,
}: FormPickerFieldProps): React.ReactElement {
  const { theme } = useTheme();
  const h = compact ? COMPACT_H : DEFAULT_H;
  return (
    <View style={[styles.wrapper, compact ? styles.wrapperCompact : null]}>
      <Text
        style={[
          styles.label,
          compact ? styles.labelCompact : null,
          { color: theme.colors.textSecondary },
        ]}
      >
        {label}
        {required ? ' *' : ''}
      </Text>
      <Pressable
        style={[
          styles.pickerField,
          compact ? styles.pickerFieldCompact : null,
          {
            backgroundColor: theme.colors.surfaceStrong,
            borderColor: error ? theme.colors.danger : 'rgba(128, 176, 255, 0.24)',
            borderWidth: error ? 1.5 : 1,
            minHeight: h,
          },
        ]}
        onPress={onPress}
      >
        {leading ? <View style={styles.leading}>{leading}</View> : null}
        <Text
          numberOfLines={2}
          style={[
            styles.pickerText,
            compact ? styles.pickerTextCompact : null,
            { color: theme.colors.text },
          ]}
        >
          {value}
        </Text>
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </Pressable>
      {error ? (
        <Text style={[styles.error, compact ? styles.errorCompact : null, { color: theme.colors.danger }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helper, { color: theme.colors.textMuted }]}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: SPACING.xs - 2,
  },
  wrapperCompact: {
    gap: 4,
  },
  label: {
    fontWeight: '800',
  },
  labelCompact: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputShell: {
    minHeight: LAYOUT.inputHeight,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  inputShellCompact: {
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.sm + 2,
  },
  inputShellMultiline: {
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  leadingMultiline: { paddingTop: 4 },
  inputMultiline: { textAlignVertical: 'top' },
  pickerFieldCompact: {
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.sm + 2,
  },
  pickerTextCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorCompact: { fontSize: 11 },
  leading: {
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: LAYOUT.inputHeight,
  },
  pickerField: {
    minHeight: LAYOUT.inputHeight,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    justifyContent: 'center',
    borderWidth: 1,
  },
  pickerText: {
    flex: 1,
    fontWeight: '700',
  },
  error: { fontSize: 12, fontWeight: '700' },
  helper: { lineHeight: 19 },
});
