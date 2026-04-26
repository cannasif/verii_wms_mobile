import { LABEL_PRINT_PREFS_KEY, type LabelPrintStoredPrefs } from '@/constants/label-print-storage';
import { storage } from '@/lib/storage';

export async function loadLabelPrintPrefs(): Promise<LabelPrintStoredPrefs | null> {
  return storage.get<LabelPrintStoredPrefs>(LABEL_PRINT_PREFS_KEY);
}

export async function saveLabelPrintPrefs(prefs: LabelPrintStoredPrefs): Promise<void> {
  await storage.set(LABEL_PRINT_PREFS_KEY, prefs);
}
