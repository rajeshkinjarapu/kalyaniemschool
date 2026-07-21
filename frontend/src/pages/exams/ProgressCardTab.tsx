import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Printer, Award, User, Star } from 'lucide-react';

export const ProgressCardTab: React.FC<{ exams: any[] }> = ({ exams }) => {
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedExam = exams.find(e => e.id === selectedExamId);

  useEffect(() => {
    const fetchExamData = async () => {
      if (!selectedExamId || !selectedClassId) {
        setStudentsData([]);
        return;
      }
      setLoading(true);
      try {
        // Fetch exam results mapped by student
        const res: any = await api.get(`/api/exams/${selectedExamId}/results?classId=${selectedClassId}`);
        setStudentsData(res.data || []);
      } catch (e) {
        console.error('Error fetching progress card data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchExamData();
  }, [selectedExamId, selectedClassId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-gradient-to-r from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-5 rounded-2xl border border-indigo-100 dark:border-gray-800 shadow-sm print:hidden gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-black uppercase text-indigo-500 tracking-wider shrink-0 ml-1 sm:ml-0">Select Details:</span>
          <div className="flex flex-col sm:flex-row w-full gap-3">
            <select 
              value={selectedExamId} 
              onChange={e => setSelectedExamId(e.target.value)} 
              className="input !py-2.5 sm:!py-2 w-full sm:min-w-[200px] border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500/20 bg-white shadow-sm font-semibold text-gray-700"
            >
              <option value="">-- Choose Exam --</option>
              {exams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.term})</option>)}
            </select>

            {selectedExam && (
              <select 
                value={selectedClassId} 
                onChange={e => setSelectedClassId(e.target.value)} 
                className="input !py-2.5 sm:!py-2 w-full sm:min-w-[150px] border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500/20 bg-white shadow-sm font-semibold text-gray-700"
              >
                <option value="">-- Choose Class --</option>
                {(selectedExam.classes || []).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}-{c.section}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        {studentsData.length > 0 && (
          <button onClick={handlePrint} className="btn-primary flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 border-none shadow-lg shadow-pink-500/30">
            <Printer className="w-4 h-4" /> Print Progress Cards
          </button>
        )}
      </div>

      {loading && <div className="p-12 text-center">Loading Data...</div>}

      {!loading && studentsData.length > 0 && (
        <div className="print-area space-y-12 bg-gray-50 dark:bg-gray-900 p-4 print:p-0 rounded-xl">
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * { visibility: hidden; }
              .print-area, .print-area * { visibility: visible; }
              .print-area { position: absolute; left: 0; top: 0; width: 100%; background: white !important; padding: 0 !important; }
              .progress-card { page-break-inside: avoid; page-break-after: always; box-shadow: none !important; border: 1px solid #eee !important; margin: 0 auto !important; }
              .progress-card:last-child { page-break-after: auto; }
            }
          `}} />
          
          {studentsData.map((data: any) => {
            const totalMaxMarks = data.marks.reduce((acc: number, curr: any) => acc + (curr.maxMarks || 100), 0);
            const totalObtained = data.marks.reduce((acc: number, curr: any) => acc + curr.obtained, 0);
            const percentage = totalMaxMarks > 0 ? ((totalObtained / totalMaxMarks) * 100).toFixed(1) : 0;
            
            return (
              <div key={data.studentId} className="progress-card w-full max-w-[210mm] mx-auto bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden relative">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-400 to-orange-400 rounded-full blur-3xl opacity-10 -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-400 to-cyan-400 rounded-full blur-3xl opacity-10 -ml-20 -mb-20"></div>
                
                {/* Header */}
                <div className="px-10 pt-10 pb-6 flex flex-col sm:flex-row items-center sm:items-start justify-between border-b border-gray-100 relative z-10 gap-4">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center font-black text-white text-2xl sm:text-3xl shadow-lg shadow-indigo-500/30 transform -rotate-3 shrink-0">
                      JY
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">JY School</h2>
                      <p className="text-gray-500 font-semibold text-xs sm:text-sm tracking-widest uppercase mt-1">Academic Progress Report</p>
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <div className="inline-flex items-center gap-2 bg-pink-50 text-pink-600 px-4 py-1.5 rounded-full font-bold text-sm border border-pink-100">
                      <Star className="w-4 h-4 fill-pink-600" /> Session 2026-27
                    </div>
                  </div>
                </div>

                {/* Student Details */}
                <div className="px-6 sm:px-10 py-6 sm:py-8 flex flex-col sm:grid sm:grid-cols-[auto_1fr] gap-6 sm:gap-8 items-center relative z-10">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-50 rounded-2xl border-2 border-gray-200 p-2 shadow-sm shrink-0">
                    <div className="w-full h-full bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 overflow-hidden">
                       {data.photoUrl || data.studentPhotoUrl ? (
                         <img src={data.photoUrl || data.studentPhotoUrl} className="w-full h-full object-cover" alt="Student" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                       ) : null}
                       <User className={`w-10 h-10 sm:w-12 sm:h-12 ${data.photoUrl || data.studentPhotoUrl ? 'hidden' : ''}`} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-8 sm:gap-y-6 bg-gray-50/50 p-4 sm:p-6 rounded-2xl border border-gray-100 w-full text-center sm:text-left">
                    <div>
                      <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Student Name</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">{data.studentName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Examination</p>
                      <p className="text-lg sm:text-xl font-bold text-indigo-600">{selectedExam?.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Class & Section</p>
                      <p className="text-sm sm:text-base font-bold text-gray-700">{data.className}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Roll Number</p>
                      <p className="text-sm sm:text-base font-bold text-gray-700">{data.rollNo}</p>
                    </div>
                  </div>
                </div>

                {/* Marks Table */}
                <div className="px-6 sm:px-10 pb-6 sm:pb-8 relative z-10 overflow-x-auto">
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-w-[600px]">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-200">
                          <th className="text-left py-4 px-6 font-black text-gray-500 uppercase tracking-wider text-xs">Subject</th>
                          <th className="text-center py-4 px-6 font-black text-gray-500 uppercase tracking-wider text-xs">Max Marks</th>
                          <th className="text-center py-4 px-6 font-black text-gray-500 uppercase tracking-wider text-xs">Marks Obtained</th>
                          <th className="text-center py-4 px-6 font-black text-gray-500 uppercase tracking-wider text-xs">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.marks.map((m: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="py-4 px-6 font-bold text-gray-800">{m.subject}</td>
                            <td className="py-4 px-6 text-center font-semibold text-gray-500">{m.maxMarks || 100}</td>
                            <td className="py-4 px-6 text-center font-bold text-gray-900">{m.obtained}</td>
                            <td className="py-4 px-6 text-center font-bold text-indigo-600 bg-indigo-50/30">{m.grade}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-900 text-white border-t-2 border-gray-200">
                          <td className="py-4 px-6 font-black uppercase tracking-wider">Total Score</td>
                          <td className="py-4 px-6 text-center font-bold text-gray-300">{totalMaxMarks}</td>
                          <td className="py-4 px-6 text-center font-black text-xl text-yellow-400">{totalObtained}</td>
                          <td className="py-4 px-6 text-center font-black text-xl text-yellow-400">{percentage}%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Footer Signatures */}
                <div className="px-6 sm:px-10 pb-8 sm:pb-10 pt-6 flex flex-wrap justify-between items-end relative z-10 gap-4">
                  <div className="text-center w-full sm:w-auto mt-4 sm:mt-0">
                    <div className="w-32 sm:w-48 border-b-2 border-dashed border-gray-300 mb-3 mx-auto"></div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">Class Teacher</p>
                  </div>
                  <div className="text-center w-full sm:w-auto mt-4 sm:mt-0">
                    <div className="w-32 sm:w-48 border-b-2 border-dashed border-gray-300 mb-3 mx-auto"></div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">Parent / Guardian</p>
                  </div>
                  <div className="text-center w-full sm:w-auto mt-4 sm:mt-0">
                    <div className="w-32 sm:w-48 border-b-2 border-solid border-gray-800 mb-3 mx-auto"></div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-800">Principal</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && selectedExamId && selectedClassId && studentsData.length === 0 && (
        <div className="p-12 text-center text-gray-400">No results found for this class. Make sure marks are entered.</div>
      )}
    </div>
  );
};
