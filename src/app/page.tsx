import { BackgroundSlideshow } from '@/lib/components';

export default function Home() {
  return (
    <div className="font-sans min-h-screen flex items-center justify-center p-4 sm:p-8 relative">
      <BackgroundSlideshow />
      
      {/* Main invitation card */}
      <div className="relative z-10 backdrop-blur-xs rounded-2xl shadow-2xl p-6 sm:p-8 md:p-12 max-w-2xl mx-auto text-center w-full">
        
        {/* Decorative top border */}
        <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-green-800 mx-auto mb-8 rounded-full"></div>
        
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 mb-2 tracking-wider">
            You&apos;re Invited
          </h1>
          <p className="text-base sm:text-lg text-gray-800 font-light">to celebrate our special day</p>
        </div>
        
        {/* Names placeholder */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-gray-900 mb-2">
            [Guest Name]
          </h2>
          <p className="text-base sm:text-lg text-gray-800">We would be honored by your presence</p>
        </div>
        
        {/* Wedding details */}
        <div className="mb-8 sm:mb-12 space-y-4 sm:space-y-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-serif text-gray-900 mb-2">Suzane & Amine</h3>
            <p className="text-sm sm:text-base text-gray-800">Request the pleasure of your company</p>
          </div>
          
          <div className="text-lg sm:text-xl text-gray-900">
            <p className="font-light">as we begin our journey together</p>
          </div>
          
          <div className="py-4 sm:py-6 border-t border-b border-gray-300">
            <div className="text-2xl sm:text-3xl font-serif text-gray-900 mb-2">
              August 8th, 2026
            </div>
            <div className="text-base sm:text-lg text-gray-800">
              Saturday Evening
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-base sm:text-lg text-gray-900">Ceremony & Reception</p>
            <p className="text-sm sm:text-base text-gray-800">[Venue Name]</p>
            <p className="text-sm sm:text-base text-gray-800">[Venue Address]</p>
            <p className="text-sm sm:text-base text-gray-800">[City, State]</p>
          </div>
        </div>
        
        {/* RSVP section */}
        <div className="mb-8 p-6 bg-white bg-opacity-30 rounded-lg">
          <h4 className="text-xl font-serif text-gray-900 mb-2">RSVP</h4>
          <p className="text-gray-800 mb-4">Please respond by [Date]</p>
          <div className="flex justify-center space-x-4 text-sm">
            <span className="text-gray-800">Email: [email]</span>
            <span className="text-gray-800">Phone: [phone]</span>
          </div>
        </div>
        
        {/* Decorative bottom border */}
        <div className="w-24 h-1 bg-gradient-to-r from-green-800 to-green-400 mx-auto rounded-full"></div>
        
        {/* Additional details */}
        <div className="mt-8 text-sm text-gray-700">
          <p>Dress Code: [Formal/Semi-Formal/Casual]</p>
          <p>Children: [Welcome/Adults Only]</p>
        </div>
      </div>
    </div>
  );
}
