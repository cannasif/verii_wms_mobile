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
  /** Renders immediately to the left of the title (e.g. shortcut icon). */
  titleLeftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  titleLeftSlot,
  rightSlot,
}: ScreenHeaderProps): React.ReactElement {
  const { theme } = useTheme();
  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Pressable
          style={[
            styles.backButton,
            {
              borderColor: 'rgba(239,68,68,0.35)',
              backgroundColor: 'rgba(239,68,68,0.10)',
            },
          ]}
          onPress={onBack ?? (() => router.back())}
        >
          <ArrowLeft01Icon size={20} color="#ef4444" />
        </Pressable>
        <View style={styles.titleBlock}>
          {titleLeftSlot ? <View style={styles.titleLeft}>{titleLeftSlot}</View> : null}
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
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
    gap: 4,
  },
  titleBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
    gap: SPACING.xs,
    minWidth: 0,
  },
  titleLeft: {
    flexShrink: 0,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  headerTitle: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
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
