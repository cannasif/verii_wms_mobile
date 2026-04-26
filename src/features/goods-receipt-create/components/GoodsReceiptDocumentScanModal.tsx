import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Cancel01Icon, Camera01Icon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { showInfo, showWarning } from '@/lib/feedback';
import { useTheme } from '@/providers/ThemeProvider';
import { scanGoodsReceiptDocument, type GoodsReceiptScanDraft } from '../services/document-scan';

const A4_ASPECT_WIDTH_OVER_HEIGHT = 210 / 297;

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

interface GoodsReceiptDocumentScanModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyDraft: (draft: GoodsReceiptScanDraft) => void;
}

export function GoodsReceiptDocumentScanModal({
  visible,
  onClose,
  onApplyDraft,
}: GoodsReceiptDocumentScanModalProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const handleScanPress = useCallback(async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      const draft = await scanGoodsReceiptDocument('', {});
      const hasAny = Object.keys(draft).length > 0;
      if (hasAny) {
        onApplyDraft(draft);
        onClose();
        return;
      }
      showInfo(t('goodsReceiptMobile.documentScanNoData'));
    } finally {
      setBusy(false);
    }
  }, [busy, onApplyDraft, onClose, t]);

  const openPermission = useCallback(async () => {
    const result = permission?.granted ? permission : await requestPermission();
    if (!result?.granted) {
      showWarning(t('goodsReceiptMobile.documentScanPermission'));
    }
  }, [permission, requestPermission, t]);

  React.useEffect(() => {
    if (visible) {
      void openPermission();
    } else {
      setTorchOn(false);
    }
  }, [visible, openPermission]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: '#020617' }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.75 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
          >
            <Cancel01Icon size={24} color="#f8fafc" />
          </Pressable>
          <Text style={styles.headerTitle}>{t('goodsReceiptMobile.documentScanTitle')}</Text>
          <Pressable
            onPress={() => setTorchOn((v) => !v)}
            disabled={!permission?.granted}
            style={({ pressed }) => [
              styles.iconBtn,
              { opacity: !permission?.granted ? 0.35 : pressed ? 0.75 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('goodsReceiptMobile.documentScanTorch')}
          >
            <ScannerTorchGlyph active={torchOn} />
          </Pressable>
        </View>

        <View style={styles.cameraHost}>
          {permission?.granted ? (
            <CameraView style={StyleSheet.absoluteFillObject} facing="back" enableTorch={torchOn} />
          ) : (
            <View style={[styles.permissionBox, { borderColor: theme.colors.border }]}>
              <Camera01Icon size={40} color={theme.colors.textMuted} />
              <Text style={[styles.permissionText, { color: theme.colors.textSecondary }]}>
                {t('goodsReceiptMobile.documentScanPermission')}
              </Text>
              <Pressable
                onPress={() => void requestPermission()}
                style={({ pressed }) => [
                  styles.permissionBtn,
                  { borderColor: theme.colors.primaryStrong, opacity: pressed ? 0.88 : 1 },
                ]}
              >
                <Text style={[styles.permissionBtnText, { color: theme.colors.primaryStrong }]}>
                  {t('goodsReceiptMobile.documentScanGrantCamera')}
                </Text>
              </Pressable>
            </View>
          )}

          <View style={styles.dimOverlay} pointerEvents="none" />
          <View style={styles.frameWrap} pointerEvents="none">
            <View style={styles.frame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <Text style={styles.help}>{t('goodsReceiptMobile.documentScanHint')}</Text>
          <Pressable
            onPress={() => void handleScanPress()}
            disabled={busy || !permission?.granted}
            style={({ pressed }) => [
              styles.scanBtn,
              {
                opacity: pressed ? 0.9 : busy || !permission?.granted ? 0.5 : 1,
                borderColor: 'rgba(56, 189, 248, 0.55)',
                backgroundColor: 'rgba(14, 165, 233, 0.22)',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('goodsReceiptMobile.documentScanButton')}
          >
            {busy ? (
              <ActivityIndicator color="#f8fafc" />
            ) : (
              <>
                <Camera01Icon size={22} color="#f8fafc" />
                <Text style={styles.scanBtnText}>{t('goodsReceiptMobile.documentScanButton')}</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#f8fafc',
    fontWeight: '800',
    fontSize: 16,
  },
  cameraHost: {
    flex: 1,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 24,
    borderWidth: 1,
    borderRadius: 16,
    margin: 12,
  },
  permissionText: {
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 14,
  },
  permissionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  permissionBtnText: {
    fontWeight: '800',
    fontSize: 14,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.35)',
  },
  frameWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: '94%',
    aspectRatio: A4_ASPECT_WIDTH_OVER_HEIGHT,
    maxHeight: '86%',
  },
  corner: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderColor: 'rgba(56, 189, 248, 0.95)',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 8 },
  footer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  help: {
    color: 'rgba(248, 250, 252, 0.78)',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  scanBtnText: {
    color: '#f8fafc',
    fontWeight: '900',
    fontSize: 16,
  },
});
