import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { isLoggedIn, userName, logout } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isActive = (path) => {
    return router.pathname === path ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600';
  };

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-white shadow-sm'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                <path d="M12.378 1.602a.75.75 0 00-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03zM21.75 7.93l-9 5.25v9l8.628-5.032a.75.75 0 00.372-.648V7.93zM11.25 22.18v-9l-9-5.25v8.57a.75.75 0 00.372.648l8.628 5.033z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">DiaBP</span>
              <span className="block text-xs text-gray-500 -mt-1">Diet Consultant</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {isLoggedIn ? (
              <>
                <Link href="/bmi" className={`${isActive('/bmi')} text-sm font-medium transition-colors`}>
                  BMI Calculator
                </Link>
                <Link href="/diet-plan" className={`${isActive('/diet-plan')} text-sm font-medium transition-colors`}>
                  Diet Plan
                </Link>

                <Link href="/records" className={`${isActive('/records')} text-sm font-medium transition-colors`}>
                  Health Records
                </Link>
                <Link href="/admin" className={`${isActive('/admin')} text-sm font-medium transition-colors`}>
                  Admin Dashboard
                </Link>
                <Link href="/db-view" className={`${isActive('/db-view')} text-sm font-medium transition-colors`}>
                  DB Viewer
                </Link>
                
                <div className="relative ml-3 flex items-center">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white font-medium text-sm">
                      {userName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {userName}
                    </span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="ml-4 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-500 rounded border border-gray-300 hover:border-red-300 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                  Log in
                </Link>
                <Link href="/signup" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition shadow-sm">
                  Sign up
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              type="button" 
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {isLoggedIn ? (
              <>
                <Link href="/bmi" className={`${router.pathname === '/bmi' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'} block px-3 py-2 rounded-md text-base font-medium`}>
                  BMI Calculator
                </Link>
                <Link href="/diet-plan" className={`${router.pathname === '/diet-plan' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'} block px-3 py-2 rounded-md text-base font-medium`}>
                  Diet Plan
                </Link>

                <Link href="/records" className={`${router.pathname === '/records' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'} block px-3 py-2 rounded-md text-base font-medium`}>
                  Health Records
                </Link>
                <Link href="/admin" className={`${router.pathname === '/admin' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'} block px-3 py-2 rounded-md text-base font-medium`}>
                  Admin Dashboard
                </Link>
                <Link href="/db-view" className={`${router.pathname === '/db-view' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'} block px-3 py-2 rounded-md text-base font-medium`}>
                  DB Viewer
                </Link>
                <div className="px-3 py-3 flex items-center justify-between border-t border-gray-200 mt-2">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white font-medium">
                      {userName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {userName}
                    </span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="text-sm text-red-500 font-medium"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col space-y-2 px-3 py-3">
                <Link href="/login" className="w-full text-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Log in
                </Link>
                <Link href="/signup" className="w-full text-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md text-sm font-medium text-white hover:from-blue-700 hover:to-indigo-700">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
} 