import { Post } from '../types';

const API_BASE = '/api';

export async function fetchPosts(page = 1, limit = 10): Promise<Post[]> {
  console.log('Fetching posts', { page, limit });
  const response = await fetch(`${API_BASE}/posts?page=${page}&limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Error fetching posts: ${response.statusText}`);
  }
  const data = await response.json();
  return data as Post[];
}

export async function fetchPost(id: number): Promise<Post> {
  console.log('Fetching post', id);
  const response = await fetch(`${API_BASE}/posts/${id}`);
  if (!response.ok) {
    throw new Error(`Error fetching post ${id}: ${response.statusText}`);
  }
  const data = await response.json();
  return data as Post;
}