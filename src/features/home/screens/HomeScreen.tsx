import React from 'react';
import {
  Alert,
  Animated,
  type AlertButton,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Easing,
  Vibration,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import Svg, { Path } from 'react-native-svg';
import { Cancel01Icon } from 'hugeicons-react-native';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { showWarning } from '@/lib/feedback';
import { HeroCard } from '../components/HeroCard';
import { KpiStrip } from '../components/KpiStrip';
import { ModuleGrid } from '../components/ModuleGrid';
import { SearchBar } from '../components/SearchBar';
import { ActivityList } from '../components/ActivityList';
import { BarcodeResolveError, findStocksByCode, getStockDetail, type HomeStockDetail, type HomeStockRow, resolveBarcodeToStockCode } from '../api/barcode-stock-api';
import type { BarcodeMatchCandidate } from '@/services/barcode-types';

function ScannerTorchGlyph({ active }: { active: boolean }): React.ReactElement {
  const stroke = active ? '#FDE047' : '#F8FAFC';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M12 2.5L9 6h6l-3-3.5zM9 7.5h6V9l-1.2 1v7.5H10.2V10L9 9V7.5z"
        fill={stroke}
        fillOpacity={active ? 1 : 0.92}
      />
      <Path d="M10 18.5h4v2h-4v-2z" fill={stroke} fillOpacity={active ? 1 : 0.92} />
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

export function HomeScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const scanSquareSide = React.useMemo(() => scanSquareSidePx(windowWidth), [windowWidth]);
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const isDark = theme.mode === 'dark';
  const [barcodeInput, setBarcodeInput] = React.useState('');
  const [isResolving, setIsResolving] = React.useState(false);
  const [scannerOpen, setScannerOpen] = React.useState(false);
  const [scannerLocked, setScannerLocked] = React.useState(false);
  const [scanFrameHeight, setScanFrameHeight] = React.useState(220);
  const [scannerTorchOn, setScannerTorchOn] = React.useState(false);
  const cameraPreviewLayoutRef = React.useRef<{ width: number; height: number } | null>(null);
  const [stockModalOpen, setStockModalOpen] = React.useState(false);
  const [stockModalLoading, setStockModalLoading] = React.useState(false);
  const [stockModalData, setStockModalData] = React.useState<HomeStockDetail | null>(null);
  const [stockModalBase, setStockModalBase] = React.useState<HomeStockRow | null>(null);
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

  const openStockPreviewModal = React.useCallback(async (stock: HomeStockRow) => {
    setStockModalOpen(true);
    setStockModalLoading(true);
    setStockModalBase(stock);
    setStockModalData(null);
    try {
      const detail = await getStockDetail(stock.id);
      setStockModalData(detail);
    } finally {
      setStockModalLoading(false);
    }
  }, []);

  const resolveStockCodeToDetail = React.useCallback(
    async (stockCode: string) => {
      const rows = await findStocksByCode(stockCode);
      if (rows.length === 0) {
        showWarning(t('welcome.stockNotFound'));
        return;
      }

      if (rows.length === 1) {
        await openStockPreviewModal(rows[0] as HomeStockRow);
        return;
      }

      const buttons: AlertButton[] = rows.slice(0, 5).map((row) => ({
        text: `${row.erpStockCode} - ${row.stockName}`,
        onPress: () => {
          void openStockPreviewModal(row);
        },
      }));
      buttons.push({ text: t('settings.cancel'), style: 'cancel' as const });
      Alert.alert(t('welcome.stockSelectTitle'), t('welcome.stockSelectDescription'), buttons);
    },
    [openStockPreviewModal, t],
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

  const closeStockModal = React.useCallback(() => {
    setStockModalOpen(false);
    setStockModalBase(null);
    setStockModalData(null);
    setStockModalLoading(false);
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

  return (
    <View style={[styles.root, { backgroundColor: 'transparent' }]}>
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
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 120,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Barkod/arama çubuğu */}
        <SearchBar
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
        />

        {/* Depo kartı */}
        <HeroCard />

        {/* Hızlı işlemler */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: isDark ? theme.colors.textMuted : theme.colors.textSecondary }]}>
            {t('welcome.quickActions')}
          </Text>
          <ModuleGrid />
        </View>

        {/* İstatistikler */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: isDark ? theme.colors.textMuted : theme.colors.textSecondary }]}>
            {t('welcome.kpiTitle')}
          </Text>
          <KpiStrip />
        </View>

        {/* Son hareketler */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionLabel, { color: isDark ? theme.colors.textMuted : theme.colors.textSecondary }]}>
              {t('welcome.activity')}
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/operations')}>
              <Text style={[styles.allLink, { color: theme.colors.primary }]}>
                {t('welcome.allActivity')} →
              </Text>
            </Pressable>
          </View>
          <ActivityList />
        </View>
      </ScrollView>

      <Modal visible={scannerOpen} animationType="fade" transparent statusBarTranslucent onRequestClose={closeScanner}>
        <View style={styles.scannerModalRoot}>
          <View style={[styles.scannerHeader, { paddingTop: insets.top + 6 }]}>
            <View style={styles.scannerHeaderSide}>
              <Pressable style={styles.scannerHeaderBtn} onPress={closeScanner} accessibilityRole="button" accessibilityLabel={t('settings.cancel')}>
                <Cancel01Icon size={22} color="#F8FAFC" />
              </Pressable>
            </View>
            <Text style={styles.scannerHeaderTitle}>{t('welcome.scannerTitle')}</Text>
            <View style={[styles.scannerHeaderSide, { alignItems: 'flex-end' }]}>
              <Pressable
                style={styles.scannerHeaderBtn}
                onPress={() => setScannerTorchOn((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel="Torch"
              >
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
              facing="back"
              enableTorch={scannerTorchOn}
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'code128', 'code39', 'code93', 'upc_a', 'upc_e', 'qr'] }}
              onBarcodeScanned={handleBarcodeScanned}
            />
            <View style={styles.scannerDimOverlay} pointerEvents="none" />
            <View style={styles.scannerFrameWrap} pointerEvents="none">
              <View
                style={[styles.scannerFrameSquare, { width: scanSquareSide }]}
                onLayout={(event) => {
                  setScanFrameHeight(event.nativeEvent.layout.height);
                }}
              >
                <Animated.View
                  pointerEvents="none"
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

      <Modal visible={stockModalOpen} animationType="fade" transparent statusBarTranslucent onRequestClose={closeStockModal}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.stockModalCard,
              {
                backgroundColor: isDark ? 'rgba(10,16,28,0.97)' : 'rgba(250,252,255,0.98)',
                borderColor: isDark ? 'rgba(56,189,248,0.34)' : 'rgba(3,105,161,0.22)',
              },
            ]}
          >
            <Text style={[styles.stockModalTitle, { color: theme.colors.text }]}>{t('welcome.stockDetailTitle')}</Text>
            {stockModalLoading ? (
              <View style={styles.stockModalLoading}>
                <ActivityIndicator size='small' color={theme.colors.primary} />
              </View>
            ) : (
              <View style={styles.stockModalContent}>
                <View style={styles.stockRow}>
                  <Text style={[styles.stockLabel, { color: theme.colors.textMuted }]}>{t('welcome.stockDescription')}</Text>
                  <Text style={[styles.stockValue, { color: theme.colors.text }]}>
                    {(stockModalData?.stockName || stockModalBase?.stockName || '-').trim() || '-'}
                  </Text>
                </View>
                <View style={styles.stockRow}>
                  <Text style={[styles.stockLabel, { color: theme.colors.textMuted }]}>Stock Code</Text>
                  <Text style={[styles.stockValue, { color: theme.colors.text }]}>
                    {(stockModalData?.erpStockCode || stockModalBase?.erpStockCode || '-').trim() || '-'}
                  </Text>
                </View>
                <View style={styles.stockRow}>
                  <Text style={[styles.stockLabel, { color: theme.colors.textMuted }]}>Stock ID</Text>
                  <Text style={[styles.stockValue, { color: theme.colors.text }]}>{String(stockModalBase?.id ?? stockModalData?.stockId ?? '-')}</Text>
                </View>
              </View>
            )}
            <Pressable
              style={[
                styles.cancelButton,
                {
                  backgroundColor: isDark ? 'rgba(2,6,23,0.84)' : 'rgba(239,246,255,0.88)',
                  borderColor: isDark ? 'rgba(56,189,248,0.3)' : 'rgba(3,105,161,0.22)',
                },
              ]}
              onPress={closeStockModal}
            >
              <Text style={[styles.cancelLabel, { color: isDark ? '#E0F2FE' : '#1E3A8A' }]}>{t('settings.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  wedgeInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  section: { gap: 10 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    color: COLORS.textMuted,
  },
  allLink: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  stockModalCard: {
    width: '100%',
    maxWidth: 430,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 12,
  },
  stockModalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  stockModalLoading: {
    height: 84,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockModalContent: {
    gap: 10,
  },
  stockRow: {
    gap: 3,
  },
  stockLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '700',
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
  cancelButton: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: 17,
    fontWeight: '700',
  },
});
