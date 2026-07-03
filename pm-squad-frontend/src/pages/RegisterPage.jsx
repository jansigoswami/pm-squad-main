import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

const FEATURES = [
  'Work + Personal tasks in one place',
  'Team board with real-time sync',
  'Boss dashboard for full oversight',
];

// Returns { label, value (0-3), color } describing password strength.
function strengthOf(pw) {
  if (!pw) return { label: '', value: 0, color: 'bg-gray-200' };
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);
  if (pw.length >= 10 && hasSymbol)
    return { label: 'Strong', value: 3, color: 'bg-green-500' };
  if (pw.length >= 6)
    return { label: 'Medium', value: 2, color: 'bg-yellow-500' };
  return { label: 'Weak', value: 1, color: 'bg-red-500' };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = strengthOf(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name,
        email,
        password,
      });
      setAuth(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-600';

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel (desktop only) */}
      <div className="hidden md:flex md:w-2/5 flex-col justify-center px-12 bg-brand-900 text-white">
        <h1 className="text-4xl font-bold tracking-tight">PM Squad</h1>
        <p className="mt-3 text-lg text-blue-100">Build. Assign. Ship.</p>
        <ul className="mt-12 space-y-5">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-blue-300 shrink-0" />
              <span className="text-blue-50">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create account
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Join your team on PM Squad
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className={inputClass}
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className={inputClass}
              />
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all`}
                      style={{ width: `${(strength.value / 3) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm password"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-700 hover:bg-brand-600 text-white font-medium transition disabled:opacity-60"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {loading ? 'Creating…' : 'Create account'}
            </button>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 hover:underline">
              Login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
