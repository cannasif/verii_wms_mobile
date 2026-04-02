import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowDown01Icon, Location01Icon, LockKeyIcon, Mail02Icon, Tick02Icon, ViewIcon, ViewOffIcon } from 'hugeicons-react-native';
import { Button } from '@/components/ui/Button';
import { FormField, FormPickerField } from '@/components/ui/FormField';
import { FormSection } from '@/components/ui/FormSection';
import { ScreenState } from '@/components/ui/ScreenState';
import { Text } from '@/components/ui/Text';
import { COLORS, LAYOUT, RADII, SPACING } from '@/constants/theme';
import { normalizeError } from '@/lib/errors';
import { showMessage, showWarning } from '@/lib/feedback';
import { useTheme } from '@/providers/ThemeProvider';
import { useBranches } from '../hooks/useBranches';
import { useLogin } from '../hooks/useLogin';
import { createLoginSchema, type LoginFormData } from '../schemas';
import type { Branch } from '../types';

function BranchRow({ branch, selected, onPress }: { branch: Branch; selected: boolean; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.branchRow,
        {
          backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.03)',
          borderColor: selected ? theme.colors.primary : 'transparent',
        },
        selected && styles.branchRowActive,
      ]}
    >
      <Text style={[styles.branchText, selected && styles.branchTextActive, selected && { color: theme.colors.primary }]}>{branch.name}</Text>
      {selected ? <Tick02Icon size={18} color={theme.colors.primary} /> : null}
    </Pressable>
  );
}

export function LoginForm(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const schema = useMemo(() => createLoginSchema(), []);
  const branchesQuery = useBranches();
  const loginMutation = useLogin();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
    defaultValues: { branchId: '', email: '', password: '', rememberMe: true },
  });

  const submit = handleSubmit((data) => {
    if (!selectedBranch) {
      showWarning(t('auth.selectBranchWarning'));
      return;
    }

    loginMutation.mutate(
      { loginData: data, branch: selectedBranch },
      {
        onSuccess: () => router.replace('/(tabs)'),
        onError: (error) => showMessage(t('auth.loginFailed'), normalizeError(error, t('common.error')).message),
      },
    );
  });

  return (
    <FormSection style={styles.form}>
      <Controller
        control={control}
        name="branchId"
        render={() => (
          <FormPickerField
            label={t('auth.branch')}
            value={selectedBranch?.name ?? t('auth.branchPlaceholder')}
            onPress={() => setShowBranchModal(true)}
            leading={<Location01Icon size={18} color={theme.colors.primary} />}
            trailing={<ArrowDown01Icon size={16} color={theme.colors.textMuted} />}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <FormField
            label={t('auth.email')}
            value={value}
            onChangeText={onChange}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder={t('auth.email')}
            leading={<Mail02Icon size={18} color={theme.colors.primary} />}
            error={errors.email?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <FormField
            label={t('auth.password')}
            value={value}
            onChangeText={onChange}
            secureTextEntry={!showPassword}
            placeholder={t('auth.password')}
            leading={<LockKeyIcon size={18} color={theme.colors.primary} />}
            trailing={
              <Pressable onPress={() => setShowPassword((prev) => !prev)}>
                {showPassword ? <ViewOffIcon size={18} color={theme.colors.textMuted} /> : <ViewIcon size={18} color={theme.colors.textMuted} />}
              </Pressable>
            }
            error={errors.password?.message}
          />
        )}
      />

      <Pressable style={styles.forgotPasswordButton} onPress={() => router.push('/(auth)/forgot-password')}>
        <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>{t('auth.forgotPassword.title')}</Text>
      </Pressable>

      <Button title={t('auth.submit')} onPress={submit} loading={loginMutation.isPending} />

      <Modal visible={showBranchModal} transparent animationType="slide" onRequestClose={() => setShowBranchModal(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.mode === 'light' ? 'rgba(148,163,184,0.32)' : 'rgba(4,8,14,0.72)' }]}>
          <FormSection style={[styles.modalCard, { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border }]}>
            <Text style={styles.modalTitle}>{t('auth.branch')}</Text>
            {branchesQuery.isLoading ? (
              <ScreenState
                tone="loading"
                title={t('paged.loadingTitle')}
                description={t('paged.loadingDescription')}
                compact
              />
            ) : branchesQuery.isError ? (
              <ScreenState
                tone="error"
                title={t('paged.errorTitle')}
                description={t('auth.branchListFailed')}
                actionLabel={t('common.retry')}
                onAction={() => void branchesQuery.refetch()}
                compact
              />
            ) : (
              <FlatList
                data={branchesQuery.data ?? []}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <BranchRow
                    branch={item}
                    selected={selectedBranch?.id === item.id}
                    onPress={() => {
                      setSelectedBranch(item);
                      setValue('branchId', item.id);
                      setShowBranchModal(false);
                    }}
                  />
                )}
              />
            )}
          </FormSection>
        </View>
      </Modal>
    </FormSection>
  );
}

const styles = StyleSheet.create({
  form: { gap: SPACING.sm },
  forgotPasswordButton: { alignSelf: 'flex-end', marginTop: -2 },
  forgotPasswordText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(4,8,14,0.72)', justifyContent: 'flex-end', padding: LAYOUT.screenPadding },
  modalCard: { maxHeight: '60%', backgroundColor: COLORS.surfaceStrong, borderRadius: RADII.xl, borderWidth: 1, borderColor: COLORS.border, padding: 18 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 14 },
  branchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 14, borderRadius: RADII.md, backgroundColor: 'rgba(255,255,255,0.03)', marginBottom: 10 },
  branchRowActive: { borderWidth: 1, borderColor: COLORS.primary, backgroundColor: 'rgba(56,189,248,0.08)' },
  branchText: { fontSize: 14, fontWeight: '600' },
  branchTextActive: { color: COLORS.primary },
});
