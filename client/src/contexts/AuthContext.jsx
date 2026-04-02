import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // { username, name, email, role }
  const [loading, setLoading] = useState(true);

  // On mount, try to load current user from server (checks cookie)
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          let data = null;
          try {
            data = await res.json();
          } catch (e) {
            // non-JSON or empty response
            data = null;
          }
          if (data && data.user) setCurrentUser(data.user);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const signUp = async ({ name, username, email, password, role }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, username, email, password, role }),
    });
    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      // empty or non-JSON response
      data = null;
    }
    if (!res.ok) {
      const msg = (data && data.msg) || res.statusText || 'Registration failed';
      throw new Error(msg);
    }
    if (data && data.user) setCurrentUser(data.user);
    return data;
  };

  const signIn = async ({ username, password, role }) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password, role }),
    });
    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
    if (!res.ok) {
      const msg = (data && data.msg) || res.statusText || 'Login failed';
      throw new Error(msg);
    }
    if (data && data.user) setCurrentUser(data.user);
    return data;
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
