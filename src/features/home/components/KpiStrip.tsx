import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { useHomeStats } from '../hooks/useHomeStats';
import { WarehouseIcon, ShipmentTrackingIcon, PackageSearchIcon } from 'hugeicons-react-native';

const KPI_CONFIG = [
  {
    key: 'kpi1' as const,
    Icon: WarehouseIcon,
    dark:  { bg: 'rgba(14,165,233,0.10)', border: 'rgba(14,165,233,0.28)', color: '#0ea5e9' },
    light: { bg: 'rgba(2,132,199,0.06)',  border: 'rgba(2,132,199,0.22)',  color: '#0284c7' },
  },
  {
    key: 'kpi2' as const,
    Icon: ShipmentTrackingIcon,
    dark:  { bg: 'rgba(20,184,166,0.10)', border: 'rgba(20,184,166,0.26)', color: '#14b8a6' },
    light: { bg: 'rgba(13,148,136,0.06)', border: 'rgba(13,148,136,0.22)', color: '#0d9488' },
  },
  {
    key: 'kpi3' as const,
    Icon: PackageSearchIcon,
    dark:  { bg: 'rgba(249,115,22,0.09)', border: 'rgba(249,115,22,0.24)', color: '#f97316' },
    light: { bg: 'rgba(234,88,12,0.06)',  border: 'rgba(234,88,12,0.20)',  color: '#ea580c' },
  },
] as const;

export function KpiStrip(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { data, isPending } = useHomeStats();
  const isDark = theme.mode === 'dark';

  const VALUES: Record<'kpi1' | 'kpi2' | 'kpi3', number> = {
    kpi1: data?.pendingReceipt ?? 0,
    kpi2: data?.readyShipment ?? 0,
    kpi3: data?.pendingTransfer ?? 0,
  };

  return (
    <View style={styles.row}>
      {KPI_CONFIG.map(({ key, Icon, dark, light }) => {
        const tone = isDark ? dark : light;
        return (
          <View key={key} style={[styles.card, { backgroundColor: tone.bg, borderColor: tone.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: `${tone.color}22` }]}>
              <Icon size={18} color={tone.color} />
            </View>
            <Text style={[styles.value, { color: tone.color }]}>
              {isPending ? '—' : String(VALUES[key])}
            </Text>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>
              {t(`welcome.${key}`)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 5,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.2,
    color: COLORS.primary,
    textAlign: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
