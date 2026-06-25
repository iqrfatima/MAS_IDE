import { apiClient } from '../utils/apiClient';
import { Transaction, CreateTransactionRequest } from '../types';

export const getTransactions = async (): Promise<Transaction[]> => {
  return apiClient<Transaction[]>('/transactions');
};

export const createTransaction = async (payload: CreateTransactionRequest): Promise<Transaction> => {
  return apiClient<Transaction>('/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};