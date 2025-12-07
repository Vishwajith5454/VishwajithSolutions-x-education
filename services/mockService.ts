
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
  setDoc, 
  getDoc, 
  updateDoc, 
  arrayUnion,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "firebase/firestore";
import { Course, Order, User, LocationCoords, RedemptionCode } from "../types";

// ============================================================================
// ⚠️ IMPORTANT: YOUR FIREBASE CONFIGURATION
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Constants
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 Hours

type AuthStateListener = (user: User | null) => void;

class AuthService {
  private currentUser: User | null = null;
  private listeners: AuthStateListener[] = [];
  private isRestoring = true;

  constructor() {
    // Listen to Firebase Auth state changes
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is authenticated in Firebase, now fetch their Profile from Firestore
        try {
          await this.restoreUserProfile(firebaseUser.uid);
        } catch (e) {
          console.error("Failed to restore profile:", e);
          this.logout();
        }
      } else {
        // User is signed out
        this.currentUser = null;
        this.notifyListeners();
      }
      this.isRestoring = false;
    });
  }

  // --- Subscription System ---
  subscribe(listener: AuthStateListener) {
    this.listeners.push(listener);
    // Immediately notify with current state
    if (!this.isRestoring) {
      listener(this.currentUser);
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  // --- Internal Helpers ---
  private async restoreUserProfile(uid: string) {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      this.currentUser = userDoc.data() as User;
      
      // Check if session is expired strictly based on DB data
      if (this.currentUser.sessionExpiry && Date.now() > this.currentUser.sessionExpiry) {
        console.warn("Session expired based on DB record. Logging out.");
        await this.logout();
      } else {
        this.notifyListeners(); // Update UI with restored user
      }
    }
  }

  private getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || typeof lat2 !== 'number' || typeof lon2 !== 'number') {
      return 0;
    }
    const R = 6371; // Radius of earth in km
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

  // --- Public Auth Methods ---

  async registerCandidate(
    email: string, 
    name: string, 
    password: string, 
    location: LocationCoords
  ): Promise<User> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      const uid = userCredential.user.uid;

      // Set initial session expiry for 2 hours from now
      const initialExpiry = Date.now() + SESSION_DURATION_MS;

      const newUserProfile: User = {
        id: uid,
        email: normalizedEmail,
        name: name,
        purchasedCourses: [],
        location: location,
        sessionExpiry: initialExpiry // SAVE TO DB
      };

      await setDoc(doc(db, "users", uid), newUserProfile);

      this.currentUser = newUserProfile;
      this.notifyListeners();
      
      return newUserProfile;

    } catch (error: any) {
      console.error("Registration Error:", error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("User already registered. Please login directly.");
      }
      throw new Error(error.message || "Registration failed.");
    }
  }

  async loginCandidate(email: string, password: string, currentLocation: LocationCoords): Promise<User> {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const uid = userCredential.user.uid;

      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error("User profile not found in database.");
      }

      let userData = userDoc.data() as User;

      // STRICT Location Check
      if (userData.location) {
        const distance = this.getDistanceFromLatLonInKm(
          userData.location.latitude,
          userData.location.longitude,
          currentLocation.latitude,
          currentLocation.longitude
        );

        console.log(`[Location Verification] Dist: ${distance.toFixed(4)} km`);

        if (distance > 15) {
          await signOut(auth);
          throw new Error(`Security Alert: Location mismatch. You are ${distance.toFixed(1)}km away from your registered location.`);
        }
      }

      // SESSION LOGIC: Check Firestore
      const now = Date.now();
      let newExpiry = userData.sessionExpiry;
      let needsUpdate = false;

      // If no expiry exists or it has passed, create a NEW session
      if (!newExpiry || now > newExpiry) {
        newExpiry = now + SESSION_DURATION_MS;
        needsUpdate = true;
      } 
      // Else: Use the existing 'newExpiry' (Do nothing, just restore it)

      if (needsUpdate) {
        await updateDoc(userDocRef, { sessionExpiry: newExpiry });
        userData.sessionExpiry = newExpiry;
      }

      this.currentUser = userData;
      this.notifyListeners();
      
      return userData;

    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error("Invalid credentials.");
      }
      throw new Error(error.message || "Login failed.");
    }
  }

  async logout() {
    await signOut(auth);
    this.currentUser = null;
    this.notifyListeners();
  }

  // --- State Access ---

  getCurrentUser(): User | null {
    // Check expiry whenever UI requests user
    if (this.currentUser?.sessionExpiry && Date.now() > this.currentUser.sessionExpiry) {
        this.logout();
        return null;
    }
    return this.currentUser;
  }
  
  getSessionExpiry(): number | null {
    return this.currentUser?.sessionExpiry || null;
  }

  // --- CODE GENERATION SYSTEM ---

  async generateRedemptionCode(targetEmail: string, courseIds: string[], adminName: string): Promise<string> {
    try {
      const cleanEmail = targetEmail.toLowerCase().trim();
      // Generate a random code format: VISH-XXXX-XXXX
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

      // Add to 'redemptionCodes' collection
      await addDoc(collection(db, "redemptionCodes"), newCode);
      return code;
    } catch (e) {
      console.error("Failed to generate code:", e);
      throw new Error("Code generation failed.");
    }
  }

  async redeemCode(code: string): Promise<string[]> {
    if (!this.currentUser) throw new Error("Please login to redeem codes.");

    try {
      const cleanCode = code.trim().toUpperCase();
      
      // 1. Find the code in Firestore
      const codesRef = collection(db, "redemptionCodes");
      const q = query(codesRef, where("code", "==", cleanCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Invalid Code.");
      }

      const codeDoc = querySnapshot.docs[0];
      const codeData = codeDoc.data() as RedemptionCode;

      // 2. Security Checks
      if (codeData.isRedeemed) {
        throw new Error("This code has already been redeemed.");
      }

      if (codeData.userEmail !== this.currentUser.email) {
        throw new Error("This code is not linked to your account.");
      }

      // 3. Redeem Process
      // A. Mark code as redeemed
      await updateDoc(doc(db, "redemptionCodes", codeDoc.id), {
        isRedeemed: true,
        redeemedAt: new Date().toISOString()
      });

      // B. Create an 'Order' record for history
      const newOrder: Order = {
        id: `RED_${codeDoc.id.substring(0,6)}`,
        userId: this.currentUser.id,
        amount: 0, // Redeemed codes have 0 monetary value in the record
        date: new Date().toISOString(),
        items: codeData.courseIds,
        status: 'redeemed'
      };
      await setDoc(doc(db, "orders", newOrder.id), newOrder);

      // C. Unlock courses for user
      const userRef = doc(db, "users", this.currentUser.id);
      await updateDoc(userRef, {
        purchasedCourses: arrayUnion(...codeData.courseIds)
      });

      // D. Update local state
      this.currentUser = {
        ...this.currentUser,
        purchasedCourses: [...new Set([...this.currentUser.purchasedCourses, ...codeData.courseIds])]
      };
      this.notifyListeners();

      return codeData.courseIds;

    } catch (e: any) {
      console.error("Redemption failed:", e);
      throw new Error(e.message || "Redemption failed.");
    }
  }

  async getUserOrders(): Promise<Order[]> {
    if (!this.currentUser) return [];

    try {
      const ordersRef = collection(db, "orders");
      const q = query(
        ordersRef, 
        where("userId", "==", this.currentUser.id)
      );
      
      const querySnapshot = await getDocs(q);
      const orders: Order[] = [];
      querySnapshot.forEach((doc) => {
        orders.push(doc.data() as Order);
      });
      
      return orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (e) {
      console.error("Failed to fetch orders:", e);
      return [];
    }
  }
}

export const mockService = new AuthService();
