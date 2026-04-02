import { Alert, type AlertButton } from 'react-native';
import i18n from '@/locales';
import { normalizeError } from '@/lib/errors';

export function showInfo(message: string, buttons?: AlertButton[]): void {
  Alert.alert(i18n.t('common.info'), message, buttons);
}

export function showSuccess(message: string, buttons?: AlertButton[]): void {
  Alert.alert(i18n.t('common.success'), message, buttons);
}

export function showWarning(message: string, buttons?: AlertButton[]): void {
  Alert.alert(i18n.t('common.warning'), message, buttons);
}

export function showError(error: unknown, fallbackMessage?: string, buttons?: AlertButton[]): void {
  const normalized = normalizeError(error, fallbackMessage ?? i18n.t('common.error'));
  Alert.alert(i18n.t('common.error'), normalized.message, buttons);
}

export function showConfirm(title: string, message: string, buttons: AlertButton[]): void {
  Alert.alert(title, message, buttons);
}

export function showMessage(title: string, message: string, buttons?: AlertButton[]): void {
  Alert.alert(title, message, buttons);
}
