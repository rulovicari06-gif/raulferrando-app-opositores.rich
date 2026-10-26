import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { todayKey } from './dates';
import { advanceAfterStudy, advanceAfterTest } from './plan';
import { SUBJECT_COLORS, type OposicionTemplate } from './templates';
import type {
  DayBlock,
  Profile,
  Question,
  StudyDocument,
  StudyLog,
  Subject,
  TestResult,
  Topic,
} from './types';

const STORAGE_KEY = 'opositor-diario/v1';

export type AppData = {
  version: 1;
  profile?: Profile;
  subjects: Subject[];
  topics: Topic[];
  documents: StudyDocument[];
  questions: Question[];
  results: TestResult[];
  logs: StudyLog[];
  /** Bloques del plan terminados, por id de bloque. */
  completed: Record<string, { minutes: number; at: string; block: DayBlock }>;
  /** Día en que se mostró por última vez la frase de bienvenida. */
  lastQuoteShown?: string;
};

const EMPTY: AppData = {
  version: 1,
  subjects: [],
  topics: [],
  documents: [],
  questions: [],
  results: [],
  logs: [],
  completed: {},
};

let data: AppData = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setData(update: (current: AppData) => AppData) {
  data = update(data);
  emit();
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
}

export async function hydrate() {
  if (hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) data = { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    // Si el almacenamiento falla, se arranca con datos vacíos.
  }
  hydrated = true;
  emit();
}

export function useHydrated() {
  return useSyncExternalStore(subscribe, () => hydrated, () => false);
}

export function useData<T>(selector: (d: AppData) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(data),
    () => selector(EMPTY),
  );
}

export function getData() {
  return data;
}

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// --- Perfil -----------------------------------------------------------------

export function completeOnboarding(profile: Profile, template: OposicionTemplate) {
  setData((d) => ({
    ...d,
    profile,
    subjects: d.subjects.length
      ? d.subjects
      : template.subjects.map((name, i) => ({
          id: newId() + i,
          name,
          color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
          order: i,
        })),
  }));
}

export function updateProfile(patch: Partial<Profile>) {
  setData((d) => (d.profile ? { ...d, profile: { ...d.profile, ...patch } } : d));
}

export function markQuoteShown() {
  setData((d) => ({ ...d, lastQuoteShown: todayKey() }));
}

export function resetAll() {
  setData(() => EMPTY);
}

// --- Asignaturas y temas -----------------------------------------------------

export function addSubject(name: string) {
  setData((d) => ({
    ...d,
    subjects: [
      ...d.subjects,
      { id: newId(), name, color: SUBJECT_COLORS[d.subjects.length % SUBJECT_COLORS.length], order: d.subjects.length },
    ],
  }));
}

export function renameSubject(id: string, name: string) {
  setData((d) => ({ ...d, subjects: d.subjects.map((s) => (s.id === id ? { ...s, name } : s)) }));
}

export function deleteSubject(id: string) {
  setData((d) => {
    const topicIds = new Set(d.topics.filter((t) => t.subjectId === id).map((t) => t.id));
    return {
      ...d,
      subjects: d.subjects.filter((s) => s.id !== id),
      topics: d.topics.filter((t) => !topicIds.has(t.id)),
      documents: d.documents.filter((doc) => !topicIds.has(doc.topicId)),
      questions: d.questions.filter((q) => !topicIds.has(q.topicId)),
    };
  });
}

export function moveSubject(id: string, direction: -1 | 1) {
  setData((d) => {
    const list = [...d.subjects].sort((a, b) => a.order - b.order);
    const i = list.findIndex((s) => s.id === id);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= list.length) return d;
    [list[i], list[j]] = [list[j], list[i]];
    return { ...d, subjects: list.map((s, order) => ({ ...s, order })) };
  });
}

/** Añade varios temas de golpe, uno por línea. */
export function addTopics(subjectId: string, titles: string[]) {
  setData((d) => {
    const existing = d.topics.filter((t) => t.subjectId === subjectId).length;
    const created: Topic[] = titles.map((title, i) => ({
      id: newId() + i,
      subjectId,
      title,
      order: existing + i,
      stage: 'pendiente',
      reviewCount: 0,
    }));
    return { ...d, topics: [...d.topics, ...created] };
  });
}

export function renameTopic(id: string, title: string) {
  setData((d) => ({ ...d, topics: d.topics.map((t) => (t.id === id ? { ...t, title } : t)) }));
}

export function deleteTopic(id: string) {
  setData((d) => ({
    ...d,
    topics: d.topics.filter((t) => t.id !== id),
    documents: d.documents.filter((doc) => doc.topicId !== id),
    questions: d.questions.filter((q) => q.topicId !== id),
  }));
}

export function setTopicStage(id: string, stage: Topic['stage']) {
  setData((d) => ({
    ...d,
    topics: d.topics.map((t) =>
      t.id === id
        ? { ...t, stage, reviewCount: 0, nextReview: stage === 'pendiente' || stage === 'esquema' ? undefined : todayKey() }
        : t,
    ),
  }));
}

// --- Documentos --------------------------------------------------------------

export function addDocument(doc: Omit<StudyDocument, 'id' | 'addedAt'>) {
  setData((d) => ({ ...d, documents: [...d.documents, { ...doc, id: newId(), addedAt: new Date().toISOString() }] }));
}

export function deleteDocument(id: string) {
  setData((d) => ({ ...d, documents: d.documents.filter((doc) => doc.id !== id) }));
}

// --- Preguntas y tests -------------------------------------------------------

export function addQuestions(topicId: string, questions: Omit<Question, 'id' | 'topicId'>[]) {
  setData((d) => ({
    ...d,
    questions: [...d.questions, ...questions.map((q, i) => ({ ...q, id: newId() + i, topicId }))],
  }));
}

export function deleteQuestion(id: string) {
  setData((d) => ({ ...d, questions: d.questions.filter((q) => q.id !== id) }));
}

export function recordTest(topicId: string, correct: number, total: number, points: number) {
  const date = todayKey();
  setData((d) => ({
    ...d,
    results: [...d.results, { id: newId(), topicId, date, correct, total, points }],
    topics: d.topics.map((t) => (t.id === topicId ? advanceAfterTest(t, total ? correct / total : 0, date) : t)),
  }));
}

// --- Bloques del día ---------------------------------------------------------

/** Marca un bloque como hecho, guarda los minutos y avanza el tema estudiado. */
export function completeBlock(block: DayBlock, minutes: number) {
  const date = todayKey();
  const { id, kind, topicId } = block;
  setData((d) => {
    if (d.completed[id]) return d;
    return {
      ...d,
      completed: { ...d.completed, [id]: { minutes, at: new Date().toISOString(), block } },
      logs: minutes > 0 ? [...d.logs, { id: newId(), date, kind, minutes, topicId }] : d.logs,
      topics: topicId ? d.topics.map((t) => (t.id === topicId ? advanceAfterStudy(t, date) : t)) : d.topics,
    };
  });
}

/** Autoevaluación de un repaso cuando el tema aún no tiene preguntas de test. */
export function selfAssess(topicId: string, wentWell: boolean) {
  const date = todayKey();
  setData((d) => ({
    ...d,
    topics: d.topics.map((t) => (t.id === topicId ? advanceAfterTest(t, wentWell ? 1 : 0, date) : t)),
  }));
}
