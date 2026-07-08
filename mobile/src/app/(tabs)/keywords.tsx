import { Tags } from 'lucide-react-native';

import { ScreenScaffold } from '@/components/screen-scaffold';

export default function KeywordsScreen() {
  return (
    <ScreenScaffold
      title="Keywords"
      subtitle="Search the Key Points database by keyword — the quick-reference index across every article."
      icon={Tags}
      badge="COMING IN PHASE 2"
    />
  );
}
