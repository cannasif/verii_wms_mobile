import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Add01Icon, CheckmarkCircle02Icon, LeftToRightListBulletIcon, UserIcon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { RADII } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { WORKFLOW_MODULES } from '../config/workflow-modules';
import { WorkflowIcon } from './WorkflowIcon';

const ACTION_ICON = 18;

type HubActionKey = 'create' | 'assigned' | 'approval' | 'list';

type HubAction = {
  key: HubActionKey;
  routeSuffix: 'create' | 'assigned' | 'approval' | 'list';
  labelKey: 'workflow.actions.create' | 'workflow.actions.assigned' | 'workflow.actions.approval' | 'workflow.actions.list';
  Icon: typeof Add01Icon;
};

const HUB_ACTIONS: readonly HubAction[] = [
  { key: 'create', routeSuffix: 'create', labelKey: 'workflow.actions.create', Icon: Add01Icon },
  { key: 'assigned', routeSuffix: 'assigned', labelKey: 'workflow.actions.assigned', Icon: UserIcon },
  { key: 'approval', routeSuffix: 'approval', labelKey: 'workflow.actions.approval', Icon: CheckmarkCircle02Icon },
  { key: 'list', routeSuffix: 'list', labelKey: 'workflow.actions.list', Icon: LeftToRightListBulletIcon },
] as const;

function cardShadow(isLight: boolean): object {
  if (Platform.OS === 'ios') {
    return {
      shadowColor: isLight ? '#0f172a' : '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isLight ? 0.05 : 0.2,
      shadowRadius: 8,
    };
  }
  return { elevation: isLight ? 1 : 2 };
}

function turquoiseCardBorder(isLight: boolean): string {
  return isLight ? 'rgba(34, 211, 238, 0.42)' : 'rgba(56, 189, 248, 0.32)';
}

/** Aksiyon: zemin neredeyse fark edilmez; border dış hattı hafif seçilir. */
function getActionHalo(
  key: HubActionKey,
  isLight: boolean,
): { idle: string; pressed: string; border: string } {
  if (isLight) {
    switch (key) {
      case 'create':
        return {
          idle: 'rgba(2, 132, 199, 0.05)',
          pressed: 'rgba(2, 132, 199, 0.11)',
          border: 'rgba(2, 132, 199, 0.2)',
        };
      case 'assigned':
        return {
          idle: 'rgba(5, 150, 105, 0.045)',
          pressed: 'rgba(5, 150, 105, 0.1)',
          border: 'rgba(5, 150, 105, 0.18)',
        };
      case 'approval':
        return {
          idle: 'rgba(234, 88, 12, 0.042)',
          pressed: 'rgba(234, 88, 12, 0.1)',
          border: 'rgba(234, 88, 12, 0.18)',
        };
      case 'list':
        return {
          idle: 'rgba(124, 58, 237, 0.042)',
          pressed: 'rgba(124, 58, 237, 0.1)',
          border: 'rgba(124, 58, 237, 0.18)',
        };
    }
  }
  switch (key) {
    case 'create':
      return {
        idle: 'rgba(56, 189, 248, 0.07)',
        pressed: 'rgba(56, 189, 248, 0.15)',
        border: 'rgba(56, 189, 248, 0.26)',
      };
    case 'assigned':
      return {
        idle: 'rgba(52, 211, 153, 0.07)',
        pressed: 'rgba(52, 211, 153, 0.14)',
        border: 'rgba(52, 211, 153, 0.22)',
      };
    case 'approval':
      return {
        idle: 'rgba(249, 115, 22, 0.07)',
        pressed: 'rgba(249, 115, 22, 0.14)',
        border: 'rgba(249, 115, 22, 0.22)',
      };
    case 'list':
      return {
        idle: 'rgba(167, 139, 250, 0.08)',
        pressed: 'rgba(167, 139, 250, 0.16)',
        border: 'rgba(139, 92, 246, 0.24)',
      };
  }
}

export function OperationsHubScreen(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isLight = theme.mode === 'light';

  const heroTint = isLight ? 'rgba(2, 132, 199, 0.09)' : 'rgba(14, 165, 233, 0.12)';
  const heroBorder = isLight ? 'rgba(2, 132, 199, 0.22)' : 'rgba(56, 189, 248, 0.2)';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: heroTint, borderColor: heroBorder }]}>
        <Text style={[styles.heroTitle, { color: theme.colors.text }]}>{t('workflow.hubTitle')}</Text>
        <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>{t('workflow.hubDescription')}</Text>
      </View>

      <View style={styles.list}>
        {WORKFLOW_MODULES.map((module) => {
          const cardBg = isLight ? theme.colors.surfaceStrong : theme.colors.card;

          return (
            <View
              key={module.key}
              style={[
                styles.moduleCard,
                { backgroundColor: cardBg, borderColor: turquoiseCardBorder(isLight) },
                cardShadow(isLight),
              ]}
            >
              <View style={styles.moduleHeaderRow}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: `${module.accent}1a`, borderColor: theme.colors.border },
                  ]}
                >
                  <WorkflowIcon module={module} color={module.accent} size={20} />
                </View>
                <View style={styles.copy}>
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{t(module.titleKey)}</Text>
                  <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                    {t(module.subtitleKey)}
                  </Text>
                </View>
              </View>

              <View style={[styles.cardDivider, { backgroundColor: theme.colors.border }]} />

              <View style={styles.actionRow}>
                {HUB_ACTIONS.map((action) => {
                  const Icon = action.Icon;
                  const tone = getActionHalo(action.key, isLight);
                  return (
                    <Pressable
                      key={action.key}
                      style={({ pressed }) => [
                        styles.actionBlock,
                        {
                          backgroundColor: pressed ? tone.pressed : tone.idle,
                          borderColor: tone.border,
                        },
                      ]}
                      onPress={() => router.push(`/(tabs)/flows/${module.key}/${action.routeSuffix}` as never)}
                      accessibilityRole="button"
                      accessibilityLabel={t(action.labelKey)}
                    >
                      <Icon size={ACTION_ICON} color={theme.colors.textSecondary} />
                      <Text
                        numberOfLines={2}
                        style={[styles.actionLabel, { color: theme.colors.text }]}
                      >
                        {t(action.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 132, gap: 16 },
  hero: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: RADII.xl,
    borderWidth: 1,
    gap: 10,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 27,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  list: { gap: 16 },
  moduleCard: {
    borderRadius: RADII.xl,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  moduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 16, fontWeight: '900' },
  cardSubtitle: { fontSize: 12, lineHeight: 17 },
  cardDivider: {
    height: 1,
    width: '100%',
    marginTop: 12,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 6,
  },
  /** Tek Pressable: ikon + metin, tek çerçeve; iç içe buton yok. */
  actionBlock: {
    flex: 1,
    minWidth: 0,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: RADII.sm,
    borderWidth: 1,
    gap: 4,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 12,
  },
});
