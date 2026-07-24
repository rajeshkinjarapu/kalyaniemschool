import React from 'react';
import { Briefcase, FileText, Settings, Database, Server, Image, Calendar, Book, ChevronRight } from 'lucide-react';

export const OfficeToolsDashboard = () => {
  const tools = [
    { 
      title: 'STUDY CERTIFICATE', 
      description: 'Generate study certificates for students', 
      icon: FileText, 
      gradient: 'from-blue-500 to-cyan-400',
      shadow: 'shadow-blue-500/30'
    },
    { 
      title: 'DUPLICATE ACADEMIC PROGRESS CARD', 
      description: 'Issue duplicate progress cards', 
      icon: Settings, 
      gradient: 'from-indigo-500 to-purple-500',
      shadow: 'shadow-indigo-500/30'
    },
    { 
      title: 'ORIGINAL ACADEMIC PROGRESS CARD', 
      description: 'Generate original progress cards', 
      icon: Database, 
      gradient: 'from-fuchsia-500 to-pink-500',
      shadow: 'shadow-fuchsia-500/30'
    },
    { 
      title: 'TRANSFER CERTIFICATE', 
      description: 'Issue transfer certificates (TC)', 
      icon: Server, 
      gradient: 'from-rose-500 to-orange-400',
      shadow: 'shadow-rose-500/30'
    },
    { 
      title: 'Tool 5', 
      description: 'Description for tool 5', 
      icon: Image, 
      gradient: 'from-emerald-500 to-teal-400',
      shadow: 'shadow-emerald-500/30'
    },
    { 
      title: 'Tool 6', 
      description: 'Description for tool 6', 
      icon: Calendar, 
      gradient: 'from-amber-500 to-yellow-400',
      shadow: 'shadow-amber-500/30'
    },
    { 
      title: 'Tool 7', 
      description: 'Description for tool 7', 
      icon: Book, 
      gradient: 'from-violet-500 to-indigo-500',
      shadow: 'shadow-violet-500/30'
    },
    { 
      title: 'Tool 8', 
      description: 'Description for tool 8', 
      icon: Briefcase, 
      gradient: 'from-slate-700 to-slate-500',
      shadow: 'shadow-slate-500/30'
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">


      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <div 
              key={index} 
              onClick={() => {
                if (tool.title === 'ORIGINAL ACADEMIC PROGRESS CARD') {
                  window.open('/Slip Test Manual.html', '_blank');
                }
              }}
              className="group relative bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden flex flex-col items-start gap-4"
            >
              {/* Subtle hover background highlight */}
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

export default OfficeToolsDashboard;

