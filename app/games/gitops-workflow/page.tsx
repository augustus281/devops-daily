import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/breadcrumb';
import { BreadcrumbSchema } from '@/components/schema-markup';
import GitOpsWorkflow from '@/components/games/gitops-workflow';
import { generateGameMetadata } from '@/lib/game-metadata';
import { getGameById } from '@/lib/games';
import { GameActions } from '@/components/games/game-actions';
import { SponsorSidebar } from '@/components/sponsor-sidebar';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('gitops-workflow');
}

export default async function GitOpsWorkflowPage() {
  const game = await getGameById('gitops-workflow');
  const gameTitle = game?.title || 'GitOps Workflow';

  const breadcrumbItems = [
    { label: 'Games', href: '/games' },
    { label: gameTitle, href: '/games/gitops-workflow', isCurrent: true },
  ];

  const schemaItems = [
    { name: 'Home', url: '/' },
    { name: 'Games', url: '/games' },
    { name: gameTitle, url: '/games/gitops-workflow' },
  ];

  return (
    <>
      <BreadcrumbSchema items={schemaItems} />
      <div className="container px-4 py-8 mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Breadcrumb items={breadcrumbItems} />
          <GameActions gameSlug="gitops-workflow" gameTitle={gameTitle} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-9">
            <GitOpsWorkflow />
          </div>
          <aside className="lg:col-span-3">
            <div className="sticky top-8">
              <SponsorSidebar />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
