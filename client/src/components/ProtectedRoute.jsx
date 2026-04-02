import React, { useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useContext(AuthContext);
  const nav = useNavigate();

  useEffect(() => {
    if (loading) return; // wait for auth check
    if (!currentUser) {
      nav('/signin');
    }
  }, [currentUser, loading, nav]);

  if (loading) return <div className="p-6">Checking authentication...</div>;
  if (!currentUser) return null;
  return children;
}
