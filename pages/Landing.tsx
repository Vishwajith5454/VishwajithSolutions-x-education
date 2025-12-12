import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Cpu, ShieldCheck } from 'lucide-react';
import { Button, Modal, Input, Toast } from '../components/UI';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [isAdminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const handleAdminLogin = () => {
    if (adminPassword === 'EMPIRE2026') {
      window.location.href = 'https://www.rolexcoderz.xyz/Course';
    } else {
      setToast({ msg: 'Access Denied: Invalid Credentials', type: 'error' });
      setAdminPassword('');
    }
  };

  const Card = ({ 
    role, 
    label, 
    seed,
    onLogin, 
    accentColor 
  }: { 
    role: string, 
    label: string, 
    seed: string,
    onLogin: () => void, 
    accentColor: string 
  }) => (
    <div className="group relative w-full max-w-sm mx-auto perspective-1000">
      <div className={`glass-card p-1 rounded-2xl transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-2 hover:shadow-[0_0_50px_${accentColor}40] flex flex-col items-center text-center h-full overflow-hidden border border-white/5`}>
        
        {/* Animated Header Line */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[${accentColor}] to-transparent opacity-50 group-hover:opacity-100 transition-opacity`}></div>
        
        <div className="p-8 w-full flex flex-col items-center relative z-10">
          <div className={`text-[${accentColor}] mb-4 opacity-80`}>
             {role === 'admin' ? <ShieldCheck size={32} /> : <Cpu size={32} />}
          </div>

          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-widest text-white mb-6 uppercase glitch-wrapper" data-text={label}>
            {label}
          </h2>

          {/* Avatar Container */}
          <div className="mb-8 relative w-40 h-40 transition-transform duration-700 animate-float">
             <div className={`absolute inset-0 blur-2xl opacity-20 rounded-full bg-[${accentColor}] animate-pulse`}></div>
             <img 
               src={`https://robohash.org/${seed}?set=set1&size=300x300`} 
               alt={`${label} Avatar`}
               className="relative z-10 w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
             />
          </div>

          <p className="text-slate-400 text-sm mb-8 leading-relaxed font-mono">
             {role === 'admin' 
               ? 'SYSTEM: ROOT_ACCESS // RESTRICTED' 
               : 'SYSTEM: CANDIDATE_ACCESS // LEARNING_MODULES'}
          </p>

          <Button 
            onClick={onLogin} 
            variant={role === 'admin' ? 'secondary' : 'primary'}
            className="w-full relative overflow-hidden group-hover:ring-1 group-hover:ring-white/20"
          >
            <span className="relative z-10">INITIALIZE LOGIN</span>
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-x-hidden bg-[#020617]">
      
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Futuristic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[150px] rounded-full"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-500/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="text-center mb-16 relative z-10 max-w-6xl mx-auto w-full px-4">
        <div className="inline-block mb-4 px-3 py-1 border border-cyan-500/30 rounded-full bg-cyan-900/10 backdrop-blur-md">
           <span className="text-cyan-400 font-mono text-xs tracking-[0.2em] animate-pulse">EST. 2026 // SECURE CONNECTION</span>
        </div>
        
        <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-4 text-white leading-tight">
          <span className="block glitch-wrapper mb-2" data-text="VISHWAJITH">VISHWAJITH</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-500">
            SOLUTIONS
            <span className="text-cyan-500 mx-3 align-middle text-4xl md:text-6xl">x</span>
            EDUCATION
          </span>
        </h1>
        
        <p className="text-slate-500 text-sm sm:text-lg font-mono tracking-wide max-w-2xl mx-auto mt-6">
          <span className="text-cyan-500">&gt;</span> NEXT_GEN LEARNING ARCHITECTURE DEPLOYED
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-16 items-center justify-center w-full max-w-5xl relative z-10 pb-12">
        <Card 
          role="admin" 
          label="Administrator" 
          seed="AdminBotV1"
          accentColor="#d946ef" 
          onLogin={() => setAdminModalOpen(true)}
        />
        <Card 
          role="candidate" 
          label="Candidate" 
          seed="CandidateUnit01"
          accentColor="#06b6d4" 
          onLogin={() => navigate('/auth/candidate')}
        />
      </div>

      <Modal isOpen={isAdminModalOpen} onClose={() => setAdminModalOpen(false)} title="Security Clearance">
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-fuchsia-400 bg-fuchsia-950/30 p-4 rounded border border-fuchsia-500/20">
            <Lock size={20} className="animate-pulse" />
            <span className="text-sm font-mono tracking-wide">SECURE ENVIRONMENT DETECTED</span>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleAdminLogin(); }}>
            <Input 
              type="password" 
              label="Access Code" 
              placeholder="ENTER_PASSPHRASE" 
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              autoFocus
              className="font-mono tracking-widest text-center"
            />
            <div className="mt-6 flex justify-end">
               <Button type="submit" variant="secondary" className="w-full">
                 AUTHENTICATE <ArrowRight size={16} className="ml-2 inline" />
               </Button>
            </div>
          </form>
        </div>
      </Modal>

      <div className="fixed bottom-4 left-0 right-0 text-center pointer-events-none">
         <p className="text-[10px] text-slate-700 font-mono">SYS.VER.2.0.4 // ENCRYPTED</p>
      </div>
    </div>
  );
};