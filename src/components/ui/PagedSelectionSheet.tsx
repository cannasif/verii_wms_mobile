import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { COLORS, LAYOUT, RADII, SPACING } from '@/constants/theme';
import { Text } from '@/components/ui/Text';
import { ScreenState } from '@/components/ui/ScreenState';
import { useTheme } from '@/providers/ThemeProvider';
import type { PagedResponse } from '@/types/paged';

interface PagedSelectionSheetProps<T> {
  visible: boolean;
  title: string;
  placeholder: string;
  emptyText: string;
  /** Rendered above the list (e.g. “All” option). */
  listHeader?: React.ReactElement | null;
  selectedValue?: string;
  queryKey: readonly unknown[];
  fetchPage: (args: {
    pageNumber: number;
    pageSize: number;
    search: string;
    signal?: AbortSignal;
  }) => Promise<PagedResponse<T>>;
  getValue: (item: T) => string;
  getLabel: (item: T) => string;
  onSelect: (item: T) => void;
  onClose: () => void;
  /**
   * Verildiğinde arama, klavye onayı beklemeden bu uzunlukta (trim sonrası) yazıldıktan sonra tetiklenir.
   * Daha kısa metinde arama boşaltılır (ilk sayfa / tüm liste davranışı).
   */
  autoSearchMinLength?: number;
  /** Otomatik arama için gecikme (ms). Varsayılan: 350 */
  autoSearchDebounceMs?: number;
}

export function PagedSelectionSheet<T>({
  visible,
  title,
  placeholder,
  emptyText,
  listHeader,
  selectedValue,
  queryKey,
  fetchPage,
  getValue,
  getLabel,
  onSelect,
  onClose,
  autoSearchMinLength,
  autoSearchDebounceMs = 350,
}: PagedSelectionSheetProps<T>): React.ReactElement {
  const { theme } = useTheme();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushAutoSearch = (text: string) => {
    if (autoSearchMinLength == null) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const trimmed = text.trim();
    setSearch(trimmed.length >= autoSearchMinLength ? trimmed : '');
  };

  useEffect(() => {
    if (!visible || autoSearchMinLength == null) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      const trimmed = searchInput.trim();
      setSearch(trimmed.length >= autoSearchMinLength ? trimmed : '');
    }, autoSearchDebounceMs);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [searchInput, visible, autoSearchMinLength, autoSearchDebounceMs]);

  const query = useInfiniteQuery({
    queryKey: [...queryKey, search],
    enabled: visible,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      fetchPage({
        pageNumber: pageParam,
        pageSize: 20,
        search,
        signal,
      }),
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.pageNumber + 1 : undefined),
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [query.data?.pages],
  );

  return (
    <Modal visible={visible} transparent animationType='slide' onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.mode === 'light' ? 'rgba(148,163,184,0.32)' : 'rgba(0,0,0,0.45)' }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          <Text style={styles.title}>{title}</Text>
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={() => {
              if (autoSearchMinLength != null) {
                flushAutoSearch(searchInput);
              } else {
                setSearch(searchInput.trim());
              }
            }}
            returnKeyType='search'
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.searchInput, { backgroundColor: theme.colors.surfaceStrong, color: theme.colors.text, borderColor: theme.colors.border }]}
          />
          {query.isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => getValue(item)}
              keyboardShouldPersistTaps='handled'
              ListHeaderComponent={listHeader ?? null}
              onEndReachedThreshold={0.3}
              onEndReached={() => {
                if (query.hasNextPage && !query.isFetchingNextPage) {
                  void query.fetchNextPage();
                }
              }}
              renderItem={({ item }) => {
                const value = getValue(item);
                const isSelected = value === selectedValue;

                return (
                  <Pressable
                    style={[
                      styles.option,
                      {
                        backgroundColor: theme.mode === 'light' ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.03)',
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      },
                      isSelected ? styles.optionSelected : null,
                    ]}
                    onPress={() => {
                      onSelect(item);
                      setSearch('');
                      setSearchInput('');
                      onClose();
                    }}
                  >
                    <Text style={[styles.optionText, { color: theme.colors.text }]}>{getLabel(item)}</Text>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <ScreenState
                  tone='empty'
                  title={emptyText}
                  description={placeholder}
                  compact
                />
              }
              ListFooterComponent={
                query.isFetchingNextPage ? (
                  <View style={styles.footerLoading}>
                    <ActivityIndicator color={theme.colors.primary} />
                  </View>
                ) : null
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '75%',
    borderTopLeftRadius: RADII.xxl,
    borderTopRightRadius: RADII.xxl,
    backgroundColor: COLORS.backgroundSecondary,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 56,
    height: 5,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
  },
  searchInput: {
    minHeight: LAYOUT.inputHeight,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surfaceStrong,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadingWrap: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  option: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xs,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(56,189,248,0.12)',
  },
  optionText: {
    fontWeight: '700',
    color: COLORS.text,
  },
  footerLoading: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
