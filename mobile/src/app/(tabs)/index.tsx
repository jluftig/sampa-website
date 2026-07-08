import { Newspaper } from 'lucide-react-native';

import { ScreenScaffold } from '@/components/screen-scaffold';

export default function NewsScreen() {
  return (
    <ScreenScaffold
      title="News"
      subtitle="The latest in addiction medicine for physician associates — articles and Key Points, built for reading on your phone."
      icon={Newspaper}
      badge="COMING IN PHASE 2"
    />
  );
}
