import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTransactions } from '../api/transactions';
import LoadingSpinner from './LoadingSpinner';

const TransactionList: React.FC = () => {
  const { data, isLoading, error } = useQuery(['transactions'], getTransactions);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600">Error loading transactions.</div>;

  return (
    <div className="mt-4">
      <h4 className="font-semibold mb-2">Recent Transactions</h4>
      <ul className="space-y-2">
        {data?.map((tx) => (
          <li key={tx.id} className="border rounded p-2">
            <p>
              From: {tx.fromAccountId} To: {tx.toAccountId} Amount: ${tx.amount.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">{new Date(tx.timestamp).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TransactionList;