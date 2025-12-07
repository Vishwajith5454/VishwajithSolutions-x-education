
import React, { useState } from 'react';
import { Button, Input, Toast, Modal } from '../components/UI';
import { ShieldCheck, Cpu, User, Mail, BookOpen, Key } from 'lucide-react';
import { MOCK_COURSES } from '../constants';
import { mockService } from '../services/mockService';

export const CodeGenerator: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Form State
  const [targetEmail, setTargetEmail] = useState('');
  const [targetUsername, setTargetUsername] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(MOCK_COURSES[0].id);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'EMPIRE2026-CODE') {
      setIsAuthenticated(true);
      setToast({ msg: 'Admin Access Granted', type: 'success' });
    } else {
      setToast({ msg: 'Access Denied', type: 'error' });
    }
  };

  const handleGenerate = async () => {
    if (!targetEmail || !targetUsername) {
      setToast({ msg: 'Please enter user details', type: 'error' });
      return;
    }

    setIsGenerating(true);
    setGeneratedCode(null);

    // Simulate "AI Processing" time
    setTimeout(async () => {
      try {
        const code = await mockService.generateRedemptionCode(targetEmail, [selectedCourse], "Admin");
        setGeneratedCode(code);
        setToast({ msg: 'Code Generated Successfully', type: 'success' });
      } catch (err) {
        setToast({ msg: 'Generation failed', type: 'error' });
      } finally {
        setIsGenerating(false);
      }
    }, 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        <div className="w-full max-w-md glass-card p-8 rounded-2xl border border-red-500/20 shadow-[0_0_50px_rgba(220,38,38,0.1)] text-center">
           <ShieldCheck size={48} className="mx-auto text-red-500 mb-6" />
           <h2 className="font-display text-2xl font-bold mb-6 text-red-400">Restricted Area</h2>
           <form onSubmit={handleLogin} className="space-y-4">
             <Input 
               type="password" 
               placeholder="Enter Security Code" 
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               className="text-center font-mono tracking-widest"
             />
             <Button type="submit" className="w-full bg-red-900/50 hover:bg-red-800 border border-red-500/30 text-red-100">
               Authenticate
             </Button>
           </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
       {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
       
       <div className="relative w-full max-w-2xl">
          {/* Futuristic Box Container */}
          <div className="glass-card p-1 rounded-3xl relative overflow-hidden bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_80px_rgba(6,182,212,0.15)]">
            
            {/* Header */}
            <div className="bg-slate-900/80 p-6 flex items-center justify-between border-b border-white/5">
               <div className="flex items-center gap-3">
                  <Cpu className="text-cyan-400 animate-pulse" size={24} />
                  <h1 className="font-display text-xl font-bold text-white tracking-wider">AI CODE GENERATOR</h1>
               </div>
               <div className="text-xs font-mono text-cyan-600">SYS.VER.2026</div>
            </div>

            <div className="p-8 space-y-8">
               
               {/* User Details Section */}
               <div className="grid md:grid-cols-2 gap-6">
                 <div>
                    <label className="flex items-center gap-2 text-xs font-display text-fuchsia-400 mb-2 uppercase tracking-widest">
                      <User size={14} /> User Identity
                    </label>
                    <Input 
                      placeholder="Target Username" 
                      value={targetUsername}
                      onChange={(e) => setTargetUsername(e.target.value)}
                      className="bg-slate-950/80"
                    />
                 </div>
                 <div>
                    <label className="flex items-center gap-2 text-xs font-display text-fuchsia-400 mb-2 uppercase tracking-widest">
                      <Mail size={14} /> Linked Email
                    </label>
                    <Input 
                      placeholder="user@example.com" 
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      className="bg-slate-950/80"
                    />
                 </div>
               </div>

               {/* Course Selector */}
               <div>
                  <label className="flex items-center gap-2 text-xs font-display text-cyan-400 mb-2 uppercase tracking-widest">
                      <BookOpen size={14} /> Select Asset
                  </label>
                  <select 
                    className="w-full bg-slate-950/80 border border-slate-700 rounded px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors appearance-none"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                  >
                    {MOCK_COURSES.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.title} ({course.category})
                      </option>
                    ))}
                  </select>
               </div>

               {/* Action Area */}
               <div className="pt-4">
                 {!generatedCode ? (
                   <Button 
                     onClick={handleGenerate} 
                     isLoading={isGenerating}
                     className="w-full h-16 text-lg bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                   >
                     {isGenerating ? 'PROCESSING ALGORITHM...' : 'GENERATE SECURE CODE'}
                   </Button>
                 ) : (
                   <div className="animate-in zoom-in duration-300">
                      <div className="bg-slate-950 border border-emerald-500/50 rounded-xl p-6 text-center relative overflow-hidden">
                        <div className="text-xs text-emerald-500 uppercase tracking-widest mb-2">Code Generated Successfully</div>
                        <div className="font-mono text-3xl md:text-4xl font-bold text-white tracking-[0.2em] mb-4 select-all">
                          {generatedCode}
                        </div>
                        <Button 
                          onClick={() => {
                            navigator.clipboard.writeText(generatedCode);
                            setToast({ msg: 'Code Copied!', type: 'success' });
                          }}
                          variant="outline"
                          className="mx-auto border-emerald-500/50 text-emerald-400 hover:bg-emerald-950/30"
                        >
                          Copy to Clipboard
                        </Button>

                        {/* Reset */}
                        <button 
                          onClick={() => setGeneratedCode(null)} 
                          className="absolute top-2 right-2 text-slate-600 hover:text-white"
                        >
                          <Key size={16} />
                        </button>
                      </div>
                   </div>
                 )}
               </div>

            </div>
          </div>
       </div>
    </div>
  );
};
