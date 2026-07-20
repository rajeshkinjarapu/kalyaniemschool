import React from 'react';
import { User, Calendar, MapPin } from 'lucide-react';

interface AdmitCardTemplateProps {
  student: any;
  exam: any;
  examPlans: any[];
  className?: string;
  section?: string;
}

export const AdmitCardTemplate: React.FC<AdmitCardTemplateProps> = ({ student, exam, examPlans, className, section }) => {
  const settings = exam?.admitCardSettings || {};
  const instructions = settings.instructions || 'Candidate must carry this Admit Card to the examination hall.\nElectronic devices including calculators and mobile phones are strictly prohibited.\nCandidate should report to the examination center 30 minutes before commencement.';
  
  // Resolve relative /uploads/ paths to the backend URL so images load correctly on Vercel
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const resolveUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${API_BASE}${url}`;
  };
  
  const signatureUrl = resolveUrl(settings.signatureUrl || '');
  const logoUrl = resolveUrl(settings.logoUrl || '');

  return (
    <div className="admit-card-wrapper bg-white p-4 sm:p-6" style={{ fontFamily: 'Arial, sans-serif', color: 'black' }}>
      <div className="w-full h-full border-2 border-black relative flex flex-col bg-white overflow-hidden p-6 gap-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <div className="w-24 h-24 flex items-center justify-center shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" crossOrigin="anonymous" className="w-full h-full object-contain" />
            ) : (
              <div className="w-20 h-20 border border-gray-400 rounded-full flex items-center justify-center">
                <span className="text-xl font-black text-black">LOGO</span>
              </div>
            )}
          </div>
          <div className="flex-1 text-center px-4">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-wide text-black mb-1 whitespace-nowrap">
              SRI VENKATESWARA JY SCHOOL
            </h1>
            <p className="text-xs sm:text-sm font-bold uppercase text-gray-800 mb-1">
              (IIT-JEE/NEET Foundation – Olympiads)
            </p>
            <p className="text-sm font-medium text-gray-700">
              Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta
            </p>
          </div>
          <div className="w-24 shrink-0"></div> {/* Spacer for centering */}
        </div>

        {/* Title */}
        <div className="text-center pb-2">
          <h2 className="text-xl font-bold uppercase tracking-widest text-black underline underline-offset-4">
            Admit Card
          </h2>
          <div className="mt-2 text-sm font-bold text-gray-800 uppercase">
            {settings.examTitleOverride || `${exam?.name} (2026-2027)`}
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex gap-6 items-start">
            {/* Student Info Table */}
            <div className="flex-1 border border-black rounded-sm overflow-hidden">
              <table className="w-full text-sm text-left border-collapse">
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="p-4 font-bold bg-gray-100 border-r border-gray-300 w-1/3">Candidate Name</td>
                    <td className="p-4 font-bold text-black uppercase" colSpan={3}>
                      {student?.user?.name || student?.name}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-4 font-bold bg-gray-100 border-r border-gray-300">Roll Number</td>
                    <td className="p-4 font-bold text-black border-r border-gray-300 w-1/4">
                      {student?.rollNo || 'N/A'}
                    </td>
                    <td className="p-4 font-bold bg-gray-100 border-r border-gray-300">Class & Section</td>
                    <td className="p-4 font-bold text-black">
                      {className || student?.class?.name || student?.className || '-'} {section || student?.class?.section || student?.section ? `- ${section || student?.class?.section || student?.section}` : ''}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-4 font-bold bg-gray-100 border-r border-gray-300">Date of Birth</td>
                    <td className="p-4 font-bold text-black border-r border-gray-300">
                      12/05/2010
                    </td>
                    <td className="p-4 font-bold bg-gray-100 border-r border-gray-300">Gender</td>
                    <td className="p-4 font-bold text-black">
                      {student?.gender || 'Male'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold bg-gray-100 border-r border-gray-300">Exam Center</td>
                    <td className="p-4 font-bold text-black" colSpan={3}>
                      {settings.examCenterOverride || 'JY School Main Campus, Hall A'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Photo Area */}
            <div className="w-[120px] h-[150px] border border-black flex flex-col items-center justify-center text-gray-400 shrink-0 relative p-1 bg-gray-50">
              {student?.user?.photoUrl ? (
                <img src={student.user.photoUrl} alt="Student" crossOrigin="anonymous" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full border border-dashed border-gray-400 flex flex-col items-center justify-center text-center p-2">
                  <User className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-[10px] uppercase font-bold leading-tight text-gray-500">Affix<br/>Passport<br/>Size Photo</span>
                </div>
              )}
            </div>
          </div>

          {/* Exam Schedule */}
          <div>
            <h4 className="text-sm font-bold text-black uppercase tracking-wider mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Examination Schedule
            </h4>
            <div className="border border-black overflow-hidden">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-100 border-b border-black">
                  <tr>
                    <th className="py-2 px-3 font-bold uppercase text-xs tracking-wider border-r border-gray-300 text-center w-12">S.No</th>
                    <th className="py-2 px-3 font-bold uppercase text-xs tracking-wider border-r border-gray-300">Date</th>
                    <th className="py-2 px-3 font-bold uppercase text-xs tracking-wider border-r border-gray-300">Subject</th>
                    <th className="py-2 px-3 font-bold uppercase text-xs tracking-wider border-r border-gray-300">Time</th>
                    <th className="py-2 px-3 font-bold uppercase text-xs tracking-wider">Invigilator Sign</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {(settings.schedule?.length > 0 ? settings.schedule : examPlans)?.map((plan: any, i: number) => (
                    <tr key={plan.id || i}>
                      <td className="py-2 px-3 font-bold text-center border-r border-gray-300">{i + 1}</td>
                      <td className="py-2 px-3 font-bold border-r border-gray-300">{plan.date || plan.examDate ? new Date(plan.date || plan.examDate).toLocaleDateString('en-GB') : '-'}</td>
                      <td className="py-2 px-3 font-bold border-r border-gray-300">{plan.subject?.name || plan.subject}</td>
                      <td className="py-2 px-3 font-bold border-r border-gray-300">{plan.timing || `${plan.startTime || ''} ${plan.startTime && plan.endTime ? '-' : ''} ${plan.endTime || ''}`}</td>
                      <td className="py-2 px-3"></td>
                    </tr>
                  ))}
                  {(!settings.schedule?.length && (!examPlans || examPlans.length === 0)) && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-500 font-medium">No schedule mapped for this class.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Notes & Signatures */}
        <div className="mt-8 pt-6 border-t-2 border-black flex flex-col sm:flex-row justify-between gap-8">
          <div className="flex-1">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-black mb-2 underline underline-offset-2">Important Instructions:</h5>
            <ul className="text-[10px] text-black font-medium space-y-1 list-decimal pl-4 pr-4 text-justify leading-relaxed">
              {instructions.split('\n').filter(Boolean).map((line: string, idx: number) => (
                <li key={idx} className="pl-1">{line}</li>
              ))}
            </ul>
          </div>
          <div className="text-center w-56 shrink-0 flex flex-col items-center justify-end">
            <div className="w-full h-24 flex items-end justify-center mb-1 border-b border-black border-dashed">
              {signatureUrl && <img src={signatureUrl} alt="Signature" crossOrigin="anonymous" className="h-20 object-contain" />}
            </div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-black">Principal Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};
