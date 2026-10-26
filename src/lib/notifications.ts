import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { fromKey, timeToMinutes, todayKey } from './dates';
import { projectDays, type PlanState } from './plan';
import { quoteOfTheDay } from './quotes';

const DAYS_AHEAD = 7;
const KIND_EMOJI = { teoria: '📚', psicotecnicos: '🧩', fisico: '🏃' } as const;

export const notificationsSupported = Platform.OS !== 'web';

if (notificationsSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('plan', {
      name: 'Plan de estudio',
      // eslint-disable-next-line import/namespace -- el enum se reexporta y la regla no lo detecta
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

function at(dateKey: string, time: string): Date {
  const date = fromKey(dateKey);
  const minutes = timeToMinutes(time);
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
}

/**
 * Vuelve a programar los avisos de los próximos días: una frase motivadora antes de empezar
 * y un aviso al comienzo de cada bloque. Se llama cada vez que cambia el plan.
 */
export async function rescheduleNotifications(state: PlanState) {
  if (!notificationsSupported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!state.profile.notificationsEnabled) return;
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;

  const now = Date.now();
  const days = projectDays(todayKey(), DAYS_AHEAD, state);
  for (const { date, blocks } of days) {
    if (!blocks.length) continue;
    const first = at(date, blocks[0].start);
    const morning = new Date(first.getTime() - 15 * 60_000);
    const jobs: { when: Date; title: string; body: string }[] = [
      { when: morning, title: 'Buenos días, opositor 💪', body: quoteOfTheDay(fromKey(date)) },
      ...blocks.map((b) => ({
        when: at(date, b.start),
        title: `${KIND_EMOJI[b.kind]} Empieza: ${b.title}`,
        body: `${b.method} · ${b.minutes} min`,
      })),
    ];
    for (const job of jobs) {
      if (job.when.getTime() <= now) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: job.title, body: job.body, sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: job.when, channelId: 'plan' },
      });
    }
  }
}
