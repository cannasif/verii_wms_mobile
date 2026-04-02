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
}

export function FormField({
  label,
  error,
  helperText,
  required = false,
  style,
  leading,
  trailing,
  ...inputProps
}: FormFieldProps): React.ReactElement {
  const { theme } = useTheme();
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <View style={[styles.inputShell, { backgroundColor: theme.colors.surfaceStrong, borderColor: 'rgba(128, 176, 255, 0.24)' }]}>
        {leading ? <View style={styles.leading}>{leading}</View> : null}
        <TextInput
          {...inputProps}
          style={[styles.input, { color: theme.colors.text }, style]}
          placeholderTextColor={inputProps.placeholderTextColor ?? theme.colors.inputPlaceholder}
        />
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : helperText ? <Text style={[styles.helper, { color: theme.colors.textMuted }]}>{helperText}</Text> : null}
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
}: FormPickerFieldProps): React.ReactElement {
  const { theme } = useTheme();
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <Pressable style={[styles.pickerField, { backgroundColor: theme.colors.surfaceStrong, borderColor: 'rgba(128, 176, 255, 0.24)' }]} onPress={onPress}>
        {leading ? <View style={styles.leading}>{leading}</View> : null}
        <Text style={[styles.pickerText, { color: theme.colors.text }]}>{value}</Text>
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </Pressable>
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : helperText ? <Text style={[styles.helper, { color: theme.colors.textMuted }]}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: SPACING.xs - 2,
  },
  label: {
    fontWeight: '800',
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
  leading: {
    width: 20,
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
