import { Bookmark } from 'lucide-react-native';

import { ScreenScaffold } from '@/components/screen-scaffold';

export default function SavedScreen() {
  return (
    <ScreenScaffold
      title="Saved"
      subtitle="Articles you save here sync with the website, so your reading list follows you everywhere."
      icon={Bookmark}
      badge="COMING IN PHASE 2"
    />
  );
}
