import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { KIND_LABEL } from '@/components/block-card';
import { ThemedText } from '@/components/themed-text';
import { Card, Row, Screen, SectionTitle } from '@/components/ui';
import { KindColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addDays, formatMinutes, fromKey, todayKey, WEEKDAYS_SHORT } from '@/lib/dates';
import { useData } from '@/lib/store';
import type { BlockKind } from '@/lib/types';

const KINDS: BlockKind[] = ['teoria', 'psicotecnicos', 'fisico'];

export default function ProgressScreen() {
  const theme = useTheme();
  const logs = useData((d) => d.logs);
  const results = useData((d) => d.results);
  const topics = useData((d) => d.topics);
  const today = todayKey();

  const week = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
    return days.map((date) => {
      const byKind = { teoria: 0, psicotecnicos: 0, fisico: 0 } as Record<BlockKind, number>;
      logs.filter((l) => l.date === date).forEach((l) => (byKind[l.kind] += l.minutes));
      return { date, byKind, total: byKind.teoria + byKind.psicotecnicos + byKind.fisico };
    });
  }, [logs, today]);

  const weekTotal = week.reduce((s, d) => s + d.total, 0);
  const maxDay = Math.max(60, ...week.map((d) => d.total));
  const kindTotals = KINDS.map((k) => ({ kind: k, minutes: week.reduce((s, d) => s + d.byKind[k], 0) }));

  // Racha: días seguidos (hasta hoy o ayer) con algo de estudio registrado.
  const streak = useMemo(() => {
    const studied = new Set(logs.map((l) => l.date));
    let day = studied.has(today) ? today : addDays(today, -1);
    let count = 0;
    while (studied.has(day)) {
      count++;
      day = addDays(day, -1);
    }
    return count;
  }, [logs, today]);

  const average = results.length ? results.reduce((s, r) => s + r.correct / r.total, 0) / results.length : undefined;
  const mastered = topics.filter((t) => t.stage === 'dominado').length;
  const allTime = logs.reduce((s, l) => s + l.minutes, 0);

  return (
    <Screen tabs>
      <ThemedText type="subtitle">Progreso</ThemedText>

      <Row>
        <Card style={styles.stat}>
          <ThemedText type="subtitle">🔥 {streak}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {streak === 1 ? 'día seguido' : 'días seguidos'}
          </ThemedText>
        </Card>
        <Card style={styles.stat}>
          <ThemedText type="subtitle">{average !== undefined ? Math.round(average * 100) / 10 : '—'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            nota media en tests
          </ThemedText>
        </Card>
        <Card style={styles.stat}>
          <ThemedText type="subtitle">
            {mastered}/{topics.length}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            temas dominados
          </ThemedText>
        </Card>
      </Row>

      <SectionTitle>Últimos 7 días · {formatMinutes(weekTotal)}</SectionTitle>
      <Card>
        <View style={styles.chart}>
          {week.map((d) => (
            <View key={d.date} style={styles.barColumn}>
              <View style={styles.barArea}>
                {KINDS.map((k) =>
                  d.byKind[k] ? (
                    <View key={k} style={{ height: `${(d.byKind[k] / maxDay) * 100}%`, backgroundColor: KindColors[k] }} />
                  ) : null,
                )}
              </View>
              <ThemedText type="small" themeColor={d.date === today ? undefined : 'textSecondary'} style={d.date === today ? { color: theme.primary, fontWeight: '700' } : undefined}>
                {WEEKDAYS_SHORT[fromKey(d.date).getDay()]}
              </ThemedText>
            </View>
          ))}
        </View>
        <Row style={{ justifyContent: 'center', gap: Spacing.three }}>
          {kindTotals.map(({ kind, minutes }) => (
            <Row key={kind} style={{ gap: Spacing.one }}>
              <View style={[styles.legend, { backgroundColor: KindColors[kind] }]} />
              <ThemedText type="small">
                {KIND_LABEL[kind]} {formatMinutes(minutes)}
              </ThemedText>
            </Row>
          ))}
        </Row>
      </Card>

      <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
        En total llevas {formatMinutes(allTime)} de estudio y entrenamiento con la app.
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stat: { flex: 1, minWidth: 100, gap: 0, alignItems: 'center' },
  chart: { flexDirection: 'row', height: 160, gap: Spacing.two, alignItems: 'flex-end' },
  barColumn: { flex: 1, alignItems: 'center', gap: Spacing.one, height: '100%' },
  barArea: { flex: 1, width: '70%', justifyContent: 'flex-start', borderRadius: 6, overflow: 'hidden', flexDirection: 'column-reverse' },
  legend: { width: 10, height: 10, borderRadius: 5 },
});
