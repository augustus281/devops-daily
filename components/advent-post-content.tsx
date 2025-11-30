'use client';

import { parseMarkdown } from '@/lib/markdown';
import { CodeBlockWrapper } from '@/components/code-block-wrapper';
import { HeadingWrapper } from '@/components/heading-with-anchor';
import { SolutionReveal } from '@/components/advent-solution-reveal';

interface AdventPostContentProps {
  content: string;
}

export function AdventPostContent({ content }: AdventPostContentProps) {
  // Split content by the "## Solution" heading
  const solutionHeadingRegex = /^## Solution$/m;
  const parts = content.split(solutionHeadingRegex);

  // If there's no solution section, render normally
  if (parts.length === 1) {
    const htmlContent = parseMarkdown(content);
    return (
      <HeadingWrapper>
        <CodeBlockWrapper>
          <div
            className="prose prose-lg dark:prose-invert max-w-none
              prose-headings:scroll-mt-24
              prose-pre:bg-muted prose-pre:text-muted-foreground
              prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-sm
              prose-blockquote:border-l-primary prose-blockquote:bg-muted/10
              prose-img:rounded-lg prose-img:shadow-lg
              prose-a:text-primary hover:prose-a:text-primary/80 prose-a:transition-colors
              prose-strong:text-foreground
              prose-ul:list-disc prose-ol:list-decimal
              prose-table:overflow-hidden prose-table:rounded-lg prose-table:shadow
              prose-th:bg-muted prose-td:border-border"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </CodeBlockWrapper>
      </HeadingWrapper>
    );
  }

  // Split solution section from the rest
  const beforeSolution = parts[0];
  const solutionAndAfter = parts[1];

  // Find where the solution ends (next ## heading or end of content)
  const nextHeadingMatch = solutionAndAfter.match(/\n## /);
  const solutionContent = nextHeadingMatch
    ? solutionAndAfter.substring(0, nextHeadingMatch.index)
    : solutionAndAfter;
  const afterSolution = nextHeadingMatch
    ? solutionAndAfter.substring(nextHeadingMatch.index!)
    : '';

  // Parse each section
  const beforeHtml = parseMarkdown(beforeSolution);
  const solutionHtml = parseMarkdown('## Solution\n' + solutionContent);
  const afterHtml = afterSolution ? parseMarkdown(afterSolution) : '';

  return (
    <HeadingWrapper>
      <CodeBlockWrapper>
        {/* Content before solution */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none
            prose-headings:scroll-mt-24
            prose-pre:bg-muted prose-pre:text-muted-foreground
            prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-sm
            prose-blockquote:border-l-primary prose-blockquote:bg-muted/10
            prose-img:rounded-lg prose-img:shadow-lg
            prose-a:text-primary hover:prose-a:text-primary/80 prose-a:transition-colors
            prose-strong:text-foreground
            prose-ul:list-disc prose-ol:list-decimal
            prose-table:overflow-hidden prose-table:rounded-lg prose-table:shadow
            prose-th:bg-muted prose-td:border-border"
          dangerouslySetInnerHTML={{ __html: beforeHtml }}
        />

        {/* Solution section - wrapped in reveal */}
        <SolutionReveal title="View Solution">
          <div
            className="prose prose-lg dark:prose-invert max-w-none
              prose-headings:scroll-mt-24
              prose-pre:bg-muted prose-pre:text-muted-foreground
              prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-sm
              prose-blockquote:border-l-primary prose-blockquote:bg-muted/10
              prose-img:rounded-lg prose-img:shadow-lg
              prose-a:text-primary hover:prose-a:text-primary/80 prose-a:transition-colors
              prose-strong:text-foreground
              prose-ul:list-disc prose-ol:list-decimal
              prose-table:overflow-hidden prose-table:rounded-lg prose-table:shadow
              prose-th:bg-muted prose-td:border-border"
            dangerouslySetInnerHTML={{ __html: solutionHtml }}
          />
        </SolutionReveal>

        {/* Content after solution */}
        {afterHtml && (
          <div
            className="prose prose-lg dark:prose-invert max-w-none
              prose-headings:scroll-mt-24
              prose-pre:bg-muted prose-pre:text-muted-foreground
              prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-sm
              prose-blockquote:border-l-primary prose-blockquote:bg-muted/10
              prose-img:rounded-lg prose-img:shadow-lg
              prose-a:text-primary hover:prose-a:text-primary/80 prose-a:transition-colors
              prose-strong:text-foreground
              prose-ul:list-disc prose-ol:list-decimal
              prose-table:overflow-hidden prose-table:rounded-lg prose-table:shadow
              prose-th:bg-muted prose-td:border-border"
            dangerouslySetInnerHTML={{ __html: afterHtml }}
          />
        )}
      </CodeBlockWrapper>
    </HeadingWrapper>
  );
}
