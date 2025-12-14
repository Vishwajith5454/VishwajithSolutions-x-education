
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
  // Cart state now derived from User object where possible
  const [cart, setCart] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize & Subscribe to Auth State
  useEffect(() => {
    // Subscribe to mockService updates (Firebase Auth + Firestore)
    const unsubscribe = mockService.subscribe((updatedUser) => {
      setUser(updatedUser);
      setSessionExpiry(mockService.getSessionExpiry());
      
      // Sync cart from user profile if available
      if (updatedUser) {
        setCart(updatedUser.cart || []);
      } else {
        setCart([]);
      }
      
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

  // --- BACKGROUND LOCATION WATCHER (TIER 1 SECURITY) ---
  useEffect(() => {
    if (!user || !user.location) return;

    console.log("Starting background location monitor...");

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const currentLat = position.coords.latitude;
        const currentLng = position.coords.longitude;
        const regLat = user.location!.latitude;
        const regLng = user.location!.longitude;
        
        // Calculate distance using Service Helper
        const distance = mockService.getDistanceFromLatLonInKm(regLat, regLng, currentLat, currentLng);
        
        // Debug Log (Remove in production if needed, but useful for verification)
        console.debug(`[Background Check] Dist: ${distance.toFixed(3)}km`);

        if (distance > 20) { // Strict 20km limit
             console.error(`SECURITY VIOLATION: User moved ${distance.toFixed(2)}km from registered location.`);
             alert("SECURITY ALERT: You have moved beyond the 20km radius of your registered location. Session terminated.");
             mockService.logout();
        }
      },
      (err) => {
        // Only warn on console, don't logout immediately on error to avoid false positives 
        // from temporary signal loss (tunnels, elevators).
        // Real-world robust: Only fail if we can't get location for a long time (handled by auth check manually if needed)
        console.warn("Background location monitor warning:", err.message);
      },
      { 
        enableHighAccuracy: true, 
        // Increased timeout to prevent "timeout" errors from firing constantly
        timeout: 20000, 
        // Allow using a cached position up to 30 seconds old to save battery/reduce errors
        maximumAge: 30000 
      }
    );

    return () => {
      console.log("Stopping background location monitor.");
      navigator.geolocation.clearWatch(watchId);
    };
  }, [user]);


  const login = async (email: string) => {
     console.log("Use direct mockService call");
  };

  const logout = () => {
    mockService.logout();
    setCart([]);
  };

  const addToCart = (courseId: string) => {
    if (!cart.includes(courseId)) {
      const newCart = [...cart, courseId];
      setCart(newCart);
      if (user) {
        mockService.updateUserCart(user.id, newCart);
      }
    }
  };

  const removeFromCart = (courseId: string) => {
    const newCart = cart.filter(id => id !== courseId);
    setCart(newCart);
    if (user) {
      mockService.updateUserCart(user.id, newCart);
    }
  };

  const clearCart = () => {
    setCart([]);
    if (user) {
      mockService.updateUserCart(user.id, []);
    }
  };

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
