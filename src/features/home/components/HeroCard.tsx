import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/store/auth';
import { WarehouseIcon } from 'hugeicons-react-native';

export function HeroCard(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const branch = useAuthStore((state) => state.branch);
  const isDark = theme.mode === 'dark';

  const borderColor = isDark ? 'rgba(56,189,248,0.24)' : 'rgba(2,132,199,0.22)';

  return (
    <LinearGradient colors={theme.gradients.hero} style={[styles.card, { borderColor }]}>
      {/* top row: badge + greeting */}
      <View style={styles.topRow}>
        <View style={styles.greetingBlock}>
          <Text style={[styles.greetingLabel, { color: theme.colors.textSecondary }]}>
            {t('welcome.greeting')},
          </Text>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {user?.name ?? t('screens.profile.userFallback')}
          </Text>
        </View>
        <View style={[styles.badgePill, { backgroundColor: isDark ? 'rgba(56,189,248,0.10)' : 'rgba(2,132,199,0.07)', borderColor }]}>
          <Text style={[styles.badgeText, { color: theme.colors.primary }]}>{t('welcome.heroBadge')}</Text>
        </View>
      </View>

      {/* warehouse row */}
      <View style={[styles.warehouseRow, { backgroundColor: isDark ? 'rgba(56,189,248,0.08)' : 'rgba(2,132,199,0.06)', borderColor: isDark ? 'rgba(56,189,248,0.18)' : 'rgba(2,132,199,0.18)' }]}>
        <WarehouseIcon size={16} color={theme.colors.primary} />
        <Text style={[styles.warehouseName, { color: theme.colors.text }]}>
          {branch?.name ?? t('welcome.noWarehouse')}
        </Text>
      </View>

      {/* subheadline */}
      <Text style={[styles.sub, { color: theme.colors.textMuted }]}>
        {t('welcome.subheadline')}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  greetingBlock: { gap: 1 },
  greetingLabel: { fontSize: 11, fontWeight: '500', lineHeight: 15 },
  userName: { fontSize: 18, fontWeight: '800', lineHeight: 24, letterSpacing: 0.1 },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 2,
  },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  warehouseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  warehouseName: { fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
  sub: { fontSize: 11, lineHeight: 16 },
});
