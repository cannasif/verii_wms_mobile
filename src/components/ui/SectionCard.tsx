import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { RADII, SPACING } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { Text } from './Text';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function SectionCard({
  title,
  subtitle,
  children,
  style,
  contentStyle,
}: SectionCardProps): React.ReactElement {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border }, style]}>
      {title || subtitle ? (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text> : null}
        </View>
      ) : null}
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: SPACING.sm,
    padding: SPACING.md + 2,
    borderRadius: RADII.xl,
    borderWidth: 1,
  },
  header: {
    gap: SPACING.xxs,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
  },
  subtitle: { lineHeight: 20 },
});
