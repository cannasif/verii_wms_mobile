import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { RADII, SPACING } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { Text } from './Text';

interface DialogAction {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary';
}

interface AppDialogProps {
  visible: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  actions: DialogAction[];
}

export function AppDialog({
  visible,
  title,
  description,
  onClose,
  actions,
}: AppDialogProps): React.ReactElement {
  const { theme } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.mode === 'light' ? 'rgba(148,163,184,0.32)' : 'rgba(2, 6, 23, 0.72)' }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{description}</Text> : null}
          <View style={styles.actions}>
            {actions.map((action) => (
              <Pressable
                key={action.label}
                onPress={action.onPress}
                style={[
                  styles.action,
                  action.tone === 'secondary'
                    ? [styles.secondaryAction, { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.border }]
                    : [styles.primaryAction, { backgroundColor: theme.colors.primary }],
                ]}
              >
                <Text
                  style={[
                    styles.actionText,
                    action.tone === 'secondary'
                      ? [styles.secondaryActionText, { color: theme.colors.text }]
                      : [styles.primaryActionText, { color: theme.colors.background }],
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    borderRadius: RADII.xl,
    padding: SPACING.lg,
    gap: SPACING.sm,
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
  },
  description: { lineHeight: 21 },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'flex-end',
    marginTop: SPACING.xs,
  },
  action: {
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAction: {},
  secondaryAction: {
    borderWidth: 1,
  },
  actionText: {
    fontWeight: '900',
  },
  primaryActionText: {},
  secondaryActionText: {},
});
