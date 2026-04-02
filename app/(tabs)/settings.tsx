import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Globe02Icon,
  Logout01Icon,
  RefreshIcon,
  Settings02Icon,
} from 'hugeicons-react-native';
import { PageShell } from '@/components/layout/PageShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { FormField } from '@/components/ui/FormField';
import { SectionCard } from '@/components/ui/SectionCard';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { COLORS, RADII, SPACING } from '@/constants/theme';
import { showConfirm, showError, showInfo } from '@/lib/feedback';
import {
  DEFAULT_API_BASE_URL,
  getApiBaseUrl,
  saveApiBaseUrl,
  testApiBaseUrl,
} from '@/constants/config';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/store/auth';

export default function SettingsScreen(): React.ReactElement {
  const { t } = useTranslation();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [apiUrlInput, setApiUrlInput] = useState(getApiBaseUrl());
  const [lastSuccessfulApiUrl, setLastSuccessfulApiUrl] = useState(getApiBaseUrl());
  const [isTestingApiUrl, setIsTestingApiUrl] = useState(false);
  const [isSavingApiUrl, setIsSavingApiUrl] = useState(false);

  const canSaveApiUrl =
    !!lastSuccessfulApiUrl &&
    !isSavingApiUrl &&
    lastSuccessfulApiUrl.trim() === apiUrlInput.trim();

  const handleTestApiUrl = async (): Promise<void> => {
    setIsTestingApiUrl(true);
    try {
      const normalized = apiUrlInput.trim();
      await testApiBaseUrl(normalized);
      setLastSuccessfulApiUrl(normalized);
      showInfo(t('settings.apiUrlTestSuccess'));
    } catch (error) {
      showError(error, t('settings.apiUrlTestError'));
    } finally {
      setIsTestingApiUrl(false);
    }
  };

  const handleSaveApiUrl = async (): Promise<void> => {
    setIsSavingApiUrl(true);
    try {
      const normalized = await saveApiBaseUrl(lastSuccessfulApiUrl.trim());
      apiClient.defaults.baseURL = normalized;
      setApiUrlInput(normalized);
      setLastSuccessfulApiUrl(normalized);
      showInfo(t('settings.apiUrlSaveSuccess'));
    } catch (error) {
      showError(error, t('settings.apiUrlSaveError'));
    } finally {
      setIsSavingApiUrl(false);
    }
  };

  const handleResetApiUrl = (): void => {
    setApiUrlInput(DEFAULT_API_BASE_URL);
    setLastSuccessfulApiUrl('');
    showInfo(t('settings.apiUrlResetInfo'));
  };

  const handleLogout = (): void => {
    showConfirm(t('common.logout'), '', [
      { text: t('settings.cancel'), style: 'cancel' },
      {
        text: t('common.logout'),
        style: 'destructive',
        onPress: () => {
          void clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <PageShell scroll>
      <ScreenHeader title={t('settings.title')} />
        <Text style={styles.groupTitle}>{t('settings.apiUrlTitle')}</Text>
        <SectionCard style={styles.group}>
          <View style={styles.row}>
            <View style={[styles.iconBox, styles.primaryIconBox]}>
              <Settings02Icon size={18} color={COLORS.primary} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{t('settings.apiUrlTitle')}</Text>
              <Text style={styles.rowDescription}>{t('settings.apiUrlDescription')}</Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <FormField
              label={t('settings.apiUrlTitle')}
              value={apiUrlInput}
              onChangeText={setApiUrlInput}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder={DEFAULT_API_BASE_URL}
            />

            <Text style={styles.currentUrl}>
              {t('settings.apiUrlCurrent')}: {getApiBaseUrl()}
            </Text>

            <View style={styles.actions}>
              <Button
                title={t('settings.apiUrlTestButton')}
                onPress={handleTestApiUrl}
                disabled={isTestingApiUrl || isSavingApiUrl}
                loading={isTestingApiUrl}
                tone='secondary'
                style={styles.actionButton}
              />

              <Button
                title={t('settings.apiUrlSaveButton')}
                onPress={handleSaveApiUrl}
                disabled={!canSaveApiUrl}
                loading={isSavingApiUrl}
                style={styles.actionButton}
              />
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={handleResetApiUrl}>
              <RefreshIcon size={16} color={COLORS.textMuted} />
              <Text style={styles.resetText}>{t('settings.apiUrlResetButton')}</Text>
            </TouchableOpacity>
          </View>
        </SectionCard>

        <Text style={styles.groupTitle}>{t('panel.preferences')}</Text>
        <SectionCard style={styles.group}>
          <View style={styles.row}>
            <View style={[styles.iconBox, styles.secondaryIconBox]}>
              <Globe02Icon size={18} color={COLORS.accent} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{t('panel.language')}</Text>
              <Text style={styles.rowDescription}>{t('panel.languageDescription')}</Text>
            </View>
          </View>
        </SectionCard>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Logout01Icon size={18} color={COLORS.danger} />
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
        </TouchableOpacity>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  groupTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: COLORS.textMuted, marginBottom: SPACING.xs, marginLeft: 4 },
  group: { marginBottom: SPACING.lg + 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm + 2 },
  rowCopy: { flex: 1, gap: SPACING.xxs },
  rowTitle: { fontSize: 15, fontWeight: '800' },
  rowDescription: { fontSize: 12, lineHeight: 18, color: COLORS.textSecondary },
  iconBox: { width: 40, height: 40, borderRadius: RADII.sm, alignItems: 'center', justifyContent: 'center' },
  primaryIconBox: { backgroundColor: 'rgba(56,189,248,0.1)' },
  secondaryIconBox: { backgroundColor: 'rgba(249,115,22,0.12)' },
  inputContainer: { gap: SPACING.sm },
  currentUrl: { color: COLORS.textSecondary, lineHeight: 18, fontSize: 12 },
  actions: { flexDirection: 'row', gap: SPACING.xs },
  actionButton: { flex: 1 },
  resetButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingVertical: 6 },
  resetText: { color: COLORS.textMuted, fontWeight: '700' },
  logoutButton: { marginTop: SPACING.xs, borderRadius: RADII.lg, paddingVertical: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, borderWidth: 1, borderColor: 'rgba(251,113,133,0.28)', backgroundColor: 'rgba(251,113,133,0.08)' },
  logoutText: { color: COLORS.danger, fontSize: 15, fontWeight: '900' },
});
