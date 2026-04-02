import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

// SignUp now integrates optional reCAPTCHA v3. The site key is fetched from /api/config.

const SignUp = () => {
  const { signUp } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('User');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // If we have a recaptcha site key, obtain token
      let recaptchaToken = null;
      if (recaptchaSiteKey && window.grecaptcha) {
        recaptchaToken = await window.grecaptcha.execute(recaptchaSiteKey, { action: 'signup' });
      }

      // Send registration to server; server will send verification email
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password, role, recaptchaToken }),
        credentials: 'include'
      });
      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        // empty or non-JSON response
        data = null;
      }
      if (!res.ok) throw new Error((data && data.msg) || res.statusText || 'Registration failed');

      // Tell user to check email for verification
      navigate('/signin', { state: { message: 'Verification email sent. Please check your inbox.' } });
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState(null);

  useEffect(() => {
    const loadSiteKey = async () => {
      try {
        const r = await fetch('/api/config');
        let json = null;
        try {
          json = await r.json();
        } catch (e) {
          json = null;
        }
        if (json && json.recaptchaSiteKey) {
          setRecaptchaSiteKey(json.recaptchaSiteKey);
          // load recaptcha v3 script
          const s = document.createElement('script');
          s.src = `https://www.google.com/recaptcha/api.js?render=${json.recaptchaSiteKey}`;
          s.async = true;
          document.body.appendChild(s);
        }
      } catch (e) {}
    };
    loadSiteKey();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />
      <div className="max-w-md mx-auto mt-24 p-6 bg-slate-800/60 rounded-lg border border-slate-700">
        <h1 className="text-2xl font-bold mb-4">Create account</h1>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-sm text-gray-300">Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 p-2 rounded bg-slate-700 text-white" />
          </div>
          <div>
            <label className="text-sm text-gray-300">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full mt-1 p-2 rounded bg-slate-700 text-white" />
          </div>
          <div>
            <label className="text-sm text-gray-300">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full mt-1 p-2 rounded bg-slate-700 text-white" />
          </div>
          <div>
            <label className="text-sm text-gray-300">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full mt-1 p-2 rounded bg-slate-700 text-white" />
          </div>
          <div>
            <label className="text-sm text-gray-300">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full mt-1 p-2 rounded bg-slate-700 text-white">
              <option>User</option>
            </select>
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <div className="flex items-center justify-between">
            <button disabled={loading} className="px-4 py-2 bg-green-600 rounded">{loading ? 'Creating...' : 'Create account'}</button>
          </div>
        </form>
        <div className="mt-3 text-sm text-gray-400">Passwords are transmitted securely in this demo; store hashed on the server (done).</div>
      </div>
    </div>
  );
};

export default SignUp;
