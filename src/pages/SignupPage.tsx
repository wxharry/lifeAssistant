import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../contexts/SupabaseContext';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useSupabaseAuth();

  const isDevelopment = import.meta.env.DEV;

  // Hide signup page in production
  if (!isDevelopment) {
    return (
      <div className="auth-container">
        <div className="auth-card text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
          <p className="text-gray-600 mb-6">
            Sign up is not available at this time. If you need access, please contact the administrator.
          </p>
          <a 
            href="/login" 
            className="text-blue-600 hover:underline font-medium"
          >
            Go to login
          </a>
        </div>
      </div>
    );
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      setError('Account created! Check your email to confirm your account.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Create Account</h1>
        
        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className={error.includes('created') ? 'success-message' : 'error-message'}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full mb-4"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
