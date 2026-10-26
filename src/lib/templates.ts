import type { Split } from './types';

export type OposicionTemplate = {
  id: string;
  name: string;
  description: string;
  split: Split;
  /** Asignaturas de partida. Son orientativas: cada temario cambia según la convocatoria. */
  subjects: string[];
};

export const TEMPLATES: OposicionTemplate[] = [
  {
    id: 'bombero-forestal',
    name: 'Bombero forestal',
    description: 'Mucho peso de la preparación física.',
    split: { teoria: 45, psicotecnicos: 15, fisico: 40 },
    subjects: [
      'Incendios forestales',
      'Medio natural y forestal',
      'Legislación',
      'Seguridad y primeros auxilios',
      'Herramientas y maquinaria',
    ],
  },
  {
    id: 'bombero',
    name: 'Bombero',
    description: 'Teoría, psicotécnicos y pruebas físicas exigentes.',
    split: { teoria: 45, psicotecnicos: 15, fisico: 40 },
    subjects: ['Legislación', 'Física y química', 'Construcción', 'Hidráulica', 'Callejero y geografía'],
  },
  {
    id: 'policia',
    name: 'Policía (Nacional o Local)',
    description: 'Teoría, psicotécnicos y pruebas físicas.',
    split: { teoria: 50, psicotecnicos: 20, fisico: 30 },
    subjects: ['Ciencias jurídicas', 'Ciencias sociales', 'Materias técnico-científicas', 'Ortografía'],
  },
  {
    id: 'guardia-civil',
    name: 'Guardia Civil',
    description: 'Teoría, psicotécnicos, idioma y físico.',
    split: { teoria: 50, psicotecnicos: 20, fisico: 30 },
    subjects: ['Constitución y derechos', 'Derecho penal', 'Materias socioculturales', 'Inglés', 'Ortografía'],
  },
  {
    id: 'administrativo',
    name: 'Administrativo / Auxiliar',
    description: 'Casi todo teoría y psicotécnicos.',
    split: { teoria: 80, psicotecnicos: 20, fisico: 0 },
    subjects: ['Constitución', 'Procedimiento administrativo', 'Función pública', 'Ofimática'],
  },
  {
    id: 'docente',
    name: 'Docente',
    description: 'Temario, programación y supuestos prácticos.',
    split: { teoria: 100, psicotecnicos: 0, fisico: 0 },
    subjects: ['Temario específico', 'Programación didáctica', 'Supuestos prácticos'],
  },
  {
    id: 'otra',
    name: 'Otra oposición',
    description: 'Empiezas de cero y la configuras a tu medida.',
    split: { teoria: 70, psicotecnicos: 20, fisico: 10 },
    subjects: [],
  },
];

export const SUBJECT_COLORS = ['#F2672A', '#1368CE', '#26890C', '#8E44AD', '#D89E00', '#E21B3C', '#00897B', '#5D6D7E'];
