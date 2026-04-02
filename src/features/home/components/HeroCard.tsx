import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { COLORS, GRADIENTS } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/store/auth';

export function HeroCard(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const branch = useAuthStore((state) => state.branch);

  return (
    <LinearGradient colors={theme.gradients.hero} style={[styles.card, { borderColor: theme.colors.border }]}>
      <View style={styles.copy}>
        <Text style={[styles.greeting, { color: theme.colors.primary }]}>{t('welcome.greeting')}, {user?.name ?? t('screens.profile.userFallback')}</Text>
        <Text style={styles.headline}>{t('welcome.headline')}</Text>
        <Text style={[styles.subheadline, { color: theme.colors.textSecondary }]}>{t('welcome.subheadline')}</Text>
        <View style={[styles.branchPill, { borderColor: theme.colors.border, backgroundColor: theme.mode === 'light' ? 'rgba(255,255,255,0.65)' : 'rgba(8,16,31,0.55)' }]}>
          <Text style={[styles.branchText, { color: theme.colors.accent }]}>{branch?.name ?? t('screens.profile.noBranch')}</Text>
        </View>
      </View>
      <Image source={require('../../../../assets/v3riiwms.png')} style={styles.logo} resizeMode="contain" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 28, padding: 22, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', minHeight: 210 },
  copy: { maxWidth: '70%', gap: 10 },
  greeting: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  headline: { fontSize: 26, fontWeight: '900', lineHeight: 32 },
  subheadline: { color: COLORS.textSecondary, lineHeight: 20 },
  branchPill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(8,16,31,0.55)', borderWidth: 1, borderColor: COLORS.border, marginTop: 4 },
  branchText: { fontSize: 12, fontWeight: '700', color: COLORS.accent },
  logo: { position: 'absolute', right: -8, bottom: 6, width: 180, height: 180, opacity: 0.92 },
});
