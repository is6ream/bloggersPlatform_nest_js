import type { LikeStatus } from '../../types/api';
import './ui.css';

type Props = {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
  disabled?: boolean;
  onLike: (status: LikeStatus) => void;
};

export function LikeButtons({
  likesCount,
  dislikesCount,
  myStatus,
  disabled,
  onLike,
}: Props) {
  return (
    <div className="like-buttons">
      <button
        type="button"
        className={`like-btn ${myStatus === 'Like' ? 'active-like' : ''}`}
        disabled={disabled}
        onClick={() => onLike(myStatus === 'Like' ? 'None' : 'Like')}
      >
        +1 ({likesCount})
      </button>
      <button
        type="button"
        className={`like-btn ${myStatus === 'Dislike' ? 'active-dislike' : ''}`}
        disabled={disabled}
        onClick={() => onLike(myStatus === 'Dislike' ? 'None' : 'Dislike')}
      >
        -1 ({dislikesCount})
      </button>
    </div>
  );
}
