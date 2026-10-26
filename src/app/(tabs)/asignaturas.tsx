import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Field, ProgressBar, Row, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addSubject, useData } from '@/lib/store';

export default function SubjectsScreen() {
  const theme = useTheme();
  const subjects = useData((d) => d.subjects);
  const topics = useData((d) => d.topics);
  const documents = useData((d) => d.documents);
  const [name, setName] = useState('');

  const sorted = [...subjects].sort((a, b) => a.order - b.order);

  function add() {
    if (!name.trim()) return;
    addSubject(name.trim());
    setName('');
  }

  return (
    <Screen tabs>
      <ThemedText type="subtitle">Asignaturas</ThemedText>
      <ThemedText themeColor="textSecondary">
        Organiza tu temario: cada asignatura tiene sus temas y en cada tema guardas tus apuntes y las preguntas de repaso.
      </ThemedText>

      {sorted.map((s) => {
        const own = topics.filter((t) => t.subjectId === s.id);
        const mastered = own.filter((t) => t.stage === 'dominado').length;
        const ownIds = new Set(own.map((t) => t.id));
        const docs = documents.filter((d) => ownIds.has(d.topicId)).length;
        return (
          <Pressable key={s.id} onPress={() => router.push({ pathname: '/asignatura/[id]', params: { id: s.id } })}>
            {({ pressed }) => (
              <Card accent={s.color} style={{ opacity: pressed ? 0.8 : 1 }}>
                <Row style={styles.titleRow}>
                  <ThemedText type="default" style={{ fontWeight: '700', flex: 1 }}>
                    {s.name}
                  </ThemedText>
                  <ThemedText themeColor="textSecondary">›</ThemedText>
                </Row>
                <ThemedText type="small" themeColor="textSecondary">
                  {own.length} {own.length === 1 ? 'tema' : 'temas'} · {mastered} dominados · {docs} {docs === 1 ? 'documento' : 'documentos'}
                </ThemedText>
                <ProgressBar value={own.length ? mastered / own.length : 0} color={s.color} />
              </Card>
            )}
          </Pressable>
        );
      })}

      {sorted.length === 0 ? (
        <Card>
          <ThemedText themeColor="textSecondary">Aún no tienes asignaturas. Crea la primera aquí abajo.</ThemedText>
        </Card>
      ) : null}

      <View style={[styles.add, { borderColor: theme.border }]}>
        <Field value={name} onChangeText={setName} placeholder="Nueva asignatura" onSubmitEditing={add} returnKeyType="done" />
        <Button label="Añadir asignatura" variant="secondary" onPress={add} disabled={!name.trim()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexWrap: 'nowrap' },
  add: { gap: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.three },
});
