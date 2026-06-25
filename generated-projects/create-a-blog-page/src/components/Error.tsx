import React from 'react';

interface ErrorProps {
  message: string;
}

export const Error: React.FC<ErrorProps> = ({ message }) => (
  <div className="bg-red-100 text-red-700 p-4 rounded-md text-center">
    {message}
  </div>
);