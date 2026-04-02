import React, { useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Add01Icon, Cancel01Icon, DashboardSquare03Icon, PackageIcon, ShipmentTrackingIcon, UserIcon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { RADII, SPACING } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ITEMS = [
  { key: 'welcome', route: '/(tabs)', icon: DashboardSquare03Icon },
  { key: 'operations', route: '/(tabs)/operations', icon: ShipmentTrackingIcon },
  { key: 'inventory', route: '/(tabs)/inventory', icon: PackageIcon },
  { key: 'profile', route: '/(tabs)/profile', icon: UserIcon },
] as const;

const QUICK_ACTIONS = [
  { key: 'newReceipt', route: '/(tabs)/flows/goods-receipt/create' },
  { key: 'scanShelf', route: '/(tabs)/inventory' },
  { key: 'openTransfer', route: '/(tabs)/flows/transfer/assigned' },
] as const;

export function BottomNavBar(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const safeBottom = insets.bottom;
  const navHeight = 72;
  const center = width / 2;
  const holeWidth = 52;
  const depth = 34;
  const navPath = `M 0 0 L ${center - holeWidth} 0 C ${center - 22} 0, ${center - 24} ${depth}, ${center} ${depth} C ${center + 24} ${depth}, ${center + 22} 0, ${center + holeWidth} 0 L ${width} 0`;
  const fillPath = `${navPath} L ${width} ${navHeight + safeBottom} L 0 ${navHeight + safeBottom} Z`;

  const isActive = (route: string) => pathname === route || (route !== '/(tabs)' && pathname.startsWith(route));

  return (
    <View style={[styles.wrapper, { height: navHeight + safeBottom }]} pointerEvents="box-none">
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: theme.mode === 'light' ? 'rgba(148,163,184,0.34)' : 'rgba(2,6,12,0.55)' }]} onPress={() => setOpen(false)}>
          <View style={[styles.quickMenu, { bottom: safeBottom + 88 }]}>
            {QUICK_ACTIONS.map((action) => (
              <QuickAction
                key={action.key}
                title={t(`quickActions.${action.key}`)}
                onPress={() => {
                  setOpen(false);
                  router.push(action.route as never);
                }}
              />
            ))}
          </View>
        </Pressable>
      </Modal>

      <Svg width={width} height={navHeight + safeBottom} style={StyleSheet.absoluteFill}>
        <Path d={fillPath} fill={theme.colors.nav} />
        <Path d={navPath} fill="none" stroke={theme.colors.navBorder} strokeWidth={1.4} />
      </Svg>

      <View style={[styles.content, { paddingBottom: safeBottom }]}>
        {ITEMS.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.route);
          return (
            <TouchableOpacity key={item.key} style={styles.tab} onPress={() => router.replace(item.route as never)}>
              <Icon size={20} color={active ? theme.colors.primary : theme.colors.textMuted} />
              <Text style={[styles.label, { color: theme.colors.textMuted }, active && { color: theme.colors.primary }]}>{t(`nav.${item.key}`)}</Text>
            </TouchableOpacity>
          );
        })}
        <View style={styles.gap} />
        {ITEMS.slice(2).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.route);
          return (
            <TouchableOpacity key={item.key} style={styles.tab} onPress={() => router.replace(item.route as never)}>
              <Icon size={20} color={active ? theme.colors.primary : theme.colors.textMuted} />
              <Text style={[styles.label, { color: theme.colors.textMuted }, active && { color: theme.colors.primary }]}>{t(`nav.${item.key}`)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={[styles.fab, { bottom: safeBottom + SPACING.xs }]} onPress={() => setOpen((prev) => !prev)} activeOpacity={0.9}>
        <LinearGradient colors={theme.gradients.primary} style={styles.fabGradient}>
          {open ? <Cancel01Icon size={26} color="#fff" /> : <Add01Icon size={26} color="#fff" />}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function QuickAction({ title, onPress }: { title: string; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity style={[styles.quickAction, { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border }]} onPress={onPress}>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  backdrop: { flex: 1 },
  content: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  tab: { width: 72, alignItems: 'center', gap: 6 },
  gap: { width: 72 },
  label: { fontSize: 11, fontWeight: '600' },
  fab: { position: 'absolute', alignSelf: 'center', width: 68, height: 68, borderRadius: RADII.pill, overflow: 'hidden', shadowOpacity: 0.36, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  fabGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  quickMenu: { position: 'absolute', right: SPACING.lg, left: SPACING.lg, gap: SPACING.xs },
  quickAction: { borderWidth: 1, borderRadius: RADII.lg, paddingVertical: SPACING.md, paddingHorizontal: SPACING.md },
  quickActionText: { fontWeight: '700' },
});
