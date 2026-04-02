import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { LAYOUT, RADII, SPACING } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { Text } from './Text';

interface ScreenStateProps {
  tone: 'loading' | 'empty' | 'error';
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export function ScreenState({
  tone,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}: ScreenStateProps): React.ReactElement {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }, compact && styles.compactCard]}>
      {tone === 'loading' ? <ActivityIndicator color={theme.colors.primary} /> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.actionText, { color: theme.colors.background }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: SPACING.lg,
    borderRadius: RADII.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: SPACING.xs,
    minHeight: 140,
    justifyContent: 'center',
  },
  compactCard: {
    marginTop: 0,
    minHeight: 120,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  description: { textAlign: 'center', lineHeight: 20, maxWidth: LAYOUT.screenPadding * 12 },
  actionButton: {
    marginTop: SPACING.xs,
    minHeight: 42,
    minWidth: 120,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { fontWeight: '900' },
});
