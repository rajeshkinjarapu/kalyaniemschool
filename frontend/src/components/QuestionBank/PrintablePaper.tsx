import React from 'react';
import { LaTeXPreview } from './LaTeXPreview';

interface Question {
  id: number;
  subject: string;
  chapter: string;
  topic: string;
  type: string;
  difficulty: string;
  questionText: string;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  correctAnswer: string;
  solution: string;
  marks: number;
  negativeMarks: number;
  imageUrl?: string | null;
}

interface Section {
  id: string;
  name: string;
  type: string;
  questions: Question[];
}

interface Paper {
  id: number;
  title: string;
  duration: number;
  totalMarks: number;
  instructions: string;
  examDate?: string | null;
  watermark?: string | null;
  paperCode?: string | null;
  sections: Section[];
  className?: string | null;
  instituteName?: string | null;
  subHeader1?: string | null;
  subHeader2?: string | null;
  logoUrl?: string | null;
}

interface PrintablePaperProps {
  paper: Paper;
  showSolutions?: boolean;
  showAnswerKey?: boolean;
  showOmr?: boolean;
  showWatermark?: boolean;
  isDoubleColumn?: boolean;
  optionLabelType?: 'ALPHA' | 'NUMERIC';
}

export const PrintablePaper: React.FC<PrintablePaperProps> = ({
  paper,
  showSolutions = false,
  showAnswerKey = false,
  showOmr = false,
  showWatermark = true,
  isDoubleColumn = false,
  optionLabelType = 'NUMERIC',
}) => {
  let absoluteQuestionCounter = 1;

  const formatCorrectAnswer = (ans: string) => {
    if (optionLabelType !== 'NUMERIC') return ans;
    return ans
      .replace(/A/g, '1')
      .replace(/B/g, '2')
      .replace(/C/g, '3')
      .replace(/D/g, '4');
  };

  return (
    <div className="bg-white text-black p-8 border border-slate-300 mx-auto max-w-[21cm] relative shadow-2xl font-serif text-[14px] leading-relaxed select-text print:p-0 print:border-none print:shadow-none">
      {/* Watermark */}
      {showWatermark && paper.watermark && (
        <div className="watermark-container pointer-events-none select-none">
          <div className="watermark-text fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 text-slate-100 font-extrabold text-7xl uppercase opacity-[0.06] tracking-wider text-center w-full z-0">
            {paper.watermark}
          </div>
        </div>
      )}

      {/* JEE Exam Booklet Header */}
      {!showSolutions && !showAnswerKey && (
        <div className="z-10 relative">
          {/* Customizable School Header Layout */}
          <div className="flex items-center gap-4 border-b-2 border-black pb-3 mb-3 font-sans text-black">
            {/* Round Logo Area */}
            <div className="w-[75px] h-[75px] border border-black rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden bg-white">
              {paper.logoUrl ? (
                <img src={paper.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <svg viewBox="0 0 100 100" className="w-full h-full text-black">
                  <circle cx="50" cy="50" r="47" fill="none" stroke="black" strokeWidth="1.2" />
                  <circle cx="50" cy="50" r="41" fill="none" stroke="black" strokeWidth="1" strokeDasharray="3,2" />
                  <polygon points="50,22 78,36 50,50 22,36" fill="none" stroke="black" strokeWidth="1.2" />
                  <line x1="50" y1="50" x2="50" y2="70" stroke="black" strokeWidth="1.5" />
                  <polygon points="42,70 58,70 50,78" fill="black" />
                  <text x="50" y="62" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">SVJY</text>
                </svg>
              )}
            </div>

            {/* School Details */}
            <div className="flex-1 text-center">
              <h1 className="text-xl md:text-2xl font-black tracking-wide uppercase leading-none text-black font-sans">
                {paper.instituteName || "SRI VENKATESWARA JY SCHOOL"}
              </h1>
              <div className="text-xs md:text-sm font-serif italic text-slate-800 leading-tight mt-1">
                {paper.subHeader1 !== undefined && paper.subHeader1 !== null ? paper.subHeader1 : "(IIT-JEE/NEET Foundation - Olympiads)"}
              </div>
              <div className="text-xs md:text-sm font-serif text-slate-700 leading-tight">
                {paper.subHeader2 !== undefined && paper.subHeader2 !== null ? paper.subHeader2 : "Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta"}
              </div>
            </div>
          </div>

          {/* Exam Title */}
          <div className="text-center mb-3">
            <h2 className="text-base font-extrabold font-serif uppercase tracking-wide border-y border-black py-1.5 text-black">
              {paper.title}
            </h2>
          </div>

          {/* Exam metadata grid (Class, Date, Marks, Duration) */}
          <div className="grid grid-cols-2 gap-y-1 mb-4 font-sans text-xs md:text-sm font-bold border-b border-black pb-2 text-black leading-tight">
            <div>Class – {paper.className || "6th A"}</div>
            <div className="text-right">Marks : {paper.totalMarks}</div>
            <div>Date : {paper.examDate || "04/07/2026"}</div>
            <div className="text-right">Duration : {paper.duration} Minutes &nbsp; {paper.paperCode && <span className="font-mono text-accentIndigo">({paper.paperCode})</span>}</div>
          </div>

          {/* Candidate Registration Block */}
          <div className="border border-black p-3 mb-6 font-sans text-xs grid grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">Candidate's Name:</span> _________________________________________________
            </div>
            <div>
              <span className="font-semibold">Roll Number:</span> _________________________________________________
            </div>
          </div>

          {/* Instructions Box */}
          <div className="border border-black p-4 mb-6 text-xs font-sans bg-slate-50/40">
            <h3 className="font-bold text-sm border-b border-black pb-1 mb-2">GENERAL INSTRUCTIONS</h3>
            <ul className="list-decimal pl-4 space-y-1.5 leading-relaxed">
              {paper.instructions
                .split('\n')
                .filter((item) => item.trim().length > 0)
                .map((item, idx) => (
                  <li key={idx}>
                    <LaTeXPreview text={item} />
                  </li>
                ))}
            </ul>
          </div>
          <div className="page-break" />
        </div>
      )}

      {/* Standard Question Booklet View */}
      {!showSolutions && !showAnswerKey && (
        <div className="z-10 relative">
          {paper.sections.map((section) => (
            <div key={section.id} className="mb-8">
              <h2 className="bg-slate-100 text-center font-bold font-sans text-sm p-1.5 uppercase border border-black tracking-wider mb-4">
                {section.name}
              </h2>

              {/* Question Layout (Double vs Single Column) */}
              <div className={isDoubleColumn ? "two-column-layout relative" : "space-y-4 relative"}>
                {section.questions.map((q) => {
                  const qNum = absoluteQuestionCounter++;
                  return (
                    <div key={q.id} className="question-block">
                      <div className="flex items-start">
                        <span className="font-sans font-bold text-xs bg-slate-100 border border-slate-350 rounded px-1.5 py-0.5 mr-2">
                          {qNum}.
                        </span>
                        <div className="flex-1">
                          <LaTeXPreview text={q.questionText} className="paper-serif font-serif text-[14px]" />
                        </div>
                      </div>

                      {/* Display Diagram if it exists */}
                      {q.imageUrl && (
                        <div className="my-3 flex justify-center max-w-full">
                          <img
                            src={q.imageUrl}
                            alt={`Diagram for Q.${qNum}`}
                            className="max-h-44 object-contain border border-slate-200 p-1 bg-white rounded"
                          />
                        </div>
                      )}

                      {/* Options Grid (with horizontal column alignment based on text length) */}
                      {q.type.startsWith('MCQ') && (
                        <div className={`${
                          ((q.optionA || '').length + (q.optionB || '').length + (q.optionC || '').length + (q.optionD || '').length) < 60
                            ? 'grid grid-cols-4 gap-2 mt-2 text-black'
                            : ((q.optionA || '').length + (q.optionB || '').length + (q.optionC || '').length + (q.optionD || '').length) < 120
                            ? 'grid grid-cols-2 gap-2 mt-2 text-black'
                            : 'flex flex-col gap-1.5 mt-2 text-black'
                        } font-sans text-xs mt-3`}>
                          <div className="question-option">
                            <span className="option-letter mr-1.5 font-bold">{optionLabelType === 'NUMERIC' ? '1.' : '(A)'}</span>
                            <LaTeXPreview text={q.optionA || ''} />
                          </div>
                          <div className="question-option">
                            <span className="option-letter mr-1.5 font-bold">{optionLabelType === 'NUMERIC' ? '2.' : '(B)'}</span>
                            <LaTeXPreview text={q.optionB || ''} />
                          </div>
                          <div className="question-option">
                            <span className="option-letter mr-1.5 font-bold">{optionLabelType === 'NUMERIC' ? '3.' : '(C)'}</span>
                            <LaTeXPreview text={q.optionC || ''} />
                          </div>
                          <div className="question-option">
                            <span className="option-letter mr-1.5 font-bold">{optionLabelType === 'NUMERIC' ? '4.' : '(D)'}</span>
                            <LaTeXPreview text={q.optionD || ''} />
                          </div>
                        </div>
                      )}

                      {q.type === 'NUMERICAL' && (
                        <div className="mt-2 text-slate-500 font-sans italic text-[11px]">
                          [Numerical Answer Type - Integer or Decimal value]
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OMR Grid Printout (JEE Hall Style) */}
      {showOmr && !showSolutions && !showAnswerKey && (
        <div className="page-break z-10 relative pt-6 font-sans">
          <div className="border-2 border-black p-6 rounded-xl">
            <h2 className="text-center font-bold text-lg mb-2 tracking-wider">OMR RESPONSE GRID</h2>
            <p className="text-center text-xs text-slate-500 mb-6">
              Use a blue/black ballpoint pen to fill in the response bubble completely.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {Array.from({ length: Math.ceil((absoluteQuestionCounter - 1) / 10) }).map((_, colIdx) => (
                <div key={colIdx} className="space-y-3">
                  <div className="grid grid-cols-5 text-center text-[10px] font-bold border-b border-black pb-1 mb-1">
                    <div>Q.No</div>
                    <div>(A)</div>
                    <div>(B)</div>
                    <div>(C)</div>
                    <div>(D)</div>
                  </div>
                  {Array.from({ length: 10 }).map((_, rowIdx) => {
                    const qNo = colIdx * 10 + rowIdx + 1;
                    if (qNo >= absoluteQuestionCounter) return null;
                    return (
                      <div key={qNo} className="grid grid-cols-5 items-center text-center text-xs">
                        <div className="font-bold text-slate-600 font-mono">{qNo}</div>
                        <div><span className="omr-bubble">A</span></div>
                        <div><span className="omr-bubble">B</span></div>
                        <div><span className="omr-bubble">C</span></div>
                        <div><span className="omr-bubble">D</span></div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Printable Answer Key Sheet */}
      {showAnswerKey && (
        <div className="z-10 relative font-sans">
          <h2 className="text-center font-bold text-lg border-b-2 border-black pb-2 mb-6">
            EXAM ANSWER KEY: {paper.title} ({paper.paperCode || 'SET A'})
          </h2>

          <div className="max-w-md mx-auto">
            <table className="w-full border-collapse border border-black text-center text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-black p-2 font-bold">Question Number</th>
                  <th className="border border-black p-2 font-bold">Subject</th>
                  <th className="border border-black p-2 font-bold">Correct Key</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let keyQCounter = 1;
                  return paper.sections.flatMap((section) =>
                    section.questions.map((q) => {
                      const curNum = keyQCounter++;
                      return (
                        <tr key={q.id}>
                          <td className="border border-black p-2 font-mono font-bold">{curNum}</td>
                          <td className="border border-black p-2 text-xs">{q.subject} - {q.chapter}</td>
                          <td className="border border-black p-2 font-bold text-emerald-600 text-base">
                            {formatCorrectAnswer(q.correctAnswer)}
                          </td>
                        </tr>
                      );
                    })
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Detailed Solutions Sheet */}
      {showSolutions && (
        <div className="z-10 relative font-sans">
          <h2 className="text-center font-bold text-lg border-b-2 border-black pb-2 mb-6 uppercase tracking-wider">
            Detailed Solutions: {paper.title}
          </h2>

          <div className="space-y-6">
            {(() => {
              let solQCounter = 1;
              return paper.sections.map((section) => (
                <div key={section.id}>
                  <h3 className="bg-slate-100 p-1.5 px-3 font-bold border-l-4 border-black text-sm uppercase mb-4">
                    {section.name} Solutions
                  </h3>
                  
                  <div className="space-y-6">
                    {section.questions.map((q) => {
                      const curNum = solQCounter++;
                      return (
                        <div key={q.id} className="border-b border-dashed border-slate-300 pb-4">
                          <div className="flex gap-2 items-start font-serif font-medium mb-2 text-[14px]">
                            <span className="font-sans font-bold text-xs bg-slate-900 text-white rounded px-1.5 py-0.5">
                              Q.{curNum}
                            </span>
                            <LaTeXPreview text={q.questionText} className="flex-1 inline-block" />
                          </div>

                          <div className="mb-2 text-xs text-slate-500">
                            Subject: <span className="font-semibold text-slate-700">{q.subject}</span> | 
                            Chapter: <span className="font-semibold text-slate-700">{q.chapter}</span> | 
                            Correct Value: <span className="font-bold text-emerald-600 font-mono text-sm">{formatCorrectAnswer(q.correctAnswer)}</span>
                          </div>

                          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm leading-relaxed">
                            <span className="font-bold text-slate-800">Explanation:</span>{' '}
                            <LaTeXPreview text={q.solution} className="mt-1" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
