import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Cancel01Icon, PackageIcon, Tick02Icon } from 'hugeicons-react-native';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { RADII, SPACING } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { normalizeError } from '@/lib/errors';
import { packageMobileApi } from '@/features/package-mobile/api';
import type { MobilePackageItem } from '@/features/package-mobile/types';
import { labelPrintApi } from '../api/label-print-api';
import type { PackageLabelPrintRequest, PrinterProfileDto } from '../types';
import { loadLabelPrintPrefs, saveLabelPrintPrefs } from '../storage/label-print-prefs';

function extractPreviewVisual(data: unknown): { uri?: string } {
  const asRecord = (v: unknown): Record<string, unknown> | null =>
    v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
  let cur: unknown = data;
  let o = asRecord(cur);
  const inner = o?.data;
  if (inner && typeof inner === 'object') {
    o = asRecord(inner);
  } else {
    o = asRecord(cur);
  }
  if (!o) return {};
  const png = o.pngBase64 ?? o.imageBase64 ?? o.base64Png ?? o.base64Image;
  if (typeof png === 'string' && png.trim()) {
    const mime = typeof o.mimeType === 'string' && o.mimeType.includes('/') ? o.mimeType : 'image/png';
    return { uri: `data:${mime};base64,${png}` };
  }
  const svg = o.svg ?? o.svgContent ?? o.content;
  if (typeof svg === 'string' && svg.trim().startsWith('<')) {
    return { uri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` };
  }
  return {};
}

function formatJsonPreview(data: unknown): string {
  if (data == null) return '';
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

function sortProfilesForZpl(a: PrinterProfileDto, b: PrinterProfileDto): number {
  const az = (a.outputType ?? '').toLowerCase() === 'zpl' ? 1 : 0;
  const bz = (b.outputType ?? '').toLowerCase() === 'zpl' ? 1 : 0;
  if (bz !== az) return bz - az;
  return (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0);
}

function parseIdList(raw: string): number[] {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export function LabelPrintSheet(props: {
  visible: boolean;
  onClose: () => void;
  stockId: number;
  stockCode?: string | null;
  stockName?: string | null;
}): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [packingHeaderScope, setPackingHeaderScope] = useState<number | null>(null);
  const [manualIdsText, setManualIdsText] = useState('');
  const [printerId, setPrinterId] = useState<number | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [copies, setCopies] = useState('1');
  const [printMode, setPrintMode] = useState<'single' | 'tree'>('single');
  const [includeChildren, setIncludeChildren] = useState(false);
  const [useGs1Sscc, setUseGs1Sscc] = useState(true);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [resolvePreviewText, setResolvePreviewText] = useState<string | null>(null);
  const [lastJobId, setLastJobId] = useState<number | null>(null);
  const [lastJobStatus, setLastJobStatus] = useState<string | null>(null);
  const [lastJobError, setLastJobError] = useState<string | null>(null);

  const packagesQuery = useQuery({
    queryKey: ['label-print', 'packages-by-stock', props.stockId],
    enabled: props.visible && Boolean(props.stockId),
    queryFn: ({ signal }) =>
      packageMobileApi.getPackagesPaged(
        {
          pageNumber: 1,
          pageSize: 80,
          filters: [{ column: 'StockId', operator: 'Equals', value: String(props.stockId) }],
          filterLogic: 'and',
        },
        { signal },
      ),
    retry: false,
  });

  const printersQuery = useQuery({
    queryKey: ['label-print', 'printers'],
    enabled: props.visible,
    queryFn: ({ signal }) => labelPrintApi.getPrinters({ signal }),
  });

  const templatesQuery = useQuery({
    queryKey: ['label-print', 'templates'],
    enabled: props.visible,
    queryFn: ({ signal }) => labelPrintApi.getTemplates({ signal }),
  });

  const profilesQuery = useQuery({
    queryKey: ['label-print', 'profiles', printerId],
    enabled: props.visible && printerId != null,
    queryFn: ({ signal }) => labelPrintApi.getProfiles(printerId as number, { signal }),
  });

  const templateLinksQuery = useQuery({
    queryKey: ['label-print', 'template-links', templateId],
    enabled: props.visible && templateId != null,
    queryFn: ({ signal }) => labelPrintApi.getTemplatePrinterProfiles(templateId as number, { signal }),
  });

  const jobQuery = useQuery({
    queryKey: ['label-print', 'job', lastJobId],
    enabled: props.visible && lastJobId != null,
    queryFn: ({ signal }) => labelPrintApi.getPrintJob(lastJobId as number, { signal }),
    refetchInterval: (q) => {
      const s = (q.state.data?.status ?? '').toLowerCase();
      if (!s || s === 'completed' || s === 'failed' || s === 'cancelled') return false;
      return 4000;
    },
  });

  const packages = packagesQuery.data?.data ?? [];

  const uniquePackingHeaders = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of packages) {
      if (!map.has(p.packingHeaderId)) {
        map.set(p.packingHeaderId, p.packageNo ?? `#${p.packingHeaderId}`);
      }
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [packages]);

  useEffect(() => {
    if (!props.visible) return;
    let cancelled = false;
    void (async () => {
      const prefs = await loadLabelPrintPrefs();
      if (cancelled || !prefs) return;
      if (prefs.printerDefinitionId) setPrinterId(prefs.printerDefinitionId);
      if (prefs.barcodeTemplateId) setTemplateId(prefs.barcodeTemplateId);
      if (prefs.printerProfileId !== undefined) setProfileId(prefs.printerProfileId);
    })();
    return () => {
      cancelled = true;
    };
  }, [props.visible]);

  useEffect(() => {
    if (!props.visible || !printerId || !templateId) return;
    const links = templateLinksQuery.data;
    if (!links?.length) return;
    const match = links.find((l) => l.printerDefinitionId === printerId && l.printerProfileId);
    if (match?.printerProfileId) {
      setProfileId((prev) => {
        if (prev) return prev;
        return match.printerProfileId;
      });
    }
  }, [props.visible, printerId, templateId, templateLinksQuery.data]);

  useEffect(() => {
    const j = jobQuery.data;
    if (!j) return;
    setLastJobStatus(j.status ?? null);
    setLastJobError(j.errorMessage ?? null);
  }, [jobQuery.data]);

  const sortedProfiles = useMemo(() => {
    const list = [...(profilesQuery.data ?? [])];
    list.sort(sortProfilesForZpl);
    return list;
  }, [profilesQuery.data]);

  const toggleSelect = useCallback((id: number) => {
    setPackingHeaderScope(null);
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const manualParsedIds = useMemo(() => parseIdList(manualIdsText), [manualIdsText]);

  const effectiveSelectedIds = useMemo(() => {
    const base = new Set<number>([...selectedIds, ...manualParsedIds]);
    return Array.from(base);
  }, [selectedIds, manualParsedIds]);

  const previewAnchorPackageId = useMemo(() => {
    if (effectiveSelectedIds.length >= 1) return effectiveSelectedIds[0];
    if (packingHeaderScope != null && packages.length >= 1) {
      const firstOfHeader = packages.find((p) => p.packingHeaderId === packingHeaderScope);
      return firstOfHeader?.id ?? null;
    }
    return null;
  }, [effectiveSelectedIds, packingHeaderScope, packages]);

  const canSubmit = useMemo(() => {
    if (!printerId || !templateId) return false;
    if (packingHeaderScope != null) return true;
    if (effectiveSelectedIds.length > 0) return true;
    return false;
  }, [printerId, templateId, packingHeaderScope, effectiveSelectedIds.length]);

  const buildPrintRequest = useCallback((): PackageLabelPrintRequest | null => {
    if (!printerId || !templateId) return null;
    const nCopies = Math.max(1, Math.floor(Number(copies)) || 1);
    const base = {
      printerDefinitionId: printerId,
      printerProfileId: profileId ?? null,
      barcodeTemplateId: templateId,
      copies: nCopies,
      useGs1SsccForPallets: useGs1Sscc,
    };

    if (packingHeaderScope != null) {
      return {
        ...base,
        packageIds: [],
        packageId: null,
        packingHeaderId: packingHeaderScope,
        printMode: 'single',
        includeChildren: true,
      };
    }

    if (effectiveSelectedIds.length > 1) {
      return {
        ...base,
        packageIds: effectiveSelectedIds,
        packageId: null,
        packingHeaderId: null,
        printMode: 'single',
        includeChildren: false,
      };
    }

    if (effectiveSelectedIds.length === 1) {
      return {
        ...base,
        packageIds: [],
        packageId: effectiveSelectedIds[0],
        packingHeaderId: null,
        printMode,
        includeChildren: printMode === 'tree' ? true : includeChildren,
      };
    }

    return null;
  }, [
    printerId,
    profileId,
    templateId,
    copies,
    useGs1Sscc,
    packingHeaderScope,
    effectiveSelectedIds,
    printMode,
    includeChildren,
  ]);

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!templateId || !previewAnchorPackageId) {
        throw new Error(t('labelPrint.previewMissing'));
      }
      const modeForPreview = printMode === 'tree' || includeChildren ? 'package-tree' : 'single';
      const [previewData, resolveData] = await Promise.all([
        labelPrintApi.preview({
          templateId,
          sourceModule: 'package',
          sourceLineId: previewAnchorPackageId,
          printMode: modeForPreview,
        }),
        labelPrintApi.resolvePrintSource({
          sourceModule: 'package',
          sourceLineId: previewAnchorPackageId,
          printMode: modeForPreview,
        }),
      ]);
      return { previewData, resolveData };
    },
    onSuccess: ({ previewData, resolveData }) => {
      const vis = extractPreviewVisual(previewData);
      setPreviewUri(vis.uri ?? null);
      setResolvePreviewText(formatJsonPreview(resolveData));
    },
  });

  const printMutation = useMutation({
    mutationFn: async () => {
      const body = buildPrintRequest();
      if (!body) throw new Error(t('labelPrint.scopeMissing'));
      return labelPrintApi.printLabels(body);
    },
    onSuccess: async (result) => {
      await saveLabelPrintPrefs({
        printerDefinitionId: printerId ?? undefined,
        barcodeTemplateId: templateId ?? undefined,
        printerProfileId: profileId,
      });
      const jid = result.printJobId ?? null;
      setLastJobId(typeof jid === 'number' && jid > 0 ? jid : null);
      setLastJobStatus('Queued');
      setLastJobError(null);
      void queryClient.invalidateQueries({ queryKey: ['label-print', 'job'] });
    },
  });

  const printers = printersQuery.data ?? [];
  const templates = templatesQuery.data ?? [];

  const card = {
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceStrong,
    padding: SPACING.md,
    gap: SPACING.sm,
  };

  return (
    <Modal visible={props.visible} animationType='slide' presentationStyle='pageSheet' onRequestClose={props.onClose}>
      <View style={[styles.modalRoot, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{t('labelPrint.title')}</Text>
            <Text style={[styles.headerSub, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {props.stockName || props.stockCode || `ID ${props.stockId}`}
            </Text>
          </View>
          <Pressable onPress={props.onClose} hitSlop={12} style={styles.closeBtn}>
            <Cancel01Icon size={26} color={theme.colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          <View style={card}>
            <View style={styles.rowTitle}>
              <PackageIcon size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>{t('labelPrint.sectionPackages')}</Text>
            </View>
            {packagesQuery.isLoading ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : packagesQuery.isError ? (
              <Text style={{ color: theme.colors.danger, lineHeight: 20 }}>
                {normalizeError(packagesQuery.error, t('labelPrint.packagesLoadFailed')).message}
              </Text>
            ) : packages.length === 0 ? (
              <Text style={{ color: theme.colors.textSecondary, lineHeight: 20 }}>{t('labelPrint.packagesEmpty')}</Text>
            ) : (
              packages.map((row: MobilePackageItem) => {
                const checked = selectedIds.includes(row.id);
                return (
                  <Pressable
                    key={row.id}
                    onPress={() => toggleSelect(row.id)}
                    style={[
                      styles.pkgRow,
                      { borderColor: theme.colors.border, backgroundColor: checked ? `${theme.colors.primary}18` : theme.colors.card },
                    ]}
                  >
                    <View style={[styles.check, { borderColor: theme.colors.primary }]}>
                      {checked ? <Tick02Icon size={16} color={theme.colors.primary} /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pkgNo}>{row.packageNo}</Text>
                      <Text style={[styles.pkgMeta, { color: theme.colors.textSecondary }]}>
                        {row.packageType} · {row.barcode || '—'}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}

            {uniquePackingHeaders.length > 0 ? (
              <View style={{ gap: SPACING.xs }}>
                <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{t('labelPrint.headerScope')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {uniquePackingHeaders.map((h) => {
                    const active = packingHeaderScope === h.id;
                    return (
                      <Pressable
                        key={h.id}
                        onPress={() => {
                          setPackingHeaderScope(active ? null : h.id);
                          if (!active) setSelectedIds([]);
                        }}
                        style={[
                          styles.chip,
                          {
                            borderColor: active ? theme.colors.primary : theme.colors.border,
                            backgroundColor: active ? `${theme.colors.primary}22` : theme.colors.card,
                          },
                        ]}
                      >
                        <Text style={[styles.chipText, { color: theme.colors.text }]} numberOfLines={1}>
                          #{h.id}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Text style={[styles.hint, { color: theme.colors.textMuted }]}>{t('labelPrint.headerScopeHint')}</Text>
              </View>
            ) : null}

            <View style={{ gap: 6 }}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{t('labelPrint.manualIds')}</Text>
              <TextInput
                value={manualIdsText}
                onChangeText={setManualIdsText}
                placeholder={t('labelPrint.manualIdsPh')}
                placeholderTextColor={theme.colors.inputPlaceholder}
                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.card }]}
                autoCapitalize='none'
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={card}>
            <View style={styles.rowTitle}>
              <PackageIcon size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>{t('labelPrint.sectionPrinter')}</Text>
            </View>
            {printersQuery.isLoading ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              printers.map((p) => {
                const active = printerId === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => {
                      setPrinterId(p.id);
                      setProfileId(null);
                    }}
                    style={[
                      styles.optionRow,
                      {
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                        backgroundColor: active ? `${theme.colors.primary}14` : theme.colors.card,
                      },
                    ]}
                  >
                    <Text style={styles.optionTitle}>{p.name || p.code || `#${p.id}`}</Text>
                    <Text style={[styles.optionSub, { color: theme.colors.textSecondary }]}>{p.code || ''}</Text>
                  </Pressable>
                );
              })
            )}

            <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{t('labelPrint.profile')}</Text>
            {profilesQuery.isFetching ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : sortedProfiles.length === 0 ? (
              <Text style={{ color: theme.colors.textSecondary }}>{t('labelPrint.profileEmpty')}</Text>
            ) : (
              sortedProfiles.map((p) => {
                const active = profileId === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setProfileId(p.id)}
                    style={[
                      styles.optionRow,
                      {
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                        backgroundColor: active ? `${theme.colors.primary}14` : theme.colors.card,
                      },
                    ]}
                  >
                    <Text style={styles.optionTitle}>{p.name || `#${p.id}`}</Text>
                    <Text style={[styles.optionSub, { color: theme.colors.textSecondary }]}>
                      {p.outputType || '—'}
                      {p.isDefault ? ` · ${t('labelPrint.default')}` : ''}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>

          <View style={card}>
            <Text style={styles.sectionTitle}>{t('labelPrint.sectionTemplate')}</Text>
            {templatesQuery.isLoading ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              templates.map((tpl) => {
                const active = templateId === tpl.id;
                return (
                  <Pressable
                    key={tpl.id}
                    onPress={() => setTemplateId(tpl.id)}
                    style={[
                      styles.optionRow,
                      {
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                        backgroundColor: active ? `${theme.colors.primary}14` : theme.colors.card,
                      },
                    ]}
                  >
                    <Text style={styles.optionTitle}>{tpl.name || tpl.code || `#${tpl.id}`}</Text>
                    <Text style={[styles.optionSub, { color: theme.colors.textSecondary }]}>
                      v{t('labelPrint.published')}: {tpl.publishedVersionId}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>

          <View style={card}>
            <Text style={styles.sectionTitle}>{t('labelPrint.sectionOptions')}</Text>
            <View style={styles.rowBetween}>
              <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{t('labelPrint.copies')}</Text>
              <TextInput
                value={copies}
                onChangeText={setCopies}
                keyboardType='number-pad'
                style={[styles.copiesInput, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.card }]}
              />
            </View>

            <View style={styles.rowBetween}>
              <Text style={{ color: theme.colors.text, fontWeight: '700', flex: 1 }}>{t('labelPrint.printMode')}</Text>
              <View style={styles.segment}>
                <Pressable
                  onPress={() => setPrintMode('single')}
                  style={[
                    styles.segBtn,
                    printMode === 'single' ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.card },
                  ]}
                >
                  <Text style={[styles.segText, { color: printMode === 'single' ? '#fff' : theme.colors.text }]}>single</Text>
                </Pressable>
                <Pressable
                  onPress={() => setPrintMode('tree')}
                  style={[
                    styles.segBtn,
                    printMode === 'tree' ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.card },
                  ]}
                >
                  <Text style={[styles.segText, { color: printMode === 'tree' ? '#fff' : theme.colors.text }]}>tree</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.rowBetween}>
              <Text style={{ color: theme.colors.text, fontWeight: '700', flex: 1 }}>{t('labelPrint.includeChildren')}</Text>
              <Switch value={includeChildren} onValueChange={setIncludeChildren} />
            </View>

            <View style={styles.rowBetween}>
              <Text style={{ color: theme.colors.text, fontWeight: '700', flex: 1 }}>{t('labelPrint.gs1Sscc')}</Text>
              <Switch value={useGs1Sscc} onValueChange={setUseGs1Sscc} />
            </View>
          </View>

          <View style={card}>
            <Text style={styles.sectionTitle}>{t('labelPrint.sectionPreview')}</Text>
            <Button
              title={previewMutation.isPending ? t('common.loading') : t('labelPrint.runPreview')}
              onPress={() => previewMutation.mutate()}
              disabled={!templateId || !previewAnchorPackageId || previewMutation.isPending}
              tone='secondary'
            />
            {previewMutation.isError ? (
              <Text style={{ color: theme.colors.danger }}>
                {normalizeError(previewMutation.error, t('labelPrint.previewFailed')).message}
              </Text>
            ) : null}
            {previewUri ? (
              <View style={[styles.previewBox, { borderColor: theme.colors.border }]}>
                <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode='contain' />
              </View>
            ) : null}
            {resolvePreviewText ? (
              <ScrollView style={styles.jsonScroll} nestedScrollEnabled>
                <Text selectable style={[styles.jsonText, { color: theme.colors.textSecondary }]}>
                  {resolvePreviewText}
                </Text>
              </ScrollView>
            ) : null}
          </View>

          <View style={card}>
            <Button
              title={printMutation.isPending ? t('labelPrint.submitting') : t('labelPrint.submit')}
              onPress={() => printMutation.mutate()}
              disabled={!canSubmit || printMutation.isPending}
            />
            {printMutation.isError ? (
              <Text style={{ color: theme.colors.danger }}>
                {normalizeError(printMutation.error, t('labelPrint.printFailed')).message}
              </Text>
            ) : null}
            {printMutation.isSuccess ? (
              <View style={{ gap: 6 }}>
                <Text style={{ color: theme.colors.success, fontWeight: '800' }}>{t('labelPrint.queued')}</Text>
                <Text style={{ color: theme.colors.textSecondary }}>
                  {t('labelPrint.printedCount', { count: printMutation.data.printedPackageCount })}
                </Text>
                {printMutation.data.printJobId ? (
                  <Text style={{ color: theme.colors.textSecondary }}>job #{printMutation.data.printJobId}</Text>
                ) : null}
              </View>
            ) : null}
            {lastJobId ? (
              <View style={{ marginTop: SPACING.sm, gap: 4 }}>
                <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{t('labelPrint.jobStatus')}</Text>
                <Text style={{ color: theme.colors.text, fontWeight: '800' }}>{lastJobStatus || '—'}</Text>
                {lastJobError ? <Text style={{ color: theme.colors.danger }}>{lastJobError}</Text> : null}
              </View>
            ) : null}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    gap: SPACING.sm,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  headerSub: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  closeBtn: { padding: 4 },
  scrollContent: { padding: SPACING.md, gap: SPACING.md },
  sectionTitle: { fontSize: 16, fontWeight: '900' },
  rowTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pkgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: RADII.lg,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: SPACING.sm,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pkgNo: { fontWeight: '800', fontSize: 15 },
  pkgMeta: { fontSize: 12, marginTop: 2 },
  chipRow: { flexDirection: 'row', gap: SPACING.xs, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADII.lg,
    borderWidth: 1,
    maxWidth: 160,
  },
  chipText: { fontWeight: '800', fontSize: 12 },
  hint: { fontSize: 11, lineHeight: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: RADII.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  optionRow: {
    borderWidth: 1,
    borderRadius: RADII.lg,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  optionTitle: { fontWeight: '800', fontSize: 15 },
  optionSub: { fontSize: 12, marginTop: 2 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md },
  copiesInput: {
    width: 72,
    borderWidth: 1,
    borderRadius: RADII.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlign: 'center',
    fontWeight: '800',
  },
  segment: { flexDirection: 'row', gap: 8 },
  segBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADII.md },
  segText: { fontWeight: '800', fontSize: 12 },
  previewBox: {
    borderWidth: 1,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    minHeight: 180,
    backgroundColor: '#fff',
  },
  previewImage: { width: '100%', height: 220 },
  jsonScroll: { maxHeight: 160 },
  jsonText: { fontSize: 11, fontFamily: 'monospace' },
});
