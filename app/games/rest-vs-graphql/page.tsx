import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/breadcrumb';
import { BreadcrumbSchema } from '@/components/schema-markup';
import RestVsGraphqlSimulator from '@/components/games/rest-vs-graphql-simulator';
import { generateGameMetadata } from '@/lib/game-metadata';
import { getGameById } from '@/lib/games';
import { GameActions } from '@/components/games/game-actions';
import { GameSponsors } from '@/components/games/game-sponsors';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('rest-vs-graphql');
}

export default async function RestVsGraphqlPage() {
  const game = await getGameById('rest-vs-graphql');
  const gameTitle = game?.title || 'REST API vs GraphQL Simulator';

  const breadcrumbItems = [
    { label: 'Games', href: '/games' },
    { label: gameTitle, href: '/games/rest-vs-graphql', isCurrent: true },
  ];

  const schemaItems = [
    { name: 'Home', url: '/' },
    { name: 'Games', url: '/games' },
    { name: gameTitle, url: '/games/rest-vs-graphql' },
  ];

  return (
    <>
      <BreadcrumbSchema items={schemaItems} />

      <div className="container px-4 py-8 mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Breadcrumb items={breadcrumbItems} />
          <GameActions gameSlug="rest-vs-graphql" gameTitle={gameTitle} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mx-auto max-w-7xl">
          {/* Main Content */}
          <div className="lg:col-span-9 flex flex-col">
          <h2 className="sr-only">
            REST API vs GraphQL - Interactive Comparison Simulator
          </h2>
          <RestVsGraphqlSimulator />
          </div>

          {/* Sponsor Sidebar */}
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
