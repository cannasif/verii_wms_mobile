/* @refresh reset */
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  type AlertButton,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  Easing,
  Vibration,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter, type Href } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import Svg, { Path } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowDataTransferHorizontalIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  Layers01Icon,
  PackageIcon,
  PackageSearchIcon,
  ShipmentTrackingIcon,
  TaskDaily02Icon,
  ThreeDViewIcon,
} from 'hugeicons-react-native';
import { PageShell } from '@/components/layout/PageShell';
import { SectionCard } from '@/components/ui/SectionCard';
import { Text } from '@/components/ui/Text';
import { RADII, SPACING } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { normalizeError } from '@/lib/errors';
import { showWarning } from '@/lib/feedback';
import { workflowCreateApi } from '@/features/workflow-create/api';
import { SearchBar } from '@/features/home/components/SearchBar';
import {
  BarcodeResolveError,
  findStocksByCode,
  resolveBarcodeToStockCode,
  type HomeStockRow,
} from '@/features/home/api/barcode-stock-api';
import type { BarcodeMatchCandidate } from '@/services/barcode-types';
import { StockDirectorySheet } from '../components/StockDirectorySheet';
import type { ProductOption } from '@/features/workflow-create/types';
import { LabelPrintSheet } from '@/features/label-printing/components/LabelPrintSheet';

function ScannerTorchGlyph({ active }: { active: boolean }): React.ReactElement {
  const stroke = active ? '#FDE047' : '#F8FAFC';
  return (
    <Svg width={22} height={22} viewBox='0 0 24 24'>
      <Path
        d='M12 2.5L9 6h6l-3-3.5zM9 7.5h6V9l-1.2 1v7.5H10.2V10L9 9V7.5z'
        fill={stroke}
        fillOpacity={active ? 1 : 0.92}
      />
      <Path d='M10 18.5h4v2h-4v-2z' fill={stroke} fillOpacity={active ? 1 : 0.92} />
    </Svg>
  );
}

const SCAN_SQUARE_WIDTH_RATIO = 0.78;
const SCAN_SQUARE_MAX_PX = 300;
const MIN_BARCODE_OVERLAP_IN_FRAME = 0.42;

type AxisRect = { left: number; top: number; right: number; bottom: number };

function scanSquareSidePx(windowWidth: number): number {
  return Math.min(windowWidth * SCAN_SQUARE_WIDTH_RATIO, SCAN_SQUARE_MAX_PX);
}

function scanTargetFrameInPreview(previewW: number, previewH: number, squareSide: number): AxisRect {
  const left = (previewW - squareSide) / 2;
  const top = (previewH - squareSide) / 2;
  return { left, top, right: left + squareSide, bottom: top + squareSide };
}

function rectFromBounds(bounds: BarcodeScanningResult['bounds']): AxisRect | null {
  const w = bounds?.size?.width ?? 0;
  const h = bounds?.size?.height ?? 0;
  const x = bounds?.origin?.x;
  const y = bounds?.origin?.y;
  if (x === undefined || y === undefined || w <= 0 || h <= 0) {
    return null;
  }
  return { left: x, top: y, right: x + w, bottom: y + h };
}

function rectFromCornerPoints(points: BarcodeScanningResult['cornerPoints']): AxisRect | null {
  if (!points?.length) {
    return null;
  }
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  if (right <= left || bottom <= top) {
    return null;
  }
  return { left, top, right, bottom };
}

function maybeDenormalizeToPreview(rect: AxisRect, previewW: number, previewH: number): AxisRect {
  const maxCoord = Math.max(rect.right, rect.bottom, rect.left, rect.top);
  if (maxCoord <= 1.5) {
    return {
      left: rect.left * previewW,
      top: rect.top * previewH,
      right: rect.right * previewW,
      bottom: rect.bottom * previewH,
    };
  }
  return rect;
}

function intersectionArea(a: AxisRect, b: AxisRect): number {
  const w = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const h = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return w * h;
}

function barcodeArea(rect: AxisRect): number {
  return Math.max(0, rect.right - rect.left) * Math.max(0, rect.bottom - rect.top);
}

function barcodeCenterInFrame(barcode: AxisRect, frame: AxisRect): boolean {
  const cx = (barcode.left + barcode.right) / 2;
  const cy = (barcode.top + barcode.bottom) / 2;
  return cx >= frame.left && cx <= frame.right && cy >= frame.top && cy <= frame.bottom;
}

function overlapRatioInFrame(barcode: AxisRect, frame: AxisRect): number {
  const area = barcodeArea(barcode);
  if (area <= 0) {
    return 0;
  }
  return intersectionArea(barcode, frame) / area;
}

function isScanInsideWhiteSquare(
  result: BarcodeScanningResult,
  preview: { width: number; height: number },
  squareSide: number,
): boolean {
  const raw = rectFromBounds(result.bounds) ?? rectFromCornerPoints(result.cornerPoints);
  if (!raw) {
    return false;
  }
  const barcode = maybeDenormalizeToPreview(raw, preview.width, preview.height);
  const frame = scanTargetFrameInPreview(preview.width, preview.height, squareSide);
  if (!barcodeCenterInFrame(barcode, frame)) {
    return false;
  }
  return overlapRatioInFrame(barcode, frame) >= MIN_BARCODE_OVERLAP_IN_FRAME;
}

function stockDetailHref(row: Pick<HomeStockRow, 'id' | 'erpStockCode'>): Href {
  const code = encodeURIComponent(row.erpStockCode ?? '');
  return `/(tabs)/inventory/stock-detail/${row.id}?stockCode=${code}` as Href;
}

function productDetailHref(p: ProductOption): Href {
  const code = encodeURIComponent(p.stokKodu ?? '');
  return `/(tabs)/inventory/stock-detail/${p.id}?stockCode=${code}` as Href;
}

function formatNumber(value: number, language: string): string {
  return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'tr-TR').format(value);
}

const QUICK_CHIPS = [
  { key: 'dat' as const, route: '/(tabs)/flows/transfer/create' as Href, Icon: ArrowDataTransferHorizontalIcon },
  { key: 'packing' as const, route: '/(tabs)/inventory/packages/create' as Href, Icon: PackageIcon },
  { key: 'shipment' as const, route: '/(tabs)/flows/shipment/create' as Href, Icon: ShipmentTrackingIcon },
];

const INVENTORY_INPUT_ROW_H = 46;

const CHIP_PALETTE = [
  { dark: { bg: 'rgba(14,165,233,0.10)', border: 'rgba(14,165,233,0.20)', icon: '#7dd3fc' }, light: { bg: 'rgba(2,132,199,0.05)', border: 'rgba(2,132,199,0.14)', icon: '#0284c7' } },
  { dark: { bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.20)', icon: '#fdba74' }, light: { bg: 'rgba(234,88,12,0.05)', border: 'rgba(234,88,12,0.14)', icon: '#ea580c' } },
  { dark: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(167,139,250,0.22)', icon: '#c4b5fd' }, light: { bg: 'rgba(124,58,237,0.06)', border: 'rgba(124,58,237,0.16)', icon: '#7c3aed' } },
] as const;

export function InventoryHubScreen(): React.ReactElement {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const scanSquareSide = React.useMemo(() => scanSquareSidePx(windowWidth), [windowWidth]);
  const isDark = theme.mode === 'dark';

  const productsQuery = useQuery({
    queryKey: ['inventory', 'products'],
    queryFn: ({ signal }) => workflowCreateApi.getProducts({ signal }),
  });

  const warehousesQuery = useQuery({
    queryKey: ['inventory', 'warehouses'],
    queryFn: ({ signal }) => workflowCreateApi.getWarehouses({ signal }),
  });

  const products = productsQuery.data ?? [];
  const visibleStockCount = products.length;
  const warehouseCount = warehousesQuery.data?.length ?? 0;

  const numberFormatter = React.useMemo(
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

  const [directoryOpen, setDirectoryOpen] = React.useState(false);
  const [directoryIntent, setDirectoryIntent] = React.useState<'detail' | 'labelPrint'>('detail');
  const directoryIntentRef = React.useRef<'detail' | 'labelPrint'>('detail');
  const [labelPrintOpen, setLabelPrintOpen] = React.useState(false);
  const [labelPrintKey, setLabelPrintKey] = React.useState(0);
  const [labelStock, setLabelStock] = React.useState<{ stockId: number; stockCode: string; stockName: string } | null>(null);
  const [barcodeInput, setBarcodeInput] = React.useState('');
  const [isResolving, setIsResolving] = React.useState(false);
  const [scannerOpen, setScannerOpen] = React.useState(false);
  const [scannerLocked, setScannerLocked] = React.useState(false);
  const [scanFrameHeight, setScanFrameHeight] = React.useState(220);
  const [scannerTorchOn, setScannerTorchOn] = React.useState(false);
  const cameraPreviewLayoutRef = React.useRef<{ width: number; height: number } | null>(null);
  const [wedgeBuffer, setWedgeBuffer] = React.useState('');
  const [isManualInputFocused, setIsManualInputFocused] = React.useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const lastScanRef = React.useRef<{ value: string; at: number }>({ value: '', at: 0 });
  const wedgeInputRef = React.useRef<TextInput | null>(null);
  const wedgeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanLineAnim = React.useRef(new Animated.Value(0)).current;
  const beepSoundRef = React.useRef<Audio.Sound | null>(null);

  React.useEffect(() => {
    if (!scannerOpen) {
      scanLineAnim.stopAnimation();
      scanLineAnim.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 1250, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 1250, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [scanLineAnim, scannerOpen]);

  React.useEffect(() => {
    return () => {
      if (wedgeTimerRef.current) {
        clearTimeout(wedgeTimerRef.current);
        wedgeTimerRef.current = null;
      }
      if (beepSoundRef.current) {
        void beepSoundRef.current.unloadAsync();
        beepSoundRef.current = null;
      }
    };
  }, []);

  const navigateToStockRow = React.useCallback(
    (row: HomeStockRow) => {
      setDirectoryOpen(false);
      router.push(stockDetailHref(row));
    },
    [router],
  );

  const resolveStockCodeToDetail = React.useCallback(
    async (stockCode: string) => {
      const rows = await findStocksByCode(stockCode);
      if (rows.length === 0) {
        showWarning(t('welcome.stockNotFound'));
        return;
      }

      if (rows.length === 1) {
        navigateToStockRow(rows[0] as HomeStockRow);
        return;
      }

      const buttons: AlertButton[] = rows.slice(0, 5).map((row) => ({
        text: `${row.erpStockCode} - ${row.stockName}`,
        onPress: () => {
          navigateToStockRow(row);
        },
      }));
      buttons.push({ text: t('settings.cancel'), style: 'cancel' as const });
      Alert.alert(t('welcome.stockSelectTitle'), t('welcome.stockSelectDescription'), buttons);
    },
    [navigateToStockRow, t],
  );

  const resolveByCandidate = React.useCallback(
    async (candidate: BarcodeMatchCandidate) => {
      const candidateCode = candidate.stockCode?.trim();
      if (!candidateCode) {
        showWarning(t('welcome.stockCodeMissing'));
        return;
      }
      await resolveStockCodeToDetail(candidateCode);
    },
    [resolveStockCodeToDetail, t],
  );

  const handleResolveError = React.useCallback(
    (error: BarcodeResolveError) => {
      const normalizedCode = (error.errorCode ?? '').replace(/[^a-z0-9]/gi, '').toUpperCase();
      const lowerMessage = (error.message ?? '').toLowerCase();

      if (normalizedCode === 'AMBIGUOUSMATCH') {
        const candidates = error.candidates ?? [];
        if (candidates.length > 0) {
          const buttons: AlertButton[] = candidates.slice(0, 5).map((candidate) => ({
            text: `${candidate.stockCode ?? '?'}${candidate.stockName ? ` - ${candidate.stockName}` : ''}`,
            onPress: () => {
              void resolveByCandidate(candidate);
            },
          }));
          buttons.push({ text: t('settings.cancel'), style: 'cancel' as const });
          Alert.alert(t('welcome.ambiguousTitle'), t('welcome.ambiguousDescription'), buttons);
        } else {
          showWarning(t('welcome.ambiguousDescription'));
        }
        return;
      }

      if (
        normalizedCode === 'NOMATCH' ||
        normalizedCode === 'STOCKNOTFOUND' ||
        normalizedCode === 'NOTFOUND' ||
        lowerMessage.includes('no match') ||
        lowerMessage.includes('stok bulunamad') ||
        lowerMessage.includes('not found')
      ) {
        showWarning(t('welcome.stockNotFound'));
        return;
      }

      if (normalizedCode === 'INVALIDBARCODEFORMAT' || lowerMessage.includes('format')) {
        showWarning(t('welcome.invalidBarcodeFormat'));
        return;
      }

      if (normalizedCode === 'MISSINGREQUIREDSEGMENT' || lowerMessage.includes('segment')) {
        showWarning(t('welcome.missingBarcodeSegment'));
        return;
      }

      if (normalizedCode === 'DEFINITIONNOTFOUND' || lowerMessage.includes('definition')) {
        showWarning(t('welcome.definitionNotFound'));
        return;
      }

      switch (error.errorCode) {
        case 'AmbiguousMatch': {
          const candidates = error.candidates ?? [];
          if (candidates.length > 0) {
            const buttons: AlertButton[] = candidates.slice(0, 5).map((candidate) => ({
              text: `${candidate.stockCode ?? '?'}${candidate.stockName ? ` - ${candidate.stockName}` : ''}`,
              onPress: () => {
                void resolveByCandidate(candidate);
              },
            }));
            buttons.push({ text: t('settings.cancel'), style: 'cancel' as const });
            Alert.alert(t('welcome.ambiguousTitle'), t('welcome.ambiguousDescription'), buttons);
          } else {
            showWarning(t('welcome.ambiguousDescription'));
          }
          return;
        }
        case 'NoMatch':
          showWarning(t('welcome.stockNotFound'));
          return;
        case 'InvalidBarcodeFormat':
          showWarning(t('welcome.invalidBarcodeFormat'));
          return;
        case 'MissingRequiredSegment':
          showWarning(t('welcome.missingBarcodeSegment'));
          return;
        case 'DefinitionNotFound':
          showWarning(t('welcome.definitionNotFound'));
          return;
        case 'StockCodeEmpty':
          showWarning(t('welcome.stockNotFound'));
          return;
        default:
          showWarning(error.message || t('welcome.stockNotFound'));
      }
    },
    [resolveByCandidate, t],
  );

  const resolveAndNavigate = React.useCallback(
    async (raw: string) => {
      const barcode = raw.trim();
      if (!barcode || isResolving) {
        return;
      }

      setIsResolving(true);
      try {
        const stockCode = await resolveBarcodeToStockCode(barcode);
        await resolveStockCodeToDetail(stockCode);
      } catch (error) {
        if (error instanceof BarcodeResolveError) {
          handleResolveError(error);
        } else {
          const fallbackMessage = error instanceof Error ? error.message : t('welcome.stockNotFound');
          const lowerFallback = fallbackMessage.toLowerCase();
          if (
            lowerFallback.includes('no match') ||
            lowerFallback.includes('stok bulunamad') ||
            lowerFallback.includes('not found')
          ) {
            showWarning(t('welcome.stockNotFound'));
          } else if (lowerFallback.includes('format')) {
            showWarning(t('welcome.invalidBarcodeFormat'));
          } else if (lowerFallback.includes('segment')) {
            showWarning(t('welcome.missingBarcodeSegment'));
          } else {
            showWarning(fallbackMessage || t('welcome.stockNotFound'));
          }
        }
      } finally {
        setIsResolving(false);
      }
    },
    [handleResolveError, isResolving, resolveStockCodeToDetail, t],
  );

  const playBeep = React.useCallback(async () => {
    try {
      if (beepSoundRef.current) {
        await beepSoundRef.current.unloadAsync();
        beepSoundRef.current = null;
      }
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' },
        { shouldPlay: true, volume: 0.72 },
      );
      beepSoundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          void sound.unloadAsync();
          if (beepSoundRef.current === sound) {
            beepSoundRef.current = null;
          }
        }
      });
    } catch {}
  }, []);

  const openScanner = React.useCallback(async () => {
    const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!permission?.granted) {
      showWarning(t('welcome.cameraPermission'));
      return;
    }
    setScannerTorchOn(false);
    cameraPreviewLayoutRef.current = null;
    setScannerLocked(false);
    setScannerOpen(true);
  }, [cameraPermission, requestCameraPermission, t]);

  const handleBarcodeScanned = React.useCallback(
    (result: BarcodeScanningResult) => {
      const value = result.data?.trim();
      if (!value || scannerLocked || isResolving) {
        return;
      }
      const preview = cameraPreviewLayoutRef.current;
      if (preview && preview.width > 0 && preview.height > 0) {
        if (!isScanInsideWhiteSquare(result, preview, scanSquareSide)) {
          return;
        }
      }
      const now = Date.now();
      if (lastScanRef.current.value === value && now - lastScanRef.current.at < 900) {
        return;
      }
      lastScanRef.current = { value, at: now };
      setScannerLocked(true);
      setScannerOpen(false);
      void playBeep();
      Vibration.vibrate(45);
      setBarcodeInput(value);
      void resolveAndNavigate(value);
    },
    [isResolving, playBeep, resolveAndNavigate, scanSquareSide, scannerLocked],
  );

  const closeScanner = React.useCallback(() => {
    setScannerOpen(false);
    setScannerLocked(false);
    setScannerTorchOn(false);
    cameraPreviewLayoutRef.current = null;
  }, []);

  const submitBarcodeInput = React.useCallback(() => {
    if (!barcodeInput.trim()) {
      showWarning(t('welcome.barcodeEmpty'));
      return;
    }
    void resolveAndNavigate(barcodeInput);
  }, [barcodeInput, resolveAndNavigate, t]);

  const focusWedgeInput = React.useCallback(() => {
    if (scannerOpen || isManualInputFocused) {
      return;
    }
    setTimeout(() => {
      wedgeInputRef.current?.focus();
    }, 40);
  }, [isManualInputFocused, scannerOpen]);

  const consumeWedgeScan = React.useCallback(
    (raw: string) => {
      const value = raw.trim();
      if (!value) {
        return;
      }
      setWedgeBuffer('');
      setBarcodeInput(value);
      void resolveAndNavigate(value);
    },
    [resolveAndNavigate],
  );

  const handleWedgeChange = React.useCallback(
    (text: string) => {
      setWedgeBuffer(text);
      if (wedgeTimerRef.current) {
        clearTimeout(wedgeTimerRef.current);
      }
      wedgeTimerRef.current = setTimeout(() => {
        consumeWedgeScan(text);
        wedgeTimerRef.current = null;
      }, 120);
    },
    [consumeWedgeScan],
  );

  const handleWedgeSubmit = React.useCallback(() => {
    if (wedgeTimerRef.current) {
      clearTimeout(wedgeTimerRef.current);
      wedgeTimerRef.current = null;
    }
    consumeWedgeScan(wedgeBuffer);
  }, [consumeWedgeScan, wedgeBuffer]);

  React.useEffect(() => {
    focusWedgeInput();
  }, [focusWedgeInput]);

  React.useEffect(() => {
    if (!scannerOpen) {
      focusWedgeInput();
    }
  }, [focusWedgeInput, scannerOpen]);

  const openScannerFromDirectory = React.useCallback(() => {
    setDirectoryOpen(false);
    directoryIntentRef.current = 'detail';
    setDirectoryIntent('detail');
    void openScanner();
  }, [openScanner]);

  const closeDirectory = React.useCallback(() => {
    setDirectoryOpen(false);
    directoryIntentRef.current = 'detail';
    setDirectoryIntent('detail');
  }, []);

  const openDirectoryForDetail = React.useCallback(() => {
    directoryIntentRef.current = 'detail';
    setDirectoryIntent('detail');
    setDirectoryOpen(true);
  }, []);

  const openDirectoryForLabelPrint = React.useCallback(() => {
    directoryIntentRef.current = 'labelPrint';
    setDirectoryIntent('labelPrint');
    setDirectoryOpen(true);
  }, []);

  const onSelectDirectoryProduct = React.useCallback(
    (p: ProductOption) => {
      const intent = directoryIntentRef.current;
      directoryIntentRef.current = 'detail';
      setDirectoryIntent('detail');
      setDirectoryOpen(false);
      if (intent === 'labelPrint') {
        setLabelPrintKey((k) => k + 1);
        setLabelStock({
          stockId: p.id,
          stockCode: p.stokKodu ?? '',
          stockName: p.stokAdi ?? '',
        });
        setLabelPrintOpen(true);
        return;
      }
      router.push(productDetailHref(p));
    },
    [router],
  );

  const chipsScrollRef = React.useRef<ScrollView>(null);
  const [chipsScroll, setChipsScroll] = React.useState({ x: 0, contentW: 0, layoutW: 0 });

  const onChipsScroll = React.useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    setChipsScroll({
      x: contentOffset.x,
      contentW: contentSize.width,
      layoutW: layoutMeasurement.width,
    });
  }, []);

  const chipsMaxOffset = Math.max(0, chipsScroll.contentW - chipsScroll.layoutW);
  const chipsOverflow = chipsScroll.contentW > chipsScroll.layoutW + 3;
  const chipsCanScrollLeft = chipsOverflow && chipsScroll.x > 4;
  const chipsCanScrollRight = chipsOverflow && chipsScroll.x < chipsMaxOffset - 4;

  const nudgeChips = React.useCallback(
    (dir: -1 | 1) => {
      const step = 108;
      const max = Math.max(0, chipsScroll.contentW - chipsScroll.layoutW);
      const next = Math.max(0, Math.min(max, chipsScroll.x + dir * step));
      chipsScrollRef.current?.scrollTo({ x: next, animated: true });
    },
    [chipsScroll.contentW, chipsScroll.layoutW, chipsScroll.x],
  );

  const summaryGrad = isDark
    ? (['rgba(36, 58, 92, 0.97)', 'rgba(18, 32, 54, 0.99)'] as const)
    : (['#f5f9ff', '#e4eef8'] as const);
  const summaryTitleC = isDark ? '#f8fafc' : '#0f2744';
  const summaryEyebrowC = isDark ? 'rgba(226, 232, 240, 0.68)' : 'rgba(15, 39, 68, 0.52)';
  const summaryIconBg = isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(2, 132, 199, 0.08)';
  const summaryIconBorder = isDark ? 'rgba(94, 234, 212, 0.28)' : 'rgba(34, 211, 238, 0.22)';
  const summaryIconColor = isDark ? '#bae6fd' : theme.colors.primary;
  const statTileBg = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.88)';
  const statTileBorder = isDark ? 'rgba(94, 234, 212, 0.32)' : 'rgba(34, 211, 238, 0.28)';
  const statClusterBg = isDark ? 'rgba(15, 23, 42, 0.35)' : 'rgba(255, 255, 255, 0.45)';
  const statClusterBorder = isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(6, 182, 212, 0.2)';
  const statValueC = isDark ? '#f8fafc' : '#0c4a6e';
  const statLabelC = isDark ? 'rgba(226, 232, 240, 0.78)' : 'rgba(15, 61, 94, 0.58)';
  const summaryStateTitleC = summaryTitleC;
  const summaryStateDescC = isDark ? 'rgba(226, 232, 240, 0.76)' : 'rgba(15, 39, 68, 0.55)';
  const summaryHintC = isDark ? 'rgba(226, 232, 240, 0.62)' : 'rgba(15, 39, 68, 0.48)';

  const summaryNeonBorder = isDark ? 'rgba(94, 234, 212, 0.38)' : 'rgba(6, 182, 212, 0.32)';
  const menuNeonBorder = isDark ? 'rgba(56, 189, 248, 0.38)' : 'rgba(34, 211, 238, 0.34)';
  const menuNeonGlow = isDark ? 'rgba(45, 212, 211, 0.35)' : 'rgba(6, 182, 212, 0.3)';

  const menuCardNeon = {
    borderColor: menuNeonBorder,
    borderWidth: 1,
    backgroundColor: theme.colors.surfaceStrong,
    shadowColor: menuNeonGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: isDark ? 0.3 : 0.22,
    shadowRadius: 8,
    elevation: isDark ? 5 : 4,
  } as const;

  const rehberSurface = isDark
    ? (['rgba(56,189,248,0.20)', 'rgba(14,165,233,0.12)'] as const)
    : (['rgba(240,249,255,0.98)', 'rgba(186,230,253,0.82)'] as const);
  const rehberBorder = isDark ? 'rgba(125,211,252,0.26)' : 'rgba(2,132,199,0.16)';
  const rehberIconColor = isDark ? '#e0f2fe' : '#0369a1';

  const labelIconSurface = isDark
    ? (['rgba(251,191,36,0.18)', 'rgba(249,115,22,0.10)'] as const)
    : (['rgba(255,251,235,0.98)', 'rgba(254,215,170,0.75)'] as const);
  const labelIconBorder = isDark ? 'rgba(251,191,36,0.32)' : 'rgba(234,88,12,0.22)';
  const labelIconColor = isDark ? '#fde68a' : '#c2410c';

  return (
    <View style={styles.root}>
      <TextInput
        ref={wedgeInputRef}
        value={wedgeBuffer}
        onChangeText={handleWedgeChange}
        onSubmitEditing={handleWedgeSubmit}
        blurOnSubmit={false}
        autoFocus
        showSoftInputOnFocus={false}
        caretHidden
        autoCapitalize='characters'
        autoCorrect={false}
        keyboardType='default'
        style={styles.wedgeInput}
      />
      <StatusBar style={scannerOpen ? 'light' : isDark ? 'light' : 'dark'} />

      <PageShell scroll contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View style={[styles.searchRow, { minHeight: INVENTORY_INPUT_ROW_H }]}>
          <View style={[styles.searchFlex, { minHeight: INVENTORY_INPUT_ROW_H, justifyContent: 'center' }]}>
            <SearchBar
              variant='slim'
              value={barcodeInput}
              onChangeText={setBarcodeInput}
              onSubmit={submitBarcodeInput}
              onScanPress={openScanner}
              onInputFocus={() => setIsManualInputFocused(true)}
              onInputBlur={() => {
                setIsManualInputFocused(false);
                focusWedgeInput();
              }}
              disabled={isResolving}
              placeholder={t('screens.inventory.searchPlaceholder')}
            />
          </View>
          <View style={styles.searchIconRail}>
            <Pressable
              onPress={openDirectoryForLabelPrint}
              accessibilityRole='button'
              accessibilityLabel={t('welcome.printLabels')}
              style={({ pressed }) => [styles.rehberPress, { opacity: pressed ? 0.88 : 1 }]}
            >
              <LinearGradient colors={labelIconSurface} style={[styles.rehberBtn, { borderColor: labelIconBorder }]}>
                <Ionicons name='print-outline' size={20} color={labelIconColor} />
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={openDirectoryForDetail}
              accessibilityRole='button'
              accessibilityLabel={t('screens.inventory.guideTitle')}
              style={({ pressed }) => [styles.rehberPress, { opacity: pressed ? 0.88 : 1 }]}
            >
              <LinearGradient colors={rehberSurface} style={[styles.rehberBtn, { borderColor: rehberBorder }]}>
                <PackageSearchIcon size={20} color={rehberIconColor} />
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        <View style={styles.chipsRail}>
          <Pressable
            onPress={() => nudgeChips(-1)}
            disabled={!chipsCanScrollLeft}
            hitSlop={6}
            accessibilityRole='button'
            accessibilityLabel={t('screens.inventory.chipsScrollBack')}
            style={({ pressed }) => [
              styles.chipArrow,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.mode === 'dark' ? 'rgba(15,23,42,0.5)' : 'rgba(255,255,255,0.72)',
                opacity: !chipsCanScrollLeft ? 0.34 : pressed ? 0.78 : 1,
              },
            ]}
          >
            <ArrowLeft01Icon size={16} color={theme.colors.textSecondary} />
          </Pressable>
          <View style={styles.chipsScrollWrap}>
            <ScrollView
              ref={chipsScrollRef}
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={onChipsScroll}
              onMomentumScrollEnd={onChipsScroll}
              onContentSizeChange={(w) => {
                setChipsScroll((m) => ({ ...m, contentW: w }));
              }}
              onLayout={(e) => {
                setChipsScroll((m) => ({ ...m, layoutW: e.nativeEvent.layout.width }));
              }}
              contentContainerStyle={styles.chipsScrollInner}
            >
              {QUICK_CHIPS.map((chip, index) => {
              const Icon = chip.Icon;
              const tone = isDark ? CHIP_PALETTE[index].dark : CHIP_PALETTE[index].light;
              const labelKey =
                chip.key === 'dat'
                  ? 'screens.inventory.quickDat'
                  : chip.key === 'packing'
                    ? 'screens.inventory.quickPacking'
                    : 'screens.inventory.quickShipment';
              return (
                <Pressable
                  key={chip.key}
                  onPress={() => router.push(chip.route)}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: theme.mode === 'dark' ? 'rgba(15,23,42,0.35)' : theme.colors.surfaceStrong,
                      borderColor: tone.border,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <View style={[styles.chipIcon, { backgroundColor: tone.bg, borderColor: tone.border }]}>
                    <Icon size={13} color={tone.icon} />
                  </View>
                  <Text style={[styles.chipLabel, { color: theme.colors.text }]} numberOfLines={1}>
                    {t(labelKey)}
                  </Text>
                </Pressable>
              );
            })}
            </ScrollView>
          </View>
          <Pressable
            onPress={() => nudgeChips(1)}
            disabled={!chipsCanScrollRight}
            hitSlop={6}
            accessibilityRole='button'
            accessibilityLabel={t('screens.inventory.chipsScrollForward')}
            style={({ pressed }) => [
              styles.chipArrow,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.mode === 'dark' ? 'rgba(15,23,42,0.5)' : 'rgba(255,255,255,0.72)',
                opacity: !chipsCanScrollRight ? 0.34 : pressed ? 0.78 : 1,
              },
            ]}
          >
            <ArrowRight01Icon size={16} color={theme.colors.textSecondary} />
          </Pressable>
        </View>

        <LinearGradient
          colors={summaryGrad}
          style={[
            styles.summaryCard,
            {
              borderColor: summaryNeonBorder,
              borderWidth: 1,
            },
          ]}
        >
          <View style={styles.summaryHeader}>
            <View
              style={[
                styles.summaryIconWrap,
                { backgroundColor: summaryIconBg, borderColor: summaryIconBorder },
              ]}
            >
              <ThreeDViewIcon size={18} color={summaryIconColor} />
            </View>
            <View style={styles.summaryTitleBlock}>
              <Text style={[styles.summaryTitle, { color: summaryTitleC }]}>{t('screens.inventory.summaryTitle')}</Text>
              <Text style={[styles.summaryEyebrow, { color: summaryEyebrowC }]}>{t('screens.inventory.summaryEyebrow')}</Text>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.summaryState}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={[styles.summaryStateTitle, { color: summaryStateTitleC }]}>{t('screens.inventory.loadingTitle')}</Text>
              <Text style={[styles.summaryStateDesc, { color: summaryStateDescC }]}>{t('screens.inventory.loadingDescription')}</Text>
            </View>
          ) : isError ? (
            <View style={styles.summaryState}>
              <Text style={[styles.summaryStateTitle, { color: summaryStateTitleC }]}>{t('screens.inventory.errorTitle')}</Text>
              <Text style={[styles.summaryStateDesc, { color: summaryStateDescC }]}>{errorMessage}</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.summaryHint, { color: summaryHintC }]} numberOfLines={2}>
                {t('screens.inventory.heroText')}
              </Text>
              <View
                style={[
                  styles.statsCluster,
                  {
                    backgroundColor: statClusterBg,
                    borderColor: statClusterBorder,
                  },
                ]}
              >
                <View style={styles.statsRow}>
                  <View
                    style={[
                      styles.statBox,
                      {
                        backgroundColor: statTileBg,
                        borderColor: statTileBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.statValue, { color: statValueC }]}>{numberFormatter(visibleStockCount)}</Text>
                    <Text style={[styles.statLabel, { color: statLabelC }]}>{t('screens.inventory.statProducts')}</Text>
                  </View>
                  <View
                    style={[
                      styles.statBox,
                      {
                        backgroundColor: statTileBg,
                        borderColor: statTileBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.statValue, { color: statValueC }]}>{numberFormatter(warehouseCount)}</Text>
                    <Text style={[styles.statLabel, { color: statLabelC }]}>{t('screens.inventory.statWarehouses')}</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </LinearGradient>

        <View style={styles.actionList}>
          <Pressable onPress={() => router.push('/(tabs)/inventory/stock-balance' as Href)}>
            {({ pressed }) => (
              <SectionCard
                style={[styles.menuCard, pressed && styles.actionPressed, menuCardNeon]}
                contentStyle={styles.menuCardInner}
              >
                <View style={styles.actionLeft}>
                  <View style={[styles.actionIconWrap, { backgroundColor: isDark ? 'rgba(45,212,191,0.14)' : 'rgba(13,148,136,0.10)' }]}>
                    <Layers01Icon size={18} color={theme.colors.primary} />
                  </View>
                  <View style={styles.actionCopy}>
                    <Text style={[styles.actionTitle, { color: theme.colors.text }]} numberOfLines={2}>
                      {t('inventoryMobile.stock.title')}
                    </Text>
                    <Text style={[styles.actionText, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                      {t('screens.inventory.cardStockBalance')}
                    </Text>
                  </View>
                </View>
                <View style={[styles.chevronCircle, { backgroundColor: isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.06)' }]}>
                  <ArrowRight01Icon size={15} color={theme.colors.textMuted} />
                </View>
              </SectionCard>
            )}
          </Pressable>

          <Pressable onPress={() => router.push('/(tabs)/inventory/serial-balance' as Href)}>
            {({ pressed }) => (
              <SectionCard
                style={[styles.menuCard, pressed && styles.actionPressed, menuCardNeon]}
                contentStyle={styles.menuCardInner}
              >
                <View style={styles.actionLeft}>
                  <View style={[styles.actionIconWrap, { backgroundColor: isDark ? 'rgba(167,139,250,0.16)' : 'rgba(124,58,237,0.10)' }]}>
                    <TaskDaily02Icon size={18} color='#a78bfa' />
                  </View>
                  <View style={styles.actionCopy}>
                    <Text style={[styles.actionTitle, { color: theme.colors.text }]} numberOfLines={2}>
                      {t('inventoryMobile.serial.title')}
                    </Text>
                    <Text style={[styles.actionText, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                      {t('screens.inventory.cardSerialBalance')}
                    </Text>
                  </View>
                </View>
                <View style={[styles.chevronCircle, { backgroundColor: isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.06)' }]}>
                  <ArrowRight01Icon size={15} color={theme.colors.textMuted} />
                </View>
              </SectionCard>
            )}
          </Pressable>

          <Pressable onPress={() => router.push('/(tabs)/inventory/packages' as Href)}>
            {({ pressed }) => (
              <SectionCard
                style={[styles.menuCard, pressed && styles.actionPressed, menuCardNeon]}
                contentStyle={styles.menuCardInner}
              >
                <View style={styles.actionLeft}>
                  <View style={[styles.actionIconWrap, { backgroundColor: isDark ? 'rgba(251,146,60,0.14)' : 'rgba(234,88,12,0.10)' }]}>
                    <PackageIcon size={18} color={theme.colors.accent} />
                  </View>
                  <View style={styles.actionCopy}>
                    <Text style={[styles.actionTitle, { color: theme.colors.text }]} numberOfLines={2}>
                      {t('packageMobile.list.title')}
                    </Text>
                    <Text style={[styles.actionText, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                      {t('screens.inventory.cardPackages')}
                    </Text>
                  </View>
                </View>
                <View style={[styles.chevronCircle, { backgroundColor: isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.06)' }]}>
                  <ArrowRight01Icon size={15} color={theme.colors.textMuted} />
                </View>
              </SectionCard>
            )}
          </Pressable>
        </View>
      </PageShell>

      <StockDirectorySheet
        visible={directoryOpen}
        products={products}
        onClose={closeDirectory}
        onSelectProduct={onSelectDirectoryProduct}
        onScanPress={openScannerFromDirectory}
        intent={directoryIntent}
      />

      {labelPrintOpen && labelStock ? (
        <LabelPrintSheet
          key={labelPrintKey}
          visible
          stockId={labelStock.stockId}
          stockCode={labelStock.stockCode}
          stockName={labelStock.stockName}
          onClose={() => {
            setLabelPrintOpen(false);
            setLabelStock(null);
          }}
        />
      ) : null}

      <Modal visible={scannerOpen} animationType='fade' transparent statusBarTranslucent onRequestClose={closeScanner}>
        <View style={styles.scannerModalRoot}>
          <View style={[styles.scannerHeader, { paddingTop: insets.top + 6 }]}>
            <View style={styles.scannerHeaderSide}>
              <Pressable style={styles.scannerHeaderBtn} onPress={closeScanner} accessibilityRole='button' accessibilityLabel={t('settings.cancel')}>
                <Cancel01Icon size={22} color='#F8FAFC' />
              </Pressable>
            </View>
            <Text style={styles.scannerHeaderTitle}>{t('welcome.scannerTitle')}</Text>
            <View style={[styles.scannerHeaderSide, { alignItems: 'flex-end' }]}>
              <Pressable style={styles.scannerHeaderBtn} onPress={() => setScannerTorchOn((v) => !v)} accessibilityRole='button' accessibilityLabel='Torch'>
                <ScannerTorchGlyph active={scannerTorchOn} />
              </Pressable>
            </View>
          </View>

          <View
            style={styles.scannerCameraHost}
            onLayout={(event) => {
              const { width: w, height: h } = event.nativeEvent.layout;
              if (w > 0 && h > 0) {
                cameraPreviewLayoutRef.current = { width: w, height: h };
              }
            }}
          >
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing='back'
              enableTorch={scannerTorchOn}
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'code128', 'code39', 'code93', 'upc_a', 'upc_e', 'qr'] }}
              onBarcodeScanned={handleBarcodeScanned}
            />
            <View style={styles.scannerDimOverlay} pointerEvents='none' />
            <View style={styles.scannerFrameWrap} pointerEvents='none'>
              <View
                style={[styles.scannerFrameSquare, { width: scanSquareSide }]}
                onLayout={(event) => {
                  setScanFrameHeight(event.nativeEvent.layout.height);
                }}
              >
                <Animated.View
                  pointerEvents='none'
                  style={[
                    styles.scannerLaserLine,
                    {
                      transform: [
                        {
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [14, Math.max(20, scanFrameHeight - 18)],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <View style={[styles.scannerCorner, styles.scannerCornerTL]} />
                <View style={[styles.scannerCorner, styles.scannerCornerTR]} />
                <View style={[styles.scannerCorner, styles.scannerCornerBL]} />
                <View style={[styles.scannerCorner, styles.scannerCornerBR]} />
              </View>
            </View>
          </View>

          <View style={[styles.scannerFooter, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
            <Text style={styles.scannerHelpText}>{t('welcome.scanHelp')}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  wedgeInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchFlex: { flex: 1, minWidth: 0 },
  searchIconRail: { flexShrink: 0, flexDirection: 'row', alignItems: 'stretch', gap: 6 },
  rehberPress: { flexShrink: 0 },
  rehberBtn: {
    width: INVENTORY_INPUT_ROW_H,
    height: INVENTORY_INPUT_ROW_H,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  chipsRail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  chipArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsScrollWrap: { flex: 1, minWidth: 0 },
  chipsScrollInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 1,
    paddingHorizontal: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADII.pill,
    borderWidth: 1,
  },
  chipIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.15 },
  summaryCard: {
    borderRadius: RADII.lg,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm + 2,
  },
  summaryHint: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    letterSpacing: 0.08,
    marginTop: -2,
  },
  statsCluster: {
    borderRadius: RADII.md,
    borderWidth: 1,
    padding: SPACING.xs + 2,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  summaryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitleBlock: { flex: 1, gap: 1 },
  summaryTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.15 },
  summaryEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase' },
  statsRow: { flexDirection: 'row', gap: SPACING.sm },
  statBox: {
    flex: 1,
    borderRadius: RADII.md,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm,
    gap: 3,
    borderWidth: 1,
  },
  statValue: { fontSize: 21, fontWeight: '900', letterSpacing: 0.2, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.75 },
  summaryState: { alignItems: 'center', gap: SPACING.xs, paddingVertical: SPACING.xs },
  summaryStateTitle: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
  summaryStateDesc: { fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 17 },
  actionList: { gap: SPACING.sm },
  menuCard: {
    padding: 0,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.lg,
    borderWidth: 1,
    gap: 0,
  },
  menuCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  actionPressed: { opacity: 0.92 },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCopy: { flex: 1, flexShrink: 1, minWidth: 0, gap: 2 },
  actionTitle: { fontSize: 14, fontWeight: '900', lineHeight: 18 },
  actionText: { lineHeight: 16, fontSize: 12, fontWeight: '600' },
  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scannerModalRoot: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  scannerHeaderSide: {
    width: 52,
    justifyContent: 'center',
  },
  scannerHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248,250,252,0.10)',
  },
  scannerHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.2,
    paddingHorizontal: 4,
  },
  scannerCameraHost: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000000',
  },
  scannerDimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
  },
  scannerFrameWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrameSquare: {
    aspectRatio: 1,
    position: 'relative',
    borderRadius: 4,
  },
  scannerLaserLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 999,
    backgroundColor: '#FF3B3B',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 10,
    elevation: 10,
  },
  scannerCorner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#FFFFFF',
  },
  scannerCornerTL: {
    top: 8,
    left: 8,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  scannerCornerTR: {
    top: 8,
    right: 8,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  scannerCornerBL: {
    bottom: 8,
    left: 8,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  scannerCornerBR: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
  scannerFooter: {
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: 'center',
  },
  scannerHelpText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    color: '#E2E8F0',
    lineHeight: 22,
  },
});
