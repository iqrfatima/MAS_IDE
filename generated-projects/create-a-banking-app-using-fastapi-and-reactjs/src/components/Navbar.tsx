import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar: React.FC = () => {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-semibold">
          Banking App
        </Link>
        {isAuthenticated && (
          <div className="space-x-4">
            <Link to="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <Link to="/transaction" className="hover:underline">
              Transfer
            </Link>
            <button onClick={handleLogout} className="hover:underline">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;