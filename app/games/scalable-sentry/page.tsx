import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/breadcrumb';
import { BreadcrumbSchema } from '@/components/schema-markup';
import ScalableSentry from '@/components/games/scalable-sentry';
import { generateGameMetadata } from '@/lib/game-metadata';
import { getGameById } from '@/lib/games';
import { GameActions } from '@/components/games/game-actions';
import { GameSponsors } from '@/components/games/game-sponsors';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('scalable-sentry');
}

export default async function ScalableSentryPage() {
  const game = await getGameById('scalable-sentry');
  const gameTitle = game?.title || 'Scalable Sentry';

  const breadcrumbItems = [
    { label: 'Games', href: '/games' },
    { label: gameTitle, href: '/games/scalable-sentry', isCurrent: true },
  ];

  const schemaItems = [
    { name: 'Home', url: '/' },
    { name: 'Games', url: '/games' },
    { name: gameTitle, url: '/games/scalable-sentry' },
  ];

  return (
    <>
      <BreadcrumbSchema items={schemaItems} />
      <div className="container px-4 py-8 mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Breadcrumb items={breadcrumbItems} />
          <GameActions gameSlug="scalable-sentry" gameTitle={gameTitle} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-9">
            <ScalableSentry />
          </div>
          <aside className="lg:col-span-3">
            <div className="sticky top-8">
              <GameSponsors />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
