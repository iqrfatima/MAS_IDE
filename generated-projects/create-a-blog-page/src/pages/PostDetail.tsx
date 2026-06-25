import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePost } from '../hooks/usePost';
import { Loading } from '../components/Loading';
import { Error } from '../components/Error';

export const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const { data: post, isLoading, isError, error } = usePost(postId);

  if (isLoading) return <Loading />;
  if (isError) return <Error message={error?.message ?? 'Unknown error'} />;
  if (!post) return <p className="text-center py-8">Post not found.</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/" className="text-blue-600 hover:underline mb-4 inline-block">
        &larr; Back to posts
      </Link>
      <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
      <time className="text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString()}</time>
      <article className="mt-6 prose max-w-none">
        <p>{post.content}</p>
      </article>
    </div>
  );
};
