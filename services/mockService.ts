
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  arrayUnion
} from "firebase/firestore";
import { User, LocationCoords, Order, RedemptionCode, AuthResponse } from "../types";

// ============================================================================
// 🚨 FIREBASE CONFIGURATION 🚨
// ============================================================================
const firebaseConfig = {
    apiKey: "AIzaSyCAeAzMeeXZcUB8oexjaSFql7oBfzb033A",
    authDomain: "vishwajith-education.firebaseapp.com",
    projectId: "vishwajith-education",
    storageBucket: "vishwajith-education.firebasestorage.app",
    messagingSenderId: "878169984314",
    appId: "1:878169984314:web:4ab6ec67ab3bb175e11403",
    measurementId: "G-XTGWKX7BK2"
};

let app;
let auth: any;
let db: any;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase Initialization Error.", error);
}

const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 Hours
// INCREASED TOLERANCE: 150km to handle ISP IP routing inaccuracies (e.g. Salem to Mayiladuthurai)
const TOLERANCE_METERS = 150000; 

type AuthStateListener = (user: User | null) => void;

class FirebaseService {
  private currentUser: User | null = null;
  private listeners: AuthStateListener[] = [];
  
  // Temporary storage for location pending OTP verification
  private pendingLocationUpdate: { uid: string, location: LocationCoords } | null = null;

  constructor() {
    if (!auth) return;
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await this.syncUserProfile(firebaseUser.uid, firebaseUser.email || "");
      } else {
        this.currentUser = null;
        this.notifyListeners();
      }
    });
  }

  // --- SERVER-SIDE SIMULATION UTILITIES ---

  // ROBUST REAL-TIME LOCATION DETECTION
  private async getIpGeo(): Promise<LocationCoords & { city?: string }> {
    // 1. Primary Provider: ipapi.co
    try {
        const c = new AbortController();
        const id = setTimeout(() => c.abort(), 4000);
        const response = await fetch('https://ipapi.co/json/', { signal: c.signal });
        clearTimeout(id);
        
        if (response.ok) {
            const data = await response.json();
            if (data.latitude && data.longitude) {
                console.log(`[GEO-PRIMARY] Detected: ${data.city}, ${data.country_name}`);
                return { 
                    latitude: parseFloat(data.latitude), 
                    longitude: parseFloat(data.longitude), 
                    accuracy: 5000, 
                    source: 'ip_geo',
                    city: data.city 
                };
            }
        }
    } catch (e) {
        console.warn("[GEO-PRIMARY] Failed, trying backup...", e);
    }

    // 2. Backup Provider: ipwho.is
    try {
        const c = new AbortController();
        const id = setTimeout(() => c.abort(), 4000);
        const response = await fetch('https://ipwho.is/', { signal: c.signal });
        clearTimeout(id);

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.latitude && data.longitude) {
                console.log(`[GEO-BACKUP] Detected: ${data.city}, ${data.country}`);
                return { 
                    latitude: parseFloat(data.latitude), 
                    longitude: parseFloat(data.longitude), 
                    accuracy: 5000, 
                    source: 'ip_geo',
                    city: data.city
                };
            }
        }
    } catch (e) {
        console.warn("[GEO-BACKUP] Failed.", e);
    }

    // 3. Absolute Failure
    return { latitude: 0, longitude: 0, accuracy: -1, source: 'ip_geo', city: 'Unknown' };
  }

  // Haversine Formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; 
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in meters
  }

  // --- CORE AUTH LOGIC ---

  async registerCandidate(
    email: string, 
    name: string, 
    password: string, 
    clientGps?: LocationCoords
  ): Promise<AuthResponse> {
    if (!auth || !db) throw new Error("Firebase not configured.");

    // 1. Get Real IP Location
    const serverGeo = await this.getIpGeo();
    
    let savedLocation = serverGeo;
    let note = `Registered via IP (${serverGeo.city})`;

    // DECISION 1: Determine Authoritative Location
    // PRIORITY TO GPS: If user provides GPS, we trust it over IP for registration
    // This fixes issues where ISP IP is in a different city (e.g. Salem vs Mayiladuthurai)
    if (clientGps) {
        savedLocation = { ...clientGps, source: 'client_gps' };
        note = "Registered via Precision GPS";
        
        // Optional: Log distance for debugging
        if (serverGeo.accuracy !== -1) {
            const dist = this.calculateDistance(clientGps.latitude, clientGps.longitude, serverGeo.latitude, serverGeo.longitude);
            console.log(`[REGISTER] GPS vs IP Distance: ${(dist/1000).toFixed(1)}km`);
        }
    } else if (serverGeo.accuracy === -1) {
        // Fallback if everything fails
        savedLocation = { latitude: 28.6139, longitude: 77.2090, accuracy: 1000, source: 'ip_geo' };
        note = "Fallback Location (Detection Failed)";
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        const initialExpiry = Date.now() + SESSION_DURATION_MS;

        await setDoc(doc(db, "users", uid), {
            name: name,
            email: email,
            purchasedCourses: [],
            cart: [],
            savedLocation: savedLocation,
            sessionExpiry: initialExpiry,
            createdAt: new Date().toISOString(),
            registrationNote: note
        });

        await this.syncUserProfile(uid, email);
        return { status: 'SUCCESS', user: this.currentUser! };
    } catch (e: any) {
        return { status: 'DENIED', message: e.message || "Registration Failed" };
    }
  }

  async loginCandidate(
    email: string, 
    password: string, 
    clientGps?: LocationCoords
  ): Promise<AuthResponse> {
    if (!auth || !db) throw new Error("Firebase not configured.");

    // 1. Validate Credentials
    let uid: string;
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        uid = userCredential.user.uid;
    } catch (e: any) {
        // Error handling omitted for brevity, same as before
        return { status: 'DENIED', message: 'Invalid Credentials.' };
    }

    // 2. Load User Profile
    const userDocRef = doc(db, "users", uid);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
        await signOut(auth);
        return { status: 'DENIED', message: 'User profile missing.' };
    }
    const userData = userSnap.data();
    const savedLoc = userData.savedLocation as LocationCoords;
    
    // 3. Get Locations
    const currentServerGeo = await this.getIpGeo();
    
    // Determine 'Current Best Location' (Prefer GPS if available)
    const currentBestLocation = clientGps || currentServerGeo;
    
    // Store this pending location in case we need to update it after OTP
    this.pendingLocationUpdate = { uid, location: currentBestLocation };

    if (!savedLoc) {
        // Legacy User Support
        await updateDoc(userDocRef, {
            savedLocation: { ...currentBestLocation, source: 'auto_backfill' },
            registrationNote: "Legacy Backfill at Login"
        });
        await this.finalizeLogin(uid, email);
        return { status: 'SUCCESS', user: this.currentUser! };
    }

    // 4. Verification Logic
    let dist = Infinity;
    
    // Check GPS First (Most Accurate)
    if (clientGps) {
        dist = this.calculateDistance(clientGps.latitude, clientGps.longitude, savedLoc.latitude, savedLoc.longitude);
    } else if (currentServerGeo.accuracy !== -1) {
        dist = this.calculateDistance(currentServerGeo.latitude, currentServerGeo.longitude, savedLoc.latitude, savedLoc.longitude);
    }

    console.log(`[LOGIN CHECK] Distance: ${(dist/1000).toFixed(1)}km. Tolerance: ${(TOLERANCE_METERS/1000).toFixed(1)}km`);

    // Condition A: Within Tolerance
    if (dist <= TOLERANCE_METERS) {
        await this.finalizeLogin(uid, email);
        return { status: 'SUCCESS', user: this.currentUser! };
    }

    // Condition B: Outside Tolerance -> OTP Required
    // This happens if I moved from Salem to Chennai permanently.
    await signOut(auth);
    
    const severity = dist > 500000 ? 'High' : 'Medium';
    
    return { 
        status: 'REQUIRE_OTP', 
        action: `${severity} Risk Mismatch (${(dist/1000).toFixed(0)}km)`,
        otpSentTo: this.maskEmail(email),
        tempToken: uid 
    };
  }

  // --- OTP VERIFICATION ---
  async verifyLoginOtp(uid: string, otp: string): Promise<AuthResponse> {
      // Mock OTP Check
      if (otp === "123456") {
          const userDoc = await getDoc(doc(db, "users", uid));
          const userData = userDoc.data();
          
          if (userData) {
              // CRITICAL: Update the saved location to the current one!
              // This fixes the issue where a user moves permanently and keeps getting flagged.
              if (this.pendingLocationUpdate && this.pendingLocationUpdate.uid === uid) {
                   console.log("Updating User Home Location after successful OTP...");
                   await updateDoc(doc(db, "users", uid), {
                       savedLocation: this.pendingLocationUpdate.location,
                       locationUpdateDate: new Date().toISOString(),
                       locationUpdateReason: "OTP Verified Login"
                   });
              }

              await this.finalizeLogin(uid, userData.email);
              return { status: 'SUCCESS', user: this.currentUser! };
          }
      }
      return { status: 'DENIED', message: 'Invalid OTP' };
  }

  private async finalizeLogin(uid: string, email: string) {
      if (!db) return;
      const userDocRef = doc(db, "users", uid);
      const currentExpiry = Date.now() + SESSION_DURATION_MS;
      
      await updateDoc(userDocRef, {
          sessionExpiry: currentExpiry,
          lastLogin: new Date().toISOString()
      });
      await this.syncUserProfile(uid, email);
  }

  private maskEmail(email: string) {
      const [name, domain] = email.split('@');
      return `${name.substring(0, 2)}***@${domain}`;
  }

  // --- SYNC PROFILE ---
  private async syncUserProfile(uid: string, email: string) {
    if (!db) return;
    try {
      const userDocRef = doc(db, "users", uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        this.currentUser = {
          id: uid,
          email: email,
          name: data.name || "User",
          purchasedCourses: data.purchasedCourses || [],
          cart: data.cart || [],
          savedLocation: data.savedLocation,
          sessionExpiry: data.sessionExpiry
        } as User;
      }
    } catch (e) {
      console.error("Error syncing profile:", e);
    }
    this.notifyListeners();
  }

  subscribe(listener: AuthStateListener) {
    this.listeners.push(listener);
    if (this.currentUser !== undefined) listener(this.currentUser);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  async logout() {
    if (auth) await signOut(auth);
    this.currentUser = null;
    this.notifyListeners();
  }

  // --- Cart & Admin ---
  async updateUserCart(userId: string, newCart: string[]) {
    if (!db) return;
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { cart: newCart });
    if (this.currentUser && this.currentUser.id === userId) {
        this.currentUser = { ...this.currentUser, cart: newCart };
        this.notifyListeners();
    }
  }

  getCurrentUser() { return this.currentUser; }
  getSessionExpiry() { return this.currentUser?.sessionExpiry || null; }
  async verifyUserIdentity(email: string, username: string) { return true; }
  async generateRedemptionCode(email: string, courses: string[], admin: string) { return "MOCK-CODE"; }
  async redeemCode(code: string) { return []; }
  async getUserOrders() { return []; }
}

export const mockService = new FirebaseService();
