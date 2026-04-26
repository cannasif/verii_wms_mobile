import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { WarehouseIcon, ShipmentTrackingIcon } from 'hugeicons-react-native';
import { useRecentActivity, type RecentActivityItem } from '../hooks/useRecentActivity';

function timeAgo(dateStr: string | null | undefined, t: ReturnType<typeof useTranslation>['t']): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('welcome.timeAgoJustNow');
  if (mins < 60) return t('welcome.timeAgoMinutes', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('welcome.timeAgoHours', { count: hours });
  return t('welcome.timeAgoDays', { count: Math.floor(hours / 24) });
}

function ActivityItem({ item, isLast }: { item: RecentActivityItem; isLast: boolean }): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const isDark = theme.mode === 'dark';

  const isReceipt = item.moduleKey === 'goods-receipt';
  const Icon = isReceipt ? WarehouseIcon : ShipmentTrackingIcon;
  const iconColor = isReceipt ? '#0ea5e9' : '#14b8a6';
  const iconBg = isReceipt
    ? (isDark ? 'rgba(14,165,233,0.14)' : 'rgba(2,132,199,0.08)')
    : (isDark ? 'rgba(20,184,166,0.14)' : 'rgba(13,148,136,0.08)');

  const title = item.documentNo ?? item.orderId ?? `#${item.id}`;
  const subtitle = item.customerName ?? item.documentType ?? (isReceipt ? 'Mal Kabul' : 'Transfer');
  const time = timeAgo(item.createdDate, t);
  const statusLabel = item.isCompleted
    ? t('welcome.activityCompleted')
    : t('welcome.activityPending');
  const statusColor = item.isCompleted ? '#34d399' : (isDark ? '#f97316' : '#ea580c');
  const separatorColor = isDark ? theme.colors.border : 'rgba(15,23,42,0.14)';

  return (
    <Pressable
      style={[styles.item, !isLast && { borderBottomWidth: 1, borderBottomColor: separatorColor }]}
      onPress={() =>
        router.push({
          pathname: '/(tabs)/flows/[module]/detail/[headerId]',
          params: { module: item.moduleKey, headerId: String(item.id) },
        } as never)
      }
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <Icon size={16} color={iconColor} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.meta}>
        <Text style={[styles.status, { color: statusColor }]}>{statusLabel}</Text>
        <Text style={[styles.time, { color: theme.colors.textMuted }]}>{time}</Text>
      </View>
    </Pressable>
  );
}

export function ActivityList(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const { data, isPending, isError } = useRecentActivity();

  const borderColor = isDark ? 'rgba(56,189,248,0.18)' : 'rgba(2,132,199,0.20)';

  if (isPending) {
    return (
      <View style={[styles.card, { borderColor, backgroundColor: theme.colors.card }]}>
        <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (isError || !data?.length) {
    return (
      <View style={[styles.card, { borderColor, backgroundColor: theme.colors.card }]}>
        <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
          {isError ? t('welcome.activityError') : t('welcome.activityEmpty')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderColor, backgroundColor: theme.colors.card }]}>
      {data.map((item, i) => (
        <ActivityItem key={`${item.moduleKey}-${item.id}`} item={item} isLast={i === data.length - 1} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1.3,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  title: { fontSize: 13, fontWeight: '700', lineHeight: 17 },
  subtitle: { fontSize: 11, lineHeight: 15, color: COLORS.textMuted },
  meta: { alignItems: 'flex-end', gap: 2 },
  status: { fontSize: 11, fontWeight: '700' },
  time: { fontSize: 10, color: COLORS.textMuted },
  emptyText: {
    padding: 20,
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.textMuted,
  },
});
