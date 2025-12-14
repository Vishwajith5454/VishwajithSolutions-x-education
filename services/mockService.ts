
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
import { User, LocationCoords, Order, RedemptionCode } from "../types";

// ============================================================================
// 🚨 CONFIGURATION ZONE 🚨
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
// ============================================================================

// Initialize Firebase
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

type AuthStateListener = (user: User | null) => void;

class FirebaseService {
  private currentUser: User | null = null;
  private listeners: AuthStateListener[] = [];
  
  constructor() {
    if (!auth) return;

    // Real-time listener for Auth state
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await this.syncUserProfile(firebaseUser.uid, firebaseUser.email || "");
      } else {
        this.currentUser = null;
        this.notifyListeners();
      }
    });
  }

  // --- Internal Helper to Sync Firestore Profile ---
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
          cart: data.cart || [], // Load cart from DB
          location: data.location,
          sessionExpiry: data.sessionExpiry
        } as User;
        
        // Strict Session Check: Do not reset timer on refresh
        // If expired, logout immediately
        if (this.currentUser.sessionExpiry && Date.now() > this.currentUser.sessionExpiry) {
            console.log("Session expired in DB. Logging out.");
            await this.logout();
            return;
        }
      } else {
        console.warn("User authenticated but no Firestore profile found.");
        this.currentUser = null;
      }
    } catch (e) {
      console.error("Error syncing profile:", e);
      this.currentUser = null;
    }
    this.notifyListeners();
  }

  subscribe(listener: AuthStateListener) {
    this.listeners.push(listener);
    if (this.currentUser !== undefined) {
        listener(this.currentUser);
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  // --- Public Auth Methods ---

  async registerCandidate(
    email: string, 
    name: string, 
    password: string, 
    location: LocationCoords
  ): Promise<User> {
    if (!auth || !db) throw new Error("Firebase not configured.");

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    const initialExpiry = Date.now() + SESSION_DURATION_MS;

    const newUserProfile: User = {
        id: uid,
        email: email,
        name: name,
        purchasedCourses: [],
        cart: [],
        location: location,
        sessionExpiry: initialExpiry
    };

    await setDoc(doc(db, "users", uid), {
        name: name,
        email: email,
        purchasedCourses: [],
        cart: [], // Init empty cart in DB
        location: location,
        sessionExpiry: initialExpiry,
        createdAt: new Date().toISOString()
    });

    this.currentUser = newUserProfile;
    this.notifyListeners();
    return newUserProfile;
  }

  async loginCandidate(email: string, password: string, currentLocation: LocationCoords): Promise<User> {
    if (!auth || !db) throw new Error("Firebase not configured.");

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const userDocRef = doc(db, "users", uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
        await signOut(auth);
        throw new Error("Account corrupted: No profile data found.");
    }

    const userData = userSnap.data();

    // Verify Location
    if (userData.location) {
        const distance = this.getDistanceFromLatLonInKm(
          userData.location.latitude,
          userData.location.longitude,
          currentLocation.latitude,
          currentLocation.longitude
        );

        console.log(`[Location Verification] Dist: ${distance.toFixed(4)} km`);

        if (distance > 20) {
          await signOut(auth);
          throw new Error(`Security Alert: Location mismatch. You are ${distance.toFixed(1)}km away from your registered location.`);
        }
    }

    // --- SESSION PERSISTENCE LOGIC ---
    // Check if there is an existing, valid session expiry in the DB
    let currentExpiry = userData.sessionExpiry;
    const now = Date.now();
    
    // If no expiry exists, or it has already passed, we start a NEW session.
    if (!currentExpiry || currentExpiry < now) {
        console.log("Session expired or new. Starting new timer.");
        currentExpiry = now + SESSION_DURATION_MS;
    } else {
        console.log("Resuming existing session. Expires at:", new Date(currentExpiry).toLocaleTimeString());
    }

    // Update DB with the resolved expiry (either preserved or new)
    await updateDoc(userDocRef, {
        sessionExpiry: currentExpiry,
        lastLogin: new Date().toISOString()
    });

    await this.syncUserProfile(uid, email);
    
    if (!this.currentUser) throw new Error("Failed to load user session.");
    return this.currentUser;
  }

  async logout() {
    if (auth) await signOut(auth);
    this.currentUser = null;
    this.notifyListeners();
  }

  // --- Cart Management ---
  async updateUserCart(userId: string, newCart: string[]) {
    if (!db) return;
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            cart: newCart
        });
        // Update local state to match
        if (this.currentUser && this.currentUser.id === userId) {
            this.currentUser = { ...this.currentUser, cart: newCart };
            this.notifyListeners();
        }
    } catch (e) {
        console.error("Failed to update cart in DB", e);
    }
  }

  getCurrentUser(): User | null {
    // Only verify expiry, do not reset it
    if (this.currentUser?.sessionExpiry && Date.now() > this.currentUser.sessionExpiry) {
        this.logout();
        return null;
    }
    return this.currentUser;
  }
  
  getSessionExpiry(): number | null {
    return this.currentUser?.sessionExpiry || null;
  }

  // --- Helper: Haversine Formula ---
  // Publicly exposed for use in App background checker
  public getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || typeof lat2 !== 'number' || typeof lon2 !== 'number') return 0;
    const R = 6371; 
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  // --- ADMIN: Verify User Exists ---
  async verifyUserIdentity(email: string, username: string): Promise<boolean> {
    if (!db) return false;
    
    try {
        const q = query(collection(db, "users"), where("email", "==", email));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) return false;

        const userData = querySnapshot.docs[0].data();
        // Check for exact match
        return userData.name === username;
    } catch (e) {
        console.error("Verification failed:", e);
        return false;
    }
  }

  // --- CODE GENERATION & REDEMPTION SYSTEM ---

  async generateRedemptionCode(targetEmail: string, courseIds: string[], adminName: string): Promise<string> {
    if (!db) throw new Error("Database not connected");

    const cleanEmail = targetEmail.toLowerCase().trim();
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    const code = `VISH-${randomPart.substring(0,4)}-${randomPart.substring(4,8)}`;

    const newCode: RedemptionCode = {
        code: code,
        userEmail: cleanEmail,
        courseIds: courseIds,
        generatedBy: adminName,
        createdAt: new Date().toISOString(),
        isRedeemed: false
    };

    await addDoc(collection(db, "redemptionCodes"), newCode);
    return code;
  }

  async redeemCode(code: string): Promise<string[]> {
    if (!this.currentUser) throw new Error("Please login to redeem codes.");
    if (!db) throw new Error("Database not connected");

    const cleanCode = code.trim().toUpperCase();
    
    const q = query(collection(db, "redemptionCodes"), where("code", "==", cleanCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        throw new Error("Invalid Code.");
    }

    const codeDoc = querySnapshot.docs[0];
    const codeData = codeDoc.data() as RedemptionCode;

    if (codeData.isRedeemed) throw new Error("This code has already been redeemed.");
    if (codeData.userEmail !== this.currentUser.email) throw new Error("This code is not linked to your account.");

    // 1. Mark code as redeemed in DB
    await updateDoc(doc(db, "redemptionCodes", codeDoc.id), { isRedeemed: true });

    // 2. Create Order in DB
    await addDoc(collection(db, "orders"), {
        userId: this.currentUser.id,
        amount: 0,
        date: new Date().toISOString(),
        items: codeData.courseIds,
        status: 'redeemed',
        redemptionCode: cleanCode
    });

    // 3. Update User's Purchased Courses in DB
    const userRef = doc(db, "users", this.currentUser.id);
    await updateDoc(userRef, {
        purchasedCourses: arrayUnion(...codeData.courseIds)
    });

    // 4. Refresh Local State
    await this.syncUserProfile(this.currentUser.id, this.currentUser.email);

    return codeData.courseIds;
  }

  async getUserOrders(): Promise<Order[]> {
    if (!this.currentUser || !db) return [];

    const q = query(collection(db, "orders"), where("userId", "==", this.currentUser.id));
    const querySnapshot = await getDocs(q);
    
    const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Order));

    return orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export const mockService = new FirebaseService();
