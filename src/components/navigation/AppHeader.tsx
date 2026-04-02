import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Notification02Icon, UserIcon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/store/auth';
import { ProfilePanel } from './ProfilePanel';
import { router } from 'expo-router';

export function AppHeader(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const branch = useAuthStore((state) => state.branch);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <LinearGradient colors={theme.gradients.surface} style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: theme.colors.border }]}>
        <View style={styles.brandRow}>
          <Image source={require('../../../assets/v3logo.png')} style={styles.logo} resizeMode="contain" />
          <View style={styles.copy}>
            <Text style={styles.brand}>{t('common.appName')}</Text>
            <Text style={styles.caption}>{branch?.name ?? t('screens.profile.noBranch')}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable style={[styles.iconBtn, { borderColor: theme.colors.border, backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.04)' : 'rgba(255,255,255,0.05)' }]}><Notification02Icon size={18} color={theme.colors.text} /></Pressable>
          <TouchableOpacity onPress={() => setIsProfileOpen(true)} activeOpacity={0.85} style={styles.avatarBorder}>
            <LinearGradient colors={theme.gradients.primary} style={styles.avatarGradient}>
              <View style={[styles.avatar, { backgroundColor: theme.mode === 'light' ? '#eff6ff' : '#09172c' }]}>
                {user?.name ? (
                  <Text style={styles.avatarText}>{user.name.slice(0, 1).toUpperCase()}</Text>
                ) : (
                  <UserIcon size={18} color={theme.colors.text} />
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ProfilePanel
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userName={user?.name}
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
  header: { paddingHorizontal: 18, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { gap: 2 },
  logo: { width: 42, height: 42 },
  brand: { fontSize: 16, fontWeight: '900' },
  caption: { fontSize: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  avatarBorder: { width: 42, height: 42, borderRadius: 14, overflow: 'hidden' },
  avatarGradient: { flex: 1, padding: 2 },
  avatar: { flex: 1, borderRadius: 12, backgroundColor: '#09172c', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
