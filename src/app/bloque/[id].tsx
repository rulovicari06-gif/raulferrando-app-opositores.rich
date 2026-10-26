import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { KIND_LABEL } from '@/components/block-card';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, ProgressBar, Row, Screen, SectionTitle } from '@/components/ui';
import { KindColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatShort, todayKey } from '@/lib/dates';
import { useDayBlocks } from '@/lib/hooks';
import { completeBlock, selfAssess, useData } from '@/lib/store';

function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const sign = totalSeconds < 0 ? '+' : '';
  const abs = Math.abs(s);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

export default function BlockScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const blocks = useDayBlocks(todayKey());
  const block = blocks.find((b) => b.id === id);
  const done = useData((d) => (id ? d.completed[id] : undefined));
  const topic = useData((d) => d.topics.find((t) => t.id === block?.topicId));
  const questions = useData((d) => d.questions);
  const questionCount = topic ? questions.filter((q) => q.topicId === topic.id).length : 0;

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [checked, setChecked] = useState<number[]>([]);
  const startedAt = useRef<number | null>(null);
  const base = useRef(0);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      if (startedAt.current) setElapsed(base.current + (Date.now() - startedAt.current) / 1000);
    }, 500);
    return () => clearInterval(timer);
  }, [running]);

  if (!block) {
    return (
      <Screen>
        <ThemedText>Este bloque ya no está en el plan de hoy.</ThemedText>
        <Button label="Volver" onPress={() => router.back()} />
      </Screen>
    );
  }

  const color = KindColors[block.kind];
  const total = block.minutes * 60;
  const isReview = block.stage === 'repaso' || block.stage === 'dominado' || block.title.startsWith('Repaso:');
  const today = todayKey();
  const reviewPending = Boolean(topic?.nextReview && topic.nextReview <= today);
  const topicNeedsCheck = isReview && topic && (topic.stage === 'repaso' || topic.stage === 'dominado') && reviewPending;
  const reviewDone = isReview && topic?.nextReview && topic.nextReview > today;

  function toggleTimer() {
    if (running) {
      base.current = elapsed;
      startedAt.current = null;
      setRunning(false);
    } else {
      startedAt.current = Date.now();
      setRunning(true);
    }
  }

  function finish() {
    const minutes = elapsed > 60 ? Math.round(elapsed / 60) : block!.minutes;
    completeBlock(block!, minutes);
    setRunning(false);
    router.back();
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: KIND_LABEL[block.kind] }} />
      <View style={{ gap: Spacing.one }}>
        <ThemedText type="smallBold" style={{ color }}>
          {KIND_LABEL[block.kind].toUpperCase()} · {block.start} · {block.minutes} min
        </ThemedText>
        <ThemedText type="subtitle">{block.title}</ThemedText>
      </View>

      <Card accent={color}>
        <ThemedText type="smallBold">Cómo estudiarlo: {block.method}</ThemedText>
        {block.steps.map((step, i) => {
          const isChecked = checked.includes(i);
          return (
            <Row key={i} style={styles.step}>
              <Button
                small
                variant={isChecked ? 'primary' : 'secondary'}
                label={isChecked ? '✓' : String(i + 1)}
                style={styles.stepButton}
                onPress={() => setChecked((c) => (isChecked ? c.filter((x) => x !== i) : [...c, i]))}
              />
              <ThemedText style={[styles.stepText, isChecked && { opacity: 0.5 }]}>{step}</ThemedText>
            </Row>
          );
        })}
      </Card>

      {done ? (
        <Card accent={theme.success}>
          <ThemedText>✅ Bloque terminado: {done.minutes} min registrados.</ThemedText>
        </Card>
      ) : (
        <Card style={styles.timerCard}>
          <ThemedText style={[styles.clock, { color: elapsed > total ? theme.danger : theme.text }]}>
            {formatClock(total - elapsed)}
          </ThemedText>
          <ProgressBar value={elapsed / total} color={color} />
          <Row style={styles.timerButtons}>
            <Button label={running ? 'Pausar' : elapsed ? 'Seguir' : 'Empezar'} variant={running ? 'secondary' : 'primary'} onPress={toggleTimer} style={{ flex: 1 }} />
            <Button label="Terminar bloque" variant="secondary" onPress={finish} style={{ flex: 1 }} />
          </Row>
          <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
            Si no usas el temporizador, se apuntan los {block.minutes} minutos previstos.
          </ThemedText>
        </Card>
      )}

      {topic ? (
        <>
          <SectionTitle>Tema</SectionTitle>
          <Button label="📂 Ver apuntes y preguntas del tema" variant="secondary" onPress={() => router.push({ pathname: '/tema/[id]', params: { id: topic.id } })} />
          {topicNeedsCheck ? (
            questionCount > 0 ? (
              <Button label={`🎮 Hacer el test (${questionCount} preguntas)`} onPress={() => router.push({ pathname: '/test/[id]', params: { id: topic.id } })} />
            ) : (
              <Card>
                <ThemedText type="smallBold">¿Qué tal te ha ido el repaso?</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Este tema aún no tiene preguntas de test. Dime cómo lo llevas y el plan decide cuándo volver a repasarlo.
                </ThemedText>
                <Row>
                  <Button small label="👍 Lo domino" onPress={() => selfAssess(topic.id, true)} style={{ flex: 1 }} />
                  <Button small variant="secondary" label="😓 Me ha costado" onPress={() => selfAssess(topic.id, false)} style={{ flex: 1 }} />
                </Row>
              </Card>
            )
          ) : reviewDone ? (
            <Card accent={theme.success}>
              <ThemedText type="small">
                Repaso registrado. Próximo repaso de este tema: {formatShort(topic.nextReview!)}.
              </ThemedText>
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  step: { flexWrap: 'nowrap', alignItems: 'flex-start' },
  stepButton: { width: 40, paddingHorizontal: 0 },
  stepText: { flex: 1, paddingTop: 6 },
  timerCard: { alignItems: 'stretch', gap: Spacing.three },
  clock: { fontSize: 64, lineHeight: 72, fontWeight: '700', textAlign: 'center', fontVariant: ['tabular-nums'] },
  timerButtons: { flexWrap: 'nowrap' },
});
