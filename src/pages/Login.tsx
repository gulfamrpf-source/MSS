import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Lock, Mail } from 'lucide-react';

export default function Login() {
  const { signInWithEmail, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await signInWithEmail(email, password);
      navigate('/dashboard');
    
    
    } catch (err: any) {
      if (email.toLowerCase() === 'gulfamrpf@gmail.com' && password === '@1Samanta') {
        try {
          const { createUserWithEmailAndPassword } = await import('firebase/auth');
          const { auth } = await import('../firebase');
          await createUserWithEmailAndPassword(auth, email, password);
          navigate('/dashboard');
          return;
        } catch (createErr: any) {
          if (createErr.code === 'auth/operation-not-allowed') {
             setError("Firebase Alert: 'Email/Password' authentication is DISABLED in your Firebase project. Please go to Firebase Console -> Authentication -> Sign-in method -> Enable Email/Password. Or use the Google button below.");
             setLoading(false);
             return;
          }
          console.error("Admin auto-create failed", createErr);
        }
      }
      
      if (err.code === 'auth/operation-not-allowed') {
         setError("Firebase Alert: 'Email/Password' login is DISABLED in your Firebase Console. Please enable it in Authentication settings.");
      } else {
         setError('Invalid User ID or password. Please try again.');
      }
      console.error(err);
    }

   finally {



      setLoading(false);
    }
  };

  

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-emerald-950 p-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-emerald-100 text-sm">Sign in to your member account</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">User ID / Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                  placeholder="Enter your User ID or Email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70"
            >
              {loading ? 'Signing in...' : <><LogIn className="w-5 h-5" /> Sign In</>}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Or continue with</span>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
               try {
                 const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
                 const { auth } = await import('../firebase');
                 const provider = new GoogleAuthProvider();
                 await signInWithPopup(auth, provider);
                 navigate('/dashboard');
               } catch (err) {
                 console.error(err);
                 setError('Google Sign In failed.');
               }
            }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition-colors shadow-sm mb-4"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Google
          </button>


          

          <p className="mt-8 text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <Link to="/join" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
              Join Us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
