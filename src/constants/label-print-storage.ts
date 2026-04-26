/** AsyncStorage keys for label print UX defaults */
export const LABEL_PRINT_PREFS_KEY = 'wms_mobile_label_print_prefs';

export type LabelPrintStoredPrefs = {
  printerDefinitionId?: number;
  barcodeTemplateId?: number;
  printerProfileId?: number | null;
};
