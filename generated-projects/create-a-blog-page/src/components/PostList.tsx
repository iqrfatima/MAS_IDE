import React from 'react';
import { Post } from '../types';
import { PostItem } from './PostItem';

interface PostListProps {
  posts: Post[];
}

export const PostList: React.FC<PostListProps> = ({ posts }) => (
  <section className="space-y-4">
    {posts.map((post) => (
      <PostItem key={post.id} post={post} />
    ))}
  </section>
);
