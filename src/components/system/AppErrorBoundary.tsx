import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { createTheme, RADII, SPACING } from '@/constants/theme';
import { Text } from '@/components/ui/Text';
import { addRequestDiagnostic, createRequestDiagnosticId } from '@/lib/requestDiagnostics';
import i18n from '@/locales';
import { useUIStore } from '@/store/ui';

interface State {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || i18n.t('system.errorBoundary.fallbackMessage'),
    };
  }

  componentDidCatch(error: Error): void {
    addRequestDiagnostic({
      id: createRequestDiagnosticId(),
      status: 'error',
      timestamp: new Date().toISOString(),
      message: error.message,
      url: 'ui://render',
      method: 'RENDER',
    });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, message: '' });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      const theme = createTheme(useUIStore.getState().themeMode);
      return (
        <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={styles.title}>{i18n.t('system.errorBoundary.title')}</Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{this.state.message || i18n.t('system.errorBoundary.fallbackMessage')}</Text>
            <Pressable style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={this.handleReset}>
              <Text style={[styles.buttonText, { color: theme.colors.background }]}>{i18n.t('common.retry')}</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
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
  description: {
    lineHeight: 21,
  },
  button: {
    marginTop: SPACING.xs,
    minHeight: 44,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '900',
  },
});
