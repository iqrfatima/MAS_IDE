import { apiClient } from '../utils/apiClient';
import { AuthResponse } from '../types';

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  return apiClient<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};