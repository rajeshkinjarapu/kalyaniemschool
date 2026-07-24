import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Printer, Download, FileText, CheckCircle, Settings, Upload, Save, FileSpreadsheet } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { ProgressCardTemplate } from '../../components/Exams/ProgressCardTemplate';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

export const JEEProgressCardTab: React.FC<{ exams: any[] }> = ({ exams }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN'; // Treated the same for this view per instructions
  
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  const [showSettings, setShowSettings] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [teacherSignatureUrl, setTeacherSignatureUrl] = useState('');
  const [examNameOverride, setExamNameOverride] = useState('');
  const [published, setPublished] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const formatName = (name: string) => {
    if (!name) return "";
    const parts = name.trim().split(" ");
    if (parts.length > 1) {
      return `${parts[0].charAt(0)}. ${parts.slice(1).join(" ")}`;
    }
    return name;
  };

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
      setExamNameOverride(selectedExam.admitCardSettings?.examNameOverride || '');
      setPublished(selectedExam.admitCardSettings?.progressCardPublished || false);
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
        const formattedData = (res.data?.data || res.data || []).map((s: any) => {
           let cName = s.className || '';
           let sec = '';
           if (cName && cName.includes(' - ')) {
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
      const newSettings = { ...currentSettings, logoUrl, signatureUrl, teacherSignatureUrl, examNameOverride, progressCardPublished: published };
      
      await api.post(`/api/exams/${selectedExamId}/admit-card-settings`, {
        admitCardPublished: selectedExam?.admitCardPublished || false,
        admitCardSettings: newSettings,
      });
      
      toast.success('Settings saved successfully!');
      if (selectedExam) {
        selectedExam.admitCardSettings = newSettings;
      }
      setShowSettings(false);
    } catch (e: any) {
      toast.error('Failed to save settings: ' + e.message);
    }
  };

  const generatePDFForElement = async (el: HTMLElement, fileName: string) => {
    const parentContainer = document.getElementById('progress-cards-print-container');
    const originalParentDisplay = parentContainer?.style.display || '';
    const originalParentPosition = parentContainer?.style.position || '';
    const originalParentZIndex = parentContainer?.style.zIndex || '';
    const originalParentTop = parentContainer?.style.top || '';
    const originalParentLeft = parentContainer?.style.left || '';
    
    if (parentContainer) {
      parentContainer.classList.remove('hidden');
      parentContainer.style.display = 'flex';
      // Keep in viewport but hide behind other content to fix mobile rendering issues
      parentContainer.style.position = 'fixed';
      parentContainer.style.top = '0';
      parentContainer.style.left = '0';
      parentContainer.style.zIndex = '-9999';
    }

    const originalDisplay = el.style.display;
    el.style.display = 'flex';
    
    // Wait a bit for images and layout to render
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const imgData = await toJpeg(el, { 
        quality: 1.0,
        backgroundColor: '#ffffff',
        pixelRatio: 2.5,
        style: { margin: '0' },
        useCORS: true
      } as any);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210; // Fixed A4 width in mm
      const pdfHeight = (1123 / 794) * pdfWidth; // Fixed aspect ratio
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      
      return pdf;
    } finally {
      el.style.display = originalDisplay;
      
      if (parentContainer) {
        parentContainer.classList.add('hidden');
        parentContainer.style.display = originalParentDisplay;
        parentContainer.style.position = originalParentPosition;
        parentContainer.style.zIndex = originalParentZIndex;
        parentContainer.style.top = originalParentTop;
        parentContainer.style.left = originalParentLeft;
      }
    }
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
      toast.error('Failed to generate PDF.', { id: toastId });
    }
  };

  const getWaUrl = (mobile: string) => `https://wa.me/${(mobile || '').replace(/\D/g, '')}?text=Please%20check%20your%20progress%20card`;

  const handleWhatsAppShare = async (studentId: string, studentName: string, index: number, mobile: string) => {
    const el = document.getElementById(`progress-card-${index}`);
    if (!el) return toast.error('Could not find card element');
    
    let canShareNatively = false;
    try {
      if ("share" in navigator && "canShare" in navigator) {
        canShareNatively = navigator.canShare({ files: [new File([''], 't.pdf', { type: 'application/pdf' })] });
      }
    } catch (e) {}

    let newWindow: Window | null = null;
    if (!canShareNatively) {
      newWindow = window.open('', '_blank');
      if (!newWindow) {
         toast.error("Popup blocked! Please allow popups for this site.");
         return;
      }
    }
    
    const toastId = toast.loading(`Preparing PDF for WhatsApp...`);
    let pdf;
    try {
      pdf = await generatePDFForElement(el, studentName);
    } catch (e) {
      console.error('PDF generation failed:', e);
      if (newWindow) newWindow.close();
      return toast.error('Failed to generate PDF.', { id: toastId });
    }
    
    try {
      const blob = pdf.output('blob');
      const file = new File([blob], `${studentName}_ProgressCard.pdf`, { type: 'application/pdf' });
      if (canShareNatively) {
        toast.dismiss(toastId);
        await navigator.share({
          files: [file],
          title: `${studentName} Progress Card`,
          text: `Please find the progress card for ${studentName} attached.`
        });
      } else {
        toast.success('Downloading PDF...', { id: toastId });
        pdf.save(`${studentName}_ProgressCard.pdf`);
        if (newWindow) newWindow.location.href = getWaUrl(mobile);
      }
    } catch (e: any) {
      console.error('WhatsApp share error:', e);
      if (e.name === 'AbortError') { 
         toast.dismiss(toastId); 
         if (newWindow) newWindow.close();
         return; 
      }
      pdf.save(`${studentName}_ProgressCard.pdf`);
      if (newWindow) newWindow.location.href = getWaUrl(mobile);
    }
  };

  const handleDownloadAllZip = async () => {
    if (studentsData.length === 0) return;
    setIsDownloading(true);
    const loadingToastId = toast.loading(`Generating ${studentsData.length} progress cards...`);
    try {
      const zip = new JSZip();
      
      const printArea = document.getElementById('progress-cards-print-container');
      const originalParentDisplay = printArea?.style.display || '';
      const originalParentPosition = printArea?.style.position || '';
      const originalParentZIndex = printArea?.style.zIndex || '';
      const originalParentTop = printArea?.style.top || '';
      const originalParentLeft = printArea?.style.left || '';

      if (printArea) {
        printArea.classList.remove('hidden');
        printArea.classList.add('flex');
        printArea.style.position = 'fixed';
        printArea.style.top = '0';
        printArea.style.left = '0';
        printArea.style.zIndex = '-9999';
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      const templates = document.querySelectorAll('.progress-card-wrapper');

      for (let i = 0; i < templates.length; i++) {
        const el = templates[i] as HTMLElement;
        const data = studentsData[i];
        
        if (i % 5 === 0) toast.loading(`Generated ${i} of ${studentsData.length}...`, { id: loadingToastId });
        
        const originalDisplay = el.style.display;
        el.style.display = 'flex';
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const imgData = await toJpeg(el, { 
          quality: 0.95,
          backgroundColor: '#ffffff',
          pixelRatio: 2,
          style: { margin: '0' },
          useCORS: true
        } as any);
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = 210;
        const pdfHeight = (1123 / 794) * pdfWidth;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        const fileName = `${data.studentName || `Student_${i+1}`}_ProgressCard.pdf`;
        zip.file(fileName, pdf.output('blob'));
        
        el.style.display = originalDisplay;
      }
      
      if (printArea) {
        printArea.classList.add('hidden');
        printArea.classList.remove('flex');
        printArea.style.display = originalParentDisplay;
        printArea.style.position = originalParentPosition;
        printArea.style.zIndex = originalParentZIndex;
        printArea.style.top = originalParentTop;
        printArea.style.left = originalParentLeft;
      }

      toast.loading('Zipping files...', { id: loadingToastId });
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `ProgressCards_${selectedExam?.name}_${selectedClassId}.zip`);
      toast.success('ZIP Downloaded successfully!', { id: loadingToastId });
    } catch (e: any) {
      console.error('Zip generation error:', e);
      toast.error(`Failed to generate zip: ${e.message}`, { id: loadingToastId });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintAll = () => {
    const parentContainer = document.getElementById('progress-cards-print-container');
    if (parentContainer) {
      parentContainer.classList.remove('hidden');
      parentContainer.style.display = 'block';
    }

    const cards = document.querySelectorAll('.progress-card-wrapper');
    cards.forEach((el) => {
      (el as HTMLElement).style.display = 'flex';
    });

    window.print();

    cards.forEach((el) => {
      (el as HTMLElement).style.display = '';
    });
    
    if (parentContainer) {
      parentContainer.classList.add('hidden');
      parentContainer.style.display = '';
    }
  };

  const handlePrintSingle = (idx: number) => {
    const parentContainer = document.getElementById('progress-cards-print-container');
    if (parentContainer) {
      parentContainer.classList.remove('hidden');
      parentContainer.style.display = 'block';
    }

    const cards = document.querySelectorAll('.progress-card-wrapper');
    cards.forEach((el, index) => {
      if (index === idx) {
        (el as HTMLElement).style.display = 'flex';
      } else {
        (el as HTMLElement).style.display = 'none';
      }
    });

    window.print();

    cards.forEach((el) => {
      (el as HTMLElement).style.display = '';
    });
    
    if (parentContainer) {
      parentContainer.classList.add('hidden');
      parentContainer.style.display = '';
    }
  };

  // ----- REPORTS GENERATION LOGIC -----
  
  const generateTabularPDF = (data: any[], title: string, subTitle: string, filename: string) => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = 297;
      const pageHeight = 210;
      const margin = 14;
      const usableWidth = pageWidth - 2 * margin;

      const schoolName = 'SRI VENKATESWARA JY SCHOOL';
      const headers = ['S.No / Rank', 'Student ID', 'Student Name', 'Class', 'Section', 'Mobile', 'Mat', 'Phy', 'Che', 'Total'];

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(schoolName, pageWidth / 2, 16, { align: 'center' });

      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(title, pageWidth / 2, 24, { align: 'center' });

      doc.setFontSize(11);
      doc.text(subTitle, pageWidth / 2, 30, { align: 'center' });

      const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      doc.setFontSize(9);
      doc.text(`Generated: ${dateStr}`, pageWidth - margin, 36, { align: 'right' });

      const colWidths = [20, 30, 50, 20, 20, 30, 16, 16, 16, 20];
      const totalColWidth = colWidths.reduce((a, b) => a + b, 0);
      const scale = usableWidth / totalColWidth;
      const scaledWidths = colWidths.map(w => w * scale);

      let y = 42;
      const rowHeight = 7;
      const headerHeight = 9;

      // Draw Headers
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      let x = margin;
      headers.forEach((h, i) => {
          doc.rect(x, y, scaledWidths[i], headerHeight, 'S');
          doc.text(h, x + scaledWidths[i] / 2, y + headerHeight / 2 + 1.5, { align: 'center' });
          x += scaledWidths[i];
      });
      y += headerHeight;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      data.forEach((row, idx) => {
          if (y + rowHeight > pageHeight - margin) {
              doc.addPage();
              y = margin + 4;
              doc.setFontSize(9);
              doc.setFont('helvetica', 'bold');
              x = margin;
              headers.forEach((h, i) => {
                  doc.rect(x, y, scaledWidths[i], headerHeight, 'S');
                  doc.text(h, x + scaledWidths[i] / 2, y + headerHeight / 2 + 1.5, { align: 'center' });
                  x += scaledWidths[i];
              });
              y += headerHeight;
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(8);
          }

          x = margin;
          const rowData = [
            `#${row.rank}`, 
            row.rollNo || row.studentId, 
            row.studentName, 
            row.className, 
            row.section, 
            row.mobile,
            row.marks?.find((m:any) => m.subject?.toLowerCase().startsWith('mat'))?.obtained || '-',
            row.marks?.find((m:any) => m.subject?.toLowerCase().startsWith('phy'))?.obtained || '-',
            row.marks?.find((m:any) => m.subject?.toLowerCase().startsWith('che'))?.obtained || '-',
            String(row.total)
          ];

          rowData.forEach((cell, i) => {
              doc.rect(x, y, scaledWidths[i], rowHeight, 'S');
              const align = (i === 0 || i === 1 || i === 5 || i > 5) ? 'center' : 'left';
              const pad = align === 'center' ? scaledWidths[i] / 2 : 2;
              doc.text(String(cell), x + pad, y + rowHeight / 2 + 1.5, { align: align as 'center'|'left' });
              x += scaledWidths[i];
          });
          y += rowHeight;
      });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('★ This is a system-generated report ★', pageWidth / 2, pageHeight - 6, { align: 'center' });

      doc.save(filename);
      toast.success('Report Downloaded Successfully!');
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to generate report: ' + e.message);
    }
  };

  const handleClassWiseReport = () => {
    if (studentsData.length === 0) return toast.error('No student data found');
    const cName = selectedExam?.classes?.find((c:any) => c.id === selectedClassId);
    generateTabularPDF(
      studentsData, 
      `CLASS WISE REPORT (${cName ? cName.name + '-' + cName.section : 'Class'})`,
      `${selectedExam?.name || 'Examination'} · Result Summary`,
      `ClassWiseReport_${selectedClassId}.pdf`
    );
  };

  const handleOverallRankList = async (format: 'pdf' | 'excel') => {
    setIsGeneratingReport(true);
    const toastId = toast.loading('Fetching all results and generating report...');
    try {
      // Fetch all results without class filter
      const res: any = await api.get(`/api/exams/${selectedExamId}/results`);
      const allData = (res.data?.data || res.data || []).map((s: any) => {
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
           rank: s.rank, // Backend natively calculates this when no class is provided
           total: s.total,
           marks: s.marks
        };
      });

      if (allData.length === 0) {
        toast.error('No students found for this exam', { id: toastId });
        return;
      }

      toast.success('Data fetched. Preparing file...', { id: toastId });

      if (format === 'pdf') {
        generateTabularPDF(
          allData, 
          'OVERALL RANK LIST (All Students)',
          `${selectedExam?.name || 'Examination'} · Rank Wise Summary (Total: ${allData.length})`,
          `Overall_RankList_${selectedExamId}.pdf`
        );
      } else {
        // Excel Export
        const excelData = [['Rank', 'Student Name', 'Class', 'Section', 'Student ID', 'Mobile', 'Mat', 'Phy', 'Che', 'Total']];
        allData.forEach((row: any) => {
          excelData.push([
            row.rank,
            row.studentName,
            row.className,
            row.section,
            row.rollNo || row.studentId,
            row.mobile,
            row.marks?.find((m:any) => m.subject?.toLowerCase().startsWith('mat'))?.obtained || '-',
            row.marks?.find((m:any) => m.subject?.toLowerCase().startsWith('phy'))?.obtained || '-',
            row.marks?.find((m:any) => m.subject?.toLowerCase().startsWith('che'))?.obtained || '-',
            row.total
          ]);
        });
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        ws['!cols'] = [{wch: 8}, {wch: 30}, {wch: 15}, {wch: 15}, {wch: 20}, {wch: 15}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 12}];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Overall Rank List');
        XLSX.writeFile(wb, `Overall_RankList_${selectedExamId}.xlsx`);
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to generate overall report', { id: toastId });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-gradient-to-r from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-5 rounded-2xl border border-indigo-100 dark:border-gray-800 shadow-sm print:hidden gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-black uppercase text-indigo-500 tracking-wider shrink-0 ml-1 sm:ml-0">Select Details:</span>
          <div className="flex flex-col sm:flex-row w-full gap-3">
            <select 
              value={selectedExamId} 
              onChange={e => { setSelectedExamId(e.target.value); setSelectedClassId(''); }} 
              className="input !py-2.5 sm:!py-2 w-full sm:min-w-[200px] border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500/20 bg-white shadow-sm font-semibold text-gray-700"
            >
              <option value="">-- Choose Exam --</option>
              {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
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
        
        {/* Settings Button for Super Admin */}
        {isSuperAdmin && selectedExam && (
          <div className="flex gap-2 w-full md:w-auto justify-start md:justify-end mt-2 md:mt-0">
             <button onClick={() => setShowSettings(!showSettings)} className="btn-secondary flex items-center gap-2 flex-1 md:flex-none justify-center">
               <Settings className="w-4 h-4" /> {showSettings ? 'Hide Settings' : 'Settings'}
             </button>
             {!published ? (
               <button 
                 onClick={async () => {
                   const confirmPublish = window.confirm('Are you sure you want to publish these results?');
                   if (confirmPublish) {
                     setPublished(true);
                     try {
                       const newSettings = { ...(selectedExam.admitCardSettings || {}), progressCardPublished: true };
                       await api.post(`/api/exams/${selectedExamId}/admit-card-settings`, {
                         admitCardPublished: selectedExam?.admitCardPublished || false,
                         admitCardSettings: newSettings
                       });
                       toast.success('Results published successfully!');
                     } catch (e: any) {
                       toast.error('Failed to publish');
                       setPublished(false);
                     }
                   }
                 }} 
                 className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 flex-1 md:flex-none justify-center shadow-md shadow-emerald-500/20"
               >
                 <CheckCircle className="w-4 h-4" /> Publish Cards
               </button>
             ) : (
               <div className="flex items-center gap-2 flex-1 md:flex-none">
                 <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 border border-emerald-200 justify-center w-full md:w-auto shadow-sm">
                   <CheckCircle className="w-4 h-4" /> Published
                 </span>
               </div>
             )}
          </div>
        )}
      </div>

      {/* Super Admin Settings Panel */}
      {showSettings && selectedExamId && isSuperAdmin && (
        <div className="bg-white dark:bg-gray-900 border border-indigo-100 dark:border-gray-800 p-6 rounded-xl shadow-sm mb-6 print:hidden">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
            <h3 className="font-bold text-lg text-indigo-900">Progress Card Settings</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Custom Exam Name (Optional)</label>
              <input
                type="text"
                value={examNameOverride}
                onChange={(e) => setExamNameOverride(e.target.value)}
                placeholder={`Default: ${selectedExam?.name || 'EXAMINATION RESULT CARD'}`}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-800"
              />
            </div>
            
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

      {/* Global Actions (Super Admin Only) */}
      {isSuperAdmin && studentsData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
            <button onClick={handleDownloadAllZip} disabled={isDownloading} className="flex flex-col items-center justify-center p-4 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors gap-2 text-indigo-700 font-bold text-sm">
               {isDownloading ? <LoadingSpinner size="sm" /> : <Download className="w-6 h-6" />}
               Generate ZIP (All)
            </button>
            <button onClick={handleClassWiseReport} className="flex flex-col items-center justify-center p-4 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors gap-2 text-blue-700 font-bold text-sm">
               <FileText className="w-6 h-6" />
               Class Wise Report (PDF)
            </button>
            <button onClick={() => handleOverallRankList('pdf')} disabled={isGeneratingReport} className="flex flex-col items-center justify-center p-4 bg-purple-50 border border-purple-100 rounded-xl hover:bg-purple-100 transition-colors gap-2 text-purple-700 font-bold text-sm">
               <FileText className="w-6 h-6" />
               Overall Rank List (PDF)
            </button>
            <button onClick={() => handleOverallRankList('excel')} disabled={isGeneratingReport} className="flex flex-col items-center justify-center p-4 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-colors gap-2 text-emerald-700 font-bold text-sm">
               <FileSpreadsheet className="w-6 h-6" />
               Overall Rank List (Excel)
            </button>
        </div>
      )}

      {loading && <div className="p-12 flex justify-center"><LoadingSpinner size="lg" /></div>}

      {!loading && studentsData.length > 0 && (
        !isSuperAdmin && !published ? (
          <div className="card p-12 flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800/50">
            <CheckCircle className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">Not Published Yet</h3>
            <p className="text-sm text-gray-500 mt-2">The progress cards for this exam have not been published by the administration.</p>
          </div>
        ) : (
        <>
          {/* Mobile-friendly Rank List for Teachers & Super Admins */}
          <div className="card print:hidden overflow-hidden w-full">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800">Class Rank List</h3>
                <p className="text-xs text-gray-500">Generated {studentsData.length} cards based on exam results.</p>
              </div>
              {isSuperAdmin && (
                 <button onClick={handlePrintAll} className="hidden md:flex btn-primary items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-lg shadow-blue-500/30 text-sm">
                    <Printer className="w-4 h-4" /> Print All Cards
                 </button>
              )}
            </div>
            
            {/* Table layout (hidden on small mobile screens if desired, but making it fully responsive) */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm text-left whitespace-nowrap min-w-full">
                <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs">
                  <tr>
                    <th className="py-2 px-2 w-8 text-center">Rank</th>
                    <th className="py-2 px-2">Student Name</th>
                    {/* Hide detailed stats on small screens if you want, but user requested mobile friendly. Let's keep it clean */}
                    {!isTeacher && <th className="py-2 px-2 hidden md:table-cell">Student ID</th>}
                    <th className="py-2 px-2 text-center hidden md:table-cell">Mat</th>
                    <th className="py-2 px-2 text-center hidden md:table-cell">Phy</th>
                    <th className="py-2 px-2 text-center hidden md:table-cell">Che</th>
                    <th className="py-2 px-2 text-center">Total</th>
                    <th className="py-2 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {studentsData.map((data, idx) => (
                    <React.Fragment key={data.studentId}>
                    <tr onClick={() => setExpandedRow(expandedRow === data.studentId ? null : data.studentId)} 
                      className="hover:bg-gray-50 transition-colors bg-white cursor-pointer md:cursor-auto"
                    >
                      <td className="py-2 px-2 text-center">
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-1 rounded-md text-xs">#{data.rank}</span>
                      </td>
                      <td className="py-2 px-2 font-bold text-gray-900 whitespace-normal break-words max-w-[120px] md:max-w-none text-xs sm:text-sm">
                        {formatName(data.studentName)}
                        <div className="text-[10px] sm:text-xs font-normal text-gray-500 mt-0.5">{data.className} {data.section}</div>
                      </td>
                      {!isTeacher && <td className="py-2 px-2 text-gray-600 font-medium hidden md:table-cell text-sm">{data.rollNo || '-'}</td>}
                      <td className="py-2 px-2 text-center hidden md:table-cell font-medium text-gray-700 text-sm">
                        {data.marks?.find((m: any) => m.subject === 'Mathematics' || m.subject === 'Maths' || m.subject === 'MAT')?.obtained ?? '-'}
                      </td>
                      <td className="py-2 px-2 text-center hidden md:table-cell font-medium text-gray-700 text-sm">
                        {data.marks?.find((m: any) => m.subject === 'Physics' || m.subject === 'PHY')?.obtained ?? '-'}
                      </td>
                      <td className="py-2 px-2 text-center hidden md:table-cell font-medium text-gray-700 text-sm">
                        {data.marks?.find((m: any) => m.subject === 'Chemistry' || m.subject === 'CHE')?.obtained ?? '-'}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="font-bold text-emerald-600 text-sm">{data.total}</span>
                      </td>
                      
                      <td className="py-2 px-2 flex justify-end gap-1 sm:gap-2 items-center">
                        {!isTeacher && (
                          <button onClick={(e) => { e.stopPropagation(); handlePrintSingle(idx); }} className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors" title="Print Card">
                              <Printer className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); handleDownloadSingle(data.studentId, data.studentName, idx); }} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 p-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors" title="Download PDF">
                            <Download className="w-4 h-4" /> 
                        </button>
                        
                        <button onClick={(e) => { e.stopPropagation(); handleWhatsAppShare(data.studentId, data.studentName, idx, data.mobile); }} className="bg-green-50 hover:bg-green-100 text-green-600 p-2 md:px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors" title="Send WhatsApp">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                            </svg> <span className="hidden md:inline">Share</span>
                        </button>
                      </td>
                    </tr>
                    {expandedRow === data.studentId && (
                    <tr className="md:hidden bg-indigo-50/20 border-b border-gray-100">
                       <td colSpan={5} className="px-4 py-3">
                          <div className="grid grid-cols-3 gap-2 w-full text-center">
                             <div className="bg-white border border-indigo-100 rounded-lg p-2 shadow-sm">
                                <div className="text-[10px] font-bold text-gray-500 uppercase">MAT</div>
                                <div className="font-black text-indigo-700">{data.marks?.find((m: any) => m.subject === 'Mathematics' || m.subject === 'Maths' || m.subject === 'MAT')?.obtained ?? '-'}</div>
                             </div>
                             <div className="bg-white border border-indigo-100 rounded-lg p-2 shadow-sm">
                                <div className="text-[10px] font-bold text-gray-500 uppercase">PHY</div>
                                <div className="font-black text-indigo-700">{data.marks?.find((m: any) => m.subject === 'Physics' || m.subject === 'PHY')?.obtained ?? '-'}</div>
                             </div>
                             <div className="bg-white border border-indigo-100 rounded-lg p-2 shadow-sm">
                                <div className="text-[10px] font-bold text-gray-500 uppercase">CHE</div>
                                <div className="font-black text-indigo-700">{data.marks?.find((m: any) => m.subject === 'Chemistry' || m.subject === 'CHE')?.obtained ?? '-'}</div>
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

          {/* Hidden Container for Printing & PDF Generation */}
          <div id="progress-cards-print-container" className="hidden print:flex print-area bg-gray-50 dark:bg-gray-900 p-0 flex-col items-center">
            {studentsData.map((data, idx) => (
              <div key={data.studentId} id={`progress-card-${idx}`} className="progress-card-wrapper justify-center bg-white hidden" style={{ width: '210mm' }}>
                <ProgressCardTemplate data={data} exam={selectedExam} settings={selectedExam?.admitCardSettings} />
              </div>
            ))}
          </div>
        </>
        )
      )}

      {!loading && selectedExamId && selectedClassId && studentsData.length === 0 && (
        <div className="p-12 text-center text-gray-400 font-medium bg-white rounded-xl border border-gray-100">
          No results found for this class. Make sure marks are entered and finalized.
        </div>
      )}
    </div>
  );
};


