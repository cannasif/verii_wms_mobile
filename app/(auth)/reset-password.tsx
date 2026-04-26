import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft01Icon, LockKeyIcon, ViewIcon, ViewOffIcon } from 'hugeicons-react-native';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/providers/ThemeProvider';
import { createResetPasswordSchema, type ResetPasswordFormData } from '@/features/auth/schemas';
import { useResetPassword } from '@/features/auth/hooks/useResetPassword';
import { showError, showSuccess, showWarning, showMessage } from '@/lib/feedback';

export default function ResetPasswordScreen(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const schema = useMemo(() => createResetPasswordSchema(), []);
  const resetPasswordMutation = useResetPassword();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      token: typeof token === 'string' ? token : '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (typeof token === 'string' && token.length > 0) {
      setValue('token', token);
      return;
    }

    showMessage(t('common.error'), t('auth.resetPassword.invalidToken'), [
      { text: t('common.continue'), onPress: () => router.replace('/(auth)/login') },
    ]);
  }, [setValue, t, token]);

  const submit = handleSubmit(
    (data) => {
      resetPasswordMutation.mutate(
        { token: data.token, newPassword: data.newPassword.trim() },
        {
          onSuccess: (message) => {
            showSuccess(message || t('auth.resetPassword.success'), [
              { text: t('common.continue'), onPress: () => router.replace('/(auth)/login') },
            ]);
          },
          onError: (error) => {
            showError(error, t('auth.resetPassword.error'));
          },
        },
      );
    },
    () => {
      showWarning(t('validation.fillRequiredFields'));
    },
  );

  const renderPasswordField = (
    name: 'newPassword' | 'confirmPassword',
    placeholder: string,
    visible: boolean,
    toggle: () => void,
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <View>
          <View
            style={[
              styles.inputShell,
              {
                borderColor: errors[name] ? theme.colors.danger : theme.colors.border,
                backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.03)' : 'rgba(8,16,31,0.88)',
              },
            ]}
          >
            <View style={styles.leading}>
              <LockKeyIcon size={18} color={theme.colors.primary} />
            </View>
            <TextInput
              value={value}
              onChangeText={onChange}
              secureTextEntry={!visible}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, { color: theme.colors.text }]}
            />
            <Pressable onPress={toggle}>
              {visible ? <ViewOffIcon size={18} color={theme.colors.textMuted} /> : <ViewIcon size={18} color={theme.colors.textMuted} />}
            </Pressable>
          </View>
          {errors[name]?.message ? <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors[name]?.message}</Text> : null}
        </View>
      )}
    />
  );

  return (
    <View style={[styles.screen, { backgroundColor: 'transparent' }]}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeft01Icon size={18} color={theme.colors.text} />
        <Text style={[styles.backText, { color: theme.colors.textSecondary }]}>{t('common.back')}</Text>
      </Pressable>

      <View style={[styles.hero, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.eyebrow, { color: theme.colors.accent }]}>{t('auth.resetPassword.title')}</Text>
        <Text style={styles.title}>{t('auth.resetPassword.title')}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{t('auth.resetPassword.description')}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border }]}>
        {renderPasswordField('newPassword', t('auth.resetPassword.newPasswordPlaceholder'), showPassword, () =>
          setShowPassword((prev) => !prev),
        )}
        {renderPasswordField('confirmPassword', t('auth.resetPassword.confirmPasswordPlaceholder'), showConfirmPassword, () =>
          setShowConfirmPassword((prev) => !prev),
        )}

        <Button
          title={resetPasswordMutation.isPending ? t('auth.resetPassword.processing') : t('auth.resetPassword.submitButton')}
          onPress={submit}
          loading={resetPasswordMutation.isPending}
          disabled={typeof token !== 'string' || token.length === 0}
        />
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
  errorText: { fontSize: 12, fontWeight: '600', marginTop: 6 },
});
