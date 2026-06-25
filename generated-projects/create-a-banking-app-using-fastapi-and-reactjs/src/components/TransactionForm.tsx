import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTransaction, getAccounts } from '../api/transactions';
import { Account } from '../types';
import LoadingSpinner from './LoadingSpinner';

const TransactionForm: React.FC = () => {
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: accounts } = useQuery(['accounts'], getAccounts);

  const mutation = useMutation(createTransaction, {
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      setFrom('');
      setTo('');
      setAmount('');
      setErrorMsg('');
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Transaction failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to || !amount) {
      setErrorMsg('All fields are required');
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Amount must be a positive number');
      return;
    }
    mutation.mutate({ fromAccountId: from, toAccountId: to, amount: amt });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-4">Transfer Funds</h3>
      {errorMsg && <p className="text-red-600 mb-2">{errorMsg}</p>}
      <div className="mb-3">
        <label className="block mb-1">From Account</label>
        <select
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="">Select account</option>
          {accounts?.map((acc: Account) => (
            <option key={acc.id} value={acc.id}>
              {acc.name} (${acc.balance.toFixed(2)})
            </option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="block mb-1">To Account</label>
        <select
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="">Select account</option>
          {accounts?.map((acc: Account) => (
            <option key={acc.id} value={acc.id}>
              {acc.name} (${acc.balance.toFixed(2)})
            </option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="block mb-1">Amount</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border rounded p-2"
        />
      </div>
      <button
        type="submit"
        disabled={mutation.isLoading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        {mutation.isLoading ? 'Transferring...' : 'Transfer'}
      </button>
    </form>
  );
};

export default TransactionForm;