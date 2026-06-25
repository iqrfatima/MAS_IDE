import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from './router';

// Create a client
const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
};

export default App;
