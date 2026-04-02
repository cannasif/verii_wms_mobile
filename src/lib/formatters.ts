import i18n from '@/locales';

export function getDateLocale(): string {
  switch (i18n.language) {
    case 'en':
      return 'en-US';
    case 'tr':
    default:
      return 'tr-TR';
  }
}

export function formatLocalizedDate(value?: string | null): string {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString(getDateLocale());
}

export function formatLocalizedDateTime(value?: string | null): string {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString(getDateLocale());
}

export function formatLocalizedNumber(
  value?: number | null,
  options: Intl.NumberFormatOptions = { maximumFractionDigits: 3 },
): string {
  if (value === undefined || value === null) {
    return '-';
  }

  return new Intl.NumberFormat(getDateLocale(), options).format(Number(value));
}
