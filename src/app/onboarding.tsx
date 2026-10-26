import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { isValidTime, normalizeTime, parseSpanishDate, Stepper } from '@/components/inputs';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Field, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMinutes } from '@/lib/dates';
import { notificationsSupported, requestNotificationPermission } from '@/lib/notifications';
import { quoteOfTheDay } from '@/lib/quotes';
import { completeOnboarding } from '@/lib/store';
import { TEMPLATES } from '@/lib/templates';

export default function Onboarding() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [customName, setCustomName] = useState('');
  const [examText, setExamText] = useState('');
  const [weekdayHours, setWeekdayHours] = useState(4);
  const [weekendHours, setWeekendHours] = useState(2);
  const [restSunday, setRestSunday] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [notifications, setNotifications] = useState(notificationsSupported);

  const template = TEMPLATES.find((t) => t.id === templateId)!;
  const examDate = parseSpanishDate(examText);
  const examError = examText.trim() !== '' && !examDate;
  const timeError = !isValidTime(startTime);
  const oposicionName = template.id === 'otra' ? customName.trim() : template.name;
  const canFinish = !examError && !timeError && oposicionName !== '';

  async function finish() {
    const weekday = Math.round(weekdayHours * 60);
    const weekend = Math.round(weekendHours * 60);
    const granted = notifications ? await requestNotificationPermission() : false;
    completeOnboarding(
      {
        name: name.trim(),
        oposicionId: template.id,
        oposicionName,
        examDate,
        minutesByWeekday: [restSunday ? 0 : weekend, weekday, weekday, weekday, weekday, weekday, weekend],
        startTime: normalizeTime(startTime),
        split: template.split,
        notificationsEnabled: granted,
        createdAt: new Date().toISOString(),
      },
      template,
    );
    router.replace('/');
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <ThemedText style={styles.emoji}>🎯</ThemedText>
        <ThemedText type="subtitle">Bienvenido a Opositor Diario</ThemedText>
        <ThemedText themeColor="textSecondary">
          Cada día te diremos qué estudiar, cómo hacerlo y cuándo. Primero, cuéntanos un poco sobre ti.
        </ThemedText>
        <Card style={{ backgroundColor: theme.primary, borderColor: theme.primary }}>
          <ThemedText style={{ color: '#fff', fontStyle: 'italic' }}>“{quoteOfTheDay()}”</ThemedText>
        </Card>
      </View>

      <Field label="¿Cómo te llamas?" value={name} onChangeText={setName} placeholder="Tu nombre" />

      <SectionTitle>¿Qué oposición preparas?</SectionTitle>
      <View style={styles.templates}>
        {TEMPLATES.map((t) => {
          const selected = t.id === templateId;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTemplateId(t.id)}
              style={[
                styles.template,
                { borderColor: selected ? theme.primary : theme.border, backgroundColor: theme.backgroundElement },
                selected && { borderWidth: 2 },
              ]}>
              <ThemedText type="smallBold">{t.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t.description}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      {template.id === 'otra' ? (
        <Field label="Nombre de tu oposición" value={customName} onChangeText={setCustomName} placeholder="Por ejemplo: Técnico de Hacienda" />
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          Te crearemos unas asignaturas de partida: {template.subjects.join(', ')}. Podrás cambiarlas cuando quieras para que
          encajen con tu convocatoria.
        </ThemedText>
      )}

      <Field
        label="Fecha del examen (opcional)"
        value={examText}
        onChangeText={setExamText}
        placeholder="DD/MM/AAAA"
        keyboardType="numbers-and-punctuation"
      />
      {examError ? <ThemedText style={{ color: theme.danger }}>Escribe la fecha como 15/06/2027.</ThemedText> : null}

      <SectionTitle>¿Cuánto tiempo tienes?</SectionTitle>
      <Card>
        <Stepper label="De lunes a viernes" value={weekdayHours} onChange={setWeekdayHours} step={0.5} max={12} format={(v) => formatMinutes(v * 60)} />
        <Stepper label="Fines de semana" value={weekendHours} onChange={setWeekendHours} step={0.5} max={12} format={(v) => formatMinutes(v * 60)} />
        <View style={styles.switchRow}>
          <ThemedText style={{ flex: 1 }}>Descansar los domingos</ThemedText>
          <Switch value={restSunday} onValueChange={setRestSunday} />
        </View>
      </Card>
      <Field label="¿A qué hora empiezas?" value={startTime} onChangeText={setStartTime} placeholder="09:00" keyboardType="numbers-and-punctuation" />
      {timeError ? <ThemedText style={{ color: theme.danger }}>Escribe la hora como 09:00.</ThemedText> : null}

      {notificationsSupported ? (
        <Card>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <ThemedText>Avisos y alarmas</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Una frase motivadora antes de empezar y un aviso al comienzo de cada bloque.
              </ThemedText>
            </View>
            <Switch value={notifications} onValueChange={setNotifications} />
          </View>
        </Card>
      ) : null}

      <Button label="Empezar" onPress={finish} disabled={!canFinish} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: Spacing.two, marginBottom: Spacing.two },
  emoji: { fontSize: 44, lineHeight: 56 },
  templates: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  template: { borderWidth: 1, borderRadius: 14, padding: Spacing.three, flexBasis: '47%', flexGrow: 1, gap: Spacing.half },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
