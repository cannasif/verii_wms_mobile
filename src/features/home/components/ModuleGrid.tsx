import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { HOME_MODULES } from '../constants/modules';

export function ModuleGrid(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();

  const routeMap: Record<(typeof HOME_MODULES)[number]['key'], string> = {
    receipt: '/(tabs)/flows/goods-receipt',
    transfer: '/(tabs)/flows/transfer',
    inventory: '/(tabs)/inventory',
    activity: '/(tabs)/operations',
  };

  return (
    <View style={styles.grid}>
      {HOME_MODULES.map((item) => {
        const Icon = item.icon;
        return (
          <Pressable key={item.key} style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} onPress={() => router.push(routeMap[item.key] as never)}>
            <View style={[styles.iconWrap, { backgroundColor: theme.mode === 'light' ? 'rgba(59,130,246,0.10)' : 'rgba(56,189,248,0.1)' }]}><Icon size={22} color={theme.colors.primary} /></View>
            <Text style={styles.title}>{t(item.titleKey)}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{t(item.subtitleKey)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '48%', backgroundColor: COLORS.card, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border, padding: 16, minHeight: 148, gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(56,189,248,0.1)' },
  title: { fontSize: 16, fontWeight: '800' },
  subtitle: { color: COLORS.textSecondary, lineHeight: 18 }
});
