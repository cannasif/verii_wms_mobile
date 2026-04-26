import React from 'react';
import { ScrollView, ScrollViewProps, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LAYOUT, SPACING } from '@/constants/theme';

interface PageShellProps {
  children: React.ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
  showsVerticalScrollIndicator?: boolean;
}

export function PageShell({
  children,
  scroll = false,
  contentContainerStyle,
  style,
  keyboardShouldPersistTaps = 'handled',
  showsVerticalScrollIndicator = false,
}: PageShellProps): React.ReactElement {
  if (!scroll) {
    return <View style={[styles.root, { backgroundColor: 'transparent' }, style]}>{children}</View>;
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: 'transparent' }, style]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: LAYOUT.screenPadding,
  },
  content: {
    paddingTop: SPACING.md + 2,
    paddingBottom: LAYOUT.screenBottomPadding,
  },
});
