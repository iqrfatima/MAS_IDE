import { useQuery } from '@tanstack/react-query';
import { fetchPosts } from '../services/api';
import { Post } from '../types';

export function usePosts(page = 1, limit = 10) {
  return useQuery<Post[], Error>(['posts', page, limit], () => fetchPosts(page, limit), {
    staleTime: 5 * 60 * 1000,
    retry: 2
  });
}