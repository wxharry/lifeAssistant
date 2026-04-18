import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, LocalUser, signInWithPassword, signOutSession, signUpWithPassword } from '../lib/sqlite';

interface SupabaseContextType {
  user: LocalUser | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const localUser = await getCurrentUser();
        setUser(localUser);
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const signUp = async (email: string, password: string) => {
    await signUpWithPassword(email, password);
  };

  const signIn = async (email: string, password: string) => {
    const signedInUser = await signInWithPassword(email, password);
    setUser(signedInUser);
  };

  const signOut = async () => {
    await signOutSession();
    setUser(null);
  };

  return (
    <SupabaseContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within SupabaseProvider');
  }
  return context;
}
