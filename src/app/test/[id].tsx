import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { AnswerColors, AnswerShapes, MaxContentWidth, Spacing } from '@/constants/theme';
import { PASS_RATIO } from '@/lib/plan';
import { recordTest, useData } from '@/lib/store';
import type { Question } from '@/lib/types';

const SECONDS_PER_QUESTION = 20;
const MAX_QUESTIONS = 15;
const PURPLE = '#46178F';

type Round = { question: Question; order: number[] };
type Answer = { chosen: number | null; correct: boolean; points: number };

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Más puntos cuanto antes respondas, y un extra por cada acierto seguido. */
function pointsFor(secondsUsed: number, streak: number) {
  const speed = Math.round(1000 * (1 - secondsUsed / SECONDS_PER_QUESTION / 2));
  return speed + Math.min(500, 100 * (streak - 1));
}

export default function TestScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const topic = useData((d) => d.topics.find((t) => t.id === id));
  const allQuestions = useData((d) => d.questions);

  // Las preguntas y el orden de las respuestas se barajan una sola vez por partida.
  const [seed, setSeed] = useState(0);
  const rounds = useMemo<Round[]>(
    () =>
      shuffle(allQuestions.filter((q) => q.topicId === id))
        .slice(0, MAX_QUESTIONS)
        .map((question) => ({ question, order: shuffle(question.options.map((_, i) => i)) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, seed],
  );

  const [phase, setPhase] = useState<'countdown' | 'question' | 'feedback' | 'end'>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [remaining, setRemaining] = useState(SECONDS_PER_QUESTION);
  const startedAt = useRef(0);

  const streak = useMemo(() => {
    let s = 0;
    for (let i = answers.length - 1; i >= 0 && answers[i].correct; i--) s++;
    return s;
  }, [answers]);
  const score = answers.reduce((sum, a) => sum + a.points, 0);
  const round = rounds[index];

  useEffect(() => {
    if (phase !== 'countdown') return;
    const t = setTimeout(() => {
      if (countdown > 1) return setCountdown(countdown - 1);
      startedAt.current = Date.now();
      setRemaining(SECONDS_PER_QUESTION);
      setPhase('question');
    }, 800);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== 'question') return;
    const t = setInterval(() => {
      const left = SECONDS_PER_QUESTION - (Date.now() - startedAt.current) / 1000;
      if (left <= 0) answer(null);
      else setRemaining(left);
    }, 100);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index]);

  function answer(chosen: number | null) {
    if (phase !== 'question' || !round) return;
    const used = (Date.now() - startedAt.current) / 1000;
    const correct = chosen === round.question.correctIndex;
    const points = correct ? pointsFor(used, streak + 1) : 0;
    setAnswers((a) => [...a, { chosen, correct, points }]);
    setPhase('feedback');
  }

  function next() {
    if (index + 1 >= rounds.length) {
      const correct = answers.filter((a) => a.correct).length;
      recordTest(id, correct, rounds.length, score);
      setPhase('end');
      return;
    }
    setIndex((i) => i + 1);
    startedAt.current = Date.now();
    setRemaining(SECONDS_PER_QUESTION);
    setPhase('question');
  }

  function playAgain() {
    setSeed((s) => s + 1);
    setAnswers([]);
    setIndex(0);
    setCountdown(3);
    setPhase('countdown');
  }

  const close = (
    <Pressable onPress={() => router.back()} style={styles.close} accessibilityLabel="Salir del test">
      <ThemedText style={styles.white}>✕</ThemedText>
    </Pressable>
  );

  if (!topic || rounds.length === 0) {
    return (
      <View style={[styles.full, { paddingTop: insets.top + Spacing.three }]}>
        {close}
        <ThemedText style={[styles.white, styles.center]}>Este tema no tiene preguntas todavía.</ThemedText>
      </View>
    );
  }

  if (phase === 'countdown') {
    return (
      <View style={[styles.full, styles.centered, { paddingTop: insets.top }]}>
        <ThemedText style={[styles.white, styles.topicName]}>{topic.title}</ThemedText>
        <ThemedText style={[styles.white, styles.bigNumber]}>{countdown}</ThemedText>
        <ThemedText style={styles.white}>{rounds.length} preguntas · {SECONDS_PER_QUESTION} s cada una</ThemedText>
      </View>
    );
  }

  if (phase === 'end') {
    const correct = answers.filter((a) => a.correct).length;
    const ratio = correct / rounds.length;
    const grade = Math.round(ratio * 100) / 10;
    const passed = ratio >= PASS_RATIO;
    return (
      <ScrollView style={styles.full} contentContainerStyle={[styles.endContent, { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + Spacing.five }]}>
        <ThemedText style={[styles.white, styles.endEmoji]}>{ratio === 1 ? '🏆' : passed ? '🎉' : '💪'}</ThemedText>
        <ThemedText style={[styles.white, styles.bigNumber]}>{grade}</ThemedText>
        <ThemedText style={[styles.white, styles.center]}>
          {correct} de {rounds.length} aciertos · {score.toLocaleString('es-ES')} puntos
        </ThemedText>
        <View style={styles.message}>
          <ThemedText style={[styles.center, { color: PURPLE, fontWeight: '700' }]}>
            {passed
              ? 'Tema superado. El plan te lo volverá a poner más adelante para que no se olvide.'
              : 'Aún flojea. Mañana el plan te lo vuelve a poner para reforzarlo. ¡Así se aprende!'}
          </ThemedText>
        </View>
        {rounds.map((r, i) =>
          answers[i] && !answers[i].correct ? (
            <View key={r.question.id} style={styles.review}>
              <ThemedText type="smallBold" style={styles.white}>
                {r.question.text}
              </ThemedText>
              <ThemedText type="small" style={styles.white}>
                ✓ {r.question.options[r.question.correctIndex]}
              </ThemedText>
            </View>
          ) : null,
        )}
        <Pressable onPress={playAgain} style={[styles.endButton, { backgroundColor: '#fff' }]}>
          <ThemedText style={{ color: PURPLE, fontWeight: '800' }}>Jugar otra vez</ThemedText>
        </Pressable>
        <Pressable onPress={() => router.back()} style={[styles.endButton, styles.outline]}>
          <ThemedText style={[styles.white, { fontWeight: '800' }]}>Terminar</ThemedText>
        </Pressable>
      </ScrollView>
    );
  }

  const last = answers[answers.length - 1];
  return (
    <View style={[styles.full, { paddingTop: insets.top + Spacing.two, paddingBottom: insets.bottom + Spacing.three }]}>
      <View style={styles.inner}>
        <View style={styles.topBar}>
          {close}
          <ThemedText style={styles.white}>
            {index + 1}/{rounds.length}
          </ThemedText>
          <ThemedText style={[styles.white, { fontWeight: '800' }]}>{score.toLocaleString('es-ES')} pts</ThemedText>
        </View>

        <View style={styles.questionBox}>
          <ThemedText style={styles.questionText}>{round.question.text}</ThemedText>
        </View>

        {phase === 'question' ? (
          <View style={styles.timerRow}>
            <View style={styles.timerCircle}>
              <ThemedText style={[styles.white, { fontWeight: '800', fontSize: 20 }]}>{Math.ceil(remaining)}</ThemedText>
            </View>
            <View style={styles.timerTrack}>
              <View style={[styles.timerFill, { width: `${(remaining / SECONDS_PER_QUESTION) * 100}%` }]} />
            </View>
          </View>
        ) : (
          <View style={[styles.feedback, { backgroundColor: last.correct ? '#26890C' : '#E21B3C' }]}>
            <ThemedText style={[styles.white, { fontWeight: '800', fontSize: 22 }]}>
              {last.correct ? '¡Correcto!' : last.chosen === null ? '¡Se acabó el tiempo!' : 'Incorrecto'}
            </ThemedText>
            <ThemedText style={styles.white}>
              {last.correct ? `+${last.points} puntos${streak > 1 ? ` · 🔥 racha de ${streak}` : ''}` : `La respuesta era: ${round.question.options[round.question.correctIndex]}`}
            </ThemedText>
          </View>
        )}

        <View style={styles.grid}>
          {round.order.map((optionIndex, pos) => {
            const isCorrect = optionIndex === round.question.correctIndex;
            const dimmed = phase === 'feedback' && !isCorrect;
            return (
              <Pressable
                key={optionIndex}
                disabled={phase !== 'question'}
                onPress={() => answer(optionIndex)}
                style={({ pressed }) => [
                  styles.answer,
                  { backgroundColor: AnswerColors[pos % 4], opacity: dimmed ? 0.3 : pressed ? 0.85 : 1 },
                ]}>
                <ThemedText style={styles.answerShape}>{phase === 'feedback' && isCorrect ? '✓' : AnswerShapes[pos % 4]}</ThemedText>
                <ThemedText style={styles.answerText}>{round.question.options[optionIndex]}</ThemedText>
              </Pressable>
            );
          })}
        </View>

        {phase === 'feedback' ? (
          <Pressable onPress={next} style={[styles.endButton, { backgroundColor: '#fff' }]}>
            <ThemedText style={{ color: PURPLE, fontWeight: '800' }}>{index + 1 >= rounds.length ? 'Ver resultado' : 'Siguiente'}</ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1, backgroundColor: PURPLE, paddingHorizontal: Spacing.three },
  inner: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: Spacing.three },
  centered: { alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  white: { color: '#fff' },
  center: { textAlign: 'center' },
  topicName: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  bigNumber: { fontSize: 96, lineHeight: 110, fontWeight: '900', textAlign: 'center' },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  questionBox: { backgroundColor: '#fff', borderRadius: 12, padding: Spacing.four, minHeight: 110, justifyContent: 'center' },
  questionText: { color: '#11181C', fontSize: 20, lineHeight: 28, fontWeight: '700', textAlign: 'center' },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  timerCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  timerTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  timerFill: { height: '100%', backgroundColor: '#fff', borderRadius: 5 },
  feedback: { borderRadius: 12, padding: Spacing.three, alignItems: 'center', gap: Spacing.one },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignContent: 'flex-start' },
  answer: { flexBasis: '48%', flexGrow: 1, minHeight: 100, borderRadius: 10, padding: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  answerShape: { color: '#fff', fontSize: 24, fontWeight: '900' },
  answerText: { color: '#fff', fontSize: 17, lineHeight: 22, fontWeight: '700', flex: 1 },
  endContent: { alignItems: 'center', gap: Spacing.three, maxWidth: MaxContentWidth, width: '100%', alignSelf: 'center' },
  endEmoji: { fontSize: 64, lineHeight: 76 },
  message: { backgroundColor: '#fff', borderRadius: 12, padding: Spacing.three },
  review: { alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: Spacing.three, gap: Spacing.one },
  endButton: { alignSelf: 'stretch', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  outline: { borderWidth: 2, borderColor: '#fff' },
});
