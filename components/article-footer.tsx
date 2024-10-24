import { IconEye, IconThumbDown, IconThumbUp } from '@tabler/icons-react';
import { useLocalStorage } from '@uidotdev/usehooks';
import axios from 'axios';
import { useRouter } from 'next/router';
import React from 'react';
// import Giscus from '@giscus/react'

import { useMutation, useQuery, useQueryClient } from 'react-query';

import type { Post } from 'pages/api/logic';

const Button: React.FC<
  {
    children: React.ReactNode;
    isActive: boolean;
  } & React.HTMLProps<HTMLButtonElement>
> = ({ children, isActive, ...props }) => (
  <button
    type={'button' as any}
    className={[
      'border-2 p-1 rounded hover:disabled:opacity-50 hover:disabled:cursor-not-allowed transition-all',
      isActive
        ? 'border-blue-500 text-blue-500'
        : 'border-black/40 dark:border-white/20',
    ].join(' ')}
    {...props}
  >
    {children}
  </button>
);

const ArticleFooter = () => {
  const { pathname } = useRouter();
  const path = encodeURI(pathname);
  const qk = useQueryClient();

  const [localStatus, setLocalStatus] = useLocalStorage<
    'liked' | 'disliked' | null
  >(path, null);

  const { data: post, isSuccess: postLoaded } = useQuery(['post', path], {
    queryFn: () => axios.post('/api/view', { path }),
    select: (data) => ({ ...data.data, views: data.data.views || 1 } as Post),
    refetchOnWindowFocus: false,
  });

  const like = useMutation([path], {
    mutationFn: () => axios.post('/api/like', { path }),
    onSuccess() {
      if (!post) return;
      qk.setQueryData(['post', path], {
        data: {
          ...post,
          likes: post.likes + 1,
          dislikes:
            localStatus == 'disliked' ? post.dislikes - 1 : post.dislikes,
        },
      });
      setLocalStatus('liked');
    },
  });

  const dislike = useMutation([path], {
    mutationFn: () => axios.post('/api/like', { path }),
    onSuccess() {
      if (!post) return;
      qk.setQueryData(['post', path], {
        data: {
          ...post,
          dislikes: post.dislikes + 1,
          likes: localStatus == 'liked' ? post.likes - 1 : post.likes,
        },
      });
      setLocalStatus('disliked');
    },
  });

  const buttonsDisabled =
    !postLoaded || like.isLoading || dislike.isLoading || localStatus != null;

  return (
    <>
      <div className="flex gap-2 mb-2">
        <div className="flex flex-col items-center w-8">
          <div className="p-1 border-2 border-transparent">
            <IconEye stroke={2} />
          </div>
          <span>{post?.views ?? 0}</span>
        </div>
        <div className="flex flex-col items-center w-8">
          <Button
            isActive={localStatus == 'liked'}
            disabled={buttonsDisabled}
            onClick={() => like.mutateAsync()}
          >
            <IconThumbUp stroke={2} />
          </Button>
          <span>{post?.likes ?? 0}</span>
        </div>
        <div className="flex flex-col items-center w-8">
          <Button
            isActive={localStatus == 'disliked'}
            disabled={buttonsDisabled}
            onClick={() => dislike.mutateAsync()}
          >
            <IconThumbDown stroke={2} />
          </Button>
          <span>{post?.dislikes ?? 0}</span>
        </div>
      </div>
      {/* <Giscus
            id="comments"
            repo="giscus/giscus-component"
            repoId="MDEwOlJlcG9zaXRvcnkzOTEzMTMwMjA="
            category="Announcements"
            categoryId="DIC_kwDOF1L2fM4B-hVS"
            mapping="specific"
            term="Welcome to @giscus/react component!"
            reactionsEnabled="1"
            emitMetadata="0"
            inputPosition="top"
            theme="light"
            lang="en"
            loading="lazy"
        /> */}
    </>
  );
};

export default ArticleFooter;