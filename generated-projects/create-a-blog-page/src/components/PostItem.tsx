import React from 'react';
import { Post } from '../types';
import { Link } from 'react-router-dom';

interface PostItemProps {
  post: Post;
}

export const PostItem: React.FC<PostItemProps> = ({ post }) => (
  <article className="border-b py-4">
    <Link to={`/posts/${post.id}`} className="block">
      <h2 className="text-xl font-semibold text-blue-600 hover:underline">{post.title}</h2>
      <p className="text-gray-700 mt-2">{post.excerpt}</p>
      <time className="text-sm text-gray-500 mt-1 block">{new Date(post.created_at).toLocaleDateString()}</time>
    </Link>
  </article>
);
