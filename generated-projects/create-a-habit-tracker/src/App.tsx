import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold leading-tight">
            Habit Tracker
          </h1>
          {/* Navigation/Auth buttons will go here */}
          <nav>
            {/* Placeholder for navigation links */}
            <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline px-3 py-2 rounded-md text-sm font-medium">Login</a>
            <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline px-3 py-2 rounded-md text-sm font-medium">Register</a>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Placeholder for future Habit List and Add Habit components */}
          <div className="border-4 border-dashed border-gray-300 dark:border-gray-700 rounded-lg h-96 flex items-center justify-center">
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Welcome to your Habit Tracker! Habits will appear here.
            </p>
          </div>
        </div>
      </main>

      {/* Optional: Footer */}
      <footer className="mt-8 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Habit Tracker. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
