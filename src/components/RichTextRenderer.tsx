import React from 'react';

interface RichTextRendererProps {
  content: string;
  className?: string;
}

/**
 * Renders rich text content. 
 * Supports both:
 * - HTML content (new WYSIWYG format with <strong>, <em>, <u>, <h1>, <h2>, <ul>, <ol>)
 * - Legacy markdown-like syntax (**bold**, _italic_, __underline__, # H1, ## H2, • bullets, 1. lists)
 */
const RichTextRenderer = ({ content, className = '' }: RichTextRendererProps) => {
  if (!content) return null;

  // Check if content contains HTML tags (new format)
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);

  if (hasHtmlTags) {
    // Render HTML content directly
    return (
      <div 
        className={`
          text-sm font-light leading-relaxed text-foreground
          [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-1
          [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-2 [&_h2]:mb-1
          [&_ul]:list-disc [&_ul]:pl-5
          [&_ol]:list-decimal [&_ol]:pl-5
          [&_li]:py-0.5
          [&_u]:underline [&_u]:decoration-primary
          [&_strong]:font-bold
          [&_em]:italic
          ${className}
        `}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Legacy markdown-like content rendering
  const lines = content.split('\n');

  return (
    <div className={className}>
      {lines.map((line, index) => {
        // Skip photo markers - they're handled separately
        if (line.trim().match(/^\[photo:.+?\]$/)) {
          return null;
        }

        // H1 heading
        if (line.startsWith('# ')) {
          return (
            <h1 key={index} className="text-xl font-bold text-foreground mt-3 mb-1">
              {renderInlineFormatting(line.slice(2))}
            </h1>
          );
        }

        // H2 heading
        if (line.startsWith('## ')) {
          return (
            <h2 key={index} className="text-lg font-semibold text-foreground mt-2 mb-1">
              {renderInlineFormatting(line.slice(3))}
            </h2>
          );
        }

        // Bullet list
        if (line.startsWith('• ')) {
          return (
            <div key={index} className="flex items-start gap-2 py-0.5 text-sm font-light text-foreground">
              <span className="text-primary">•</span>
              <span>{renderInlineFormatting(line.slice(2))}</span>
            </div>
          );
        }

        // Numbered list
        const numberedMatch = line.match(/^(\d+)\.\s/);
        if (numberedMatch) {
          return (
            <div key={index} className="flex items-start gap-2 py-0.5 text-sm font-light text-foreground">
              <span className="text-primary min-w-[1.5rem]">{numberedMatch[1]}.</span>
              <span>{renderInlineFormatting(line.slice(numberedMatch[0].length))}</span>
            </div>
          );
        }

        // Task items (unchecked)
        if (line.startsWith('□ ')) {
          return (
            <div key={index} className="flex items-baseline gap-2 py-0.5">
              <span className="text-[20px] leading-none text-muted-foreground">□</span>
              <span className="text-sm font-light text-foreground">
                {renderInlineFormatting(line.slice(2))}
              </span>
            </div>
          );
        }

        // Task items (checked)
        if (line.startsWith('✓ ')) {
          return (
            <div key={index} className="flex items-baseline gap-2 py-0.5">
              <span className="text-[20px] leading-none text-primary">✓</span>
              <span className="text-sm font-light line-through text-muted-foreground">
                {renderInlineFormatting(line.slice(2))}
              </span>
            </div>
          );
        }

        // Regular paragraph
        return (
          <div key={index} className="text-sm font-light leading-relaxed text-foreground py-0.5">
            {line ? renderInlineFormatting(line) : <br />}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Render legacy inline formatting: **bold**, _italic_, __underline__
 */
function renderInlineFormatting(text: string): React.ReactNode {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      parts.push(<strong key={key++} className="font-bold">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Underline: __text__ (must check before italic)
    const underlineMatch = remaining.match(/^__(.+?)__/);
    if (underlineMatch) {
      parts.push(<u key={key++} className="underline decoration-primary">{underlineMatch[1]}</u>);
      remaining = remaining.slice(underlineMatch[0].length);
      continue;
    }

    // Italic: _text_
    const italicMatch = remaining.match(/^_(.+?)_/);
    if (italicMatch) {
      parts.push(<em key={key++} className="italic">{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Regular character
    const nextSpecial = remaining.search(/(\*\*|__|_)/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      // No match found for special chars at position 0, treat as regular
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

export default RichTextRenderer;