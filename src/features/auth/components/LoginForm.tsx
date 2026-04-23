import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Alert02Icon,
  ArrowDown01Icon,
  Location01Icon,
  LockKeyIcon,
  Mail02Icon,
  Tick02Icon,
  ViewIcon,
  ViewOffIcon,
} from 'hugeicons-react-native';

import { ScreenState } from '@/components/ui/ScreenState';
import { Text } from '@/components/ui/Text';
import { useBranches } from '../hooks/useBranches';
import { useLogin } from '../hooks/useLogin';
import { createLoginSchema, type LoginFormData } from '../schemas';
import type { Branch } from '../types';
import { parseLoginError } from '../utils/parseLoginError';

const C = {
  primary:    '#38bdf8',
  orange:     '#f97316',
  inputBg:    'rgba(14, 30, 66, 0.72)',
  inputBorder:'rgba(56, 189, 248, 0.20)',
  focusBorder:'rgba(56, 189, 248, 0.55)',
  errorBorder:'rgba(248, 113, 113, 0.55)',
  iconBg:     'rgba(56, 189, 248, 0.06)',
  separator:  'rgba(56, 189, 248, 0.08)',
  muted:      '#7b8ea8',
  error:      '#f87171',
};

function BranchRow({ branch, selected, onPress }: { branch: Branch; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.branchRow, selected && styles.branchRowActive]}
    >
      <Text style={[styles.branchText, selected && { color: C.primary }]}>
        {branch.name}
      </Text>
      {selected && <Tick02Icon size={18} color={C.primary} />}
    </Pressable>
  );
}

export function LoginForm(): React.ReactElement {
  const { t } = useTranslation();

  const [showPassword, setShowPassword]       = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [selectedBranch, setSelectedBranch]   = useState<Branch | null>(null);
  const [focusedInput, setFocusedInput]       = useState<string | null>(null);
  const [bannerMessage, setBannerMessage]     = useState<string | null>(null);

  const schema        = useMemo(() => createLoginSchema(), []);
  const branchesQuery = useBranches();
  const loginMutation = useLogin();

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
    defaultValues: { branchId: '', email: '', password: '', rememberMe: true },
  });

  const submit = handleSubmit((data) => {
    setBannerMessage(null);
    clearErrors();
    if (!selectedBranch) {
      setError('branchId', { type: 'manual', message: t('validation.branchRequired') });
      return;
    }
    loginMutation.mutate(
      { loginData: data, branch: selectedBranch },
      {
        onSuccess: () => router.replace('/(tabs)'),
        onError: (error) => {
          const f = parseLoginError(error, t);
          if (f.root) {
            setBannerMessage(f.root);
          }
          if (f.email) {
            setError('email', { type: 'server', message: f.email });
          }
          if (f.password) {
            setError('password', { type: 'server', message: f.password });
          }
          if (f.branchId) {
            setError('branchId', { type: 'server', message: f.branchId });
          }
        },
      },
    );
  });

  const shell = (hasError: boolean, isFocused: boolean) => [
    styles.inputShell,
    isFocused && styles.inputShellFocus,
    hasError  && styles.inputShellError,
  ];

  const iconColor = (hasError: boolean, isFocused: boolean) => {
    if (hasError)  return C.error;
    if (isFocused) return C.primary;
    return C.muted;
  };

  return (
    <View style={styles.form}>
      {bannerMessage ? (
        <View style={styles.banner} accessibilityRole="alert">
          <Alert02Icon size={16} color={C.error} />
          <Text style={styles.bannerText}>{bannerMessage}</Text>
        </View>
      ) : null}

      <View style={styles.field}>
        <Controller
          control={control}
          name="branchId"
          render={() => {
            const hasError = !!errors.branchId;
            const isFocused = showBranchModal;
            return (
              <Pressable
                onPress={() => {
                  setBannerMessage(null);
                  if (errors.branchId) {
                    clearErrors('branchId');
                  }
                  setShowBranchModal(true);
                }}
                style={shell(hasError, isFocused)}
              >
                <View style={styles.iconCol}>
                  <Location01Icon size={18} color={iconColor(hasError, isFocused)} />
                </View>
                <View style={styles.textCol}>
                  <Text style={[styles.pickerText, !selectedBranch && styles.placeholder]}>
                    {selectedBranch?.name ?? t('auth.branchPlaceholder')}
                  </Text>
                </View>
                <View style={styles.trailCol}>
                  <ArrowDown01Icon size={15} color={C.muted} />
                </View>
              </Pressable>
            );
          }}
        />
        {errors.branchId && <Text style={styles.errorMsg}>{errors.branchId.message}</Text>}
      </View>

      <View style={styles.field}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => {
            const hasError  = !!errors.email;
            const isFocused = focusedInput === 'email';
            return (
              <View style={shell(hasError, isFocused)}>
                <View style={styles.iconCol}>
                  <Mail02Icon size={18} color={iconColor(hasError, isFocused)} />
                </View>
                <TextInput
                  style={styles.textInput}
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    if (errors.email) {
                      clearErrors('email');
                    }
                    setBannerMessage(null);
                  }}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => { setFocusedInput(null); onBlur(); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder={t('auth.email')}
                  placeholderTextColor={C.muted}
                />
              </View>
            );
          }}
        />
        {errors.email && <Text style={styles.errorMsg}>{errors.email.message}</Text>}
      </View>

      <View style={styles.field}>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => {
            const hasError  = !!errors.password;
            const isFocused = focusedInput === 'password';
            return (
              <View style={shell(hasError, isFocused)}>
                <View style={styles.iconCol}>
                  <LockKeyIcon size={18} color={iconColor(hasError, isFocused)} />
                </View>
                <TextInput
                  style={styles.textInput}
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    if (errors.password) {
                      clearErrors('password');
                    }
                    setBannerMessage(null);
                  }}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => { setFocusedInput(null); onBlur(); }}
                  secureTextEntry={!showPassword}
                  placeholder={t('auth.password')}
                  placeholderTextColor={C.muted}
                />
                <Pressable style={styles.trailCol} onPress={() => setShowPassword((p) => !p)}>
                  {showPassword
                    ? <ViewOffIcon size={18} color={C.muted} />
                    : <ViewIcon    size={18} color={C.muted} />}
                </Pressable>
              </View>
            );
          }}
        />
        {errors.password && <Text style={styles.errorMsg}>{errors.password.message}</Text>}
      </View>

      <Pressable style={styles.forgotBtn} onPress={() => router.push('/(auth)/forgot-password')}>
        <Text style={styles.forgotText}>{t('auth.forgotPassword.title')}</Text>
      </Pressable>

      <Pressable
        onPress={submit}
        disabled={loginMutation.isPending}
        style={({ pressed }) => [styles.submitWrap, pressed && { opacity: 0.88 }]}
      >
        <LinearGradient
          colors={['#0ea5e9', '#2563eb', '#f97316']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientBtn}
        >
          {loginMutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>{t('auth.submit')}</Text>}
        </LinearGradient>
      </Pressable>

      <Modal visible={showBranchModal} transparent animationType="slide" onRequestClose={() => setShowBranchModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('auth.branch')}</Text>
            {branchesQuery.isLoading ? (
              <ScreenState tone="loading" title={t('paged.loadingTitle')} description={t('paged.loadingDescription')} compact />
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
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
                renderItem={({ item }) => (
                  <BranchRow
                    branch={item}
                    selected={selectedBranch?.id === item.id}
                    onPress={() => {
                      setSelectedBranch(item);
                      setValue('branchId', item.id, { shouldValidate: true });
                      clearErrors('branchId');
                      setBannerMessage(null);
                      setShowBranchModal(false);
                    }}
                  />
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(248, 113, 113, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.32)',
  },
  bannerText: {
    flex: 1,
    color: C.error,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },

  field: { gap: 5 },

  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.inputBorder,
    backgroundColor: C.inputBg,
    overflow: 'hidden',
  },
  inputShellFocus: {
    borderColor: C.focusBorder,
  },
  inputShellError: {
    borderColor: C.errorBorder,
  },

  iconCol: {
    width: 48,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.iconBg,
    borderRightWidth: 1,
    borderRightColor: C.separator,
  },

  textInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#e2e8f0',
    height: '100%',
  },

  textCol: { flex: 1, paddingHorizontal: 14, justifyContent: 'center' },
  pickerText: { fontSize: 14, color: '#e2e8f0', fontWeight: '500' },
  placeholder: { color: C.muted },

  trailCol: {
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
  },

  errorMsg: { color: C.error, fontSize: 11, fontWeight: '600', marginLeft: 6 },

  forgotBtn:  { alignSelf: 'flex-end', marginTop: -2 },
  forgotText: { color: C.primary, fontWeight: '700', fontSize: 13 },

  submitWrap: {
    marginTop: 4,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 6,
  },
  gradientBtn: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 8, 18, 0.82)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '70%',
    backgroundColor: '#0d1b36',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(56,189,248,0.10)',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
  },
  modalHandle: {
    width: 38,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#e2e8f0',
    textAlign: 'center',
    marginBottom: 18,
  },

  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: 'rgba(56,189,248,0.03)',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  branchRowActive: {
    borderColor: C.primary,
    backgroundColor: 'rgba(56,189,248,0.09)',
  },
  branchText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
});