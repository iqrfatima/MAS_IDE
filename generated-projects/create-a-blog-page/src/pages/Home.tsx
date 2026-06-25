import React from 'react';
import { usePosts } from '../hooks/usePosts';
import { Loading } from '../components/Loading';
import { Error } from '../components/Error';
import { PostList } from '../components/PostList';

export const Home: React.FC = () => {
  const { data, isLoading, isError, error } = usePosts();

  if (isLoading) return <Loading />;
  if (isError) return <Error message={error?.message ?? 'Unknown error'} />;
  if (!data || data.length === 0) return <p className="text-center py-8">No posts available.</p>;

  return (
    <div className="max-w-3xl mx-auto px-4">
      <h1 className="text-3xl font-bold my-8 text-center">Blog Posts</h1>
      <PostList posts={data} />
    </div>
  );
};
