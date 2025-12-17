
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Button, Input, Toast } from '../components/UI';
import { MapPin, AlertTriangle, ShieldCheck, CheckSquare, Square, RefreshCw } from 'lucide-react';
import { mockService } from '../services/mockService';
import { LocationCoords } from '../types';

export const CandidateAuth: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth(); 
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [status, setStatus] = useState<'idle' | 'locating' | 'authenticating' | 'otp_required'>('idle');
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  // OTP State
  const [otp, setOtp] = useState('');
  const [tempUid, setTempUid] = useState('');
  const [otpMessage, setOtpMessage] = useState('');

  // Location Consent
  const [consentLocation, setConsentLocation] = useState(false);

  useEffect(() => {
    if (user) navigate('/courses', { replace: true });
  }, [user, navigate]);

  // --- 4 Second Timeout GPS Strategy ---
  const getClientGps = async (): Promise<LocationCoords | undefined> => {
    if (!consentLocation) return undefined;
    if (!navigator.geolocation) return undefined;

    return new Promise((resolve) => {
        let isResolved = false;

        const handleSuccess = (pos: GeolocationPosition) => {
            if (isResolved) return;
            isResolved = true;
            resolve({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                source: 'client_gps'
            });
        };

        const handleError = (err: GeolocationPositionError) => {
            if (isResolved) return;
            isResolved = true;
            // Only log actual errors, suppress timeout noise
            if (err.code !== 3) {
                console.warn("GPS Access Failed:", err.message);
            } else {
                console.log("GPS timed out, falling back to IP.");
            }
            resolve(undefined);
        };

        const timeoutId = setTimeout(() => {
            if (isResolved) return;
            isResolved = true;
            console.log("GPS Timeout - Proceeding with IP Only");
            resolve(undefined);
        }, 4000);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                clearTimeout(timeoutId);
                handleSuccess(pos);
            },
            (err) => {
                clearTimeout(timeoutId);
                handleError(err);
            },
            { enableHighAccuracy: true, timeout: 4000, maximumAge: 60000 }
        );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('locating');

    try {
      // 1. Attempt Client GPS (Optional/Secondary)
      const clientGps = await getClientGps();
      
      setStatus('authenticating');

      let response;
      if (isRegisterMode) {
        response = await mockService.registerCandidate(email, username, password, clientGps);
      } else {
        response = await mockService.loginCandidate(email, password, clientGps);
      }

      // 2. Handle Decision Tree Response
      if (response.status === 'SUCCESS' && response.user) {
         setUser(response.user);
         setToast({ msg: "Access Granted", type: 'success' });
         // navigate handled by useEffect
      } else if (response.status === 'REQUIRE_OTP') {
         setStatus('otp_required');
         setTempUid(response.tempToken || '');
         setOtpMessage(`Location mismatch detected (${response.action}). Enter the code sent to ${response.otpSentTo}`);
         setToast({ msg: "Security Check Required", type: 'error' });
      } else {
         setError(response.message || "Access Denied");
         setStatus('idle');
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Connection Error");
      setStatus('idle');
    }
  };

  const handleOtpVerify = async () => {
      try {
          // Emulate verifying OTP
          const response = await mockService.verifyLoginOtp(tempUid, otp);
          if (response.status === 'SUCCESS' && response.user) {
              setUser(response.user);
              setToast({ msg: "Identity Confirmed", type: 'success' });
          } else {
              setError("Invalid OTP");
          }
      } catch (e) {
          setError("Verification Failed");
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="w-full max-w-md glass-card p-8 rounded-2xl relative overflow-hidden">
        
        {/* OTP MODAL OVERLAY */}
        {status === 'otp_required' && (
            <div className="absolute inset-0 z-20 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                <ShieldCheck size={48} className="text-yellow-500 mb-4 animate-bounce" />
                <h3 className="font-display text-xl font-bold text-white mb-2">Unusual Location</h3>
                <p className="text-sm text-slate-400 mb-6">{otpMessage}</p>
                <Input 
                    placeholder="Enter 6-digit Code" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)}
                    className="text-center text-xl tracking-[0.5em] font-mono mb-4"
                />
                <Button onClick={handleOtpVerify} className="w-full mb-2">Verify</Button>
                <button onClick={() => setStatus('idle')} className="text-slate-500 text-xs hover:text-white">Cancel Login</button>
            </div>
        )}

        {/* Normal Auth Form */}
        <h2 className="font-display text-2xl font-bold mb-2 text-white">
            {isRegisterMode ? 'Secure Registration' : 'Restricted Access'}
        </h2>
        <p className="text-slate-400 mb-6 text-sm">
            {isRegisterMode 
              ? 'Your registration location will be permanently bound to this account.' 
              : 'System verifies your physical location against your registered home base.'}
        </p>

        {error && (
            <div className="mb-6 bg-red-950/50 border border-red-500/30 p-4 rounded text-red-400 text-sm flex items-start gap-3">
              <AlertTriangle className="shrink-0" size={16} /> {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            )}
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

            <div className="bg-slate-900/50 p-3 rounded border border-white/5">
                <label className="flex items-start gap-3 cursor-pointer group">
                    <div className={`mt-1 w-4 h-4 border rounded flex items-center justify-center transition-colors ${consentLocation ? 'bg-cyan-600 border-cyan-600' : 'border-slate-500'}`}>
                        {consentLocation && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={consentLocation} onChange={() => setConsentLocation(!consentLocation)} />
                    <div className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                        <span className="text-cyan-400 font-bold block mb-1">ENHANCE SECURITY (OPTIONAL)</span>
                        Allow browser GPS to confirm my location if IP address is inaccurate.
                    </div>
                </label>
            </div>

            <Button 
                type="submit" 
                className="w-full mt-2"
                isLoading={status === 'locating' || status === 'authenticating'}
                disabled={status === 'locating' || status === 'authenticating'}
            >
                {status === 'locating' ? 'Triangulating...' : (isRegisterMode ? 'Register' : 'Authenticate')}
            </Button>
        </form>

        <div className="mt-6 text-center">
            <button 
                onClick={() => { setIsRegisterMode(!isRegisterMode); setError(''); }}
                className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
            >
                {isRegisterMode ? 'Already have an ID? Login' : 'New Candidate? Register'}
            </button>
        </div>
      </div>
    </div>
  );
};
