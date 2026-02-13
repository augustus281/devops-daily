'use client';

import { useSearchParams } from 'next/navigation';
import { EmbedBadge } from '@/components/embed';
import { Suspense } from 'react';

interface EmbedClientProps {
  slug: string;
  title: string;
  GameComponent: React.ComponentType;
}

function EmbedContent({ slug, title, GameComponent }: EmbedClientProps) {
  const searchParams = useSearchParams();
  const theme = searchParams.get('theme') || 'dark';
  const hideTitle = searchParams.get('hideTitle') === 'true';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://devops-daily.com';
  const gameUrl = `${siteUrl}/games/${slug}`;

  return (
    <div
      className={`min-h-screen bg-background text-foreground ${theme === 'light' ? '' : 'dark'}`}
      data-theme={theme}
    >
      {/* Minimal header */}
      {!hideTitle && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
          <h1 className="text-sm font-semibold truncate">{title}</h1>
          <a
            href={gameUrl}
            target="_blank"
            rel="noopener"
            className="text-xs text-muted-foreground hover:text-primary transition-colors whitespace-nowrap ml-4"
          >
            View Full Version →
          </a>
        </div>
      )}

      {/* Game content */}
      <div className="p-4">
        <GameComponent />
      </div>

      {/* Attribution badge - always visible, cannot be removed */}
      <EmbedBadge gameSlug={slug} gameTitle={title} />
    </div>
  );
}

export function EmbedClient(props: EmbedClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <EmbedContent {...props} />
    </Suspense>
  );
}
