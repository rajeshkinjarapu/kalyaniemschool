import React, { useState, useEffect } from 'react';
import { qbApi as api } from '../../utils/questionBankApi';
import { LaTeXPreview } from './LaTeXPreview';
import { Upload, X, Check, AlertCircle } from 'lucide-react';

interface QuestionFormProps {
  questionId?: number | null; // Null means creating
  initialData?: any | null; // Prefilled parsed question data
  onSuccess: () => void;
  onCancel: () => void;
}

export const QuestionForm: React.FC<QuestionFormProps> = ({ questionId, initialData, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    subject: initialData?.subject || 'Physics',
    chapter: initialData?.chapter || '',
    topic: initialData?.topic || '',
    type: initialData?.type || 'MCQ_SINGLE',
    difficulty: initialData?.difficulty || 'Medium',
    questionText: initialData?.questionText || '',
    optionA: initialData?.optionA || '',
    optionB: initialData?.optionB || '',
    optionC: initialData?.optionC || '',
    optionD: initialData?.optionD || '',
    correctAnswer: initialData?.correctAnswer || 'A',
    solution: initialData?.solution || '',
    marks: initialData?.marks !== undefined ? initialData.marks : 4,
    negativeMarks: initialData?.negativeMarks !== undefined ? initialData.negativeMarks : -1,
    imageUrl: initialData?.imageUrl || '',
    tags: initialData?.tags || '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{ chapters: string[]; topics: string[] }>({ chapters: [], topics: [] });

  // Load existing metadata for suggestions (chapters, topics)
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await api.getQuestionMeta();
        const currentMeta = res.meta[formData.subject] || { chapters: [], topics: [] };
        setSuggestions(currentMeta);
      } catch (err) {
        console.error('Error loading meta suggestions:', err);
      }
    };
    fetchMeta();
  }, [formData.subject]);

  // Load question data if editing
  useEffect(() => {
    if (questionId) {
      const fetchQuestion = async () => {
        setLoading(true);
        try {
          const res = await api.getQuestion(questionId);
          const q = res.question;
          setFormData({
            subject: q.subject,
            chapter: q.chapter,
            topic: q.topic,
            type: q.type,
            difficulty: q.difficulty,
            questionText: q.questionText,
            optionA: q.optionA || '',
            optionB: q.optionB || '',
            optionC: q.optionC || '',
            optionD: q.optionD || '',
            correctAnswer: q.correctAnswer,
            solution: q.solution,
            marks: q.marks,
            negativeMarks: q.negativeMarks,
            imageUrl: q.imageUrl || '',
            tags: q.tags || '',
          });
        } catch (err: any) {
          setError(err.message || 'Failed to load question details');
        } finally {
          setLoading(false);
        }
      };
      fetchQuestion();
    }
  }, [questionId]);

  // Sync default correct answer format based on question type
  useEffect(() => {
    if (questionId) return; // Don't reset if editing
    if (formData.type === 'MCQ_SINGLE') {
      setFormData((prev) => ({ ...prev, correctAnswer: 'A' }));
    } else if (formData.type === 'MCQ_MULTI') {
      setFormData((prev) => ({ ...prev, correctAnswer: 'A' }));
    } else if (formData.type === 'NUMERICAL') {
      setFormData((prev) => ({ ...prev, correctAnswer: '0' }));
    }
  }, [formData.type, questionId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handles multi-correct answer toggles (e.g. A, C)
  const handleMultiAnswerToggle = (option: string) => {
    let answers = formData.correctAnswer.split(',').map((x: string) => x.trim()).filter(Boolean);
    if (answers.includes(option)) {
      answers = answers.filter((a: string) => a !== option);
    } else {
      answers.push(option);
    }
    setFormData((prev) => ({
      ...prev,
      correctAnswer: answers.sort().join(','),
    }));
  };

  // Image Upload Handle
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return;
    setUploadingImage(true);
    try {
      const res = await api.uploadImage(imageFile);
      setFormData((prev) => ({ ...prev, imageUrl: res.imageUrl }));
      setImageFile(null);
    } catch (err: any) {
      setError('Image upload failed. Make sure server is online.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let finalData = { ...formData };
      if (imageFile) {
        // Automatically upload image first if selected
        const uploadRes = await api.uploadImage(imageFile);
        finalData.imageUrl = uploadRes.imageUrl;
      }

      if (questionId) {
        await api.updateQuestion(questionId, finalData);
      } else {
        await api.createQuestion(finalData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  if (loading && questionId) {
    return <div className="text-white text-center py-10">Loading question details...</div>;
  }

  return (
    <div className="w-full text-white grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Edit Form */}
      <div className="bg-gradient-to-br from-indigo-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
        <h2 className="text-xl font-bold mb-6 text-white drop-shadow-md">
          {questionId ? 'Edit Question' : 'Create New Question'}
        </h2>

        {error && (
          <div className="mb-4 bg-red-900/50 border border-red-500/50 text-red-200 p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Subject</label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-600"
              >
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Difficulty</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-600"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Chapter</label>
              <input
                type="text"
                name="chapter"
                value={formData.chapter}
                onChange={handleChange}
                list="chapters-list"
                placeholder="e.g. Electrostatics"
                required
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-600"
              />
              <datalist id="chapters-list">
                {suggestions.chapters.map((ch) => (
                  <option key={ch} value={ch} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Topic</label>
              <input
                type="text"
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                list="topics-list"
                placeholder="e.g. Coulomb's Law"
                required
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-600"
              />
              <datalist id="topics-list">
                {suggestions.topics.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Question Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-600"
            >
              <option value="MCQ_SINGLE">MCQ (Single Correct)</option>
              <option value="MCQ_MULTI">MCQ (Multi Correct)</option>
              <option value="NUMERICAL">Numerical/Integer Type</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-300">
                Question Text <span className="text-slate-500 font-mono text-xs">(supports $math$ and $$math$$)</span>
              </label>
            </div>
            <textarea
              name="questionText"
              rows={4}
              value={formData.questionText}
              onChange={handleChange}
              required
              placeholder="Type question statement here. Use LaTeX for math. E.g. Find the value of $\int x^2 dx$."
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-white font-sans focus:outline-none focus:border-indigo-600 resize-y"
            />
          </div>

          {/* MCQ Options Fields */}
          {formData.type.startsWith('MCQ') && (
            <div className="space-y-3 p-4 bg-slate-900/30 rounded-xl border border-slate-700/40">
              <h3 className="text-sm font-semibold text-slate-300">Multiple Choice Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Option A</label>
                  <input
                    type="text"
                    name="optionA"
                    value={formData.optionA}
                    onChange={handleChange}
                    required={formData.type.startsWith('MCQ')}
                    placeholder="LaTeX math allowed"
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Option B</label>
                  <input
                    type="text"
                    name="optionB"
                    value={formData.optionB}
                    onChange={handleChange}
                    required={formData.type.startsWith('MCQ')}
                    placeholder="LaTeX math allowed"
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Option C</label>
                  <input
                    type="text"
                    name="optionC"
                    value={formData.optionC}
                    onChange={handleChange}
                    required={formData.type.startsWith('MCQ')}
                    placeholder="LaTeX math allowed"
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Option D</label>
                  <input
                    type="text"
                    name="optionD"
                    value={formData.optionD}
                    onChange={handleChange}
                    required={formData.type.startsWith('MCQ')}
                    placeholder="LaTeX math allowed"
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-600 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Correct Answer Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Correct Answer</label>
              
              {formData.type === 'MCQ_SINGLE' && (
                <div className="flex gap-2">
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, correctAnswer: opt }))}
                      className={`flex-1 py-2 rounded-lg border text-center font-bold text-sm transition-all ${
                        formData.correctAnswer === opt
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {formData.type === 'MCQ_MULTI' && (
                <div className="flex gap-2">
                  {['A', 'B', 'C', 'D'].map((opt) => {
                    const active = formData.correctAnswer.split(',').map((x: string) => x.trim()).includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleMultiAnswerToggle(opt)}
                        className={`flex-1 py-2 rounded-lg border text-center font-bold text-sm transition-all ${
                          active
                            ? 'bg-accentPurple border-accentPurple text-white'
                            : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {formData.type === 'NUMERICAL' && (
                <input
                  type="text"
                  name="correctAnswer"
                  value={formData.correctAnswer}
                  onChange={handleChange}
                  placeholder="e.g. 5 or 2.75"
                  required
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-600 font-mono"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">Marks</label>
                <input
                  type="number"
                  name="marks"
                  value={formData.marks}
                  onChange={handleChange}
                  min={1}
                  required
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-600 text-center font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">Negative</label>
                <input
                  type="number"
                  name="negativeMarks"
                  value={formData.negativeMarks}
                  onChange={handleChange}
                  max={0}
                  required
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-600 text-center font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Diagram Upload */}
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Insert Diagram / Image</label>
            <div className="flex gap-4 items-center">
              {formData.imageUrl ? (
                <div className="relative flex items-center justify-between w-full bg-slate-900/50 border border-slate-700/80 rounded-xl p-2 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={formData.imageUrl}
                      alt="Uploaded Diagram"
                      className="w-12 h-12 object-contain bg-white rounded border border-slate-700"
                    />
                    <span className="text-xs text-slate-400 truncate max-w-[200px]">{formData.imageUrl}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-1.5 bg-slate-800 hover:bg-red-900/50 rounded-full border border-slate-700 hover:border-red-500/50 transition-colors"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ) : (
                <div className="relative w-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    id="diagram-file"
                    className="hidden"
                  />
                  <label
                    htmlFor="diagram-file"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-4 cursor-pointer hover:bg-slate-900/10 transition-all"
                  >
                    {imageFile ? (
                      <div className="flex items-center gap-2 text-sm text-teal-500">
                        <Check className="w-5 h-5 animate-pulse" />
                        <span>Ready to upload: {imageFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Upload className="w-5 h-5" />
                        <span>Choose an image (diagrams, graphs)</span>
                      </div>
                    )}
                  </label>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Tags</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g. kinematics, graph, pyq-2025"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-600 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">
              Detailed Solution / Explanation <span className="text-slate-500 font-mono text-xs">(supports $math$)</span>
            </label>
            <textarea
              name="solution"
              rows={3}
              value={formData.solution}
              onChange={handleChange}
              required
              placeholder="Provide solution steps using LaTeX for math equations."
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-600 resize-y text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/30">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-700 hover:bg-slate-700/50 text-slate-300 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-accentPurple hover:brightness-110 font-medium text-white rounded-lg text-sm shadow-neon transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Question'}
            </button>
          </div>
        </form>
      </div>

      {/* Live Preview Panel */}
      <div className="bg-gradient-to-br from-indigo-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl flex flex-col h-[fit-content] sticky top-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
            Live Preview
          </h2>
          <span className="bg-slate-900 border border-slate-700 rounded-full px-3 py-1 text-xs text-slate-400">
            {formData.subject} | {formData.difficulty}
          </span>
        </div>

        {/* Outer Overleaf-Style Preview Card */}
        <div className="bg-white text-black p-6 rounded-xl border border-slate-300 min-h-[300px] flex flex-col justify-between font-serif text-[15px] shadow-lg">
          <div>
            <div className="flex justify-between items-start text-xs border-b border-slate-200 pb-2 mb-4 font-sans text-slate-500">
              <div>CHAPTER: <span className="font-semibold text-slate-800 uppercase">{formData.chapter || '—'}</span></div>
              <div>TOPIC: <span className="font-semibold text-slate-800 uppercase">{formData.topic || '—'}</span></div>
            </div>

            {/* Question Statement */}
            <div className="mb-4 leading-relaxed">
              <span className="font-sans font-bold mr-2 text-[14px]">Q.</span>
              <LaTeXPreview text={formData.questionText || 'Type question text in editor...'} className="inline-block" />
            </div>

            {/* Diagram */}
            {(formData.imageUrl || imageFile) && (
              <div className="my-4 flex justify-center bg-slate-50/50 p-3 rounded border border-dashed border-slate-200 max-h-64">
                <img
                  src={formData.imageUrl || (imageFile ? URL.createObjectURL(imageFile) : '')}
                  alt="Diagram Preview"
                  className="max-h-56 object-contain"
                />
              </div>
            )}

            {/* MCQ Options */}
            {formData.type.startsWith('MCQ') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm font-sans">
                {['A', 'B', 'C', 'D'].map((letter) => {
                  const labelKey = `option${letter}` as keyof typeof formData;
                  const optionText = formData[labelKey] || `Option ${letter}`;
                  return (
                    <div key={letter} className="flex items-start gap-2 p-1">
                      <span className="font-bold">({letter})</span>
                      <LaTeXPreview text={String(optionText)} />
                    </div>
                  );
                })}
              </div>
            )}

            {formData.type === 'NUMERICAL' && (
              <div className="mt-4 p-2 px-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-500 font-sans">
                [Numerical Value: Enter value up to 2 decimal places. Correct: <span className="font-mono font-bold text-black">{formData.correctAnswer}</span>]
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-slate-200 pt-4 font-sans">
            <div className="text-xs text-slate-400 mb-2">SOLUTION & AUDIT INFO:</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3 bg-slate-50 p-2 rounded border border-slate-200">
              <div>Correct Key: <span className="font-bold text-emerald-600 font-mono text-[13px]">{formData.correctAnswer}</span></div>
              <div>Type: <span className="font-bold text-slate-700">{formData.type}</span></div>
              <div>Marks: <span className="font-bold text-emerald-600">+{formData.marks}</span></div>
              <div>Neg Marks: <span className="font-bold text-rose-500">{formData.negativeMarks}</span></div>
            </div>

            <div className="text-xs text-slate-700 bg-emerald-50/50 p-3 rounded border border-emerald-100 leading-relaxed">
              <span className="font-bold text-emerald-800">Explanation:</span>{' '}
              <LaTeXPreview text={formData.solution || 'Write solution steps in editor...'} className="mt-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




