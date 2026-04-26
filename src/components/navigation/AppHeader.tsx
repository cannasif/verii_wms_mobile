import React, { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Notification02Icon, UserIcon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/providers/ThemeProvider';
import { getUserDisplayName, getUserInitialLetter } from '@/features/auth/utils';
import { useAuthStore } from '@/store/auth';
import { ProfilePanel } from './ProfilePanel';
import { router } from 'expo-router';

function headerBottomSeparation(isLight: boolean) {
  return Platform.select({
    ios: {
      shadowColor: isLight ? '#0f172a' : '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isLight ? 0.07 : 0.28,
      shadowRadius: 6,
    },
    android: { elevation: isLight ? 3 : 5 },
    default: {},
  });
}

function softShadow(themeMode: 'light' | 'dark') {
  if (themeMode === 'light') {
    return Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      default: {},
    });
  }
  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.35,
      shadowRadius: 3,
    },
    android: { elevation: 3 },
    default: {},
  });
}

export type AppHeaderProps = {
  notificationCount?: number;
};

export function AppHeader({ notificationCount = 0 }: AppHeaderProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const branch = useAuthStore((state) => state.branch);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isLight = theme.mode === 'light';
  const headerBg = isLight ? theme.colors.card : theme.colors.backgroundSecondary;
  const pillBg = isLight ? 'rgba(224, 242, 254, 0.72)' : 'rgba(56, 189, 248, 0.1)';
  const pillBorder = isLight ? 'rgba(14, 165, 233, 0.42)' : 'rgba(125, 211, 252, 0.28)';
  const dividerColor = isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.14)';
  const notifBtnBg = isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.06)';
  const notifBtnBorder = isLight ? 'rgba(15, 23, 42, 0.14)' : 'rgba(255, 255, 255, 0.18)';
  const notifBadgeRing = isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(7, 18, 36, 0.9)';
  const headerBottomBorder = isLight ? 'rgba(15, 23, 42, 0.1)' : 'rgba(128, 176, 255, 0.22)';
  const bellColor = isLight ? theme.colors.textMuted : theme.colors.text;
  const showNotifBadge = notificationCount > 0;
  const badgeLabel = notificationCount > 9 ? '9+' : String(notificationCount);

  return (
    <>
      <View
        style={[
          styles.header,
          softShadow(theme.mode),
          {
            paddingTop: insets.top + 6,
            backgroundColor: headerBg,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.leftCluster}>
          <View style={styles.logoWrap}>
            <Image source={require('../../../assets/v3riiwms.png')} style={styles.brandMark} resizeMode="contain" />
          </View>
          <View style={[styles.divider, { backgroundColor: dividerColor }]} />
          <View style={[styles.statusPill, { backgroundColor: pillBg, borderColor: pillBorder }]}>
            <View style={styles.statusDot} />
            <View style={styles.statusLabelWrap}>
              <Text
                style={[styles.statusLabel, { color: theme.colors.text }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {branch?.name ?? t('screens.profile.noBranch')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[
              styles.iconBtn,
              softShadow(theme.mode),
              {
                borderColor: notifBtnBorder,
                backgroundColor: notifBtnBg,
              },
            ]}
          >
            <Notification02Icon size={20} color={bellColor} />
            {showNotifBadge ? (
              <View
                style={[
                  styles.notifBadge,
                  badgeLabel.length > 1 ? styles.notifBadgeWide : null,
                  { borderColor: notifBadgeRing },
                ]}
              >
                <Text style={styles.notifBadgeText}>{badgeLabel}</Text>
              </View>
            ) : null}
          </Pressable>
          <TouchableOpacity
            onPress={() => setIsProfileOpen(true)}
            activeOpacity={0.85}
            style={styles.avatarRoot}
            accessibilityRole="button"
            accessibilityLabel={t('screens.profile.title')}
          >
            <LinearGradient colors={theme.gradients.primary} style={styles.avatarGradient}>
              <View style={[styles.avatarFace, { backgroundColor: theme.mode === 'light' ? '#eff6ff' : '#09172c' }]}>
                {user ? (
                  <Text style={styles.avatarText}>{getUserInitialLetter(user)}</Text>
                ) : (
                  <UserIcon size={18} color={theme.colors.text} />
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <ProfilePanel
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        displayName={getUserDisplayName(user ?? undefined)}
        email={user?.email}
        branch={branch?.name}
        onLogout={() => {
          void clearAuth();
          router.replace('/(auth)/login');
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    paddingLeft: 10,
    paddingRight: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  leftCluster: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    minWidth: 0,
    maxWidth: '100%',
    gap: 4,
    marginRight: 8,
  },
  logoWrap: {
    justifyContent: 'center',
    flexShrink: 0,
  },
  brandMark: {
    height: 40,
    width: 100,
    marginHorizontal: -20,
  },
  divider: {
    alignSelf: 'stretch',
    width: StyleSheet.hairlineWidth,
    minWidth: 1,
    marginVertical: 2,
    borderRadius: 1,
    flexShrink: 0,
  },
  statusPill: {
    width: 116,
    maxWidth: '100%',
    flexShrink: 1,
    minWidth: 72,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    flexShrink: 0,
  },
  statusLabelWrap: {
    flex: 1,
    minWidth: 0,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexGrow: 0,
    flexShrink: 0,
    zIndex: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  notifBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeWide: {
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    top: 2,
    right: 2,
    borderWidth: 2,
  },
  notifBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  avatarRoot: {
    width: 42,
    height: 42,
    borderRadius: 14,
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarGradient: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFace: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
