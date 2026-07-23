import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  HelpCircle, 
  BookOpen, 
  FolderTree, 
  List, 
  BarChart, 
  Type, 
  FileUp, 
  FileText, 
  Key, 
  CheckCircle, 
  PieChart, 
  Settings, 
  ChevronRight 
} from 'lucide-react';

export const QuestionBankDashboard = () => {
  const navigate = useNavigate();
  const tools = [
    { title: 'Dashboard', description: 'Overview and analytics', icon: LayoutDashboard, gradient: 'from-blue-500 to-cyan-400', shadow: 'shadow-blue-500/30' },
    { title: 'Questions', description: 'Manage all questions', icon: HelpCircle, gradient: 'from-indigo-500 to-purple-500', shadow: 'shadow-indigo-500/30' },
    { title: 'Subjects', description: 'Manage subjects', icon: BookOpen, gradient: 'from-fuchsia-500 to-pink-500', shadow: 'shadow-fuchsia-500/30' },
    { title: 'Chapters', description: 'Manage chapters', icon: FolderTree, gradient: 'from-rose-500 to-orange-400', shadow: 'shadow-rose-500/30' },
    { title: 'Topics', description: 'Manage topics', icon: List, gradient: 'from-emerald-500 to-teal-400', shadow: 'shadow-emerald-500/30' },
    { title: 'Difficulty Levels', description: 'Configure difficulty levels', icon: BarChart, gradient: 'from-amber-500 to-yellow-400', shadow: 'shadow-amber-500/30' },
    { title: 'Question Types', description: 'Configure question types', icon: Type, gradient: 'from-violet-500 to-indigo-500', shadow: 'shadow-violet-500/30' },
    { title: 'Import / Export', description: 'Bulk data operations', icon: FileUp, gradient: 'from-slate-700 to-slate-500', shadow: 'shadow-slate-500/30' },
    { title: 'Question Paper Generator', description: 'Generate question papers', icon: FileText, gradient: 'from-blue-600 to-indigo-600', shadow: 'shadow-blue-500/30' },
    { title: 'Answer Keys', description: 'Manage answer keys', icon: Key, gradient: 'from-teal-500 to-emerald-500', shadow: 'shadow-teal-500/30' },
    { title: 'Review & Approval', description: 'Review questions', icon: CheckCircle, gradient: 'from-orange-500 to-red-500', shadow: 'shadow-orange-500/30' },
    { title: 'Reports', description: 'Question bank reports', icon: PieChart, gradient: 'from-purple-500 to-fuchsia-500', shadow: 'shadow-purple-500/30' },
    { title: 'Settings', description: 'Question bank settings', icon: Settings, gradient: 'from-gray-500 to-slate-500', shadow: 'shadow-gray-500/30' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <div 
              key={index} 
              className="group relative bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden flex flex-col items-start gap-4"
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br ${tool.gradient}`}></div>
              
              <div className={`relative z-10 p-4 rounded-xl bg-gradient-to-br ${tool.gradient} shadow-lg ${tool.shadow} text-white group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                <Icon className="w-6 h-6" strokeWidth={2} />
              </div>
              
              <div className="relative z-10 w-full mt-2">
                <div className="flex items-center justify-between w-full">
                  <h3 className="font-extrabold text-slate-800 text-lg group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-800 group-hover:to-slate-600 transition-colors">{tool.title}</h3>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors transform group-hover:translate-x-1" />
                </div>
                <p className="text-slate-500 text-sm mt-1.5 font-medium leading-relaxed">{tool.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionBankDashboard;
