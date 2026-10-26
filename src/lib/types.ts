export type BlockKind = 'teoria' | 'psicotecnicos' | 'fisico';

/** Fase de estudio de un tema. Cada fase tiene un método distinto. */
export type TopicStage = 'pendiente' | 'esquema' | 'repaso' | 'dominado';

export type Split = Record<BlockKind, number>;

export type Profile = {
  name: string;
  oposicionId: string;
  oposicionName: string;
  /** Fecha del examen, AAAA-MM-DD. Opcional: puede que aún no haya convocatoria. */
  examDate?: string;
  /** Minutos de estudio por día de la semana, de domingo (0) a sábado (6). */
  minutesByWeekday: number[];
  /** Hora de inicio del estudio, "HH:MM". */
  startTime: string;
  /** Reparto del tiempo diario entre teoría, psicotécnicos y físico (suma 100). */
  split: Split;
  notificationsEnabled: boolean;
  createdAt: string;
};

export type Subject = {
  id: string;
  name: string;
  color: string;
  order: number;
};

export type Topic = {
  id: string;
  subjectId: string;
  title: string;
  order: number;
  stage: TopicStage;
  /** Número de repasos completados tras dominar el tema; marca el siguiente intervalo. */
  reviewCount: number;
  /** Próximo repaso, AAAA-MM-DD. */
  nextReview?: string;
  lastStudied?: string;
};

export type StudyDocument = {
  id: string;
  topicId: string;
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
  addedAt: string;
};

export type Question = {
  id: string;
  topicId: string;
  text: string;
  options: string[];
  correctIndex: number;
};

export type TestResult = {
  id: string;
  topicId: string;
  date: string;
  correct: number;
  total: number;
  points: number;
};

export type StudyLog = {
  id: string;
  date: string;
  kind: BlockKind;
  minutes: number;
  topicId?: string;
};

export type DayBlock = {
  id: string;
  kind: BlockKind;
  /** "HH:MM" */
  start: string;
  minutes: number;
  title: string;
  method: string;
  steps: string[];
  topicId?: string;
  /** Fase del tema en el momento de planificar el bloque. */
  stage?: TopicStage;
};
