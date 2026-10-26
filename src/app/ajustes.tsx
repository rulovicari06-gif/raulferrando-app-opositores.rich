import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { isValidTime, normalizeTime, parseSpanishDate, Stepper, toSpanishDate } from '@/components/inputs';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Field, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirm, notify } from '@/lib/confirm';
import { formatMinutes } from '@/lib/dates';
import { notificationsSupported, requestNotificationPermission } from '@/lib/notifications';
import { resetAll, updateProfile, useData } from '@/lib/store';
import type { BlockKind, Split } from '@/lib/types';

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const SPLIT_LABEL: Record<BlockKind, string> = { teoria: 'Teoría', psicotecnicos: 'Psicotécnicos', fisico: 'Preparación física' };

export default function Settings() {
  const theme = useTheme();
  const profile = useData((d) => d.profile)!;
  const [name, setName] = useState(profile.name);
  const [oposicion, setOposicion] = useState(profile.oposicionName);
  const [examText, setExamText] = useState(toSpanishDate(profile.examDate));
  const [startTime, setStartTime] = useState(profile.startTime);

  const examDate = parseSpanishDate(examText);
  const examError = examText.trim() !== '' && !examDate;
  const timeError = !isValidTime(startTime);

  function setMinutes(day: number, minutes: number) {
    updateProfile({ minutesByWeekday: profile.minutesByWeekday.map((m, i) => (i === day ? minutes : m)) });
  }

  /** Cambia un reparto y compensa la diferencia en los otros para que siga sumando 100. */
  function setSplit(kind: BlockKind, value: number) {
    const split: Split = { ...profile.split };
    let diff = value - split[kind];
    const order: BlockKind[] = kind === 'teoria' ? ['psicotecnicos', 'fisico'] : ['teoria', kind === 'fisico' ? 'psicotecnicos' : 'fisico'];
    for (const k of order) {
      const change = diff > 0 ? Math.min(diff, split[k]) : diff;
      split[k] -= change;
      diff -= change;
      if (diff === 0) break;
    }
    split[kind] = value - diff;
    updateProfile({ split });
  }

  async function toggleNotifications(enabled: boolean) {
    if (!enabled) return updateProfile({ notificationsEnabled: false });
    const granted = await requestNotificationPermission();
    updateProfile({ notificationsEnabled: granted });
    if (!granted) notify('Avisos desactivados', 'Activa las notificaciones de la app en los ajustes del móvil.');
  }

  function saveTexts() {
    updateProfile({
      name: name.trim(),
      oposicionName: oposicion.trim() || profile.oposicionName,
      examDate: examText.trim() ? examDate : undefined,
      startTime: timeError ? profile.startTime : normalizeTime(startTime),
    });
  }

  return (
    <Screen>
      <SectionTitle>Tus datos</SectionTitle>
      <Field label="Nombre" value={name} onChangeText={setName} onBlur={saveTexts} />
      <Field label="Oposición" value={oposicion} onChangeText={setOposicion} onBlur={saveTexts} />
      <Field label="Fecha del examen" value={examText} onChangeText={setExamText} onBlur={saveTexts} placeholder="DD/MM/AAAA" />
      {examError ? <ThemedText style={{ color: theme.danger }}>Escribe la fecha como 15/06/2027.</ThemedText> : null}
      <Field label="Hora de inicio" value={startTime} onChangeText={setStartTime} onBlur={saveTexts} placeholder="09:00" />
      {timeError ? <ThemedText style={{ color: theme.danger }}>Escribe la hora como 09:00.</ThemedText> : null}
      <Button small label="Guardar" onPress={saveTexts} disabled={examError || timeError} style={{ alignSelf: 'flex-start' }} />

      <SectionTitle>Tiempo de estudio por día</SectionTitle>
      <Card>
        {WEEK_ORDER.map((day) => (
          <Stepper
            key={day}
            label={['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][day]}
            value={profile.minutesByWeekday[day]}
            onChange={(v) => setMinutes(day, v)}
            step={30}
            max={720}
            format={(v) => (v ? formatMinutes(v) : 'Descanso')}
          />
        ))}
      </Card>

      <SectionTitle>Reparto del tiempo</SectionTitle>
      <Card>
        {(Object.keys(SPLIT_LABEL) as BlockKind[]).map((k) => (
          <Stepper key={k} label={SPLIT_LABEL[k]} value={profile.split[k]} onChange={(v) => setSplit(k, v)} step={5} max={100} format={(v) => `${v} %`} />
        ))}
        <ThemedText type="small" themeColor="textSecondary">
          Por ejemplo, con 4 h al día y un 40 % de físico entrenas {formatMinutes(Math.round((240 * profile.split.fisico) / 100))} diarios.
        </ThemedText>
      </Card>

      {notificationsSupported ? (
        <>
          <SectionTitle>Avisos</SectionTitle>
          <Card>
            <View style={styles.switchRow}>
              <ThemedText style={{ flex: 1 }}>Frase motivadora y aviso de cada bloque</ThemedText>
              <Switch value={profile.notificationsEnabled} onValueChange={toggleNotifications} />
            </View>
          </Card>
        </>
      ) : null}

      <SectionTitle>Datos</SectionTitle>
      <ThemedText type="small" themeColor="textSecondary">
        De momento tus datos se guardan en este dispositivo. La sincronización entre el móvil y el ordenador llegará en la
        siguiente versión.
      </ThemedText>
      <Button
        variant="danger"
        label="Borrar todo y empezar de cero"
        onPress={() =>
          confirm('Borrar todo', 'Se borrarán tu plan, asignaturas, temas, preguntas y progreso. No se puede deshacer.', () => {
            resetAll();
            router.replace('/onboarding');
          })
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
