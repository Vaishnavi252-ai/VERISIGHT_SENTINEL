import React, { useContext, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AuthContext } from '../contexts/AuthContext';

const VerifySuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, loading } = useContext(AuthContext);
  const token = searchParams.get('token');

  const target = currentUser ? (currentUser.role === 'Admin' ? '/admin/dashboard' : '/detection') : '/signin';

  useEffect(() => {
    if (!loading && currentUser) {
      const timer = setTimeout(() => navigate(target), 1800);
      return () => clearTimeout(timer);
    }
  }, [loading, currentUser, navigate, target]);

  const handleContinue = () => {
    navigate(target);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white overflow-hidden">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 py-12 sm:py-16 md:py-20">
        <div className="w-full max-w-md text-center space-y-6 animate-in fade-in zoom-in duration-700">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-white/20 shadow-2xl">
            <div className="w-24 h-24 bg-green-400/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border-4 border-green-400/30">
              <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">
              Email Verified!
            </h1>
            <p className="text-lg sm:text-xl text-gray-200 leading-relaxed px-4">
              Your account is now fully activated. Welcome to VeriSight Sentinel!
            </p>
            <div className="pt-6">
              <button
                onClick={handleContinue}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-lg rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-green-400/30"
              >
                {currentUser ? 'Continue to Dashboard →' : 'Continue to Sign In →'}
              </button>
            </div>
            <p className="text-sm text-gray-300 mt-4">
              {loading
                ? 'Checking your login status…'
                : currentUser
                  ? 'You are already signed in. Redirecting now.'
                  : 'If you are not signed in yet, please continue to sign in.'}
            </p>
            {currentUser && (
              <p className="text-xs text-emerald-200 mt-2">
                Logged in as {currentUser.username}.
              </p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VerifySuccess;
