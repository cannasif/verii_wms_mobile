import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, LAYOUT, RADII, SPACING } from '@/constants/theme';
import { getPagedSummary } from '@/lib/paged';
import { useTheme } from '@/providers/ThemeProvider';
import { Text } from '@/components/ui/Text';
import { ScreenState } from '@/components/ui/ScreenState';
import type { PagedResponse } from '@/types/paged';

interface FlashPagedListProps<TItem> {
  listRef: React.RefObject<FlatList<TItem> | null>;
  data: TItem[];
  renderItem: ({ item, index }: { item: TItem; index: number }) => React.ReactElement;
  keyExtractor: (item: TItem, index: number) => string;
  latestPage?: PagedResponse<TItem> | null;
  isInitialLoading?: boolean;
  isRefreshing?: boolean;
  isFetchingNextPage?: boolean;
  isError?: boolean;
  onRefresh: () => void | Promise<void>;
  onLoadMore: () => void;
  onRetry?: () => void;
  emptyTitle: string;
  emptyDescription: string;
  errorTitle?: string;
  errorDescription?: string;
  ListHeaderComponent?: React.ReactElement;
}

export function FlashPagedList<TItem>({
  listRef,
  data,
  renderItem,
  keyExtractor,
  latestPage,
  isInitialLoading,
  isRefreshing,
  isFetchingNextPage,
  isError,
  onRefresh,
  onLoadMore,
  onRetry,
  emptyTitle,
  emptyDescription,
  errorTitle,
  errorDescription,
  ListHeaderComponent,
}: FlashPagedListProps<TItem>): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const summary = getPagedSummary(latestPage);

  const renderState = () => {
    if (isInitialLoading) {
      return (
        <ScreenState
          tone="loading"
          title={t('paged.loadingTitle')}
          description={t('paged.loadingDescription')}
        />
      );
    }

    if (isError) {
      return (
        <ScreenState
          tone="error"
          title={errorTitle ?? t('paged.errorTitle')}
          description={errorDescription ?? t('paged.errorDescription')}
          actionLabel={onRetry ? t('common.retry') : undefined}
          onAction={onRetry}
        />
      );
    }

    return (
      <ScreenState
        tone="empty"
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  };

  return (
    <FlatList
      ref={listRef}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.45}
      onRefresh={() => void onRefresh()}
      refreshing={Boolean(isRefreshing)}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={renderState}
      ListFooterComponent={
        <View style={styles.footer}>
          {latestPage ? (
            <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
              {t('paged.summary', { from: summary.from, to: summary.to, total: summary.total })}
            </Text>
          ) : null}
          {isFetchingNextPage ? <ActivityIndicator color={theme.colors.primary} /> : null}
        </View>
      }
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: LAYOUT.screenPadding,
    paddingBottom: LAYOUT.screenBottomPadding,
    gap: SPACING.sm,
    flexGrow: 1,
  },
  footer: {
    paddingTop: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  footerText: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center' },
});
