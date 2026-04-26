import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar01Icon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { RADII, SPACING } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';

function isoToDisplay(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return '';
  }
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) {
    return '';
  }
  return `${d.padStart(2, '0')}.${m.padStart(2, '0')}.${y}`;
}

function parseDateInput(text: string): string | null {
  const t = text.trim();
  const dot = t.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (dot) {
    const d = dot[1]!.padStart(2, '0');
    const m = dot[2]!.padStart(2, '0');
    const y = dot[3]!;
    const test = new Date(`${y}-${m}-${d}T12:00:00`);
    if (Number.isNaN(test.getTime())) {
      return null;
    }
    return `${y}-${m}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const test = new Date(`${t}T12:00:00`);
    return Number.isNaN(test.getTime()) ? null : t;
  }
  return null;
}

export function ReceiptDateField({
  label,
  value,
  onChange,
  error,
  required = false,
  compact = true,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  required?: boolean;
  compact?: boolean;
}): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [text, setText] = useState(() => isoToDisplay(value));
  const [iosOpen, setIosOpen] = useState(false);
  const [androidOpen, setAndroidOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(() => {
    const p = parseDateInput(value) || new Date().toISOString().split('T')[0] || '';
    return new Date(p ? `${p}T12:00:00` : Date.now());
  });

  useEffect(() => {
    setText(isoToDisplay(value));
    const p = parseDateInput(value) || new Date().toISOString().split('T')[0] || '';
    if (p) {
      setPickerDate(new Date(`${p}T12:00:00`));
    }
  }, [value]);

  const applyIso = useCallback(
    (iso: string) => {
      onChange(iso);
      setText(isoToDisplay(iso));
    },
    [onChange],
  );

  const onTextBlur = useCallback((): void => {
    if (!text.trim()) {
      onChange('');
      return;
    }
    const next = parseDateInput(text);
    if (next) {
      applyIso(next);
    } else {
      setText(isoToDisplay(value));
    }
  }, [text, value, onChange, applyIso]);

  const applyDate = useCallback(
    (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      applyIso(`${y}-${m}-${d}`);
    },
    [applyIso],
  );

  const onAndroidPicker = (event: DateTimePickerEvent, date?: Date): void => {
    if (event.type === 'dismissed' || !date) {
      setAndroidOpen(false);
      return;
    }
    setPickerDate(date);
    applyDate(date);
    setAndroidOpen(false);
  };

  const onIosChange = (_event: DateTimePickerEvent, date?: Date): void => {
    if (date) {
      setPickerDate(date);
    }
  };

  const hasErr = Boolean(error);
  const rowH = compact ? 40 : 48;
  const ico = compact ? 17 : 20;
  const iconBox = compact ? 32 : 40;
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={[styles.label, compact && styles.labelSmall, { color: theme.colors.textSecondary }]}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <View
        style={[
          styles.shell,
          compact && styles.shellCompact,
          {
            minHeight: rowH,
            backgroundColor: theme.colors.surfaceStrong,
            borderColor: hasErr ? theme.colors.danger : 'rgba(128, 176, 255, 0.24)',
            borderWidth: hasErr ? 1.5 : 1,
          },
        ]}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          onBlur={onTextBlur}
          placeholder={t('goodsReceiptMobile.datePlaceholderDisplay')}
          placeholderTextColor={theme.colors.inputPlaceholder}
          keyboardType="numbers-and-punctuation"
          style={[styles.input, { minHeight: rowH, color: theme.colors.text }, compact && styles.inputSmall]}
        />
        <Pressable
          hitSlop={8}
          onPress={() => {
            const base = parseDateInput(value) || new Date().toISOString().split('T')[0] || '2000-01-01';
            setPickerDate(new Date(`${base}T12:00:00`));
            if (Platform.OS === 'ios') {
              setIosOpen(true);
            } else {
              setAndroidOpen(true);
            }
          }}
          accessibilityLabel={t('goodsReceiptMobile.openDatePicker')}
        >
          <View
            style={[
              styles.iconBtn,
              { width: iconBox, height: iconBox, borderColor: theme.colors.border, backgroundColor: theme.colors.card },
            ]}
          >
            <Calendar01Icon size={ico} color={theme.colors.primaryStrong} />
          </View>
        </Pressable>
      </View>
      {error ? (
        <Text style={[styles.error, compact && styles.errorSmall, { color: theme.colors.danger }]}>{error}</Text>
      ) : null}
      {Platform.OS === 'ios' ? (
        <Modal visible={iosOpen} animationType="slide" transparent>
          <View style={styles.modalRoot}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setIosOpen(false)} />
            <View style={[styles.modalCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display="spinner"
              themeVariant={theme.mode === 'dark' ? 'dark' : 'light'}
              onChange={onIosChange}
            />
            <Pressable
              style={[styles.doneBtn, { backgroundColor: theme.colors.primaryStrong }]}
              onPress={() => {
                applyDate(pickerDate);
                setIosOpen(false);
              }}
            >
              <Text style={styles.doneText}>{t('common.continue')}</Text>
            </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
      {Platform.OS === 'android' && androidOpen ? (
        <DateTimePicker value={pickerDate} mode="date" display="default" onChange={onAndroidPicker} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACING.xs - 2 },
  wrapCompact: { gap: 4 },
  label: { fontWeight: '800' },
  labelSmall: { fontSize: 11, fontWeight: '700' },
  shell: {
    minHeight: 48,
    borderRadius: RADII.md,
    paddingLeft: SPACING.md,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  shellCompact: {
    borderRadius: RADII.sm,
    paddingLeft: SPACING.sm + 2,
    paddingRight: 4,
  },
  input: { flex: 1, minHeight: 48, fontWeight: '600' },
  inputSmall: { fontSize: 14, fontWeight: '600' },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { fontSize: 12, fontWeight: '700' },
  errorSmall: { fontSize: 11, marginTop: 0 },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(5, 10, 22, 0.5)',
  },
  modalCard: {
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 20,
    borderWidth: 1,
    padding: 8,
  },
  doneBtn: { margin: 8, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  doneText: { color: '#fff', fontWeight: '800' },
});
