import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Button, Input, Toast } from '../components/UI';
import { MapPin, AlertTriangle, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import { mockService } from '../services/mockService';
import { LocationCoords } from '../types';

type AuthStatus = 'idle' | 'acquiring_location' | 'verifying' | 'success';

export const CandidateAuth: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth(); 
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/courses', { replace: true });
    }
  }, [user, navigate]);

  // Load remembered email on mount (only for login mode effectively)
  useEffect(() => {
    if (!isRegisterMode) {
      const savedEmail = localStorage.getItem('remembered_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    }
  }, [isRegisterMode]);

  const getLocation = (): Promise<LocationCoords> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (err) => {
            let msg = "Location access denied. Please enable location services.";
            if (err.code === 1) msg = "Location permission denied.";
            else if (err.code === 2) msg = "Location unavailable. Check GPS/Network.";
            else if (err.code === 3) msg = "Location request timed out.";
            reject(new Error(msg));
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('acquiring_location');

    const cleanEmail = email.toLowerCase().trim();

    try {
      // 1. Get Location
      console.log("Requesting location...");
      const location = await getLocation();
      console.log("Location acquired:", location);

      // 2. Auth Logic
      setStatus('verifying');
      
      let authenticatedUser;

      if (isRegisterMode) {
        authenticatedUser = await mockService.registerCandidate(cleanEmail, username, password, location);
        setToast({ msg: "Registration Successful! Redirecting...", type: 'success' });
      } else {
        authenticatedUser = await mockService.loginCandidate(cleanEmail, password, location);
        setToast({ msg: "Identity Verified. Redirecting...", type: 'success' });
      }

      // Handle Remember Me (Only relevant for login generally, but we process it here)
      if (!isRegisterMode) {
        if (rememberMe) {
          localStorage.setItem('remembered_email', cleanEmail);
        } else {
          localStorage.removeItem('remembered_email');
        }
      }

      // Success State
      setStatus('success');
      
      // Delay setting global user to allow the success animation to play
      // This prevents immediate re-render/redirect before the user sees "Access Granted"
      setTimeout(() => {
        setUser(authenticatedUser);
        navigate('/courses', { replace: true });
      }, 1500);

    } catch (err: any) {
      console.error("Auth Process Failed:", err);
      setStatus('idle');
      
      let msg = "An unexpected error occurred.";
      if (err?.message) {
        msg = err.message;
      } else if (typeof err === 'string') {
        msg = err;
      }

      setError(msg);
      setToast({ msg: msg, type: 'error' });
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'acquiring_location': return 'Acquiring GPS Coords...';
      case 'verifying': return 'Verifying Credentials & Location...';
      case 'success': return 'Access Granted';
      default: return isRegisterMode ? 'Register Candidate' : 'Access Portal';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="w-full max-w-md glass-card p-1 rounded-2xl relative overflow-hidden flex flex-col transition-all duration-300">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900/50 p-1 rounded-t-2xl border-b border-white/5">
          <button 
            className={`flex-1 py-3 text-sm font-display font-bold uppercase tracking-wider transition-colors rounded-lg ${!isRegisterMode ? 'bg-cyan-600/20 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
            onClick={() => { 
              if(status === 'idle') { 
                setIsRegisterMode(false); 
                setError(''); 
                // Restore remembered email if exists
                const saved = localStorage.getItem('remembered_email');
                if (saved) {
                  setEmail(saved);
                  setRememberMe(true);
                }
              } 
            }}
            disabled={status !== 'idle'}
          >
            Login
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-display font-bold uppercase tracking-wider transition-colors rounded-lg ${isRegisterMode ? 'bg-fuchsia-600/20 text-fuchsia-400' : 'text-slate-500 hover:text-slate-300'}`}
            onClick={() => { 
              if(status === 'idle') { 
                setIsRegisterMode(true); 
                setError(''); 
                // Clear fields for registration
                setEmail('');
                setPassword('');
                setUsername('');
              } 
            }}
            disabled={status !== 'idle'}
          >
            Register
          </button>
        </div>

        <div className="p-8">
          <h2 className="font-display text-2xl font-bold mb-2 flex items-center gap-2">
            {isRegisterMode ? 'Join the Future' : 'Welcome Back'}
            {status === 'success' && <ShieldCheck className="text-emerald-400 animate-pulse" />}
          </h2>
          <p className="text-slate-400 mb-8 text-sm">
            {isRegisterMode 
              ? 'Create a secure account. Your location will be bound to your identity.' 
              : 'Sign in to access your dashboard. strict location verification required.'}
          </p>

          {error && (
            <div className="mb-6 bg-red-950/50 border border-red-500/30 p-4 rounded text-red-400 text-sm flex items-start gap-3 animate-in slide-in-from-top-2">
              <AlertTriangle className="shrink-0 mt-0.5" size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <Input 
                label="Username" 
                placeholder="Candidate_One" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={isRegisterMode}
                disabled={status !== 'idle'}
              />
            )}

            <Input 
              label="Email Address" 
              type="email" 
              placeholder="user@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status !== 'idle'}
            />

            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={status !== 'idle'}
            />

            {/* Remember Me Checkbox (Only on Login) */}
            {!isRegisterMode && (
              <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
                <div className={`transition-colors duration-300 ${rememberMe ? 'text-cyan-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                  {rememberMe ? <CheckSquare size={20} /> : <Square size={20} />}
                </div>
                <label className="text-sm text-slate-400 cursor-pointer select-none group-hover:text-cyan-200 transition-colors">
                  Remember Me
                </label>
              </div>
            )}

            <div className="pt-2 text-xs text-slate-500 flex items-center gap-2">
              <MapPin size={12} className={status === 'acquiring_location' ? "text-fuchsia-400 animate-bounce" : "text-cyan-500"} />
              <span>
                {status === 'acquiring_location' ? 'Reading satellite position...' : 'Location will be captured securely upon submission.'}
              </span>
            </div>

            <Button 
              type="submit" 
              className={`w-full mt-4 ${status === 'success' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/50' : ''}`} 
              isLoading={status === 'acquiring_location' || status === 'verifying'}
              disabled={status === 'success'}
            >
              {getButtonText()}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};