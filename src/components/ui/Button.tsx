import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Text';
import { LAYOUT, RADII } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
}

export function Button({ title, onPress, disabled, loading, tone = 'primary', style }: ButtonProps): React.ReactElement {
  const { theme } = useTheme();

  return (
    <Pressable disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.wrapper, style, pressed && !disabled ? styles.pressed : null, disabled ? styles.disabled : null]}>
      {tone === 'primary' ? (
        <LinearGradient colors={theme.gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradient}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.title}>{title}</Text>}
        </LinearGradient>
      ) : (
        <Pressable style={[styles.secondarySurface, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]}>
          {loading ? <ActivityIndicator color={theme.colors.primary} /> : <Text style={[styles.secondaryTitle, { color: theme.colors.primary }]}>{title}</Text>}
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: RADII.lg,
    overflow: 'hidden'
  },
  gradient: {
    minHeight: LAYOUT.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondarySurface: {
    minHeight: LAYOUT.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: RADII.lg,
  },
  title: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16
  },
  secondaryTitle: {
    fontWeight: '800',
    fontSize: 16,
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.55 }
});
