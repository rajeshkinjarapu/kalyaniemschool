import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Printer, Download, FileText, CheckCircle, Settings, Upload, Save } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import { ProgressCardTemplate } from '../../components/Exams/ProgressCardTemplate';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

export const JEEProgressCardTab: React.FC<{ exams: any[] }> = ({ exams }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [showSettings, setShowSettings] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [teacherSignatureUrl, setTeacherSignatureUrl] = useState('');
  const [published, setPublished] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const resolveUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${API_BASE}${url}`;
  };

  const selectedExam = exams.find(e => e.id === selectedExamId);

  useEffect(() => {
    if (selectedExam) {
      setLogoUrl(selectedExam.admitCardSettings?.logoUrl || '');
      setSignatureUrl(selectedExam.admitCardSettings?.signatureUrl || '');
      setTeacherSignatureUrl(selectedExam.admitCardSettings?.teacherSignatureUrl || '');
      setPublished(selectedExam.progressCardPublished || false);
    }
  }, [selectedExam]);

  useEffect(() => {
    const fetchExamData = async () => {
      if (!selectedExamId || !selectedClassId) {
        setStudentsData([]);
        return;
      }
      setLoading(true);
      try {
        const res: any = await api.get(`/api/exams/${selectedExamId}/results?classId=${selectedClassId}`);
        // Map the results to the data format expected by ProgressCardTemplate
        // the API returns { studentId, name, rollNo, className, marks, total, percentage, grade, rank }
        // We map it to { studentName, rollNo, className, section, mobile, rank, marks, photo }
        const formattedData = (res.data?.data || res.data || []).map((s: any) => {
           // extract section if it's combined in className like "10th - A"
           let cName = s.className;
           let sec = '';
           if (cName.includes(' - ')) {
              [cName, sec] = cName.split(' - ');
           }
           return {
              studentId: s.studentId,
              studentName: s.name,
              rollNo: s.rollNo,
              className: cName,
              section: sec,
              mobile: s.mobile || '-',
              rank: s.rank,
              total: s.total,
              marks: s.marks,
              photo: s.photo || ''
           };
        });
        setStudentsData(formattedData);
      } catch (e) {
        console.error('Error fetching progress card data', e);
        toast.error('Failed to load student data');
      } finally {
        setLoading(false);
      }
    };
    fetchExamData();
  }, [selectedExamId, selectedClassId]);

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

  const handleSaveSettings = async () => {
    if (!selectedExamId) return;
    try {
      const currentSettings = selectedExam?.admitCardSettings || {};
      const newSettings = { ...currentSettings, logoUrl, signatureUrl, teacherSignatureUrl };
      
      await api.post(`/api/exams/${selectedExamId}/admit-card-settings`, {
        admitCardPublished: selectedExam?.admitCardPublished || false,
        admitCardSettings: newSettings,
        progressCardPublished: published
      });
      
      toast.success('Settings saved successfully!');
      if (selectedExam) {
        selectedExam.admitCardSettings = newSettings;
        selectedExam.progressCardPublished = published;
      }
      setShowSettings(false);
    } catch (e: any) {
      toast.error('Failed to save settings: ' + e.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const generatePDFForElement = async (el: HTMLElement, fileName: string) => {
    // Force element to be visible for capture if it's hidden
    const originalDisplay = el.style.display;
    const originalPosition = el.style.position;
    
    // We assume the parent container makes it visible, but just in case:
    el.style.display = 'flex';
    
    // Allow DOM to process
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const imgData = await toJpeg(el, { cacheBust: true, useCORS: true, pixelRatio: 2, quality: 0.95, backgroundColor: '#ffffff' });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (el.offsetHeight * pdfWidth) / el.offsetWidth;
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    
    // Restore
    el.style.display = originalDisplay;
    
    return pdf;
  };

  const handleDownloadSingle = async (studentId: string, studentName: string, index: number) => {
    const el = document.getElementById(`progress-card-${index}`);
    if (!el) return toast.error('Could not find card element');
    
    const toastId = toast.loading(`Generating PDF for ${studentName}...`);
    try {
      const pdf = await generatePDFForElement(el, studentName);
      pdf.save(`${studentName}_ProgressCard.pdf`);
      toast.success('Downloaded successfully!', { id: toastId });
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to generate PDF', { id: toastId });
    }
  };

  const handleDownloadAll = async () => {
    if (studentsData.length === 0) return;
    setIsDownloading(true);
    
    const loadingToastId = toast.loading(`Generating ${studentsData.length} progress cards. Please do not close this window...`);
    
    try {
      const zip = new JSZip();
      const printArea = document.getElementById('progress-cards-print-container');
      
      if (printArea) {
        printArea.classList.remove('hidden');
        printArea.classList.add('flex');
        printArea.style.position = 'absolute';
        printArea.style.left = '-9999px'; // Move off screen but keep rendered
        printArea.style.top = '0';
        printArea.style.width = '210mm';
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const templates = document.querySelectorAll('.progress-card-wrapper');
      
      for (let i = 0; i < templates.length; i++) {
        const el = templates[i] as HTMLElement;
        const data = studentsData[i];
        
        // Update toast progress every 5 cards
        if (i % 5 === 0) toast.loading(`Generated ${i} of ${templates.length}...`, { id: loadingToastId });
        
        const imgData = await toJpeg(el, { cacheBust: true, useCORS: true, pixelRatio: 1.5, quality: 0.8, backgroundColor: '#ffffff' });
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (el.offsetHeight * pdfWidth) / el.offsetWidth;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        const fileName = `${data.studentName || `Student_${i+1}`}_ProgressCard.pdf`;
        zip.file(fileName, pdf.output('blob'));
      }

      if (printArea) {
        printArea.classList.add('hidden');
        printArea.classList.remove('flex');
        printArea.style.position = '';
        printArea.style.left = '';
        printArea.style.top = '';
        printArea.style.width = '';
      }

      toast.loading(`Zipping files...`, { id: loadingToastId });
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `ProgressCards_${selectedExam?.name}_${selectedClassId}.zip`);
      toast.success('ZIP Downloaded successfully!', { id: loadingToastId });
    } catch (e: any) {
      console.error('Zip generation error:', e);
      toast.error(`Failed to generate zip file: ${e.message}`, { id: loadingToastId });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-150 dark:border-gray-800 print:hidden gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-extrabold uppercase text-gray-400 shrink-0">Select Exam:</span>
          <select 
            value={selectedExamId} 
            onChange={e => { setSelectedExamId(e.target.value); setSelectedClassId(''); }} 
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
        
        <div className="flex gap-2">
          {isSuperAdmin && selectedExam && (
            <>
              {!published ? (
                <button 
                  onClick={async () => {
                    setPublished(true);
                    try {
                      await api.post(`/api/exams/${selectedExamId}/admit-card-settings`, {
                        admitCardPublished: selectedExam.admitCardPublished || false,
                        admitCardSettings: selectedExam.admitCardSettings || {},
                        progressCardPublished: true
                      });
                      toast.success('Progress Cards published to Teachers & Students!');
                      if (selectedExam) selectedExam.progressCardPublished = true;
                    } catch (e: any) {
                      toast.error('Failed to publish');
                      setPublished(false);
                    }
                  }} 
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Publish Cards
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Published
                  </span>
                  <button 
                    onClick={async () => {
                      setPublished(false);
                      try {
                        await api.post(`/api/exams/${selectedExamId}/admit-card-settings`, {
                          admitCardPublished: selectedExam.admitCardPublished || false,
                          admitCardSettings: selectedExam.admitCardSettings || {},
                          progressCardPublished: false
                        });
                        toast.success('Progress Cards unpublished!');
                        if (selectedExam) selectedExam.progressCardPublished = false;
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
          {studentsData.length > 0 && (
            <>
              <button onClick={handleDownloadAll} disabled={isDownloading} className="btn-secondary flex items-center gap-2">
                {isDownloading ? <LoadingSpinner size="sm" /> : <Download className="w-4 h-4" />} 
                {isDownloading ? 'Generating...' : 'Download ZIP'}
              </button>
              <button onClick={handlePrint} className="btn-primary flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-lg shadow-blue-500/30">
                <Printer className="w-4 h-4" /> Print All Cards
              </button>
            </>
          )}
        </div>
      </div>

      {showSettings && selectedExamId && isSuperAdmin && (
        <div className="bg-white dark:bg-gray-900 border border-indigo-100 dark:border-gray-800 p-6 rounded-xl shadow-sm mb-6 print:hidden">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
            <h3 className="font-bold text-lg text-indigo-900">Progress Card Settings</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">School Logo Image</label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <img src={resolveUrl(logoUrl)} alt="Logo" className="h-16 object-contain border border-gray-200 rounded p-1" />
                ) : (
                  <div className="h-16 w-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400 bg-gray-50">No Logo</div>
                )}
                <label className="btn-secondary cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload Logo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} />
                </label>
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Principal Signature Image</label>
              <div className="flex items-center gap-4">
                {signatureUrl ? (
                  <img src={resolveUrl(signatureUrl)} alt="Signature" className="h-16 object-contain border border-gray-200 rounded p-1" />
                ) : (
                  <div className="h-16 w-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400 bg-gray-50">No Signature</div>
                )}
                <label className="btn-secondary cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload Signature
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'signature')} />
                </label>
              </div>

              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mt-4">Teacher Signature Image</label>
              <div className="flex items-center gap-4">
                {teacherSignatureUrl ? (
                  <img src={resolveUrl(teacherSignatureUrl)} alt="Teacher Signature" className="h-16 object-contain border border-gray-200 rounded p-1" />
                ) : (
                  <div className="h-16 w-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400 bg-gray-50">No Signature</div>
                )}
                <label className="btn-secondary cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload Signature
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'teacherSignature')} />
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-6 mt-4 border-t border-gray-100">
            <button onClick={handleSaveSettings} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Configuration
            </button>
          </div>
        </div>
      )}


      {loading && <div className="p-12 flex justify-center"><LoadingSpinner size="lg" /></div>}

      {!loading && studentsData.length > 0 && (
        <>
          {/* Table View of Students for Progress Cards */}
          <div className="card print:hidden overflow-hidden w-full">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800">Class Progress Cards</h3>
                <p className="text-xs text-gray-500">Generated {studentsData.length} cards based on exam results.</p>
              </div>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs">
                  <tr>
                    <th className="py-3 px-4 w-16">Rank</th>
                    <th className="py-3 px-4">Student Name</th>
                    {!isTeacher && <th className="py-3 px-4">Roll Number</th>}
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {studentsData.map((data, idx) => (
                    <tr key={data.studentId} className="hover:bg-gray-50 transition-colors bg-white">
                      <td className="py-3 px-4">
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">#{data.rank}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900 flex items-center gap-2 max-w-[150px] sm:max-w-[200px] overflow-hidden text-ellipsis">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                          {data.studentName?.[0] || 'S'}
                        </div>
                        <span className="truncate">{data.studentName}</span>
                      </td>
                      {!isTeacher && <td className="py-3 px-4 text-gray-600 font-medium">{data.rollNo || '-'}</td>}
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">{data.total}</td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => handleDownloadSingle(data.studentId, data.studentName, idx)} className="btn-secondary text-xs flex items-center gap-1 ml-auto hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                          <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Download</span> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hidden Container for Printing & PDF Generation */}
          <div id="progress-cards-print-container" className="hidden print:block print-area bg-gray-50 dark:bg-gray-900 p-0 flex-col items-center">
            <style dangerouslySetInnerHTML={{__html: `
            @media print {
              @page { size: A4 portrait; margin: 0; }
              body * { visibility: hidden; }
              .print-area, .print-area * { visibility: visible; }
              .print-area { position: absolute; left: 0; top: 0; width: 100%; background: white !important; display: block !important; padding: 0 !important; margin: 0 !important; }
              html, body { height: 100%; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
          `}} />
          
            {studentsData.map((data, idx) => (
              <div key={data.studentId} id={`progress-card-${idx}`} className="flex justify-center bg-white" style={{ width: '210mm' }}>
                <ProgressCardTemplate data={data} exam={selectedExam} settings={selectedExam?.admitCardSettings} />
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && selectedExamId && selectedClassId && studentsData.length === 0 && (
        <div className="p-12 text-center text-gray-400 font-medium bg-white rounded-xl border border-gray-100">
          No results found for this class. Make sure marks are entered and finalized.
        </div>
      )}
    </div>
  );
};
