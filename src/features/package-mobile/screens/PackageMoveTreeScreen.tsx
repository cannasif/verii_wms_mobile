import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckmarkCircle02Icon, PackageIcon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ScreenState } from '@/components/ui/ScreenState';
import { SectionCard } from '@/components/ui/SectionCard';
import { Text } from '@/components/ui/Text';
import { RADII, SPACING } from '@/constants/theme';
import { showError, showSuccess } from '@/lib/feedback';
import { useTheme } from '@/providers/ThemeProvider';
import { packageMobileApi } from '../api';
import type { MobilePackageTreeNode } from '../types';

function collectIds(nodes: MobilePackageTreeNode[]): number[] {
  return nodes.flatMap((node) => [node.package.id, ...collectIds(node.children ?? [])]);
}

function TreeNode({
  node,
  selectedIds,
  onToggle,
  depth = 0,
}: {
  node: MobilePackageTreeNode;
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  depth?: number;
}): React.ReactElement {
  const { theme } = useTheme();
  const selected = selectedIds.has(node.package.id);

  return (
    <View style={{ marginLeft: depth * 14, gap: SPACING.xs }}>
      <Pressable
        onPress={() => onToggle(node.package.id)}
        style={[
          styles.treeRow,
          {
            borderColor: selected ? theme.colors.primary : theme.colors.border,
            backgroundColor: selected ? (theme.mode === 'light' ? 'rgba(2,132,199,0.08)' : 'rgba(56,189,248,0.12)') : theme.colors.surfaceStrong,
          },
        ]}
      >
        <View style={styles.treeRowCopy}>
          <Text style={styles.treeTitle}>{node.package.packageNo}</Text>
          <Text style={[styles.treeSubtitle, { color: theme.colors.textSecondary }]}>
            {node.package.packageType} · {node.package.status}
          </Text>
        </View>
        {selected ? <CheckmarkCircle02Icon size={18} color={theme.colors.primary} /> : null}
      </Pressable>
      {node.children.map((child) => (
        <TreeNode key={child.package.id} node={child} selectedIds={selectedIds} onToggle={onToggle} depth={depth + 1} />
      ))}
    </View>
  );
}

export function PackageMoveTreeScreen({
  moduleKey,
  targetSourceType,
  targetSourceHeaderId,
  sourcePackingHeaderId,
  targetLabel,
}: {
  moduleKey: 'transfer' | 'shipment';
  targetSourceType: 'WT' | 'SH';
  targetSourceHeaderId: number;
  sourcePackingHeaderId: number;
  targetLabel: string;
}): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [note, setNote] = useState('');

  const headerQuery = useQuery({
    queryKey: ['package-mobile', 'header', sourcePackingHeaderId],
    queryFn: ({ signal }) => packageMobileApi.getHeaderById(sourcePackingHeaderId, { signal }),
  });

  const treeQuery = useQuery({
    queryKey: ['package-mobile', 'tree', sourcePackingHeaderId],
    queryFn: ({ signal }) => packageMobileApi.getPackageTree(sourcePackingHeaderId, { signal }),
  });

  const moveMutation = useMutation({
    mutationFn: async () =>
      packageMobileApi.movePackagesToSourceHeader({
        targetSourceType,
        targetSourceHeaderId,
        packageIds: Array.from(selectedIds),
        targetPackageStatus: targetSourceType === 'SH' ? 'Loaded' : 'Transferred',
        note: note.trim() || null,
      }),
    onSuccess: (result) => {
      showSuccess(
        t('packageMoveMobile.moveSuccess', {
          packageCount: result.packageCount,
          lineCount: result.lineCount,
        }),
      );
      router.back();
      router.back();
    },
    onError: (error) => {
      showError(error, t('packageMoveMobile.moveFailed'));
    },
  });

  const tree = treeQuery.data ?? [];
  const allIds = useMemo(() => collectIds(tree), [tree]);

  const toggleSelection = (id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isLoading = headerQuery.isLoading || treeQuery.isLoading;
  const isError = headerQuery.isError || treeQuery.isError;

  if (isLoading) {
    return (
      <PageShell>
        <ScreenHeader title={t('packageMoveMobile.treeTitle')} subtitle={t('packageMoveMobile.treeSubtitle', { target: targetLabel })} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </PageShell>
    );
  }

  if (isError || !headerQuery.data) {
    return (
      <PageShell>
        <ScreenHeader title={t('packageMoveMobile.treeTitle')} subtitle={t('packageMoveMobile.treeSubtitle', { target: targetLabel })} />
        <ScreenState tone='error' title={t('packageMoveMobile.errorTitle')} description={t('packageMoveMobile.loadFailed')} />
      </PageShell>
    );
  }

  return (
    <PageShell scroll>
      <ScreenHeader title={t('packageMoveMobile.treeTitle')} subtitle={t('packageMoveMobile.treeSubtitle', { target: targetLabel })} />

      <SectionCard>
        <View style={styles.heroRow}>
          <PackageIcon size={22} color={theme.colors.primary} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{headerQuery.data.packingNo}</Text>
            <Text style={[styles.heroText, { color: theme.colors.textSecondary }]}>
              {headerQuery.data.customerCode || '-'} · {headerQuery.data.customerName || headerQuery.data.sourceType || '-'}
            </Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard
        title={t('packageMoveMobile.selectionTitle')}
        subtitle={t('packageMoveMobile.selectionSubtitle', { count: selectedIds.size })}
      >
        <View style={styles.actionRow}>
          <Pressable
            onPress={() => setSelectedIds(new Set(allIds))}
            style={[styles.actionButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]}
          >
            <Text style={styles.actionButtonText}>{t('packageMoveMobile.selectAll')}</Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedIds(new Set())}
            style={[styles.actionButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]}
          >
            <Text style={styles.actionButtonText}>{t('packageMoveMobile.clearSelection')}</Text>
          </Pressable>
        </View>

        <View style={styles.treeList}>
          {tree.length === 0 ? (
            <ScreenState tone='empty' title={t('packageMoveMobile.emptyTitle')} description={t('packageMoveMobile.emptyDescription')} compact />
          ) : (
            tree.map((node) => (
              <TreeNode key={node.package.id} node={node} selectedIds={selectedIds} onToggle={toggleSelection} />
            ))
          )}
        </View>
      </SectionCard>

      <SectionCard title={t('packageMoveMobile.noteTitle')} subtitle={t('packageMoveMobile.noteSubtitle')}>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={t('packageMoveMobile.notePlaceholder')}
          placeholderTextColor={theme.colors.textMuted}
          multiline
          style={[
            styles.noteInput,
            {
              color: theme.colors.text,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surfaceStrong,
            },
          ]}
        />
      </SectionCard>

      <Pressable
        disabled={selectedIds.size === 0 || moveMutation.isPending}
        onPress={() => moveMutation.mutate()}
        style={[
          styles.moveButton,
          {
            backgroundColor: selectedIds.size === 0 || moveMutation.isPending ? theme.colors.border : theme.colors.primaryStrong,
          },
        ]}
      >
        <Text style={styles.moveButtonText}>
          {moveMutation.isPending ? t('packageMoveMobile.moving') : t('packageMoveMobile.moveAction')}
        </Text>
      </Pressable>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 48 },
  heroRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  heroCopy: { flex: 1, gap: 4 },
  heroTitle: { fontSize: 17, fontWeight: '900' },
  heroText: { lineHeight: 19 },
  actionRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  actionButton: { flex: 1, borderRadius: RADII.xl, borderWidth: 1, paddingVertical: SPACING.sm, alignItems: 'center' },
  actionButtonText: { fontWeight: '800' },
  treeList: { gap: SPACING.sm },
  treeRow: { borderWidth: 1, borderRadius: RADII.xl, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
  treeRowCopy: { flex: 1, gap: 4 },
  treeTitle: { fontSize: 15, fontWeight: '900' },
  treeSubtitle: { lineHeight: 18 },
  noteInput: {
    minHeight: 92,
    borderWidth: 1,
    borderRadius: RADII.xl,
    padding: SPACING.md,
    textAlignVertical: 'top',
  },
  moveButton: {
    marginTop: SPACING.md,
    borderRadius: RADII.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  moveButtonText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
