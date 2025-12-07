
import React, { useState } from 'react';
import { Loader2, Key, AlertCircle } from 'lucide-react';
import { Button, Input } from './UI';
import { mockService } from '../services/mockService';

interface PaymentGatewayProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmountUSD: number;
  onSuccess: (method: string, refId: string) => void;
}

export const PaymentGateway: React.FC<PaymentGatewayProps> = ({ isOpen, onClose, onSuccess }) => {
  const [processing, setProcessing] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRedeem = async () => {
    if (!code || code.length < 8) {
      setError("Please enter a valid code.");
      return;
    }
    
    setProcessing(true);
    setError('');
    
    try {
      await mockService.redeemCode(code);
      onSuccess('CODE', code);
      onClose();
    } catch (err: any) {
      setError(err.message || "Invalid or Expired Code.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-slate-900 border border-fuchsia-500/30 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(217,70,239,0.2)] flex flex-col relative">
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          ✕
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-fuchsia-900/50 to-slate-900 p-6 text-center border-b border-white/5">
          <h2 className="font-display font-bold text-xl text-white mb-1">Redeem Access</h2>
          <div className="text-fuchsia-400 text-xs uppercase tracking-widest">Enter your purchased code below</div>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8">
            <div className="space-y-6">
              
              <div className="flex justify-center">
                 <div className="w-20 h-20 rounded-full bg-fuchsia-500/10 flex items-center justify-center animate-pulse">
                    <Key size={40} className="text-fuchsia-400" />
                 </div>
              </div>

              {error && (
                <div className="bg-red-950/50 border border-red-500/30 p-3 rounded text-red-400 text-sm text-center flex items-center justify-center gap-2">
                   <AlertCircle size={16} /> {error}
                </div>
              )}

              <div>
                <Input 
                  placeholder="VISH-XXXX-XXXX"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  className="text-center font-mono text-lg tracking-widest uppercase placeholder:tracking-normal placeholder:opacity-50 border-fuchsia-500/30 focus:border-fuchsia-500"
                />
                <div className="text-center mt-2 text-xs text-slate-500">
                   Format: VISH-XXXX-XXXX
                </div>
              </div>

              <Button 
                onClick={handleRedeem} 
                className="w-full h-12 text-lg bg-fuchsia-600 hover:bg-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.4)]"
                disabled={processing}
                isLoading={processing}
              >
                {processing ? 'VERIFYING...' : 'UNLOCK COURSES'}
              </Button>

            </div>
        </div>
        
        {/* Footer */}
        <div className="bg-slate-950 p-3 text-center text-[10px] text-slate-600 border-t border-white/5">
           SECURE REDEMPTION PROTOCOL
        </div>
      </div>
    </div>
  );
};
