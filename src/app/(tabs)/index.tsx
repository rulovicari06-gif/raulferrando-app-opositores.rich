import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { BlockCard } from '@/components/block-card';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, ProgressBar, Row, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { daysBetween, formatLong, formatMinutes, todayKey } from '@/lib/dates';
import { useDayBlocks } from '@/lib/hooks';
import { dueTopics } from '@/lib/plan';
import { quoteOfTheDay } from '@/lib/quotes';
import { useData } from '@/lib/store';

/** La frase de bienvenida sale una vez cada vez que se abre la app. */
let welcomedThisLaunch = false;

function WelcomeQuote({ name, onClose }: { name: string; onClose: () => void }) {
  const theme = useTheme();
  const hour = new Date().getHours();
  const greeting = hour < 14 ? 'Buenos días' : hour < 21 ? 'Buenas tardes' : 'Buenas noches';
  return (
    <Modal animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={[styles.welcome, { backgroundColor: theme.primary }]}>
        <View style={styles.welcomeInner}>
          <ThemedText style={styles.welcomeEmoji}>🔥</ThemedText>
          <ThemedText type="subtitle" style={styles.welcomeText}>
            {greeting}{name ? `, ${name}` : ''}
          </ThemedText>
          <ThemedText style={[styles.welcomeText, styles.welcomeQuote]}>“{quoteOfTheDay()}”</ThemedText>
          <View style={styles.welcomeButton}>
            <ThemedText type="default" style={{ color: theme.primary, fontWeight: '800' }}>
              ¡A por el día!
            </ThemedText>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function Today() {
  const theme = useTheme();
  const today = todayKey();
  const profile = useData((d) => d.profile)!;
  const topics = useData((d) => d.topics);
  const completed = useData((d) => d.completed);
  const blocks = useDayBlocks(today);
  const [showWelcome, setShowWelcome] = useState(!welcomedThisLaunch);

  const doneCount = blocks.filter((b) => completed[b.id]).length;
  const totalMinutes = blocks.reduce((sum, b) => sum + b.minutes, 0);
  const doneMinutes = blocks.reduce((sum, b) => sum + (completed[b.id]?.minutes ?? 0), 0);
  const nextBlock = blocks.find((b) => !completed[b.id]);
  const pendingReviews = useMemo(() => dueTopics(topics, today).length, [topics, today]);
  const daysToExam = profile.examDate ? daysBetween(today, profile.examDate) : undefined;

  function closeWelcome() {
    welcomedThisLaunch = true;
    setShowWelcome(false);
  }

  return (
    <Screen tabs>
      {showWelcome ? <WelcomeQuote name={profile.name} onClose={closeWelcome} /> : null}

      <Row style={styles.header}>
        <View style={{ flex: 1 }}>
          <ThemedText type="small" themeColor="textSecondary">
            {formatLong(today)}
          </ThemedText>
          <ThemedText type="subtitle">Hola{profile.name ? `, ${profile.name}` : ''}</ThemedText>
        </View>
        <Pressable
          accessibilityLabel="Ajustes"
          onPress={() => router.push('/ajustes')}
          style={[styles.settings, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText style={{ fontSize: 20 }}>⚙️</ThemedText>
        </Pressable>
      </Row>

      <Card style={{ backgroundColor: theme.primary, borderColor: theme.primary }}>
        <ThemedText type="small" style={styles.quoteLabel}>
          FRASE DEL DÍA
        </ThemedText>
        <ThemedText style={styles.quote}>“{quoteOfTheDay()}”</ThemedText>
      </Card>

      <Row>
        <Card style={styles.stat}>
          <ThemedText type="small" themeColor="textSecondary">
            {profile.oposicionName}
          </ThemedText>
          <ThemedText type="subtitle">{daysToExam !== undefined && daysToExam >= 0 ? daysToExam : '—'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {daysToExam !== undefined && daysToExam >= 0 ? 'días para el examen' : 'sin fecha de examen'}
          </ThemedText>
        </Card>
        <Card style={styles.stat}>
          <ThemedText type="small" themeColor="textSecondary">
            Hoy
          </ThemedText>
          <ThemedText type="subtitle">
            {doneCount}/{blocks.length}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatMinutes(doneMinutes)} de {formatMinutes(totalMinutes)}
          </ThemedText>
        </Card>
      </Row>
      {blocks.length ? <ProgressBar value={totalMinutes ? doneMinutes / totalMinutes : 0} /> : null}

      {pendingReviews > 0 ? (
        <Card accent={theme.primary}>
          <ThemedText type="smallBold">
            🔁 {pendingReviews === 1 ? 'Tienes 1 tema para repasar' : `Tienes ${pendingReviews} temas para repasar`}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            El plan los va metiendo en tus bloques de teoría para que no se te olviden.
          </ThemedText>
        </Card>
      ) : null}

      <SectionTitle>Tu plan de hoy</SectionTitle>
      {blocks.length === 0 ? (
        <Card>
          <ThemedText type="default">Hoy toca descanso 😌</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Descansar también es parte del plan. Mañana seguimos.
          </ThemedText>
        </Card>
      ) : (
        blocks.map((b) => <BlockCard key={b.id} block={b} done={Boolean(completed[b.id])} />)
      )}

      {nextBlock ? (
        <Button
          label={`Empezar: ${nextBlock.method}`}
          onPress={() => router.push({ pathname: '/bloque/[id]', params: { id: nextBlock.id } })}
        />
      ) : blocks.length ? (
        <Card accent={theme.success}>
          <ThemedText type="default">🎉 ¡Día completado!</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Hoy has cumplido. Esto es exactamente lo que hace que se apruebe.
          </ThemedText>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexWrap: 'nowrap' },
  settings: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  quoteLabel: { color: '#fff', opacity: 0.85, letterSpacing: 1 },
  quote: { color: '#fff', fontSize: 18, lineHeight: 26, fontStyle: 'italic' },
  stat: { flex: 1, minWidth: 140, gap: 0 },
  welcome: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.five },
  welcomeInner: { maxWidth: 520, gap: Spacing.four, alignItems: 'center' },
  welcomeEmoji: { fontSize: 64, lineHeight: 76 },
  welcomeText: { color: '#fff', textAlign: 'center' },
  welcomeQuote: { fontSize: 24, lineHeight: 34, fontStyle: 'italic' },
  welcomeButton: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: Spacing.five, paddingVertical: Spacing.three, marginTop: Spacing.three },
});
