
export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export type CourseCategory = 'Class 9' | 'Class 10' | 'Class 11' | 'Class 12' | 'CUET' | 'Sanskrit';

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  price: number; // Stored in USD for backend consistency
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
  purchasedCourses: string[]; // Array of Course IDs
  location?: LocationCoords;
  sessionExpiry?: number; // Timestamp stored in DB
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
  userEmail: string; // The code is locked to this email
  courseIds: string[];
  generatedBy: string;
  createdAt: string;
  isRedeemed: boolean;
}

export interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  sessionExpiry: number | null; // Timestamp
  login: (email: string) => Promise<void>;
  logout: () => void;
  cart: string[];
  addToCart: (courseId: string) => void;
  removeFromCart: (courseId: string) => void;
  clearCart: () => void;
}
