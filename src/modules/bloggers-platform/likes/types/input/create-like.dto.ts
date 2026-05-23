import { LikeParentType } from '../like-parent-type';
import { LikeStatus } from '../like-status';

export class CreateLikeDto {
  parentId!: string;
  userId!: string;
  status!: LikeStatus;
  parentType!: LikeParentType;
}
