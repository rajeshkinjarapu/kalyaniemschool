import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Award, Medal, Printer, Download, Star, TrendingUp, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const ResultsTab: React.FC<{ exams: any[] }> = ({ exams }) => {
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const selectedExam = exams.find(e => e.id === selectedExamId);

  useEffect(() => {
    const fetchResults = async () => {
      if (!selectedExamId || !selectedClassId) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get(`/api/exams/${selectedExamId}/results?classId=${selectedClassId}`);
        setResults(res.data?.data || res.data || []);
      } catch (e: any) {
        console.error(e);
        toast.error('Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [selectedExamId, selectedClassId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    const toastId = toast.loading('Generating PDF...');
    try {
      const element = document.getElementById('results-print-area');
      if (!element) return;
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Results_${selectedExam?.name || 'Exam'}_Class_${selectedClassId}.pdf`);
      toast.success('PDF downloaded successfully!', { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate PDF', { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <div className="bg-yellow-400 text-yellow-900 rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white"><Trophy className="w-4 h-4"/></div>;
    if (rank === 2) return <div className="bg-gray-300 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center shadow-md border-2 border-white"><Medal className="w-4 h-4"/></div>;
    if (rank === 3) return <div className="bg-amber-600 text-amber-100 rounded-full w-8 h-8 flex items-center justify-center shadow-md border-2 border-white"><Medal className="w-4 h-4"/></div>;
    return <div className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm border-2 border-white">{rank}</div>;
  };

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #results-print-area, #results-print-area * { visibility: visible; }
          #results-print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; }
          .no-print { display: none !important; }
        }
      `}} />

      {/* Header Selection */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-150 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center gap-4 no-print">
        <div className="flex-1 w-full flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase shrink-0">Select Exam:</span>
          <select value={selectedExamId} onChange={e => { setSelectedExamId(e.target.value); setSelectedClassId(''); }} className="input flex-1">
            <option value="">-- Choose Exam --</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        
        {selectedExam && (
          <div className="flex-1 w-full flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase shrink-0">Select Class:</span>
            <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="input flex-1">
              <option value="">-- Choose Class --</option>
              {(selectedExam.classes || []).map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}-{c.section}</option>
              ))}
            </select>
          </div>
        )}
        
        {results.length > 0 && (
          <div className="flex gap-2 shrink-0">
            <button onClick={handleDownloadPDF} disabled={isDownloading} className="btn-secondary flex items-center gap-2">
              {isDownloading ? <LoadingSpinner size="sm" /> : <Download className="w-4 h-4" />} PDF
            </button>
            <button onClick={handlePrint} className="btn-primary flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        )}
      </div>

      {loading && <div className="p-12 flex justify-center"><LoadingSpinner size="lg" /></div>}

      {!loading && selectedExamId && selectedClassId && results.length === 0 && (
        <div className="p-12 text-center text-gray-400 bg-white dark:bg-gray-900 rounded-xl border border-gray-100">
          No results found. Please ensure marks are entered and frozen.
        </div>
      )}

      {!loading && results.length > 0 && (
        <div id="results-print-area" className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-indigo-50">
          {/* Colorful Header */}
          <div className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
                  <Award className="w-8 h-8 text-yellow-300" />
                  Examination Results
                </h2>
                <div className="flex gap-4 text-white/90 font-medium">
                  <span className="bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/10">{selectedExam?.name}</span>
                  <span className="bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/10">{results[0]?.className}</span>
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-white/80 uppercase tracking-widest mb-1">Total Students</p>
                <p className="text-4xl font-black">{results.length}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-indigo-50/50">
                    <th className="p-4 font-black text-indigo-900 text-xs uppercase tracking-wider rounded-tl-xl w-16 text-center">Rank</th>
                    <th className="p-4 font-black text-indigo-900 text-xs uppercase tracking-wider">Student Details</th>
                    {results[0]?.marks.map((m: any, i: number) => (
                      <th key={i} className="p-4 font-black text-indigo-900 text-xs uppercase tracking-wider text-center">{m.subject}</th>
                    ))}
                    <th className="p-4 font-black text-indigo-900 text-xs uppercase tracking-wider text-center">Total</th>
                    <th className="p-4 font-black text-indigo-900 text-xs uppercase tracking-wider text-center">Percentage</th>
                    <th className="p-4 font-black text-indigo-900 text-xs uppercase tracking-wider text-center rounded-tr-xl">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((student, idx) => (
                    <tr key={student.studentId} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex justify-center">
                          {getRankBadge(student.rank)}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-900 dark:text-white">{student.name}</p>
                        <p className="text-xs text-gray-500 font-semibold">{student.rollNo || 'No Roll No'}</p>
                      </td>
                      {student.marks.map((m: any, i: number) => (
                        <td key={i} className="p-4 text-center">
                          <span className="font-bold text-gray-700">{m.obtained}</span>
                          <span className="text-xs text-gray-400 ml-1">/{m.max}</span>
                        </td>
                      ))}
                      <td className="p-4 text-center font-black text-indigo-600">
                        {student.total}
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 font-bold border border-green-100">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {student.percentage}%
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-full font-black text-sm text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-200">
                          {student.grade || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
