
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { MOCK_COURSES } from '../constants';
import { Button } from '../components/UI';
import { PlayCircle, Download, History, FileText } from 'lucide-react';
import { mockService } from '../services/mockService';
import { User, Order } from '../types';

export const MyLearning: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
     // 1. Fetch latest user data (purchases)
     const freshUser = mockService.getCurrentUser();
     setCurrentUser(freshUser);

     // 2. Fetch Order History
     const fetchOrders = async () => {
        const history = await mockService.getUserOrders();
        setOrders(history);
        setLoadingOrders(false);
     };
     fetchOrders();
  }, []);

  const myCourses = MOCK_COURSES.filter(c => currentUser?.purchasedCourses.includes(c.id));

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-end mb-12 border-b border-white/10 pb-6">
        <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Student Dashboard</h1>
            <p className="text-slate-400">Welcome back, {currentUser?.name}. Track your progress and history.</p>
        </div>
      </div>

      {/* --- PURCHASED COURSES SECTION --- */}
      <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
        <PlayCircle className="text-cyan-400" size={24} /> Active Courses
      </h2>
      
      {myCourses.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-slate-700 mb-16">
          <p className="text-slate-400 mb-4">You haven't enrolled in any courses yet.</p>
          <Button onClick={() => navigate('/courses')}>Explore Catalog</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {myCourses.map(course => (
            <div key={course.id} className="glass-card rounded-xl overflow-hidden group">
              <div className="relative h-48 bg-slate-800">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <PlayCircle size={48} className="text-white opacity-80 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-display font-bold text-lg mb-2">{course.title}</h3>
                <div className="w-full bg-slate-800 h-1 rounded-full mb-4 overflow-hidden">
                    <div className="bg-cyan-500 h-full w-[10%]"></div>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>10% Complete</span>
                    <button className="hover:text-cyan-400 flex items-center gap-1">
                        <Download size={12} /> Resources
                    </button>
                </div>
                <div className="mt-6">
                     <Button 
                        onClick={() => navigate(`/study/${course.id}`)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                     >
                        Let's Study
                     </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- ORDER HISTORY SECTION --- */}
      <div className="mt-12">
        <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
           <History className="text-fuchsia-400" size={24} /> Order History
        </h2>

        <div className="glass-card rounded-xl overflow-hidden border border-white/10">
           {loadingOrders ? (
             <div className="p-8 text-center text-slate-500">Loading records...</div>
           ) : orders.length === 0 ? (
             <div className="p-8 text-center text-slate-500">No transactions found.</div>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-slate-400">
                 <thead className="bg-slate-900/50 text-xs uppercase font-display text-slate-300">
                   <tr>
                     <th className="px-6 py-4">Order ID</th>
                     <th className="px-6 py-4">Date</th>
                     <th className="px-6 py-4">Courses</th>
                     <th className="px-6 py-4">Amount</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4 text-right">Invoice</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {orders.map((order) => (
                     <tr key={order.id} className="hover:bg-white/5 transition-colors">
                       <td className="px-6 py-4 font-mono text-cyan-500 text-xs">{order.id}</td>
                       <td className="px-6 py-4">{new Date(order.date).toLocaleDateString()} <span className="text-xs opacity-50">{new Date(order.date).toLocaleTimeString()}</span></td>
                       <td className="px-6 py-4 text-white font-medium">{order.items.length} Items</td>
                       <td className="px-6 py-4 font-bold text-white">₹{order.amount}</td>
                       <td className="px-6 py-4">
                         <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs border border-emerald-500/20 uppercase font-bold tracking-wider">
                           {order.status}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-right">
                         <button className="text-slate-500 hover:text-white transition-colors">
                           <FileText size={16} />
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
        </div>
      </div>

    </div>
  );
};
