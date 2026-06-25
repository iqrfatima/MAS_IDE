import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Defines the basic layout structure for the application.
 * Includes a header and a main content area where child routes are rendered.
 * @returns {JSX.Element} The Layout component.
 */
const Layout: React.FC = (): JSX.Element => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-blue-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Todo App</h1>
          {/* Navigation can be added here */}
          <nav>
            {/* <Link to="/" className="text-white hover:text-blue-200 mr-4">Home</Link> */}
            {/* <Link to="/todos" className="text-white hover:text-blue-200">Todos</Link> */}
          </nav>
        </div>
      </header>
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Todo App. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;
