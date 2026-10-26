import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { useData } from '@/lib/store';

export default function TabLayout() {
  const hasProfile = useData((d) => Boolean(d.profile));
  if (!hasProfile) return <Redirect href="/onboarding" />;
  return <AppTabs />;
}
