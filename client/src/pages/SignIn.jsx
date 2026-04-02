import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

const SignIn = () => {
  const { signIn } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('User');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const infoMessage = location?.state?.message || null;

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn({ username, password, role });
      const user = (res && res.user) || null;
      if(user && user.role === 'Admin'){
        navigate('/admin/dashboard');
      } else {
        navigate('/detection');
      }
    } catch (err) {
      const msg = err.message || String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }), credentials: 'include' });
      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        data = null;
      }
      if (!res.ok) throw new Error((data && data.msg) || res.statusText || 'Failed');
      alert('Verification email resent.');
    } catch (e) {
      alert(e.message || String(e));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />
      <div className="max-w-md mx-auto mt-24 p-6 bg-slate-800/60 rounded-lg border border-slate-700">
        <h1 className="text-2xl font-bold mb-4">Sign in</h1>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-sm text-gray-300">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full mt-1 p-2 rounded bg-slate-700 text-white" />
          </div>
          <div>
            <label className="text-sm text-gray-300">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 p-2 rounded bg-slate-700 text-white" />
          </div>
          <div>
            <label className="text-sm text-gray-300">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full mt-1 p-2 rounded bg-slate-700 text-white">
              <option>User</option>
              <option>Admin</option>
            </select>
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          {infoMessage && <div className="text-yellow-300 text-sm">{infoMessage}</div>}
          <div className="flex items-center justify-between">
            <button disabled={loading} className="px-4 py-2 bg-purple-600 rounded">{loading ? 'Signing in...' : 'Sign in'}</button>
          </div>
        </form>
        {error && error.toLowerCase().includes('email not verified') && (
          <div className="mt-3 text-sm text-gray-300">
            <p>If you didn't receive the email, click to resend:</p>
            <button onClick={resendVerification} className="mt-2 px-3 py-1 bg-yellow-600 rounded">Resend verification</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignIn;
