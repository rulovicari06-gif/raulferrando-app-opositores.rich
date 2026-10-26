import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { KIND_LABEL } from '@/components/block-card';
import { ThemedText } from '@/components/themed-text';
import { Card, ProgressBar, Row, Screen, SectionTitle } from '@/components/ui';
import { KindColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatLong, formatMinutes, formatShort, todayKey } from '@/lib/dates';
import { projectDays, requiredPace, STAGE_LABEL } from '@/lib/plan';
import { useData } from '@/lib/store';
import type { TopicStage } from '@/lib/types';

const DAYS = 14;
const STAGES: TopicStage[] = ['pendiente', 'esquema', 'repaso', 'dominado'];

export default function PlanScreen() {
  const theme = useTheme();
  const today = todayKey();
  const profile = useData((d) => d.profile)!;
  const subjects = useData((d) => d.subjects);
  const topics = useData((d) => d.topics);

  const days = useMemo(() => projectDays(today, DAYS, { profile, subjects, topics }), [today, profile, subjects, topics]);
  const pace = useMemo(() => requiredPace(topics, today, profile.examDate), [topics, today, profile.examDate]);
  const topicsById = useMemo(() => new Map(topics.map((t) => [t.id, t])), [topics]);
  const counts = useMemo(() => {
    const c = { pendiente: 0, esquema: 0, repaso: 0, dominado: 0 } as Record<TopicStage, number>;
    topics.forEach((t) => c[t.stage]++);
    return c;
  }, [topics]);

  // Temas nuevos que el plan prevé empezar en los próximos 7 días, para comparar con el ritmo necesario.
  const plannedNewPerWeek = useMemo(() => {
    const seen = new Set<string>();
    days.slice(0, 7).forEach(({ blocks }) =>
      blocks.forEach((b) => {
        if (b.topicId && b.stage === 'pendiente' && topicsById.get(b.topicId)) seen.add(b.topicId);
      }),
    );
    return seen.size;
  }, [days, topicsById]);

  return (
    <Screen tabs>
      <ThemedText type="subtitle">Tu plan</ThemedText>
      <ThemedText themeColor="textSecondary">
        Se recalcula solo cada día según lo que hayas estudiado y las notas de tus tests. Si un día no cumples, lo pendiente pasa al
        siguiente.
      </ThemedText>

      <Card>
        <ThemedText type="smallBold">Temario</ThemedText>
        <ProgressBar value={topics.length ? counts.dominado / topics.length : 0} color={theme.success} />
        <Row>
          {STAGES.map((s) => (
            <View key={s} style={styles.count}>
              <ThemedText type="default" style={{ fontWeight: '700' }}>
                {counts[s]}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {STAGE_LABEL[s]}
              </ThemedText>
            </View>
          ))}
        </Row>
        {pace ? (
          <ThemedText type="small" themeColor={plannedNewPerWeek >= pace.perWeek ? 'textSecondary' : undefined} style={plannedNewPerWeek < pace.perWeek ? { color: theme.danger } : undefined}>
            Quedan {pace.daysLeft} días para el examen y {pace.remaining} temas por empezar o leer. Para acabarlos una semana antes
            necesitas unos {pace.perWeek} temas a la semana y el plan prevé {plannedNewPerWeek}.
            {plannedNewPerWeek < pace.perWeek ? ' Plantéate subir las horas de teoría en Ajustes.' : ' ¡Vas bien!'}
          </ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            Añade la fecha del examen en Ajustes y te diré si llegas a tiempo.
          </ThemedText>
        )}
      </Card>

      <SectionTitle>Próximos {DAYS} días</SectionTitle>
      {days.map(({ date, blocks }) => {
        const minutes = blocks.reduce((s, b) => s + b.minutes, 0);
        return (
          <Card key={date} style={date === today ? { borderColor: theme.primary, borderWidth: 2 } : undefined}>
            <Row style={styles.dayHeader}>
              <ThemedText type="smallBold">
                {date === today ? 'Hoy' : formatLong(date)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {blocks.length ? formatMinutes(minutes) : formatShort(date)}
              </ThemedText>
            </Row>
            {blocks.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Descanso
              </ThemedText>
            ) : (
              blocks.map((b) => (
                <Row key={b.id} style={styles.line}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.time}>
                    {b.start}
                  </ThemedText>
                  <View style={[styles.dot, { backgroundColor: KindColors[b.kind] }]} />
                  <ThemedText type="small" style={{ flex: 1 }} numberOfLines={1}>
                    {b.kind === 'teoria' ? b.title : KIND_LABEL[b.kind]} · <ThemedText type="small" themeColor="textSecondary">{b.method}</ThemedText>
                  </ThemedText>
                </Row>
              ))
            )}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  count: { flex: 1, minWidth: 70 },
  dayHeader: { justifyContent: 'space-between' },
  line: { flexWrap: 'nowrap', gap: Spacing.two },
  time: { width: 44 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
