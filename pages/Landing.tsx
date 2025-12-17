
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Cpu, ShieldCheck, Terminal, Code } from 'lucide-react';
import { Button, Modal, Input, Toast } from '../components/UI';

// Update to the new web component tag name provided
const DotLottieWC = 'dotlottie-wc' as unknown as React.ElementType;

// Card Component
const Card = ({ 
  role, 
  label, 
  lottieUrl,
  onLogin, 
  accentColor 
}: { 
  role: string, 
  label: string, 
  lottieUrl: string,
  onLogin: () => void, 
  accentColor: string 
}) => {
  return (
    <div className="group relative w-full max-w-sm mx-auto perspective-1000 z-10 my-4 md:my-0">
      <div className={`glass-card p-1 rounded-2xl transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-2 hover:shadow-[0_0_50px_${accentColor}40] flex flex-col items-center text-center h-full border border-white/5`}>
        
        {/* Animated Header Line */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[${accentColor}] to-transparent opacity-50 group-hover:opacity-100 transition-opacity`}></div>
        
        <div className="p-6 md:p-8 w-full flex flex-col items-center relative z-10">
          <div className={`text-[${accentColor}] mb-4 opacity-80 group-hover:scale-110 transition-transform duration-300`}>
             {role === 'admin' ? <ShieldCheck className="w-10 h-10 md:w-12 md:h-12" /> : <Cpu className="w-10 h-10 md:w-12 md:h-12" />}
          </div>

          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-widest text-white mb-6 uppercase glitch-wrapper" data-text={label}>
            {label}
          </h2>

          {/* Lottie Animation Container */}
          <div className="mb-6 relative w-64 h-64 md:w-72 md:h-72 transition-transform duration-700 flex items-center justify-center">
             {/* Glow behind avatar */}
             <div className={`absolute inset-0 blur-3xl opacity-20 rounded-full bg-[${accentColor}] animate-pulse pointer-events-none`}></div>
             
             {/* Lottie WC Component */}
             <div className="relative z-20 w-full h-full">
                <DotLottieWC
                  src={lottieUrl}
                  style={{ width: '100%', height: '100%' }}
                  autoplay={true}
                  loop={true}
                ></DotLottieWC>
             </div>
          </div>

          <div className="w-full bg-slate-900/50 rounded-lg p-3 mb-8 border border-white/5 relative z-20">
             <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mb-1">
                <Terminal size={10} />
                <span>SYSTEM_STATUS</span>
             </div>
             <p className={`text-xs md:text-sm font-mono ${role === 'admin' ? 'text-fuchsia-400' : 'text-cyan-400'}`}>
                {role === 'admin' ? 'ROOT_ACCESS // RESTRICTED' : 'CANDIDATE_ACCESS // READY'}
             </p>
          </div>

          <Button 
            onClick={onLogin} 
            variant={role === 'admin' ? 'secondary' : 'primary'}
            className="w-full relative overflow-hidden group-hover:ring-1 group-hover:ring-white/20 z-30 text-sm md:text-base"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
               INITIALIZE <ArrowRight size={16} />
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [isAdminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const handleAdminLogin = () => {
    if (adminPassword === 'EMPIRE2026' || adminPassword === 'EMPIRE2026-CODE') {
      navigate('/code-generator', { state: { authenticated: true } });
    } else {
      setToast({ msg: 'Access Denied: Invalid Credentials', type: 'error' });
      setAdminPassword('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-x-hidden bg-[#020617]">
      
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Futuristic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/5 blur-[150px] rounded-full animate-pulse-fast"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-fuchsia-500/5 blur-[150px] rounded-full animate-pulse-fast"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
      </div>

      <div className="text-center mb-12 relative z-10 max-w-7xl mx-auto w-full px-4 pt-8 md:pt-10">
        <div className="inline-flex items-center gap-3 mb-6 px-4 py-1.5 border border-cyan-500/30 rounded-full bg-cyan-900/10 backdrop-blur-md">
           <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
           <span className="text-cyan-400 font-mono text-[10px] md:text-xs tracking-[0.2em] md:tracking-[0.3em] font-bold">SECURE NETWORK ESTABLISHED</span>
        </div>
        
        {/* Main Title Block - Fully Responsive with Viewport Units */}
        <div className="relative mb-6 w-full break-words">
           <h1 className="font-display font-black leading-tight text-white tracking-tighter">
             <span className="block text-[7vw] sm:text-5xl md:text-7xl lg:text-8xl glitch-wrapper mb-2 md:mb-4 whitespace-nowrap md:whitespace-normal" data-text="VISHWAJITH_SOLUTIONS">
               VISHWAJITH_SOLUTIONS
             </span>
             <span className="block text-2xl sm:text-4xl md:text-6xl lg:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-slate-400 via-white to-slate-400 opacity-90">
               <span className="text-cyan-500 mx-2">x</span> EDUCATION
             </span>
           </h1>
        </div>
        
        <p className="text-slate-500 text-xs sm:text-base md:text-lg font-mono tracking-wide max-w-3xl mx-auto mt-8 border-l-2 border-cyan-500/50 pl-4 text-left md:text-center md:border-l-0 md:pl-0">
          DEPLOYING NEXT-GENERATION LEARNING PROTOCOLS. <br className="hidden md:block"/>
          SECURE ACCESS FOR ADMINISTRATORS AND CANDIDATES.
        </p>
      </div>

      {/* Cards Container */}
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-center justify-center w-full max-w-6xl relative z-10 pb-16 px-4">
        <Card 
          role="admin" 
          label="Administrator" 
          // ADMIN LOTTIE URL
          lottieUrl="https://lottie.host/f65427f9-61df-40da-b768-bf8a511959fe/JCHhLCJyF3.lottie"
          accentColor="#d946ef" 
          onLogin={() => setAdminModalOpen(true)}
        />
        
        {/* Divider / Connector (Desktop only) */}
        <div className="hidden md:flex flex-col items-center justify-center h-full gap-2 opacity-30">
           <div className="w-px h-20 bg-gradient-to-b from-transparent via-white to-transparent"></div>
           <div className="text-xs font-mono text-white tracking-widest rotate-90 whitespace-nowrap">SECURE LINK</div>
           <div className="w-px h-20 bg-gradient-to-b from-transparent via-white to-transparent"></div>
        </div>

        <Card 
          role="candidate" 
          label="Candidate" 
          // CANDIDATE LOTTIE URL
          lottieUrl="https://lottie.host/801a3c30-7f0d-451e-a4c6-66cf16b93d43/oZho3jAkdP.lottie"
          accentColor="#06b6d4" 
          onLogin={() => navigate('/auth/candidate')}
        />
      </div>

      {/* MAIN PAGE CODE GENERATOR BUTTON */}
      <div className="relative z-20 flex justify-center pb-12 w-full px-4">
         <button 
            onClick={() => navigate('/code-generator')}
            className="flex items-center gap-3 px-6 py-3 bg-slate-900/80 border border-fuchsia-500/30 rounded-full hover:bg-fuchsia-900/20 hover:border-fuchsia-400 transition-all duration-300 group shadow-lg max-w-full"
         >
            <div className="p-2 bg-fuchsia-600 rounded-full group-hover:scale-110 transition-transform shrink-0">
               <Code size={16} className="text-white" />
            </div>
            <div className="text-left overflow-hidden">
               <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase truncate">Developer Tools</div>
               <div className="text-sm font-bold text-white group-hover:text-fuchsia-300 truncate">ACCESS CODE GENERATOR</div>
            </div>
         </button>
      </div>

      <Modal isOpen={isAdminModalOpen} onClose={() => setAdminModalOpen(false)} title="Security Clearance">
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-fuchsia-400 bg-fuchsia-950/30 p-4 rounded border border-fuchsia-500/20">
            <Lock size={20} className="animate-pulse shrink-0" />
            <span className="text-sm font-mono tracking-wide">ENCRYPTED GATEWAY</span>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleAdminLogin(); }}>
            <Input 
              type="password" 
              label="Authorization Key" 
              placeholder="ENTER_PASSPHRASE" 
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              autoFocus
              className="font-mono tracking-widest text-center text-lg"
            />
            <div className="mt-6 flex justify-end">
               <Button type="submit" variant="secondary" className="w-full">
                 AUTHENTICATE <ArrowRight size={16} className="ml-2 inline" />
               </Button>
            </div>
          </form>
        </div>
      </Modal>

      <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-between items-end pointer-events-none opacity-50 hidden sm:flex">
         <div className="text-[10px] text-slate-600 font-mono">
            SYS.ID: {Math.random().toString(36).substring(7).toUpperCase()}
         </div>
         <div className="text-[10px] text-slate-600 font-mono text-right">
            VER.3.2.1 // STABLE
         </div>
      </div>
    </div>
  );
};
