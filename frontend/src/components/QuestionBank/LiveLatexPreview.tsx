import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LiveLatexPreviewProps {
  content: string;
  schoolName: string;
  examName: string;
  maxMarks: string;
  time: string;
}

export const LiveLatexPreview: React.FC<LiveLatexPreviewProps> = ({
  content,
  schoolName,
  examName,
  maxMarks,
  time
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const rawText = content;
      
      const renderLatex = (text: string) => {
        try {
          const parts = text.split(/(\$\$[\s\S]*?\$\$)/g);
          
          return parts.map(part => {
            if (part.startsWith('$$') && part.endsWith('$$')) {
              const math = part.slice(2, -2);
              return katex.renderToString(math, { displayMode: true, throwOnError: false });
            }
            
            const inlineParts = part.split(/(\$[\s\S]*?\$)/g);
            return inlineParts.map(inlinePart => {
              if (inlinePart.startsWith('$') && inlinePart.endsWith('$')) {
                const math = inlinePart.slice(1, -1);
                return katex.renderToString(math, { displayMode: false, throwOnError: false });
              }
              return inlinePart.replace(/\n/g, '<br/>');
            }).join('');
          }).join('');
        } catch (e) {
          console.error("KaTeX Error", e);
          return text.replace(/\n/g, '<br/>');
        }
      };

      contentRef.current.innerHTML = renderLatex(rawText);
    }
  }, [content]);

  return (
    <div className="bg-white text-black print:bg-white print:m-0 w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none mx-auto border border-gray-300 print:border-none relative overflow-hidden" id="a4-preview-paper">
      <div className="p-10 font-serif">
        
        {/* Header Section */}
        <div className="text-center mb-6 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">{schoolName || 'SCHOOL NAME'}</h1>
          <h2 className="text-xl font-semibold mb-3">{examName || 'EXAMINATION'}</h2>
          <div className="flex justify-between items-center text-sm font-medium">
            <div><span className="font-bold">Time:</span> {time || '3 Hours'}</div>
            <div><span className="font-bold">Max. Marks:</span> {maxMarks || '100'}</div>
          </div>
        </div>

        {/* Dynamic Content rendered with KaTeX */}
        <div 
          ref={contentRef} 
          className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2"
          style={{ fontSize: '14px', lineHeight: '1.6' }}
        >
        </div>

      </div>
    </div>
  );
};
