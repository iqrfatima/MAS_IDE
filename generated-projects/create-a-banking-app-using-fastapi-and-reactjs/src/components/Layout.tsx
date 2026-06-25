import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import LoadingSpinner from './LoadingSpinner';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-4">
        <React.Suspense fallback={<LoadingSpinner />}>{<Outlet />}</React.Suspense>
      </main>
    </div>
  );
};

export default Layout;