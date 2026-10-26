import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Field, Row, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirm } from '@/lib/confirm';
import { STAGE_EMOJI, STAGE_LABEL } from '@/lib/plan';
import { addTopics, deleteSubject, moveSubject, renameSubject, useData } from '@/lib/store';

export default function SubjectScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const subject = useData((d) => d.subjects.find((s) => s.id === id));
  const allTopics = useData((d) => d.topics);
  const documents = useData((d) => d.documents);
  const questions = useData((d) => d.questions);
  const [newTopics, setNewTopics] = useState('');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(subject?.name ?? '');

  if (!subject) {
    return (
      <Screen>
        <ThemedText>Esta asignatura ya no existe.</ThemedText>
      </Screen>
    );
  }

  const topics = allTopics.filter((t) => t.subjectId === subject.id).sort((a, b) => a.order - b.order);
  const lines = newTopics.split('\n').map((l) => l.trim()).filter(Boolean);

  function add() {
    if (!lines.length) return;
    addTopics(subject!.id, lines);
    setNewTopics('');
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: subject.name }} />

      {editing ? (
        <Card>
          <Field label="Nombre" value={name} onChangeText={setName} />
          <Row>
            <Button
              small
              label="Guardar"
              onPress={() => {
                if (name.trim()) renameSubject(subject.id, name.trim());
                setEditing(false);
              }}
            />
            <Button small variant="secondary" label="↑ Subir" onPress={() => moveSubject(subject.id, -1)} />
            <Button small variant="secondary" label="↓ Bajar" onPress={() => moveSubject(subject.id, 1)} />
            <Button
              small
              variant="danger"
              label="Borrar"
              onPress={() =>
                confirm('Borrar asignatura', `Se borrarán "${subject.name}", sus temas, documentos y preguntas.`, () => {
                  deleteSubject(subject.id);
                  router.back();
                })
              }
            />
          </Row>
          <ThemedText type="small" themeColor="textSecondary">
            El orden de las asignaturas es el orden en que el plan te las va poniendo.
          </ThemedText>
        </Card>
      ) : (
        <Row style={styles.header}>
          <ThemedText type="subtitle" style={{ flex: 1 }}>
            {subject.name}
          </ThemedText>
          <Button small variant="ghost" label="Editar" onPress={() => setEditing(true)} />
        </Row>
      )}

      <SectionTitle>Temas</SectionTitle>
      {topics.length === 0 ? (
        <Card>
          <ThemedText themeColor="textSecondary">Añade los temas de esta asignatura. Puedes pegar el índice entero, un tema por línea.</ThemedText>
        </Card>
      ) : (
        topics.map((t, i) => {
          const docs = documents.filter((d) => d.topicId === t.id).length;
          const qs = questions.filter((q) => q.topicId === t.id).length;
          return (
            <Pressable key={t.id} onPress={() => router.push({ pathname: '/tema/[id]', params: { id: t.id } })}>
              {({ pressed }) => (
                <Card style={{ opacity: pressed ? 0.8 : 1 }}>
                  <Row style={styles.topicRow}>
                    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.number}>
                      {i + 1}
                    </ThemedText>
                    <ThemedText style={{ flex: 1 }}>{t.title}</ThemedText>
                    <ThemedText themeColor="textSecondary">›</ThemedText>
                  </Row>
                  <ThemedText type="small" themeColor="textSecondary">
                    {STAGE_EMOJI[t.stage]} {STAGE_LABEL[t.stage]} · 📄 {docs} · ❓ {qs}
                  </ThemedText>
                </Card>
              )}
            </Pressable>
          );
        })
      )}

      <SectionTitle>Añadir temas</SectionTitle>
      <Field
        value={newTopics}
        onChangeText={setNewTopics}
        placeholder={'Tema 1. ...\nTema 2. ...'}
        multiline
        style={[styles.multiline, { borderColor: theme.border }]}
      />
      <Button label={lines.length > 1 ? `Añadir ${lines.length} temas` : 'Añadir tema'} variant="secondary" onPress={add} disabled={!lines.length} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexWrap: 'nowrap' },
  topicRow: { flexWrap: 'nowrap' },
  number: { width: 24 },
  multiline: { minHeight: 110, textAlignVertical: 'top', paddingTop: Spacing.three },
});
