import { Heart, MessageCircle, Star, Trophy, UsersRound } from 'lucide-react';
import { ComingSoon } from '@/components/ComingSoon';
import { PageHeader } from '@/components/PageHeader';

export default function CommunityPage() {
  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Travel together"
        description="Share stories, find honest reviews and plan trips with friends."
      />
      <ComingSoon
        phase={5}
        features={[
          {
            icon: Heart,
            title: 'Travel feed',
            description: 'Photos, trip recaps and stories from people you follow.',
          },
          {
            icon: Star,
            title: 'Reviews',
            description: 'Ratings and photos on every place.',
          },
          {
            icon: UsersRound,
            title: 'Group trips',
            description: 'Live shared itineraries and voting on places.',
          },
          {
            icon: MessageCircle,
            title: 'Trip chat',
            description: 'One chat per trip for everyone going.',
          },
          {
            icon: Trophy,
            title: 'Friends leaderboard',
            description: 'Compare XP and countries with friends.',
          },
        ]}
      />
    </>
  );
}
