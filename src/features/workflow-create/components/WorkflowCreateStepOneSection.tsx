import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FormField, FormPickerField } from '@/components/ui/FormField';
import { styles as grStyles } from '@/features/goods-receipt-create/components/styles';
import { ReceiptDateField } from '@/features/goods-receipt-create/components/ReceiptDateField';
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

function Infield({ children, theme }: { children: React.ReactNode; theme: { colors: { border: string; card: string } } }): React.ReactElement {
  return (
    <View
      style={[
        grStyles.infieldCard,
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

export function WorkflowCreateStepOneSection(props: Props): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const sectionStyle = [grStyles.infieldSection, { borderTopColor: theme.colors.border }];

  return (
    <Infield theme={theme}>
      <ReceiptDateField
        label={t('workflowCreate.fields.transferDate')}
        required
        value={props.form.transferDate}
        onChange={(v) => props.onChange('transferDate', v)}
        error={props.stepOneErrors.transferDate}
      />
      <View style={sectionStyle}>
        <FormField
          compact
          label={t('workflowCreate.fields.documentNo')}
          required
          value={props.form.documentNo}
          onChangeText={(value) => props.onChange('documentNo', value)}
          placeholder={t('workflowCreate.placeholders.documentNo')}
          error={props.stepOneErrors.documentNo}
        />
      </View>

      {(props.mode === 'order' || props.moduleKey === 'warehouse-outbound') && props.meta.requiresCustomer ? (
        <View style={sectionStyle}>
          <FormPickerField
            compact
            label={t('workflowCreate.fields.customer')}
            required
            value={
              props.selectedCustomer
                ? `${props.selectedCustomer.cariIsim} (${props.selectedCustomer.cariKod})`
                : t('workflowCreate.placeholders.customer')
            }
            onPress={props.onOpenCustomer}
            error={props.stepOneErrors.customerId}
          />
        </View>
      ) : null}

      <View style={sectionStyle}>
        <FormPickerField
          compact
          label={t('workflowCreate.fields.project')}
          value={
            props.selectedProject
              ? `${props.selectedProject.projeAciklama} (${props.selectedProject.projeKod})`
              : t('workflowCreate.placeholders.project')
          }
          onPress={props.onOpenProject}
        />
      </View>

      {props.meta.requiresOperationType ? (
        <View style={sectionStyle}>
          <FormField
            compact
            label={t('workflowCreate.fields.operationType')}
            required
            value={props.form.operationType}
            onChangeText={(value) => props.onChange('operationType', value)}
            placeholder={t('workflowCreate.placeholders.operationType')}
            error={props.stepOneErrors.operationType}
          />
        </View>
      ) : null}

      {props.meta.requiresSourceWarehouse || props.mode === 'free' ? (
        <View style={sectionStyle}>
          <FormPickerField
            compact
            label={t('workflowCreate.fields.sourceWarehouse')}
            required
            value={
              props.selectedSourceWarehouse
                ? `${props.selectedSourceWarehouse.depoIsmi} (${String(props.selectedSourceWarehouse.depoKodu)})`
                : t('workflowCreate.placeholders.sourceWarehouse')
            }
            onPress={props.onOpenSourceWarehouse}
            error={props.stepOneErrors.sourceWarehouse}
          />
        </View>
      ) : null}

      {props.meta.requiresTargetWarehouse ? (
        <View style={sectionStyle}>
          <FormPickerField
            compact
            label={t('workflowCreate.fields.targetWarehouse')}
            required
            value={
              props.selectedTargetWarehouse
                ? `${props.selectedTargetWarehouse.depoIsmi} (${String(props.selectedTargetWarehouse.depoKodu)})`
                : t('workflowCreate.placeholders.targetWarehouse')
            }
            onPress={props.onOpenTargetWarehouse}
            error={props.stepOneErrors.targetWarehouse}
          />
        </View>
      ) : null}

      <View style={sectionStyle}>
        <FormPickerField
          compact
          label={t('workflowCreate.fields.users')}
          value={
            props.form.userIds.length > 0
              ? t('workflowCreate.selectedUsers', { count: props.form.userIds.length })
              : t('workflowCreate.placeholders.users')
          }
          onPress={props.onOpenUsers}
        />
      </View>

      <View style={sectionStyle}>
        <FormField
          compact
          label={t('workflowCreate.fields.notes')}
          value={props.form.notes}
          onChangeText={(value) => props.onChange('notes', value)}
          placeholder={t('workflowCreate.placeholders.notes')}
          multiline
          style={grStyles.textarea as never}
        />
      </View>
    </Infield>
  );
}
