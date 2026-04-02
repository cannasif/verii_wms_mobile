import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { useTranslation } from 'react-i18next';

const DATA = [
  { key: 'kpi1', value: '18' },
  { key: 'kpi2', value: '06' },
  { key: 'kpi3', value: '04' }
] as const;

export function KpiStrip(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  return (
    <View style={styles.row}>
      {DATA.map((item) => (
        <View key={item.key} style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={styles.value}>{item.value}</Text>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t(`welcome.${item.key}`)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  card: { flex: 1, backgroundColor: COLORS.card, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 8 },
  value: { fontSize: 24, fontWeight: '900' },
  label: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' }
});
