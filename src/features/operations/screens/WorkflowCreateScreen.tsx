import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft01Icon, ArrowRight01Icon, CheckmarkCircle02Icon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/store/auth';
import type { WorkflowModuleConfig } from '../types/workflow';
import { WorkflowIcon } from './WorkflowIcon';

export function WorkflowCreateScreen({ module }: { module: WorkflowModuleConfig }): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const branch = useAuthStore((state) => state.branch);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeft01Icon size={18} color={theme.colors.text} />
        <Text style={[styles.backText, { color: theme.colors.textSecondary }]}>{t('common.back')}</Text>
      </Pressable>

      <View style={[styles.hero, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={[styles.heroIcon, { backgroundColor: `${module.accent}20` }]}>
          <WorkflowIcon module={module} color={module.accent} size={22} />
        </View>
        <Text style={styles.title}>{t(module.createTitleKey)}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{t(module.createDescriptionKey)}</Text>
      </View>

      <View style={styles.infoGrid}>
        <View style={[styles.infoCard, { backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.03)', borderColor: theme.colors.border }]}>
          <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>{t('workflow.create.branch')}</Text>
          <Text style={styles.infoValue}>{branch?.name ?? branch?.code ?? t('workflow.create.notSelected')}</Text>
        </View>
        <View style={[styles.infoCard, { backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.03)', borderColor: theme.colors.border }]}>
          <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>{t('workflow.create.operator')}</Text>
          <Text style={styles.infoValue}>{user?.name ?? user?.email ?? t('workflow.create.operatorFallback')}</Text>
        </View>
      </View>

      <View style={[styles.stepCard, { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border }]}>
        <View style={styles.stepRow}>
          <CheckmarkCircle02Icon size={18} color={module.accent} />
          <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>{t('workflow.create.stepOne')}</Text>
        </View>
        <View style={styles.stepRow}>
          <CheckmarkCircle02Icon size={18} color={module.accent} />
          <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>{t('workflow.create.stepTwo')}</Text>
        </View>
        <View style={styles.stepRow}>
          <CheckmarkCircle02Icon size={18} color={module.accent} />
          <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>{t('workflow.create.stepThree')}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.secondaryButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]} onPress={() => router.push(`/(tabs)/flows/${module.key}/assigned` as never)}>
          <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>{t('workflow.actions.openAssigned')}</Text>
        </Pressable>
        <Pressable style={[styles.primaryButton, { backgroundColor: module.accent }]} onPress={() => router.push(`/(tabs)/flows/${module.key}/list` as never)}>
          <Text style={styles.primaryButtonText}>{t('workflow.actions.openList')}</Text>
          <ArrowRight01Icon size={16} color="#fff" />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 132, gap: 16 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  backText: { fontWeight: '700' },
  hero: {
    gap: 10,
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
  },
  heroIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { lineHeight: 21 },
  infoGrid: { gap: 12 },
  infoCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  infoLabel: { fontSize: 12, fontWeight: '800' },
  infoValue: { fontSize: 16, fontWeight: '800' },
  stepCard: {
    gap: 12,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
  },
  stepRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  stepText: { flex: 1, lineHeight: 20 },
  primaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: { color: '#fff', fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 12 },
  secondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  secondaryButtonText: { fontWeight: '800' },
});
