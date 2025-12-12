
import { Course } from "./types";

// Note: Price 7.15 USD * 84 INR ≈ 600 INR
const PRICE_INR_600_IN_USD = 7.15; 

// STRICT PATH: Points exactly to the assets folder in the build output
// NOTE: In Vite/Netlify production, 'public/assets' becomes just '/assets'
export const PAYMENT_QR_PATH = "/assets/gpay_qr.png"; 

export const MOCK_COURSES: Course[] = [
  // --- CLASS 10 (Active) ---
  {
    id: "abhay_cbse_10",
    title: "Abhay 2026 ~ Class 10th",
    description: "Abhay Batch for Class 10th CBSE students. Comprehensive coverage of Science, Maths, SST & English. Join the Next Toppers league.",
    instructor: "Next Toppers Team",
    price: PRICE_INR_600_IN_USD,
    duration: "Full Year",
    thumbnail: "/assets/abhay_cbse_10.png", 
    tags: ["CBSE", "Class 10", "Live"],
    category: "Class 10",
    status: "active"
  },
  {
    id: "abhay_bihar_10",
    title: "Bihar Board ABHAY 10th (हिंदी माध्यम)",
    description: "Specialized batch for Bihar Board matric students. Full syllabus coverage in Hindi Medium with dedicated doubt support.",
    instructor: "Abhay Team Bihar",
    price: PRICE_INR_600_IN_USD,
    duration: "Full Year",
    thumbnail: "/assets/abhay_bihar_10.png", 
    tags: ["Bihar Board", "Hindi Medium", "Class 10"],
    category: "Class 10",
    status: "active"
  },
  {
    id: "abhay_up_10",
    title: "UP Board ABHAY 10th (हिंदी माध्यम)",
    description: "Ultimate preparation guide for UP Board High School exams. Notes, Tests, and Live Lectures included.",
    instructor: "Abhay Team UP",
    price: PRICE_INR_600_IN_USD,
    duration: "Full Year",
    thumbnail: "/assets/abhay_up_10.png", 
    tags: ["UP Board", "Hindi Medium", "Class 10"],
    category: "Class 10",
    status: "active"
  },

  // --- CLASS 9 (Coming Soon) ---
  {
    id: "c9_coming_soon",
    title: "Class 9th Foundation",
    description: "Building strong roots for board exams. Full syllabus mastery coming soon.",
    instructor: "Vishwajith Academy",
    price: 0,
    duration: "TBA",
    thumbnail: "", // Empty thumbnail triggers gradient fallback
    tags: ["Foundation"],
    category: "Class 9",
    status: "coming_soon"
  },

  // --- CLASS 11 (Coming Soon) ---
  {
    id: "c11_coming_soon",
    title: "Class 11th - PCM/PCB",
    description: "The bridge to engineering and medical entrance exams. Launching shortly.",
    instructor: "Top Faculty",
    price: 0,
    duration: "TBA",
    thumbnail: "",
    tags: ["Science"],
    category: "Class 11",
    status: "coming_soon"
  },

  // --- CLASS 12 (Coming Soon) ---
  {
    id: "c12_coming_soon",
    title: "Class 12th - Boards + JEE/NEET",
    description: "Final school year preparation with competitive edge. Wait for the launch.",
    instructor: "Top Faculty",
    price: 0,
    duration: "TBA",
    thumbnail: "",
    tags: ["Boards", "Entrance"],
    category: "Class 12",
    status: "coming_soon"
  },

  // --- CUET (Coming Soon) ---
  {
    id: "cuet_coming_soon",
    title: "CUET Crash Course",
    description: "Crack your dream central university with our specialized course.",
    instructor: "Expert Team",
    price: 0,
    duration: "TBA",
    thumbnail: "",
    tags: ["University", "Entrance"],
    category: "CUET",
    status: "coming_soon"
  },

  // --- SANSKRIT (Coming Soon) ---
  {
    id: "sanskrit_coming_soon",
    title: "Sanskrit Vyakaran & Literature",
    description: "Master the ancient language with modern pedagogy.",
    instructor: "Acharya Ji",
    price: 0,
    duration: "TBA",
    thumbnail: "",
    tags: ["Language", "Culture"],
    category: "Sanskrit",
    status: "coming_soon"
  },
];

export const STRIPE_PUBLIC_KEY = "pk_test_PLACEHOLDER"; 
export const RAZORPAY_KEY_ID = "rzp_test_PLACEHOLDER";