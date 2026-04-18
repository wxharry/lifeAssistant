import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../contexts/SupabaseContext';
import { PASSWORD_MIN_LENGTH } from '../lib/authConfig';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useSupabaseAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback('');

    if (password !== confirmPassword) {
      setFeedback('Passwords do not match');
      return;
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      setFeedback(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      setFeedback('Account created! You can now sign in.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Signup failed');
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

          {feedback && (
            <div className={feedback.includes('created') ? 'success-message' : 'error-message'}>
              {feedback}
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
