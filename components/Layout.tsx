
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, LogOut, BookOpen, User as UserIcon, Clock, MapPin, Mail, X, Home, Info, Terminal } from 'lucide-react';
import { useAuth } from '../App';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, cart, logout, sessionExpiry } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Check if we are on the landing page
  const isLandingPage = location.pathname === '/';

  // Session Timer Logic for Display (Actual enforcement is in App.tsx)
  useEffect(() => {
    if (!sessionExpiry) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = sessionExpiry - now;

      if (diff <= 0) {
        setTimeLeft("00:00:00");
      } else {
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionExpiry]);

  return (
    <div className="min-h-screen flex flex-col font-body overflow-x-hidden">
      {/* NAVBAR - Always Visible */}
      <nav className="sticky top-0 z-40 w-full glass-card border-b border-white/10 px-3 py-3 md:px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 md:gap-4">
          {/* Brand Logo */}
          <div 
            className="font-display font-bold text-xs sm:text-base md:text-lg text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 cursor-pointer truncate max-w-[120px] sm:max-w-xs md:max-w-none shrink-0"
            onClick={() => navigate('/')}
            title="VISHWAJITH SOLUTIONS"
          >
            VISHWAJITH SOLUTIONS
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            
            {/* Public Links - Always Visible */}
            <div className={`flex items-center gap-2 md:gap-3 ${!isLandingPage && 'border-r border-white/10 pr-2 md:pr-3 mr-1'}`}>
              <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-slate-300 hover:text-cyan-400 transition-colors p-1 md:p-0">
                <Home size={16} /> <span className="hidden md:inline">Home</span>
              </button>
              <button onClick={() => navigate('/about')} className="flex items-center gap-1 text-sm text-slate-300 hover:text-cyan-400 transition-colors p-1 md:p-0">
                <Info size={16} /> <span className="hidden md:inline">About</span>
              </button>

              {/* Code Generator - VISIBLE ONLY ON LANDING PAGE */}
              {isLandingPage && (
                <button 
                  onClick={() => navigate('/code-generator')}
                  className="flex items-center gap-1 text-sm text-fuchsia-400 hover:text-fuchsia-300 transition-colors border border-fuchsia-500/30 px-2 py-1 rounded bg-fuchsia-900/10"
                >
                  <Terminal size={14} /> <span className="hidden md:inline">Code Gen</span>
                </button>
              )}
            </div>

            {/* User Controls - HIDDEN ON LANDING PAGE, visible elsewhere if logged in */}
            {user && !isLandingPage && (
              <>
                {/* Session Timer Display - Responsive */}
                <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-900/80 border border-red-500/30 text-red-400 font-mono text-xs md:text-sm shadow-[0_0_10px_rgba(239,68,68,0.2)]" title="Session Time Remaining">
                   <Clock size={12} className="animate-pulse md:w-3.5 md:h-3.5" />
                   <span className="md:inline">{timeLeft}</span>
                </div>
                
                <button 
                  onClick={() => navigate('/my-learning')}
                  className="flex items-center gap-2 text-sm text-slate-300 hover:text-cyan-400 transition-colors p-1 md:p-0"
                  title="My Learning"
                >
                  <BookOpen size={18} />
                  <span className="hidden lg:inline">My Learning</span>
                </button>

                <button 
                  onClick={() => navigate('/cart')}
                  className="relative p-2 text-slate-300 hover:text-cyan-400 transition-colors"
                  title="Cart"
                >
                  <ShoppingCart size={20} />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-fuchsia-600 text-[10px] font-bold text-white">
                      {cart.length}
                    </span>
                  )}
                </button>

                <div className="h-6 w-px bg-white/20 mx-0 md:mx-1"></div>

                <div className="flex items-center gap-1 md:gap-2">
                  <button 
                    onClick={() => setIsProfileOpen(true)}
                    className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-cyan-400 border border-cyan-500/30 shrink-0 hover:bg-cyan-900/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
                    title="View Profile & Location"
                  >
                    <UserIcon size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="text-slate-400 hover:text-red-400 transition-colors p-1"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* User Profile Modal */}
      {user && isProfileOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
           <div className="bg-slate-900 w-full max-w-md border border-cyan-500/50 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-900/40 to-slate-900 p-6 flex justify-between items-start border-b border-white/10">
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 rounded-xl bg-slate-800 border-2 border-cyan-400 flex items-center justify-center shadow-lg">
                      <UserIcon size={32} className="text-cyan-400" />
                   </div>
                   <div>
                      <h2 className="font-display font-bold text-xl text-white uppercase tracking-wide truncate max-w-[150px]">{user.name}</h2>
                      <div className="flex items-center gap-1 text-xs text-green-400 font-mono mt-1">
                         <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                         ACTIVE SESSION
                      </div>
                   </div>
                </div>
                <button onClick={() => setIsProfileOpen(false)} className="text-slate-400 hover:text-white">
                   <X size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                   <div className="flex items-center gap-3 text-slate-300">
                      <Mail size={18} className="text-fuchsia-400" />
                      <div className="flex-1 overflow-hidden">
                         <div className="text-[10px] text-slate-500 uppercase tracking-widest">Registered Email</div>
                         <div className="text-sm font-medium truncate">{user.email}</div>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-white/5 space-y-3">
                   <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold uppercase tracking-wider mb-2 border-b border-white/5 pb-2">
                      <MapPin size={16} /> Registered Location
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <div className="text-[10px] text-slate-500">Latitude</div>
                         <div className="font-mono text-white">{user.savedLocation?.latitude.toFixed(6)}</div>
                      </div>
                      <div>
                         <div className="text-[10px] text-slate-500">Longitude</div>
                         <div className="font-mono text-white">{user.savedLocation?.longitude.toFixed(6)}</div>
                      </div>
                   </div>
                </div>

                <div className="bg-red-950/20 p-4 rounded-lg border border-red-500/20 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-red-400 text-sm">
                      <Clock size={16} /> Expires In:
                   </div>
                   <div className="font-mono text-xl font-bold text-red-400">{timeLeft}</div>
                </div>

                <button 
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors text-sm uppercase font-bold"
                >
                  Close Profile
                </button>
              </div>
           </div>
        </div>
      )}

      <main className="flex-grow relative w-full">
         <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full mix-blend-screen"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-fuchsia-500/5 blur-[100px] rounded-full mix-blend-screen"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        </div>
        
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </main>

      <footer className="w-full glass-card border-t border-white/5 py-8 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="font-display font-bold text-lg md:text-2xl tracking-tighter text-slate-500 mb-4 hover:text-slate-300 transition-colors duration-500 break-words px-4">
              VISHWAJITH SOLUTIONS <span className="text-cyan-500">x</span> EDUCATION
            </h2>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500">
               <span className="cursor-pointer hover:text-cyan-400">Privacy Policy</span>
               <span className="hidden sm:inline">•</span>
               <span className="cursor-pointer hover:text-cyan-400">Terms of Service</span>
            </div>
            <p className="mt-8 text-xs text-slate-700 font-mono">
              SECURE DISTRIBUTION NETWORK
            </p>
        </div>
      </footer>
    </div>
  );
};
