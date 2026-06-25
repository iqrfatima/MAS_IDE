import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAccounts } from '../api/accounts';
import LoadingSpinner from './LoadingSpinner';

const AccountOverview: React.FC = () => {
  const { data, isLoading, error } = useQuery(['accounts'], getAccounts);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600">Error loading accounts.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {data?.map((acc) => (
        <div key={acc.id} className="border rounded p-4 shadow">
          <h3 className="font-semibold">{acc.name}</h3>
          <p className="text-gray-700">Balance: ${acc.balance.toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
};

export default AccountOverview;