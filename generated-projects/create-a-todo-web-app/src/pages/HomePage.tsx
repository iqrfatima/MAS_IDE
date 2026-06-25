import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Renders the Home Page of the application.
 * This page serves as the entry point and provides a welcome message.
 * @returns {JSX.Element} The Home Page component.
 */
const HomePage: React.FC = (): JSX.Element => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Your Todo App!</h1>
        <p className="text-lg text-gray-600 mb-6">
          This is the starting point of your personal task manager.
        </p>
        <p className="text-md text-gray-700 mb-8">
          Organize your tasks, stay productive, and achieve your goals.
        </p>
        {/* Example link - will be updated as other pages are added */}
        <Link
          to="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
