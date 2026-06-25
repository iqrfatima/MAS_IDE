import { apiClient } from '../utils/apiClient';
import { Account } from '../types';

export const getAccounts = async (): Promise<Account[]> => {
  return apiClient<Account[]>('/accounts');
};

export const getBalance = async (accountId: string): Promise<number> => {
  const data = await apiClient<{ balance: number }>(`/accounts/${accountId}/balance`);
  return data.balance;
};