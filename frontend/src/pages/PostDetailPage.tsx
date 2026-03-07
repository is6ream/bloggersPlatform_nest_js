import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '../api/posts';
import { commentsApi } from '../api/comments';
import { useAuth } from '../context/AuthContext';
import { LikeButton } from '../components/LikeButton';
import { Pagination } from '../components/ui/Pagination';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import type { LikeStatus } from '../api/types';

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentPage, setCommentPage] = useState(1);
  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState<{ id: string; content: string } | null>(null);

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: () => postsApi.getById(id!),
    enabled: !!id,
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['post-comments', id, commentPage],
    queryFn: () => postsApi.getComments(id!, { pageNumber: commentPage, pageSize: 10 }),
    enabled: !!id,
  });

  const postLikeMutation = useMutation({
    mutationFn: (likeStatus: LikeStatus) => postsApi.setLikeStatus(id!, likeStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['post', id] }),
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => postsApi.addComment(id!, content),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['post-comments', id] });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      commentsApi.update(commentId, content),
    onSuccess: () => {
      setEditingComment(null);
      queryClient.invalidateQueries({ queryKey: ['post-comments', id] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => commentsApi.delete(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['post-comments', id] }),
  });

  const commentLikeMutation = useMutation({
    mutationFn: ({ commentId, likeStatus }: { commentId: string; likeStatus: LikeStatus }) =>
      commentsApi.setLikeStatus(commentId, likeStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['post-comments', id] }),
  });

  const handlePostLike = (current: LikeStatus, next: 'Like' | 'Dislike') => {
    postLikeMutation.mutate(current === next ? 'None' : next);
  };

  const handleCommentLike = (commentId: string, current: LikeStatus, next: 'Like' | 'Dislike') => {
    commentLikeMutation.mutate({ commentId, likeStatus: current === next ? 'None' : next });
  };

  if (isLoading) return <Spinner className="py-20" />;
  if (!post) return <p className="py-20 text-center text-gray-500">Пост не найден</p>;

  const { extendedLikesInfo } = post.data;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link to={`/blogs/${post.data.blogId}`} className="text-sm text-indigo-600 hover:underline">
          ← {post.data.blogName}
        </Link>
      </div>

      <article className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <time className="mb-2 block text-xs text-gray-400">
          {new Date(post.data.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </time>
        <h1 className="mb-3 text-2xl font-bold text-gray-900">{post.data.title}</h1>
        <p className="mb-4 text-sm font-medium text-gray-500">{post.data.shortDescription}</p>
        <div className="mb-6 whitespace-pre-wrap text-gray-700">{post.data.content}</div>

        {extendedLikesInfo.newestLikes.length > 0 && (
          <div className="mb-4 rounded-lg bg-gray-50 px-4 py-2 text-xs text-gray-500">
            Последние лайки: {extendedLikesInfo.newestLikes.map((l) => l.login).join(', ')}
          </div>
        )}

        <LikeButton
          likesCount={extendedLikesInfo.likesCount}
          dislikesCount={extendedLikesInfo.dislikesCount}
          myStatus={extendedLikesInfo.myStatus}
          onLike={() => handlePostLike(extendedLikesInfo.myStatus, 'Like')}
          onDislike={() => handlePostLike(extendedLikesInfo.myStatus, 'Dislike')}
          disabled={!user || postLikeMutation.isPending}
        />
      </article>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Комментарии {comments && `(${comments.data.totalCount})`}
        </h2>

        {user && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Написать комментарий... (минимум 20 символов)"
              rows={3}
              minLength={20}
              maxLength={300}
              className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{commentText.length}/300</span>
              <Button
                size="sm"
                onClick={() => addCommentMutation.mutate(commentText)}
                isLoading={addCommentMutation.isPending}
                disabled={commentText.length < 20}
              >
                Отправить
              </Button>
            </div>
          </div>
        )}

        {commentsLoading ? (
          <Spinner className="py-10" />
        ) : !comments?.data.items.length ? (
          <p className="py-6 text-center text-sm text-gray-500">Комментариев пока нет</p>
        ) : (
          <div className="flex flex-col gap-3">
            {comments.data.items.map((comment) => (
              <div key={comment.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">
                    {comment.commentatorInfo.userLogin}
                  </span>
                  <time className="text-xs text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString('ru-RU')}
                  </time>
                </div>

                {editingComment?.id === comment.id ? (
                  <div>
                    <textarea
                      value={editingComment.content}
                      onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                      rows={3}
                      className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateCommentMutation.mutate({ commentId: comment.id, content: editingComment.content })}
                        isLoading={updateCommentMutation.isPending}
                        disabled={editingComment.content.length < 20}
                      >
                        Сохранить
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditingComment(null)}>
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mb-3 text-sm text-gray-700">{comment.content}</p>
                )}

                <div className="flex items-center justify-between">
                  <LikeButton
                    likesCount={comment.likesInfo.likesCount}
                    dislikesCount={comment.likesInfo.dislikesCount}
                    myStatus={comment.likesInfo.myStatus}
                    onLike={() => handleCommentLike(comment.id, comment.likesInfo.myStatus, 'Like')}
                    onDislike={() => handleCommentLike(comment.id, comment.likesInfo.myStatus, 'Dislike')}
                    disabled={!user}
                  />

                  {user?.userId === comment.commentatorInfo.userId && !editingComment && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingComment({ id: comment.id, content: comment.content })}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => deleteCommentMutation.mutate(comment.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Удалить
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {comments && (
          <div className="mt-6 flex justify-center">
            <Pagination
              page={commentPage}
              pagesCount={comments.data.pagesCount}
              onPageChange={setCommentPage}
            />
          </div>
        )}
      </section>
    </div>
  );
}
