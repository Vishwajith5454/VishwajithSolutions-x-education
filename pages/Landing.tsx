import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
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
      <div className={`glass-card p-1 rounded-2xl transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-2 hover:shadow-[0_0_30px_${accentColor}] flex flex-col items-center text-center h-full overflow-hidden`}>
        {/* Glow Element */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[${accentColor}] to-transparent opacity-50 group-hover:opacity-100 transition-opacity`}></div>
        
        <div className="p-6 md:p-8 w-full flex flex-col items-center">
          {/* Label Top */}
          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-widest text-white mb-6 uppercase">
            {label}
          </h2>

          {/* 3D-Style Robot Avatar (Robohash) */}
          <div className="mb-8 relative w-48 h-48 transition-transform duration-700 animate-float">
             {/* Back Glow */}
             <div className={`absolute inset-8 blur-3xl opacity-30 rounded-full bg-[${accentColor}] animate-pulse`}></div>
             {/* Avatar Image - Using Robohash for a 3D rendered look */}
             <img 
               src={`https://robohash.org/${seed}?set=set1&size=300x300`} 
               alt={`${label} Avatar`}
               className="relative z-10 w-full h-full object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.6)] filter brightness-110 contrast-125"
             />
             {/* Holographic Platform Effect */}
             <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-[${accentColor}] blur-xl opacity-20 rounded-[100%]`}></div>
          </div>

          <p className="text-slate-400 text-sm mb-8 px-2 min-h-[48px] leading-relaxed">
             {role === 'admin' 
               ? 'Restricted access for system administrators and course instructors.' 
               : 'Access your personalized learning dashboard and course catalog.'}
          </p>

          <Button 
            onClick={onLogin} 
            variant={role === 'admin' ? 'secondary' : 'primary'}
            className="w-full group-hover:ring-2 group-hover:ring-offset-2 group-hover:ring-offset-slate-900"
          >
            Login as {label}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-x-hidden">
      
      {/* Toast Notification */}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Hero Section */}
      <div className="text-center mb-12 md:mb-16 relative z-10 max-w-6xl mx-auto w-full px-2">
        {/* Responsive Heading with Break-Word Support */}
        <h1 className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 animate-glitch leading-tight break-words whitespace-normal">
          VISHWAJITH <wbr/>SOLUTIONS <br className="lg:hidden" />
          <span className="text-cyan-400 inline-block transform hover:scale-125 transition-transform duration-300 mx-2">x</span> 
          EDUCATION
        </h1>
        <p className="text-slate-400 text-sm sm:text-base md:text-xl font-body tracking-wide max-w-2xl mx-auto border-l-2 border-cyan-500 pl-4">
          NEXT-GENERATION LEARNING ARCHITECTURE
        </p>
      </div>

      {/* Cards Container */}
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-center md:items-stretch justify-center w-full max-w-5xl relative z-10 pb-12 px-2">
        
        <Card 
          role="admin" 
          label="Administrator" 
          seed="AdminBotV1"
          accentColor="#d946ef" // Fuchsia
          onLogin={() => setAdminModalOpen(true)}
        />

        <Card 
          role="candidate" 
          label="Candidate" 
          seed="CandidateUnit01"
          accentColor="#06b6d4" // Cyan
          onLogin={() => navigate('/auth/candidate')}
        />

      </div>

      {/* Admin Login Modal */}
      <Modal isOpen={isAdminModalOpen} onClose={() => setAdminModalOpen(false)} title="Security Clearance">
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-fuchsia-400 bg-fuchsia-950/30 p-3 rounded border border-fuchsia-500/20">
            <Lock size={20} />
            <span className="text-sm font-mono">SECURE ENVIRONMENT DETECTED</span>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleAdminLogin(); }}>
            <Input 
              type="password" 
              label="Access Code" 
              placeholder="Enter passphrase..." 
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              autoFocus
            />
            <div className="mt-6 flex justify-end">
               <Button type="submit" variant="secondary">
                 Authenticate <ArrowRight size={16} className="ml-2 inline" />
               </Button>
            </div>
          </form>
        </div>
      </Modal>

    </div>
  );
};