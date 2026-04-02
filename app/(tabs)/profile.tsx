import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Building03Icon, Mail02Icon, UserCircleIcon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { Text } from '@/components/ui/Text';
import { COLORS, RADII, SPACING } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

export default function ProfileScreen(): React.ReactElement {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const branch = useAuthStore((state) => state.branch);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return (
    <PageShell>
      <ScreenHeader title={t('screens.profile.title')} subtitle={t('screens.profile.subtitle')} />

      <SectionCard style={styles.card}>
        <InfoRow icon={<UserCircleIcon size={18} color={COLORS.primary} />} label={t('screens.profile.user')} value={user?.name ?? '-'} />
        <InfoRow icon={<Mail02Icon size={18} color={COLORS.primary} />} label={t('screens.profile.email')} value={user?.email ?? '-'} />
        <InfoRow icon={<Building03Icon size={18} color={COLORS.primary} />} label={t('screens.profile.branch')} value={branch?.name ?? t('screens.profile.noBranch')} />
      </SectionCard>

      <Pressable style={styles.logout} onPress={() => { void clearAuth(); router.replace('/(auth)/login'); }}>
        <Text style={styles.logoutText}>{t('common.logout')}</Text>
      </Pressable>
    </PageShell>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>{icon}</View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: SPACING.xl },
  infoRow: { flexDirection: 'row', gap: SPACING.sm + 2, alignItems: 'center' },
  infoIcon: { width: 40, height: 40, borderRadius: RADII.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(56,189,248,0.1)' },
  infoCopy: { flex: 1, gap: SPACING.xxs },
  infoLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  infoValue: { fontSize: 15, fontWeight: '800' },
  logout: { marginTop: SPACING.xl, borderRadius: RADII.lg, paddingVertical: SPACING.md, alignItems: 'center', backgroundColor: 'rgba(251,113,133,0.12)', borderWidth: 1, borderColor: 'rgba(251,113,133,0.32)' },
  logoutText: { color: COLORS.danger, fontWeight: '800' },
});
