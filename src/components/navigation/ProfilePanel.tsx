import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  Building03Icon,
  Call02Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Globe02Icon,
  InformationCircleIcon,
  Logout01Icon,
  Mail02Icon,
  Moon02Icon,
  Settings02Icon,
  Sun01Icon,
  UserCircleIcon,
  WhatsappIcon,
} from 'hugeicons-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/Text';
import { RADII, SPACING, type AppTheme, type ThemeMode } from '@/constants/theme';
import i18n, { SUPPORTED_LANGUAGES, getCurrentLanguageLabel, setLanguage, type SupportedLanguage } from '@/locales';
import { useTheme } from '@/providers/ThemeProvider';

const { width } = Dimensions.get('window');
const PANEL_WIDTH = Math.min(width * 0.82, 360);

const SUPPORT_WHATSAPP_URL = 'https://wa.me/9050701230188';
const SUPPORT_TEL_URI = 'tel:+905077108761';
const SUPPORT_MAIL_URL = 'mailto:info@v3rii.com';

function isLanguageActive(code: SupportedLanguage): boolean {
  const lng = i18n.language || 'tr';
  return lng === code || lng.startsWith(`${code}-`);
}

async function openExternalUrl(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {}
}

async function openSupportPhone(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await IntentLauncher.startActivityAsync('android.intent.action.DIAL', {
        data: SUPPORT_TEL_URI,
      });
      return;
    } catch {}
  }
  try {
    await Linking.openURL(SUPPORT_TEL_URI);
  } catch {
    try {
      await Linking.openURL('tel:905077108761');
    } catch {}
  }
}

function panelAvatarInitial(displayName: string | undefined): string {
  const t = displayName?.trim();
  if (!t) return 'W';
  return t[0].toLocaleUpperCase('tr-TR');
}

type IconSurfaceKind = 'profile' | 'settings' | 'theme' | 'language' | 'help';

function rowIconSurface(theme: AppTheme, kind: IconSurfaceKind): { bg: string; fg: string } {
  const light = theme.mode === 'light';
  switch (kind) {
    case 'profile':
      return {
        bg: light ? 'rgba(2, 132, 199, 0.12)' : 'rgba(56, 189, 248, 0.16)',
        fg: theme.colors.primaryStrong,
      };
    case 'settings':
      return {
        bg: light ? 'rgba(15, 23, 42, 0.07)' : 'rgba(248, 250, 252, 0.08)',
        fg: theme.colors.textSecondary,
      };
    case 'theme':
      return {
        bg: light ? 'rgba(2, 132, 199, 0.1)' : 'rgba(99, 102, 241, 0.2)',
        fg: light ? theme.colors.primaryStrong : '#e9d5ff',
      };
    case 'language':
      return {
        bg: light ? 'rgba(234, 88, 12, 0.11)' : 'rgba(251, 146, 60, 0.16)',
        fg: theme.colors.accent,
      };
    case 'help':
      return {
        bg: light ? 'rgba(5, 150, 105, 0.1)' : 'rgba(52, 211, 153, 0.14)',
        fg: theme.colors.success,
      };
    default:
      return { bg: 'transparent', fg: theme.colors.text };
  }
}

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  displayName?: string;
  email?: string;
  branch?: string;
  onLogout: () => void;
}

export function ProfilePanel({
  isOpen,
  onClose,
  displayName,
  email,
  branch,
  onLogout,
}: ProfilePanelProps): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { theme, mode, setThemeMode } = useTheme();
  const [isVisible, setIsVisible] = useState(isOpen);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const translateX = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isOpen) {
      setLangMenuOpen(false);
      setHelpOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: PANEL_WIDTH,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
    });
  }, [backdropOpacity, isOpen, translateX]);

  const backdropTint =
    theme.mode === 'light' ? 'rgba(15, 23, 42, 0.2)' : 'rgba(2, 6, 18, 0.52)';

  const panelSurface =
    theme.mode === 'light'
      ? (['#ffffff', '#f4f7fb', '#f1f5f9'] as const)
      : (['#141d2f', '#0f1729', '#0c1424'] as const);

  const avatarRingColors =
    theme.mode === 'light'
      ? (['#93c5fd', '#bfdbfe', '#e2e8f0'] as const)
      : (['#475569', '#334155', '#1e293b'] as const);

  const avatarInnerBg = theme.mode === 'light' ? '#f8fafc' : '#0a1220';
  const groupBg =
    theme.mode === 'light' ? 'rgba(255, 255, 255, 0.78)' : 'rgba(255, 255, 255, 0.04)';
  const groupBorder =
    theme.mode === 'light' ? 'rgba(15, 23, 42, 0.08)' : 'rgba(148, 163, 184, 0.12)';

  const surf = (k: IconSurfaceKind) => rowIconSurface(theme, k);

  const onThemeSwitch = (dark: boolean): void => {
    const next: ThemeMode = dark ? 'dark' : 'light';
    void setThemeMode(next);
  };

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
                backgroundColor: backdropTint,
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
              transform: [{ translateX }],
              borderLeftColor: groupBorder,
            },
          ]}
        >
          <LinearGradient colors={panelSurface} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.panelInner}>
            <View style={styles.header}>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed
                    ? {
                        backgroundColor:
                          theme.mode === 'light' ? 'rgba(254, 202, 202, 0.95)' : 'rgba(251, 113, 133, 0.22)',
                        borderColor:
                          theme.mode === 'light' ? 'rgba(239, 68, 68, 0.45)' : 'rgba(252, 165, 165, 0.45)',
                      }
                    : {
                        backgroundColor:
                          theme.mode === 'light' ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)',
                        borderColor: groupBorder,
                      },
                ]}
              >
                {({ pressed }) => (
                  <Cancel01Icon
                    size={20}
                    color={
                      pressed
                        ? theme.mode === 'light'
                          ? 'rgba(185, 28, 28, 0.95)'
                          : 'rgba(254, 202, 202, 0.98)'
                        : theme.colors.textMuted
                    }
                  />
                )}
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.heroBlock}>
                <View style={styles.avatarWrap}>
                  <LinearGradient colors={avatarRingColors} style={styles.avatarBorder}>
                    <View style={[styles.avatarInner, { backgroundColor: avatarInnerBg }]}>
                      <Text style={[styles.avatarText, { color: theme.colors.primaryStrong }]}>
                        {panelAvatarInitial(displayName)}
                      </Text>
                    </View>
                  </LinearGradient>
                  <View
                    style={[
                      styles.onlineDot,
                      {
                        backgroundColor: theme.colors.success,
                        borderColor: avatarInnerBg,
                      },
                    ]}
                  />
                </View>
              </View>

              <Text style={[styles.userName, { color: theme.colors.text }]}>
                {displayName?.trim() ? displayName.trim() : t('panel.defaultUser')}
              </Text>
              <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>{email?.trim() ? email.trim() : '—'}</Text>
              <View
                style={[
                  styles.branchBadge,
                  {
                    backgroundColor:
                      theme.mode === 'light' ? 'rgba(234, 88, 12, 0.07)' : 'rgba(251, 146, 60, 0.1)',
                    borderColor:
                      theme.mode === 'light' ? 'rgba(234, 88, 12, 0.18)' : 'rgba(251, 146, 60, 0.22)',
                  },
                ]}
              >
                <Building03Icon size={14} color={theme.colors.accent} />
                <Text style={[styles.branchText, { color: theme.colors.accent }]}>
                  {branch || t('screens.profile.noBranch')}
                </Text>
              </View>

              <Text style={[styles.groupTitle, { color: theme.colors.textMuted }]}>{t('panel.account')}</Text>
              <View style={[styles.group, { borderColor: groupBorder, backgroundColor: groupBg }]}>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => {
                    onClose();
                    setTimeout(() => {
                      router.push('/(tabs)/profile');
                    }, 180);
                  }}
                >
                  <View style={[styles.iconBox, { backgroundColor: surf('profile').bg }]}>
                    <UserCircleIcon size={20} color={surf('profile').fg} />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={[styles.rowTitle, { color: theme.colors.text }]}>{t('panel.profileSettingsTitle')}</Text>
                    <Text style={[styles.rowDescription, { color: theme.colors.textSecondary }]}>
                      {t('panel.profileDescription')}
                    </Text>
                  </View>
                  <ArrowRight01Icon size={18} color={theme.colors.textMuted} />
                </TouchableOpacity>

                <View style={[styles.divider, { backgroundColor: groupBorder }]} />

                <TouchableOpacity
                  style={styles.row}
                  onPress={() => {
                    onClose();
                    setTimeout(() => {
                      router.push('/(tabs)/settings');
                    }, 180);
                  }}
                >
                  <View style={[styles.iconBox, { backgroundColor: surf('settings').bg }]}>
                    <Settings02Icon size={20} color={surf('settings').fg} />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={[styles.rowTitle, { color: theme.colors.text }]}>{t('panel.generalSettingsTitle')}</Text>
                    <Text style={[styles.rowDescription, { color: theme.colors.textSecondary }]}>
                      {t('panel.settingsDescription')}
                    </Text>
                  </View>
                  <ArrowRight01Icon size={18} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.groupTitle, { color: theme.colors.textMuted }]}>{t('panel.preferences')}</Text>
              <View style={[styles.group, { borderColor: groupBorder, backgroundColor: groupBg }]}>
                <View style={styles.row}>
                  <View style={[styles.iconBox, { backgroundColor: surf('theme').bg }]}>
                    {mode === 'dark' ? (
                      <Moon02Icon size={20} color={surf('theme').fg} />
                    ) : (
                      <Sun01Icon size={20} color={surf('theme').fg} />
                    )}
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={[styles.rowTitle, { color: theme.colors.text }]}>
                      {mode === 'dark' ? t('panel.themeRowDark') : t('panel.themeRowLight')}
                    </Text>
                    <Text style={[styles.rowDescription, { color: theme.colors.textSecondary }]}>
                      {t('panel.appearancePersonalize')}
                    </Text>
                  </View>
                  <Switch
                    value={mode === 'dark'}
                    onValueChange={onThemeSwitch}
                    trackColor={{
                      false: theme.mode === 'light' ? 'rgba(15,23,42,0.12)' : 'rgba(148,163,184,0.22)',
                      true:
                        theme.mode === 'light'
                          ? 'rgba(2, 132, 199, 0.5)'
                          : 'rgba(139, 92, 246, 0.55)',
                    }}
                    thumbColor="#f8fafc"
                    ios_backgroundColor={
                      theme.mode === 'light' ? 'rgba(15,23,42,0.12)' : 'rgba(148,163,184,0.22)'
                    }
                  />
                </View>

                <View style={[styles.divider, { backgroundColor: groupBorder }]} />

                <Pressable
                  style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}
                  onPress={() => {
                    setLangMenuOpen((v) => !v);
                    setHelpOpen(false);
                  }}
                >
                  <View style={[styles.iconBox, { backgroundColor: surf('language').bg }]}>
                    <Globe02Icon size={20} color={surf('language').fg} />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={[styles.rowTitle, { color: theme.colors.text }]}>{t('panel.appLanguageTitle')}</Text>
                    <Text style={[styles.rowDescription, { color: theme.colors.textSecondary }]}>
                      {t('panel.languageDescription')}
                    </Text>
                  </View>
                  <View style={styles.rowTrail}>
                    <View
                      style={[
                        styles.langBadge,
                        {
                          borderColor: groupBorder,
                          backgroundColor:
                            theme.mode === 'light' ? 'rgba(15,23,42,0.04)' : 'rgba(255,255,255,0.06)',
                        },
                      ]}
                    >
                      <Text style={[styles.langBadgeText, { color: theme.colors.text }]}>{getCurrentLanguageLabel()}</Text>
                    </View>
                    {langMenuOpen ? (
                      <ArrowUp01Icon size={18} color={theme.colors.textMuted} />
                    ) : (
                      <ArrowDown01Icon size={18} color={theme.colors.textMuted} />
                    )}
                  </View>
                </Pressable>

                {langMenuOpen ? (
                  <View style={[styles.expandBlock, { backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.02)' : 'rgba(0,0,0,0.12)' }]}>
                    <View style={styles.langChipsRow}>
                      {SUPPORTED_LANGUAGES.map((code) => {
                        const active = isLanguageActive(code);
                        const label = code === 'tr' ? t('panel.languageNameTr') : t('panel.languageNameEn');
                        return (
                          <Pressable
                            key={code}
                            onPress={() => {
                              void setLanguage(code);
                            }}
                            style={({ pressed }) => [
                              styles.langChip,
                              {
                                borderColor: active ? theme.colors.primaryStrong : groupBorder,
                                backgroundColor: active
                                  ? theme.mode === 'light'
                                    ? theme.colors.primaryStrong
                                    : 'rgba(56, 189, 248, 0.35)'
                                  : theme.mode === 'light'
                                    ? 'rgba(255,255,255,0.85)'
                                    : 'rgba(255,255,255,0.05)',
                                opacity: pressed ? 0.9 : 1,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.langChipText,
                                {
                                  color: active
                                    ? theme.mode === 'light'
                                      ? '#ffffff'
                                      : theme.colors.text
                                    : theme.colors.text,
                                },
                              ]}
                            >
                              {label}
                            </Text>
                            {active ? (
                              <CheckmarkCircle02Icon
                                size={18}
                                color={active && theme.mode === 'light' ? '#ffffff' : theme.colors.primaryStrong}
                              />
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : null}

                <View style={[styles.divider, { backgroundColor: groupBorder }]} />

                <Pressable
                  style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}
                  onPress={() => {
                    setHelpOpen((v) => !v);
                    setLangMenuOpen(false);
                  }}
                >
                  <View style={[styles.iconBox, { backgroundColor: surf('help').bg }]}>
                    <InformationCircleIcon size={20} color={surf('help').fg} />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={[styles.rowTitle, { color: theme.colors.text }]}>{t('panel.helpTitle')}</Text>
                    <Text style={[styles.rowDescription, { color: theme.colors.textSecondary }]}>
                      {t('panel.helpDescription')}
                    </Text>
                  </View>
                  {helpOpen ? (
                    <ArrowUp01Icon size={18} color={theme.colors.textMuted} />
                  ) : (
                    <ArrowDown01Icon size={18} color={theme.colors.textMuted} />
                  )}
                </Pressable>

                {helpOpen ? (
                  <View style={[styles.helpNested, { backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.02)' : 'rgba(0,0,0,0.14)' }]}>
                    <TouchableOpacity
                      style={[
                        styles.helpSubRow,
                        {
                          borderColor: groupBorder,
                          backgroundColor:
                            theme.mode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.05)',
                        },
                      ]}
                      activeOpacity={0.78}
                      onPress={() => void openExternalUrl(SUPPORT_WHATSAPP_URL)}
                    >
                      <View style={styles.helpSubIconSlot}>
                        <WhatsappIcon size={20} color={theme.colors.success} />
                      </View>
                      <Text style={[styles.helpSubText, { color: theme.colors.text }]} numberOfLines={1}>
                        {t('panel.helpWhatsapp')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.helpSubRow,
                        {
                          borderColor: groupBorder,
                          backgroundColor:
                            theme.mode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.05)',
                        },
                      ]}
                      activeOpacity={0.78}
                      onPress={() => void openExternalUrl(SUPPORT_MAIL_URL)}
                    >
                      <View style={styles.helpSubIconSlot}>
                        <Mail02Icon size={20} color={theme.colors.primaryStrong} />
                      </View>
                      <Text style={[styles.helpSubText, { color: theme.colors.text }]} numberOfLines={1}>
                        {t('panel.helpMail')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.helpSubRow,
                        {
                          borderColor: groupBorder,
                          backgroundColor:
                            theme.mode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.05)',
                        },
                      ]}
                      activeOpacity={0.78}
                      onPress={() => void openSupportPhone()}
                    >
                      <View style={styles.helpSubIconSlot}>
                        <Call02Icon size={20} color={theme.colors.accent} />
                      </View>
                      <Text style={[styles.helpSubText, { color: theme.colors.text }]} numberOfLines={1}>
                        {t('panel.helpCall')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              <Pressable
                onPress={() => {
                  onClose();
                  setTimeout(() => onLogout(), 180);
                }}
                style={({ pressed }) => [
                  styles.logoutButton,
                  pressed
                    ? {
                        borderColor:
                          theme.mode === 'light' ? 'rgba(225, 29, 72, 0.42)' : 'rgba(252, 165, 165, 0.45)',
                        backgroundColor:
                          theme.mode === 'light' ? 'rgba(254, 202, 202, 0.55)' : 'rgba(251, 113, 133, 0.18)',
                      }
                    : {
                        borderColor:
                          theme.mode === 'light' ? 'rgba(225, 29, 72, 0.24)' : 'rgba(251, 113, 133, 0.28)',
                        backgroundColor:
                          theme.mode === 'light' ? 'rgba(225, 29, 72, 0.05)' : 'rgba(251, 113, 133, 0.08)',
                      },
                ]}
              >
                {({ pressed }) => (
                  <>
                    <Logout01Icon
                      size={18}
                      color={
                        pressed
                          ? theme.mode === 'light'
                            ? 'rgba(159, 18, 57, 0.98)'
                            : 'rgba(254, 205, 211, 0.98)'
                          : theme.colors.danger
                      }
                    />
                    <Text
                      style={[
                        styles.logoutText,
                        {
                          color:
                            pressed
                              ? theme.mode === 'light'
                                ? 'rgba(159, 18, 57, 0.98)'
                                : 'rgba(254, 205, 211, 0.98)'
                              : theme.colors.danger,
                        },
                      ]}
                    >
                      {t('panel.logoutFull')}
                    </Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
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
    borderLeftWidth: StyleSheet.hairlineWidth * 2,
    borderTopLeftRadius: RADII.xxl,
    borderBottomLeftRadius: RADII.xxl,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowOffset: { width: -4, height: 6 },
    shadowRadius: 24,
    elevation: 14,
  },
  panelInner: {
    flex: 1,
  },
  header: {
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingTop: 2,
  },
  heroBlock: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: SPACING.sm,
    minHeight: 96,
  },
  avatarWrap: {
    position: 'relative',
    width: 92,
    height: 92,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBorder: {
    width: 92,
    height: 92,
    borderRadius: 46,
    padding: 3,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
  },
  onlineDot: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 14,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  branchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 7,
    borderRadius: RADII.pill,
    borderWidth: 1,
    maxWidth: '100%',
    marginBottom: SPACING.xl,
  },
  branchText: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: SPACING.xs,
    marginLeft: 4,
  },
  group: {
    borderRadius: RADII.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md + 4,
    gap: SPACING.sm,
  },
  rowCopy: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowDescription: {
    fontSize: 12,
    lineHeight: 17,
  },
  divider: {
    height: StyleSheet.hairlineWidth * 2,
    marginLeft: 62,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTrail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langBadge: {
    minWidth: 36,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADII.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  langBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  expandBlock: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    paddingTop: 2,
  },
  langChipsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  langChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADII.md,
    borderWidth: 1,
  },
  langChipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  helpNested: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
    paddingTop: 0,
    gap: SPACING.xs,
  },
  helpSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
    minHeight: 48,
    height: 48,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  helpSubIconSlot: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpSubText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  logoutButton: {
    marginTop: SPACING.sm,
    borderRadius: RADII.lg,
    paddingVertical: SPACING.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    alignSelf: 'stretch',
    width: '100%',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
