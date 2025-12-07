import React, { useEffect } from 'react';
import { Loader2, X } from 'lucide-react';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', className = '', isLoading, ...props 
}) => {
  const baseStyles = "relative px-6 py-3 rounded font-display font-bold uppercase tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900";
  
  const variants = {
    primary: "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] focus:ring-cyan-500",
    secondary: "bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-[0_0_15px_rgba(192,38,211,0.5)] hover:shadow-[0_0_25px_rgba(217,70,239,0.6)] focus:ring-fuchsia-500",
    outline: "bg-transparent border border-cyan-500/50 text-cyan-400 hover:bg-cyan-950/30 hover:border-cyan-400 focus:ring-cyan-500",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/5",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {isLoading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : children}
    </button>
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-display text-cyan-400 mb-1 uppercase tracking-widest">{label}</label>}
      <input 
        className={`w-full bg-slate-950/50 border border-slate-700 rounded px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors ${className}`}
        {...props}
      />
    </div>
  );
};

// --- Modal ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-cyan-500/30 shadow-[0_0_50px_rgba(8,145,178,0.2)] rounded-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
          <h3 className="text-xl font-display font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Toast ---
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-6 py-4 rounded shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right duration-300 ${
      type === 'success' 
        ? 'bg-emerald-950/90 border-emerald-500 text-emerald-400' 
        : 'bg-red-950/90 border-red-500 text-red-400'
    }`}>
      <span className="font-bold">{message}</span>
    </div>
  );
};