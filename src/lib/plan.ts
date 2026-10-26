import { addDays, fromKey, minutesToTime, timeToMinutes } from './dates';
import type { BlockKind, DayBlock, Profile, Subject, Topic, TopicStage } from './types';

/** Días hasta el siguiente repaso tras cada repaso superado (repetición espaciada). */
export const REVIEW_INTERVALS = [1, 3, 7, 15, 30, 60];
/** Nota mínima (de 0 a 1) para dar un test por superado. */
export const PASS_RATIO = 0.7;
const BREAK_MINUTES = 10;
const MIN_BLOCK = 15;

type Method = { method: string; steps: string[] };

export const STAGE_METHOD: Record<TopicStage, Method> = {
  pendiente: {
    method: 'Primera lectura',
    steps: [
      'Lee el tema entero de un tirón para tener una visión general.',
      'Segunda lectura subrayando solo las ideas clave, fechas y cifras.',
      'Apunta las dudas para resolverlas mañana.',
    ],
  },
  esquema: {
    method: 'Esquema y resumen',
    steps: [
      'Haz un esquema de memoria con lo que recuerdes.',
      'Complétalo con el libro en otro color: eso es lo que te falta.',
      'Escribe un resumen del tema en diez líneas.',
    ],
  },
  repaso: {
    method: 'Repaso activo y test',
    steps: [
      'Explica el tema en voz alta sin mirar, como si dieras una clase.',
      'Repasa con el esquema solo lo que se te haya olvidado.',
      'Termina con el test del tema.',
    ],
  },
  dominado: {
    method: 'Repaso espaciado',
    steps: [
      'Lee tu esquema rápido, sin pararte en lo que ya dominas.',
      'Haz el test del tema para comprobar que sigue fijado.',
    ],
  },
};

export const STAGE_LABEL: Record<TopicStage, string> = {
  pendiente: 'Sin empezar',
  esquema: 'Leído',
  repaso: 'En repaso',
  dominado: 'Dominado',
};

export const STAGE_EMOJI: Record<TopicStage, string> = {
  pendiente: '⚪️',
  esquema: '🟡',
  repaso: '🟠',
  dominado: '🟢',
};

const PSICO_ROTATION: Method[] = [
  { method: 'Series numéricas y cálculo', steps: ['Calentamiento: 5 minutos de cálculo mental.', 'Series con cronómetro.', 'Revisa los fallos y anota el patrón que no viste.'] },
  { method: 'Razonamiento verbal', steps: ['Sinónimos, antónimos y analogías.', 'Ordenar frases y comprensión lectora.', 'Revisa los fallos.'] },
  { method: 'Razonamiento espacial y abstracto', steps: ['Figuras, giros y desarrollos de cubos.', 'Series de fichas de dominó o figuras.', 'Revisa los fallos.'] },
  { method: 'Atención y memoria', steps: ['Ejercicios de búsqueda de errores y comparación.', 'Memoriza una imagen o lista y responde preguntas.', 'Revisa los fallos.'] },
  { method: 'Simulacro mixto', steps: ['Test mezclando todos los tipos, con el tiempo del examen.', 'Calcula tu nota y apúntala.'] },
];

const FISICO_ROTATION: Method[] = [
  { method: 'Resistencia', steps: ['Calentamiento de 10 minutos.', 'Carrera continua a ritmo cómodo.', 'Estiramientos al terminar.'] },
  { method: 'Fuerza', steps: ['Calentamiento articular.', 'Circuito: flexiones, sentadillas, dominadas o remo, plancha.', 'Estiramientos al terminar.'] },
  { method: 'Simulación de pruebas', steps: ['Calentamiento completo.', 'Practica las pruebas físicas de tu convocatoria y apunta tus marcas.', 'Vuelta a la calma.'] },
  { method: 'Velocidad y series', steps: ['Calentamiento con progresivos.', 'Series cortas con descanso completo.', 'Estiramientos al terminar.'] },
  { method: 'Movilidad y recuperación', steps: ['Movilidad articular suave.', 'Estiramientos largos o yoga.', 'Hoy descansa bien: también entrena.'] },
];

export type PlanState = {
  profile: Profile;
  subjects: Subject[];
  topics: Topic[];
};

function orderedTopics(subjects: Subject[], topics: Topic[]): Topic[] {
  const subjectOrder = new Map(subjects.map((s) => [s.id, s.order]));
  return [...topics].sort(
    (a, b) => (subjectOrder.get(a.subjectId) ?? 0) - (subjectOrder.get(b.subjectId) ?? 0) || a.order - b.order,
  );
}

/** Temas que tocan repasar en la fecha dada, el más atrasado primero. */
export function dueTopics(topics: Topic[], dateKey: string): Topic[] {
  return topics
    .filter((t) => (t.stage === 'dominado' || t.stage === 'repaso') && t.nextReview && t.nextReview <= dateKey)
    .sort((a, b) => (a.nextReview! < b.nextReview! ? -1 : 1));
}

/** El tema que se avanza hoy: el que ya está empezado o, si no hay, el siguiente sin empezar. */
export function currentTopic(subjects: Subject[], topics: Topic[], dateKey: string): Topic | undefined {
  const ordered = orderedTopics(subjects, topics);
  return (
    ordered.find((t) => t.stage === 'esquema') ??
    ordered.find((t) => t.stage === 'repaso' && (!t.nextReview || t.nextReview <= dateKey)) ??
    ordered.find((t) => t.stage === 'pendiente')
  );
}

function rotation<T>(list: T[], dateKey: string): T {
  const day = Math.floor(fromKey(dateKey).getTime() / 86_400_000);
  return list[((day % list.length) + list.length) % list.length];
}

function topicBlock(id: string, kind: BlockKind, minutes: number, topic: Topic, subjects: Subject[], review: boolean): Omit<DayBlock, 'start'> {
  const subject = subjects.find((s) => s.id === topic.subjectId);
  const { method, steps } = STAGE_METHOD[review ? 'dominado' : topic.stage];
  return {
    id,
    kind,
    minutes,
    title: `${review ? 'Repaso: ' : ''}${topic.title}${subject ? ` · ${subject.name}` : ''}`,
    method,
    steps,
    topicId: topic.id,
    stage: topic.stage,
  };
}

/** Calcula los bloques de un día a partir del estado actual del temario. */
export function buildDay(dateKey: string, { profile, subjects, topics }: PlanState): DayBlock[] {
  const total = profile.minutesByWeekday[fromKey(dateKey).getDay()] ?? 0;
  if (total <= 0) return [];

  const minutesFor = (kind: BlockKind) => Math.round((total * profile.split[kind]) / 100 / 5) * 5;
  const blocks: Omit<DayBlock, 'start'>[] = [];

  let theory = minutesFor('teoria');
  if (theory >= MIN_BLOCK) {
    const due = dueTopics(topics, dateKey);
    const current = currentTopic(subjects, topics, dateKey);
    const review = due.find((t) => t.id !== current?.id);
    if (review && current && theory >= MIN_BLOCK * 3) {
      const reviewMinutes = Math.max(MIN_BLOCK, Math.round(theory / 3 / 5) * 5);
      blocks.push(topicBlock(`${dateKey}:teoria:repaso`, 'teoria', reviewMinutes, review, subjects, true));
      theory -= reviewMinutes;
    } else if (review && !current) {
      blocks.push(topicBlock(`${dateKey}:teoria:repaso`, 'teoria', theory, review, subjects, true));
      theory = 0;
    }
    if (theory > 0 && current) {
      blocks.push(topicBlock(`${dateKey}:teoria:tema`, 'teoria', theory, current, subjects, false));
    } else if (theory > 0) {
      blocks.push({
        id: `${dateKey}:teoria:libre`,
        kind: 'teoria',
        minutes: theory,
        title: topics.length ? 'Temario al día: repaso libre' : 'Añade tus temas',
        method: topics.length ? 'Repaso libre' : 'Organiza el temario',
        steps: topics.length
          ? ['Repasa los temas que peor llevas.', 'Haz los tests con peor nota.']
          : ['Ve a Asignaturas y crea los temas de tu oposición.', 'Sube tus apuntes a cada tema.'],
      });
    }
  }

  const psico = minutesFor('psicotecnicos');
  if (psico >= MIN_BLOCK) {
    blocks.push({ id: `${dateKey}:psicotecnicos`, kind: 'psicotecnicos', minutes: psico, title: 'Psicotécnicos', ...rotation(PSICO_ROTATION, dateKey) });
  }

  const fisico = minutesFor('fisico');
  if (fisico >= MIN_BLOCK) {
    blocks.push({ id: `${dateKey}:fisico`, kind: 'fisico', minutes: fisico, title: 'Preparación física', ...rotation(FISICO_ROTATION, dateKey) });
  }

  let cursor = timeToMinutes(profile.startTime);
  return blocks.map((block) => {
    const start = minutesToTime(cursor);
    cursor += block.minutes + BREAK_MINUTES;
    return { ...block, start };
  });
}

/** Avance de un tema al terminar un bloque de estudio (sin test). */
export function advanceAfterStudy(topic: Topic, dateKey: string): Topic {
  const next: Topic = { ...topic, lastStudied: dateKey };
  if (topic.stage === 'pendiente') next.stage = 'esquema';
  else if (topic.stage === 'esquema') {
    next.stage = 'repaso';
    next.nextReview = dateKey;
  }
  return next;
}

/** Ajusta el tema según la nota del test: si fallas, vuelve pronto; si aciertas, se espacia. */
export function advanceAfterTest(topic: Topic, ratio: number, dateKey: string): Topic {
  const passed = ratio >= PASS_RATIO;
  const next: Topic = { ...topic, lastStudied: dateKey };
  if (!passed) {
    if (topic.stage === 'pendiente' || topic.stage === 'esquema') return next;
    next.stage = 'repaso';
    next.reviewCount = 0;
    next.nextReview = addDays(dateKey, 1);
    return next;
  }
  if (topic.stage === 'dominado') {
    next.reviewCount = Math.min(topic.reviewCount + 1, REVIEW_INTERVALS.length - 1);
  } else {
    next.stage = 'dominado';
    next.reviewCount = 0;
  }
  next.nextReview = addDays(dateKey, REVIEW_INTERVALS[next.reviewCount]);
  return next;
}

/** Simula los próximos días suponiendo que cumples el plan, para enseñar la previsión. */
export function projectDays(fromKey: string, days: number, state: PlanState): { date: string; blocks: DayBlock[] }[] {
  let topics = state.topics;
  const result: { date: string; blocks: DayBlock[] }[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(fromKey, i);
    const blocks = buildDay(date, { ...state, topics });
    result.push({ date, blocks });
    for (const block of blocks) {
      if (!block.topicId) continue;
      topics = topics.map((t) => {
        if (t.id !== block.topicId) return t;
        if (t.stage === 'repaso' || t.stage === 'dominado') return advanceAfterTest(t, 1, date);
        return advanceAfterStudy(t, date);
      });
    }
  }
  return result;
}

/** Temas por semana necesarios para acabar el temario una semana antes del examen. */
export function requiredPace(topics: Topic[], todayKeyValue: string, examDate?: string) {
  if (!examDate) return undefined;
  const remaining = topics.filter((t) => t.stage === 'pendiente' || t.stage === 'esquema').length;
  const days = Math.max(1, Math.round((fromKey(examDate).getTime() - fromKey(todayKeyValue).getTime()) / 86_400_000) - 7);
  return { remaining, daysLeft: days + 7, perWeek: Math.ceil((remaining / days) * 7 * 10) / 10 };
}
