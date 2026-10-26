/** Frases para empezar el día. Escritas para opositores, sin atribuir a nadie. */
export const QUOTES = [
  'Cada tema que estudias hoy es una pregunta menos que te podrá sorprender el día del examen.',
  'No tienes que ser el mejor del mundo. Solo tienes que ser hoy un poco mejor que ayer.',
  'La plaza no se gana el día del examen: se gana en días como hoy.',
  'Estudiar cansado también cuenta. Lo que no cuenta es no empezar.',
  'Hoy no hace falta motivación. Hace falta abrir el libro.',
  'Los que aprueban también tuvieron días malos. Simplemente no se rindieron en ellos.',
  'Un día flojo no arruina tu preparación. Abandonar, sí.',
  'Piensa en el día que leas tu nombre en la lista. Hoy trabajas para ese momento.',
  'La constancia gana a la inteligencia cuando la inteligencia no es constante.',
  'No compares tu capítulo 3 con el capítulo 20 de otro opositor.',
  'Repasar no es perder el tiempo: es asegurar lo que ya has ganado.',
  'Cada minuto que entrenas hoy es un segundo menos en la prueba física.',
  'El cansancio de hoy es el orgullo de mañana.',
  'Si hoy solo puedes hacer la mitad, haz la mitad. Pero hazla.',
  'Nadie ve las horas que estudias, pero el resultado lo verán todos.',
  'Una oposición es una carrera de fondo. Tu ritmo es el correcto si no te paras.',
  'Hoy toca sumar. Aunque sea poco, suma.',
  'Lo difícil no es estudiar un día: es estudiar el siguiente. Y aquí estás.',
  'Tu yo del futuro, el que ya tiene la plaza, te está dando las gracias.',
  'Equivocarte en un test hoy es la mejor forma de acertar en el examen.',
  'La disciplina es elegir lo que quieres de verdad por encima de lo que te apetece ahora.',
  'No esperes a sentirte preparado. Prepárate y te sentirás así.',
  'Cada error que corriges hoy es un punto que no regalas mañana.',
  'Descansar también es parte del plan. Rendirse no.',
  'El temario es largo, pero se termina de la misma forma: tema a tema.',
  'Tienes más capacidad de la que crees. Hoy vas a demostrártelo.',
  'El examen no sabe cuántas veces dudaste. Solo sabe cuánto trabajaste.',
  'Empieza por lo que más te cuesta: lo demás parecerá fácil.',
  'Hoy eres un día más constante que la mayoría de quienes lo dejaron.',
  'Que tu motivo para empezar sea más fuerte que tus excusas para parar.',
  'Pequeños avances cada día terminan siendo una plaza.',
];

/** La frase cambia cada día y es la misma durante todo el día. */
export function quoteOfTheDay(date = new Date()): string {
  const start = new Date(date.getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((date.getTime() - start) / 86_400_000);
  return QUOTES[(dayOfYear + date.getFullYear()) % QUOTES.length];
}
