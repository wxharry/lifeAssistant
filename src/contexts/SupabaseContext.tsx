import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface SupabaseContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    // Only allow signup in development (localhost)
    const isDevelopment = import.meta.env.DEV;
    if (!isDevelopment) {
      throw new Error('Signup is not available in production. Contact the administrator.');
    }

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const checkEmailAuthorization = async (email: string) => {
    try {
      const { data, error: checkError } = await supabase
        .from('allowed_users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (checkError || !data) {
        throw new Error('This email is not authorized to access this application.');
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('not authorized')) {
        throw err;
      }
      throw new Error('Failed to verify email authorization. Please try again.');
    }
  };

  const signIn = async (email: string, password: string) => {
    // Check if email is in allowed_users table
    await checkEmailAuthorization(email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
