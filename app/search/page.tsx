import type { Metadata } from 'next';
import { SearchPageClient } from '@/components/search-page-client';

export const metadata: Metadata = {
  title: 'Search | DevOps Daily',
  description: 'Search across all DevOps Daily content - posts, guides, quizzes, games, and more.',
  openGraph: {
    title: 'Search | DevOps Daily',
    description: 'Search across all DevOps Daily content - posts, guides, quizzes, games, and more.',
    type: 'website',
  },
};

export default function SearchPage() {
  return <SearchPageClient />;
}
