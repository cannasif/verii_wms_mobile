import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Building03Icon, Mail02Icon, UserCircleIcon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { Text } from '@/components/ui/Text';
import { RADII, SPACING } from '@/constants/theme';
import { getAppInfo } from '@/lib/appInfo';
import { useTheme } from '@/providers/ThemeProvider';
import { getUserDisplayName } from '@/features/auth/utils';
import { useAuthStore } from '@/store/auth';

export default function ProfileScreen(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const branch = useAuthStore((state) => state.branch);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const appInfo = getAppInfo();

  return (
    <PageShell>
      <ScreenHeader title={t('screens.profile.title')} subtitle={t('screens.profile.subtitle')} />

      <SectionCard style={styles.card}>
        <InfoRow
          icon={<UserCircleIcon size={18} color={theme.colors.primary} />}
          iconBackgroundColor={theme.colors.glow}
          label={t('screens.profile.user')}
          labelColor={theme.colors.textSecondary}
          value={getUserDisplayName(user ?? undefined) || user?.name || '-'}
        />
        <InfoRow
          icon={<Mail02Icon size={18} color={theme.colors.primary} />}
          iconBackgroundColor={theme.colors.glow}
          label={t('screens.profile.email')}
          labelColor={theme.colors.textSecondary}
          value={user?.email ?? '-'}
        />
        <InfoRow
          icon={<Building03Icon size={18} color={theme.colors.primary} />}
          iconBackgroundColor={theme.colors.glow}
          label={t('screens.profile.branch')}
          labelColor={theme.colors.textSecondary}
          value={branch?.name ?? t('screens.profile.noBranch')}
        />
        <InfoRow
          icon={<Building03Icon size={18} color={theme.colors.primary} />}
          iconBackgroundColor={theme.colors.glow}
          label={t('screens.profile.version')}
          labelColor={theme.colors.textSecondary}
          value={appInfo.version}
        />
        <Pressable style={styles.notesLink} onPress={() => router.push('/release-notes')}>
          <Text style={[styles.notesLinkText, { color: theme.colors.primary }]}>{t('updates.viewNotes')}</Text>
        </Pressable>
      </SectionCard>

      <Pressable
        style={[
          styles.logout,
          { backgroundColor: `${theme.colors.danger}1F`, borderColor: `${theme.colors.danger}52` },
        ]}
        onPress={() => {
          void clearAuth();
          router.replace('/(auth)/login');
        }}
      >
        <Text style={[styles.logoutText, { color: theme.colors.danger }]}>{t('common.logout')}</Text>
      </Pressable>
    </PageShell>
  );
}

function InfoRow({
  icon,
  iconBackgroundColor,
  label,
  labelColor,
  value,
}: {
  icon: React.ReactNode;
  iconBackgroundColor: string;
  label: string;
  labelColor: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: iconBackgroundColor }]}>{icon}</View>
      <View style={styles.infoCopy}>
        <Text style={[styles.infoLabel, { color: labelColor }]}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: SPACING.xl },
  infoRow: { flexDirection: 'row', gap: SPACING.sm + 2, alignItems: 'center' },
  infoIcon: { width: 40, height: 40, borderRadius: RADII.sm, alignItems: 'center', justifyContent: 'center' },
  infoCopy: { flex: 1, gap: SPACING.xxs },
  infoLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  infoValue: { fontSize: 15, fontWeight: '800' },
  notesLink: { marginTop: SPACING.xs, alignSelf: 'flex-start' },
  notesLinkText: { fontWeight: '800' },
  logout: { marginTop: SPACING.xl, borderRadius: RADII.lg, paddingVertical: SPACING.md, alignItems: 'center', borderWidth: 1 },
  logoutText: { fontWeight: '800' },
});
