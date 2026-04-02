import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { COLORS, LAYOUT, RADII, SPACING } from '@/constants/theme';
import { Text } from './Text';

interface SelectorFieldProps {
  value: string;
  onPress: () => void;
}

export function SelectorField({ value, onPress }: SelectorFieldProps): React.ReactElement {
  return (
    <Pressable style={styles.selector} onPress={onPress}>
      <Text style={styles.value}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  selector: {
    minHeight: LAYOUT.inputHeight,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceStrong,
    paddingHorizontal: SPACING.sm + 2,
    justifyContent: 'center',
  },
  value: {
    color: COLORS.text,
  },
});
