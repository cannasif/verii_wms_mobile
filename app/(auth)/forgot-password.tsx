import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft01Icon, Mail02Icon } from 'hugeicons-react-native';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/providers/ThemeProvider';
import { createForgotPasswordSchema, type ForgotPasswordFormData } from '@/features/auth/schemas';
import { useForgotPassword } from '@/features/auth/hooks/useForgotPassword';
import { showError, showSuccess, showWarning } from '@/lib/feedback';

export default function ForgotPasswordScreen(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const schema = useMemo(() => createForgotPasswordSchema(), []);
  const forgotPasswordMutation = useForgotPassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const submit = handleSubmit(
    (data) => {
      forgotPasswordMutation.mutate(
        { email: data.email.trim() },
        {
          onSuccess: (message) => {
            showSuccess(message || t('auth.forgotPassword.success'), [
              { text: t('common.continue'), onPress: () => router.back() },
            ]);
          },
          onError: (error) => {
            showError(error, t('auth.forgotPassword.error'));
          },
        },
      );
    },
    () => {
      showWarning(t('validation.fillRequiredFields'));
    },
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeft01Icon size={18} color={theme.colors.text} />
        <Text style={[styles.backText, { color: theme.colors.textSecondary }]}>{t('common.back')}</Text>
      </Pressable>

      <View style={[styles.hero, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.eyebrow, { color: theme.colors.accent }]}>{t('auth.forgotPassword.title')}</Text>
        <Text style={styles.title}>{t('auth.forgotPassword.title')}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{t('auth.forgotPassword.description')}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border }]}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <View
              style={[
                styles.inputShell,
                {
                  borderColor: errors.email ? theme.colors.danger : theme.colors.border,
                  backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.03)' : 'rgba(8,16,31,0.88)',
                },
              ]}
            >
              <View style={styles.leading}>
                <Mail02Icon size={18} color={theme.colors.primary} />
              </View>
              <TextInput
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                placeholder={t('auth.forgotPassword.emailPlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.input, { color: theme.colors.text }]}
              />
            </View>
          )}
        />

        {errors.email?.message ? <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.email.message}</Text> : null}

        <Button title={t('auth.forgotPassword.submitButton')} onPress={submit} loading={forgotPasswordMutation.isPending} />

        <Pressable style={styles.secondaryAction} onPress={() => router.back()}>
          {forgotPasswordMutation.isPending ? <ActivityIndicator color={theme.colors.textMuted} /> : null}
          <Text style={[styles.secondaryActionText, { color: theme.colors.textSecondary }]}>{t('auth.forgotPassword.backToLogin')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, paddingTop: 28, gap: 18 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  backText: { fontWeight: '800' },
  hero: {
    gap: 8,
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
  },
  eyebrow: { fontWeight: '900', fontSize: 12, textTransform: 'uppercase' },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { lineHeight: 21 },
  card: {
    gap: 14,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
  },
  inputShell: {
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  leading: { width: 28, alignItems: 'center' },
  input: { flex: 1, fontSize: 15, paddingVertical: 14 },
  errorText: { fontSize: 12, fontWeight: '600', marginTop: -6 },
  secondaryAction: { alignItems: 'center', justifyContent: 'center', minHeight: 44, gap: 6 },
  secondaryActionText: { fontWeight: '700' },
});
