import { useState } from 'react';
import { useRouter } from 'next/router';
import Header from './Header';
import Footer from './Footer';
import Chatbot from './Chatbot';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  
  // Don't show floating chatbot on login/signup/chat pages; show elsewhere
  const showChatbot = !router.pathname.includes('/login') && !router.pathname.includes('/signup') && !router.pathname.includes('/chat');
  
  // Check if the current route is login or signup to adjust padding
  const isAuthPage = router.pathname.includes('/login') || router.pathname.includes('/signup');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className={`flex-grow ${isAuthPage ? 'py-0' : 'py-6 md:py-12'}`}>
        {children}
      </main>
      
      <Footer />
      
      {/* Chatbot - visible to all users, but functionality restricted to logged in users */}
      {showChatbot && (
        <>
          <button
            onClick={() => setIsChatbotOpen(true)}
            className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 z-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Open AI Diet Assistant"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path d="M16.5 7.5h-9v9h9v-9z" />
              <path fillRule="evenodd" d="M8.25 2.25A.75.75 0 019 3v.75h2.25V3a.75.75 0 011.5 0v.75H15V3a.75.75 0 011.5 0v.75h.75a3 3 0 013 3v.75H21A.75.75 0 0121 9h-.75v2.25H21a.75.75 0 010 1.5h-.75V15H21a.75.75 0 010 1.5h-.75v.75a3 3 0 01-3 3h-.75V21a.75.75 0 01-1.5 0v-.75h-2.25V21a.75.75 0 01-1.5 0v-.75H9V21a.75.75 0 01-1.5 0v-.75h-.75a3 3 0 01-3-3v-.75H3A.75.75 0 013 15h.75v-2.25H3a.75.75 0 010-1.5h.75V9H3a.75.75 0 010-1.5h.75v-.75a3 3 0 013-3h.75V3a.75.75 0 01.75-.75zM6 6.75A.75.75 0 016.75 6h10.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V6.75z" clipRule="evenodd" />
            </svg>
          </button>
          
          <div className="fixed bottom-6 right-6 flex items-center space-x-2 z-40 pointer-events-none">
            <div className={`transform transition-all duration-300 ${isChatbotOpen ? 'opacity-0 translate-x-5' : 'opacity-100'} bg-white text-gray-700 font-medium text-sm px-3 py-1.5 rounded-lg shadow pointer-events-none`}>
              AI Diet Assistant 
            </div>
          </div>
          
          <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
        </>
      )}
    </div>
  );
};

export default Layout; 