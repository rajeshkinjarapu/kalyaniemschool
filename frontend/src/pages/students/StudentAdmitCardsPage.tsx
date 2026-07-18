import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { ExternalLink, BookOpen, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

export const StudentAdmitCardsPage: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await api.get('/api/exams');
        // Filter exams that are published
        const publishedExams = (res.data || []).filter((e: any) => e.admitCardPublished);
        setExams(publishedExams);
      } catch (err) {
        console.error('Failed to fetch exams', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="h-[50vh]" />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">My Admit Cards</h1>
          <p className="text-indigo-100 font-medium">View and download your admit cards for upcoming and past examinations.</p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </div>

      {exams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-indigo-100 dark:border-gray-800 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">{exam.name}</h3>
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-2 inline-block">
                    {exam.term}
                  </span>
                </div>
              </div>
              
              <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800">
                <button 
                  onClick={() => window.open(`/admit-card-view/${exam.id}`, '_blank')}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2 font-bold shadow-md shadow-indigo-200"
                >
                  <ExternalLink className="w-4 h-4" /> Download / View Admit Card
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-150 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No Admit Cards Available</h3>
          <p className="text-gray-500 max-w-md mx-auto">There are currently no published admit cards. Check back later when exams approach.</p>
        </div>
      )}
    </div>
  );
};

export default StudentAdmitCardsPage;
