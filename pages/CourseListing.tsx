
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_COURSES } from '../constants';
import { useAuth } from '../App';
import { Button, Toast } from '../components/UI';
import { Clock, BarChart, PlayCircle, Lock, ShoppingCart, ImageOff } from 'lucide-react';
import { CourseCategory } from '../types';

export const CourseListing: React.FC = () => {
  const { cart, addToCart, user } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CourseCategory>('Class 10');

  const categories: CourseCategory[] = ['Class 10', 'Class 9', 'Class 11', 'Class 12', 'CUET', 'Sanskrit'];

  const filteredCourses = MOCK_COURSES.filter(c => c.category === activeCategory);

  const handleAddToCart = (courseId: string) => {
    addToCart(courseId);
    setToast('Course added to cart');
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
      
      {/* Header */}
      <div className="mb-8 md:mb-12 text-center md:text-left">
        <h1 className="font-display text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          Academic Programs
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto md:mx-0">
          Select your class to view available batches. Quality education at affordable prices.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-10 border-b border-white/10 pb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ${
              activeCategory === cat 
                ? 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-105' 
                : 'bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCourses.length === 0 ? (
           <div className="col-span-full text-center py-20 text-slate-500">
             No courses found for this category.
           </div>
        ) : (
          filteredCourses.map((course) => {
            const isPurchased = user?.purchasedCourses.includes(course.id);
            const isInCart = cart.includes(course.id);
            const isComingSoon = course.status === 'coming_soon';

            return (
              <div key={course.id} className={`glass-card rounded-xl overflow-hidden flex flex-col group transition-all duration-300 ${isComingSoon ? 'opacity-75 grayscale-[0.5]' : 'hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]'}`}>
                
                {/* Thumbnail Container */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-900 border-b border-white/5">
                  {/* Logic: Try to render Image, fallback to Gradient on Error */}
                  <img 
                    src={course.thumbnail} 
                    alt={course.title} 
                    className={`w-full h-full object-cover transition-transform duration-700 ${!isComingSoon && 'group-hover:scale-110'}`}
                    loading="lazy"
                    onError={(e) => {
                      // Hides the broken image and shows the background div instead
                      e.currentTarget.style.display = 'none';
                      // We can assume the parent div's background (set below) will show
                    }}
                  />

                  {/* Fallback Background (Visible if img is broken or hidden) */}
                  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 text-center">
                    <ImageOff className="text-slate-600 mb-2" size={32} />
                    <span className="text-xs text-slate-500 font-mono">Image Not Available</span>
                    <span className="text-sm font-bold text-slate-400 mt-1">{course.title}</span>
                  </div>
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none"></div>
                  
                  {/* Status Overlay */}
                  {isComingSoon && (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-20">
                      <div className="bg-slate-900 border border-white/20 px-4 py-2 rounded-lg flex items-center gap-2 text-slate-300 font-display tracking-widest uppercase">
                        <Lock size={16} /> Coming Soon
                      </div>
                    </div>
                  )}

                  {/* Price Tag (Only for Active) */}
                  {!isComingSoon && (
                    <div className="absolute top-4 right-4 bg-fuchsia-600 text-white text-xs font-bold px-3 py-1 rounded shadow-lg z-10">
                      {course.category}
                    </div>
                  )}
                  
                  <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end z-10">
                    {!isComingSoon && (
                      <span className="bg-emerald-950/90 backdrop-blur text-emerald-400 text-sm px-3 py-1 rounded font-mono border border-emerald-500/30 font-bold shadow-lg">
                         ₹600
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow relative">
                  <h3 className="font-display text-xl font-bold mb-2 line-clamp-2 min-h-[3.5rem]" title={course.title}>
                    {course.title}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2 flex-grow">
                    {course.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-6 font-mono border-t border-white/5 pt-4">
                    <div className="flex items-center gap-1">
                      <Clock size={14} /> {course.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart size={14} /> {course.instructor}
                    </div>
                  </div>

                  {/* Action Button */}
                  {isComingSoon ? (
                    <Button disabled variant="ghost" className="w-full border border-white/10 cursor-not-allowed text-slate-500">
                      Enrollment Closed
                    </Button>
                  ) : isPurchased ? (
                     <Button 
                       onClick={() => navigate(`/study/${course.id}`)}
                       className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                     >
                       <PlayCircle size={18} className="mr-2 inline" /> Let's Study
                     </Button>
                  ) : (
                    <Button 
                      onClick={() => handleAddToCart(course.id)} 
                      disabled={isInCart}
                      variant={isInCart ? 'ghost' : 'primary'}
                      className={`w-full ${!isInCart && 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg'}`}
                    >
                      {isInCart ? (
                        'Added to Cart'
                      ) : (
                        <>
                          <ShoppingCart size={18} className="mr-2 inline" /> Buy Now
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
