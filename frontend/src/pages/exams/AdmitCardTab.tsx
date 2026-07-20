import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Printer, User, Calendar, MapPin, Phone, Mail, Globe, Settings, Upload, CheckCircle, Save, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { AdmitCardTemplate } from '../../components/Exams/AdmitCardTemplate';

export const AdmitCardTab: React.FC<{ exams: any[] }> = ({ exams }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [examPlans, setExamPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const selectedExam = exams.find(e => e.id === selectedExamId);

  const [published, setPublished] = useState(false);
  const [instructions, setInstructions] = useState('Candidate must carry this Admit Card to the examination hall.\nElectronic devices including calculators and mobile phones are strictly prohibited.\nCandidate should report to the examination center 30 minutes before commencement.');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [examTitleOverride, setExamTitleOverride] = useState('');
  const [examCenterOverride, setExamCenterOverride] = useState('');
  const [schedule, setSchedule] = useState<any[]>([]);

  useEffect(() => {
    if (selectedExam) {
      setPublished(selectedExam.admitCardPublished || false);
      const settings = selectedExam.admitCardSettings || {};
      setInstructions(settings.instructions || 'Candidate must carry this Admit Card to the examination hall.\nElectronic devices including calculators and mobile phones are strictly prohibited.\nCandidate should report to the examination center 30 minutes before commencement.');
      setSignatureUrl(settings.signatureUrl || '');
      setLogoUrl(settings.logoUrl || '');
      setExamTitleOverride(settings.examTitleOverride || '');
      setExamCenterOverride(settings.examCenterOverride || '');
      setSchedule(settings.schedule || []);
    }
  }, [selectedExam]);

  useEffect(() => {
    const fetchExamData = async () => {
      if (!selectedExamId || !selectedClassId) {
        setStudents([]);
        setExamPlans([]);
        return;
      }
      setLoading(true);
      try {
        const [studentsRes, plansRes]: any = await Promise.all([
          api.get(`/api/classes/${selectedClassId}/students`),
          api.get(`/api/exams-extended/plans?examId=${selectedExamId}`)
        ]);
        setStudents(studentsRes.data?.data || studentsRes.data || []);
        setExamPlans(plansRes.data?.data || plansRes.data || []);
      } catch (e) {
        console.error('Error fetching admit card data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchExamData();
  }, [selectedExamId, selectedClassId]);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveSettings = async () => {
    if (!selectedExamId) return;
    try {
      await api.post(`/api/exams/${selectedExamId}/admit-card-settings`, {
        admitCardPublished: published,
        admitCardSettings: {
          instructions,
          signatureUrl,
          logoUrl,
          examTitleOverride,
          examCenterOverride,
          schedule
        }
      });
      toast.success('Admit Card settings saved successfully!');
      // Update local object to avoid fetching again
      if (selectedExam) {
        selectedExam.admitCardPublished = published;
        selectedExam.admitCardSettings = { instructions, signatureUrl, logoUrl, examTitleOverride, examCenterOverride, schedule };
      }
    } catch (e: any) {
      toast.error('Failed to save settings: ' + e.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'signature' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/api/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (type === 'signature') setSignatureUrl(res.data.url);
      if (type === 'logo') setLogoUrl(res.data.url);
      toast.success(`${type === 'logo' ? 'Logo' : 'Signature'} uploaded!`);
    } catch (err) {
      toast.error('Failed to upload image');
    }
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
            {exams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.term})</option>)}
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
        <div className="flex gap-2">
          {isSuperAdmin && selectedExam && (
            <>
              {!published ? (
                <button 
                  onClick={async () => {
                    setPublished(true);
                    try {
                      await api.post(`/api/exams/${selectedExamId}/admit-card-settings`, {
                        admitCardPublished: true,
                        admitCardSettings: selectedExam.admitCardSettings || {}
                      });
                      toast.success('Admit Cards sent to Teachers, Students & Admins successfully!');
                      if (selectedExam) selectedExam.admitCardPublished = true;
                    } catch (e: any) {
                      toast.error('Failed to send admit cards');
                      setPublished(false);
                    }
                  }} 
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Send to Teachers, Students & Admins
                </button>
              ) : (
                <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Admit Cards Sent
                </span>
              )}
              <button onClick={() => setShowSettings(!showSettings)} className="btn-secondary flex items-center gap-2">
                <Settings className="w-4 h-4" /> Settings
              </button>
            </>
          )}
          {students.length > 0 && (
            <button onClick={handlePrint} className="btn-primary flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print All
            </button>
          )}
        </div>
      </div>

      {showSettings && selectedExamId && isSuperAdmin && (
        <div className="bg-white dark:bg-gray-900 border border-indigo-100 dark:border-gray-800 p-6 rounded-xl shadow-sm mb-6 print:hidden flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-4">
            <h3 className="font-bold text-lg">Admit Card Configuration</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Important Instructions (One per line)</label>
              <textarea 
                className="input h-32 text-sm" 
                value={instructions} 
                onChange={e => setInstructions(e.target.value)} 
              />
              
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mt-4">Exam Title Override</label>
              <input 
                type="text" 
                className="input" 
                placeholder="e.g. JEE EXAM - 5 (2026 - 2027)" 
                value={examTitleOverride} 
                onChange={e => setExamTitleOverride(e.target.value)} 
              />

              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mt-4">Examination Center</label>
              <input 
                type="text" 
                className="input" 
                placeholder="e.g. JY School Main Campus, Hall A" 
                value={examCenterOverride} 
                onChange={e => setExamCenterOverride(e.target.value)} 
              />
            </div>
            
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Principal Signature Image</label>
              <div className="flex items-center gap-4">
                {signatureUrl ? (
                  <img src={signatureUrl} alt="Signature" className="h-16 object-contain border border-gray-200 rounded p-1" />
                ) : (
                  <div className="h-16 w-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400">No Image</div>
                )}
                <label className="btn-secondary cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'signature')} />
                </label>
              </div>

              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mt-4">School Logo Image</label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-16 object-contain border border-gray-200 rounded p-1" />
                ) : (
                  <div className="h-16 w-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400">No Logo</div>
                )}
                <label className="btn-secondary cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} />
                </label>
              </div>
            </div>
          </div>
          
          {/* Schedule Editor */}
          <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-gray-700 dark:text-gray-300">Examination Schedule</h4>
              <button 
                onClick={() => setSchedule([...schedule, { date: '', timing: '', subject: '', room: '' }])}
                className="btn-secondary text-xs"
              >
                + Add Row
              </button>
            </div>
            
            {schedule.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mb-2 font-semibold text-xs text-gray-500">
                <div>Date</div>
                <div>Timing</div>
                <div>Subject</div>
                <div>Room</div>
                <div>Action</div>
              </div>
            )}
            
            <div className="space-y-2">
              {schedule.map((row, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-2">
                  <input type="date" className="input !py-1 text-sm" value={row.date} onChange={e => {
                    const newSch = [...schedule];
                    newSch[idx].date = e.target.value;
                    setSchedule(newSch);
                  }} />
                  <input type="text" className="input !py-1 text-sm" placeholder="10:00 AM - 01:00 PM" value={row.timing} onChange={e => {
                    const newSch = [...schedule];
                    newSch[idx].timing = e.target.value;
                    setSchedule(newSch);
                  }} />
                  <input type="text" className="input !py-1 text-sm" placeholder="Subject" value={row.subject} onChange={e => {
                    const newSch = [...schedule];
                    newSch[idx].subject = e.target.value;
                    setSchedule(newSch);
                  }} />
                  <input type="text" className="input !py-1 text-sm" placeholder="Room" value={row.room} onChange={e => {
                    const newSch = [...schedule];
                    newSch[idx].room = e.target.value;
                    setSchedule(newSch);
                  }} />
                  <button onClick={() => {
                    setSchedule(schedule.filter((_, i) => i !== idx));
                  }} className="btn-secondary !text-red-500 !bg-red-50 !py-1 text-sm">Remove</button>
                </div>
              ))}
              {schedule.length === 0 && (
                <div className="text-sm text-gray-400 italic">No schedule added. Will fallback to default exam plans if available.</div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button onClick={handleSaveSettings} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Configuration
            </button>
          </div>
        </div>
      )}

      {loading && <div className="p-12 text-center text-gray-500 font-semibold animate-pulse">Generating Admit Cards...</div>}

      {!loading && students.length > 0 && (
        <>
          <div className="card print:hidden overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs">
                <tr>
                  <th className="py-3 px-4 hidden sm:table-cell">S.No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Roll Number</th>
                  <th className="py-3 px-4 text-right hidden sm:table-cell">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-500 hidden sm:table-cell">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                        {student.user?.name?.[0] || 'S'}
                      </div>
                      {student.user?.name || student.name}
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-medium hidden sm:table-cell">{student.rollNo || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => window.open(`/admit-card-view/${selectedExamId}?studentId=${student.id}`, '_blank')} className="btn-secondary text-xs flex items-center gap-1 ml-auto">
                        <ExternalLink className="w-3.5 h-3.5" /> View Admit Card
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="hidden print:block print-area space-y-12 bg-gray-50 dark:bg-gray-900 p-4 print:p-0 rounded-xl flex flex-col items-center">
            <style dangerouslySetInnerHTML={{__html: `
            @media print {
              @page { size: A4; margin: 0; }
              body * { visibility: hidden; }
              .print-area, .print-area * { visibility: visible; }
              .print-area { position: absolute; left: 0; top: 0; width: 100%; background: white !important; display: block !important; }
              .admit-card-wrapper { 
                width: 210mm; 
                height: 297mm; 
                page-break-after: always; 
                page-break-inside: avoid;
                margin: 0;
                padding: 10mm;
                box-sizing: border-box;
                background: white !important;
                display: flex;
                flex-direction: column;
                justify-content: center;
              }
              .admit-card-wrapper:last-child { page-break-after: auto; }
            }
          `}} />
          
            {students.map((student) => (
              <AdmitCardTemplate key={student.id} student={student} exam={selectedExam} examPlans={examPlans} />
            ))}
          </div>
        </>
      )}

      {!loading && selectedExamId && selectedClassId && students.length === 0 && (
        <div className="p-12 text-center text-gray-400 font-medium">No students found for this class.</div>
      )}
    </div>
  );
};
