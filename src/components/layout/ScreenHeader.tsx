import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft01Icon } from 'hugeicons-react-native';
import { Text } from '@/components/ui/Text';
import { RADII, SPACING } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  rightSlot,
}: ScreenHeaderProps): React.ReactElement {
  const { theme } = useTheme();
  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Pressable style={[styles.backButton, { borderColor: theme.colors.border, backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.03)' : 'rgba(255,255,255,0.04)' }]} onPress={onBack ?? (() => router.back())}>
          <ArrowLeft01Icon size={20} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.rightSlot}>{rightSlot ?? <View style={styles.placeholder} />}</View>
      </View>
      {subtitle ? <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: SPACING.sm + 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: SPACING.sm,
  },
  subtitle: { lineHeight: 22 },
  rightSlot: {
    width: 38,
    alignItems: 'flex-end',
  },
  placeholder: {
    width: 38,
  },
});
