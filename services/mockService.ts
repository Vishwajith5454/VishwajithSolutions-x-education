import { Course, Order, User, LocationCoords, RedemptionCode } from "../types";

// Helper to simulate DB delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const SESSION_KEY = 'vishwajith_session_uid';
const USERS_KEY = 'vishwajith_users_db';
const CODES_KEY = 'vishwajith_codes_db';
const ORDERS_KEY = 'vishwajith_orders_db';
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 Hours

type AuthStateListener = (user: User | null) => void;

// Extended user type for internal storage (includes password)
interface DBUser extends User {
  password?: string;
}

class AuthService {
  private currentUser: User | null = null;
  private listeners: AuthStateListener[] = [];

  constructor() {
    this.init();
  }

  private init() {
    const uid = localStorage.getItem(SESSION_KEY);
    if (uid) {
      const user = this.getUserById(uid);
      if (user) {
        // Check expiry
        if (user.sessionExpiry && Date.now() > user.sessionExpiry) {
          this.logout();
        } else {
          this.currentUser = user;
        }
      }
    }
    // Notify after initialization
    setTimeout(() => this.notifyListeners(), 0);
  }

  subscribe(listener: AuthStateListener) {
    this.listeners.push(listener);
    // Notify immediately with current state
    listener(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  // --- LocalStorage Helpers ---

  private getUsers(): DBUser[] {
    try {
      const str = localStorage.getItem(USERS_KEY);
      return str ? JSON.parse(str) : [];
    } catch (e) {
      return [];
    }
  }

  private saveUsers(users: DBUser[]) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  private getUserById(uid: string): User | null {
    const users = this.getUsers();
    const user = users.find(u => u.id === uid);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  private getCodes(): RedemptionCode[] {
    try {
      const str = localStorage.getItem(CODES_KEY);
      return str ? JSON.parse(str) : [];
    } catch (e) {
      return [];
    }
  }

  private saveCodes(codes: RedemptionCode[]) {
    localStorage.setItem(CODES_KEY, JSON.stringify(codes));
  }

  private getOrders(): Order[] {
    try {
      const str = localStorage.getItem(ORDERS_KEY);
      return str ? JSON.parse(str) : [];
    } catch (e) {
      return [];
    }
  }

  private saveOrders(orders: Order[]) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }

  // --- Logic ---

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

  // --- Public Methods ---

  async registerCandidate(
    email: string, 
    name: string, 
    password: string, 
    location: LocationCoords
  ): Promise<User> {
    await delay(500); // Simulate network
    
    const normalizedEmail = email.toLowerCase().trim();
    const users = this.getUsers();

    if (users.some(u => u.email === normalizedEmail)) {
      throw new Error("User already registered. Please login directly.");
    }

    const uid = 'user_' + Math.random().toString(36).substr(2, 9);
    const initialExpiry = Date.now() + SESSION_DURATION_MS;

    const newUser: DBUser = {
      id: uid,
      email: normalizedEmail,
      name,
      password, // Store password
      purchasedCourses: [],
      location,
      sessionExpiry: initialExpiry
    };

    users.push(newUser);
    this.saveUsers(users);
    
    // Set session
    localStorage.setItem(SESSION_KEY, uid);
    
    const { password: _, ...safeUser } = newUser;
    this.currentUser = safeUser;
    this.notifyListeners();

    return safeUser;
  }

  async loginCandidate(email: string, password: string, currentLocation: LocationCoords): Promise<User> {
    await delay(500);
    
    const normalizedEmail = email.toLowerCase().trim();
    const users = this.getUsers();
    const user = users.find(u => u.email === normalizedEmail);

    if (!user) {
      throw new Error("Invalid credentials.");
    }

    if (user.password !== password) {
      throw new Error("Invalid credentials.");
    }

    // Location Check
    if (user.location) {
      const distance = this.getDistanceFromLatLonInKm(
        user.location.latitude,
        user.location.longitude,
        currentLocation.latitude,
        currentLocation.longitude
      );
      
      console.log(`[Location Verification] Dist: ${distance.toFixed(4)} km`);

      if (distance > 20) {
        throw new Error(`Security Alert: Location mismatch. You are ${distance.toFixed(1)}km away from your registered location.`);
      }
    }

    // Update session
    const newExpiry = Date.now() + SESSION_DURATION_MS;
    user.sessionExpiry = newExpiry;
    
    // Update in DB
    const userIndex = users.findIndex(u => u.id === user.id);
    users[userIndex] = user;
    this.saveUsers(users);

    localStorage.setItem(SESSION_KEY, user.id);
    
    const { password: _, ...safeUser } = user;
    this.currentUser = safeUser;
    this.notifyListeners();
    
    return safeUser;
  }

  async logout() {
    localStorage.removeItem(SESSION_KEY);
    this.currentUser = null;
    this.notifyListeners();
  }

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

  // --- Code Generation ---

  async generateRedemptionCode(targetEmail: string, courseIds: string[], adminName: string): Promise<string> {
    await delay(300);
    const cleanEmail = targetEmail.toLowerCase().trim();
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    const code = `VISH-${randomPart.substring(0,4)}-${randomPart.substring(4,8)}`;

    const newCode: RedemptionCode = {
      id: 'code_' + Date.now(),
      code: code,
      userEmail: cleanEmail,
      courseIds: courseIds,
      generatedBy: adminName,
      createdAt: new Date().toISOString(),
      isRedeemed: false
    };

    const codes = this.getCodes();
    codes.push(newCode);
    this.saveCodes(codes);

    return code;
  }

  async redeemCode(codeStr: string): Promise<string[]> {
    await delay(500);
    if (!this.currentUser) throw new Error("Please login to redeem codes.");

    const cleanCode = codeStr.trim().toUpperCase();
    const codes = this.getCodes();
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

    // Update Code
    codeData.isRedeemed = true;
    codes[codeIndex] = codeData;
    this.saveCodes(codes);

    // Create Order
    const newOrder: Order = {
      id: `RED_${Date.now()}`,
      userId: this.currentUser.id,
      amount: 0,
      date: new Date().toISOString(),
      items: codeData.courseIds,
      status: 'redeemed'
    };
    const orders = this.getOrders();
    orders.push(newOrder);
    this.saveOrders(orders);

    // Update User
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === this.currentUser!.id);
    if (userIndex !== -1) {
      const user = users[userIndex];
      // Add unique courses
      const updatedCourses = new Set([...user.purchasedCourses, ...codeData.courseIds]);
      user.purchasedCourses = Array.from(updatedCourses);
      users[userIndex] = user;
      this.saveUsers(users);

      // Update local state
      const { password: _, ...safeUser } = user;
      this.currentUser = safeUser;
      this.notifyListeners();
    }

    return codeData.courseIds;
  }

  async getUserOrders(): Promise<Order[]> {
    await delay(300);
    if (!this.currentUser) return [];
    
    const orders = this.getOrders();
    return orders
      .filter(o => o.userId === this.currentUser!.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export const mockService = new AuthService();