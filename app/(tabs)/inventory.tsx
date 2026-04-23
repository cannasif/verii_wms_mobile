import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Alert02Icon, ArrowRight01Icon, PackageIcon, PackageSearchIcon, TaskDaily02Icon, WarehouseIcon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ScreenState } from '@/components/ui/ScreenState';
import { SectionCard } from '@/components/ui/SectionCard';
import { Text } from '@/components/ui/Text';
import { RADII, SPACING } from '@/constants/theme';
import { workflowCreateApi } from '@/features/workflow-create/api';
import { normalizeError } from '@/lib/errors';
import { useTheme } from '@/providers/ThemeProvider';

function formatNumber(value: number, language: string): string {
  return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'tr-TR').format(value);
}

export default function InventoryScreen(): React.ReactElement {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();

  const productsQuery = useQuery({
    queryKey: ['inventory', 'products'],
    queryFn: ({ signal }) => workflowCreateApi.getProducts({ signal }),
  });

  const warehousesQuery = useQuery({
    queryKey: ['inventory', 'warehouses'],
    queryFn: ({ signal }) => workflowCreateApi.getWarehouses({ signal }),
  });

  const visibleStockCount = productsQuery.data?.length ?? 0;
  const warehouseCount = warehousesQuery.data?.length ?? 0;

  const numberFormatter = useMemo(
    () => (value: number) => formatNumber(value, i18n.language || 'tr'),
    [i18n.language],
  );

  const isLoading = productsQuery.isLoading || warehousesQuery.isLoading;
  const isError = productsQuery.isError || warehousesQuery.isError;
  const errorMessage = productsQuery.isError
    ? normalizeError(productsQuery.error, t('screens.inventory.loadFailed')).message
    : warehousesQuery.isError
      ? normalizeError(warehousesQuery.error, t('screens.inventory.loadFailed')).message
      : t('screens.inventory.loadFailed');

  return (
    <PageShell scroll>
      <ScreenHeader title={t('screens.inventory.title')} subtitle={t('screens.inventory.subtitle')} />

      <SectionCard style={styles.heroCard}>
        <WarehouseIcon size={24} color={theme.colors.accent} />
        <Text style={styles.heroTitle}>{t('screens.inventory.heroTitle')}</Text>
        <Text style={[styles.heroText, { color: theme.colors.textSecondary }]}>{t('screens.inventory.heroText')}</Text>
      </SectionCard>

      {isLoading ? (
        <ScreenState
          tone='loading'
          title={t('screens.inventory.loadingTitle')}
          description={t('screens.inventory.loadingDescription')}
        />
      ) : isError ? (
        <ScreenState
          tone='error'
          title={t('screens.inventory.errorTitle')}
          description={errorMessage}
          compact
        />
      ) : (
        <View style={styles.statsRow}>
          <SectionCard style={styles.smallCard}>
            <PackageSearchIcon size={20} color={theme.colors.primary} />
            <Text style={styles.value}>{numberFormatter(visibleStockCount)}</Text>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('screens.inventory.visibleStock')}</Text>
          </SectionCard>
          <SectionCard style={styles.smallCard}>
            <Alert02Icon size={20} color={theme.colors.danger} />
            <Text style={styles.value}>{numberFormatter(warehouseCount)}</Text>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('screens.inventory.warehouseCount')}</Text>
          </SectionCard>
        </View>
      )}

      <View style={styles.actionList}>
        <Pressable onPress={() => router.push('/(tabs)/inventory/stock-balance' as never)}>
          {({ pressed }) => (
            <SectionCard style={[styles.actionCard, pressed && styles.actionPressed]}>
              <View style={styles.actionLeft}>
                <View style={[styles.actionIconWrap, { backgroundColor: theme.mode === 'light' ? 'rgba(2,132,199,0.08)' : 'rgba(56,189,248,0.14)' }]}>
                  <WarehouseIcon size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.actionCopy}>
                  <Text style={styles.actionTitle}>{t('inventoryMobile.stock.title')}</Text>
                  <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>
                    {t('inventoryMobile.stock.subtitle')}
                  </Text>
                </View>
              </View>
              <ArrowRight01Icon size={18} color={theme.colors.primary} />
            </SectionCard>
          )}
        </Pressable>

        <Pressable onPress={() => router.push('/(tabs)/inventory/serial-balance' as never)}>
          {({ pressed }) => (
            <SectionCard style={[styles.actionCard, pressed && styles.actionPressed]}>
              <View style={styles.actionLeft}>
                <View style={[styles.actionIconWrap, { backgroundColor: theme.mode === 'light' ? 'rgba(15,118,110,0.08)' : 'rgba(45,212,191,0.14)' }]}>
                  <TaskDaily02Icon size={20} color={theme.colors.success} />
                </View>
                <View style={styles.actionCopy}>
                  <Text style={styles.actionTitle}>{t('inventoryMobile.serial.title')}</Text>
                  <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>
                    {t('inventoryMobile.serial.subtitle')}
                  </Text>
                </View>
              </View>
              <ArrowRight01Icon size={18} color={theme.colors.primary} />
            </SectionCard>
          )}
        </Pressable>

        <Pressable onPress={() => router.push('/(tabs)/inventory/packages' as never)}>
          {({ pressed }) => (
            <SectionCard style={[styles.actionCard, pressed && styles.actionPressed]}>
              <View style={styles.actionLeft}>
                <View style={[styles.actionIconWrap, { backgroundColor: theme.mode === 'light' ? 'rgba(124,58,237,0.08)' : 'rgba(168,85,247,0.14)' }]}>
                  <PackageIcon size={20} color={theme.colors.accent} />
                </View>
                <View style={styles.actionCopy}>
                  <Text style={styles.actionTitle}>{t('packageMobile.list.title')}</Text>
                  <Text style={[styles.actionText, { color: theme.colors.textSecondary }]}>
                    {t('packageMobile.list.subtitle')}
                  </Text>
                </View>
              </View>
              <ArrowRight01Icon size={18} color={theme.colors.primary} />
            </SectionCard>
          )}
        </Pressable>
      </View>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  heroTitle: { fontSize: 18, fontWeight: '800' },
  heroText: { lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: SPACING.sm },
  smallCard: { flex: 1, gap: SPACING.xs, borderRadius: RADII.xl },
  value: { fontSize: 24, fontWeight: '900' },
  label: { lineHeight: 18 },
  actionList: { gap: SPACING.sm, marginTop: SPACING.md },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  actionPressed: { opacity: 0.92 },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADII.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCopy: { flex: 1, gap: 4 },
  actionTitle: { fontSize: 15, fontWeight: '900' },
  actionText: { lineHeight: 18 },
});
