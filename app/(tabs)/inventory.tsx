import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Alert02Icon, PackageSearchIcon, WarehouseIcon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ScreenState } from '@/components/ui/ScreenState';
import { SectionCard } from '@/components/ui/SectionCard';
import { Text } from '@/components/ui/Text';
import { COLORS, RADII, SPACING } from '@/constants/theme';
import { workflowCreateApi } from '@/features/workflow-create/api';
import { normalizeError } from '@/lib/errors';

function formatNumber(value: number, language: string): string {
  return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'tr-TR').format(value);
}

export default function InventoryScreen(): React.ReactElement {
  const { t, i18n } = useTranslation();

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
        <WarehouseIcon size={24} color={COLORS.accent} />
        <Text style={styles.heroTitle}>{t('screens.inventory.heroTitle')}</Text>
        <Text style={styles.heroText}>{t('screens.inventory.heroText')}</Text>
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
            <PackageSearchIcon size={20} color={COLORS.primary} />
            <Text style={styles.value}>{numberFormatter(visibleStockCount)}</Text>
            <Text style={styles.label}>{t('screens.inventory.visibleStock')}</Text>
          </SectionCard>
          <SectionCard style={styles.smallCard}>
            <Alert02Icon size={20} color={COLORS.danger} />
            <Text style={styles.value}>{numberFormatter(warehouseCount)}</Text>
            <Text style={styles.label}>{t('screens.inventory.warehouseCount')}</Text>
          </SectionCard>
        </View>
      )}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  heroTitle: { fontSize: 18, fontWeight: '800' },
  heroText: { color: COLORS.textSecondary, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: SPACING.sm },
  smallCard: { flex: 1, gap: SPACING.xs, borderRadius: RADII.xl },
  value: { fontSize: 24, fontWeight: '900' },
  label: { color: COLORS.textSecondary, lineHeight: 18 },
});
