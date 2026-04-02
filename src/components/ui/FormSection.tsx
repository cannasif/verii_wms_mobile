import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { SectionCard } from './SectionCard';

interface FormSectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function FormSection(props: FormSectionProps): React.ReactElement {
  return <SectionCard {...props} />;
}
