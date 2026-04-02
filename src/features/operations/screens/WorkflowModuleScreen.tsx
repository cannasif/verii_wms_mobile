import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft01Icon, ArrowRight01Icon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type { WorkflowModuleConfig } from '../types/workflow';
import { WorkflowIcon } from './WorkflowIcon';

export function WorkflowModuleScreen({ module }: { module: WorkflowModuleConfig }): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();

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
        <Text style={styles.title}>{t(module.titleKey)}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{t(module.subtitleKey)}</Text>
      </View>

      <View style={styles.grid}>
        <Pressable style={[styles.actionCard, { backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.03)', borderColor: theme.colors.border }]} onPress={() => router.push(`/(tabs)/flows/${module.key}/create` as never)}>
          <Text style={[styles.actionEyebrow, { color: theme.colors.primary }]}>{t('workflow.actions.create')}</Text>
          <Text style={styles.actionTitle}>{t(module.createTitleKey)}</Text>
          <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>{t(module.createDescriptionKey)}</Text>
        </Pressable>
        <Pressable style={[styles.actionCard, { backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.03)', borderColor: theme.colors.border }]} onPress={() => router.push(`/(tabs)/flows/${module.key}/assigned` as never)}>
          <Text style={[styles.actionEyebrow, { color: theme.colors.primary }]}>{t('workflow.actions.assigned')}</Text>
          <Text style={styles.actionTitle}>{t(module.assignedTitleKey)}</Text>
          <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>{t(module.assignedDescriptionKey)}</Text>
        </Pressable>
        <Pressable style={[styles.actionCard, { backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.03)', borderColor: theme.colors.border }]} onPress={() => router.push(`/(tabs)/flows/${module.key}/list` as never)}>
          <Text style={[styles.actionEyebrow, { color: theme.colors.primary }]}>{t('workflow.actions.list')}</Text>
          <Text style={styles.actionTitle}>{t('workflow.listCardTitle', { title: t(module.titleKey) })}</Text>
          <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>{t('workflow.listCardDescription', { title: t(module.titleKey) })}</Text>
        </Pressable>
      </View>

      <Pressable style={[styles.primaryButton, { backgroundColor: theme.colors.primaryStrong }]} onPress={() => router.push(`/(tabs)/flows/${module.key}/list` as never)}>
        <Text style={styles.primaryButtonText}>{t('workflow.actions.openList')}</Text>
        <ArrowRight01Icon size={16} color="#fff" />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 132, gap: 16 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  backText: { color: COLORS.textSecondary, fontWeight: '700' },
  hero: {
    gap: 10,
    padding: 20,
    borderRadius: 28,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { color: COLORS.textSecondary, lineHeight: 21 },
  grid: { gap: 12 },
  actionCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  actionEyebrow: { color: COLORS.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  actionTitle: { fontSize: 18, fontWeight: '900' },
  actionText: { color: COLORS.textSecondary, lineHeight: 20 },
  primaryButton: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryStrong,
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: { color: '#fff', fontWeight: '900' },
});
