import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

/** Etiket yazdırma girişleri için yazıcı/yazdır ikonu (hugeicons yerine vector-icons — çözümleme sorunlarına dayanıklı). */
export function LabelPrintTriggerIcon({
  size,
  color,
}: {
  size: number;
  color: string;
}): React.ReactElement {
  return <Ionicons name='print-outline' size={size} color={color} />;
}
