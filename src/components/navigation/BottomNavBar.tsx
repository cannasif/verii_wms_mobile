import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, Platform, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { usePathname, useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  ArrowDataTransferHorizontalIcon,
  BarCode01Icon,
  Download01Icon,
  Home01Icon,
  PackageIcon,
  ShipmentTrackingIcon,
  UserIcon,
} from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import { Text } from '@/components/ui/Text';
import type { AppTheme } from '@/constants/theme';
import { RADII, SPACING } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ITEMS = [
  { key: 'welcome', route: '/(tabs)', icon: Home01Icon },
  { key: 'operations', route: '/(tabs)/operations', icon: ShipmentTrackingIcon },
  { key: 'inventory', route: '/(tabs)/inventory', icon: PackageIcon },
  { key: 'profile', route: '/(tabs)/profile', icon: UserIcon },
] as const;

const QUICK_ACTIONS = [
  { key: 'newReceipt', route: '/(tabs)/flows/goods-receipt/create', Icon: Download01Icon, arc: { translateX: -14, translateY: 10 } as const },
  { key: 'scanShelf', route: '/(tabs)/inventory', Icon: BarCode01Icon, arc: { translateX: 0, translateY: -14 } as const },
  { key: 'openTransfer', route: '/(tabs)/flows/transfer/assigned', Icon: ArrowDataTransferHorizontalIcon, arc: { translateX: 14, translateY: 10 } as const },
] as const;

function normalizePath(pathname: string): string {
  return (pathname || '/').replace(/\/+$/, '') || '/';
}

function isWelcomeTab(segments: readonly string[], pathname: string): boolean {
  const p = normalizePath(pathname);
  if (p === '/' || p === '/(tabs)' || p === '') return true;
  if (!segments.length) return p === '/' || p === '/(tabs)';
  if (segments[0] !== '(tabs)') return false;
  if (segments.length === 1) return true;
  return segments[1] === 'index';
}

function isRouteActive(route: string, pathname: string, segments: readonly string[]): boolean {
  const p = normalizePath(pathname);
  if (route === '/(tabs)') {
    return isWelcomeTab(segments, p);
  }
  if (p === route || p.startsWith(`${route}/`)) return true;
  const withoutGroup = route.replace(/^\/\(tabs\)/, '') || '/';
  if (withoutGroup !== '/' && (p === withoutGroup || p.startsWith(`${withoutGroup}/`))) return true;
  if (segments[0] === '(tabs)' && segments.length >= 2) {
    const rest = segments.slice(1).join('/');
    const routeRest = route.replace(/^\/\(tabs\)\//, '');
    if (routeRest && (rest === routeRest || rest.startsWith(`${routeRest}/`))) return true;
  }
  return false;
}

export function BottomNavBar(): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const fabSpin = useRef(new Animated.Value(0)).current;

  const safeBottom = insets.bottom;
  const navHeight = 72;
  const center = width / 2;
  const holeWidth = 52;
  const depth = 34;
  const navPath = `M 0 0 L ${center - holeWidth} 0 C ${center - 22} 0, ${center - 24} ${depth}, ${center} ${depth} C ${center + 24} ${depth}, ${center + 22} 0, ${center + holeWidth} 0 L ${width} 0`;
  const fillPath = `${navPath} L ${width} ${navHeight + safeBottom} L 0 ${navHeight + safeBottom} Z`;
  const isLight = theme.mode === 'light';
  const navStroke = isLight ? 'rgba(2, 132, 199, 0.22)' : theme.colors.navBorder;

  const overlayTint = isLight ? 'rgba(15, 23, 42, 0.48)' : 'rgba(0, 0, 0, 0.62)';

  const neonBorder = isLight ? 'rgba(14, 165, 233, 0.65)' : 'rgba(56, 189, 248, 0.55)';
  const fabRing = isLight ? 'rgba(255, 255, 255, 0.5)' : 'rgba(125, 211, 252, 0.42)';

  useEffect(() => {
    Animated.spring(fabSpin, {
      toValue: open ? 1 : 0,
      useNativeDriver: true,
      friction: 9,
      tension: 64,
    }).start();
  }, [open, fabSpin]);

  const fabRotate = fabSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={[styles.wrapper, { height: navHeight + safeBottom }]} pointerEvents="box-none">
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <BlurView
            intensity={isLight ? 28 : 18}
            tint={isLight ? 'light' : 'dark'}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.dimOverlay, { backgroundColor: overlayTint }]} />
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} accessibilityRole="button" />
          <View style={[styles.quickMenu, { bottom: safeBottom + 88 }]} pointerEvents="box-none">
            <View style={styles.quickArc}>
              {QUICK_ACTIONS.map((action) => {
                const QIcon = action.Icon;
                return (
                  <TouchableOpacity
                    key={action.key}
                    style={[styles.qChip, { transform: [{ translateX: action.arc.translateX }, { translateY: action.arc.translateY }] }]}
                    activeOpacity={0.88}
                    onPress={() => {
                      setOpen(false);
                      router.push(action.route as never);
                    }}
                    accessibilityLabel={t(`quickActions.${action.key}`)}
                  >
                    <View
                      style={[
                        styles.qCircle,
                        {
                          backgroundColor: theme.colors.card,
                          borderColor: neonBorder,
                          shadowColor: '#38bdf8',
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: isLight ? 0.35 : 0.5,
                          shadowRadius: 10,
                          elevation: Platform.OS === 'android' ? 8 : 0,
                        },
                      ]}
                    >
                      <QIcon size={22} color={theme.colors.text} />
                    </View>
                    <View
                      style={[
                        styles.qPill,
                        {
                          backgroundColor: isLight ? 'rgba(15, 23, 42, 0.9)' : 'rgba(7, 18, 36, 0.88)',
                        },
                      ]}
                    >
                      <Text style={styles.qPillText} numberOfLines={1}>
                        {t(`quickActions.chip.${action.key}`)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      <Svg width={width} height={navHeight + safeBottom} style={StyleSheet.absoluteFill}>
        <Path d={fillPath} fill={theme.colors.nav} />
        <Path d={navPath} fill="none" stroke={navStroke} strokeWidth={2} />
      </Svg>

      <View style={[styles.content, { paddingBottom: safeBottom }]}>
        {ITEMS.slice(0, 2).map((item) => (
          <NavTab
            key={item.key}
            item={item}
            active={isRouteActive(item.route, pathname, segments)}
            isLight={isLight}
            theme={theme}
            label={t(`nav.${item.key}`)}
            onPress={() => router.replace(item.route as never)}
          />
        ))}
        <View style={styles.gap} />
        {ITEMS.slice(2).map((item) => (
          <NavTab
            key={item.key}
            item={item}
            active={isRouteActive(item.route, pathname, segments)}
            isLight={isLight}
            theme={theme}
            label={t(`nav.${item.key}`)}
            onPress={() => router.replace(item.route as never)}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.fab,
          {
            bottom: safeBottom + SPACING.xs,
            borderColor: fabRing,
          },
        ]}
        onPress={() => setOpen((prev) => !prev)}
        activeOpacity={0.9}
      >
        <LinearGradient colors={theme.gradients.primary} style={styles.fabGradient}>
          <Animated.View style={[styles.fabIconWrap, { transform: [{ rotate: fabRotate }] }]}>
            <Image source={require('../../../assets/v3logo.png')} style={styles.fabLogo} resizeMode="contain" />
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function NeonTabCap({
  active,
  capColor,
  isLight,
}: {
  active: boolean;
  capColor: string;
  isLight: boolean;
}): React.ReactElement {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.62, duration: 780, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 780, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  const capGlowIos =
    Platform.OS === 'ios'
      ? {
          shadowColor: '#7dd3fc',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: active ? 1 : 0,
          shadowRadius: 12,
        }
      : {};

  const capGlowAndroid =
    Platform.OS === 'android' && active
      ? {
          elevation: 14,
        }
      : {};

  if (!active) {
    return <View style={styles.tabCapSpacer} />;
  }

  return (
    <Animated.View
      style={[
        styles.tabActiveCapOuter,
        { opacity: pulse },
        capGlowIos,
        capGlowAndroid,
      ]}
    >
      <View
        style={[
          styles.tabActiveCap,
          {
            backgroundColor: capColor,
            borderColor: isLight ? 'rgba(186, 230, 253, 0.98)' : 'rgba(125, 211, 252, 0.95)',
            shadowColor: '#38bdf8',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: Platform.OS === 'ios' ? 0.75 : 0,
            shadowRadius: 8,
            elevation: Platform.OS === 'android' ? 8 : 0,
          },
        ]}
      />
    </Animated.View>
  );
}

function NavTab({
  item,
  active,
  isLight,
  theme,
  label,
  onPress,
}: {
  item: (typeof ITEMS)[number];
  active: boolean;
  isLight: boolean;
  theme: AppTheme;
  label: string;
  onPress: () => void;
}): React.ReactElement {
  const Icon = item.icon;
  const activeColor = theme.colors.primary;
  const inactiveColor = isLight ? theme.colors.textSecondary : theme.colors.textMuted;
  const capColor = isLight ? '#0ea5e9' : '#38bdf8';

  return (
    <TouchableOpacity style={styles.tab} onPress={onPress} activeOpacity={0.78}>
      <View style={styles.tabCapSlot}>
        <NeonTabCap active={active} capColor={capColor} isLight={isLight} />
      </View>
      <Icon size={20} color={active ? activeColor : inactiveColor} />
      <Text
        style={[
          styles.label,
          { color: inactiveColor, fontWeight: isLight ? '700' : '600' },
          active && { color: activeColor, fontWeight: '800' },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  modalRoot: { flex: 1 },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  tab: { width: 72, alignItems: 'center', gap: 4 },
  tabCapSlot: {
    width: '100%',
    height: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tabActiveCapOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActiveCap: {
    width: 30,
    height: 3,
    borderRadius: 2,
    borderWidth: 1,
  },
  tabCapSpacer: {
    height: 8,
    width: 30,
  },
  gap: { width: 72 },
  label: { fontSize: 9 },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: RADII.pill,
    overflow: 'hidden',
    borderWidth: 2,
    shadowColor: '#38bdf8',
    shadowOpacity: 0.38,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  fabGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabLogo: {
    width: 100,
    height: 100,
  },
  quickMenu: { position: 'absolute', right: SPACING.sm, left: SPACING.sm },
  quickArc: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 10,
    minHeight: 112,
    paddingBottom: 4,
  },
  qChip: { alignItems: 'center', width: 76 },
  qCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qPill: {
    marginTop: 6,
    maxWidth: 76,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.pill,
  },
  qPillText: {
    color: '#f8fafc',
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
});
