import React, { useState } from 'react';
import { Upload, FileType, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { SectionHeader } from '../../components/UI/SectionHeader';
import { Card } from '../../components/UI/Card';

export const OMRScannerPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    // TODO: Implement OMR upload logic connecting to backend Python microservice
    setTimeout(() => {
      alert('OMR processing engine is currently being configured with the backend. Please wait for the final implementation!');
      setIsUploading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionHeader 
        title="OMR Scanner" 
        subtitle="Upload scanned OMR sheets (PDF or Images) for automatic evaluation" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 border-dashed border-2 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 transition-colors text-center relative group">
            <input 
              type="file" 
              multiple 
              accept=".pdf,image/*" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Drag & Drop or Click to Upload</h3>
                <p className="text-sm text-slate-500 mt-1">Upload scanned PDFs or Images of OMR sheets.</p>
              </div>
            </div>
          </Card>

          {files.length > 0 && (
            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2 flex justify-between">
                Selected Files ({files.length})
                <button onClick={() => setFiles([])} className="text-xs text-red-500 hover:underline">Clear All</button>
              </h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <FileType className="w-5 h-5 text-indigo-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{f.name}</p>
                      <p className="text-xs text-slate-500">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                ))}
              </div>
              <button 
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
              >
                {isUploading ? 'Processing OMR Sheets...' : 'Start OMR Scan'}
              </button>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-amber-50 border-amber-100">
            <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4" />
              Important Instructions
            </h3>
            <ul className="text-xs text-amber-700 space-y-2 list-disc pl-4">
              <li>Please ensure the scanned documents are not blurry or wrinkled.</li>
              <li>For 100% accuracy, use a flat-bed scanner instead of mobile cameras.</li>
              <li>Wait for the processing engine to match the answers with the Exam Key.</li>
              <li>Any manual review warnings will appear after processing.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
