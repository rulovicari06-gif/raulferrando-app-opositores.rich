# Opositor Diario

App para opositores que organiza el día: qué estudiar, cómo estudiarlo y cuándo, con avisos, apuntes por tema y tests de repaso tipo concurso. Sirve para cualquier oposición; incluye plantillas de partida (bombero forestal, bombero, policía, Guardia Civil, administrativo, docente u otra a medida).

Funciona en iPhone, Android y en el navegador del ordenador. Está hecha con [Expo](https://expo.dev) (React Native) y Expo Router.

## Qué incluye esta primera versión

- **Bienvenida con frase motivadora** cada vez que abres la app, y frase del día en la pantalla Hoy.
- **Hoy**: los bloques del día (teoría, psicotécnicos y preparación física) con su hora, el método de estudio paso a paso y un temporizador.
- **Plan adaptable**: el plan se calcula cada día a partir del estado de tus temas. Cada tema pasa por primera lectura → esquema → repaso activo y test → dominado. Los temas dominados vuelven en repasos espaciados (1, 3, 7, 15, 30 y 60 días) y si fallas un test el tema vuelve al día siguiente. Si un día no cumples, lo pendiente pasa al siguiente. Con fecha de examen, te dice si llegas a tiempo.
- **Asignaturas y temas**, con documentos (PDF, fotos, apuntes) guardados en cada tema.
- **Test tipo Kahoot** por tema: cuenta atrás, cuatro colores, puntos por rapidez y rachas. Las preguntas se añaden una a una o pegando varias a la vez.
- **Progreso**: racha de días, nota media, temas dominados y minutos de los últimos 7 días.
- **Avisos** (en el móvil): frase motivadora antes de empezar y aviso al comienzo de cada bloque.

Los datos se guardan en el propio dispositivo. La sincronización entre móvil y ordenador es el siguiente paso.

## Probarla

```bash
npm install
npx expo start          # escanea el QR con la app Expo Go en el iPhone
npx expo start --web    # versión de ordenador en el navegador
```

## Desarrollo

```bash
npx tsc --noEmit        # comprobación de tipos
npx eslint src          # lint
npx expo export -p web  # genera la versión web en dist/
```

El código está en `src/`:

- `src/app/` pantallas (Expo Router): `(tabs)/` Hoy, Plan, Asignaturas y Progreso; `onboarding`, `ajustes`, `asignatura/[id]`, `tema/[id]`, `bloque/[id]` y `test/[id]`.
- `src/lib/plan.ts` lógica del plan adaptable y de la repetición espaciada.
- `src/lib/store.ts` datos de la app, guardados con AsyncStorage.
- `src/lib/notifications.ts` avisos programados para los próximos 7 días.
- `src/lib/documents.ts` subida y apertura de documentos (en el navegador se guardan en IndexedDB).
- `src/lib/quotes.ts` frases motivadoras.
