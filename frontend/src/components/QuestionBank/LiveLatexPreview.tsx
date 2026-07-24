import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LiveLatexPreviewProps {
  content: string;
  examName: string;
  maxMarks: string;
  time: string;
  instructions: string[];
  examDate?: string;
  examSubject?: string;
  logoBase64?: string;
  isDoubleColumn?: boolean;
}

export const LiveLatexPreview: React.FC<LiveLatexPreviewProps> = ({
  content,
  examName,
  maxMarks,
  time,
  instructions,
  examDate = '',
  examSubject = '',
  logoBase64 = '',
  isDoubleColumn = false
}) => {
  const renderLatex = (text: string) => {
    try {
      let normalized = text.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
      normalized = normalized.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
      
      const parts = normalized.split(/(\$\$[\s\S]*?\$\$)/g);
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

  const parseBlocks = () => {
    const blocks = content.split(/\n\n+/).filter(b => b.trim() !== '');
    
    return blocks.map((block, idx) => {
      const hasOptions = block.includes('(A)') && block.includes('(B)') && block.includes('(C)') && block.includes('(D)');
      
      let renderHeading = null;
      let questionNumber = 0;
      const qNumMatch = block.match(/^(\d+)\./);
      if (qNumMatch) {
        questionNumber = parseInt(qNumMatch[1], 10);
        if (questionNumber === 1) renderHeading = "MATHEMATICS";
        if (questionNumber === 26) renderHeading = "PHYSICS";
        if (questionNumber === 51) renderHeading = "CHEMISTRY";
      }

      const blockContent = (
        <>
          {renderHeading && (
            <div className="w-full text-center my-3 break-before-auto">
              <h3 className="font-bold text-[13pt] underline underline-offset-4">{renderHeading}</h3>
            </div>
          )}
          {!hasOptions ? (
            <div 
              className="mb-2 break-inside-avoid text-[11pt]"
              dangerouslySetInnerHTML={{ __html: renderLatex(block.replace(/^(\d+)\.\s*/, '<strong>$1.</strong> &nbsp;&nbsp;')) }} 
            />
          ) : (
            (() => {
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

              const estimateVisualLength = (text: string) => {
                return text.replace(/\$|\\[a-zA-Z]+|{|}|_|\\/g, '').trim().length;
              };

              const sumLen = estimateVisualLength(optA) + estimateVisualLength(optB) + estimateVisualLength(optC) + estimateVisualLength(optD);
              const maxLen = Math.max(
                estimateVisualLength(optA), 
                estimateVisualLength(optB), 
                estimateVisualLength(optC), 
                estimateVisualLength(optD)
              );
              
              let optionsLayout = '';
              if (sumLen < 50 && maxLen < 15) {
                // 4 columns
                optionsLayout = 'grid grid-cols-4 gap-2 w-full';
              } else if (maxLen < 35) {
                // 2 columns
                optionsLayout = 'grid grid-cols-2 gap-y-1 gap-x-8 w-[85%]';
              } else {
                // 1 column
                optionsLayout = 'flex flex-col gap-y-1 w-full';
              }

              const formattedQText = questionText.replace(/^(\d+)\.\s*/, '<strong>$1.</strong> &nbsp;&nbsp;');

              return (
                <div className="mb-2 break-inside-avoid text-[11pt] leading-tight">
                  <div className="mb-1" dangerouslySetInnerHTML={{ __html: renderLatex(formattedQText) }} />
                  <div className={`ml-6 ${optionsLayout}`}>
                    <div className="flex"><span className="mr-1.5 font-medium">(A)</span> <span dangerouslySetInnerHTML={{ __html: renderLatex(optA) }} /></div>
                    <div className="flex"><span className="mr-1.5 font-medium">(B)</span> <span dangerouslySetInnerHTML={{ __html: renderLatex(optB) }} /></div>
                    <div className="flex"><span className="mr-1.5 font-medium">(C)</span> <span dangerouslySetInnerHTML={{ __html: renderLatex(optC) }} /></div>
                    <div className="flex"><span className="mr-1.5 font-medium">(D)</span> <span dangerouslySetInnerHTML={{ __html: renderLatex(optD) }} /></div>
                  </div>
                </div>
              );
            })()
          )}
        </>
      );
      return <React.Fragment key={idx}>{blockContent}</React.Fragment>;
    });
  };

  return (
    <div 
      className="bg-white text-black print:bg-white print:m-0 shadow-2xl print:shadow-none mx-auto border border-gray-300 print:border-none relative" 
      style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}
      id="a4-preview-paper"
    >
      <style>{`
        .katex-display {
          overflow-x: auto;
          overflow-y: hidden;
          max-width: 100%;
          margin: 0.5em 0 !important;
        }
        .katex {
          white-space: normal !important;
          word-break: break-word;
        }
        .katex-html {
          display: inline-flex !important;
          flex-wrap: wrap;
        }
      `}</style>
      <div className="p-6 font-serif">
        
        {/* Header Section */}
        <div className="mb-3 border-b-2 border-black pb-2">
          <div className="flex items-center justify-center relative mb-2">
            {logoBase64 && (
              <img 
                src={logoBase64} 
                alt="Logo" 
                className="absolute left-0 w-20 h-20 object-contain"
              />
            )}
            <div className="text-center">
              <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">SRI VENKATESWARA JY SCHOOL</h1>
              <h2 className="text-sm font-semibold mb-1">(IIT-JEE/NEET Foundation – Olympiads)</h2>
              <p className="text-xs">Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta</p>
            </div>
          </div>
          
          <div className="text-center mt-2 mb-2">
             <h3 className="text-lg font-bold uppercase">{examName || 'EXAMINATION'}</h3>
          </div>
          
          <div className="flex flex-col text-[11pt] font-medium mt-2 px-1 gap-1">
            <div className="flex justify-between items-center">
              <div><span className="font-bold">Subject:</span> {examSubject || '_______________'}</div>
              <div><span className="font-bold">Time:</span> {time || '3 Hours'}</div>
            </div>
            <div className="flex justify-between items-center">
              <div><span className="font-bold">Date:</span> {examDate || '___/___/20__'}</div>
            </div>
          </div>
        </div>

        {/* Instructions Section */}
        {instructions.length > 0 && (
          <div className="mb-3 text-[10pt] leading-snug break-inside-avoid">
            <h3 className="font-bold mb-1 uppercase underline underline-offset-2">General Instructions:</h3>
            <ul className="list-disc pl-5 m-0 space-y-0.5">
              {instructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Questions Section - Support Double Column */}
        <div className={isDoubleColumn ? "columns-2 gap-6" : ""}>
          {parseBlocks()}
        </div>

      </div>
    </div>
  );
};
