import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft01Icon, ArrowRight01Icon, CheckmarkCircle02Icon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { ScreenState } from '@/components/ui/ScreenState';
import { styles as grStyles } from '@/features/goods-receipt-create/components/styles';
import { hasPermission } from '@/features/auth/utils/permissions';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/store/auth';
import type { WorkflowModuleConfig } from '../types/workflow';
import { WorkflowIcon } from './WorkflowIcon';

export function WorkflowCreateScreen({ module }: { module: WorkflowModuleConfig }): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const branch = useAuthStore((state) => state.branch);
  const permissions = useAuthStore((state) => state.permissions);
  const canCreate = hasPermission(permissions, module.createPermissionCode);

  return (
    <ScrollView contentContainerStyle={[grStyles.content, { backgroundColor: theme.colors.background }]}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [grStyles.backButton, { opacity: pressed ? 0.86 : 1 }]}
        hitSlop={12}
        accessibilityLabel={t('common.back')}
      >
        <ArrowLeft01Icon size={24} color={theme.colors.danger} />
      </Pressable>

      <LinearGradient
        colors={Array.from(theme.gradients.hero) as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[grStyles.hero, { borderColor: theme.colors.navBorder }]}
      >
        <View style={grStyles.heroInfoRow}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[grStyles.infoTitle, { color: theme.colors.text }]}>{t(module.createTitleKey)}</Text>
            <Text style={[grStyles.infoShort, { color: theme.colors.textSecondary }]}>{t(module.createDescriptionKey)}</Text>
            <Text style={[grStyles.infoLine2, { color: theme.colors.textSecondary }]}>{t(module.createInfoLine2Key)}</Text>
          </View>
          <View
            style={[
              grStyles.heroIconBtn,
              {
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                borderWidth: 1.5,
                borderColor: 'rgba(14, 165, 233, 0.35)',
              },
            ]}
          >
            <WorkflowIcon module={module} color={module.accent} size={22} />
          </View>
        </View>
      </LinearGradient>

      {!canCreate ? (
        <ScreenState
          tone="error"
          title={t('workflow.create.permissionDeniedTitle')}
          description={t('workflow.create.permissionDeniedDescription', {
            title: t(module.createTitleKey),
          })}
        />
      ) : null}

      <View style={styles.gap12}>
        <View style={styles.infoRow}>
          <View
            style={[
              grStyles.infieldCard,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border, flex: 1, paddingVertical: 10 },
            ]}
          >
            <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>{t('workflow.create.branch')}</Text>
            <Text style={[styles.metaValue, { color: theme.colors.text }]}>{branch?.name ?? branch?.code ?? t('workflow.create.notSelected')}</Text>
          </View>
          <View
            style={[
              grStyles.infieldCard,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border, flex: 1, paddingVertical: 10 },
            ]}
          >
            <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>{t('workflow.create.operator')}</Text>
            <Text style={[styles.metaValue, { color: theme.colors.text }]} numberOfLines={1}>
              {user?.name ?? user?.email ?? t('workflow.create.operatorFallback')}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[
          grStyles.infieldCard,
          { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border, gap: 10, paddingVertical: 12 },
        ]}
      >
        <View style={styles.stepRow}>
          <CheckmarkCircle02Icon size={18} color={module.accent} />
          <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>{t('workflow.create.stepOne')}</Text>
        </View>
        <View style={[styles.hairline, { backgroundColor: theme.colors.border, opacity: 0.5 }]} />
        <View style={styles.stepRow}>
          <CheckmarkCircle02Icon size={18} color={module.accent} />
          <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>{t('workflow.create.stepTwo')}</Text>
        </View>
        <View style={[styles.hairline, { backgroundColor: theme.colors.border, opacity: 0.5 }]} />
        <View style={styles.stepRow}>
          <CheckmarkCircle02Icon size={18} color={module.accent} />
          <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>{t('workflow.create.stepThree')}</Text>
        </View>
      </View>

      <View style={grStyles.footerRow}>
        <Pressable
          style={({ pressed }) => [
            grStyles.footerBackBtn,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong, opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={() => router.push(`/(tabs)/flows/${module.key}/assigned` as never)}
        >
          <Text style={{ fontWeight: '800', color: theme.colors.text }}>{t('workflow.actions.openAssigned')}</Text>
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Pressable
            onPress={() => router.push(`/(tabs)/flows/${module.key}/list` as never)}
            disabled={!canCreate}
            style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
          >
            <LinearGradient
              colors={Array.from(theme.gradients.primary) as [string, string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={grStyles.continueBtn}
            >
              <Text style={grStyles.continueText}>{t('workflow.actions.openList')}</Text>
              <ArrowRight01Icon size={20} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  gap12: { gap: 12 },
  infoRow: { flexDirection: 'row', gap: 8 },
  metaLabel: { fontSize: 11, fontWeight: '800' },
  metaValue: { fontSize: 14, fontWeight: '800' },
  stepRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  stepText: { flex: 1, lineHeight: 20, fontSize: 13, fontWeight: '600' },
  hairline: { height: StyleSheet.hairlineWidth },
});
