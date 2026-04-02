import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/theme';
import { formatLocalizedDate } from '@/lib/formatters';
import { useTheme } from '@/providers/ThemeProvider';
import type { CollectionHeaderInfo } from './types';

export function CollectionHeaderInfoCard({ info }: { info?: CollectionHeaderInfo | null }): React.ReactElement | null {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(true);

  const rows = useMemo(() => {
    if (!info) {
      return [];
    }

    return [
      info.customerName ? { label: t('collectionInfo.customerName'), value: info.customerName } : null,
      info.customerCode ? { label: t('collectionInfo.customerCode'), value: info.customerCode } : null,
      info.projectCode ? { label: t('collectionInfo.projectCode'), value: info.projectCode } : null,
      info.sourceWarehouse ? { label: t('collectionInfo.sourceWarehouse'), value: info.sourceWarehouse } : null,
      info.targetWarehouse ? { label: t('collectionInfo.targetWarehouse'), value: info.targetWarehouse } : null,
      info.documentType ? { label: t('collectionInfo.documentType'), value: info.documentType } : null,
      info.documentDate ? { label: t('collectionInfo.documentDate'), value: formatLocalizedDate(info.documentDate) } : null,
    ].filter((row): row is { label: string; value: string } => row !== null);
  }, [info, t]);

  if (!info || (!info.title && rows.length === 0 && !info.subtitle)) {
    return null;
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border }]}>
      <Pressable style={styles.header} onPress={() => setExpanded((prev) => !prev)}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.eyebrow, { color: theme.colors.accent }]}>{t('collectionInfo.title')}</Text>
          {info.title ? <Text style={styles.title}>{info.title}</Text> : null}
          {info.subtitle ? <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{info.subtitle}</Text> : null}
        </View>
        <Text style={[styles.toggle, { color: theme.colors.primary }]}>{expanded ? t('collectionInfo.hide') : t('collectionInfo.show')}</Text>
      </Pressable>

      {expanded ? (
        <View style={[styles.content, { borderTopColor: theme.colors.border }]}>
          {rows.map((row, index) => (
            <View key={`${row.label}-${row.value}-${index}`} style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>{row.label}</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>{row.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 18,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  eyebrow: {
    color: COLORS.accent,
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  toggle: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  content: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  row: {
    gap: 4,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  value: {
    color: COLORS.text,
    fontWeight: '700',
  },
});
