import React from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Linking,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { Text } from '@/components/ui/Text';
import { getAppInfo } from '@/lib/appInfo';
import { cycleLanguage, getCurrentLanguageLabel } from '@/locales';

import {
  Globe02Icon,
  Shield02Icon,
  HeadsetIcon,
  Call02Icon,
  Mail02Icon,
  WhatsappIcon,
  TelegramIcon,
  InstagramIcon,
  NewTwitterIcon,
} from 'hugeicons-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get("screen");

const SocialButton = ({
  icon: Icon,
  color,
  onPress,
}: {
  icon: any;
  color: string;
  onPress: () => void;
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5, 
        borderColor: pressed ? color : `${color}60`, 
        backgroundColor: pressed ? `${color}15` : 'rgba(11, 15, 25, 0.4)',
        transform: [{ scale: pressed ? 0.92 : 1 }],
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: pressed ? 0.8 : 0.4,
        shadowRadius: 3, 
        elevation: 0, 
      })}
    >
      {({ pressed }) => (
        <Icon size={18} color={pressed ? color : "#cbd5e1"} />
      )}
    </Pressable>
  );
};

export default function LoginScreen(): React.ReactElement {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const appInfo = getAppInfo();

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t("common.error"), t("auth.linkError"));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleComingSoon = () => {
    Alert.alert(t("common.info"), t("common.comingSoon"));
  };

  const safeBottomPadding = Math.max(insets.bottom + 20, 40);

  return (
    <LinearGradient
      colors={['#0F1934', '#050711', '#1A0B26', '#3B1612']}
      locations={[0, 0.35, 0.75, 1]} 
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <StatusBar style="light" />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top + 15, 30),
              paddingBottom: safeBottomPadding,
              minHeight: SCREEN_HEIGHT,
            }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topRow}>
            <View style={styles.brandPill}>
              <Shield02Icon size={14} color="#d946ef" />
              <Text style={styles.brandPillText}>{t('auth.mobileSecureAccess')}</Text>
            </View>
            <Pressable style={styles.langPill} onPress={() => void cycleLanguage()}>
              <Globe02Icon size={14} color="#cbd5e1" />
              <Text style={styles.langText}>{getCurrentLanguageLabel()}</Text>
            </Pressable>
          </View>

          <View style={styles.heroBlock}>
            <Text style={styles.eyebrow}>{t('auth.eyebrow')}</Text>
            <Text style={styles.title}>{t('auth.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.loginDescription')}</Text>
          </View>

          <View style={styles.formWrapper}>
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Image
                  source={require('../../assets/v3riiwms.png')}
                  style={styles.formBrandImage}
                  resizeMode="contain"
                  accessibilityLabel={t('common.appName')}
                />
                <Text style={styles.formTitle}>{t('auth.submit')}</Text>
                <Text style={styles.formDescription}>{t('auth.subtitle')}</Text>
              </View>
              <LoginForm />
            </View>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.footerCard}>
              <HeadsetIcon size={18} color="#f97316" />
              <View style={styles.footerCopy}>
                <Text style={styles.footerTitle}>{t('auth.support')}</Text>
                <Text style={styles.footerText}>{t('auth.supportDescription')}</Text>
              </View>
            </View>
            <View style={styles.footerCard}>
              <Shield02Icon size={18} color="#d946ef" />
              <View style={styles.footerCopy}>
                <Text style={styles.footerTitle}>{t('auth.sessionPolicy')}</Text>
                <Text style={styles.footerText}>{t('auth.sessionPolicyDescription')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.socialContainer}>
            <SocialButton icon={Call02Icon} color="#bef264" onPress={() => openLink("tel:+905070123018")} />
            <SocialButton icon={Globe02Icon} color="#a855f7" onPress={() => openLink("https://v3rii.com")} />
            <SocialButton icon={Mail02Icon} color="#f97316" onPress={() => openLink("mailto:info@v3rii.com")} />
            <SocialButton icon={WhatsappIcon} color="#34d399" onPress={() => openLink("https://wa.me/905070123018")} />
            <SocialButton icon={TelegramIcon} color="#38bdf8" onPress={handleComingSoon} />
            <SocialButton icon={InstagramIcon} color="#e879f9" onPress={handleComingSoon} />
            <SocialButton icon={NewTwitterIcon} color="#ffffff" onPress={handleComingSoon} />
          </View>

          <View style={styles.versionRow}>
            <Text style={styles.versionText}>
              {t('auth.versionLabel', { version: appInfo.version })}
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <BlurView
        intensity={28}
        tint="dark"
        style={[styles.statusBlur, { height: insets.top }]}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
  },
  flex: { 
    flex: 1, 
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  topRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    zIndex: 10,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(217, 70, 239, 0.25)', 
  },
  brandPillText: { 
    fontSize: 10, 
    fontWeight: '700', 
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  langText: { 
    fontSize: 10, 
    fontWeight: '700', 
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  heroBlock: { 
    marginTop: 28, 
    gap: 4,
    zIndex: 10,
  },
  eyebrow: {
    color: '#f97316', 
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: { 
    fontSize: 22, 
    lineHeight: 28, 
    fontWeight: '800', 
    color: '#f1f5f9',
  },
  subtitle: { 
    color: '#94a3b8', 
    fontSize: 12, 
    lineHeight: 18, 
    maxWidth: 320 
  },
  formWrapper: {
    marginTop: 10,
    marginBottom: 20,
    zIndex: 10,
  },
  formCard: {
    backgroundColor: 'rgba(15, 25, 60, 0.38)',
    borderRadius: 28,
    padding: 24,
    paddingTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.22)',
    shadowColor: '#38bdf8',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 0,
  },
  formHeader: { 
    marginBottom: 14,
    gap: 0,
    alignItems: 'center',
  },
  formBrandImage: {
    width: 248,
    maxWidth: '100%',
    height: 150,
    marginTop: -25,
    marginBottom: -15,
    alignSelf: 'center',
    opacity: 0.88,
  },
  formTitle: { 
    fontSize: 18,
    fontWeight: '800',
    color: '#e2e8f0',
    textAlign: 'center',
    alignSelf: 'stretch',
    marginTop: 3,
  },
  formDescription: { 
    color: '#94a3b8', 
    fontSize: 12, 
    lineHeight: 18,
    textAlign: 'center',
    alignSelf: 'stretch',
    marginTop: 2,
  },
  footerRow: { 
    gap: 12,
    zIndex: 10,
  },
  footerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.12)', 
    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
  },
  footerCopy: { 
    flex: 1, 
    gap: 2 
  },
  footerTitle: { 
    fontSize: 12, 
    fontWeight: '700',
    color: '#e2e8f0'
  },
  footerText: { 
    fontSize: 11, 
    lineHeight: 16, 
    color: '#94a3b8' 
  },
  socialContainer: {
    flexDirection: "row", 
    flexWrap: "nowrap", 
    justifyContent: "space-between", 
    paddingHorizontal: 4, 
    marginTop: 24,
    zIndex: 10,
  },
  versionRow: { 
    marginTop: 20, 
    alignItems: 'center',
    zIndex: 10,
  },
  versionText: { 
    fontSize: 10, 
    color: '#475569', 
    fontWeight: '600',
    letterSpacing: 1,
  },

  statusBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
});