"use client";

import * as React from "react";

/**
 * Renders basic Markdown (bold, paragraphs, numbered lists) as React nodes.
 * Safe: no raw HTML or dangerous patterns.
 */
export function SimpleMarkdown({ text }: { text: string }) {
  if (!text.trim()) return null;

  const lines = text.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  const flushList = () => {
    if (listItems.length === 0) return;
    elements.push(
      <ol key={elements.length} className="list-decimal list-inside space-y-1 my-2">
        {listItems.map((item, i) => (
          <li key={i}>
            <InlineMarkdown s={item} />
          </li>
        ))}
      </ol>
    );
    listItems = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const numbered = /^(\d+)\.\s+(.+)$/.exec(line);
    if (numbered) {
      listItems.push(numbered[2].trim());
      continue;
    }
    flushList();
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }
    elements.push(
      <p key={i} className="mb-2 last:mb-0">
        <InlineMarkdown s={line} />
      </p>
    );
  }
  flushList();

  return <div className="simple-markdown text-sm leading-relaxed">{elements}</div>;
}

/** Renders inline markdown: **bold** and plain text. */
function InlineMarkdown({ s }: { s: string }) {
  const parts: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(s)) !== null) {
    if (match.index > lastIndex) {
      parts.push(s.slice(lastIndex, match.index));
    }
    parts.push(<strong key={match.index} className="font-semibold">{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < s.length) parts.push(s.slice(lastIndex));
  return <>{parts.length > 0 ? parts : s}</>;
}
