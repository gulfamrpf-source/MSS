import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Loader2, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const { user, userData, signIn } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in and admin, redirect to dashboard
  if (user && userData?.role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      await signIn();
      // Wait for auth context to update, then navigate to dashboard
      // The context will handle the redirect if they are admin, but we can explicitly push here
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Failed to authenticate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-8 text-center relative">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Admin Portal</h2>
          <p className="text-slate-400 text-sm">Secure access for organization management</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3 items-start text-rose-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <p className="text-center text-slate-600 font-medium">
              Please sign in with your authorized Admin Google Account to access the dashboard.
            </p>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Authenticating...</>
              ) : (
                'Sign in with Google'
              )}
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <button 
              onClick={() => navigate('/')} 
              className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              &larr; Back to Public Website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

