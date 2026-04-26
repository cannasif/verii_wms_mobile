import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { HOME_MODULES } from '../constants/modules';

// Distinct colored icon background per quick action
const PALETTES = [
  { dark: { bg: 'rgba(14,165,233,0.15)', border: 'rgba(14,165,233,0.30)', icon: '#0ea5e9' }, light: { bg: 'rgba(2,132,199,0.09)',  border: 'rgba(2,132,199,0.24)',  icon: '#0284c7' } },
  { dark: { bg: 'rgba(249,115,22,0.14)', border: 'rgba(249,115,22,0.28)', icon: '#f97316' }, light: { bg: 'rgba(234,88,12,0.09)',  border: 'rgba(234,88,12,0.24)',  icon: '#ea580c' } },
  { dark: { bg: 'rgba(20,184,166,0.14)', border: 'rgba(20,184,166,0.28)', icon: '#14b8a6' }, light: { bg: 'rgba(13,148,136,0.09)', border: 'rgba(13,148,136,0.24)', icon: '#0d9488' } },
  { dark: { bg: 'rgba(139,92,246,0.14)', border: 'rgba(139,92,246,0.28)', icon: '#8b5cf6' }, light: { bg: 'rgba(124,58,237,0.09)', border: 'rgba(124,58,237,0.24)', icon: '#7c3aed' } },
] as const;

export function ModuleGrid(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const isDark = theme.mode === 'dark';

  const routeMap: Record<(typeof HOME_MODULES)[number]['key'], string> = {
    receipt: '/(tabs)/flows/goods-receipt',
    transfer: '/(tabs)/flows/transfer',
    inventory: '/(tabs)/inventory',
    activity: '/(tabs)/operations',
  };

  return (
    <View style={styles.row}>
      {HOME_MODULES.map((item, index) => {
        const Icon = item.icon;
        const p = PALETTES[index % PALETTES.length];
        const tone = isDark ? p.dark : p.light;
        return (
          <Pressable
            key={item.key}
            style={styles.item}
            android_ripple={{ color: tone.border, borderless: true }}
            onPress={() => router.push(routeMap[item.key] as never)}
          >
            <View style={[styles.iconBox, { backgroundColor: tone.bg, borderColor: tone.border }]}>
              <Icon size={22} color={tone.icon} />
            </View>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              {t(item.titleKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 7,
    paddingVertical: 4,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
    color: COLORS.textSecondary,
  },
});
