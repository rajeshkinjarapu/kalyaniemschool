import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Printer, User, Calendar, MapPin, Phone, Mail, Globe, Settings, Upload, CheckCircle, Save, ExternalLink, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { AdmitCardTemplate } from '../../components/Exams/AdmitCardTemplate';

export const AdmitCardTab: React.FC<{ exams: any[] }> = ({ exams }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [examPlans, setExamPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const selectedExam = exams.find(e => e.id === selectedExamId);
  const selectedClass = selectedExam?.classes?.find((c: any) => c.id === selectedClassId);

  const [published, setPublished] = useState(false);
  const [instructions, setInstructions] = useState('Candidate must carry this Admit Card to the examination hall.\nElectronic devices including calculators and mobile phones are strictly prohibited.\nCandidate should report to the examination center 30 minutes before commencement.');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [teacherSignatureUrl, setTeacherSignatureUrl] = useState('');
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
      setTeacherSignatureUrl(settings.teacherSignatureUrl || '');
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

  const generatePDFForElement = async (el: HTMLElement, fileName: string) => {
    const parentContainer = document.getElementById('admit-cards-print-container');
    const originalParentDisplay = parentContainer?.style.display;
    const originalParentPosition = parentContainer?.style.position;
    
    if (parentContainer) {
      parentContainer.classList.remove('hidden');
      parentContainer.style.display = 'flex';
      parentContainer.style.position = 'absolute';
      parentContainer.style.left = '-9999px';
    }

    const originalDisplay = el.style.display;
    el.style.display = 'flex';
    await new Promise(resolve => setTimeout(resolve, 100));
    const imgData = await toJpeg(el, { cacheBust: true, pixelRatio: 2, quality: 0.95, backgroundColor: '#ffffff' });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (el.offsetHeight * pdfWidth) / el.offsetWidth;
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    
    el.style.display = originalDisplay;
    if (parentContainer) {
      parentContainer.classList.add('hidden');
      parentContainer.style.display = originalParentDisplay || '';
      parentContainer.style.position = originalParentPosition || '';
      parentContainer.style.left = '';
    }
    return pdf;
  };

  const handleDownloadSingle = async (studentName: string, index: number) => {
    const el = document.getElementById(`admit-card-${index}`);
    if (!el) return toast.error('Could not find card element');
    const toastId = toast.loading(`Generating PDF for ${studentName}...`);
    try {
      const pdf = await generatePDFForElement(el, studentName);
      pdf.save(`${studentName}_AdmitCard.pdf`);
      toast.success('Downloaded successfully!', { id: toastId });
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to generate PDF', { id: toastId });
    }
  };

  const handleDownloadAll = async () => {
    if (students.length === 0) return;
    setIsDownloading(true);
    
    const loadingToastId = toast.loading(`Generating ${students.length} admit cards, please wait...`);
    
    try {
      const zip = new JSZip();
      const printArea = document.getElementById('admit-cards-print-container');
      
      if (printArea) {
        printArea.classList.remove('hidden');
        printArea.classList.add('flex');
        printArea.style.position = 'absolute';
        printArea.style.left = '0';
        printArea.style.top = '0';
        printArea.style.width = '210mm';
        printArea.style.zIndex = '-9999';
      }

      // Allow DOM to update and images to load
      await new Promise(resolve => setTimeout(resolve, 1500));

      const templates = document.querySelectorAll('.admit-card-wrapper');
      
      for (let i = 0; i < templates.length; i++) {
        const el = templates[i] as HTMLElement;
        const student = students[i];
        
        const imgData = await toJpeg(el, { cacheBust: true, pixelRatio: 1.5, quality: 0.75 });
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (el.offsetHeight * pdfWidth) / el.offsetWidth;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        const fileName = `${student.user?.name || student.name || `Student_${i+1}`}.pdf`;
        zip.file(fileName, pdf.output('blob'));
      }

      if (printArea) {
        printArea.classList.add('hidden');
        printArea.classList.remove('flex');
        printArea.style.position = '';
        printArea.style.left = '';
        printArea.style.top = '';
        printArea.style.width = '';
        printArea.style.zIndex = '';
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `AdmitCards_${selectedClassId}.zip`);
      toast.success('Downloaded successfully!', { id: loadingToastId });
    } catch (e: any) {
      console.error('Zip generation error:', e);
      toast.error(`Failed to generate zip file: ${e.message || 'Unknown error'}`, { id: loadingToastId });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedExamId) return;
    try {
      await api.post(`/api/exams/${selectedExamId}/admit-card-settings`, {
        admitCardPublished: published,
        admitCardSettings: {
          instructions,
          signatureUrl,
          teacherSignatureUrl,
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
        selectedExam.admitCardSettings = { instructions, signatureUrl, teacherSignatureUrl, logoUrl, examTitleOverride, examCenterOverride, schedule };
      }
    } catch (e: any) {
      toast.error('Failed to save settings: ' + e.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'signature' | 'teacherSignature' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/api/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (type === 'signature') setSignatureUrl(res.data.url);
      if (type === 'teacherSignature') setTeacherSignatureUrl(res.data.url);
      if (type === 'logo') setLogoUrl(res.data.url);
      toast.success(`${type === 'logo' ? 'Logo' : type === 'signature' ? 'Principal Signature' : 'Teacher Signature'} uploaded!`);
    } catch (err) {
      toast.error('Failed to upload image');
    }
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
                <div className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Admit Cards Sent
                  </span>
                  <button 
                    onClick={async () => {
                      setPublished(false);
                      try {
                        await api.post(`/api/exams/${selectedExamId}/admit-card-settings`, {
                          admitCardPublished: false,
                          admitCardSettings: selectedExam.admitCardSettings || {}
                        });
                        toast.success('Admit Cards unpublished!');
                        if (selectedExam) selectedExam.admitCardPublished = false;
                      } catch (e: any) {
                        toast.error('Failed to unpublish');
                        setPublished(true);
                      }
                    }}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2"
                  >
                    Unpublish
                  </button>
                </div>
              )}
              <button onClick={() => setShowSettings(!showSettings)} className="btn-secondary flex items-center gap-2">
                <Settings className="w-4 h-4" /> Settings
              </button>
            </>
          )}
          {students.length > 0 && (
            <div className="flex items-center gap-2">
              <button onClick={handleDownloadAll} disabled={isDownloading} className="btn-secondary flex items-center gap-2 font-bold bg-white text-indigo-700">
                {isDownloading ? <span className="animate-pulse">Processing...</span> : <Download className="w-4 h-4" />} 
                {!isDownloading && 'Download All'}
              </button>
              <button onClick={handlePrint} className="btn-primary flex items-center gap-2">
                <Printer className="w-4 h-4" /> Print All
              </button>
            </div>
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

              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mt-4">Teacher Signature Image</label>
              <div className="flex items-center gap-4">
                {teacherSignatureUrl ? (
                  <img src={teacherSignatureUrl} alt="Teacher Signature" className="h-16 object-contain border border-gray-200 rounded p-1" />
                ) : (
                  <div className="h-16 w-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400">No Image</div>
                )}
                <label className="btn-secondary cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'teacherSignature')} />
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
        !isSuperAdmin && !published ? (
          <div className="card p-12 flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800/50">
            <CheckCircle className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">Not Published Yet</h3>
            <p className="text-sm text-gray-500 mt-2">The admit cards for this exam have not been published by the administration.</p>
          </div>
        ) : (
        <>
          <div className="card print:hidden overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs">
                  <tr>
                    <th className="py-3 px-4">S.No</th>
                    <th className="py-3 px-4">Student Name</th>
                    {!isTeacher && <th className="py-3 px-4">Roll Number</th>}
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student, idx) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-gray-900 flex items-center gap-2 max-w-[150px] sm:max-w-[200px] overflow-hidden text-ellipsis">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                          {student.user?.name?.[0] || 'S'}
                        </div>
                        <span className="truncate">{student.user?.name || student.name}</span>
                      </td>
                      {!isTeacher && <td className="py-3 px-4 text-gray-600 font-medium">{student.rollNo || '-'}</td>}
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => handleDownloadSingle(student.user?.name || student.name, idx)} className="btn-secondary text-xs flex items-center gap-1 ml-auto">
                          <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Download</span> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div id="admit-cards-print-container" className="hidden print:block print-area space-y-12 bg-gray-50 dark:bg-gray-900 p-4 print:p-0 rounded-xl flex flex-col items-center">
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
          
            {students.map((student, idx) => (
              <div key={student.id} id={`admit-card-${idx}`} className="w-full flex justify-center bg-white">
                <AdmitCardTemplate student={student} exam={selectedExam} examPlans={examPlans} className={selectedClass?.name} section={selectedClass?.section} />
              </div>
            ))}
          </div>
        </>
        )
      )}

      {!loading && selectedExamId && selectedClassId && students.length === 0 && (
        <div className="p-12 text-center text-gray-400 font-medium">No students found for this class.</div>
      )}
    </div>
  );
};
