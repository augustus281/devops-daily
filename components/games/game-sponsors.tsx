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
    className: 'h-8 w-auto fill-current text-red-500',
  },
];

interface GameSponsorsProps {
  className?: string;
}

/**
 * Minimal, unobtrusive sponsor display for game/simulator pages.
 * Designed to match the clean aesthetic of game layouts.
 */
export function GameSponsors({ className }: GameSponsorsProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-xs text-muted-foreground">
        Supported by
      </p>
      <div className="space-y-2">
        {sponsors.map((sponsor) => (
          <Link
            key={sponsor.name}
            href={sponsor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 hover:border-border transition-colors"
          >
            <div className="h-8 flex items-center justify-center shrink-0">
              <Image
                src={sponsor.logo || '/placeholder.svg'}
                alt={sponsor.name}
                width={80}
                height={32}
                className={cn('h-6 w-auto', sponsor.className)}
              />
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              {sponsor.name}
            </span>
            <ExternalLink className="h-3 w-3 text-muted-foreground/50 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>
      <a
        href="/sponsorship"
        className="block text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
      >
        Become a sponsor →
      </a>
    </div>
  );
}
