import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight01Icon,
  Building03Icon,
  Cancel01Icon,
  Globe02Icon,
  Logout01Icon,
  Moon02Icon,
  Sun01Icon,
  UserCircleIcon,
} from 'hugeicons-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/Text';
import { RADII, SPACING } from '@/constants/theme';
import { cycleLanguage, getCurrentLanguageLabel } from '@/locales';
import { useTheme } from '@/providers/ThemeProvider';

const { width } = Dimensions.get('window');
const PANEL_WIDTH = width * 0.84;

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  email?: string;
  branch?: string;
  onLogout: () => void;
}

export function ProfilePanel({
  isOpen,
  onClose,
  userName,
  email,
  branch,
  onLogout,
}: ProfilePanelProps): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, mode, toggleThemeMode } = useTheme();
  const [isVisible, setIsVisible] = useState(isOpen);
  const translateX = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: PANEL_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
    });
  }, [backdropOpacity, isOpen, translateX]);

  if (!isVisible) {
    return null;
  }

  return (
    <Modal transparent visible={isVisible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.container}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.backdrop,
              {
                opacity: backdropOpacity,
                backgroundColor: theme.mode === 'light' ? 'rgba(148,163,184,0.34)' : 'rgba(3, 9, 18, 0.58)',
              },
            ]}
          />
        </Pressable>

        <Animated.View
          style={[
            styles.panel,
            {
              width: PANEL_WIDTH,
              top: insets.top,
              bottom: 0,
              paddingBottom: Math.max(insets.bottom, SPACING.md),
              backgroundColor: theme.colors.card,
              borderLeftColor: theme.colors.border,
              transform: [{ translateX }],
            },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.04)' : 'rgba(255,255,255,0.05)',
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={onClose}
            >
              <Cancel01Icon size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.hero}>
              <LinearGradient colors={theme.gradients.primary} style={styles.avatarBorder}>
                <View style={[styles.avatarInner, { backgroundColor: theme.mode === 'light' ? '#eff6ff' : '#09172c' }]}>
                  <Text style={styles.avatarText}>{(userName?.slice(0, 1) || 'W').toUpperCase()}</Text>
                </View>
              </LinearGradient>
              <Text style={styles.userName}>{userName || t('panel.defaultUser')}</Text>
              <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>{email || '-'}</Text>
              <View
                style={[
                  styles.branchBadge,
                  {
                    backgroundColor: theme.mode === 'light' ? 'rgba(249,115,22,0.08)' : 'rgba(249,115,22,0.12)',
                    borderColor: theme.mode === 'light' ? 'rgba(249,115,22,0.22)' : 'rgba(249,115,22,0.18)',
                  },
                ]}
              >
                <Building03Icon size={14} color={theme.colors.accent} />
                <Text style={[styles.branchText, { color: theme.colors.accent }]}>{branch || t('screens.profile.noBranch')}</Text>
              </View>
            </View>

            <Text style={[styles.groupTitle, { color: theme.colors.textMuted }]}>{t('panel.account')}</Text>
            <View
              style={[
                styles.group,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.03)',
                },
              ]}
            >
              <TouchableOpacity
                style={styles.row}
                onPress={() => {
                  onClose();
                  setTimeout(() => {
                    router.push('/(tabs)/profile');
                  }, 180);
                }}
              >
                <View style={[styles.iconBox, styles.profileIconBox, { backgroundColor: theme.mode === 'light' ? 'rgba(59,130,246,0.10)' : 'rgba(56,189,248,0.1)' }]}>
                  <UserCircleIcon size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{t('panel.profileTitle')}</Text>
                  <Text style={[styles.rowDescription, { color: theme.colors.textSecondary }]}>{t('panel.profileDescription')}</Text>
                </View>
                <ArrowRight01Icon size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

              <TouchableOpacity
                style={styles.row}
                onPress={() => {
                  onClose();
                  setTimeout(() => {
                    router.push('/(tabs)/settings');
                  }, 180);
                }}
              >
                <View style={[styles.iconBox, styles.languageIconBox, { backgroundColor: theme.mode === 'light' ? 'rgba(14,165,233,0.10)' : 'rgba(14,165,233,0.12)' }]}>
                  <Globe02Icon size={20} color={theme.colors.primaryStrong} />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{t('panel.settingsTitle')}</Text>
                  <Text style={[styles.rowDescription, { color: theme.colors.textSecondary }]}>{t('panel.settingsDescription')}</Text>
                </View>
                <ArrowRight01Icon size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.groupTitle, { color: theme.colors.textMuted }]}>{t('panel.preferences')}</Text>
            <View
              style={[
                styles.group,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.03)',
                },
              ]}
            >
              <View style={styles.row}>
                <View style={[styles.iconBox, styles.languageIconBox, { backgroundColor: theme.mode === 'light' ? 'rgba(14,165,233,0.10)' : 'rgba(14,165,233,0.12)' }]}>
                  <Globe02Icon size={20} color={theme.colors.primaryStrong} />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{t('panel.language')}</Text>
                  <Text style={[styles.rowDescription, { color: theme.colors.textSecondary }]}>{t('panel.languageDescription')}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.languagePill,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.04)' : 'rgba(255,255,255,0.04)',
                    },
                  ]}
                  onPress={() => void cycleLanguage()}
                >
                  <Text style={[styles.languagePillText, { color: theme.colors.primary }]}>{getCurrentLanguageLabel()}</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

              <View style={styles.row}>
                <View style={[styles.iconBox, styles.appearanceIconBox, { backgroundColor: theme.mode === 'light' ? 'rgba(249,115,22,0.10)' : 'rgba(249,115,22,0.12)' }]}>
                  {mode === 'dark' ? (
                    <Moon02Icon size={20} color={theme.colors.primary} />
                  ) : (
                    <Sun01Icon size={20} color={theme.colors.primary} />
                  )}
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{t('panel.appearance')}</Text>
                  <Text style={[styles.rowDescription, { color: theme.colors.textSecondary }]}>{t('panel.appearanceDescription')}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.languagePill,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.04)' : 'rgba(255,255,255,0.04)',
                    },
                  ]}
                  onPress={() => void toggleThemeMode()}
                >
                  <Text style={[styles.languagePillText, { color: theme.colors.primary }]}>
                    {mode === 'dark' ? t('panel.appearanceDark') : t('panel.appearanceLight')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.logoutButton,
                {
                  borderColor: theme.mode === 'light' ? 'rgba(239,68,68,0.24)' : 'rgba(251,113,133,0.28)',
                  backgroundColor: theme.mode === 'light' ? 'rgba(239,68,68,0.06)' : 'rgba(251,113,133,0.08)',
                },
              ]}
              onPress={() => {
                onClose();
                setTimeout(() => onLogout(), 180);
              }}
            >
              <Logout01Icon size={18} color={theme.colors.danger} />
              <Text style={[styles.logoutText, { color: theme.colors.danger }]}>{t('common.logout')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backdrop: {},
  panel: {
    position: 'absolute',
    right: 0,
    borderLeftWidth: 1,
    borderTopLeftRadius: RADII.xxl,
    borderBottomLeftRadius: RADII.xxl,
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowOffset: { width: -8, height: 0 },
    shadowRadius: 24,
    elevation: 20,
  },
  header: {
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  avatarBorder: {
    width: 98,
    height: 98,
    borderRadius: 49,
    padding: 3,
    marginBottom: 14,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  userEmail: {
    marginBottom: 12,
  },
  branchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs - 1,
    borderRadius: RADII.pill,
    borderWidth: 1,
  },
  branchText: {
    fontSize: 12,
    fontWeight: '800',
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xxs,
  },
  group: {
    borderRadius: RADII.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: SPACING.lg + 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm + 2,
  },
  rowCopy: {
    flex: 1,
    gap: SPACING.xxs,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  rowDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginLeft: 66,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconBox: {},
  languageIconBox: {},
  appearanceIconBox: {},
  languagePill: {
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADII.pill,
    borderWidth: 1,
  },
  languagePillText: {
    fontSize: 12,
    fontWeight: '900',
  },
  logoutButton: {
    marginTop: SPACING.xs - 2,
    borderRadius: RADII.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(251,113,133,0.28)',
    backgroundColor: 'rgba(251,113,133,0.08)',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '900',
  },
});
