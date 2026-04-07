import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { COLORS, RADII, SPACING } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type { BarcodeMatchCandidate } from '@/services/barcode-types';
import { getBarcodeCandidateLabel } from '../barcode-feedback';

interface BarcodeCandidatePickerProps {
  candidates: BarcodeMatchCandidate[];
  message: string;
  onSelect: (candidate: BarcodeMatchCandidate) => void;
}

export function BarcodeCandidatePicker({ candidates, message, onSelect }: BarcodeCandidatePickerProps): React.ReactElement | null {
  const { theme } = useTheme();

  if (candidates.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceStrong }]}> 
      <Text style={styles.message}>{message}</Text>
      {candidates.map((candidate, index) => (
        <Pressable
          key={`${candidate.stockCode ?? 'candidate'}-${candidate.yapKod ?? 'none'}-${index}`}
          style={[styles.button, { borderColor: theme.colors.primary }]}
          onPress={() => onSelect(candidate)}
        >
          <Text style={[styles.buttonText, { color: theme.colors.primary }]}>{getBarcodeCandidateLabel(candidate)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
    borderWidth: 1,
    borderRadius: RADII.xl,
    padding: SPACING.lg,
  },
  message: {
    fontSize: 15,
    fontWeight: '700',
  },
  button: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
