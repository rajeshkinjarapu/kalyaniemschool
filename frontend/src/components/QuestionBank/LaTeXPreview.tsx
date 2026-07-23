import React from 'react';
import katex from 'katex';

interface LaTeXPreviewProps {
  text: string;
  className?: string;
}

export const LaTeXPreview: React.FC<LaTeXPreviewProps> = ({ text = '', className = '' }) => {
  // Parse text and render LaTeX equations enclosed in $...$ or $$...$$
  const renderLaTeX = (content: string) => {
    if (!content) return '';

    // Split text into text segments and math segments
    // Regex matches $$...$$ (group 1) or $...$ (group 2)
    const regex = /\$\$([\s\S]+?)\$\$|\$([\s\S]+?)\$/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    let keyCounter = 0;

    while ((match = regex.exec(content)) !== null) {
      // Add plain text before match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${keyCounter++}`}>
            {content.substring(lastIndex, match.index)}
          </span>
        );
      }

      const displayMath = match[1];
      const inlineMath = match[2];

      if (displayMath) {
        try {
          const html = katex.renderToString(displayMath, {
            displayMode: true,
            throwOnError: false,
          });
          parts.push(
            <div
              key={`math-block-${keyCounter++}`}
              dangerouslySetInnerHTML={{ __html: html }}
              className="my-2 overflow-x-auto text-center"
            />
          );
        } catch (e) {
          parts.push(
            <code key={`math-error-${keyCounter++}`} className="text-red-500">
              {match[0]}
            </code>
          );
        }
      } else if (inlineMath) {
        try {
          const html = katex.renderToString(inlineMath, {
            displayMode: false,
            throwOnError: false,
          });
          parts.push(
            <span
              key={`math-inline-${keyCounter++}`}
              dangerouslySetInnerHTML={{ __html: html }}
              className="inline-block whitespace-nowrap px-0.5"
            />
          );
        } catch (e) {
          parts.push(
            <code key={`math-error-${keyCounter++}`} className="text-red-500">
              {match[0]}
            </code>
          );
        }
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining plain text
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${keyCounter++}`}>
          {content.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  return (
    <div className={`latex-container break-words ${className}`}>
      {renderLaTeX(text)}
    </div>
  );
};
