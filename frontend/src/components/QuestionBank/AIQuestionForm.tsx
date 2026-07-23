import React, { useState } from 'react';
import { qbApi as api } from '../../utils/questionBankApi';
import { LaTeXPreview } from './LaTeXPreview';
import { Sparkles, AlertCircle, Loader2, Save, FileText, CheckCircle2 } from 'lucide-react';

interface AIQuestionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AIQuestionForm: React.FC<AIQuestionFormProps> = ({ onSuccess, onCancel }) => {
  const [inputText, setInputText] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingIndividual, setSavingIndividual] = useState<Record<number, boolean>>({});
  const [savedIndividual, setSavedIndividual] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);

  const handleParseAI = async () => {
    if (!inputText.trim()) {
      setError('Please paste some text to parse.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.parseQuestionsWithAI(inputText, subject);
      if (res.questions && res.questions.length > 0) {
        setParsedQuestions(res.questions);
        setSavedIndividual({});
      } else {
        setError('No questions could be extracted from the text.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to parse with AI');
    } finally {
      setLoading(false);
    }
  };

  const handleParseNormal = () => {
    if (!inputText.trim()) {
      setError('Please paste some text to parse.');
      return;
    }
    setError(null);
    try {
      // Split by numbers followed by dot (e.g. "1.", "51.")
      const blocks = inputText.split(/(?=^\s*(?:Q\.?\s*)?\d+\s*[\.\)]\s*)/m).filter(b => b.trim());
      const parsed = blocks.map(block => {
        const optMatch = block.match(/(?:\n|\s+)(?:1\.|A\)|a\))\s+/);
        let qText = block;
        let optionsStr = "";
        if (optMatch && optMatch.index !== undefined) {
            const idx = optMatch.index;
            qText = block.substring(0, idx).trim();
            optionsStr = block.substring(idx).trim();
        }

        // clean up Q number from qText
        qText = qText.replace(/^\s*(?:Q\.?\s*)?\d+\s*[\.\)]\s*/, '').trim();

        // extract options
        let opts = ["", "", "", ""];
        if (optionsStr) {
            const optParts = optionsStr.split(/(?:(?:1|2|3|4)\.|(?:A|B|C|D|a|b|c|d)\))/).filter(o => o.trim());
            for(let i=0; i<4 && i<optParts.length; i++){
                opts[i] = optParts[i].trim();
            }
        }

        return {
            subject,
            chapter: '',
            topic: '',
            type: 'MCQ_SINGLE',
            difficulty: 'Medium',
            questionText: qText,
            optionA: opts[0],
            optionB: opts[1],
            optionC: opts[2],
            optionD: opts[3],
            correctAnswer: 'A',
            solution: '',
            marks: 4,
            negativeMarks: -1
        };
      });

      if (parsed.length > 0) {
        setParsedQuestions(parsed);
        setSavedIndividual({});
      } else {
        setError('Could not extract questions. Please check the text format.');
      }
    } catch (e) {
      setError('Error parsing text manually.');
    }
  };

  const handleSaveAll = async () => {
    const toSave = parsedQuestions.filter((_, idx) => !savedIndividual[idx]);
    if (toSave.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await api.bulkCreateQuestions(toSave);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save questions in bulk');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSingle = async (idx: number, q: any) => {
    setSavingIndividual(prev => ({ ...prev, [idx]: true }));
    try {
      await api.createQuestion({ ...q, marks: Number(q.marks || 4), negativeMarks: Number(q.negativeMarks || -1) });
      setSavedIndividual(prev => ({ ...prev, [idx]: true }));
    } catch (err: any) {
      setError(err.message || 'Failed to save question ' + (idx + 1));
    } finally {
      setSavingIndividual(prev => ({ ...prev, [idx]: false }));
    }
  };

  return (
    <div className="w-full text-slate-900 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 backdrop-blur-md rounded-2xl p-6 border border-indigo-200 shadow-xl flex flex-col h-[calc(100vh-120px)]">
        <h2 className="text-xl font-bold mb-4 text-slate-900 drop-shadow-md flex items-center gap-2">
          <FileText className="text-indigo-500 w-6 h-6" />
          Smart Question Extractor
        </h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-slate-800">Preferred Subject</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-white/80 border border-indigo-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-white/50"
          >
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Botany">Botany</option>
            <option value="Zoology">Zoology</option>
          </select>
        </div>

        <div className="flex-1 flex flex-col mb-4">
          <label className="block text-sm font-medium mb-1 text-slate-800">Paste your questions or give instructions</label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="E.g. Create 3 physics questions from Electrostatics. OR Just paste raw text of questions."
            className="w-full flex-1 bg-white/80 border border-indigo-200 rounded-lg p-3 text-slate-900 font-sans focus:outline-none focus:border-indigo-400 resize-none shadow-inner"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-indigo-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white/80 hover:bg-white border border-indigo-200 text-slate-900 rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleParseNormal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 font-semibold text-white rounded-lg text-sm shadow-md transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Parse Standard Text
          </button>
          <button
            type="button"
            onClick={handleParseAI}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:brightness-110 font-bold text-slate-900 rounded-lg text-sm shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Processing...' : 'Parse with AI'}
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 backdrop-blur-md rounded-2xl p-6 border border-indigo-200 shadow-xl flex flex-col h-[calc(100vh-120px)] overflow-hidden">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
            Live Preview ({parsedQuestions.length} Questions)
          </h2>
          {parsedQuestions.length > 0 && parsedQuestions.some((_, i) => !savedIndividual[i]) && (
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save All Unsaved'}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
          {parsedQuestions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              Waiting for extraction...
            </div>
          ) : (
            parsedQuestions.map((q, idx) => {
              const isSaved = savedIndividual[idx];
              const isSaving = savingIndividual[idx];
              return (
              <div key={idx} className={`bg-white text-black p-6 rounded-xl border ${isSaved ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-300'} font-serif text-[15px] shadow-lg relative`}>
                
                {/* Individual Save Button */}
                <div className="absolute top-4 right-4">
                  {isSaved ? (
                    <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-100 px-2 py-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4" /> Saved
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSaveSingle(idx, q)}
                      disabled={isSaving}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1 shadow-sm disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Save Manually
                    </button>
                  )}
                </div>

                <div className="flex justify-between items-start text-xs border-b border-slate-200 pb-2 mb-4 font-sans text-slate-500 pr-24">
                  <div>SUBJECT: <span className="font-semibold text-indigo-700 uppercase">{q.subject}</span></div>
                  <div>CHAPTER: <span className="font-semibold text-slate-800 uppercase">{q.chapter || '—'}</span></div>
                  <div>TOPIC: <span className="font-semibold text-slate-800 uppercase">{q.topic || '—'}</span></div>
                </div>

                <div className="mb-4 leading-relaxed">
                  <span className="font-sans font-bold mr-2 text-[14px]">Q{idx + 1}.</span>
                  <LaTeXPreview text={q.questionText || ''} className="inline-block" />
                </div>

                {q.type?.startsWith('MCQ') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm font-sans">
                    {['A', 'B', 'C', 'D'].map((letter) => {
                      const optName = 'option' + letter;
                      const optionText = q[optName] || '';
                      return (
                        <div key={letter} className="flex items-start gap-2 p-1">
                          <span className="font-bold">({letter})</span>
                          <LaTeXPreview text={String(optionText)} />
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === 'NUMERICAL' && (
                  <div className="mt-4 p-2 px-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-500 font-sans">
                    [Numerical Value. Correct: <span className="font-mono font-bold text-black">{q.correctAnswer}</span>]
                  </div>
                )}

                <div className="mt-6 border-t border-slate-200 pt-4 font-sans">
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3 bg-slate-50 p-2 rounded border border-slate-200">
                    <div>Correct Key: <span className="font-bold text-emerald-600 font-mono text-[13px]">{q.correctAnswer}</span></div>
                    <div>Difficulty: <span className="font-bold text-slate-700">{q.difficulty}</span></div>
                    <div>Type: <span className="font-bold text-slate-700">{q.type}</span></div>
                  </div>

                  <div className="text-xs text-slate-700 bg-indigo-50/50 p-3 rounded border border-indigo-100 leading-relaxed">
                    <span className="font-bold text-indigo-800">Explanation:</span>{' '}
                    <LaTeXPreview text={q.solution || 'No explanation provided.'} className="mt-1" />
                  </div>
                </div>
              </div>
            )})
          )}
        </div>
      </div>
    </div>
  );
};
