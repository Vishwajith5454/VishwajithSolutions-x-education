
export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source?: 'ip_geo' | 'client_gps';
}

export type CourseCategory = 'Class 9' | 'Class 10' | 'Class 11' | 'Class 12' | 'CUET' | 'Sanskrit';

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  price: number;
  duration: string;
  thumbnail: string;
  previewVideoUrl?: string;
  tags: string[];
  category: CourseCategory;
  status: 'active' | 'coming_soon';
}

export interface User {
  id: string;
  email: string;
  name: string;
  purchasedCourses: string[];
  cart: string[];
  savedLocation?: LocationCoords; // The authoritative registration location
  sessionExpiry?: number;
}

export interface AuthResponse {
  status: 'SUCCESS' | 'REQUIRE_OTP' | 'DENIED';
  user?: User;
  message?: string;
  action?: string;
  otpSentTo?: string; // Masked email
  tempToken?: string; // For 2nd step verification
}

export interface CartItem {
  courseId: string;
}

export interface Order {
  id: string;
  userId: string;
  amount: number;
  date: string;
  items: string[];
  status: 'paid' | 'pending' | 'failed' | 'redeemed';
}

export interface RedemptionCode {
  id?: string;
  code: string;
  userEmail: string;
  courseIds: string[];
  generatedBy: string;
  createdAt: string;
  isRedeemed: boolean;
}

export interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  sessionExpiry: number | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
  cart: string[];
  addToCart: (courseId: string) => void;
  removeFromCart: (courseId: string) => void;
  clearCart: () => void;
}
