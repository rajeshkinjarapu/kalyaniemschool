import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import toast from 'react-hot-toast';
import { ArrowLeft, Printer, FileDown } from 'lucide-react';

export const ReportCardPage: React.FC = () => {
  const { examId, studentId } = useParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      const res: any = await api.get(`/api/marks/report-card/${studentId}/${examId}`);
      setReport(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [examId, studentId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const importToast = toast.loading('Generating Report Card PDF...');
    try {
      const response: any = await api.get(`/api/marks/report-card/${studentId}/${examId}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data || response], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_card_${studentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Report Card downloaded successfully!', { id: importToast });
    } catch (e: any) {
      toast.error('Failed to export Report Card PDF.', { id: importToast });
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="h-[50vh]" />;
  if (!report) return <div className="text-center py-12">Report card details not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <Link to="/exams" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Exams
        </Link>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={handleDownloadPdf} className="btn-primary flex items-center gap-2">
            <FileDown className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      <div className="card-container mx-auto p-4 bg-[#eef2f7] min-h-screen">
        <style>{`
          .jee-card {
            background: #fff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 30px rgba(0,0,0,0.08);
            border: 1px solid #dce4ed;
            position: relative;
            max-width: 794px;
            margin: 0 auto;
          }
          .top-bar { height: 12px; background: linear-gradient(90deg, #c0392b, #8e44ad, #2980b9, #27ae60); }
          .card-header { padding: 30px 40px 10px; display: flex; align-items: center; justify-content: space-between; }
          .logo-wrap { width: 90px; height: 90px; border-radius: 50%; border: 3px solid #eef2f7; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fff; }
          .title-wrap { flex: 1; text-align: center; padding: 0 20px; }
          .school-name { font-size: 26px; font-weight: 900; color: #c0392b; letter-spacing: 0.5px; margin-bottom: 2px; }
          .school-sub { font-size: 13px; font-weight: 700; color: #2c3e50; letter-spacing: 1px; margin-bottom: 6px; }
          .school-address { font-size: 12px; color: #7f8c8d; margin-bottom: 12px; }
          .exam-title { font-size: 16px; font-weight: 800; color: #fff; background: #2c3e50; display: inline-block; padding: 6px 20px; border-radius: 30px; letter-spacing: 0.5px; margin-bottom: 10px; }
          .result-card-label { font-size: 14px; font-weight: 800; color: #c0392b; letter-spacing: 3px; }
          .spacer { width: 90px; }
          .deco-line { display: flex; align-items: center; justify-content: center; gap: 15px; margin: 15px 40px 25px; }
          .deco-line .line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, #bdc3c7, transparent); }
          .deco-line .ornament { font-size: 14px; color: #c0392b; }
          .student-info { display: grid; grid-template-columns: 1fr 140px; gap: 30px; padding: 0 40px 30px; }
          .info-details { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
          .info-row { display: flex; flex-direction: column; gap: 3px; background: #f8fafc; padding: 8px 12px; border-radius: 8px; border-left: 3px solid #3498db; }
          .info-row .label { font-size: 11px; font-weight: 700; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px; }
          .info-row .value { font-size: 14px; font-weight: 800; color: #2c3e50; }
          .photo-col { display: flex; flex-direction: column; align-items: center; justify-content: center; }
          .placeholder-photo { width: 110px; height: 130px; background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: #94a3b8; }
          .perf-table-wrap { padding: 0 40px 30px; }
          .perf-title { display: flex; align-items: center; justify-content: space-between; font-size: 16px; font-weight: 800; color: #2c3e50; margin-bottom: 15px; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px; }
          .perf-table { width: 100%; border-collapse: collapse; }
          .perf-table th { background: #f8fafc; padding: 12px 15px; text-align: center; font-size: 12px; font-weight: 800; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
          .perf-table td { padding: 12px 15px; text-align: center; font-size: 14px; font-weight: 700; color: #2c3e50; border-bottom: 1px solid #f1f5f9; }
          .perf-table .subject-label { text-align: left; font-size: 14px; font-weight: 800; color: #34495e; padding-left: 20px; }
          .total-row td { background: #f8fafc; font-size: 16px; font-weight: 900; color: #c0392b; border-top: 2px solid #cbd5e1; border-bottom: none; }
          .result-footer { display: flex; justify-content: space-between; align-items: flex-end; padding: 30px 40px; background: #f8fafc; margin: 0 40px 30px; border-radius: 12px; border: 1px solid #e2e8f0; }
          .result-footer .total-label { font-size: 14px; font-weight: 700; color: #7f8c8d; margin-bottom: 5px; }
          .result-footer .percentage { font-size: 36px; font-weight: 900; color: #27ae60; letter-spacing: -1px; }
          .signatures { display: flex; gap: 40px; }
          .sig-block { text-align: center; }
          .sig-placeholder { width: 140px; height: 60px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 10px; }
          .sig-label { font-size: 12px; font-weight: 700; color: #94a3b8; }
          .card-footer-note { text-align: center; font-size: 11px; font-weight: 600; color: #aabaca; padding: 15px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
          @media print {
            body * { visibility: hidden; }
            .card-container, .card-container * { visibility: visible; }
            .card-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0; background: white; }
            .jee-card { box-shadow: none; border: none; max-width: 100%; }
          }
        `}</style>
        
        <div className="jee-card bg-white" id="resultCard">
          <div className="top-bar"></div>

          <div className="card-header">
            <div className="logo-wrap">
              <span className="text-4xl">🏫</span>
            </div>
            <div className="title-wrap">
              <div className="school-name">SRI VENKATESWARA JY SCHOOL</div>
              <div className="school-sub">(IIT-JEE / NEET Foundation · Olympiads)</div>
              <div className="school-address">Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta</div>
              <div className="exam-title">{report.exam.name}</div>
              <div className="result-card-label">✦ RESULT CARD ✦</div>
            </div>
            <div className="spacer"></div>
          </div>

          <div className="deco-line">
            <span className="ornament">✦</span>
            <div className="line"></div>
            <span className="ornament" style={{color: '#d4a017'}}>★</span>
            <div className="line"></div>
            <span className="ornament">✦</span>
          </div>

          <div className="student-info">
            <div className="info-details">
              <div className="info-row">
                <div className="label">👤 Student Name</div>
                <div className="value">{report.student.user.name}</div>
              </div>
              <div className="info-row">
                <div className="label">🆔 Student ID</div>
                <div className="value">{report.student.rollNo}</div>
              </div>
              <div className="info-row">
                <div className="label">📚 Class</div>
                <div className="value">{report.student.class.name}</div>
              </div>
              <div className="info-row">
                <div className="label">📖 Section</div>
                <div className="value">{report.student.class.section}</div>
              </div>
              <div className="info-row">
                <div className="label">📞 Mobile</div>
                <div className="value">{report.student.user.phone || 'N/A'}</div>
              </div>
              <div className="info-row">
                <div className="label">📅 Academic Year</div>
                <div className="value">{report.student.class.academicYear || '2024-2025'}</div>
              </div>
              <div className="info-row">
                <div className="label">📍 Location</div>
                <div className="value">Narasannapeta</div>
              </div>
              {report.rank && (
                <div className="info-row">
                  <div className="label">🏅 Class Rank</div>
                  <div className="value">#{report.rank}</div>
                </div>
              )}
            </div>
            <div className="photo-col">
              {report.student.user.photoUrl ? (
                <img src={report.student.user.photoUrl} alt="Student" className="w-[110px] h-[130px] object-cover rounded-lg border-2 border-gray-200" />
              ) : (
                <div className="placeholder-photo">📷</div>
              )}
            </div>
          </div>

          <div className="perf-table-wrap">
            <div className="perf-title">
              <div className="flex items-center gap-2">
                <span className="icon">📊</span>
                <span>Performance Summary</span>
              </div>
              <span className="text-xs font-semibold text-gray-500">Max Marks: {report.totalMax}</span>
            </div>

            <table className="perf-table">
              <thead>
                <tr>
                  <th style={{textAlign: 'left', paddingLeft: '20px'}}>Subject</th>
                  <th>Marks</th>
                  <th>Max Marks</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {report.marks.map((m: any, idx: number) => {
                  const pct = m.maxMarks > 0 ? ((m.marksObtained / m.maxMarks) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={idx}>
                      <td className="subject-label"><span className="mr-2">📘</span> {m.subject.name}</td>
                      <td>{m.marksObtained}</td>
                      <td>{m.maxMarks}</td>
                      <td>{pct}%</td>
                    </tr>
                  );
                })}
                <tr className="total-row">
                  <td className="subject-label" style={{color: '#c0392b'}}>📌 TOTAL</td>
                  <td>{report.totalObtained}</td>
                  <td>{report.totalMax}</td>
                  <td>{report.percentage}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="result-footer">
            <div className="left">
              <div className="total-label">📋 Total Marks: {report.totalObtained} / {report.totalMax}</div>
              <div className="percentage">{report.percentage}%</div>
            </div>
            <div className="signatures">
              <div className="sig-block">
                <div className="sig-placeholder"></div>
                <div className="sig-label">✍ Teacher Signature</div>
              </div>
              <div className="sig-block">
                <div className="sig-placeholder"></div>
                <div className="sig-label">✍ Principal Signature</div>
              </div>
            </div>
          </div>

          <div className="card-footer-note">
            ★ This is a system-generated result card for {report.exam.name} ★
          </div>
        </div>
      </div>
    </div>
  );
};
export default ReportCardPage;
