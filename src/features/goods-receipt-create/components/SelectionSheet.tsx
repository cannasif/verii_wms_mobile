import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { COLORS, LAYOUT, RADII, SPACING } from '@/constants/theme';
import { Text } from '@/components/ui/Text';
import { ScreenState } from '@/components/ui/ScreenState';
import { useTheme } from '@/providers/ThemeProvider';

interface SelectionSheetProps<T> {
  visible: boolean;
  title: string;
  placeholder: string;
  emptyText: string;
  items: T[];
  selectedValue?: string;
  getValue: (item: T) => string;
  getLabel: (item: T) => string;
  onSelect: (item: T) => void;
  onClose: () => void;
}

export function SelectionSheet<T>({
  visible,
  title,
  placeholder,
  emptyText,
  items,
  selectedValue,
  getValue,
  getLabel,
  onSelect,
  onClose,
}: SelectionSheetProps<T>): React.ReactElement {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(() => {
    if (!search.trim()) {
      return items;
    }

    const query = search.toLocaleLowerCase('tr-TR');
    return items.filter((item) => getLabel(item).toLocaleLowerCase('tr-TR').includes(query));
  }, [getLabel, items, search]);

  return (
    <Modal visible={visible} transparent animationType='slide' onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.mode === 'light' ? 'rgba(148,163,184,0.32)' : 'rgba(0,0,0,0.45)' }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          <Text style={styles.title}>{title}</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.searchInput, { backgroundColor: theme.colors.surfaceStrong, color: theme.colors.text, borderColor: theme.colors.border }]}
          />
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => getValue(item)}
            keyboardShouldPersistTaps='handled'
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
          />
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
});
