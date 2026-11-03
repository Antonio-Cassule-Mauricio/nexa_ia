import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-200">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Bullet items
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const itemText = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-blue-400 mt-1 text-xs">•</span>
              <div>{renderFormattedText(itemText)}</div>
            </div>
          );
        }

        // Numbered lists (1. , 2. )
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-blue-400 font-semibold text-xs mt-0.5">{numberedMatch[1]}.</span>
              <div>{renderFormattedText(numberedMatch[2])}</div>
            </div>
          );
        }

        // Blockquotes
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-2 border-blue-500/60 bg-blue-950/20 pl-3 py-1 italic text-slate-300 rounded-r text-xs">
              {renderFormattedText(trimmed.substring(2))}
            </blockquote>
          );
        }

        // Headers
        if (trimmed.startsWith('### ')) {
          return <h4 key={idx} className="font-semibold text-slate-100 text-sm mt-2">{renderFormattedText(trimmed.substring(4))}</h4>;
        }
        if (trimmed.startsWith('## ')) {
          return <h3 key={idx} className="font-bold text-slate-100 text-base mt-2">{renderFormattedText(trimmed.substring(3))}</h3>;
        }
        if (trimmed.startsWith('# ')) {
          return <h2 key={idx} className="font-bold text-blue-400 text-lg mt-3">{renderFormattedText(trimmed.substring(2))}</h2>;
        }

        // Regular paragraph
        return <p key={idx}>{renderFormattedText(line)}</p>;
      })}
    </div>
  );
};

function renderFormattedText(text: string) {
  // Simple bold and code formatting
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold **text**
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    // Inline code `code`
    const codeMatch = remaining.match(/`([^`]+)`/);

    let nextMatchIndex = -1;
    let matchType: 'bold' | 'code' | null = null;
    let matchLength = 0;
    let matchContent = '';

    if (boldMatch && boldMatch.index !== undefined) {
      nextMatchIndex = boldMatch.index;
      matchType = 'bold';
      matchLength = boldMatch[0].length;
      matchContent = boldMatch[1];
    }

    if (codeMatch && codeMatch.index !== undefined) {
      if (nextMatchIndex === -1 || codeMatch.index < nextMatchIndex) {
        nextMatchIndex = codeMatch.index;
        matchType = 'code';
        matchLength = codeMatch[0].length;
        matchContent = codeMatch[1];
      }
    }

    if (matchType && nextMatchIndex !== -1) {
      if (nextMatchIndex > 0) {
        parts.push(<span key={key++}>{remaining.substring(0, nextMatchIndex)}</span>);
      }

      if (matchType === 'bold') {
        parts.push(
          <strong key={key++} className="font-semibold text-white">
            {matchContent}
          </strong>
        );
      } else if (matchType === 'code') {
        parts.push(
          <code key={key++} className="px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 font-mono text-xs border border-slate-700">
            {matchContent}
          </code>
        );
      }

      remaining = remaining.substring(nextMatchIndex + matchLength);
    } else {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
  }

  return <>{parts}</>;
}
