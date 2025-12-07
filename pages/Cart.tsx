
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { MOCK_COURSES } from '../constants';
import { Button, Toast, Modal } from '../components/UI';
import { Trash2, Phone, Key } from 'lucide-react';
import { mockService } from '../services/mockService';
import { PaymentGateway } from '../components/PaymentGateway'; // Now acting as Code Modal

export const Cart: React.FC = () => {
  const { cart, removeFromCart, clearCart } = useAuth();
  const navigate = useNavigate();
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const cartItems = MOCK_COURSES.filter(c => cart.includes(c.id));
  const total = cartItems.reduce((sum, item) => sum + item.price, 0);

  const handleRedemptionSuccess = () => {
    setToast({ msg: `Code Redeemed Successfully! Access Granted.`, type: 'success' });
    clearCart();
    setTimeout(() => navigate('/my-learning'), 2500);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <h2 className="font-display text-2xl mb-4">Your cart is empty</h2>
        <Button onClick={() => navigate('/courses')} variant="outline">Browse Courses</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 relative">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Code Redemption Modal (Formerly PaymentGateway) */}
      {isCodeModalOpen && (
        <PaymentGateway 
          isOpen={isCodeModalOpen} 
          onClose={() => setIsCodeModalOpen(false)} 
          totalAmountUSD={total}
          onSuccess={handleRedemptionSuccess}
        />
      )}

      <h1 className="font-display text-3xl font-bold mb-8 flex items-center gap-3">
        Checkout
      </h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {cartItems.map(item => (
            <div key={item.id} className="glass-card p-4 rounded-lg flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-24 h-16 rounded overflow-hidden relative">
                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-sm md:text-base font-display">{item.title}</h3>
                  <div className="flex items-center gap-2 text-cyan-400 text-sm font-mono">
                     <span>${item.price}</span>
                     <span className="text-slate-600">/</span>
                     <span>₹{Math.round(item.price * 84).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => removeFromCart(item.id)}
                className="text-slate-600 hover:text-red-400 transition-colors p-2"
                title="Remove Course"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        <div className="glass-card p-6 rounded-lg h-fit border border-cyan-500/20 shadow-[0_0_30px_rgba(0,0,0,0.2)]">
          <h3 className="font-display font-bold text-xl mb-6">Contact & Payment</h3>
          
          <div className="bg-slate-900 p-4 rounded-lg mb-6 border border-white/5 text-center">
             <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">For Codes Contact</div>
             <div className="flex items-center justify-center gap-2 text-xl font-bold text-white">
                <Phone className="text-cyan-400" size={20} />
                8807938061
             </div>
             <div className="text-[10px] text-slate-600 mt-2">Call/WhatsApp to purchase unlock codes</div>
          </div>
          
          <div className="space-y-3 mb-6 text-sm">
            <div className="flex justify-between text-emerald-400 font-bold bg-emerald-950/30 p-2 rounded">
                <span>Total (INR)</span>
                <span>₹{Math.round(total * 84).toLocaleString('en-IN')}</span>
            </div>
          </div>
          
          <Button 
            onClick={() => setIsCodeModalOpen(true)} 
            className="w-full mb-4 bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500"
          >
            <Key size={18} className="mr-2" /> Enter Redemption Code
          </Button>

          <p className="text-[10px] text-slate-600 text-center mt-1">
             Code is unique to your account and one-time use only.
          </p>
        </div>
      </div>
    </div>
  );
};
