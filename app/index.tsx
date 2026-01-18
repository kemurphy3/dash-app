import { Redirect } from 'expo-router';
import { useAppStore } from '../src/stores/appStore';

export default function Index() {
  const settings = useAppStore(state => state.settings);
  
  if (settings.hasCompletedOnboarding) {
    return <Redirect href="/(main)/today" />;
  }
  
  return <Redirect href="/(onboarding)/welcome" />;
}
