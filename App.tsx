
import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { CandidateAuth } from './pages/CandidateAuth';
import { CourseListing } from './pages/CourseListing';
import { Cart } from './pages/Cart';
import { MyLearning } from './pages/MyLearning';
import { AboutUs } from './pages/AboutUs';
import { CodeGenerator } from './pages/CodeGenerator';
import { StudyDashboard } from './pages/StudyDashboard';
import { mockService } from './services/mockService';
import { User, AuthContextType } from './types';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// --- App Component ---
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);
  const [cart, setCart] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize & Subscribe to Auth State
  useEffect(() => {
    const unsubscribe = mockService.subscribe((updatedUser) => {
      setUser(updatedUser);
      // Crucial: Always sync expiry from the DB user object, never local state alone
      if (updatedUser && updatedUser.sessionExpiry) {
        setSessionExpiry(updatedUser.sessionExpiry);
      } else {
        setSessionExpiry(null);
      }
      
      if (updatedUser) {
        setCart(updatedUser.cart || []);
      } else {
        setCart([]);
      }
      setIsInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  // --- STRICT SESSION ENFORCEMENT ---
  // This ensures the timer doesn't reset on reload. It checks the DB timestamp.
  useEffect(() => {
    if (!user || !sessionExpiry) return;

    const sessionCheckInterval = setInterval(() => {
        const now = Date.now();
        
        // If current time is past the expiry timestamp stored in DB
        if (now >= sessionExpiry) {
            console.warn("Session Expired - Forcing Logout");
            clearInterval(sessionCheckInterval);
            
            // 1. Clear Local State
            mockService.logout(); 
            setCart([]);
            setUser(null);
            
            // 2. Alert User
            alert("Your secure session has expired. Please log in again.");
            
            // 3. Force Redirect (The Router will handle the redirect to / due to !user)
            window.location.href = "/"; 
        }
    }, 1000); 

    return () => clearInterval(sessionCheckInterval);
  }, [user, sessionExpiry]);

  const login = async (email: string) => { console.log("Direct service call"); };
  const logout = () => { mockService.logout(); setCart([]); };
  
  const addToCart = (courseId: string) => {
    if (!cart.includes(courseId)) {
      const newCart = [...cart, courseId];
      setCart(newCart);
      if (user) mockService.updateUserCart(user.id, newCart);
    }
  };

  const removeFromCart = (courseId: string) => {
    const newCart = cart.filter(id => id !== courseId);
    setCart(newCart);
    if (user) mockService.updateUserCart(user.id, newCart);
  };

  const clearCart = () => {
    setCart([]);
    if (user) mockService.updateUserCart(user.id, []);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-cyan-500 font-display animate-pulse text-xl tracking-widest">CONNECTING TO VISHWAJITH SOLUTIONS...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, sessionExpiry, login, logout, cart, addToCart, removeFromCart, clearCart }}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth/candidate" element={<CandidateAuth />} />
            
            <Route path="/courses" element={user ? <CourseListing /> : <Navigate to="/auth/candidate" />} />
            <Route path="/cart" element={user ? <Cart /> : <Navigate to="/auth/candidate" />} />
            <Route path="/my-learning" element={user ? <MyLearning /> : <Navigate to="/auth/candidate" />} />
            <Route path="/study/:courseId" element={user ? <StudyDashboard /> : <Navigate to="/auth/candidate" />} />
            
            <Route path="/about" element={<AboutUs />} />
            <Route path="/code-generator" element={<CodeGenerator />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
