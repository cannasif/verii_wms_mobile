import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FormField } from '@/components/ui/FormField';
import { FormSection } from '@/components/ui/FormSection';
import { SelectorField } from '@/components/ui/SelectorField';
import { Text } from '@/components/ui/Text';
import { SPACING } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type {
  CustomerOption,
  ProjectOption,
  WarehouseOption,
  WorkflowCreateFormValues,
  WorkflowCreateModuleMeta,
} from '../types';

interface StepOneErrors {
  transferDate?: string;
  documentNo?: string;
  customerId?: string;
  sourceWarehouse?: string;
  targetWarehouse?: string;
  operationType?: string;
}

interface Props {
  form: WorkflowCreateFormValues;
  meta: WorkflowCreateModuleMeta;
  mode: 'order' | 'free';
  moduleKey: string;
  stepOneErrors: StepOneErrors;
  selectedCustomer?: CustomerOption;
  selectedProject?: ProjectOption;
  selectedSourceWarehouse?: WarehouseOption;
  selectedTargetWarehouse?: WarehouseOption;
  onChange: <K extends keyof WorkflowCreateFormValues>(key: K, value: WorkflowCreateFormValues[K]) => void;
  onOpenCustomer: () => void;
  onOpenProject: () => void;
  onOpenSourceWarehouse: () => void;
  onOpenTargetWarehouse: () => void;
  onOpenUsers: () => void;
}

export function WorkflowCreateStepOneSection(props: Props): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <FormSection>
      <FormField
        label={t('workflowCreate.fields.transferDate')}
        required
        value={props.form.transferDate}
        onChangeText={(value) => props.onChange('transferDate', value)}
        placeholder='YYYY-MM-DD'
        error={props.stepOneErrors.transferDate}
      />

      <FormField
        label={t('workflowCreate.fields.documentNo')}
        required
        value={props.form.documentNo}
        onChangeText={(value) => props.onChange('documentNo', value)}
        placeholder={t('workflowCreate.placeholders.documentNo')}
        error={props.stepOneErrors.documentNo}
      />

      {(props.mode === 'order' || props.moduleKey === 'warehouse-outbound') && props.meta.requiresCustomer ? (
        <LabeledSelector
          label={t('workflowCreate.fields.customer')}
          required
          value={props.selectedCustomer ? `${props.selectedCustomer.cariIsim} (${props.selectedCustomer.cariKod})` : t('workflowCreate.placeholders.customer')}
          onPress={props.onOpenCustomer}
          error={props.stepOneErrors.customerId}
          themeTextColor={theme.colors.textSecondary}
          themeDangerColor={theme.colors.danger}
        />
      ) : null}

      <LabeledSelector
        label={t('workflowCreate.fields.project')}
        value={props.selectedProject ? `${props.selectedProject.projeAciklama} (${props.selectedProject.projeKod})` : t('workflowCreate.placeholders.project')}
        onPress={props.onOpenProject}
        themeTextColor={theme.colors.textSecondary}
        themeDangerColor={theme.colors.danger}
      />

      {props.meta.requiresOperationType ? (
        <FormField
          label={t('workflowCreate.fields.operationType')}
          required
          value={props.form.operationType}
          onChangeText={(value) => props.onChange('operationType', value)}
          placeholder={t('workflowCreate.placeholders.operationType')}
          error={props.stepOneErrors.operationType}
        />
      ) : null}

      {(props.meta.requiresSourceWarehouse || props.mode === 'free') ? (
        <LabeledSelector
          label={t('workflowCreate.fields.sourceWarehouse')}
          required
          value={props.selectedSourceWarehouse ? `${props.selectedSourceWarehouse.depoIsmi} (${String(props.selectedSourceWarehouse.depoKodu)})` : t('workflowCreate.placeholders.sourceWarehouse')}
          onPress={props.onOpenSourceWarehouse}
          error={props.stepOneErrors.sourceWarehouse}
          themeTextColor={theme.colors.textSecondary}
          themeDangerColor={theme.colors.danger}
        />
      ) : null}

      {props.meta.requiresTargetWarehouse ? (
        <LabeledSelector
          label={t('workflowCreate.fields.targetWarehouse')}
          required
          value={props.selectedTargetWarehouse ? `${props.selectedTargetWarehouse.depoIsmi} (${String(props.selectedTargetWarehouse.depoKodu)})` : t('workflowCreate.placeholders.targetWarehouse')}
          onPress={props.onOpenTargetWarehouse}
          error={props.stepOneErrors.targetWarehouse}
          themeTextColor={theme.colors.textSecondary}
          themeDangerColor={theme.colors.danger}
        />
      ) : null}

      <LabeledSelector
        label={t('workflowCreate.fields.users')}
        value={props.form.userIds.length > 0 ? t('workflowCreate.selectedUsers', { count: props.form.userIds.length }) : t('workflowCreate.placeholders.users')}
        onPress={props.onOpenUsers}
        themeTextColor={theme.colors.textSecondary}
        themeDangerColor={theme.colors.danger}
      />

      <FormField
        label={t('workflowCreate.fields.notes')}
        value={props.form.notes}
        onChangeText={(value) => props.onChange('notes', value)}
        placeholder={t('workflowCreate.placeholders.notes')}
        multiline
        style={styles.textarea}
      />
    </FormSection>
  );
}

function LabeledSelector({
  label,
  value,
  onPress,
  error,
  required = false,
  themeTextColor,
  themeDangerColor,
}: {
  label: string;
  value: string;
  onPress: () => void;
  error?: string;
  required?: boolean;
  themeTextColor: string;
  themeDangerColor: string;
}): React.ReactElement {
  return (
    <View style={styles.block}>
      <Text style={[styles.label, { color: themeTextColor }]}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <SelectorField value={value} onPress={onPress} />
      {error ? <Text style={[styles.error, { color: themeDangerColor }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: SPACING.xs - 2,
  },
  label: {
    fontWeight: '800',
  },
  error: {
    fontSize: 12,
    fontWeight: '700',
  },
  textarea: {
    minHeight: 92,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
});
