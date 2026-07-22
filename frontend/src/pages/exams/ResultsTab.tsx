import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Award, Medal, Printer, Download, Star, TrendingUp, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ResultsTab: React.FC<{ exams: any[] }> = ({ exams }) => {
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (id: string) => setExpandedRow(prev => prev === id ? null : id);

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
    const printContent = document.getElementById('results-print-area');
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(el => el.outerHTML).join('\n');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Results - ${selectedExam?.name}</title>
          ${styles}
          <style>
            @media print {
              @page { margin: 10mm; size: A4 portrait; }
              html, body { height: auto !important; overflow: visible !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
              table { width: 100% !important; border-collapse: collapse !important; table-layout: auto; margin-top: 10px; page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
              tfoot { display: table-footer-group; }
              th, td { padding: 4px 6px !important; font-size: 11px !important; border: 1px solid #d1d5db !important; text-align: center; white-space: nowrap !important; color: #000 !important; }
              th { font-size: 12px !important; font-weight: 800 !important; background-color: #f3f4f6 !important; }
              th:nth-child(2), td:nth-child(2) { text-align: left; max-width: 180px; overflow: hidden; text-overflow: ellipsis; }
              /* Override overflow for printing so it spans multiple pages */
              .overflow-x-auto, .overflow-hidden, #results-print-area { overflow: visible !important; height: auto !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; display: block !important; }
              /* Shrink the big header box */
              .print-header-box { padding: 18px 24px !important; background: linear-gradient(to right, #7c3aed, #ea580c) !important; border-radius: 12px !important; margin-bottom: 15px !important; }
              .print-title { font-size: 26px !important; margin-bottom: 8px !important; color: white !important; font-weight: 900 !important; }
              .print-subtitle span { padding: 4px 12px !important; font-size: 15px !important; border: 1px solid rgba(255,255,255,0.3) !important; border-radius: 6px !important; color: white !important; background: rgba(255,255,255,0.15) !important; font-weight: bold !important; }
              .print-roll-no { font-size: 13px !important; font-weight: 800 !important; color: #111827 !important; }
              /* Simplify rank badge to save space */
              .rank-badge { width: auto !important; height: auto !important; background: transparent !important; color: #000 !important; box-shadow: none !important; border: none !important; display: inline !important; padding: 0 !important; font-size: 10px !important; }
              .rank-badge svg { display: none !important; }
              .rank-num { display: inline !important; }
              /* Hide specific columns/elements */
              .hide-in-print { display: none !important; }
              svg { stroke: currentColor !important; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body class="bg-white p-4">
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 1000);
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    const toastId = toast.loading('Generating Professional PDF...');
    try {
      // Use portrait as requested by user
      const doc = new jsPDF('p', 'mm', 'a4');
      const title = `Examination Results - ${selectedExam?.name}`;
      const subtitle = `Class: ${results[0]?.className}`;
      
      doc.setFontSize(18);
      doc.text(title, 14, 20);
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(subtitle, 14, 28);
      
      const head = [[
        'Rank', 
        'Student Name', 
        'Roll No', 
        ...results[0]?.marks.map((m: any) => {
          const sub = String(m.subject).toUpperCase();
          if (sub.includes('MATH')) return 'MAT';
          if (sub.includes('PHYS')) return 'PHY';
          if (sub.includes('CHEM')) return 'CHE';
          if (sub.includes('BIOL')) return 'BIO';
          if (sub.includes('ENG')) return 'ENG';
          return sub.length > 4 ? sub.substring(0, 3) : sub;
        }) || [], 
        'Total', 
        '%', 
        'Grade'
      ]];
      
      const body = results.map(student => [
        student.rank,
        student.name,
        student.rollNo || '-',
        ...student.marks.map((m: any) => m.obtained),
        student.total,
        `${student.percentage}%`,
        student.grade || '-'
      ]);

      autoTable(doc, {
        startY: 35,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold', halign: 'center', minCellHeight: 10, fontSize: 10 }, 
        bodyStyles: { halign: 'center', textColor: 40, minCellHeight: 9 },
        columnStyles: {
          1: { halign: 'left', fontStyle: 'bold', cellWidth: 55 }, // Give name more width so it doesn't wrap
          2: { cellWidth: 20 } // Ensure Roll No has enough width
        },
        styles: { fontSize: 8.5, cellPadding: 2.5, overflow: 'visible' }, // Use visible to prevent cutting off text
        margin: { left: 10, right: 10, bottom: 15 } // Reduce side margins slightly to give more space
      });
      
      doc.save(`Results_${selectedExam?.name || 'Exam'}_Class_${selectedClassId}.pdf`);
      toast.success('PDF downloaded successfully!', { id: toastId });
    } catch (e: any) {
      console.error(e);
      toast.error(`Failed to generate PDF: ${e.message || 'Unknown error'}`, { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <div className="bg-yellow-400 text-yellow-900 rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white rank-badge"><span className="no-print"><Trophy className="w-4 h-4"/></span><span className="hidden rank-num" style={{ display: 'none' }}>{rank}</span></div>;
    if (rank === 2) return <div className="bg-gray-300 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center shadow-md border-2 border-white rank-badge"><span className="no-print"><Medal className="w-4 h-4"/></span><span className="hidden rank-num" style={{ display: 'none' }}>{rank}</span></div>;
    if (rank === 3) return <div className="bg-amber-600 text-amber-100 rounded-full w-8 h-8 flex items-center justify-center shadow-md border-2 border-white rank-badge"><span className="no-print"><Medal className="w-4 h-4"/></span><span className="hidden rank-num" style={{ display: 'none' }}>{rank}</span></div>;
    return <div className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm border-2 border-white rank-badge">{rank}</div>;
  };

  return (
    <div className="space-y-6">
      {/* We use window.open for printing, so no global @media print needed here anymore */}

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
          <div className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 p-8 text-white relative overflow-hidden print-header-box">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 no-print" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 no-print" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3 print-title">
                  <Award className="w-8 h-8 text-yellow-300 no-print" />
                  Examination Results
                </h2>
                <div className="flex gap-4 text-white/90 font-medium print-subtitle">
                  <span className="bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/10">{selectedExam?.name}</span>
                  <span className="bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/10">{results[0]?.className}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-indigo-50/50">
                    <th className="p-4 font-black text-indigo-900 text-xs uppercase tracking-wider rounded-tl-xl w-16 text-center">Rank</th>
                    <th className="p-4 font-black text-indigo-900 text-xs uppercase tracking-wider whitespace-nowrap">Student Name</th>
                    <th className="hidden md:table-cell p-4 font-black text-indigo-900 text-xs uppercase tracking-wider w-28">Roll No</th>
                    {results[0]?.marks.map((m: any, i: number) => (
                      <th key={i} className="hidden md:table-cell p-4 font-black text-indigo-900 text-xs uppercase tracking-wider text-center">{m.subject}</th>
                    ))}
                    <th className="p-4 font-black text-indigo-900 text-xs uppercase tracking-wider text-center w-20">Total</th>
                    <th className="hidden md:table-cell p-4 font-black text-indigo-900 text-xs uppercase tracking-wider text-center w-24">Percentage</th>
                    <th className="hidden md:table-cell p-4 font-black text-indigo-900 text-xs uppercase tracking-wider text-center rounded-tr-xl w-20 hide-in-print">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((student, idx) => (
                    <React.Fragment key={student.studentId || idx}>
                      <tr 
                        onClick={() => toggleRow(student.studentId || String(idx))}
                        className="hover:bg-indigo-50/50 transition-colors group cursor-pointer bg-white"
                      >
                        <td className="p-4">
                          <div className="flex justify-center">
                            {getRankBadge(student.rank)}
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-indigo-900 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] md:max-w-[200px]">{student.name}</p>
                        </td>
                        <td className="hidden md:table-cell p-4">
                          <p className="text-xs text-gray-500 font-semibold print-roll-no">{student.rollNo || '-'}</p>
                        </td>
                        {student.marks.map((m: any, i: number) => (
                          <td key={i} className="hidden md:table-cell p-4 text-center">
                            <span className="font-bold text-gray-700">{m.obtained}</span>
                          </td>
                        ))}
                        <td className="p-4 text-center font-black text-indigo-600">
                          {student.total}
                        </td>
                        <td className="hidden md:table-cell p-4 text-center">
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 font-bold border border-green-100">
                            {student.percentage}%
                          </div>
                        </td>
                        <td className="hidden md:table-cell p-4 text-center hide-in-print">
                          <span className="inline-block px-3 py-1 rounded-full font-black text-sm text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-200">
                            {student.grade || '-'}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Mobile Details */}
                      {expandedRow === (student.studentId || String(idx)) && (
                        <tr className="md:hidden bg-gradient-to-r from-indigo-50/50 to-fuchsia-50/50 border-b border-gray-100">
                          <td colSpan={3} className="p-4">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-gray-500">Roll No:</span>
                                <span className="font-bold text-gray-900">{student.rollNo || '-'}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-gray-500">Percentage:</span>
                                <span className="font-bold text-green-600">{student.percentage}%</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-gray-500">Grade:</span>
                                <span className="font-bold text-fuchsia-600">{student.grade || '-'}</span>
                              </div>
                              
                              <div className="pt-2 border-t border-gray-200/60">
                                <p className="text-xs font-bold text-indigo-500 uppercase mb-2">Subject Marks</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {student.marks.map((m: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-white shadow-sm">
                                      <span className="text-xs font-semibold text-gray-500 truncate mr-2">{m.subject}</span>
                                      <span className="text-sm font-bold text-indigo-700">{m.obtained}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
