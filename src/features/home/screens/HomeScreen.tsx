import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { COLORS } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { HeroCard } from '../components/HeroCard';
import { KpiStrip } from '../components/KpiStrip';
import { ModuleGrid } from '../components/ModuleGrid';

export function HomeScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.mode === 'light' ? 'dark' : 'light'} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 18, paddingHorizontal: 20, paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
        <HeroCard />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('welcome.quickActions')}</Text>
          <KpiStrip />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('welcome.modules')}</Text>
          <ModuleGrid />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('welcome.activity')}</Text>
          <View style={[styles.timelineCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
            <Text style={styles.timelineTitle}>{t('welcome.timelineOneTitle')}</Text>
            <Text style={[styles.timelineText, { color: theme.colors.textSecondary }]}>{t('welcome.opsCard')}</Text>
          </View>
          <View style={[styles.timelineCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
            <Text style={styles.timelineTitle}>{t('welcome.timelineTwoTitle')}</Text>
            <Text style={[styles.timelineText, { color: theme.colors.textSecondary }]}>{t('welcome.inventoryCard')}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  section: { marginTop: 22, gap: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  timelineCard: { borderRadius: 22, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, padding: 16, gap: 8 },
  timelineTitle: { fontSize: 15, fontWeight: '800' },
  timelineText: { color: COLORS.textSecondary, lineHeight: 20 },
});
