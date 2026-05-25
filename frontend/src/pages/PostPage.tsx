import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { commentsApi } from '../api/comments';
import { postsApi } from '../api/posts';
import { useAuth } from '../app/providers/AuthProvider';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import { LikeButtons } from '../components/ui/LikeButtons';
import { Pagination } from '../components/ui/Pagination';
import { formatDate } from '../utils/date';
import { getGeneralError } from '../utils/errors';
import type { Comment, LikeStatus, Paginated, Post } from '../types/api';
import '../components/ui/ui.css';

export function PostPage() {
  const { postId } = useParams<{ postId: string }>();
  const { accessToken, isAuthenticated, user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Paginated<Comment> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [newComment, setNewComment] = useState('');
  const [commentError, setCommentError] = useState<string | undefined>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    setError(undefined);
    try {
      const [postData, commentsData] = await Promise.all([
        postsApi.getById(postId, accessToken),
        commentsApi.getByPostId(postId, { pageNumber: page, pageSize }, accessToken),
      ]);
      setPost(postData);
      setComments(commentsData);
    } catch (e) {
      setError(getGeneralError(e));
    } finally {
      setLoading(false);
    }
  }, [postId, page, pageSize, accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePostLike = async (status: LikeStatus) => {
    if (!postId || !accessToken) return;
    try {
      await postsApi.updateLikeStatus(postId, status, accessToken);
      await load();
    } catch (e) {
      setError(getGeneralError(e));
    }
  };

  const handleCommentLike = async (commentId: string, status: LikeStatus) => {
    if (!accessToken) return;
    try {
      await commentsApi.updateLikeStatus(commentId, status, accessToken);
      await load();
    } catch (e) {
      setError(getGeneralError(e));
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId || !accessToken) return;
    setSubmitting(true);
    setCommentError(undefined);
    try {
      await commentsApi.create(postId, newComment, accessToken);
      setNewComment('');
      setPage(1);
      await load();
    } catch (err) {
      setCommentError(getGeneralError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!accessToken) return;
    setSubmitting(true);
    try {
      await commentsApi.update(commentId, editContent, accessToken);
      setEditingId(null);
      await load();
    } catch (err) {
      setCommentError(getGeneralError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!accessToken) return;
    try {
      await commentsApi.remove(commentId, accessToken);
      await load();
    } catch (err) {
      setCommentError(getGeneralError(err));
    }
  };

  return (
    <div className="page">
      {post && (
        <p>
          <Link to={`/blogs/${post.blogId}`}>&larr; Back to {post.blogName}</Link>
        </p>
      )}
      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error-banner">{error}</div>}
      {post && (
        <article className="card">
          <h1 className="page-title">{post.title}</h1>
          <p className="post-meta">
            Blog: <Link to={`/blogs/${post.blogId}`}>{post.blogName}</Link> |{' '}
            {formatDate(post.createdAt)}
          </p>
          <p>
            <strong>{post.shortDescription}</strong>
          </p>
          <div className="post-content">{post.content}</div>
          <LikeButtons
            likesCount={post.extendedLikesInfo.likesCount}
            dislikesCount={post.extendedLikesInfo.dislikesCount}
            myStatus={post.extendedLikesInfo.myStatus}
            disabled={!isAuthenticated}
            onLike={handlePostLike}
          />
          {!isAuthenticated && (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 8 }}>
              <Link to="/login">Sign in</Link> to like this post
            </p>
          )}
        </article>
      )}

      <section style={{ marginTop: 'var(--spacing-xl)' }}>
        <h2>Comments</h2>
        {isAuthenticated ? (
          <form className="card" onSubmit={handleAddComment} style={{ marginBottom: 16 }}>
            <Textarea
              label="Add comment (20–300 characters)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              minLength={20}
              maxLength={300}
              required
            />
            {commentError && <div className="error-banner">{commentError}</div>}
            <Button type="submit" disabled={submitting || newComment.length < 20}>
              Add comment
            </Button>
          </form>
        ) : (
          <p>
            <Link to="/login">Sign in</Link> to leave a comment
          </p>
        )}

        {comments?.items.map((comment) => {
          const isOwner = user?.userId === comment.commentatorInfo.userId;
          const isEditing = editingId === comment.id;

          return (
            <div key={comment.id} className="comment-card">
              <div className="comment-meta">
                {comment.commentatorInfo.userLogin} | {formatDate(comment.createdAt)}
              </div>
              {isEditing ? (
                <>
                  <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                  <div className="comment-actions">
                    <Button
                      size="sm"
                      disabled={submitting || editContent.length < 20}
                      onClick={() => handleUpdateComment(comment.id)}
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <p>{comment.content}</p>
              )}
              <LikeButtons
                likesCount={comment.likesInfo.likesCount}
                dislikesCount={comment.likesInfo.dislikesCount}
                myStatus={comment.likesInfo.myStatus}
                disabled={!isAuthenticated}
                onLike={(status) => handleCommentLike(comment.id, status)}
              />
              {isOwner && !isEditing && (
                <div className="comment-actions">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditContent(comment.content);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {comments && (
          <Pagination
            page={comments.page}
            pageSize={comments.pageSize}
            pagesCount={comments.pagesCount}
            totalCount={comments.totalCount}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
      </section>
    </div>
  );
}
