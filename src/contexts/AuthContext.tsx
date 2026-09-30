import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

export type Role = 'admin' | 'officer' | 'member' | 'user';

export interface UserData {
  uid: string;
  email: string;
  name: string;
  role: Role;
  memberId?: string;
  designation?: string;
  photoUrl?: string;
  status: 'active' | 'suspended' | 'pending';
  joiningDate?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<import('firebase/auth').UserCredential>;
  logOut: () => Promise<void>;
  isAdmin: boolean;
  isOfficer: boolean;
  isMember: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signIn: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => { throw new Error('Not implemented'); },
  logOut: async () => {},
  isAdmin: false,
  isOfficer: false,
  isMember: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = undefined;
      }

      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        // Use onSnapshot for real-time updates (e.g., photo changes, role changes)
        unsubscribeSnapshot = onSnapshot(userDocRef, async (userDoc) => {
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            const isAdminEmail = currentUser.email === 'manavsamantasangthan@gmail.com' || currentUser.email === 'gulfamrpf@gmail.com';
            
            // Force admin role for the official email if somehow changed
            if (isAdminEmail && data.role !== 'admin') {
              data.role = 'admin';
              try {
                await setDoc(userDocRef, { role: 'admin' }, { merge: true });
              } catch (err) {
                console.error("Failed to force admin role in Firestore (probably a rules issue), but forcing locally:", err);
              }
            } else if (!isAdminEmail && data.role === 'user') {
              // Automatically upgrade legacy 'user' to 'member'
              data.role = 'member';
              try {
                await setDoc(userDocRef, { role: 'member' }, { merge: true });
              } catch (err) {
                console.error("Failed to force member role in Firestore:", err);
              }
            }
            setUserData(data);
          } else {
            // If no doc exists, create a basic user doc
            const isAdminEmail = currentUser.email === 'manavsamantasangthan@gmail.com' || currentUser.email === 'gulfamrpf@gmail.com';
            const newUserData: UserData = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              name: currentUser.displayName || (isAdminEmail ? 'Admin' : 'User'),
              role: isAdminEmail ? 'admin' : 'member',
              status: 'active',
            };
            
            // Save it so they are officially an admin in the database
            await setDoc(userDocRef, newUserData);
            setUserData(newUserData);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user data:", error);
          setLoading(false);
        });

      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return;
      }
      console.error("Error signing in", error);
      alert("Failed to sign in. Please try again.");
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing in with email", error);
      throw error; 
    }
  };
  
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      return await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing up with email", error);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      loading,
      signIn,
      signInWithEmail,
      signUpWithEmail,
      logOut,
      isAdmin: userData?.role === 'admin',
      isOfficer: userData?.role === 'officer' || userData?.role === 'admin',
      isMember: userData?.role === 'member' || userData?.role === 'officer' || userData?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
};
