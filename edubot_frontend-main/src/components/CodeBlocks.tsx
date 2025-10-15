import React, { useState, useMemo } from 'react';

interface Block {
  type: 'text' | 'code';
  content: string;
  lang?: string | null;
}

function parseFencedContent(content: string): Block[] {
  const parts: Block[] = [];
  const fenceRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fenceRegex.exec(content)) !== null) {
    const index = match.index;
    if (index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, index) });
    }

    parts.push({ type: 'code', lang: match[1] ?? null, content: match[2] });
    lastIndex = fenceRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) });
  }

  return parts;
}

export default function CodeBlocks({ content }: { content: string }) {
  const blocks = useMemo(() => parseFencedContent(content), [content]);

  return (
    <div className="space-y-4">
      {blocks.map((b, i) =>
        b.type === 'text' ? (
          <div key={i} className="whitespace-pre-wrap break-words leading-relaxed text-sm">
            {b.content}
          </div>
        ) : (
          <CodeBlock key={i} code={b.content} lang={b.lang ?? 'text'} />
        )
      )}
    </div>
  );
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const trimmed = code.replace(/\n+$/g, '');

  async function copy() {
    try {
      await navigator.clipboard.writeText(trimmed);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="relative bg-surface border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/10 text-xs">
        <div className="font-medium">{lang || 'text'}</div>
        <button
          onClick={copy}
          className="text-sm px-2 py-0.5 rounded-md bg-muted hover:bg-muted/80 transition-colors"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-auto text-sm bg-transparent"><code>{trimmed}</code></pre>
    </div>
  );
}
