import React from 'react';
import { Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { SPACING } from '@/constants/theme';
import { FormField, FormPickerField } from '@/components/ui/FormField';
import { SectionCard } from '@/components/ui/SectionCard';
import { useTheme } from '@/providers/ThemeProvider';
import type { Customer, GoodsReceiptFormValues, Project } from '../types';
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

  return (
    <SectionCard>
      <FormField
        label={t('goodsReceiptMobile.receiptDate')}
        required
        value={form.receiptDate}
        onChangeText={(value) => onChange('receiptDate', value)}
        placeholder={t('goodsReceiptMobile.datePlaceholder')}
        error={stepOneErrors.receiptDate}
      />
      <FormField
        label={t('goodsReceiptMobile.documentNo')}
        required
        value={form.documentNo}
        onChangeText={(value) => onChange('documentNo', value)}
        placeholder={t('goodsReceiptMobile.documentNoPlaceholder')}
        keyboardType='number-pad'
        maxLength={form.isInvoice ? 16 : 15}
        error={stepOneErrors.documentNo}
      />
      <FormPickerField
        label={t('goodsReceiptMobile.customer')}
        required
        value={selectedCustomer ? `${selectedCustomer.cariIsim} (${selectedCustomer.cariKod})` : t('goodsReceiptMobile.customerPlaceholder')}
        onPress={onOpenCustomerSheet}
        error={stepOneErrors.customerId}
      />
      <FormPickerField
        label={t('goodsReceiptMobile.project')}
        value={selectedProject ? `${selectedProject.projeAciklama} (${selectedProject.projeKod})` : t('goodsReceiptMobile.projectPlaceholder')}
        onPress={onOpenProjectSheet}
      />

      <View style={styles.switchRow}>
        <View style={{ flex: 1, gap: SPACING.xxs }}>
          <Text style={styles.fieldLabel}>{t('goodsReceiptMobile.invoice')}</Text>
          <Text style={styles.helperText}>{t('goodsReceiptMobile.invoiceDescription')}</Text>
        </View>
        <Switch
          value={form.isInvoice}
          onValueChange={(value) => onChange('isInvoice', value)}
          trackColor={{ false: theme.colors.border, true: theme.colors.primaryStrong }}
          thumbColor='#fff'
        />
      </View>

      <FormField
        label={t('goodsReceiptMobile.notes')}
        value={form.notes}
        onChangeText={(value) => onChange('notes', value)}
        style={[styles.input, styles.textarea]}
        placeholder={t('goodsReceiptMobile.notesPlaceholder')}
        multiline
      />
    </SectionCard>
  );
}
