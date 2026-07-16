import React from 'react';
import { format } from 'date-fns';

interface GatePassPrintProps {
  gatePass: any;
  schoolName?: string;
}

export const GatePassPrint: React.FC<GatePassPrintProps> = ({ gatePass, schoolName = 'JY SCHOOL' }) => {
  if (!gatePass) return null;

  const isTeacher = gatePass.requestType === 'TEACHER';
  const personName = isTeacher ? gatePass.requester?.name : gatePass.student?.user?.name;
  const personRole = isTeacher ? 'Staff' : 'Student';
  const personId = isTeacher ? gatePass.requester?.id?.substring(0, 8) : (gatePass.student?.rollNo || gatePass.student?.id?.substring(0, 8));
  const className = gatePass.student?.class ? `${gatePass.student.class.name} - ${gatePass.student.class.section}` : 'N/A';
  const photo = isTeacher ? gatePass.requester?.photoUrl : gatePass.student?.user?.photoUrl;

  return (
    <div className="hidden print:block w-full text-slate-900 bg-white">
      {/* 2 Copies (Security Copy & Person Copy) */}
      {[ 'SECURITY COPY', 'VISITOR COPY' ].map((copyType, idx) => (
        <div key={copyType} className={`${idx === 1 ? 'mt-8 border-t-2 border-dashed border-slate-300 pt-8' : ''}`}>
          <div className="max-w-[800px] mx-auto border-2 border-slate-900 p-6 rounded-lg relative overflow-hidden">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-slate-900 flex items-center justify-center overflow-hidden">
                  <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-wider">{schoolName}</h1>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Gate Pass Slip</p>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block bg-slate-900 text-white px-3 py-1 font-black text-[10px] tracking-widest uppercase rounded">
                  {copyType}
                </div>
                <div className="mt-2 text-sm font-bold uppercase tracking-wider">
                  Slip No: {gatePass.slipNumber}
                </div>
                <div className="text-xs font-semibold text-slate-600">
                  Date: {format(new Date(gatePass.createdAt), 'dd MMM yyyy')}
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="flex gap-6">
              {/* Photo Area */}
              <div className="w-[120px] shrink-0 flex flex-col gap-2">
                <div className="w-[120px] h-[150px] border-2 border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden rounded">
                  {photo ? (
                    <img src={photo} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-slate-400">NO PHOTO</span>
                  )}
                </div>
                <div className="text-center font-black text-[10px] uppercase tracking-wider bg-slate-200 py-1 rounded">
                  {personRole}
                </div>
              </div>

              {/* Details Area */}
              <div className="flex-1 grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Name</div>
                  <div className="font-bold border-b border-slate-300 pb-1">{personName || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">ID No</div>
                  <div className="font-bold border-b border-slate-300 pb-1">{personId || 'N/A'}</div>
                </div>
                
                {!isTeacher && (
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Class / Sec</div>
                    <div className="font-bold border-b border-slate-300 pb-1">{className}</div>
                  </div>
                )}
                
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Destination</div>
                  <div className="font-bold border-b border-slate-300 pb-1">{gatePass.destination || 'N/A'}</div>
                </div>

                <div className="col-span-2">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Reason</div>
                  <div className="font-bold border-b border-slate-300 pb-1">{gatePass.reason || 'N/A'}</div>
                </div>

                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Time Out</div>
                  <div className="font-bold border-b border-slate-300 pb-1">{gatePass.exitTime || '--:--'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Time In</div>
                  <div className="font-bold border-b border-slate-300 pb-1">{gatePass.returnTime || '--:--'}</div>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="flex justify-between items-end mt-12 px-4">
              <div className="text-center">
                <div className="w-32 border-b-2 border-slate-400 mb-2"></div>
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sign of Security</div>
              </div>
              <div className="text-center">
                <div className="w-32 border-b-2 border-slate-400 mb-2"></div>
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sign of Class Tr.</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-black text-slate-800 mb-1">{gatePass.approvedBy?.name || 'Pending'}</div>
                <div className="w-32 border-b-2 border-slate-400 mb-1"></div>
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Authorized By</div>
              </div>
            </div>

          </div>
        </div>
      ))}
    </div>
  );
};
