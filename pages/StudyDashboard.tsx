
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Monitor, Globe, PenTool, Book, Cpu, X, PlayCircle } from 'lucide-react';

const subjects = [
  { 
    id: 'science', 
    name: 'Science', 
    icon: <Monitor size={32} />, 
    color: 'cyan',
    url: "https://rolexcoderz.in/Subjects/?subject_id=8615&course_id=39904"
  },
  { 
    id: 'social', 
    name: 'Social Science', 
    icon: <Globe size={32} />, 
    color: 'green',
    url: "https://rolexcoderz.in/Subjects/?subject_id=8614&course_id=39904"
  },
  { 
    id: 'maths', 
    name: 'Mathematics', 
    icon: <PenTool size={32} />, 
    color: 'blue',
    url: "https://rolexcoderz.in/Subjects/?subject_id=8613&course_id=39904"
  },
  { 
    id: 'it', 
    name: 'Information Technology', 
    icon: <Cpu size={32} />, 
    color: 'fuchsia',
    url: "https://rolexcoderz.in/Subjects/?subject_id=14891&course_id=39904"
  },
  { 
    id: 'english', 
    name: 'English (Lang & Lit)', 
    icon: <Book size={32} />, 
    color: 'yellow',
    url: "https://rolexcoderz.in/Subjects/?subject_id=21779&course_id=39904"
  },
];

export const StudyDashboard: React.FC = () => {
  const { courseId } = useParams();
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  // If a URL is active, show the full-screen iframe overlay
  if (activeUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col animate-in fade-in duration-300">
        {/* Header Bar for Close Button */}
        <div className="bg-slate-950 border-b border-white/10 p-3 flex justify-between items-center shadow-lg relative z-50">
           <div className="flex items-center gap-2 px-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-slate-300 font-mono text-sm uppercase">Live External Resource</span>
           </div>
           
           <button 
             onClick={() => setActiveUrl(null)}
             className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-full transition-all hover:rotate-90 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
             title="Close and Return to Dashboard"
           >
             <X size={24} />
           </button>
        </div>

        {/* The Iframe Content */}
        <div className="flex-1 w-full h-full bg-white relative">
           <iframe 
             src={activeUrl}
             className="absolute inset-0 w-full h-full border-0"
             title="Course Content"
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
             allowFullScreen
           />
        </div>
      </div>
    );
  }

  // Default View: Welcome Screen + Subject Grid
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 min-h-[80vh] flex flex-col">
      
      {/* Welcome Header */}
      <div className="text-center mb-16 space-y-4">
         <h1 className="font-display text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-cyan-500">
           Welcome to Your Classroom
         </h1>
         <p className="text-slate-400 max-w-2xl mx-auto text-lg">
           Select a subject below to launch the integrated learning environment. 
           <span className="block text-sm font-mono text-slate-500 mt-2">Course ID: {courseId}</span>
         </p>
      </div>

      {/* Subject Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto w-full">
         {subjects.map((subject) => (
           <div 
             key={subject.id}
             onClick={() => setActiveUrl(subject.url)}
             className={`group relative glass-card p-8 rounded-2xl cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:bg-slate-800/50 border border-white/5 hover:border-${subject.color}-500/50 overflow-hidden`}
           >
              {/* Background Glow Effect */}
              <div className={`absolute -right-10 -bottom-10 w-40 h-40 bg-${subject.color}-500/20 blur-[60px] rounded-full group-hover:bg-${subject.color}-500/30 transition-colors`}></div>

              <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                 {/* Icon Container */}
                 <div className={`w-20 h-20 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-${subject.color}-400 shadow-[0_0_30px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-transform duration-500`}>
                    {subject.icon}
                 </div>

                 {/* Text Content */}
                 <div>
                    <h3 className="font-display text-2xl font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors">
                      {subject.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">
                      Interactive Modules
                    </p>
                 </div>

                 {/* Action Button Indicator */}
                 <div className={`w-full py-3 rounded-lg border border-${subject.color}-500/30 text-${subject.color}-400 text-sm font-bold uppercase tracking-wider group-hover:bg-${subject.color}-600 group-hover:text-white group-hover:border-transparent transition-all duration-300 flex items-center justify-center gap-2`}>
                    <PlayCircle size={18} /> Open Subject
                 </div>
              </div>
           </div>
         ))}
      </div>
      
    </div>
  );
};
