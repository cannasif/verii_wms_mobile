import React from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';

export function Text(props: TextProps): React.ReactElement {
  const { theme } = useTheme();

  return <RNText {...props} style={[{ color: theme.colors.text, fontSize: 14 }, props.style]} />;
}
