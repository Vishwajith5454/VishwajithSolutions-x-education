
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
    // Load initial cart
    const storedCart = localStorage.getItem('cart');
    if (storedCart) setCart(JSON.parse(storedCart));

    // Subscribe to mockService updates (Firebase Auth + Firestore)
    const unsubscribe = mockService.subscribe((updatedUser) => {
      setUser(updatedUser);
      setSessionExpiry(mockService.getSessionExpiry());
      setIsInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  // Periodic check for session expiry
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
        // Just trigger the service check, the service will call logout() if expired
        // which will trigger the subscription above
        mockService.getCurrentUser(); 
    }, 1000); 

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const login = async (email: string) => {
     console.log("Use direct mockService call");
  };

  const logout = () => {
    mockService.logout();
    // State update handled by subscription
    setCart([]);
  };

  const addToCart = (courseId: string) => {
    if (!cart.includes(courseId)) {
      setCart([...cart, courseId]);
    }
  };

  const removeFromCart = (courseId: string) => {
    setCart(cart.filter(id => id !== courseId));
  };

  const clearCart = () => setCart([]);

  if (!isInitialized) {
    // Loading Screen while Firebase connects
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-cyan-500 font-display animate-pulse">CONNECTING TO VISHWAJITH SOLUTIONS...</div>
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
            
            {/* Protected Routes */}
            <Route 
              path="/courses" 
              element={user ? <CourseListing /> : <Navigate to="/auth/candidate" />} 
            />
            <Route 
              path="/cart" 
              element={user ? <Cart /> : <Navigate to="/auth/candidate" />} 
            />
            <Route 
              path="/my-learning" 
              element={user ? <MyLearning /> : <Navigate to="/auth/candidate" />} 
            />
            <Route 
              path="/study/:courseId" 
              element={user ? <StudyDashboard /> : <Navigate to="/auth/candidate" />} 
            />
            
            <Route path="/about" element={<AboutUs />} />
            <Route path="/code-generator" element={<CodeGenerator />} />
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
