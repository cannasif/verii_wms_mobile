import React from 'react';
import { Pressable, View } from 'react-native';
import { Building03Icon, File01Icon, Link01Icon, Tag01Icon, Tick02Icon } from 'hugeicons-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { SPACING } from '@/constants/theme';
import { FormField, FormPickerField } from '@/components/ui/FormField';
import { useTheme } from '@/providers/ThemeProvider';
import type { Customer, GoodsReceiptFormValues, Project } from '../types';
import { ReceiptDateField } from './ReceiptDateField';
import { styles } from './styles';

interface Step1BasicInfoProps {
  form: GoodsReceiptFormValues;
  stepOneErrors: {
    receiptDate?: string;
    documentNo?: string;
    customerId?: string;
  };
  selectedCustomer: Customer | null;
  selectedProject: Project | null;
  onChange: <K extends keyof GoodsReceiptFormValues>(key: K, value: GoodsReceiptFormValues[K]) => void;
  onOpenCustomerSheet: () => void;
  onOpenProjectSheet: () => void;
}

function Infield({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme: ReturnType<typeof useTheme>['theme'];
}): React.ReactElement {
  return (
    <View
      style={[
        styles.infieldCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {children}
    </View>
  );
}

function Lead({ children }: { children: React.ReactNode }): React.ReactElement {
  return <View style={{ minWidth: 24, alignItems: 'center', justifyContent: 'center' }}>{children}</View>;
}

export function Step1BasicInfo({
  form,
  stepOneErrors,
  selectedCustomer,
  selectedProject,
  onChange,
  onOpenCustomerSheet,
  onOpenProjectSheet,
}: Step1BasicInfoProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const iz = 17;
  const sectionStyle = [styles.infieldSection, { borderTopColor: theme.colors.border }];

  return (
    <Infield theme={theme}>
      <View style={styles.invoiceTypeBlock}>
        <View style={styles.invoiceHeaderRow}>
          <Lead>
            <Link01Icon size={iz} color={theme.colors.success} />
          </Lead>
          <View style={{ flex: 1, gap: SPACING.xxs }}>
            <Text style={styles.fieldLabel}>{t('goodsReceiptMobile.invoice')}</Text>
            <Text style={styles.helperText}>{t('goodsReceiptMobile.invoiceDescription')}</Text>
          </View>
        </View>
        <View style={styles.invoicePairRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: form.isInvoice }}
            onPress={() => onChange('isInvoice', true)}
            style={({ pressed }) => [
              styles.invoiceCheckPress,
              {
                borderColor: form.isInvoice ? theme.colors.primaryStrong : theme.colors.border,
                backgroundColor: form.isInvoice ? 'rgba(56, 189, 248, 0.1)' : theme.colors.backgroundSecondary,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.invoiceCheckBox,
                {
                  borderColor: form.isInvoice ? theme.colors.primaryStrong : theme.colors.border,
                  backgroundColor: form.isInvoice ? theme.colors.primaryStrong : 'transparent',
                },
              ]}
            >
              {form.isInvoice ? <Tick02Icon size={12} color="#fff" /> : null}
            </View>
            <Text
              style={[
                styles.fieldLabel,
                { fontSize: 12, flex: 1, color: form.isInvoice ? theme.colors.text : theme.colors.textSecondary },
              ]}
              numberOfLines={2}
            >
              {t('goodsReceiptMobile.invoiceOptionLinked')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: !form.isInvoice }}
            onPress={() => onChange('isInvoice', false)}
            style={({ pressed }) => [
              styles.invoiceCheckPress,
              {
                borderColor: !form.isInvoice ? theme.colors.primaryStrong : theme.colors.border,
                backgroundColor: !form.isInvoice ? 'rgba(56, 189, 248, 0.1)' : theme.colors.backgroundSecondary,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.invoiceCheckBox,
                {
                  borderColor: !form.isInvoice ? theme.colors.primaryStrong : theme.colors.border,
                  backgroundColor: !form.isInvoice ? theme.colors.primaryStrong : 'transparent',
                },
              ]}
            >
              {!form.isInvoice ? <Tick02Icon size={12} color="#fff" /> : null}
            </View>
            <Text
              style={[
                styles.fieldLabel,
                { fontSize: 12, flex: 1, color: !form.isInvoice ? theme.colors.text : theme.colors.textSecondary },
              ]}
              numberOfLines={2}
            >
              {t('goodsReceiptMobile.invoiceOptionStandard')}
            </Text>
          </Pressable>
        </View>
      </View>
      <View style={sectionStyle}>
        <ReceiptDateField
          label={t('goodsReceiptMobile.receiptDate')}
          required
          value={form.receiptDate}
          onChange={(v) => onChange('receiptDate', v)}
          error={stepOneErrors.receiptDate}
        />
      </View>
      <View style={sectionStyle}>
        <FormField
          compact
          label={t('goodsReceiptMobile.documentNo')}
          required
          value={form.documentNo}
          onChangeText={(value) => onChange('documentNo', value)}
          placeholder={t('goodsReceiptMobile.documentNoPlaceholder')}
          keyboardType="number-pad"
          maxLength={form.isInvoice ? 16 : 15}
          error={stepOneErrors.documentNo}
          leading={
            <Lead>
              <File01Icon size={iz} color={theme.colors.textMuted} />
            </Lead>
          }
        />
      </View>
      <View style={sectionStyle}>
        <FormPickerField
          compact
          label={t('goodsReceiptMobile.customer')}
          required
          value={selectedCustomer ? `${selectedCustomer.cariIsim} (${selectedCustomer.cariKod})` : t('goodsReceiptMobile.customerPlaceholder')}
          onPress={onOpenCustomerSheet}
          error={stepOneErrors.customerId}
          leading={
            <Lead>
              <Building03Icon size={iz} color={theme.colors.primaryStrong} />
            </Lead>
          }
        />
      </View>
      <View style={sectionStyle}>
        <FormPickerField
          compact
          label={t('goodsReceiptMobile.project')}
          value={selectedProject ? `${selectedProject.projeAciklama} (${selectedProject.projeKod})` : t('goodsReceiptMobile.projectPlaceholder')}
          onPress={onOpenProjectSheet}
          leading={
            <Lead>
              <Tag01Icon size={iz} color={theme.colors.textMuted} />
            </Lead>
          }
        />
      </View>
      <View style={sectionStyle}>
        <FormField
          compact
          label={t('goodsReceiptMobile.notes')}
          value={form.notes}
          onChangeText={(value) => onChange('notes', value)}
          style={styles.textarea as never}
          placeholder={t('goodsReceiptMobile.notesPlaceholder')}
          multiline
          leading={
            <Lead>
              <File01Icon size={iz} color={theme.colors.textSecondary} />
            </Lead>
          }
        />
      </View>
    </Infield>
  );
}
