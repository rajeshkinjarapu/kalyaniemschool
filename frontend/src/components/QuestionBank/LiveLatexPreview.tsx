import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LiveLatexPreviewProps {
  content: string;
  schoolName: string;
  examName: string;
  maxMarks: string;
  time: string;
  instructions: string[];
}

export const LiveLatexPreview: React.FC<LiveLatexPreviewProps> = ({
  content,
  schoolName,
  examName,
  maxMarks,
  time,
  instructions
}) => {
  // Utility to render LaTeX string into HTML string safely
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

  // Smart Parser for Questions & Options
  const parseBlocks = () => {
    const blocks = content.split(/\n\n+/).filter(b => b.trim() !== '');
    
    return blocks.map((block, idx) => {
      // Check if block contains standard options (A), (B), (C), (D)
      const hasOptions = block.includes('(A)') && block.includes('(B)') && block.includes('(C)') && block.includes('(D)');
      
      if (!hasOptions) {
        // Just a normal text block or question without standard options
        return (
          <div 
            key={idx} 
            className="mb-4 break-inside-avoid text-[12pt]"
            dangerouslySetInnerHTML={{ __html: renderLatex(block) }} 
          />
        );
      }

      // It's a question with options. Let's parse it carefully.
      // We assume format:
      // Question text
      // (A) Option A (B) Option B (C) Option C (D) Option D (can be on same or different lines)
      const optARegex = /\(A\)\s*(.*?)(?=\(B\)|$)/s;
      const optBRegex = /\(B\)\s*(.*?)(?=\(C\)|$)/s;
      const optCRegex = /\(C\)\s*(.*?)(?=\(D\)|$)/s;
      const optDRegex = /\(D\)\s*(.*)/s;

      const splitIndexA = block.indexOf('(A)');
      const questionText = block.substring(0, splitIndexA).trim();
      const optionsText = block.substring(splitIndexA);

      const matchA = optionsText.match(optARegex);
      const matchB = optionsText.match(optBRegex);
      const matchC = optionsText.match(optCRegex);
      const matchD = optionsText.match(optDRegex);

      const optA = matchA ? matchA[1].trim() : '';
      const optB = matchB ? matchB[1].trim() : '';
      const optC = matchC ? matchC[1].trim() : '';
      const optD = matchD ? matchD[1].trim() : '';

      // Strip common LaTeX symbols to estimate visual length
      const estimateVisualLength = (text: string) => {
        return text.replace(/\$|\\[a-zA-Z]+|{|}|_|\\/g, '').trim().length;
      };

      const maxLen = Math.max(
        estimateVisualLength(optA), 
        estimateVisualLength(optB), 
        estimateVisualLength(optC), 
        estimateVisualLength(optD)
      );
      
      let optionsLayout = '';
      if (maxLen < 15) {
        // Short: 4 columns, strict alignment
        optionsLayout = 'grid grid-cols-4 gap-2 w-full';
      } else if (maxLen < 45) {
        // Medium: 2 columns, strict alignment
        optionsLayout = 'grid grid-cols-2 gap-y-2 gap-x-4 w-full pr-8';
      } else {
        // Long: 1 column, strict alignment
        optionsLayout = 'grid grid-cols-1 gap-y-2 w-full';
      }

      return (
        <div key={idx} className="mb-4 break-inside-avoid text-[12pt] leading-snug">
          {/* Question Text */}
          <div className="mb-2" dangerouslySetInnerHTML={{ __html: renderLatex(questionText) }} />
          
          {/* Options Box - align under question text */}
          <div className={`ml-6 ${optionsLayout}`}>
            <div className="flex"><span className="mr-2 font-medium">(A)</span> <span dangerouslySetInnerHTML={{ __html: renderLatex(optA) }} /></div>
            <div className="flex"><span className="mr-2 font-medium">(B)</span> <span dangerouslySetInnerHTML={{ __html: renderLatex(optB) }} /></div>
            <div className="flex"><span className="mr-2 font-medium">(C)</span> <span dangerouslySetInnerHTML={{ __html: renderLatex(optC) }} /></div>
            <div className="flex"><span className="mr-2 font-medium">(D)</span> <span dangerouslySetInnerHTML={{ __html: renderLatex(optD) }} /></div>
          </div>
        </div>
      );
    });
  };

  return (
    <div 
      className="bg-white text-black print:bg-white print:m-0 shadow-2xl print:shadow-none mx-auto border border-gray-300 print:border-none relative" 
      style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}
      id="a4-preview-paper"
    >
      <div className="p-8 font-serif">
        
        {/* Header Section - No extra top margin */}
        <div className="text-center mb-4 border-b-2 border-black pb-3">
          <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">{schoolName || 'SCHOOL NAME'}</h1>
          <h2 className="text-xl font-semibold mb-2">{examName || 'EXAMINATION'}</h2>
          <div className="flex justify-between items-center text-sm font-medium">
            <div><span className="font-bold">Time:</span> {time || '3 Hours'}</div>
            <div><span className="font-bold">Max. Marks:</span> {maxMarks || '100'}</div>
          </div>
        </div>

        {/* Instructions Section */}
        {instructions.length > 0 && (
          <div className="mb-5 text-[11pt] leading-tight break-inside-avoid">
            <h3 className="font-bold mb-1 uppercase underline underline-offset-2">General Instructions:</h3>
            <ul className="list-disc pl-5 m-0 space-y-0.5">
              {instructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Dynamic Content rendered with KaTeX and Smart Parser */}
        <div className="w-full">
          {parseBlocks()}
        </div>

      </div>

      {/* Footer / Page Numbering (Relies on browser for print, but we can add a visual one for web) */}
      {/* Note: In actual printing, @page CSS handles numbering better if headers/footers are enabled in print dialog. */}
    </div>
  );
};
