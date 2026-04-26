import React from 'react';
import { ActivityIndicator, FlatList, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LAYOUT, SPACING } from '@/constants/theme';
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
  contentContainerStyle?: StyleProp<ViewStyle>;
  ItemSeparatorComponent?: React.ComponentProps<typeof FlatList>['ItemSeparatorComponent'];
  numColumns?: number;
  columnWrapperStyle?: StyleProp<ViewStyle>;
  /** Change this value to force-remount the FlatList (needed when numColumns changes). */
  listKey?: string;
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
  contentContainerStyle: contentContainerStyleProp,
  ItemSeparatorComponent,
  numColumns = 1,
  columnWrapperStyle,
  listKey,
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
      key={listKey}
      ref={listRef}
      data={data}
      numColumns={numColumns}
      columnWrapperStyle={numColumns > 1 ? columnWrapperStyle : undefined}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.45}
      onRefresh={() => void onRefresh()}
      refreshing={Boolean(isRefreshing)}
      ListHeaderComponent={ListHeaderComponent}
      ItemSeparatorComponent={ItemSeparatorComponent}
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
      contentContainerStyle={[styles.content, contentContainerStyleProp]}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: SPACING.md,
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
  footerText: { fontSize: 12, textAlign: 'center' },
});
