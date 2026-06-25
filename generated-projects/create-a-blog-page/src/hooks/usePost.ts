import { useQuery } from '@tanstack/react-query';
import { fetchPost } from '../services/api';
import { Post } from '../types';

export function usePost(id: number) {
  return useQuery<Post, Error>(['post', id], () => fetchPost(id), {
    staleTime: 5 * 60 * 1000,
    retry: 2
  });
}