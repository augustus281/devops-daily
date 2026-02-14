'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

const sponsors = [
  {
    name: 'DigitalOcean',
    logo: 'https://web-platforms.sfo2.cdn.digitaloceanspaces.com/WWW/Badge%202.svg',
    url: 'https://www.jdoqocy.com/click-101674709-15836238',
  },
  {
    name: 'DevDojo',
    logo: '/devdojo.svg?height=60&width=120',
    url: 'https://devdojo.com',
    className: 'h-5 w-auto fill-current text-red-500',
  },
];

interface GameSponsorsProps {
  className?: string;
}

/**
 * Slim, inline sponsor bar for game/simulator pages.
 * Placed below the game component, full width, minimal design.
 */
export function GameSponsors({ className }: GameSponsorsProps) {
  return (
    <div className={cn('w-full my-6', className)}>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-3 px-4 rounded-lg border border-border/30 bg-muted/20">
        <span className="text-xs text-muted-foreground">Supported by</span>
        {sponsors.map((sponsor) => (
          <Link
            key={sponsor.name}
            href={sponsor.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Image
              src={sponsor.logo || '/placeholder.svg'}
              alt={sponsor.name}
              width={60}
              height={24}
              className={cn('h-5 w-auto opacity-70 group-hover:opacity-100 transition-opacity', sponsor.className)}
            />
            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
          </Link>
        ))}
        <Link
          href="/sponsorship"
          className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          Become a sponsor
        </Link>
      </div>
    </div>
  );
}
