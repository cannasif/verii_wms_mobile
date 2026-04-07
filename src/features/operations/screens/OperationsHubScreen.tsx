import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight01Icon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/providers/ThemeProvider';
import { WORKFLOW_MODULES } from '../config/workflow-modules';
import { WorkflowIcon } from './WorkflowIcon';

export function OperationsHubScreen(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>{t('workflow.hubEyebrow')}</Text>
        <Text style={styles.title}>{t('workflow.hubTitle')}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{t('workflow.hubDescription')}</Text>
      </View>

      <View style={styles.list}>
        {WORKFLOW_MODULES.map((module) => (
          <View
            key={module.key}
            style={[
              styles.card,
              {
                backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.03)',
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrap, { backgroundColor: `${module.accent}20` }]}>
                <WorkflowIcon module={module} color={module.accent} size={20} />
              </View>
              <View style={styles.copy}>
                <Text style={styles.cardTitle}>{t(module.titleKey)}</Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>{t(module.subtitleKey)}</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                style={[styles.secondaryButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]}
                onPress={() => router.push(`/(tabs)/flows/${module.key}/create` as never)}
              >
                <Text style={styles.secondaryButtonText}>{t('workflow.actions.create')}</Text>
              </Pressable>
              <Pressable
                style={[styles.ghostButton, { borderColor: theme.colors.primaryStrong }]}
                onPress={() => router.push(`/(tabs)/flows/${module.key}/assigned` as never)}
              >
                <Text style={[styles.ghostButtonText, { color: theme.colors.primary }]}>{t('workflow.actions.assigned')}</Text>
              </Pressable>
              <Pressable
                style={[styles.ghostButton, { borderColor: theme.colors.primaryStrong }]}
                onPress={() => router.push(`/(tabs)/flows/${module.key}/approval` as never)}
              >
                <Text style={[styles.ghostButtonText, { color: theme.colors.primary }]}>{t('workflow.actions.approval')}</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, { backgroundColor: theme.colors.primaryStrong }]}
                onPress={() => router.push(`/(tabs)/flows/${module.key}/list` as never)}
              >
                <Text style={styles.primaryButtonText}>{t('workflow.actions.list')}</Text>
                <ArrowRight01Icon size={16} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>{t('workflow.assignedRequestHint')}</Text>
              <Text style={[styles.metaDivider, { color: theme.colors.textMuted }]}>•</Text>
              <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>{t('workflow.approvalRequestHint')}</Text>
              <Text style={[styles.metaDivider, { color: theme.colors.textMuted }]}>•</Text>
              <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>{t('workflow.listRequestHint')}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 132, gap: 16 },
  hero: {
    gap: 10,
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
  },
  eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 1.4 },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { lineHeight: 21 },
  list: { gap: 14 },
  card: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
  },
  cardHeader: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  iconWrap: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 17, fontWeight: '900' },
  cardSubtitle: { lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  secondaryButton: {
    width: '48%',
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: { fontWeight: '800' },
  ghostButton: {
    width: '48%',
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  ghostButtonText: { fontWeight: '800' },
  primaryButton: {
    width: '48%',
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: { fontWeight: '900', color: '#fff' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 11,
    lineHeight: 16,
  },
  metaDivider: {
    fontSize: 11,
  },
});
