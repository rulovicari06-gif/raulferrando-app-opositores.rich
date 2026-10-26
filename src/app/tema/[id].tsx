import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chip, Field, Row, Screen, SectionTitle } from '@/components/ui';
import { AnswerColors, AnswerShapes, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirm, notify } from '@/lib/confirm';
import { formatShort } from '@/lib/dates';
import { formatSize, openDocument, pickDocuments, removeDocumentFile } from '@/lib/documents';
import { STAGE_EMOJI, STAGE_LABEL, STAGE_METHOD } from '@/lib/plan';
import { parseQuestions } from '@/lib/questions';
import {
  addQuestions,
  deleteDocument,
  deleteQuestion,
  deleteTopic,
  renameTopic,
  setTopicStage,
  useData,
} from '@/lib/store';
import type { TopicStage } from '@/lib/types';

const STAGES: TopicStage[] = ['pendiente', 'esquema', 'repaso', 'dominado'];

function QuestionForm({ topicId, onDone }: { topicId: string; onDone: () => void }) {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correct, setCorrect] = useState(0);
  const filled = options.map((o) => o.trim());
  const valid = text.trim() && filled.filter(Boolean).length >= 2 && filled[correct];

  function save() {
    const kept = filled.map((o, i) => ({ o, i })).filter(({ o }) => o);
    addQuestions(topicId, [
      { text: text.trim(), options: kept.map(({ o }) => o), correctIndex: kept.findIndex(({ i }) => i === correct) },
    ]);
    setText('');
    setOptions(['', '', '', '']);
    setCorrect(0);
    onDone();
  }

  return (
    <Card>
      <Field label="Pregunta" value={text} onChangeText={setText} placeholder="Escribe el enunciado" multiline />
      {options.map((o, i) => (
        <Row key={i} style={styles.optionRow}>
          <Pressable
            accessibilityLabel={`Marcar opción ${i + 1} como correcta`}
            onPress={() => setCorrect(i)}
            style={[styles.shape, { backgroundColor: AnswerColors[i], opacity: correct === i ? 1 : 0.35 }]}>
            <ThemedText style={styles.shapeText}>{correct === i ? '✓' : AnswerShapes[i]}</ThemedText>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Field value={o} onChangeText={(v) => setOptions((all) => all.map((x, j) => (j === i ? v : x)))} placeholder={`Opción ${i + 1}${i > 1 ? ' (opcional)' : ''}`} />
          </View>
        </Row>
      ))}
      <ThemedText type="small" themeColor="textSecondary">
        Toca el color de la respuesta correcta.
      </ThemedText>
      <Row>
        <Button small label="Guardar pregunta" onPress={save} disabled={!valid} />
        <Button small variant="ghost" label="Cancelar" onPress={onDone} />
      </Row>
      {!filled[correct] && filled.some(Boolean) ? (
        <ThemedText type="small" style={{ color: theme.danger }}>
          La respuesta marcada como correcta está vacía.
        </ThemedText>
      ) : null}
    </Card>
  );
}

function ImportForm({ topicId, onDone }: { topicId: string; onDone: () => void }) {
  const theme = useTheme();
  const [text, setText] = useState('');
  const { questions, errors } = parseQuestions(text);

  return (
    <Card>
      <ThemedText type="small" themeColor="textSecondary">
        Pega varias preguntas separadas por una línea en blanco. Marca la correcta con un * al final:
      </ThemedText>
      <ThemedText type="code">{'¿Pregunta?\na) Opción\nb) Opción correcta *\nc) Opción'}</ThemedText>
      <Field value={text} onChangeText={setText} multiline placeholder="Pega aquí tus preguntas" style={styles.importBox} />
      {text.trim() ? (
        <ThemedText type="small" style={{ color: errors.length ? theme.danger : theme.success }}>
          {questions.length} preguntas listas{errors.length ? `. ${errors.join(' ')}` : '.'}
        </ThemedText>
      ) : null}
      <Row>
        <Button
          small
          label={`Importar ${questions.length || ''}`.trim()}
          disabled={!questions.length}
          onPress={() => {
            addQuestions(topicId, questions);
            onDone();
          }}
        />
        <Button small variant="ghost" label="Cancelar" onPress={onDone} />
      </Row>
    </Card>
  );
}

export default function TopicScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const topic = useData((d) => d.topics.find((t) => t.id === id));
  const subject = useData((d) => d.subjects.find((s) => s.id === topic?.subjectId));
  const allDocs = useData((d) => d.documents);
  const allQuestions = useData((d) => d.questions);
  const allResults = useData((d) => d.results);
  const [mode, setMode] = useState<'none' | 'question' | 'import'>('none');
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(topic?.title ?? '');
  const [uploading, setUploading] = useState(false);

  if (!topic) {
    return (
      <Screen>
        <ThemedText>Este tema ya no existe.</ThemedText>
      </Screen>
    );
  }

  const docs = allDocs.filter((d) => d.topicId === topic.id);
  const questions = allQuestions.filter((q) => q.topicId === topic.id);
  const results = allResults.filter((r) => r.topicId === topic.id).slice(-5).reverse();
  const method = STAGE_METHOD[topic.stage];

  async function upload() {
    setUploading(true);
    try {
      await pickDocuments(topic!.id);
    } catch (e) {
      notify('No se pudo subir', e instanceof Error ? e.message : 'Inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  }

  async function open(doc: (typeof docs)[number]) {
    try {
      await openDocument(doc);
    } catch (e) {
      notify('No se pudo abrir', e instanceof Error ? e.message : 'Inténtalo de nuevo.');
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: subject?.name ?? 'Tema' }} />

      {editing ? (
        <Card>
          <Field label="Título del tema" value={title} onChangeText={setTitle} />
          <Row>
            <Button
              small
              label="Guardar"
              onPress={() => {
                if (title.trim()) renameTopic(topic.id, title.trim());
                setEditing(false);
              }}
            />
            <Button
              small
              variant="danger"
              label="Borrar tema"
              onPress={() =>
                confirm('Borrar tema', 'Se borrarán también sus documentos y preguntas.', () => {
                  docs.forEach(removeDocumentFile);
                  deleteTopic(topic.id);
                  router.back();
                })
              }
            />
          </Row>
        </Card>
      ) : (
        <Row style={styles.header}>
          <ThemedText type="subtitle" style={{ flex: 1 }}>
            {topic.title}
          </ThemedText>
          <Button small variant="ghost" label="Editar" onPress={() => setEditing(true)} />
        </Row>
      )}

      <Card>
        <ThemedText type="smallBold">Fase del tema</ThemedText>
        <Row>
          {STAGES.map((s) => (
            <Chip key={s} label={`${STAGE_EMOJI[s]} ${STAGE_LABEL[s]}`} selected={topic.stage === s} onPress={() => setTopicStage(topic.id, s)} />
          ))}
        </Row>
        <ThemedText type="small" themeColor="textSecondary">
          Siguiente paso: {method.method}. {topic.nextReview ? `Próximo repaso: ${formatShort(topic.nextReview)}.` : ''}
        </ThemedText>
      </Card>

      <SectionTitle action={<Button small variant="ghost" label={uploading ? 'Subiendo…' : '+ Subir'} onPress={upload} disabled={uploading} />}>
        Documentos
      </SectionTitle>
      {docs.length === 0 ? (
        <Card>
          <ThemedText themeColor="textSecondary">Sube tus apuntes, el PDF del tema o fotos de tus esquemas.</ThemedText>
          <Button label="📎 Subir documentos" variant="secondary" onPress={upload} disabled={uploading} />
        </Card>
      ) : (
        docs.map((doc) => (
          <Card key={doc.id}>
            <Row style={styles.docRow}>
              <Pressable style={{ flex: 1 }} onPress={() => open(doc)}>
                <ThemedText numberOfLines={1}>📄 {doc.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {formatSize(doc.size)} · añadido el {formatShort(doc.addedAt.slice(0, 10))}
                </ThemedText>
              </Pressable>
              <Button
                small
                variant="ghost"
                label="Quitar"
                onPress={() =>
                  confirm('Quitar documento', `¿Quitar "${doc.name}" de este tema?`, () => {
                    removeDocumentFile(doc);
                    deleteDocument(doc.id);
                  }, 'Quitar')
                }
              />
            </Row>
          </Card>
        ))
      )}

      <SectionTitle>Test de repaso</SectionTitle>
      <Card style={{ backgroundColor: '#46178F', borderColor: '#46178F' }}>
        <ThemedText type="default" style={styles.testTitle}>
          🎮 {questions.length} {questions.length === 1 ? 'pregunta' : 'preguntas'}
        </ThemedText>
        <ThemedText type="small" style={styles.testText}>
          Respuestas con cuenta atrás, puntos por rapidez y rachas. Si sacas menos de un 7, el plan te vuelve a poner el tema pronto.
        </ThemedText>
        <Button
          label="Jugar test"
          disabled={questions.length === 0}
          onPress={() => router.push({ pathname: '/test/[id]', params: { id: topic.id } })}
          style={{ backgroundColor: '#fff' }}
          textColor="#46178F"
        />
      </Card>
      {results.length ? (
        <ThemedText type="small" themeColor="textSecondary">
          Últimas notas: {results.map((r) => `${Math.round((r.correct / r.total) * 100) / 10} (${formatShort(r.date)})`).join(' · ')}
        </ThemedText>
      ) : null}

      {mode === 'question' ? (
        <QuestionForm topicId={topic.id} onDone={() => setMode('none')} />
      ) : mode === 'import' ? (
        <ImportForm topicId={topic.id} onDone={() => setMode('none')} />
      ) : (
        <Row>
          <Button small variant="secondary" label="+ Añadir pregunta" onPress={() => setMode('question')} style={{ flex: 1 }} />
          <Button small variant="secondary" label="Pegar varias" onPress={() => setMode('import')} style={{ flex: 1 }} />
        </Row>
      )}

      {questions.map((q, i) => (
        <Card key={q.id}>
          <ThemedText type="smallBold">
            {i + 1}. {q.text}
          </ThemedText>
          {q.options.map((o, j) => (
            <ThemedText key={j} type="small" style={j === q.correctIndex ? { color: theme.success, fontWeight: '700' } : undefined} themeColor={j === q.correctIndex ? undefined : 'textSecondary'}>
              {j === q.correctIndex ? '✓' : '·'} {o}
            </ThemedText>
          ))}
          <Button small variant="ghost" label="Borrar pregunta" style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} onPress={() => confirm('Borrar pregunta', q.text, () => deleteQuestion(q.id))} />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexWrap: 'nowrap' },
  docRow: { flexWrap: 'nowrap' },
  optionRow: { flexWrap: 'nowrap' },
  shape: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  shapeText: { color: '#fff', fontWeight: '800' },
  importBox: { minHeight: 160, textAlignVertical: 'top', paddingTop: Spacing.three },
  testTitle: { color: '#fff', fontWeight: '800' },
  testText: { color: '#fff', opacity: 0.9 },
});
