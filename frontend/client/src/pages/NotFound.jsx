import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
            404
          </h1>
          <div className="absolute inset-0 text-9xl font-bold text-gray-200 -z-10 animate-ping">
            404
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8 text-lg">
          Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
        </p>
        
        {/* Navigation Options */}
        <div className="space-y-4">
          <Link 
            to="/" 
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:via-purple-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go Home
          </Link>
          
          <Link 
            to="/feed" 
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
            </svg>
            Explore Feed
          </Link>
          
          <Link 
            to="/upload" 
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Upload Photo
          </Link>
        </div>
        
        {/* Help Text */}
        <div className="mt-8 p-4 bg-white/50 rounded-xl backdrop-blur-sm">
          <p className="text-sm text-gray-600">
            Need help? Check out our{' '}
            <Link to="/help" className="text-primary-600 hover:text-primary-700 font-medium">
              help center
            </Link>
            {' '}or{' '}
            <Link to="/contact" className="text-primary-600 hover:text-primary-700 font-medium">
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

