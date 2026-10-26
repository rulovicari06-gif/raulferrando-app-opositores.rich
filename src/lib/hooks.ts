import { useMemo } from 'react';

import { buildDay } from './plan';
import { useData } from './store';
import type { DayBlock } from './types';

/**
 * Bloques de un día. Los ya terminados se muestran tal y como se hicieron,
 * aunque el tema haya avanzado de fase después.
 */
export function useDayBlocks(dateKey: string): DayBlock[] {
  const profile = useData((d) => d.profile);
  const subjects = useData((d) => d.subjects);
  const topics = useData((d) => d.topics);
  const completed = useData((d) => d.completed);

  return useMemo(() => {
    if (!profile) return [];
    return buildDay(dateKey, { profile, subjects, topics }).map((b) => completed[b.id]?.block ?? b);
  }, [dateKey, profile, subjects, topics, completed]);
}
