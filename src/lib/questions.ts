import type { Question } from './types';

export type DraftQuestion = Omit<Question, 'id' | 'topicId'>;

/**
 * Lee preguntas pegadas como texto. Cada pregunta va separada por una línea en blanco:
 * la primera línea es el enunciado, las siguientes las opciones, y la correcta lleva un * al final.
 *
 *   ¿Cuál es la capital de España?
 *   a) Sevilla
 *   b) Madrid *
 *   c) Valencia
 */
export function parseQuestions(text: string): { questions: DraftQuestion[]; errors: string[] } {
  const questions: DraftQuestion[] = [];
  const errors: string[] = [];
  const chunks = text.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);
  chunks.forEach((chunk, i) => {
    const [first, ...rest] = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
    let correctIndex = -1;
    const options = rest.map((line, j) => {
      let option = line.replace(/^[a-dA-D1-4][).\-:]\s*/, '');
      if (/\*\s*$/.test(option)) {
        correctIndex = j;
        option = option.replace(/\s*\*\s*$/, '');
      }
      return option;
    });
    if (options.length < 2 || options.length > 4) {
      errors.push(`Pregunta ${i + 1}: necesita entre 2 y 4 opciones.`);
    } else if (correctIndex < 0) {
      errors.push(`Pregunta ${i + 1}: marca la respuesta correcta con un * al final.`);
    } else {
      questions.push({ text: first.replace(/^\d+[).\-]\s*/, ''), options, correctIndex });
    }
  });
  return { questions, errors };
}
