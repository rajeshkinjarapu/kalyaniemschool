import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Printer, Award, User, Star, TrendingUp } from 'lucide-react';
import jyLogo from '../../assets/jy-logo.png'; // Assuming a logo exists, otherwise we will use a fallback or keep it simple. We can use a div for logo.

export const JEEProgressCardTab: React.FC<{ exams: any[] }> = ({ exams }) => {
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
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-150 dark:border-gray-800 print:hidden gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-extrabold uppercase text-gray-400 shrink-0">Select Exam:</span>
          <select 
            value={selectedExamId} 
            onChange={e => setSelectedExamId(e.target.value)} 
            className="input !py-1.5 min-w-[200px]"
          >
            <option value="">-- Choose Exam --</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>

          {selectedExam && (
            <select 
              value={selectedClassId} 
              onChange={e => setSelectedClassId(e.target.value)} 
              className="input !py-1.5 min-w-[150px]"
            >
              <option value="">-- Choose Class --</option>
              {(selectedExam.classes || []).map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}-{c.section}</option>
              ))}
            </select>
          )}
        </div>
        
        {studentsData.length > 0 && (
          <button onClick={handlePrint} className="btn-primary flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-lg shadow-blue-500/30">
            <Printer className="w-4 h-4" /> Print JEE Progress Cards
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
              .progress-card { page-break-inside: avoid; page-break-after: always; box-shadow: none !important; margin: 0 auto !important; }
              .progress-card:last-child { page-break-after: auto; }
              .progress-bar-bg { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              table th, table td { border: 1px solid #e5e7eb !important; }
            }
          `}} />
          
          {studentsData.map((data: any) => {
            const totalMaxMarks = data.marks.reduce((acc: number, curr: any) => acc + (curr.maxMarks || 100), 0);
            const totalObtained = data.marks.reduce((acc: number, curr: any) => acc + curr.obtained, 0);
            const percentage = totalMaxMarks > 0 ? ((totalObtained / totalMaxMarks) * 100).toFixed(1) : "0.0";
            const percentNumber = Number(percentage);
            
            return (
              <div key={data.studentId} className="progress-card w-full max-w-[210mm] mx-auto bg-white border border-gray-300 shadow-2xl relative" style={{ fontFamily: 'Arial, sans-serif' }}>
                
                {/* Header Section */}
                <div className="text-center pt-8 pb-4 relative">
                  <div className="absolute left-8 top-8 w-24 h-24 border-2 border-blue-800 rounded-full flex items-center justify-center flex-col shadow-sm">
                    {/* Placeholder for Logo */}
                    <div className="text-blue-800 font-bold text-2xl">SJY</div>
                    <div className="text-[8px] text-blue-800 uppercase tracking-tighter font-semibold">Minds Shaping Future</div>
                  </div>
                  
                  <h1 className="text-3xl font-bold text-[#1a365d] tracking-wide mb-1" style={{ fontFamily: 'Times New Roman, serif' }}>SRI VENKATESWARA JY SCHOOL</h1>
                  <p className="text-sm text-blue-600 font-semibold mb-1">(IIT-JEE / NEET Foundation • Olympiads)</p>
                  <p className="text-xs text-gray-500 mb-4">Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta</p>
                  
                  <h2 className="text-xl font-bold text-gray-800 tracking-wider mb-2 uppercase">{selectedExam?.name || 'JEE MAINS MODEL EXAMINATION'}</h2>
                  
                  <div className="flex items-center justify-center gap-4 text-amber-500 font-bold text-sm tracking-widest uppercase">
                    <span>✦</span>
                    <span className="text-[#c69c6d]">RESULT CARD</span>
                    <span>✦</span>
                  </div>
                </div>

                {/* Golden Line Separator */}
                <div className="w-full h-1 bg-gradient-to-r from-amber-200 via-amber-500 to-amber-200 mb-6"></div>

                {/* Student Details Section */}
                <div className="px-8 mb-8">
                  <div className="border border-amber-400 rounded-lg p-1 flex">
                    <div className="flex-grow">
                      <table className="w-full text-sm">
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="py-2.5 px-4 text-gray-600 font-semibold w-1/3 flex items-center gap-2">
                              <User className="w-4 h-4 text-purple-600" /> Student Name
                            </td>
                            <td className="py-2.5 px-4 font-bold text-gray-900 uppercase">{data.studentName}</td>
                          </tr>
                          <tr className="border-b border-gray-100 bg-gray-50/50">
                            <td className="py-2.5 px-4 text-gray-600 font-semibold flex items-center gap-2">
                              <span className="w-4 h-4 bg-indigo-100 text-indigo-600 flex items-center justify-center rounded text-[10px] font-bold">ID</span> Student ID
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-gray-800">{data.rollNo}</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-2.5 px-4 text-gray-600 font-semibold flex items-center gap-2">
                              <Layers className="w-4 h-4 text-green-500" /> Class
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-gray-800">{data.className}</td>
                          </tr>
                          <tr className="border-b border-gray-100 bg-gray-50/50">
                            <td className="py-2.5 px-4 text-gray-600 font-semibold flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-blue-400" /> Section
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-gray-800">{data.section || 'A'}</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-2.5 px-4 text-gray-600 font-semibold flex items-center gap-2">
                              <span className="text-red-500 text-lg leading-none">📞</span> Mobile
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-gray-800">{data.mobile || '-'}</td>
                          </tr>
                          <tr className="border-b border-gray-100 bg-gray-50/50">
                            <td className="py-2.5 px-4 text-gray-600 font-semibold flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-blue-600" /> Academic Year
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-gray-800">2026 - 2027</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-2.5 px-4 text-gray-600 font-semibold flex items-center gap-2">
                              <span className="text-pink-500 text-lg leading-none">📍</span> Location
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-gray-800">Narasannapeta</td>
                          </tr>
                          <tr className="bg-amber-50/30">
                            <td className="py-2.5 px-4 text-gray-600 font-semibold flex items-center gap-2">
                              <Award className="w-4 h-4 text-amber-500" /> Class Rank
                            </td>
                            <td className="py-2.5 px-4 font-bold text-gray-900">#{data.rank || '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="w-40 border-l border-amber-200 p-4 flex items-center justify-center bg-gray-50/30">
                      <div className="w-32 h-36 border-2 border-amber-400 p-1 bg-white shadow-sm overflow-hidden rounded-md">
                        {data.photo ? (
                          <img src={data.photo} alt="Student" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                            <User className="w-16 h-16" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Summary */}
                <div className="px-8 mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 font-bold text-gray-800">
                      <TrendingUp className="w-5 h-5 text-pink-500" /> Performance Summary
                    </div>
                    <div className="text-xs text-blue-400 font-semibold">Max Marks: {totalMaxMarks}</div>
                  </div>

                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-[#1e2b4d] text-white">
                        <th className="py-2 px-4 text-left font-bold text-xs uppercase tracking-wider w-2/5">Subject</th>
                        <th className="py-2 px-4 text-center font-bold text-xs uppercase tracking-wider">Marks</th>
                        <th className="py-2 px-4 text-center font-bold text-xs uppercase tracking-wider">Max Marks</th>
                        <th className="py-2 px-4 text-center font-bold text-xs uppercase tracking-wider">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.marks.map((m: any, idx: number) => {
                        const subPercent = m.maxMarks ? ((m.obtained / m.maxMarks) * 100).toFixed(1) : 0;
                        return (
                          <tr key={idx} className="border-b border-gray-200 bg-white">
                            <td className="py-3 px-4 font-semibold text-gray-700 flex items-center gap-2">
                              <div className="w-3 h-3 bg-blue-400 rounded-sm"></div> {m.subject}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-gray-900">{m.obtained}</td>
                            <td className="py-3 px-4 text-center text-blue-400">{m.maxMarks || 100}</td>
                            <td className="py-3 px-4 text-center font-semibold text-gray-700">{subPercent}%</td>
                          </tr>
                        );
                      })}
                      
                      {/* Total Row */}
                      <tr className="border-b border-amber-400 bg-white border-t-2 border-t-gray-300">
                        <td className="py-3 px-4 font-black text-gray-900 flex items-center gap-2">
                          <span className="text-red-600 text-lg">📌</span> TOTAL
                        </td>
                        <td className="py-3 px-4 text-center font-black text-lg text-gray-900">{totalObtained}</td>
                        <td className="py-3 px-4 text-center font-semibold text-blue-500">{totalMaxMarks}</td>
                        <td className="py-3 px-4 text-center font-black text-emerald-600">{percentage}%</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  {/* Progress bar */}
                  <div className="mt-6">
                    <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden flex shadow-inner progress-bar-bg">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 via-gray-700 to-[#1e2b4d]" 
                        style={{ width: `${percentNumber}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-semibold">
                      <span>0</span>
                      <span>Threshold: 40%</span>
                      <span>{totalMaxMarks}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Section */}
                <div className="px-8 pb-12 pt-4 relative">
                  {/* Golden Line Separator */}
                  <div className="w-full h-0.5 bg-amber-400 mb-8"></div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-gray-500 text-sm font-semibold flex items-center gap-1 mb-1">
                        <span className="text-lg">📄</span> Total Marks: <span className="text-gray-900 font-bold">{totalObtained} / {totalMaxMarks}</span>
                      </div>
                      <div className="text-3xl font-black text-emerald-600">
                        {percentage}%
                      </div>
                    </div>
                    
                    <div className="flex gap-16">
                      <div className="text-center">
                        <div className="h-16 flex items-end justify-center mb-2">
                          {/* Signature placeholder */}
                          <div className="text-blue-600 font-signature text-2xl transform -rotate-12 opacity-80" style={{ fontFamily: "'Brush Script MT', cursive" }}>Signature</div>
                        </div>
                        <div className="border-t border-gray-300 pt-1">
                          <p className="text-xs font-bold text-gray-600 flex items-center justify-center gap-1">
                            <span className="text-amber-500">✍</span> Teacher Signature
                          </p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="h-16 flex items-end justify-center mb-2">
                          {/* Signature placeholder */}
                          <div className="text-green-600 font-signature text-2xl transform -rotate-12 opacity-80" style={{ fontFamily: "'Brush Script MT', cursive" }}>Principal</div>
                        </div>
                        <div className="border-t border-gray-300 pt-1">
                          <p className="text-xs font-bold text-gray-600 flex items-center justify-center gap-1">
                            <span className="text-amber-500">✍</span> Principal Signature
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-4 left-0 w-full text-center">
                    <p className="text-[10px] text-gray-400 font-medium tracking-wider">
                      ★ This is a system-generated result card for {selectedExam?.name || 'JEE MAINS MODEL EXAMINATION'} ★
                    </p>
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
