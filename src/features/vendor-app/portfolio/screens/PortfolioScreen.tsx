import { ComingSoon } from '@/components';
import type { RootStackScreenProps } from '@/types/navigation';

export function PortfolioScreen(_props: RootStackScreenProps<'Portfolio'>) {
  return (
    <ComingSoon
      title="Portfolio"
      bullets={[
        '3-column photo grid',
        "Add photos via expo-image-picker → public 'portfolio' bucket",
        'Caption + category tag, long-press to delete',
      ]}
      hooks={['useMyPortfolio()', 'useAddPortfolioItem()', 'useDeletePortfolioItem()']}
    />
  );
}
