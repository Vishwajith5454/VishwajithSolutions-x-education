
import { Course, Order, User, LocationCoords, RedemptionCode } from "../types";

// ============================================================================
// MOCK SERVICE (LocalStorage Implementation)
// ============================================================================
// Replaces Firebase dependency to resolve import errors and provide a
// self-contained demo environment.

const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 Hours

type AuthStateListener = (user: User | null) => void;

class AuthService {
  private currentUser: User | null = null;
  private listeners: AuthStateListener[] = [];

  constructor() {
    this.restoreSession();
  }

  private restoreSession() {
    try {
      const storedUser = localStorage.getItem('mock_currentUser');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        // Check expiry
        if (parsed.sessionExpiry && Date.now() > parsed.sessionExpiry) {
          this.logout();
        } else {
          this.currentUser = parsed;
        }
      }
    } catch (e) {
      console.error("Failed to restore session", e);
      this.logout();
    }
  }

  // --- Subscription System ---
  subscribe(listener: AuthStateListener) {
    this.listeners.push(listener);
    // Immediately notify with current state so UI initializes
    listener(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    if (this.currentUser) {
      localStorage.setItem('mock_currentUser', JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem('mock_currentUser');
    }
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  // --- Helper: DB Simulation ---
  // We simulate a database using LocalStorage keys
  private getDB<T>(collection: string): T[] {
    const data = localStorage.getItem(`mock_db_${collection}`);
    return data ? JSON.parse(data) : [];
  }

  private saveDB<T>(collection: string, data: T[]) {
    localStorage.setItem(`mock_db_${collection}`, JSON.stringify(data));
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
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    
    const users = this.getDB<any>('users'); // storing user with password in mock db
    const normalizedEmail = email.toLowerCase().trim();

    if (users.find(u => u.email === normalizedEmail)) {
       throw new Error("User already registered. Please login directly.");
    }

    const uid = 'user_' + Math.random().toString(36).substr(2, 9);
    const initialExpiry = Date.now() + SESSION_DURATION_MS;

    const newUserProfile: User = {
        id: uid,
        email: normalizedEmail,
        name: name,
        purchasedCourses: [],
        location: location,
        sessionExpiry: initialExpiry
    };

    // Store with password (unsafe for real app, okay for mock)
    users.push({ ...newUserProfile, password }); 
    this.saveDB('users', users);

    this.currentUser = newUserProfile;
    this.notifyListeners();
    
    return newUserProfile;
  }

  async loginCandidate(email: string, password: string, currentLocation: LocationCoords): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    
    const users = this.getDB<any>('users');
    const normalizedEmail = email.toLowerCase().trim();
    
    const userRecord = users.find(u => u.email === normalizedEmail);

    if (!userRecord) {
        throw new Error("User not found.");
    }

    if (userRecord.password !== password) {
        throw new Error("Invalid credentials.");
    }

    // Location Check
    if (userRecord.location) {
        const distance = this.getDistanceFromLatLonInKm(
          userRecord.location.latitude,
          userRecord.location.longitude,
          currentLocation.latitude,
          currentLocation.longitude
        );

        console.log(`[Location Verification] Dist: ${distance.toFixed(4)} km`);

        if (distance > 20) {
          throw new Error(`Security Alert: Location mismatch. You are ${distance.toFixed(1)}km away from your registered location.`);
        }
    }

    // Update session
    const now = Date.now();
    let newExpiry = userRecord.sessionExpiry;
    if (!newExpiry || now > newExpiry) {
        newExpiry = now + SESSION_DURATION_MS;
    }
    
    // Update user in DB
    userRecord.sessionExpiry = newExpiry;
    // Map carefully to avoid mutation issues if ref is same
    const updatedUsers = users.map(u => u.id === userRecord.id ? { ...userRecord } : u);
    this.saveDB('users', updatedUsers);

    // Return sanitized user (without password)
    const { password: _, ...safeUser } = userRecord;
    this.currentUser = safeUser as User;
    this.notifyListeners();
    
    return this.currentUser;
  }

  async logout() {
    this.currentUser = null;
    this.notifyListeners();
  }

  // --- State Access ---

  getCurrentUser(): User | null {
    if (this.currentUser?.sessionExpiry && Date.now() > this.currentUser.sessionExpiry) {
        this.logout();
        return null;
    }
    return this.currentUser;
  }
  
  getSessionExpiry(): number | null {
    return this.currentUser?.sessionExpiry || null;
  }

  // --- CODE GENERATION SYSTEM (LocalStorage Backed) ---

  async generateRedemptionCode(targetEmail: string, courseIds: string[], adminName: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 500));
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

    const codes = this.getDB<RedemptionCode>('codes');
    codes.push(newCode);
    this.saveDB('codes', codes);

    return code;
  }

  async redeemCode(code: string): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!this.currentUser) throw new Error("Please login to redeem codes.");

    const cleanCode = code.trim().toUpperCase();
    const codes = this.getDB<RedemptionCode>('codes');
    const codeIndex = codes.findIndex(c => c.code === cleanCode);

    if (codeIndex === -1) {
        throw new Error("Invalid Code.");
    }

    const codeData = codes[codeIndex];

    if (codeData.isRedeemed) {
        throw new Error("This code has already been redeemed.");
    }

    if (codeData.userEmail !== this.currentUser.email) {
        throw new Error("This code is not linked to your account.");
    }

    // 1. Mark code as redeemed
    codes[codeIndex] = { ...codeData, isRedeemed: true };
    this.saveDB('codes', codes);

    // 2. Create Order
    const newOrder: Order = {
        id: `RED_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        userId: this.currentUser.id,
        amount: 0,
        date: new Date().toISOString(),
        items: codeData.courseIds,
        status: 'redeemed'
    };
    const orders = this.getDB<Order>('orders');
    orders.push(newOrder);
    this.saveDB('orders', orders);

    // 3. Update User
    const users = this.getDB<any>('users');
    const userIndex = users.findIndex(u => u.id === this.currentUser!.id);
    if (userIndex !== -1) {
        const currentCourses = users[userIndex].purchasedCourses || [];
        // Add new courses without duplicates
        const newCourses = [...new Set([...currentCourses, ...codeData.courseIds])];
        users[userIndex].purchasedCourses = newCourses;
        this.saveDB('users', users);

        // Update local state
        this.currentUser = {
            ...this.currentUser,
            purchasedCourses: newCourses
        };
        this.notifyListeners();
    }

    return codeData.courseIds;
  }

  async getUserOrders(): Promise<Order[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (!this.currentUser) return [];

    const orders = this.getDB<Order>('orders');
    return orders
        .filter(o => o.userId === this.currentUser!.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export const mockService = new AuthService();
