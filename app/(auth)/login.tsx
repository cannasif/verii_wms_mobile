import React from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Globe02Icon, HeadsetIcon, Shield02Icon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { Text } from '@/components/ui/Text';
import { COLORS, GRADIENTS } from '@/constants/theme';
import { getAppInfo } from '@/lib/appInfo';
import { cycleLanguage, getCurrentLanguageLabel } from '@/locales';

export default function LoginScreen(): React.ReactElement {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const appInfo = getAppInfo();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ImageBackground source={require('../../assets/login.jpg')} style={styles.background} imageStyle={styles.backgroundImage}>
        <LinearGradient colors={['rgba(3,10,20,0.62)', 'rgba(6,13,27,0.92)', '#071224']} style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                paddingTop: insets.top + 18,
                paddingBottom: Math.max(insets.bottom + 28, 32),
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.topRow}>
                <View style={styles.brandPill}>
                  <Shield02Icon size={18} color={COLORS.accent} />
                  <Text style={styles.brandPillText}>{t('auth.mobileSecureAccess')}</Text>
                </View>
                <Pressable style={styles.langPill} onPress={() => void cycleLanguage()}>
                  <Globe02Icon size={16} color={COLORS.primary} />
                  <Text style={styles.langText}>{getCurrentLanguageLabel()}</Text>
                </Pressable>
              </View>

              <View style={styles.heroBlock}>
                <Text style={styles.eyebrow}>{t('auth.eyebrow')}</Text>
                <Text style={styles.title}>{t('auth.title')}</Text>
                <Text style={styles.subtitle}>{t('auth.loginDescription')}</Text>
              </View>

              <View style={styles.formCard}>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>{t('auth.submit')}</Text>
                  <Text style={styles.formDescription}>{t('auth.subtitle')}</Text>
                </View>
                <LoginForm />
              </View>

              <View style={styles.footerRow}>
                <View style={styles.footerCard}>
                  <HeadsetIcon size={18} color={COLORS.primary} />
                  <View style={styles.footerCopy}>
                    <Text style={styles.footerTitle}>{t('auth.support')}</Text>
                    <Text style={styles.footerText}>{t('auth.supportDescription')}</Text>
                  </View>
                </View>
                <View style={styles.footerCard}>
                  <Shield02Icon size={18} color={COLORS.success} />
                  <View style={styles.footerCopy}>
                    <Text style={styles.footerTitle}>{t('auth.sessionPolicy')}</Text>
                    <Text style={styles.footerText}>{t('auth.sessionPolicyDescription')}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.versionRow}>
                <Text style={styles.versionText}>
                  {t('auth.versionLabel', { version: appInfo.version })}
                </Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#071224' },
  flex: { flex: 1 },
  background: { flex: 1 },
  backgroundImage: { opacity: 0.3 },
  overlay: { flex: 1, paddingHorizontal: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(7,18,36,0.64)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  brandPillText: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(7,18,36,0.64)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langText: { fontSize: 12, fontWeight: '800', color: COLORS.text },
  heroBlock: { marginTop: 36, gap: 10 },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '900', color: COLORS.text },
  subtitle: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 22, maxWidth: 320 },
  formCard: {
    marginTop: 28,
    backgroundColor: 'rgba(10,22,42,0.88)',
    borderRadius: 30,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primaryStrong,
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 20 },
    shadowRadius: 24,
    elevation: 12,
  },
  formHeader: { marginBottom: 18, gap: 6 },
  formTitle: { fontSize: 22, fontWeight: '900' },
  formDescription: { color: COLORS.textSecondary, lineHeight: 20 },
  footerRow: { marginTop: 24, gap: 12 },
  footerCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(8,16,31,0.72)',
  },
  footerCopy: { flex: 1, gap: 4 },
  footerTitle: { fontSize: 14, fontWeight: '800' },
  footerText: { fontSize: 13, lineHeight: 18, color: COLORS.textSecondary },
  versionRow: { marginTop: 18, alignItems: 'center' },
  versionText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '700' },
});
