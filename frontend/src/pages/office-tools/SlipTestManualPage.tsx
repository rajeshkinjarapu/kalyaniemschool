import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { Download, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import { SlipTestRankCard, type ProcessedStudent } from '../../components/OfficeTools/SlipTestRankCard';

export const SlipTestManualPage = () => {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  // Form State
  const [testName, setTestName] = useState('SLIP TEST');
  const [subject, setSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [classId, setClassId] = useState('');
  const [maxMarks, setMaxMarks] = useState(20);

  // Input State for marks mapping
  const [marks, setMarks] = useState<Record<string, string>>({});

  // Fetch Classes
  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const res = await api.get("/api/classes");
      return res.data || [];
    },
  });

  const selectedClass = classes.find((c: any) => c.id === classId);

  // Fetch Students for the selected class
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["students", classId],
    queryFn: async () => {
      if (!classId) return [];
      const res = await api.get("/api/students", {
        params: { classId, limit: 500 },
      });
      return res.data?.data || res.data || [];
    },
    enabled: !!classId,
  });

  // Calculate dense rankings whenever marks change
  const processedStudents: ProcessedStudent[] = React.useMemo(() => {
    if (!students || students.length === 0) return [];
    
    // First map to StudentMark format, ignoring those without valid marks
    const validStudents = students.map((s: any) => {
      const markStr = marks[s.id] || '';
      const markNum = parseFloat(markStr);
      return {
        id: s.id,
        name: s.user?.name || 'Unknown',
        marks: isNaN(markNum) ? -1 : markNum
      };
    }).filter((s: any) => s.marks >= 0);

    // Sort descending by marks
    validStudents.sort((a: any, b: any) => b.marks - a.marks);

    // Calculate Dense Rank and Percentage
    let currentRank = 1;
    let prevMarks = -1;

    return validStudents.map((s: any, index: number) => {
      if (index > 0 && s.marks < prevMarks) {
        currentRank++;
      }
      prevMarks = s.marks;
      
      const pct = maxMarks > 0 ? (s.marks / maxMarks) * 100 : 0;
      return {
        ...s,
        rank: currentRank,
        percentage: pct.toFixed(1)
      };
    });
  }, [students, marks, maxMarks]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    try {
      toast.loading("Generating High-Res Image...", { id: "download" });
      
      const canvas = await html2canvas(cardRef.current, {
        scale: 4, // Higher scale for better quality
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false
      });

      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      
      const a = document.createElement('a');
      a.href = dataUrl;
      const filename = `${testName}_${subject}_${selectedClass?.name || 'Class'}.jpg`.replace(/[^a-z0-9_]/gi, '_');
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success("Downloaded successfully!", { id: "download" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate image.", { id: "download" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Slip Test Manager</h1>
          <p className="text-slate-500">Generate professional slip test rank cards directly from student data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Controls & Input */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">1</span> 
              Test Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 border p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="">Select Class...</option>
                  {classes.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(Number(e.target.value))}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 border p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Test Name</label>
                  <input
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="e.g. SLIP TEST"
                    className="w-full rounded-xl border-slate-200 bg-slate-50 border p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. MATHS"
                    className="w-full rounded-xl border-slate-200 bg-slate-50 border p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 border p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {classId && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">2</span> 
                  Enter Marks
                </h3>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded-md font-medium text-slate-600">
                  {students.length} Students
                </span>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {isLoadingStudents ? (
                  <div className="text-center py-8 text-slate-500">Loading students...</div>
                ) : students.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No students found.</div>
                ) : (
                  students.map((student: any) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                      <div className="truncate pr-4 flex-1">
                        <p className="font-medium text-slate-800 text-sm truncate">{student.user?.name}</p>
                        <p className="text-xs text-slate-500">{student.rollNo || 'No Roll No'}</p>
                      </div>
                      <input
                        type="number"
                        placeholder="Marks"
                        value={marks[student.id] || ''}
                        onChange={(e) => setMarks({ ...marks, [student.id]: e.target.value })}
                        className="w-24 p-2 text-center rounded-lg border-slate-200 border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-semibold text-blue-600"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Preview & Download */}
        <div className="xl:col-span-8 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-800">Live Preview</h3>
            <button
              onClick={handleDownload}
              disabled={processedStudents.length === 0}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/30 font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Download JPG
            </button>
          </div>

          <div className="bg-slate-100 p-8 rounded-3xl w-full flex justify-center overflow-x-auto shadow-inner min-h-[600px]">
            <div className="origin-top scale-[0.60] sm:scale-[0.80] xl:scale-[0.90] transition-transform">
              <SlipTestRankCard 
                ref={cardRef}
                students={processedStudents}
                testName={testName}
                subject={subject}
                examDate={examDate}
                className={selectedClass?.name || ''}
                maxMarks={maxMarks}
                logoSrc="/logo.png"
              />
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default SlipTestManualPage;
