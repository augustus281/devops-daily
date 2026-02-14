import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/breadcrumb';
import { BreadcrumbSchema } from '@/components/schema-markup';
import DbmsSimulator from '@/components/games/dbms-simulator';
import { generateGameMetadata } from '@/lib/game-metadata';
import { getGameById } from '@/lib/games';
import { GameActions } from '@/components/games/game-actions';
import { GameSponsors } from '@/components/games/game-sponsors';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('dbms-simulator');
}

export default async function DbmsSimulatorPage() {
  const game = await getGameById('dbms-simulator');
  const gameTitle = game?.title || 'DBMS Simulator';

  const breadcrumbItems = [
    { label: 'Games', href: '/games' },
    { label: gameTitle, href: '/games/dbms-simulator', isCurrent: true },
  ];

  const schemaItems = [
    { name: 'Home', url: '/' },
    { name: 'Games', url: '/games' },
    { name: gameTitle, url: '/games/dbms-simulator' },
  ];

  return (
    <>
      <BreadcrumbSchema items={schemaItems} />
      <div className="container px-4 py-8 mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Breadcrumb items={breadcrumbItems} />
          <GameActions gameSlug="dbms-simulator" gameTitle={gameTitle} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-9">
            <DbmsSimulator />
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
