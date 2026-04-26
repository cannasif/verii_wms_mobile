import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight01Icon, Cancel01Icon, PackageIcon, PackageSearchIcon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { SearchBar } from '@/features/home/components/SearchBar';
import { Text } from '@/components/ui/Text';
import { RADII, SPACING } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type { ProductOption } from '@/features/workflow-create/types';

export interface StockDirectorySheetProps {
  visible: boolean;
  products: ProductOption[];
  onClose: () => void;
  onSelectProduct: (product: ProductOption) => void;
  onScanPress: () => void;
  /** 'labelPrint': stok seçilince detaya gitmeden etiket akışı için; barkod tarama gizlenir */
  intent?: 'detail' | 'labelPrint';
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export function StockDirectorySheet({
  visible,
  products,
  onClose,
  onSelectProduct,
  onScanPress,
  intent = 'detail',
}: StockDirectorySheetProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) {
      return products;
    }
    return products.filter((p) => {
      const code = normalize(p.stokKodu ?? '');
      const name = normalize(p.stokAdi ?? '');
      return code.includes(q) || name.includes(q);
    });
  }, [products, query]);

  React.useEffect(() => {
    if (!visible) {
      setQuery('');
    }
  }, [visible]);

  const sheetMaxH = Math.min(windowH * 0.78, 560);

  return (
    <Modal visible={visible} animationType='slide' transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole='button' />
        <View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, SPACING.md),
              maxHeight: sheetMaxH,
              backgroundColor: theme.colors.card,
              borderColor: theme.mode === 'dark' ? 'rgba(56,189,248,0.2)' : 'rgba(2,132,199,0.14)',
            },
          ]}
        >
          <View style={styles.grabWrap}>
            <View style={[styles.grab, { backgroundColor: theme.colors.textMuted }]} />
          </View>

          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleRow}>
              <PackageSearchIcon size={22} color={theme.colors.primary} />
              <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
                {intent === 'labelPrint' ? t('screens.inventory.guideLabelPickTitle') : t('screens.inventory.guideTitle')}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole='button' accessibilityLabel={t('settings.cancel')}>
              <Cancel01Icon size={22} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.searchPad}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              onScanPress={intent === 'labelPrint' ? undefined : onScanPress}
              showScanButton={intent !== 'labelPrint'}
              placeholder={t('screens.inventory.guideSearchPlaceholder')}
            />
          </View>

          <Text style={[styles.sectionEyebrow, { color: theme.colors.textMuted }]}>{t('screens.inventory.guideListTitle')}</Text>

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps='handled'
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>{t('screens.inventory.guideEmpty')}</Text>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelectProduct(item)}
                style={({ pressed }) => [
                  styles.rowCard,
                  {
                    backgroundColor: theme.colors.surfaceStrong,
                    borderColor: theme.colors.border,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <View style={[styles.rowIcon, { backgroundColor: theme.mode === 'dark' ? 'rgba(56,189,248,0.12)' : 'rgba(2,132,199,0.08)' }]}>
                  <PackageIcon size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={[styles.rowTitle, { color: theme.colors.text }]} numberOfLines={2}>
                    {item.stokAdi || '-'}
                  </Text>
                  <Text style={[styles.rowCode, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    {item.stokKodu || '-'}
                  </Text>
                </View>
                <ArrowRight01Icon size={18} color={theme.colors.textMuted} />
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(2,6,23,0.55)',
  },
  sheet: {
    borderTopLeftRadius: RADII.xl,
    borderTopRightRadius: RADII.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
  },
  grabWrap: { alignItems: 'center', paddingVertical: SPACING.xs },
  grab: { width: 40, height: 4, borderRadius: 999 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.sm,
  },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  sheetTitle: { fontSize: 17, fontWeight: '800' },
  closeBtn: { padding: SPACING.xs },
  divider: { height: StyleSheet.hairlineWidth, marginBottom: SPACING.sm },
  searchPad: { marginBottom: SPACING.md },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  listContent: { paddingBottom: SPACING.md, gap: SPACING.sm },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: RADII.lg,
    borderWidth: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 14, fontWeight: '800' },
  rowCode: { fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', paddingVertical: SPACING.lg, fontSize: 14 },
});
